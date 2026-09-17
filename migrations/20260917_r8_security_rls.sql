-- R8 security hardening. Bootstrap team ownership/membership before applying in production.
-- Requires migrations/20260917_r8_username_password_auth.sql first, because anonymous
-- Supabase Auth users also use the authenticated Postgres role. Every planner-access
-- policy therefore requires public.is_current_coach() in addition to team membership.
alter table teams add column if not exists owner_id uuid references auth.users(id);

create table if not exists team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'coach' check (role in ('coach','admin')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

alter table teams enable row level security;
alter table team_members enable row level security;
alter table rugby_data enable row level security;
alter table players enable row level security;
alter table team_players enable row level security;
alter table active_users enable row level security;
alter table if exists login_history enable row level security;
alter table if exists action_log enable row level security;

-- Remove legacy public policies where they exist.
drop policy if exists "Allow public read access" on teams;
drop policy if exists "Allow public insert access" on teams;
drop policy if exists "Allow public update access" on teams;
drop policy if exists "Allow public delete access" on teams;

drop policy if exists "Allow public read access" on rugby_data;
drop policy if exists "Allow public insert access" on rugby_data;
drop policy if exists "Allow public update access" on rugby_data;
drop policy if exists "Allow public delete access" on rugby_data;

drop policy if exists "Allow public read access" on players;
drop policy if exists "Allow public insert access" on players;
drop policy if exists "Allow public update access" on players;
drop policy if exists "Allow public delete access" on players;

drop policy if exists "Allow public read access" on team_players;
drop policy if exists "Allow public insert access" on team_players;
drop policy if exists "Allow public update access" on team_players;
drop policy if exists "Allow public delete access" on team_players;

drop policy if exists "Allow public read access" on active_users;
drop policy if exists "Allow public insert access" on active_users;
drop policy if exists "Allow public update access" on active_users;
drop policy if exists "Allow public delete access" on active_users;

-- Make this migration safe to re-run.
drop policy if exists team_members_select_own on team_members;
drop policy if exists teams_member_select on teams;
drop policy if exists teams_authenticated_insert on teams;
drop policy if exists team_members_insert_owner on team_members;
drop policy if exists rugby_member_select on rugby_data;
drop policy if exists rugby_member_insert on rugby_data;
drop policy if exists rugby_member_update on rugby_data;
drop policy if exists rugby_admin_delete on rugby_data;
drop policy if exists players_authenticated_select on players;
drop policy if exists players_authenticated_insert on players;
drop policy if exists players_authenticated_update on players;
drop policy if exists team_players_member_all on team_players;
drop policy if exists presence_authenticated_select on active_users;
drop policy if exists presence_authenticated_insert on active_users;
drop policy if exists presence_authenticated_update on active_users;
drop policy if exists presence_authenticated_delete on active_users;

-- Membership itself is not enough: the technical auth session must also have
-- successfully passed coach_login().
create policy team_members_select_own on team_members
  for select to authenticated
  using (public.is_current_coach() and user_id = auth.uid());

create policy teams_member_select on teams
  for select to authenticated
  using (
    public.is_current_coach()
    and (
      owner_id = auth.uid()
      or exists (
        select 1 from team_members tm
        where tm.team_id = teams.id and tm.user_id = auth.uid()
      )
    )
  );

create policy teams_authenticated_insert on teams
  for insert to authenticated
  with check (public.is_current_coach() and owner_id = auth.uid());

create policy team_members_insert_owner on team_members
  for insert to authenticated
  with check (
    public.is_current_coach()
    and user_id = auth.uid()
    and exists (
      select 1 from teams t
      where t.id = team_members.team_id and t.owner_id = auth.uid()
    )
  );

create policy rugby_member_select on rugby_data
  for select to authenticated
  using (
    public.is_current_coach()
    and exists (
      select 1 from team_members tm
      where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()
    )
  );

create policy rugby_member_insert on rugby_data
  for insert to authenticated
  with check (
    public.is_current_coach()
    and exists (
      select 1 from team_members tm
      where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()
    )
  );

create policy rugby_member_update on rugby_data
  for update to authenticated
  using (
    public.is_current_coach()
    and exists (
      select 1 from team_members tm
      where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()
    )
  )
  with check (
    public.is_current_coach()
    and exists (
      select 1 from team_members tm
      where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()
    )
  );

create policy rugby_admin_delete on rugby_data
  for delete to authenticated
  using (
    public.is_current_coach()
    and exists (
      select 1 from team_members tm
      where tm.team_id = rugby_data.team_id
        and tm.user_id = auth.uid()
        and tm.role = 'admin'
    )
  );

-- Players are global records, but data is only visible/editable when the verified
-- coach belongs to at least one team linked to that player.
create policy players_authenticated_select on players
  for select to authenticated
  using (
    public.is_current_coach()
    and exists (
      select 1
      from team_players tp
      join team_members tm on tm.team_id = tp.team_id
      where tp.player_id = players.id
        and tm.user_id = auth.uid()
    )
  );

-- A verified coach may create a player before linking it to team_players.
create policy players_authenticated_insert on players
  for insert to authenticated
  with check (public.is_current_coach());

create policy players_authenticated_update on players
  for update to authenticated
  using (
    public.is_current_coach()
    and exists (
      select 1
      from team_players tp
      join team_members tm on tm.team_id = tp.team_id
      where tp.player_id = players.id
        and tm.user_id = auth.uid()
    )
  )
  with check (
    public.is_current_coach()
    and exists (
      select 1
      from team_players tp
      join team_members tm on tm.team_id = tp.team_id
      where tp.player_id = players.id
        and tm.user_id = auth.uid()
    )
  );

create policy team_players_member_all on team_players
  for all to authenticated
  using (
    public.is_current_coach()
    and exists (
      select 1 from team_members tm
      where tm.team_id = team_players.team_id and tm.user_id = auth.uid()
    )
  )
  with check (
    public.is_current_coach()
    and exists (
      select 1 from team_members tm
      where tm.team_id = team_players.team_id and tm.user_id = auth.uid()
    )
  );

-- Presence is shared only among verified coaches. A fresh anonymous Auth session
-- cannot read or write coach presence information.
create policy presence_authenticated_select on active_users
  for select to authenticated using (public.is_current_coach());
create policy presence_authenticated_insert on active_users
  for insert to authenticated with check (public.is_current_coach());
create policy presence_authenticated_update on active_users
  for update to authenticated using (public.is_current_coach()) with check (public.is_current_coach());
create policy presence_authenticated_delete on active_users
  for delete to authenticated using (public.is_current_coach());

-- Optional audit tables are also restricted to verified coaches, not merely to
-- the authenticated Postgres role (which anonymous Auth sessions also receive).
do $$
begin
  if to_regclass('public.login_history') is not null then
    execute 'drop policy if exists login_history_authenticated_select on login_history';
    execute 'drop policy if exists login_history_authenticated_insert on login_history';
    execute 'create policy login_history_authenticated_select on login_history for select to authenticated using (public.is_current_coach())';
    execute 'create policy login_history_authenticated_insert on login_history for insert to authenticated with check (public.is_current_coach())';
  end if;

  if to_regclass('public.action_log') is not null then
    execute 'drop policy if exists action_log_authenticated_select on action_log';
    execute 'drop policy if exists action_log_authenticated_insert on action_log';
    execute 'create policy action_log_authenticated_select on action_log for select to authenticated using (public.is_current_coach())';
    execute 'create policy action_log_authenticated_insert on action_log for insert to authenticated with check (public.is_current_coach())';
  end if;
end $$;

-- Bootstrap example for EXISTING teams (replace values with real IDs before removing public access):
-- update teams set owner_id = 'AUTH_USER_UUID' where id = 'TEAM_UUID';
-- insert into team_members(team_id, user_id, role)
-- values ('TEAM_UUID', 'AUTH_USER_UUID', 'admin')
-- on conflict (team_id, user_id) do update set role = excluded.role;
