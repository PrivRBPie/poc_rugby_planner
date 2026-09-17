-- R8 security hardening. Bootstrap team ownership/membership before applying in production.
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

-- A user can see their own memberships. Team owners may see the team immediately
-- after INSERT, before their first team_members row has been created.
create policy team_members_select_own on team_members
  for select to authenticated
  using (user_id = auth.uid());

create policy teams_member_select on teams
  for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from team_members tm
      where tm.team_id = teams.id and tm.user_id = auth.uid()
    )
  );

create policy teams_authenticated_insert on teams
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy team_members_insert_owner on team_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from teams t
      where t.id = team_members.team_id and t.owner_id = auth.uid()
    )
  );

create policy rugby_member_select on rugby_data
  for select to authenticated
  using (exists (
    select 1 from team_members tm
    where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()
  ));

create policy rugby_member_insert on rugby_data
  for insert to authenticated
  with check (exists (
    select 1 from team_members tm
    where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()
  ));

create policy rugby_member_update on rugby_data
  for update to authenticated
  using (exists (
    select 1 from team_members tm
    where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from team_members tm
    where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()
  ));

create policy rugby_admin_delete on rugby_data
  for delete to authenticated
  using (exists (
    select 1 from team_members tm
    where tm.team_id = rugby_data.team_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  ));

-- Players are global records, but existing player data is only visible/editable
-- when the signed-in coach belongs to at least one team linked to that player.
-- Inserts remain allowed so a coach can create a player before adding team_players.
create policy players_authenticated_select on players
  for select to authenticated
  using (exists (
    select 1
    from team_players tp
    join team_members tm on tm.team_id = tp.team_id
    where tp.player_id = players.id
      and tm.user_id = auth.uid()
  ));

create policy players_authenticated_insert on players
  for insert to authenticated
  with check (true);

create policy players_authenticated_update on players
  for update to authenticated
  using (exists (
    select 1
    from team_players tp
    join team_members tm on tm.team_id = tp.team_id
    where tp.player_id = players.id
      and tm.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from team_players tp
    join team_members tm on tm.team_id = tp.team_id
    where tp.player_id = players.id
      and tm.user_id = auth.uid()
  ));

create policy team_players_member_all on team_players
  for all to authenticated
  using (exists (
    select 1 from team_members tm
    where tm.team_id = team_players.team_id and tm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from team_members tm
    where tm.team_id = team_players.team_id and tm.user_id = auth.uid()
  ));

-- Presence is shared among signed-in coaches. Sessions are ephemeral and contain no planner data.
create policy presence_authenticated_select on active_users for select to authenticated using (true);
create policy presence_authenticated_insert on active_users for insert to authenticated with check (true);
create policy presence_authenticated_update on active_users for update to authenticated using (true) with check (true);
create policy presence_authenticated_delete on active_users for delete to authenticated using (true);

-- If these optional audit tables exist, keep them away from anonymous clients.
do $$
begin
  if to_regclass('public.login_history') is not null then
    execute 'drop policy if exists login_history_authenticated_select on login_history';
    execute 'drop policy if exists login_history_authenticated_insert on login_history';
    execute 'create policy login_history_authenticated_select on login_history for select to authenticated using (true)';
    execute 'create policy login_history_authenticated_insert on login_history for insert to authenticated with check (true)';
  end if;

  if to_regclass('public.action_log') is not null then
    execute 'drop policy if exists action_log_authenticated_select on action_log';
    execute 'drop policy if exists action_log_authenticated_insert on action_log';
    execute 'create policy action_log_authenticated_select on action_log for select to authenticated using (true)';
    execute 'create policy action_log_authenticated_insert on action_log for insert to authenticated with check (true)';
  end if;
end $$;

-- Bootstrap example for EXISTING teams (replace values with real IDs before removing public access):
-- update teams set owner_id = 'AUTH_USER_UUID' where id = 'TEAM_UUID';
-- insert into team_members(team_id, user_id, role)
-- values ('TEAM_UUID', 'AUTH_USER_UUID', 'admin')
-- on conflict (team_id, user_id) do update set role = excluded.role;
