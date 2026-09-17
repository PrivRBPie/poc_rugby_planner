import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'src/App.jsx');
let app = fs.readFileSync(appPath, 'utf8');

function replaceRequired(search, replacement, label) {
  const before = app;
  app = app.replace(search, replacement);
  if (app === before) throw new Error(`R8 patch failed: ${label}`);
}

function replaceAllRequired(search, replacement, label) {
  const before = app;
  app = app.replaceAll(search, replacement);
  if (app === before) throw new Error(`R8 patch failed: ${label}`);
}

// Version + shared domain/offline helpers.
replaceRequired("const APP_VERSION = '1.0.1';", "const APP_VERSION = '2.0.0-r8';", 'version');
replaceRequired(
  "import * as XLSX from 'xlsx';",
  "import * as XLSX from 'xlsx';\nimport { availabilityKey, getAvailabilityStatus, isEligibleForHalf, getDynamicBenchSize, cleanupLineupsForPlayday, cleanupLineupsForMatch, getHistoryRange, validateAssignment } from './domain/planner';\nimport { loadOfflineSnapshot, saveOfflineSnapshot } from './offlineStore';",
  'domain imports'
);

replaceRequired(
  /const availabilityOptions = \[[\s\S]*?\n\];/,
  `const availabilityOptions = [\n  { value: 'available', label: 'Available', icon: '✓', color: '#059669', bg: '#d1fae5' },\n  { value: 'train-only', label: 'Train Only', icon: '◐', color: '#ca8a04', bg: '#fef9c3' },\n  { value: 'injured', label: 'Injured', icon: '✚', color: '#b91c1c', bg: '#fee2e2' },\n  { value: 'absent', label: 'Absent', icon: '○', color: '#6b7280', bg: '#f3f4f6' },\n  { value: 'not-selected', label: 'Not selected', icon: '–', color: '#7c3aed', bg: '#ede9fe' },\n  { value: 'unavailable', label: 'Unavailable', icon: '✕', color: '#dc2626', bg: '#fee2e2' },\n];`,
  'availability options'
);

// Fix the form-reset bug: nested component function identities change on every parent render.
// Calling the view render functions directly lets React reconcile the returned tree instead of remounting it.
for (const [name, tab] of [
  ['ScheduleView', 'schedule'], ['SquadView', 'squad'], ['AnalyticsView', 'analytics'],
  ['LineupView', 'lineup'], ['OverviewView', 'overview'], ['RulesView', 'rules'], ['AdminView', 'admin']
]) {
  replaceRequired(`{activeTab === '${tab}' && <${name} />}`, `{activeTab === '${tab}' && ${name}()}`, `stable render ${name}`);
}

// Fix undefined variable in team creation.
replaceAllRequired("created_by: username || 'anonymous'", "created_by: currentUsername || 'anonymous'", 'create team username');

// New teams must use the same rules-array shape as existing teams.
replaceRequired(
  /allocationRules: \{\n\s+game: \{\n\s+enabled: true,[\s\S]*?enableLearning: false\n\s+\}\n\s+\},\n\s+availability: \{\}/,
  `allocationRules: JSON.parse(JSON.stringify(allocationRules)),\n          availability: {},\n          learningPlayerConfig: { ...learningPlayerConfig },\n          satisfactionWeights: { ...satisfactionWeights },\n          playerNotes: {}`,
  'new team rule shape'
);

// Persist all user-configurable state. Previously these settings could show Saved and disappear on refresh.
replaceRequired(
  'const data = { players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability };',
  'const data = { players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes };',
  'save complete data'
);

// Load the newly persisted settings in each data-loading path.
replaceAllRequired(
  'setAvailability(rugbyData.availability || {});',
  `setAvailability(rugbyData.availability || {});\n            setLearningPlayerConfig(rugbyData.learningPlayerConfig || { maxStars: 2, maxGames: 5 });\n            setSatisfactionWeights(rugbyData.satisfactionWeights || { playingTime: 50, fun: 30, learning: 20 });\n            setPlayerNotes(rugbyData.playerNotes || {});`,
  'legacy load extra settings'
);
replaceRequired(
  'setAvailability(newAvailability);',
  `setAvailability(newAvailability);\n        setLearningPlayerConfig(rugbyData.learningPlayerConfig || { maxStars: 2, maxGames: 5 });\n        setSatisfactionWeights(rugbyData.satisfactionWeights || { playingTime: 50, fun: 30, learning: 20 });\n        setPlayerNotes(rugbyData.playerNotes || {});`,
  'refresh load extra settings'
);
replaceRequired(
  'setAvailability(rugbyData.data.availability || {});',
  `setAvailability(rugbyData.data.availability || {});\n        setLearningPlayerConfig(rugbyData.data.learningPlayerConfig || { maxStars: 2, maxGames: 5 });\n        setSatisfactionWeights(rugbyData.data.satisfactionWeights || { playingTime: 50, fun: 30, learning: 20 });\n        setPlayerNotes(rugbyData.data.playerNotes || {});`,
  'team load extra settings'
);

// Track notes in unsaved-change detection and snapshots.
replaceAllRequired(
  'satisfactionWeights: JSON.stringify(satisfactionWeights),',
  `satisfactionWeights: JSON.stringify(satisfactionWeights),\n              playerNotes: JSON.stringify(playerNotes),`,
  'snapshot notes'
);
replaceRequired(
  '}, [players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, hasLoaded, initialState]);',
  '}, [players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes, hasLoaded, initialState]);',
  'change detection deps'
);

// Per-half availability with backward-compatible player-level defaults.
replaceRequired(
  `  const availablePlayers = useMemo(() => {\n    return players.filter(p => {\n      const status = availability[p.id] || 'available';\n      return status === 'available' || status === 'train-only';\n    });\n  }, [players, availability]);`,
  `  const availablePlayers = useMemo(() => {\n    return players.filter(p => {\n      const status = availability[p.id] || 'available';\n      return status === 'available' || status === 'train-only';\n    });\n  }, [players, availability]);\n\n  const getHalfStatus = (playerId, playdayId, matchId, half) =>\n    getAvailabilityStatus(availability, playerId, playdayId, matchId, half);\n\n  const getEligiblePlayersForHalf = (playdayId, matchId, half, mode = 'game') =>\n    players.filter(player => isEligibleForHalf(getHalfStatus(player.id, playdayId, matchId, half), mode));\n\n  const setHalfAvailability = (playerId, playdayId, matchId, half, status) => {\n    setAvailability(prev => ({ ...prev, [availabilityKey(playdayId, matchId, half, playerId)]: status }));\n  };`,
  'per half availability helpers'
);

replaceRequired('return availablePlayers.map(p => {', "return getEligiblePlayersForHalf(playdayId, matchId, half, allocationMode).map(p => {", 'candidate half eligibility');

// Dynamic bench: remove fixed cap and render/export actual bench counts.
replaceRequired('  const BENCH_SIZE = 8;\n', '', 'remove fixed bench constant');
replaceRequired(
  `    for (let i = 0; i < BENCH_SIZE; i++) {`,
  `    const maxBenchSize = Math.max(0, ...matchLineups.flatMap(({ half1, half2 }) => [half1.bench?.length || 0, half2.bench?.length || 0]));\n    for (let i = 0; i < maxBenchSize; i++) {`,
  'dynamic excel bench'
);
replaceAllRequired(
  `Array.from({ length: BENCH_SIZE })`,
  `Array.from({ length: getDynamicBenchSize(getEligiblePlayersForHalf(selectedPlayday.id, matchId, half, selectedPlayday.type === 'training' ? 'training' : 'game').length, positions.length) })`,
  'dynamic rendered bench'
);
replaceRequired(
  `if (isBench) { if (newBench.length < BENCH_SIZE) newBench.push(playerId); }`,
  `if (isBench) { if (!newBench.includes(playerId)) newBench.push(playerId); }`,
  'remove manual bench cap'
);

// Correct Fair PlayTime normalization: Math.min(...values, 0) forced the minimum to zero.
replaceRequired(
  `const maxField = Math.max(...Object.values(effectiveFieldHistory), 1);\n          const minField = Math.min(...Object.values(effectiveFieldHistory), 0);`,
  `const { min: minField, max: maxField } = getHistoryRange(effectiveFieldHistory);`,
  'fairness min/max'
);

// Deleting schedule items must also delete their hidden lineup history.
replaceRequired(
  /  const deletePlayday = \(id\) => \{[\s\S]*?\n  \};\n\n  const addMatch/,
  `  const deletePlayday = (id) => {\n    if (playdays.length <= 1) return;\n    setPlaydays(playdays.filter(p => p.id !== id));\n    setLineups(prev => cleanupLineupsForPlayday(prev, id));\n    if (selectedPlaydayId === id) setSelectedPlaydayId(playdays.find(p => p.id !== id)?.id || 1);\n  };\n\n  const addMatch`,
  'playday cascade cleanup'
);
replaceRequired(
  /  const deleteMatch = \(matchId\) => \{[\s\S]*?\n  \};\n\n  const updatePlaydayName/,
  `  const deleteMatch = (matchId) => {\n    setPlaydays(playdays.map(p => p.id !== selectedPlaydayId ? p : { ...p, matches: p.matches.filter(m => m.id !== matchId) }));\n    setLineups(prev => cleanupLineupsForMatch(prev, selectedPlaydayId, matchId));\n  };\n\n  const updatePlaydayName`,
  'match cascade cleanup'
);

// Manual edits use the same hard-rule checks; invalid changes require an explicit coach override reason.
replaceRequired(
  `    updateLineup(playdayId, matchId, half, (prev) => {`,
  `    if (!isBench) {\n      const status = getHalfStatus(playerId, playdayId, matchId, half);\n      const trainedForPosition = training[\`${'${playerId}-${posId}'}\`] || false;\n      const violations = validateAssignment({\n        status,\n        mode: selectedPlayday?.type === 'training' ? 'training' : 'game',\n        trained: trainedForPosition,\n        duplicate: false,\n      });\n      if (violations.length > 0) {\n        const reason = window.prompt(\`Coach override required:\\n\\n${'${violations.join("\\n")}'}\\n\\nEnter an override reason to continue, or Cancel to stop.\`);\n        if (!reason?.trim()) return;\n        logAction('coach_override', { player_id: playerId, position_id: posId, playday_id: playdayId, match_id: matchId, half, reason: reason.trim(), violations });\n      }\n    }\n\n    updateLineup(playdayId, matchId, half, (prev) => {`,
  'manual hard-rule validation'
);

// Avoid counting the lineup being regenerated as its own history.
replaceRequired(
  `    Object.entries(lineups).forEach(([key, lineup]) => {\n      const [lpId, lmId, lhalf] = key.split('-').map(Number);\n      // Only count lineups from the current playday\n      if (lpId === playdayId) {`,
  `    const targetLineupKey = \`${'${playdayId}-${matchId}-${half}'}\`;\n    Object.entries(lineups).forEach(([key, lineup]) => {\n      const [lpId] = key.split('-').map(Number);\n      // Only count other lineups from the current playday; never count the target being regenerated.\n      if (lpId === playdayId && key !== targetLineupKey) {`,
  'exclude regenerated half from history'
);

// Single-half auto-propose must use per-half eligibility consistently.
replaceRequired(
  `  const proposeLineup = (playdayId, matchId, half, mode = allocationMode) => {\n    const assigned = new Set();`,
  `  const proposeLineup = (playdayId, matchId, half, mode = allocationMode) => {\n    const eligiblePlayers = getEligiblePlayersForHalf(playdayId, matchId, half, mode);\n    const assigned = new Set();`,
  'eligible players in single propose'
);
// Limit replacements to the proposeLineup block.
{
  const start = app.indexOf('  const proposeLineup =');
  const end = app.indexOf('  // Auto-propose all halves', start);
  if (start < 0 || end < 0) throw new Error('R8 patch failed: proposeLineup boundaries');
  const block = app.slice(start, end).replaceAll('availablePlayers', 'eligiblePlayers');
  app = app.slice(0, start) + block + app.slice(end);
}

// Replace full-day allocator so each half can have different attendance.
replaceRequired(
  /  const proposeFullDay = \(playdayId, mode = allocationMode\) => \{[\s\S]*?\n  \};\n\n  const handleAssignPlayer/,
  `  const proposeFullDay = (playdayId, mode = allocationMode) => {\n    if (!selectedPlayday) return;\n\n    const halves = selectedPlayday.matches.flatMap(m => [\n      { matchId: m.id, half: 1 },\n      { matchId: m.id, half: 2 },\n    ]);\n    const activeRules = allocationRules[mode] || [];\n    const fieldCounts = Object.fromEntries(players.map(p => [p.id, 0]));\n    const benchCounts = Object.fromEntries(players.map(p => [p.id, 0]));\n    const newLineupsForDay = {};\n    const newExplanationsForDay = {};\n\n    halves.forEach(({ matchId, half }) => {\n      const eligible = getEligiblePlayersForHalf(playdayId, matchId, half, mode);\n      const totalSlotsForDay = halves.reduce((sum, h) => sum + Math.min(positions.length, getEligiblePlayersForHalf(playdayId, h.matchId, h.half, mode).length), 0);\n      const target = eligible.length > 0 ? totalSlotsForDay / Math.max(1, players.filter(p => halves.some(h => getEligiblePlayersForHalf(playdayId, h.matchId, h.half, mode).some(ep => ep.id === p.id))).length) : 0;\n      const candidates = [];\n\n      positions.forEach(pos => {\n        eligible.forEach(player => {\n          const fairPlayTimeContext = { totalPositions: positions.length, totalHalves: halves.length, availablePlayersCount: Math.max(1, eligible.length) };\n          const { score: baseScore, explanations } = calculatePlayerPositionScore(player, pos, new Set(), activeRules, mode, fieldCounts, benchCounts, fairPlayTimeContext);\n          if (baseScore === -Infinity) return;\n          const fairnessComponent = (target - (fieldCounts[player.id] || 0)) * 40;\n          candidates.push({ player, pos, score: baseScore + fairnessComponent, baseScore, explanations });\n        });\n      });\n\n      candidates.sort((a, b) => b.score - a.score);\n      const assignments = {};\n      const assignedPlayers = new Set();\n      const assignedPositions = new Set();\n      const explanationsMap = {};\n\n      for (const candidate of candidates) {\n        if (assignedPlayers.has(candidate.player.id) || assignedPositions.has(candidate.pos.id)) continue;\n        assignments[candidate.pos.id] = candidate.player.id;\n        assignedPlayers.add(candidate.player.id);\n        assignedPositions.add(candidate.pos.id);\n        fieldCounts[candidate.player.id] = (fieldCounts[candidate.player.id] || 0) + 1;\n        explanationsMap[\`${'${candidate.pos.id}-${candidate.player.id}'}\`] = { position: candidate.pos, player: candidate.player, score: candidate.baseScore, explanations: candidate.explanations };\n        if (assignedPositions.size >= Math.min(positions.length, eligible.length)) break;\n      }\n\n      const bench = eligible\n        .filter(p => !assignedPlayers.has(p.id))\n        .sort((a, b) => (benchCounts[a.id] || 0) - (benchCounts[b.id] || 0) || (fieldCounts[b.id] || 0) - (fieldCounts[a.id] || 0))\n        .map(p => p.id);\n      bench.forEach(id => { benchCounts[id] = (benchCounts[id] || 0) + 1; });\n\n      const key = \`${'${playdayId}-${matchId}-${half}'}\`;\n      newLineupsForDay[key] = { assignments, bench };\n      newExplanationsForDay[key] = explanationsMap;\n    });\n\n    setLineups(prev => ({ ...prev, ...newLineupsForDay }));\n    setAllocationExplanations(prev => ({ ...prev, ...newExplanationsForDay }));\n    const playday = playdays.find(pd => pd.id === playdayId);\n    logAction('auto_propose_full_day', { playday: playday?.name, mode, halvesCount: halves.length, matchesCount: selectedPlayday.matches.length });\n  };\n\n  const handleAssignPlayer`,
  'full day allocator'
);

// Optimistic concurrency: the save succeeds only if updated_at is still the version we loaded.
replaceRequired(
  `.eq('team_id', currentTeamId)\n        .select()\n        .single();`,
  `.eq('team_id', currentTeamId)\n        .eq('updated_at', remoteUpdatedAt)\n        .select()\n        .maybeSingle();`,
  'optimistic save predicate'
);
replaceRequired(
  `      if (error) {\n        console.error('Error saving to Supabase:', error);\n        alert('Error saving data: ' + error.message);\n      } else {`,
  `      if (error) {\n        console.error('Error saving to Supabase:', error);\n        alert('Error saving data: ' + error.message);\n      } else if (!updatedData) {\n        setHasRemoteChanges(true);\n        alert('Another coach saved changes before you. Your local edits are still intact. Click Updates to review the remote version before saving again.');\n      } else {`,
  'optimistic conflict handling'
);

// Ensure remote-change checks follow the selected team and never cause form remounts.
replaceRequired('  }, [rugbyDataId, remoteUpdatedAt]);', '  }, [rugbyDataId, remoteUpdatedAt, currentTeamId]);', 'remote effect deps');
replaceAllRequired('window.location.reload(true)', 'window.location.reload()', 'modern reload');

// Duplicate remove-player audit entry.
replaceRequired(
  `\n    logAction('remove_player', { player_name: player.name, player_id: playerId });\n  };\n\n  // Load all players`,
  `\n  };\n\n  // Load all players`,
  'duplicate remove log'
);

// Add half-specific availability controls to the selected-player stats panel.
replaceRequired(
  `<div className="text-[9px] text-gray-600 space-y-0.5">\n                            <div>Field: {playdayField} | Bench: {playdayBench}</div>`,
  `<div className="text-[9px] text-gray-600 space-y-0.5">\n                            <div>Field: {playdayField} | Bench: {playdayBench}</div>\n                            <div className="pt-1">\n                              <select\n                                value={getHalfStatus(currentPlayerId, selectedPlayday.id, matchId, half)}\n                                onChange={(e) => setHalfAvailability(currentPlayerId, selectedPlayday.id, matchId, half, e.target.value)}\n                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-[9px] bg-white"\n                              >\n                                {availabilityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}\n                              </select>\n                            </div>`,
  'half availability UI'
);

// Offline cache: save every completed local state and restore it when Supabase is unreachable.
replaceRequired(
  `  // Check app version and prompt for refresh if outdated`,
  `  useEffect(() => {\n    if (!hasLoaded) return;\n    const timer = setTimeout(() => {\n      saveOfflineSnapshot(currentTeamId || 'legacy', { players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes }).catch(console.error);\n    }, 250);\n    return () => clearTimeout(timer);\n  }, [hasLoaded, currentTeamId, players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes]);\n\n  const restoreOfflineData = async (teamId = currentTeamId || localStorage.getItem('rugbyPlannerLastTeamId') || 'legacy') => {\n    const cached = await loadOfflineSnapshot(teamId);\n    if (!cached?.data) return false;\n    const data = cached.data;\n    setPlayers(data.players || []);\n    setPlaydays(data.playdays || []);\n    setLineups(data.lineups || {});\n    setRatings(data.ratings || {});\n    setTraining(data.training || {});\n    setFavoritePositions(data.favoritePositions || {});\n    setAllocationRules(data.allocationRules || allocationRules);\n    setAvailability(data.availability || {});\n    setLearningPlayerConfig(data.learningPlayerConfig || { maxStars: 2, maxGames: 5 });\n    setSatisfactionWeights(data.satisfactionWeights || { playingTime: 50, fun: 30, learning: 20 });\n    setPlayerNotes(data.playerNotes || {});\n    setHasLoaded(true);\n    return true;\n  };\n\n  // Check app version and prompt for refresh if outdated`,
  'offline cache hooks'
);

// On network failures, prefer cached data over the blocking sleeping screen.
replaceAllRequired(
  `if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed') || msg.includes('fetch')) {\n            setIsDbUnavailable(true);\n          }`,
  `if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed') || msg.includes('fetch')) {\n            const restored = await restoreOfflineData();\n            if (!restored) setIsDbUnavailable(true);\n          }`,
  'offline fallback network errors'
);

fs.writeFileSync(appPath, app);

// Auth gate: real Supabase authentication instead of treating a local username as identity.
fs.writeFileSync(path.join(root, 'src/AuthGate.jsx'), `import React, { useEffect, useState } from 'react';\nimport { supabase } from './supabaseClient';\n\nexport default function AuthGate({ children }) {\n  const [session, setSession] = useState(undefined);\n  const [email, setEmail] = useState('');\n  const [message, setMessage] = useState('');\n\n  useEffect(() => {\n    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));\n    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));\n    return () => listener.subscription.unsubscribe();\n  }, []);\n\n  if (session === undefined) return <div className=\"min-h-screen grid place-items-center bg-slate-50 text-slate-600\">Loading…</div>;\n  if (session) {\n    if (!localStorage.getItem('rugbyPlannerUsername')) {\n      localStorage.setItem('rugbyPlannerUsername', session.user.email?.split('@')[0] || 'Coach');\n    }\n    return children;\n  }\n\n  const sendMagicLink = async (event) => {\n    event.preventDefault();\n    setMessage('');\n    const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString();\n    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo } });\n    setMessage(error ? error.message : 'Check your email for the secure sign-in link.');\n  };\n\n  return <div className=\"min-h-screen grid place-items-center bg-slate-50 p-4\">\n    <form onSubmit={sendMagicLink} className=\"w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4\">\n      <div className=\"text-4xl text-center\">🏉</div>\n      <div><h1 className=\"text-xl font-bold text-slate-900\">Rugby Planner</h1><p className=\"text-sm text-slate-500\">Coach sign-in is required to protect team data.</p></div>\n      <input type=\"email\" required value={email} onChange={e => setEmail(e.target.value)} placeholder=\"coach@example.com\" className=\"w-full border border-slate-300 rounded-xl px-3 py-2\" />\n      <button className=\"w-full rounded-xl bg-slate-900 text-white font-semibold py-2.5\">Send secure sign-in link</button>\n      {message && <p className=\"text-sm text-slate-600\">{message}</p>}\n    </form>\n  </div>;\n}\n`);

const mainPath = path.join(root, 'src/main.jsx');
let main = fs.readFileSync(mainPath, 'utf8');
if (!main.includes("./AuthGate")) {
  main = main.replace("import App from './App.jsx'", "import App from './App.jsx'\nimport AuthGate from './AuthGate.jsx'");
  main = main.replace('<App />', '<AuthGate><App /></AuthGate>');
}
fs.writeFileSync(mainPath, main);

// Minimal IndexedDB store for pitch-side/offline resilience.
fs.writeFileSync(path.join(root, 'src/offlineStore.js'), `const DB_NAME = 'rugby-planner';\nconst STORE = 'snapshots';\nconst VERSION = 1;\n\nfunction openDb() {\n  return new Promise((resolve, reject) => {\n    const request = indexedDB.open(DB_NAME, VERSION);\n    request.onupgradeneeded = () => {\n      const db = request.result;\n      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'teamId' });\n    };\n    request.onsuccess = () => resolve(request.result);\n    request.onerror = () => reject(request.error);\n  });\n}\n\nexport async function saveOfflineSnapshot(teamId, data) {\n  if (!teamId || typeof indexedDB === 'undefined') return;\n  const db = await openDb();\n  await new Promise((resolve, reject) => {\n    const tx = db.transaction(STORE, 'readwrite');\n    tx.objectStore(STORE).put({ teamId: String(teamId), savedAt: new Date().toISOString(), data });\n    tx.oncomplete = resolve;\n    tx.onerror = () => reject(tx.error);\n  });\n  db.close();\n}\n\nexport async function loadOfflineSnapshot(teamId) {\n  if (!teamId || typeof indexedDB === 'undefined') return null;\n  const db = await openDb();\n  const result = await new Promise((resolve, reject) => {\n    const tx = db.transaction(STORE, 'readonly');\n    const request = tx.objectStore(STORE).get(String(teamId));\n    request.onsuccess = () => resolve(request.result || null);\n    request.onerror = () => reject(request.error);\n  });\n  db.close();\n  return result;\n}\n`);

fs.mkdirSync(path.join(root, 'src/domain'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/domain/planner.ts'), `export type AvailabilityStatus = 'available' | 'train-only' | 'injured' | 'absent' | 'not-selected' | 'unavailable';\n\nexport function availabilityKey(playdayId: number | string, matchId: number | string, half: number | string, playerId: number | string) {\n  return \`half:\${playdayId}:\${matchId}:\${half}:\${playerId}\`;\n}\n\nexport function getAvailabilityStatus(map: Record<string, AvailabilityStatus>, playerId: number | string, playdayId?: number | string, matchId?: number | string, half?: number | string): AvailabilityStatus {\n  if (playdayId !== undefined && matchId !== undefined && half !== undefined) {\n    const halfStatus = map[availabilityKey(playdayId, matchId, half, playerId)];\n    if (halfStatus) return halfStatus;\n  }\n  return map[String(playerId)] || 'available';\n}\n\nexport function isEligibleForHalf(status: AvailabilityStatus, mode: 'game' | 'training' = 'game') {\n  return status === 'available' || (mode === 'training' && status === 'train-only');\n}\n\nexport function getDynamicBenchSize(eligiblePlayers: number, fieldSlots: number) {\n  return Math.max(0, eligiblePlayers - fieldSlots);\n}\n\nexport function cleanupLineupsForPlayday<T>(lineups: Record<string, T>, playdayId: number | string) {\n  const prefix = \`\${playdayId}-\`;\n  return Object.fromEntries(Object.entries(lineups).filter(([key]) => !key.startsWith(prefix)));\n}\n\nexport function cleanupLineupsForMatch<T>(lineups: Record<string, T>, playdayId: number | string, matchId: number | string) {\n  const prefix = \`\${playdayId}-\${matchId}-\`;\n  return Object.fromEntries(Object.entries(lineups).filter(([key]) => !key.startsWith(prefix)));\n}\n\nexport function getHistoryRange(history: Record<string | number, number>) {\n  const values = Object.values(history);\n  if (values.length === 0) return { min: 0, max: 1 };\n  const min = Math.min(...values);\n  const max = Math.max(...values);\n  return { min, max: max === min ? min + 1 : max };\n}\n\nexport function validateAssignment(input: { status: AvailabilityStatus; mode: 'game' | 'training'; trained: boolean; duplicate: boolean }) {\n  const issues: string[] = [];\n  if (input.duplicate) issues.push('Player is already assigned in this half.');\n  if (!isEligibleForHalf(input.status, input.mode)) issues.push(\`Player is not eligible for this half (\${input.status}).\`);\n  if (input.mode === 'game' && !input.trained) issues.push('Player is not trained for this position.');\n  return issues;\n}\n`);

fs.writeFileSync(path.join(root, 'src/domain/types.ts'), `export type PositionId = 1 | 2 | 3 | 4 | 5 | 9 | 10 | 11 | 12 | 13 | 14 | 15;\nexport type Suitability = 0 | 1 | 2 | 3 | 10;\nexport type SkillRating = 1 | 2 | 3 | 4 | 5;\n\nexport interface PlayerPositionProfile {\n  suitability: Suitability;\n  trained: boolean;\n  skillRating?: SkillRating;\n}\n\nexport interface PositionPreferences {\n  preference1?: PositionId;\n  preference2?: PositionId;\n}\n`);

fs.mkdirSync(path.join(root, 'src/domain/__tests__'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/domain/__tests__/planner.test.ts'), `import { describe, expect, it } from 'vitest';\nimport { availabilityKey, cleanupLineupsForMatch, cleanupLineupsForPlayday, getAvailabilityStatus, getDynamicBenchSize, getHistoryRange, isEligibleForHalf, validateAssignment } from '../planner';\n\ndescribe('planner domain', () => {\n  it('supports per-half availability with legacy fallback', () => {\n    const map: any = { '7': 'available', [availabilityKey(1, 2, 1, 7)]: 'absent' };\n    expect(getAvailabilityStatus(map, 7, 1, 2, 1)).toBe('absent');\n    expect(getAvailabilityStatus(map, 7, 1, 2, 2)).toBe('available');\n  });\n  it('keeps train-only out of games but allows training', () => {\n    expect(isEligibleForHalf('train-only', 'game')).toBe(false);\n    expect(isEligibleForHalf('train-only', 'training')).toBe(true);\n  });\n  it('derives bench size from attendance', () => {\n    expect(getDynamicBenchSize(18, 12)).toBe(6);\n    expect(getDynamicBenchSize(10, 12)).toBe(0);\n  });\n  it('cascades lineup cleanup', () => {\n    const lineups = { '1-1-1': {}, '1-1-2': {}, '1-2-1': {}, '2-1-1': {} };\n    expect(Object.keys(cleanupLineupsForMatch(lineups, 1, 1))).toEqual(['1-2-1', '2-1-1']);\n    expect(Object.keys(cleanupLineupsForPlayday(lineups, 1))).toEqual(['2-1-1']);\n  });\n  it('computes the real history minimum instead of forcing zero', () => {\n    expect(getHistoryRange({ 1: 3, 2: 3, 3: 4 })).toEqual({ min: 3, max: 4 });\n  });\n  it('returns hard-rule violations for game assignments', () => {\n    expect(validateAssignment({ status: 'injured', mode: 'game', trained: false, duplicate: false })).toHaveLength(2);\n  });\n});\n`);

// Security migration. Applying this migration is intentionally separate from the code commit so existing production is not locked out mid-deploy.
fs.mkdirSync(path.join(root, 'migrations'), { recursive: true });
fs.writeFileSync(path.join(root, 'migrations/20260917_r8_security_rls.sql'), `-- R8 security hardening. Review/bootstrap team_members before applying in production.\ncreate table if not exists team_members (\n  team_id uuid not null references teams(id) on delete cascade,\n  user_id uuid not null references auth.users(id) on delete cascade,\n  role text not null default 'coach' check (role in ('coach','admin')),\n  created_at timestamptz not null default now(),\n  primary key (team_id, user_id)\n);\n\nalter table teams enable row level security;\nalter table rugby_data enable row level security;\nalter table players enable row level security;\nalter table team_players enable row level security;\nalter table active_users enable row level security;\n\ndrop policy if exists \"Allow public read access\" on rugby_data;\ndrop policy if exists \"Allow public insert access\" on rugby_data;\ndrop policy if exists \"Allow public update access\" on rugby_data;\ndrop policy if exists \"Allow public delete access\" on rugby_data;\n\ndrop policy if exists \"Allow public read access\" on active_users;\ndrop policy if exists \"Allow public insert access\" on active_users;\ndrop policy if exists \"Allow public update access\" on active_users;\ndrop policy if exists \"Allow public delete access\" on active_users;\n\ncreate policy team_members_select_own on team_members for select to authenticated using (user_id = auth.uid());\ncreate policy teams_member_select on teams for select to authenticated using (exists (select 1 from team_members tm where tm.team_id = id and tm.user_id = auth.uid()));\ncreate policy teams_authenticated_insert on teams for insert to authenticated with check (true);\ncreate policy rugby_member_select on rugby_data for select to authenticated using (exists (select 1 from team_members tm where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()));\ncreate policy rugby_member_insert on rugby_data for insert to authenticated with check (exists (select 1 from team_members tm where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()));\ncreate policy rugby_member_update on rugby_data for update to authenticated using (exists (select 1 from team_members tm where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid())) with check (exists (select 1 from team_members tm where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid()));\ncreate policy rugby_admin_delete on rugby_data for delete to authenticated using (exists (select 1 from team_members tm where tm.team_id = rugby_data.team_id and tm.user_id = auth.uid() and tm.role = 'admin'));\ncreate policy players_authenticated_select on players for select to authenticated using (true);\ncreate policy players_authenticated_insert on players for insert to authenticated with check (true);\ncreate policy players_authenticated_update on players for update to authenticated using (true) with check (true);\ncreate policy team_players_member_all on team_players for all to authenticated using (exists (select 1 from team_members tm where tm.team_id = team_players.team_id and tm.user_id = auth.uid())) with check (exists (select 1 from team_members tm where tm.team_id = team_players.team_id and tm.user_id = auth.uid()));\ncreate policy presence_authenticated_select on active_users for select to authenticated using (true);\ncreate policy presence_own_insert on active_users for insert to authenticated with check (true);\ncreate policy presence_own_update on active_users for update to authenticated using (true) with check (true);\ncreate policy presence_own_delete on active_users for delete to authenticated using (true);\n\n-- Bootstrap example (replace values with real IDs before enabling the new policies):\n-- insert into team_members(team_id, user_id, role) values ('TEAM_UUID', 'AUTH_USER_UUID', 'admin');\n`);

// Upgrade package scripts/tooling.
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.scripts.test = 'vitest run';
pkg.scripts.typecheck = 'tsc --noEmit';
pkg.scripts.check = 'npm run lint && npm run typecheck && npm test && npm run build';
pkg.devDependencies = { ...pkg.devDependencies, typescript: '^5.9.2', vitest: '^3.2.4', '@types/node': '^24.5.2' };
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

fs.writeFileSync(path.join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', useDefineForClassFields: true, lib: ['ES2022','DOM','DOM.Iterable'], allowJs: true, checkJs: false, skipLibCheck: true, esModuleInterop: true, allowSyntheticDefaultImports: true, strict: true, forceConsistentCasingInFileNames: true, module: 'ESNext', moduleResolution: 'Bundler', resolveJsonModule: true, isolatedModules: true, noEmit: true, jsx: 'react-jsx' }, include: ['src/domain/**/*.ts'] }, null, 2) + '\n');

// Strengthen deploy gate.
const deployPath = path.join(root, '.github/workflows/deploy.yml');
let deploy = fs.readFileSync(deployPath, 'utf8');
if (!deploy.includes('npm run lint')) {
  deploy = deploy.replace('      - run: npm ci\n      - run: npm run build', '      - run: npm ci\n      - run: npm run lint\n      - run: npm run typecheck\n      - run: npm test\n      - run: npm run build');
}
fs.writeFileSync(deployPath, deploy);

// Replace obsolete README with project-specific guidance.
fs.writeFileSync(path.join(root, 'README.md'), `# Mini Rugby Lineup Planner\n\nMobile-first React/Vite planner for mini-rugby squad management, training eligibility, per-half attendance, fair bench rotation, position allocation and coach collaboration.\n\n## Local development\n\n1. Copy environment values for \`VITE_SUPABASE_URL\` and \`VITE_SUPABASE_ANON_KEY\`.\n2. Run \`npm ci\`.\n3. Run \`npm run dev\`.\n4. Before pushing, run \`npm run check\`.\n\n## R8 stabilization\n\nR8 fixes active-field edit resets caused by nested component remounting, adds optimistic concurrency, per-half availability overrides, dynamic benches, cascading schedule cleanup, IndexedDB offline snapshots, complete settings persistence, shared assignment validation, tests/type checking and an authentication gate.\n\n### Security migration\n\nThe code now expects authenticated coaches. Before merging R8 to production, configure Supabase email authentication and review/apply \`migrations/20260917_r8_security_rls.sql\`. Bootstrap at least one admin in \`team_members\` before switching from the existing public policies. The migration is not automatically executed by GitHub Pages.\n\n## Data model transition\n\nThe repository still keeps the legacy JSONB planner document for compatibility while using \`players\` / \`team_players\` for the shared player library. R8 keeps these paths compatible; a later migration should make the relational roster authoritative and remove the duplicated JSON roster.\n\n## Deployment\n\nPushes to \`main\` run lint, TypeScript domain checks, unit tests and the Vite production build before GitHub Pages deployment.\n`);

// Remove unsafe/obsolete repository artifacts and duplicate scheduled job.
for (const relative of [
  'SETUP_SHARED_DATA.md',
  '.github/workflows/keep-alive.yml',
  'public/helikopter-nederland.html',
  'helikopter-nederland.html',
  'src/App_empty.jsx',
  'src/App_original_english_squat.jsx',
  'src/App_v8.jsx',
  'rugby-lineup-planner-v8.jsx'
]) {
  const file = path.join(root, relative);
  if (fs.existsSync(file)) fs.rmSync(file, { force: true });
}
for (const name of fs.readdirSync(root)) {
  if (name.startsWith('tmpclaude-')) fs.rmSync(path.join(root, name), { force: true });
}

console.log('R8 stabilization source transformation complete.');
