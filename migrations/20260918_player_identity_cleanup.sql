-- Rugby Planner: canonical player identity cleanup and duplicate prevention.
-- Apply after 20260917_r8_coach_management.sql.
--
-- Goals:
--   1. Merge known duplicate player IDs into the currently active/canonical ID.
--   2. Preserve team memberships and all known player-scoped rugby_data history.
--   3. Prevent future exact-name duplicates at the database boundary.
--
-- Canonical IDs below were selected from the currently linked player records.
-- Historical team appearances remain in rugby_data; current team membership
-- remains defined by team_players.

begin;

create or replace function public._rugby_map_player_object_keys(
  p_obj jsonb,
  p_old_id integer,
  p_new_id integer,
  p_mode text
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_result jsonb := '{}'::jsonb;
  v_old text := p_old_id::text;
  v_new text := p_new_id::text;
  v_key text;
  v_value jsonb;
  v_new_key text;
  v_is_old boolean;
begin
  if p_obj is null or jsonb_typeof(p_obj) <> 'object' then
    return coalesce(p_obj, '{}'::jsonb);
  end if;

  -- Preserve all non-duplicate/canonical keys first so canonical data wins
  -- whenever both IDs contain the same scoped value.
  for v_key, v_value in select key, value from jsonb_each(p_obj)
  loop
    v_is_old :=
      (p_mode = 'exact' and v_key = v_old)
      or (p_mode = 'prefix' and v_key like v_old || '-%')
      or (
        p_mode = 'availability'
        and (
          v_key = v_old
          or right(v_key, length(v_old) + 1) = ':' || v_old
        )
      );

    if not v_is_old then
      v_result := v_result || jsonb_build_object(v_key, v_value);
    end if;
  end loop;

  -- Bring across old-ID values only when a canonical equivalent does not
  -- already exist.
  for v_key, v_value in select key, value from jsonb_each(p_obj)
  loop
    v_is_old :=
      (p_mode = 'exact' and v_key = v_old)
      or (p_mode = 'prefix' and v_key like v_old || '-%')
      or (
        p_mode = 'availability'
        and (
          v_key = v_old
          or right(v_key, length(v_old) + 1) = ':' || v_old
        )
      );

    if v_is_old then
      if p_mode = 'exact' then
        v_new_key := v_new;
      elsif p_mode = 'prefix' then
        v_new_key := v_new || substring(v_key from length(v_old) + 1);
      elsif v_key = v_old then
        v_new_key := v_new;
      else
        v_new_key := regexp_replace(v_key, ':' || v_old || '$', ':' || v_new);
      end if;

      if not (v_result ? v_new_key) then
        v_result := v_result || jsonb_build_object(v_new_key, v_value);
      end if;
    end if;
  end loop;

  return v_result;
end;
$$;

create or replace function public._rugby_replace_player_in_lineups(
  p_lineups jsonb,
  p_old_id integer,
  p_new_id integer
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_result jsonb := '{}'::jsonb;
  v_lineup_key text;
  v_lineup jsonb;
  v_assignments jsonb;
  v_bench jsonb;
begin
  if p_lineups is null or jsonb_typeof(p_lineups) <> 'object' then
    return coalesce(p_lineups, '{}'::jsonb);
  end if;

  for v_lineup_key, v_lineup in select key, value from jsonb_each(p_lineups)
  loop
    select coalesce(
      jsonb_object_agg(
        a.key,
        case when a.value = to_jsonb(p_old_id) then to_jsonb(p_new_id) else a.value end
      ),
      '{}'::jsonb
    )
    into v_assignments
    from jsonb_each(coalesce(v_lineup->'assignments', '{}'::jsonb)) a;

    select coalesce(
      jsonb_agg(
        case when b.value = to_jsonb(p_old_id) then to_jsonb(p_new_id) else b.value end
        order by b.ordinality
      ),
      '[]'::jsonb
    )
    into v_bench
    from jsonb_array_elements(coalesce(v_lineup->'bench', '[]'::jsonb))
      with ordinality as b(value, ordinality);

    v_lineup := jsonb_set(v_lineup, '{assignments}', v_assignments, true);
    v_lineup := jsonb_set(v_lineup, '{bench}', v_bench, true);
    v_result := v_result || jsonb_build_object(v_lineup_key, v_lineup);
  end loop;

  return v_result;
end;
$$;

create or replace function public._rugby_replace_player_in_roster(
  p_players jsonb,
  p_old_id integer,
  p_new_id integer
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_result jsonb := '[]'::jsonb;
  v_player jsonb;
  v_player_id integer;
  v_has_new boolean := false;
begin
  if p_players is null or jsonb_typeof(p_players) <> 'array' then
    return coalesce(p_players, '[]'::jsonb);
  end if;

  select exists (
    select 1
    from jsonb_array_elements(p_players) p(value)
    where (p.value->>'id') ~ '^[0-9]+$'
      and (p.value->>'id')::integer = p_new_id
  ) into v_has_new;

  for v_player in select value from jsonb_array_elements(p_players)
  loop
    v_player_id := case
      when (v_player->>'id') ~ '^[0-9]+$' then (v_player->>'id')::integer
      else null
    end;

    if v_player_id = p_old_id then
      if not v_has_new then
        v_result := v_result || jsonb_build_array(
          v_player || jsonb_build_object('id', p_new_id)
        );
        v_has_new := true;
      end if;
    else
      v_result := v_result || jsonb_build_array(v_player);
    end if;
  end loop;

  return v_result;
end;
$$;

create or replace function public._rugby_replace_player_in_int_array(
  p_array jsonb,
  p_old_id integer,
  p_new_id integer
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_result jsonb := '[]'::jsonb;
  v_value jsonb;
  v_mapped jsonb;
  v_seen text[] := array[]::text[];
begin
  if p_array is null or jsonb_typeof(p_array) <> 'array' then
    return coalesce(p_array, '[]'::jsonb);
  end if;

  for v_value in select value from jsonb_array_elements(p_array)
  loop
    v_mapped := case
      when v_value = to_jsonb(p_old_id) then to_jsonb(p_new_id)
      else v_value
    end;

    if not (v_mapped::text = any(v_seen)) then
      v_result := v_result || jsonb_build_array(v_mapped);
      v_seen := array_append(v_seen, v_mapped::text);
    end if;
  end loop;

  return v_result;
end;
$$;

create or replace function public._rugby_replace_player_id(
  p_data jsonb,
  p_old_id integer,
  p_new_id integer
)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_data jsonb := coalesce(p_data, '{}'::jsonb);
begin
  v_data := jsonb_set(
    v_data,
    '{players}',
    public._rugby_replace_player_in_roster(v_data->'players', p_old_id, p_new_id),
    true
  );

  v_data := jsonb_set(
    v_data,
    '{lineups}',
    public._rugby_replace_player_in_lineups(v_data->'lineups', p_old_id, p_new_id),
    true
  );

  v_data := jsonb_set(
    v_data,
    '{ratings}',
    public._rugby_map_player_object_keys(v_data->'ratings', p_old_id, p_new_id, 'prefix'),
    true
  );

  v_data := jsonb_set(
    v_data,
    '{training}',
    public._rugby_map_player_object_keys(v_data->'training', p_old_id, p_new_id, 'prefix'),
    true
  );

  v_data := jsonb_set(
    v_data,
    '{suitability}',
    public._rugby_map_player_object_keys(v_data->'suitability', p_old_id, p_new_id, 'prefix'),
    true
  );

  v_data := jsonb_set(
    v_data,
    '{favoritePositions}',
    public._rugby_map_player_object_keys(v_data->'favoritePositions', p_old_id, p_new_id, 'exact'),
    true
  );

  v_data := jsonb_set(
    v_data,
    '{positionPreferences}',
    public._rugby_map_player_object_keys(v_data->'positionPreferences', p_old_id, p_new_id, 'exact'),
    true
  );

  v_data := jsonb_set(
    v_data,
    '{playerNotes}',
    public._rugby_map_player_object_keys(v_data->'playerNotes', p_old_id, p_new_id, 'exact'),
    true
  );

  v_data := jsonb_set(
    v_data,
    '{availability}',
    public._rugby_map_player_object_keys(v_data->'availability', p_old_id, p_new_id, 'availability'),
    true
  );

  v_data := jsonb_set(
    v_data,
    '{inactivePlayerIds}',
    public._rugby_replace_player_in_int_array(v_data->'inactivePlayerIds', p_old_id, p_new_id),
    true
  );

  return v_data;
end;
$$;

-- Merge map is intentionally expressed inline instead of using a TEMP table.
-- Supabase SQL Editor may execute statements with transaction boundaries that
-- cause ON COMMIT DROP temp tables to disappear before later statements run.
do $$
declare
  v_merge record;
begin
  -- Refuse to run if a selected canonical player is missing.
  if exists (
    select 1
    from (
      values
        (13, 10), -- Alexander Jans
        (6, 1),   -- Eick Soe
        (11, 7),  -- Francois Ross
        (9, 4),   -- Huib Schr
        (36, 49), -- Daniel Ras
        (35, 74), -- Julian Pom
        (31, 16), -- Chris Klin / Klink
        (18, 20), -- Hedwig Bong / Bon
        (3, 5),   -- Dries Wage / Wag
        (24, 69), -- Stef Rood / Roo
        (46, 17)  -- Ivan Wal / Wa
    ) as m(old_id, keep_id)
    left join public.players p on p.id = m.keep_id
    where p.id is null
  ) then
    raise exception 'Player identity cleanup aborted: one or more canonical player IDs do not exist.';
  end if;

  for v_merge in
    select *
    from (
      values
        (13, 10),
        (6, 1),
        (11, 7),
        (9, 4),
        (36, 49),
        (35, 74),
        (31, 16),
        (18, 20),
        (3, 5),
        (24, 69),
        (46, 17)
    ) as m(old_id, keep_id)
    order by old_id
  loop
    update public.rugby_data
    set data = public._rugby_replace_player_id(data, v_merge.old_id, v_merge.keep_id)
    where data is not null;
  end loop;
end $$;

-- Carry any current team links from a duplicate ID to its canonical ID.
with merge_map(old_id, keep_id) as (
  values
    (13, 10),
    (6, 1),
    (11, 7),
    (9, 4),
    (36, 49),
    (35, 74),
    (31, 16),
    (18, 20),
    (3, 5),
    (24, 69),
    (46, 17)
)
insert into public.team_players (team_id, player_id, added_at, added_by)
select
  tp.team_id,
  m.keep_id,
  tp.added_at,
  tp.added_by
from public.team_players tp
join merge_map m on m.old_id = tp.player_id
on conflict (team_id, player_id) do nothing;

with merge_map(old_id, keep_id) as (
  values
    (13, 10),
    (6, 1),
    (11, 7),
    (9, 4),
    (36, 49),
    (35, 74),
    (31, 16),
    (18, 20),
    (3, 5),
    (24, 69),
    (46, 17)
)
delete from public.team_players tp
using merge_map m
where tp.player_id = m.old_id;

-- Remove the duplicate global records only after all references have moved.
with merge_map(old_id, keep_id) as (
  values
    (13, 10),
    (6, 1),
    (11, 7),
    (9, 4),
    (36, 49),
    (35, 74),
    (31, 16),
    (18, 20),
    (3, 5),
    (24, 69),
    (46, 17)
)
delete from public.players p
using merge_map m
where p.id = m.old_id;

-- Keep the serial sequence safely above the highest surviving ID.
select setval(
  pg_get_serial_sequence('public.players', 'id'),
  greatest((select coalesce(max(id), 1) from public.players), 1),
  true
);

-- Exact-name creation guard. This is intentionally independent of mini_year:
-- a player's year may change while their identity must remain stable.
create or replace function public.coach_create_or_get_player(
  p_name text,
  p_mini_year text,
  p_created_by text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_normalized_name text;
  v_player public.players%rowtype;
begin
  if not public.is_current_coach() then
    return jsonb_build_object('ok', false, 'error', 'Coach access required.');
  end if;

  if length(v_name) < 2 or length(v_name) > 100 then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid player name.');
  end if;

  if p_mini_year not in ('1st year', '2nd year') then
    return jsonb_build_object('ok', false, 'error', 'Choose a valid mini year.');
  end if;

  v_normalized_name := lower(v_name);

  -- Serialise exact-name creates so two coaches cannot create the same person
  -- in parallel.
  perform pg_advisory_xact_lock(hashtext('rugby-player:' || v_normalized_name));

  select *
    into v_player
  from public.players p
  where lower(regexp_replace(trim(p.name), '\s+', ' ', 'g')) = v_normalized_name
  order by p.id
  limit 1;

  if found then
    return jsonb_build_object(
      'ok', true,
      'existing', true,
      'player', jsonb_build_object(
        'id', v_player.id,
        'name', v_player.name,
        'mini_year', v_player.mini_year
      )
    );
  end if;

  insert into public.players(name, mini_year, created_by)
  values (v_name, p_mini_year, coalesce(nullif(trim(p_created_by), ''), 'coach'))
  returning * into v_player;

  return jsonb_build_object(
    'ok', true,
    'existing', false,
    'player', jsonb_build_object(
      'id', v_player.id,
      'name', v_player.name,
      'mini_year', v_player.mini_year
    )
  );
end;
$$;

revoke all on function public.coach_create_or_get_player(text, text, text) from public, anon;
grant execute on function public.coach_create_or_get_player(text, text, text) to authenticated;

-- Helper functions are migration-only and are removed after the rewrite.
drop function public._rugby_replace_player_id(jsonb, integer, integer);
drop function public._rugby_replace_player_in_int_array(jsonb, integer, integer);
drop function public._rugby_replace_player_in_roster(jsonb, integer, integer);
drop function public._rugby_replace_player_in_lineups(jsonb, integer, integer);
drop function public._rugby_map_player_object_keys(jsonb, integer, integer, text);

-- Verification: should return zero rows for the merged-away IDs.
select id, name, mini_year
from public.players
where id in (13, 6, 11, 9, 36, 35, 31, 18, 3, 24, 46)
order by id;

commit;
