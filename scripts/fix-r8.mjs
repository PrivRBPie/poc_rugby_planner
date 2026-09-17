import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'src/App.jsx');
let app = fs.readFileSync(appPath, 'utf8');

function replaceRequired(search, replacement, label) {
  const before = app;
  app = app.replace(search, replacement);
  if (app === before) throw new Error(`R8 follow-up failed: ${label}`);
}

// Existing JSX text tripped ESLint's parser.
replaceRequired('If bench > 2: Score = max(0, 10 - (bench - 2) × 3)', 'If bench &gt; 2: Score = max(0, 10 - (bench - 2) × 3)', 'escape JSX greater-than');

// Overview must distinguish explicit bench from not assigned.
replaceRequired(
  `                      } else {\n                        // If not on field, count as bench (includes explicit bench and not assigned)\n                        totalBench++;\n                      }`,
  `                      } else if (assignment?.type === 'bench') {\n                        totalBench++;\n                      }`,
  'explicit bench accounting'
);
replaceRequired(
  `                      if (!assignment) {\n                        // Not assigned = counts as bench\n                        return \`Match ${'${h.matchId}'} H${'${h.half}'}: Bench\`;\n                      }`,
  `                      if (!assignment) {\n                        return \`Match ${'${h.matchId}'} H${'${h.half}'}: Not assigned\`;\n                      }`,
  'unassigned overview label'
);

// Keep the relational player library aligned with the JSON planner snapshot on every save.
replaceRequired(
  `  // Manual save to Supabase\n  const handleSave = async () => {`,
  `  const syncRelationalRoster = async () => {\n    if (!currentTeamId) return;\n    const rows = players.map(player => ({ id: player.id, name: player.name, mini_year: player.miniYear, created_by: currentUsername || 'coach' }));\n    if (rows.length > 0) {\n      const { error: playersError } = await supabase.from('players').upsert(rows, { onConflict: 'id' });\n      if (playersError) throw playersError;\n    }\n    const { data: links, error: linksError } = await supabase.from('team_players').select('player_id').eq('team_id', currentTeamId);\n    if (linksError) throw linksError;\n    const currentIds = new Set(players.map(player => player.id));\n    const linkedIds = new Set((links || []).map(link => link.player_id));\n    const missing = players.filter(player => !linkedIds.has(player.id)).map(player => ({ team_id: currentTeamId, player_id: player.id, added_by: currentUsername || 'coach' }));\n    if (missing.length > 0) {\n      const { error } = await supabase.from('team_players').insert(missing);\n      if (error) throw error;\n    }\n    const removed = [...linkedIds].filter(id => !currentIds.has(id));\n    if (removed.length > 0) {\n      const { error } = await supabase.from('team_players').delete().eq('team_id', currentTeamId).in('player_id', removed);\n      if (error) throw error;\n    }\n  };\n\n  // Manual save to Supabase\n  const handleSave = async () => {`,
  'roster reconciliation helper'
);
replaceRequired(
  `    try {\n      setIsSyncing(true);\n      const data = { players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes };`,
  `    try {\n      setIsSyncing(true);\n      await syncRelationalRoster();\n      const data = { players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes };`,
  'roster reconciliation on save'
);

// Secure team creation: authenticated owner is inserted as admin before team data is created.
replaceRequired(
  /  const createTeam = async \(teamName, teamLogo\) => \{[\s\S]*?\n  \};\n\n  const tabs =/,
  `  const createTeam = async (teamName, teamLogo) => {\n    try {\n      const { data: authData, error: authError } = await supabase.auth.getUser();\n      if (authError || !authData.user) throw authError || new Error('You must be signed in to create a team.');\n\n      const { data: newTeam, error } = await supabase\n        .from('teams')\n        .insert({ name: teamName, logo: teamLogo, created_by: currentUsername || authData.user.email || 'coach', owner_id: authData.user.id })\n        .select()\n        .single();\n      if (error) throw error;\n\n      const { error: memberError } = await supabase.from('team_members').insert({ team_id: newTeam.id, user_id: authData.user.id, role: 'admin' });\n      if (memberError) throw memberError;\n\n      setTeams(prev => [...prev, newTeam]);\n      logAction('create_team', { team_name: teamName, team_logo: teamLogo });\n      await switchTeam(newTeam.id);\n    } catch (err) {\n      console.error('Error creating team:', err);\n      alert(\`Error creating team: ${'${err.message}'}\`);\n    }\n  };\n\n  const tabs =`,
  'secure team creation'
);

// Give coaches a practical per-half attendance editor before making assignments.
const marker = `          <div className="flex gap-3">\n            <div className="flex-1 bg-gradient-to-b from-emerald-600 to-emerald-700 rounded-2xl p-4 shadow-lg">`;
const attendancePanel = `          <details className="mb-3 bg-white rounded-xl border border-gray-200 p-2">\n            <summary className="cursor-pointer text-xs font-semibold text-gray-700">Attendance for this half</summary>\n            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 max-h-52 overflow-auto">\n              {[...players].sort((a, b) => a.name.localeCompare(b.name)).map(player => (\n                <label key={player.id} className="flex items-center justify-between gap-2 text-[10px] border border-gray-100 rounded px-2 py-1">\n                  <span className="truncate">{player.name}</span>\n                  <select\n                    value={getHalfStatus(player.id, selectedPlayday.id, matchId, half)}\n                    onChange={(e) => setHalfAvailability(player.id, selectedPlayday.id, matchId, half, e.target.value)}\n                    className="border border-gray-200 rounded px-1 py-0.5 bg-white"\n                  >\n                    {availabilityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}\n                  </select>\n                </label>\n              ))}\n            </div>\n          </details>\n\n`;
replaceRequired(marker, attendancePanel + marker, 'attendance panel');

// Update satisfaction explanation so it reflects the configurable 50/30/20 model rather than an obsolete 40/30/20/10 formula.
app = app.replace('<span className="font-semibold text-emerald-700">⚽ Field Time</span>', '<span className="font-semibold text-emerald-700">⚽ Playing Time</span>');
app = app.replace('<span className="text-sm font-bold text-emerald-600">40%</span>', '<span className="text-sm font-bold text-emerald-600">{satisfactionWeights.playingTime}%</span>');
app = app.replace('Score = (Field Appearances ÷ Total Halves) × 40', 'Score = max(0, Field Time Ratio - Bench Penalty) × configured weight');
app = app.replace('Example: 4 field appearances in 6 halves = (4/6) × 40 = 26.7 points', 'Bench appearances beyond 2 reduce the playing-time component by 10% each.');
app = app.replace('<span className="text-sm font-bold text-amber-600">30%</span>', '<span className="text-sm font-bold text-amber-600">{satisfactionWeights.fun}%</span>');
app = app.replace('<span className="text-sm font-bold text-emerald-600">20%</span>', '<span className="text-sm font-bold text-emerald-600">{satisfactionWeights.learning}%</span>');
app = app.replace(/\n\s+\{\/\* Bench Fairness \*\/\}[\s\S]*?\n\s+<\/div>\n\s+<\/div>\n\n\s+\{\/\* Total Formula \*\//, '\n                  </div>\n                </div>\n\n                {/* Total Formula */');
app = app.replace('Satisfaction = Field Time + Fun + Learning + Bench Fairness', 'Satisfaction = Playing Time + Fun + Learning');
app = app.replace('Maximum possible score: 100% (40 + 30 + 20 + 10)', 'Configured weights should total 100%.');

fs.writeFileSync(appPath, app);

// Remove obsolete one-off recovery/analysis scripts that fail project lint and are superseded by tests/migrations.
for (const relative of ['recover-players.js', 'fix-player-data.js', 'analyze-bottlenecks.js', 'test-allocation.js', 'test-allocation-v2.js', 'test-allocation-v2-rosa.js']) {
  const file = path.join(root, relative);
  if (fs.existsSync(file)) fs.rmSync(file, { force: true });
}

// Strengthen the generated security migration for team ownership/membership creation.
const migrationPath = path.join(root, 'migrations/20260917_r8_security_rls.sql');
let migration = fs.readFileSync(migrationPath, 'utf8');
migration = migration.replace(
  'create table if not exists team_members (',
  `alter table teams add column if not exists owner_id uuid references auth.users(id);\n\ncreate table if not exists team_members (`
);
migration = migration.replace(
  'create policy teams_authenticated_insert on teams for insert to authenticated with check (true);',
  `create policy teams_authenticated_insert on teams for insert to authenticated with check (owner_id = auth.uid());\ncreate policy team_members_insert_owner on team_members for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from teams t where t.id = team_members.team_id and t.owner_id = auth.uid()));`
);
fs.writeFileSync(migrationPath, migration);

// Actions runners have deprecated Node 20; use the current LTS line for project workflows.
for (const workflow of ['.github/workflows/deploy.yml', '.github/workflows/supabase-keepalive.yml']) {
  const file = path.join(root, workflow);
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8').replaceAll('node-version: 20', 'node-version: 22');
  fs.writeFileSync(file, content);
}

console.log('R8 follow-up fixes applied.');
