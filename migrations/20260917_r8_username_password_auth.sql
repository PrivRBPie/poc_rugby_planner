-- Rugby Planner R8: username/password authentication without email or phone PII.
--
-- Design:
--   1. Supabase Auth creates an anonymous technical user (email/phone remain NULL).
--   2. coach_login(username, password) verifies a bcrypt password hash in coach_accounts.
--   3. A successful login maps the anonymous auth.uid() to the coach's team memberships.
--   4. Existing team-based RLS can therefore continue to use team_members + auth.uid().
--
-- Prerequisite: enable Anonymous Sign-Ins in Supabase Authentication settings.
-- Run this migration BEFORE the R8 security/RLS migration.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.coach_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  password_hash text not null,
  disabled boolean not null default false,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coach_accounts_username_format
    check (username = lower(username) and username ~ '^[a-z0-9._-]{3,32}$'),
  constraint coach_accounts_failed_attempts_nonnegative
    check (failed_attempts >= 0)
);

create table if not exists public.coach_team_access (
  coach_id uuid not null references public.coach_accounts(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  role text not null default 'coach' check (role in ('coach', 'admin')),
  created_at timestamptz not null default now(),
  primary key (coach_id, team_id)
);

create table if not exists public.coach_sessions (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  coach_id uuid not null references public.coach_accounts(id) on delete cascade,
  authenticated_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create index if not exists idx_coach_sessions_coach_id
  on public.coach_sessions(coach_id);

alter table public.coach_accounts enable row level security;
alter table public.coach_team_access enable row level security;
alter table public.coach_sessions enable row level security;

-- Credential/session tables are never read directly by browser clients.
revoke all on table public.coach_accounts from anon, authenticated;
revoke all on table public.coach_team_access from anon, authenticated;
revoke all on table public.coach_sessions from anon, authenticated;

create or replace function public.current_coach()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.coach_accounts%rowtype;
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

  return jsonb_build_object(
    'ok', true,
    'coachId', v_account.id,
    'username', v_account.username,
    'displayName', v_account.display_name
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
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Authentication session is unavailable.');
  end if;

  if v_username = '' or p_password is null or length(p_password) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Enter your username and password.');
  end if;

  if length(p_password) > 1024 then
    return jsonb_build_object('ok', false, 'error', 'Invalid username or password.');
  end if;

  select *
    into v_account
  from public.coach_accounts
  where username = v_username
  for update;

  if not found then
    perform pg_sleep(0.35);
    return jsonb_build_object('ok', false, 'error', 'Invalid username or password.');
  end if;

  if v_account.disabled then
    perform pg_sleep(0.35);
    return jsonb_build_object('ok', false, 'error', 'Invalid username or password.');
  end if;

  if v_account.locked_until is not null and v_account.locked_until > now() then
    perform pg_sleep(0.35);
    return jsonb_build_object('ok', false, 'error', 'Too many failed attempts. Try again later.');
  end if;

  if extensions.crypt(p_password, v_account.password_hash) is distinct from v_account.password_hash then
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

  insert into public.coach_sessions (auth_user_id, coach_id, authenticated_at, last_seen)
  values (auth.uid(), v_account.id, now(), now())
  on conflict (auth_user_id)
  do update set
    coach_id = excluded.coach_id,
    authenticated_at = excluded.authenticated_at,
    last_seen = excluded.last_seen;

  -- Remove stale team mappings for this technical auth session.
  delete from public.team_members tm
  where tm.user_id = auth.uid()
    and not exists (
      select 1
      from public.coach_team_access cta
      where cta.coach_id = v_account.id
        and cta.team_id = tm.team_id
    );

  -- Materialize stable coach access into team_members so the normal RLS policies
  -- can continue to use auth.uid() without exposing credential data.
  insert into public.team_members (team_id, user_id, role)
  select cta.team_id, auth.uid(), cta.role
  from public.coach_team_access cta
  where cta.coach_id = v_account.id
  on conflict (team_id, user_id)
  do update set role = excluded.role;

  return jsonb_build_object(
    'ok', true,
    'coachId', v_account.id,
    'username', v_account.username,
    'displayName', v_account.display_name
  );
end;
$$;

create or replace function public.coach_logout()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  delete from public.team_members where user_id = auth.uid();
  delete from public.coach_sessions where auth_user_id = auth.uid();
end;
$$;

-- Keep stable coach/team access in sync when the app creates a team and adds
-- the currently logged-in coach to team_members.
create or replace function public.sync_coach_team_access_from_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid;
begin
  select coach_id
    into v_coach_id
  from public.coach_sessions
  where auth_user_id = new.user_id;

  if v_coach_id is not null then
    insert into public.coach_team_access (coach_id, team_id, role)
    values (v_coach_id, new.team_id, new.role)
    on conflict (coach_id, team_id)
    do update set role = excluded.role;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_coach_team_access on public.team_members;
create trigger trg_sync_coach_team_access
after insert or update of role on public.team_members
for each row execute function public.sync_coach_team_access_from_membership();

revoke all on function public.current_coach() from public, anon;
revoke all on function public.coach_login(text, text) from public, anon;
revoke all on function public.coach_logout() from public, anon;
grant execute on function public.current_coach() to authenticated;
grant execute on function public.coach_login(text, text) to authenticated;
grant execute on function public.coach_logout() to authenticated;

-- One-time bootstrap example (run separately in SQL Editor after this migration):
--
--   insert into public.coach_accounts (username, display_name, password_hash)
--   select 'paul', 'Paul', encrypted_password
--   from auth.users
--   where id = '<existing confirmed auth user id>'
--     and encrypted_password is not null
--   on conflict (username)
--   do update set password_hash = excluded.password_hash,
--                 display_name = excluded.display_name,
--                 updated_at = now();
--
--   insert into public.coach_team_access (coach_id, team_id, role)
--   select ca.id, t.id, 'admin'
--   from public.coach_accounts ca
--   cross join public.teams t
--   where ca.username = 'paul'
--     and t.name in ('Bulls Mini''s', 'Sharks Mini''s')
--   on conflict (coach_id, team_id)
--   do update set role = excluded.role;
--
-- After username login has been tested successfully, the old email-backed Auth
-- user can be removed; it is no longer needed by the planner.
