-- Fix team creation under R8 RLS.
-- Creates teams through an admin-only SECURITY DEFINER RPC and keeps
-- coach_team_access / team_members aligned for new and existing teams.

-- Repair access for any teams that were created before this migration but did not
-- receive materialized membership because the browser-side team_members insert
-- was blocked by RLS.
with coach_roles as (
  select
    ca.id as coach_id,
    case when exists (
      select 1
      from public.coach_team_access cta
      where cta.coach_id = ca.id
        and cta.role = 'admin'
    ) then 'admin' else 'coach' end as role
  from public.coach_accounts ca
  where ca.disabled = false
)
insert into public.coach_team_access (coach_id, team_id, role)
select cr.coach_id, t.id, cr.role
from coach_roles cr
cross join public.teams t
on conflict (coach_id, team_id)
do update set role = excluded.role;

insert into public.team_members (team_id, user_id, role)
select
  cta.team_id,
  cs.auth_user_id,
  cta.role
from public.coach_sessions cs
join public.coach_accounts ca on ca.id = cs.coach_id
join public.coach_team_access cta on cta.coach_id = cs.coach_id
where ca.disabled = false
  and ca.must_set_password = false
on conflict (team_id, user_id)
do update set role = excluded.role;

create or replace function public.admin_create_team(
  p_name text,
  p_logo text default '🐂'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_logo text := trim(coalesce(p_logo, ''));
  v_team public.teams%rowtype;
  v_coach_id uuid;
  v_username text;
begin
  if not public.is_current_admin() then
    return jsonb_build_object('ok', false, 'error', 'Admin access required.');
  end if;

  if length(v_name) < 2 or length(v_name) > 80 then
    return jsonb_build_object('ok', false, 'error', 'Team name must be 2-80 characters.');
  end if;

  if v_logo = '' or length(v_logo) > 16 then
    return jsonb_build_object('ok', false, 'error', 'Choose a valid team logo.');
  end if;

  select cs.coach_id, ca.username
    into v_coach_id, v_username
  from public.coach_sessions cs
  join public.coach_accounts ca on ca.id = cs.coach_id
  where cs.auth_user_id = auth.uid()
    and ca.disabled = false
    and ca.must_set_password = false;

  if v_coach_id is null then
    return jsonb_build_object('ok', false, 'error', 'Coach session is unavailable. Please sign in again.');
  end if;

  insert into public.teams (name, logo, created_by, owner_id)
  values (v_name, v_logo, v_username, auth.uid())
  returning * into v_team;

  -- The current product model gives every approved coach access to every team.
  -- Preserve each coach's global admin/coach role when granting the new team.
  insert into public.coach_team_access (coach_id, team_id, role)
  select
    ca.id,
    v_team.id,
    case when exists (
      select 1
      from public.coach_team_access existing_access
      where existing_access.coach_id = ca.id
        and existing_access.role = 'admin'
    ) then 'admin' else 'coach' end
  from public.coach_accounts ca
  where ca.disabled = false
  on conflict (coach_id, team_id)
  do update set role = excluded.role;

  -- Materialize access for every currently authenticated coach session so RLS
  -- permits immediate use of the new team without requiring a fresh login.
  insert into public.team_members (team_id, user_id, role)
  select
    v_team.id,
    cs.auth_user_id,
    cta.role
  from public.coach_sessions cs
  join public.coach_accounts ca on ca.id = cs.coach_id
  join public.coach_team_access cta
    on cta.coach_id = cs.coach_id
   and cta.team_id = v_team.id
  where ca.disabled = false
    and ca.must_set_password = false
  on conflict (team_id, user_id)
  do update set role = excluded.role;

  return jsonb_build_object(
    'ok', true,
    'team', jsonb_build_object(
      'id', v_team.id,
      'name', v_team.name,
      'logo', v_team.logo,
      'created_at', v_team.created_at,
      'created_by', v_team.created_by,
      'owner_id', v_team.owner_id
    )
  );
end;
$$;

revoke all on function public.admin_create_team(text, text) from public, anon;
grant execute on function public.admin_create_team(text, text) to authenticated;
