-- Admin-only full backup/export and restore for Rugby Planner.
-- Keeps RLS enabled: all cross-team reads/writes happen through SECURITY DEFINER RPCs.
-- Credentials/password hashes and audit/presence tables are deliberately excluded.

begin;

create or replace function public.admin_export_full_backup()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not public.is_current_admin() then
      jsonb_build_object('ok', false, 'error', 'Admin access required.')
    else
      jsonb_build_object(
        'ok', true,
        'exportedAt', now(),
        'database', jsonb_build_object(
          'teams', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', t.id,
                'name', t.name,
                'logo', t.logo,
                'created_at', t.created_at,
                'created_by', t.created_by
              )
              order by t.created_at, t.id
            )
            from public.teams t
          ), '[]'::jsonb),
          'rugby_data', coalesce((
            select jsonb_agg(to_jsonb(rd) order by rd.created_at, rd.id)
            from public.rugby_data rd
          ), '[]'::jsonb),
          'players', coalesce((
            select jsonb_agg(to_jsonb(p) order by p.id)
            from public.players p
          ), '[]'::jsonb),
          'team_players', coalesce((
            select jsonb_agg(to_jsonb(tp) order by tp.id)
            from public.team_players tp
          ), '[]'::jsonb),
          'coach_settings', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'coachId', ca.id,
                'primaryTeamId', ca.primary_team_id,
                'role', public.coach_role(ca.id)
              )
              order by ca.id
            )
            from public.coach_accounts ca
          ), '[]'::jsonb)
        )
      )
  end;
$$;

revoke all on function public.admin_export_full_backup() from public, anon;
grant execute on function public.admin_export_full_backup() to authenticated;

create or replace function public.admin_restore_full_backup(
  p_database jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_coaches jsonb := '{}'::jsonb;
  v_coach record;
  v_backup_setting jsonb;
  v_role text;
  v_primary_team_id uuid;
  v_current_primary_team_id uuid;
  v_fallback_team_id uuid;
  v_team_count integer;
  v_rugby_data_count integer;
  v_player_count integer;
  v_team_player_count integer;
begin
  if not public.is_current_admin() then
    return jsonb_build_object('ok', false, 'error', 'Admin access required.');
  end if;

  if p_database is null or jsonb_typeof(p_database) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'Invalid full backup payload.');
  end if;

  if jsonb_typeof(p_database->'teams') <> 'array'
     or jsonb_typeof(p_database->'rugby_data') <> 'array'
     or jsonb_typeof(p_database->'players') <> 'array'
     or jsonb_typeof(p_database->'team_players') <> 'array'
     or jsonb_typeof(p_database->'coach_settings') <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'This is not a complete R8 full backup.');
  end if;

  if jsonb_array_length(p_database->'teams') < 1 then
    return jsonb_build_object('ok', false, 'error', 'A full backup must contain at least one team.');
  end if;

  -- Preserve current coach role/primary settings as a fallback for coaches
  -- that did not yet exist when an older backup was made.
  select coalesce(
    jsonb_object_agg(
      ca.id::text,
      jsonb_build_object(
        'role', public.coach_role(ca.id),
        'primaryTeamId', ca.primary_team_id
      )
    ),
    '{}'::jsonb
  )
  into v_current_coaches
  from public.coach_accounts ca;

  -- Remove planner data only. Authentication credentials, audit logs and
  -- presence data are intentionally not part of backup/restore.
  delete from public.rugby_data;
  delete from public.team_players;
  delete from public.teams;
  delete from public.players;

  insert into public.teams (id, name, logo, created_at, created_by, owner_id)
  select
    x.id,
    x.name,
    x.logo,
    coalesce(x.created_at, now()),
    x.created_by,
    auth.uid()
  from jsonb_to_recordset(p_database->'teams') as x(
    id uuid,
    name text,
    logo text,
    created_at timestamp,
    created_by text
  );

  insert into public.players (id, name, mini_year, created_at, created_by)
  select
    x.id,
    x.name,
    x.mini_year,
    coalesce(x.created_at, now()),
    x.created_by
  from jsonb_to_recordset(p_database->'players') as x(
    id integer,
    name text,
    mini_year text,
    created_at timestamp,
    created_by text
  );

  insert into public.rugby_data (id, team_name, data, updated_at, created_at, team_id)
  select
    x.id,
    x.team_name,
    coalesce(x.data, '{}'::jsonb),
    coalesce(x.updated_at, now()),
    coalesce(x.created_at, now()),
    x.team_id
  from jsonb_to_recordset(p_database->'rugby_data') as x(
    id uuid,
    team_name text,
    data jsonb,
    updated_at timestamptz,
    created_at timestamptz,
    team_id uuid
  );

  insert into public.team_players (id, team_id, player_id, added_at, added_by)
  select
    x.id,
    x.team_id,
    x.player_id,
    coalesce(x.added_at, now()),
    x.added_by
  from jsonb_to_recordset(p_database->'team_players') as x(
    id integer,
    team_id uuid,
    player_id integer,
    added_at timestamp,
    added_by text
  );

  -- Keep serial sequences ahead of restored IDs.
  perform setval(
    pg_get_serial_sequence('public.players', 'id'),
    greatest((select coalesce(max(id), 1) from public.players), 1),
    true
  );
  perform setval(
    pg_get_serial_sequence('public.team_players', 'id'),
    greatest((select coalesce(max(id), 1) from public.team_players), 1),
    true
  );

  select t.id into v_fallback_team_id
  from public.teams t
  order by t.name, t.id
  limit 1;

  -- Rebuild the current product model: every approved coach has access to all
  -- teams, while each coach keeps their saved/global admin-or-coach role.
  for v_coach in
    select ca.id
    from public.coach_accounts ca
    where ca.disabled = false
    order by ca.id
  loop
    select item
      into v_backup_setting
    from jsonb_array_elements(p_database->'coach_settings') as item
    where item->>'coachId' = v_coach.id::text
    limit 1;

    v_role := coalesce(
      nullif(v_backup_setting->>'role', ''),
      nullif((v_current_coaches -> (v_coach.id::text) ->> 'role'), ''),
      'coach'
    );
    if v_role not in ('admin', 'coach') then
      v_role := 'coach';
    end if;

    insert into public.coach_team_access (coach_id, team_id, role)
    select v_coach.id, t.id, v_role
    from public.teams t
    on conflict (coach_id, team_id)
    do update set role = excluded.role;

    v_primary_team_id := null;
    if nullif(v_backup_setting->>'primaryTeamId', '') is not null then
      begin
        v_primary_team_id := (v_backup_setting->>'primaryTeamId')::uuid;
      exception when others then
        v_primary_team_id := null;
      end;
    end if;

    if v_primary_team_id is null
       or not exists (select 1 from public.teams t where t.id = v_primary_team_id) then
      v_current_primary_team_id := null;
      if nullif((v_current_coaches -> (v_coach.id::text) ->> 'primaryTeamId'), '') is not null then
        begin
          v_current_primary_team_id :=
            ((v_current_coaches -> (v_coach.id::text) ->> 'primaryTeamId'))::uuid;
        exception when others then
          v_current_primary_team_id := null;
        end;
      end if;

      if v_current_primary_team_id is not null
         and exists (select 1 from public.teams t where t.id = v_current_primary_team_id) then
        v_primary_team_id := v_current_primary_team_id;
      else
        v_primary_team_id := v_fallback_team_id;
      end if;
    end if;

    update public.coach_accounts
    set primary_team_id = v_primary_team_id,
        updated_at = now()
    where id = v_coach.id;
  end loop;

  -- Re-materialize RLS membership for all currently authenticated coaches.
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

  select count(*) into v_team_count from public.teams;
  select count(*) into v_rugby_data_count from public.rugby_data;
  select count(*) into v_player_count from public.players;
  select count(*) into v_team_player_count from public.team_players;

  return jsonb_build_object(
    'ok', true,
    'counts', jsonb_build_object(
      'teams', v_team_count,
      'rugbyData', v_rugby_data_count,
      'players', v_player_count,
      'teamPlayers', v_team_player_count
    )
  );
exception
  when others then
    raise;
end;
$$;

revoke all on function public.admin_restore_full_backup(jsonb) from public, anon;
grant execute on function public.admin_restore_full_backup(jsonb) to authenticated;

commit;
