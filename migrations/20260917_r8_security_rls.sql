-- R8 security hardening. Review/bootstrap team_members before applying in production.
alter table teams add column if not exists owner_id uuid references auth.users(id);

create table if not exists team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'coach' check (role in ('coach','admin')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

alter table teams enable row level security;
alter table rugby_data enable row level security;
alter table players enable row level security;
alter table team_players enable row level security;
alter table active_users enable row level security;

drop policy if exists "Allow public read access" on rugby_data;
drop policy if exists "Allow public insert access" on rugby_data;
drop policy if exists "Allow public update access" on rugby_data;
drop policy if exists "Allow public delete access" on rugby_data;

drop policy if exists "Allow public read access" on active_users;
drop policy if exists "Allow public insert access" on active_users;
drop policy if exists "Allow public update access" on active_users;
drop policy if exists "Allow public delete access" on active_users;

create policy team_members_select_own on team_members for select to authenticated using (user_id = auth.uid());
create policy teams_member_select on teams for select to authenticated using (exists (select 1 from team_members tm where tm.team_id = id and tm.user_id = auth.uid()));
create policy teams_authenticated_insert on teams for insert to authenticated with check (owner_id = auth.uid());
create policy team_members_insert_owner on team_members for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from teams t where t.id = team_members.team_id and t.owner_id = auth.uid()));
create policy rugby_member_select on rugby_data for select to authenticated using (exists (select 1 from team_members tm where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()));
create policy rugby_member_insert on rugby_data for insert to authenticated with check (exists (select 1 from team_members tm where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()));
create policy rugby_member_update on rugby_data for update to authenticated using (exists (select 1 from team_members tm where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid())) with check (exists (select 1 from team_members tm where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()));
create policy rugby_admin_delete on rugby_data for delete to authenticated using (exists (select 1 from team_members tm where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid() and tm.role = 'admin'));
create policy players_authenticated_select on players for select to authenticated using (true);
create policy players_authenticated_insert on players for insert to authenticated with check (true);
create policy players_authenticated_update on players for update to authenticated using (true) with check (true);
create policy team_players_member_all on team_players for all to authenticated using (exists (select 1 from team_members tm where tm.team_id = team_players.team_id and tm.user_id = auth.uid())) with check (exists (select 1 from team_members tm where tm.team_id = team_players.team_id and tm.user_id = auth.uid()));
create policy presence_authenticated_select on active_users for select to authenticated using (true);
create policy presence_own_insert on active_users for insert to authenticated with check (true);
create policy presence_own_update on active_users for update to authenticated using (true) with check (true);
create policy presence_own_delete on active_users for delete to authenticated using (true);

-- Bootstrap example (replace values with real IDs before enabling the new policies):
-- insert into team_members(team_id, user_id, role) values ('TEAM_UUID', 'AUTH_USER_UUID', 'admin');
