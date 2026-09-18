-- Admin-only team deletion for Rugby Planner.
-- Keeps RLS enabled: deletion is performed through a SECURITY DEFINER RPC.
-- The final remaining team cannot be deleted.

begin;

create or replace function public.admin_delete_team(
  p_team_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.teams%rowtype;
  v_team_count integer;
  v_fallback_team_id uuid;
  v_fallback_team_name text;
begin
  if not public.is_current_admin() then
    return jsonb_build_object('ok', false, 'error', 'Admin access required.');
  end if;

  if p_team_id is null then
    return jsonb_build_object('ok', false, 'error', 'Team is required.');
  end if;

  select *
    into v_team
  from public.teams
  where id = p_team_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Team not found.');
  end if;

  select count(*) into v_team_count from public.teams;
  if v_team_count <= 1 then
    return jsonb_build_object('ok', false, 'error', 'The final remaining team cannot be deleted.');
  end if;

  -- rugby_data predates the team model and its FK is not ON DELETE CASCADE.
  delete from public.rugby_data where team_id = p_team_id;

  -- team_players, team_members and coach_team_access all reference teams with
  -- ON DELETE CASCADE. coach_accounts.primary_team_id uses ON DELETE SET NULL.
  delete from public.teams where id = p_team_id;

  -- Give coaches whose primary team was deleted a deterministic replacement.
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
      select 1
      from public.coach_team_access cta
      where cta.coach_id = ca.id
    );

  select t.id, t.name
    into v_fallback_team_id, v_fallback_team_name
  from public.teams t
  order by t.name, t.id
  limit 1;

  return jsonb_build_object(
    'ok', true,
    'deletedTeamId', p_team_id,
    'deletedTeamName', v_team.name,
    'fallbackTeamId', v_fallback_team_id,
    'fallbackTeamName', v_fallback_team_name
  );
end;
$$;

revoke all on function public.admin_delete_team(uuid) from public, anon;
grant execute on function public.admin_delete_team(uuid) to authenticated;

commit;
