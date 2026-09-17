-- Rugby Planner R8: managed coach accounts, primary team, and first-login password setup.
-- Apply after 20260917_r8_username_password_auth.sql.
--
-- Behaviour:
--   * Approved coaches only; there is no public self-registration.
--   * Every coach receives read/write membership for all existing teams.
--   * primary_team_id only controls the default team shown after login.
--   * New/reset coaches receive a one-time access code and must choose their own password.
--   * Only an admin coach can manage coach accounts.

create extension if not exists pgcrypto with schema extensions;

alter table public.coach_accounts
  add column if not exists primary_team_id uuid references public.teams(id) on delete set null,
  add column if not exists temporary_code_hash text,
  add column if not exists must_set_password boolean not null default false;

-- New coaches do not have a permanent password until first login.
alter table public.coach_accounts alter column password_hash drop not null;

-- Give every existing coach access to every existing team. Preserve admin status if
-- that coach was already an admin for at least one team.
with coach_roles as (
  select ca.id as coach_id,
         case when exists (
           select 1 from public.coach_team_access x
           where x.coach_id = ca.id and x.role = 'admin'
         ) then 'admin' else 'coach' end as role
  from public.coach_accounts ca
)
insert into public.coach_team_access (coach_id, team_id, role)
select cr.coach_id, t.id, cr.role
from coach_roles cr
cross join public.teams t
on conflict (coach_id, team_id)
do update set role = excluded.role;

-- Pick a deterministic primary team for existing accounts that do not yet have one.
update public.coach_accounts ca
set primary_team_id = (
      select cta.team_id
      from public.coach_team_access cta
      join public.teams t on t.id = cta.team_id
      where cta.coach_id = ca.id
      order by t.name, t.id
      limit 1
    ),
    updated_at = now()
where ca.primary_team_id is null
  and exists (
    select 1 from public.coach_team_access cta where cta.coach_id = ca.id
  );

create or replace function public.coach_role(p_coach_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.coach_team_access cta
      where cta.coach_id = p_coach_id and cta.role = 'admin'
    ) then 'admin'
    else 'coach'
  end;
$$;

create or replace function public.is_current_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_current_coach()
    and exists (
      select 1
      from public.coach_sessions cs
      join public.coach_team_access cta on cta.coach_id = cs.coach_id
      where cs.auth_user_id = auth.uid()
        and cta.role = 'admin'
    );
$$;

create or replace function public.coach_materialize_access(p_coach_id uuid, p_auth_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.team_members tm
  where tm.user_id = p_auth_user_id
    and not exists (
      select 1
      from public.coach_team_access cta
      where cta.coach_id = p_coach_id
        and cta.team_id = tm.team_id
    );

  insert into public.team_members (team_id, user_id, role)
  select cta.team_id, p_auth_user_id, cta.role
  from public.coach_team_access cta
  where cta.coach_id = p_coach_id
  on conflict (team_id, user_id)
  do update set role = excluded.role;
end;
$$;

-- A pending first-login/reset session is not allowed through planner RLS until
-- coach_set_password() has completed.
create or replace function public.is_current_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.coach_sessions cs
      join public.coach_accounts ca on ca.id = cs.coach_id
      where cs.auth_user_id = auth.uid()
        and ca.disabled = false
        and ca.must_set_password = false
    );
$$;

create or replace function public.current_coach()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.coach_accounts%rowtype;
  v_role text;
begin
  if auth.uid() is null then
    return null;
  end if;

  select ca.*
    into v_account
  from public.coach_sessions cs
  join public.coach_accounts ca on ca.id = cs.coach_id
  where cs.auth_user_id = auth.uid()
    and ca.disabled = false;

  if not found then
    return null;
  end if;

  update public.coach_sessions
  set last_seen = now()
  where auth_user_id = auth.uid();

  v_role := public.coach_role(v_account.id);

  return jsonb_build_object(
    'ok', true,
    'coachId', v_account.id,
    'username', v_account.username,
    'displayName', v_account.display_name,
    'primaryTeamId', v_account.primary_team_id,
    'role', v_role,
    'mustSetPassword', v_account.must_set_password
  );
end;
$$;

create or replace function public.coach_login(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account public.coach_accounts%rowtype;
  v_username text := lower(trim(coalesce(p_username, '')));
  v_failed integer;
  v_password_ok boolean := false;
  v_role text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Authentication session is unavailable.');
  end if;

  if v_username = '' or p_password is null or length(p_password) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Enter your username and password or access code.');
  end if;

  if length(p_password) > 1024 then
    return jsonb_build_object('ok', false, 'error', 'Invalid username or password.');
  end if;

  select *
    into v_account
  from public.coach_accounts
  where username = v_username
  for update;

  if not found or v_account.disabled then
    perform pg_sleep(0.35);
    return jsonb_build_object('ok', false, 'error', 'Invalid username or password.');
  end if;

  if v_account.locked_until is not null and v_account.locked_until > now() then
    perform pg_sleep(0.35);
    return jsonb_build_object('ok', false, 'error', 'Too many failed attempts. Try again later.');
  end if;

  if v_account.must_set_password then
    v_password_ok := v_account.temporary_code_hash is not null
      and extensions.crypt(p_password, v_account.temporary_code_hash) = v_account.temporary_code_hash;
  else
    v_password_ok := v_account.password_hash is not null
      and extensions.crypt(p_password, v_account.password_hash) = v_account.password_hash;
  end if;

  if not v_password_ok then
    v_failed := case
      when v_account.locked_until is not null and v_account.locked_until <= now() then 1
      else v_account.failed_attempts + 1
    end;

    update public.coach_accounts
    set failed_attempts = case when v_failed >= 5 then 0 else v_failed end,
        locked_until = case when v_failed >= 5 then now() + interval '15 minutes' else null end,
        updated_at = now()
    where id = v_account.id;

    perform pg_sleep(0.35);
    return jsonb_build_object('ok', false, 'error', 'Invalid username or password.');
  end if;

  update public.coach_accounts
  set failed_attempts = 0,
      locked_until = null,
      updated_at = now()
  where id = v_account.id;

  delete from public.team_members where user_id = auth.uid();
  delete from public.coach_sessions where auth_user_id = auth.uid();

  insert into public.coach_sessions (auth_user_id, coach_id, authenticated_at, last_seen)
  values (auth.uid(), v_account.id, now(), now());

  v_role := public.coach_role(v_account.id);

  if v_account.must_set_password then
    return jsonb_build_object(
      'ok', true,
      'coachId', v_account.id,
      'username', v_account.username,
      'displayName', v_account.display_name,
      'primaryTeamId', v_account.primary_team_id,
      'role', v_role,
      'mustSetPassword', true
    );
  end if;

  perform public.coach_materialize_access(v_account.id, auth.uid());

  return jsonb_build_object(
    'ok', true,
    'coachId', v_account.id,
    'username', v_account.username,
    'displayName', v_account.display_name,
    'primaryTeamId', v_account.primary_team_id,
    'role', v_role,
    'mustSetPassword', false
  );
end;
$$;

create or replace function public.coach_set_password(p_new_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_account public.coach_accounts%rowtype;
  v_role text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Authentication session is unavailable.');
  end if;

  if p_new_password is null or length(p_new_password) < 8 then
    return jsonb_build_object('ok', false, 'error', 'Password must contain at least 8 characters.');
  end if;

  if length(p_new_password) > 128 then
    return jsonb_build_object('ok', false, 'error', 'Password is too long.');
  end if;

  select ca.*
    into v_account
  from public.coach_sessions cs
  join public.coach_accounts ca on ca.id = cs.coach_id
  where cs.auth_user_id = auth.uid()
    and ca.disabled = false
  for update of ca;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Coach session is unavailable. Please sign in again.');
  end if;

  if not v_account.must_set_password then
    return jsonb_build_object('ok', false, 'error', 'This account is not awaiting password setup.');
  end if;

  update public.coach_accounts
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      temporary_code_hash = null,
      must_set_password = false,
      failed_attempts = 0,
      locked_until = null,
      updated_at = now()
  where id = v_account.id;

  perform public.coach_materialize_access(v_account.id, auth.uid());
  v_role := public.coach_role(v_account.id);

  return jsonb_build_object(
    'ok', true,
    'coachId', v_account.id,
    'username', v_account.username,
    'displayName', v_account.display_name,
    'primaryTeamId', v_account.primary_team_id,
    'role', v_role,
    'mustSetPassword', false
  );
end;
$$;

create or replace function public.admin_list_coaches()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_current_admin() then
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'coachId', ca.id,
          'username', ca.username,
          'displayName', ca.display_name,
          'primaryTeamId', ca.primary_team_id,
          'primaryTeamName', pt.name,
          'role', public.coach_role(ca.id),
          'disabled', ca.disabled,
          'mustSetPassword', ca.must_set_password,
          'createdAt', ca.created_at
        ) order by ca.display_name, ca.username
      )
      from public.coach_accounts ca
      left join public.teams pt on pt.id = ca.primary_team_id
    ), '[]'::jsonb)
  else jsonb_build_object('error', 'Admin access required.') end;
$$;

create or replace function public.admin_create_coach(
  p_username text,
  p_display_name text,
  p_primary_team_id uuid,
  p_role text default 'coach'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_username text := lower(trim(coalesce(p_username, '')));
  v_display_name text := trim(coalesce(p_display_name, ''));
  v_role text := lower(trim(coalesce(p_role, 'coach')));
  v_coach_id uuid;
  v_access_code text;
begin
  if not public.is_current_admin() then
    return jsonb_build_object('ok', false, 'error', 'Admin access required.');
  end if;

  if v_username !~ '^[a-z0-9._-]{3,32}$' then
    return jsonb_build_object('ok', false, 'error', 'Username must be 3-32 characters using lowercase letters, numbers, dot, dash or underscore.');
  end if;

  if length(v_display_name) < 2 or length(v_display_name) > 80 then
    return jsonb_build_object('ok', false, 'error', 'Enter a display name.');
  end if;

  if v_role not in ('coach', 'admin') then
    return jsonb_build_object('ok', false, 'error', 'Role must be coach or admin.');
  end if;

  if not exists (select 1 from public.teams where id = p_primary_team_id) then
    return jsonb_build_object('ok', false, 'error', 'Choose a valid primary team.');
  end if;

  if exists (select 1 from public.coach_accounts where username = v_username) then
    return jsonb_build_object('ok', false, 'error', 'That username already exists.');
  end if;

  v_access_code := 'RUGBY-' || upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));

  insert into public.coach_accounts (
    username, display_name, password_hash, primary_team_id,
    temporary_code_hash, must_set_password
  ) values (
    v_username, v_display_name, null, p_primary_team_id,
    extensions.crypt(v_access_code, extensions.gen_salt('bf')), true
  ) returning id into v_coach_id;

  insert into public.coach_team_access (coach_id, team_id, role)
  select v_coach_id, t.id, v_role
  from public.teams t
  on conflict (coach_id, team_id)
  do update set role = excluded.role;

  return jsonb_build_object(
    'ok', true,
    'coachId', v_coach_id,
    'username', v_username,
    'displayName', v_display_name,
    'primaryTeamId', p_primary_team_id,
    'role', v_role,
    'accessCode', v_access_code
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'That username already exists.');
end;
$$;

create or replace function public.admin_update_coach(
  p_coach_id uuid,
  p_display_name text,
  p_primary_team_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text := trim(coalesce(p_display_name, ''));
  v_role text := lower(trim(coalesce(p_role, 'coach')));
  v_current_coach_id uuid;
begin
  if not public.is_current_admin() then
    return jsonb_build_object('ok', false, 'error', 'Admin access required.');
  end if;

  select coach_id into v_current_coach_id
  from public.coach_sessions where auth_user_id = auth.uid();

  if length(v_display_name) < 2 or length(v_display_name) > 80 then
    return jsonb_build_object('ok', false, 'error', 'Enter a display name.');
  end if;

  if v_role not in ('coach', 'admin') then
    return jsonb_build_object('ok', false, 'error', 'Role must be coach or admin.');
  end if;

  if not exists (select 1 from public.teams where id = p_primary_team_id) then
    return jsonb_build_object('ok', false, 'error', 'Choose a valid primary team.');
  end if;

  if p_coach_id = v_current_coach_id and v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'error', 'You cannot remove your own admin role.');
  end if;

  update public.coach_accounts
  set display_name = v_display_name,
      primary_team_id = p_primary_team_id,
      updated_at = now()
  where id = p_coach_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Coach not found.');
  end if;

  insert into public.coach_team_access (coach_id, team_id, role)
  select p_coach_id, t.id, v_role
  from public.teams t
  on conflict (coach_id, team_id)
  do update set role = excluded.role;

  update public.team_members tm
  set role = v_role
  where tm.user_id in (
    select cs.auth_user_id from public.coach_sessions cs where cs.coach_id = p_coach_id
  );

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_reset_coach_access(p_coach_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_access_code text;
  v_current_coach_id uuid;
begin
  if not public.is_current_admin() then
    return jsonb_build_object('ok', false, 'error', 'Admin access required.');
  end if;

  select coach_id into v_current_coach_id
  from public.coach_sessions where auth_user_id = auth.uid();

  if p_coach_id = v_current_coach_id then
    return jsonb_build_object('ok', false, 'error', 'You cannot reset your own active admin session here.');
  end if;

  if not exists (select 1 from public.coach_accounts where id = p_coach_id and disabled = false) then
    return jsonb_build_object('ok', false, 'error', 'Active coach not found.');
  end if;

  v_access_code := 'RUGBY-' || upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));

  delete from public.team_members tm
  where tm.user_id in (
    select cs.auth_user_id from public.coach_sessions cs where cs.coach_id = p_coach_id
  );
  delete from public.coach_sessions where coach_id = p_coach_id;

  update public.coach_accounts
  set password_hash = null,
      temporary_code_hash = extensions.crypt(v_access_code, extensions.gen_salt('bf')),
      must_set_password = true,
      failed_attempts = 0,
      locked_until = null,
      updated_at = now()
  where id = p_coach_id;

  return jsonb_build_object('ok', true, 'accessCode', v_access_code);
end;
$$;

create or replace function public.admin_set_coach_disabled(p_coach_id uuid, p_disabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_coach_id uuid;
begin
  if not public.is_current_admin() then
    return jsonb_build_object('ok', false, 'error', 'Admin access required.');
  end if;

  select coach_id into v_current_coach_id
  from public.coach_sessions where auth_user_id = auth.uid();

  if p_coach_id = v_current_coach_id and p_disabled then
    return jsonb_build_object('ok', false, 'error', 'You cannot disable your own active admin account.');
  end if;

  if p_disabled then
    delete from public.team_members tm
    where tm.user_id in (
      select cs.auth_user_id from public.coach_sessions cs where cs.coach_id = p_coach_id
    );
    delete from public.coach_sessions where coach_id = p_coach_id;
  end if;

  update public.coach_accounts
  set disabled = p_disabled, updated_at = now()
  where id = p_coach_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Coach not found.');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_remove_coach(p_coach_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_coach_id uuid;
begin
  if not public.is_current_admin() then
    return jsonb_build_object('ok', false, 'error', 'Admin access required.');
  end if;

  select coach_id into v_current_coach_id
  from public.coach_sessions where auth_user_id = auth.uid();

  if p_coach_id = v_current_coach_id then
    return jsonb_build_object('ok', false, 'error', 'You cannot remove your own active admin account.');
  end if;

  delete from public.team_members tm
  where tm.user_id in (
    select cs.auth_user_id from public.coach_sessions cs where cs.coach_id = p_coach_id
  );
  delete from public.coach_sessions where coach_id = p_coach_id;
  delete from public.coach_accounts where id = p_coach_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Coach not found.');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.coach_role(uuid) from public, anon, authenticated;
revoke all on function public.is_current_admin() from public, anon;
revoke all on function public.coach_materialize_access(uuid, uuid) from public, anon, authenticated;
revoke all on function public.current_coach() from public, anon;
revoke all on function public.coach_login(text, text) from public, anon;
revoke all on function public.coach_set_password(text) from public, anon;
revoke all on function public.admin_list_coaches() from public, anon;
revoke all on function public.admin_create_coach(text, text, uuid, text) from public, anon;
revoke all on function public.admin_update_coach(uuid, text, uuid, text) from public, anon;
revoke all on function public.admin_reset_coach_access(uuid) from public, anon;
revoke all on function public.admin_set_coach_disabled(uuid, boolean) from public, anon;
revoke all on function public.admin_remove_coach(uuid) from public, anon;

grant execute on function public.is_current_admin() to authenticated;
grant execute on function public.current_coach() to authenticated;
grant execute on function public.coach_login(text, text) to authenticated;
grant execute on function public.coach_set_password(text) to authenticated;
grant execute on function public.admin_list_coaches() to authenticated;
grant execute on function public.admin_create_coach(text, text, uuid, text) to authenticated;
grant execute on function public.admin_update_coach(uuid, text, uuid, text) to authenticated;
grant execute on function public.admin_reset_coach_access(uuid) to authenticated;
grant execute on function public.admin_set_coach_disabled(uuid, boolean) to authenticated;
grant execute on function public.admin_remove_coach(uuid) to authenticated;
