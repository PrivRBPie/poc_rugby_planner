import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'src/App.jsx');
let app = fs.readFileSync(appPath, 'utf8');

function replaceRequired(search, replacement, label) {
  const before = app;
  app = app.replace(search, replacement);
  if (app === before) throw new Error(`R8 domain patch failed: ${label}`);
}
function replaceAllRequired(search, replacement, label) {
  const before = app;
  app = app.replaceAll(search, replacement);
  if (app === before) throw new Error(`R8 domain patch failed: ${label}`);
}

// Extend domain imports.
replaceRequired(
  "import { availabilityKey, getAvailabilityStatus, isEligibleForHalf, getDynamicBenchSize, cleanupLineupsForPlayday, cleanupLineupsForMatch, getHistoryRange, validateAssignment } from './domain/planner';",
  "import { availabilityKey, getAvailabilityStatus, isEligibleForHalf, getDynamicBenchSize, cleanupLineupsForPlayday, cleanupLineupsForMatch, getHistoryRange, validateAssignment, validateLineupForPublish, normalizeSuitability, preferenceScore } from './domain/planner';",
  'domain imports'
);
replaceRequired("const APP_VERSION = '2.0.0-r8';", "const APP_VERSION = '2.1.0-r8';", 'app version');

// Add formal suitability, ranked preferences, published-state and key-position weighting.
replaceRequired(
  `  const [favoritePositions, setFavoritePositions] = useState({`,
  `  const [suitability, setSuitability] = useState({}); // player-position -> 0/1/2/3/10\n  const [positionPreferences, setPositionPreferences] = useState({}); // player -> { preference1, preference2 }\n  const [publishedHalves, setPublishedHalves] = useState({}); // lineup key -> publication metadata\n  const [keyPositionMultiplier, setKeyPositionMultiplier] = useState(1.15);\n\n  const [favoritePositions, setFavoritePositions] = useState({`,
  'new domain states'
);

// Offline snapshot includes new domain state.
replaceRequired(
  `saveOfflineSnapshot(currentTeamId || 'legacy', { players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes })`,
  `saveOfflineSnapshot(currentTeamId || 'legacy', { players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences, publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes })`,
  'offline new fields'
);
replaceRequired(
  `    setFavoritePositions(data.favoritePositions || {});\n    setAllocationRules(data.allocationRules || allocationRules);`,
  `    setFavoritePositions(data.favoritePositions || {});\n    setSuitability(data.suitability || {});\n    setPositionPreferences(data.positionPreferences || derivePreferences(data.favoritePositions || {}));\n    setPublishedHalves(data.publishedHalves || {});\n    setKeyPositionMultiplier(data.keyPositionMultiplier || 1.15);\n    setAllocationRules(data.allocationRules || allocationRules);`,
  'offline restore new fields'
);
replaceRequired(
  `}, [hasLoaded, currentTeamId, players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes]);`,
  `}, [hasLoaded, currentTeamId, players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences, publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes]);`,
  'offline deps'
);

// Compatibility helper: current favorites become ranked Preference 1/2 until explicitly edited.
replaceRequired(
  `  const restoreOfflineData = async (teamId = currentTeamId || localStorage.getItem('rugbyPlannerLastTeamId') || 'legacy') => {`,
  `  const derivePreferences = (favorites = {}) => Object.fromEntries(\n    Object.entries(favorites).map(([playerId, list]) => [playerId, { preference1: list?.[0] || null, preference2: list?.[1] || null }])\n  );\n\n  const restoreOfflineData = async (teamId = currentTeamId || localStorage.getItem('rugbyPlannerLastTeamId') || 'legacy') => {`,
  'preference compatibility helper'
);

// Load all new fields from all load paths.
replaceAllRequired(
  `setFavoritePositions(rugbyData.favoritePositions || {});\n            setAllocationRules`,
  `setFavoritePositions(rugbyData.favoritePositions || {});\n            setSuitability(rugbyData.suitability || {});\n            setPositionPreferences(rugbyData.positionPreferences || derivePreferences(rugbyData.favoritePositions || {}));\n            setPublishedHalves(rugbyData.publishedHalves || {});\n            setKeyPositionMultiplier(rugbyData.keyPositionMultiplier || 1.15);\n            setAllocationRules`,
  'legacy load domain fields'
);
replaceRequired(
  `setFavoritePositions(newFavoritePositions);\n        setAllocationRules`,
  `setFavoritePositions(newFavoritePositions);\n        setSuitability(rugbyData.suitability || {});\n        setPositionPreferences(rugbyData.positionPreferences || derivePreferences(newFavoritePositions));\n        setPublishedHalves(rugbyData.publishedHalves || {});\n        setKeyPositionMultiplier(rugbyData.keyPositionMultiplier || 1.15);\n        setAllocationRules`,
  'refresh domain fields'
);
replaceRequired(
  `setFavoritePositions(rugbyData.data.favoritePositions || {});\n        setAllocationRules`,
  `setFavoritePositions(rugbyData.data.favoritePositions || {});\n        setSuitability(rugbyData.data.suitability || {});\n        setPositionPreferences(rugbyData.data.positionPreferences || derivePreferences(rugbyData.data.favoritePositions || {}));\n        setPublishedHalves(rugbyData.data.publishedHalves || {});\n        setKeyPositionMultiplier(rugbyData.data.keyPositionMultiplier || 1.15);\n        setAllocationRules`,
  'team load domain fields'
);

// New-team document.
replaceRequired(
  `          favoritePositions: {},\n          allocationRules:`,
  `          favoritePositions: {},\n          suitability: {},\n          positionPreferences: {},\n          publishedHalves: {},\n          keyPositionMultiplier: 1.15,\n          allocationRules:`,
  'new team domain fields'
);
replaceRequired(
  `          setFavoritePositions({});\n          setAllocationRules`,
  `          setFavoritePositions({});\n          setSuitability({});\n          setPositionPreferences({});\n          setPublishedHalves({});\n          setKeyPositionMultiplier(1.15);\n          setAllocationRules`,
  'new team state reset'
);

// Save all new state.
replaceRequired(
  `const data = { players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes };`,
  `const data = { players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences, publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes };`,
  'save domain state'
);

// Change detection snapshots: add fields after favoritePositions consistently.
replaceAllRequired(
  `favoritePositions: JSON.stringify(favoritePositions),\n`,
  `favoritePositions: JSON.stringify(favoritePositions),\n        suitability: JSON.stringify(suitability),\n        positionPreferences: JSON.stringify(positionPreferences),\n        publishedHalves: JSON.stringify(publishedHalves),\n        keyPositionMultiplier: JSON.stringify(keyPositionMultiplier),\n`,
  'current snapshots new fields'
);
replaceAllRequired(
  `favoritePositions: JSON.stringify(rugbyData.favoritePositions || {}),\n`,
  `favoritePositions: JSON.stringify(rugbyData.favoritePositions || {}),\n              suitability: JSON.stringify(rugbyData.suitability || {}),\n              positionPreferences: JSON.stringify(rugbyData.positionPreferences || derivePreferences(rugbyData.favoritePositions || {})),\n              publishedHalves: JSON.stringify(rugbyData.publishedHalves || {}),\n              keyPositionMultiplier: JSON.stringify(rugbyData.keyPositionMultiplier || 1.15),\n`,
  'legacy snapshots new fields'
);
replaceAllRequired(
  `favoritePositions: JSON.stringify(newFavoritePositions),\n`,
  `favoritePositions: JSON.stringify(newFavoritePositions),\n          suitability: JSON.stringify(rugbyData.suitability || {}),\n          positionPreferences: JSON.stringify(rugbyData.positionPreferences || derivePreferences(newFavoritePositions)),\n          publishedHalves: JSON.stringify(rugbyData.publishedHalves || {}),\n          keyPositionMultiplier: JSON.stringify(rugbyData.keyPositionMultiplier || 1.15),\n`,
  'refresh snapshots new fields'
);
replaceAllRequired(
  `favoritePositions: JSON.stringify(rugbyData.data.favoritePositions || {}),\n`,
  `favoritePositions: JSON.stringify(rugbyData.data.favoritePositions || {}),\n          suitability: JSON.stringify(rugbyData.data.suitability || {}),\n          positionPreferences: JSON.stringify(rugbyData.data.positionPreferences || derivePreferences(rugbyData.data.favoritePositions || {})),\n          publishedHalves: JSON.stringify(rugbyData.data.publishedHalves || {}),\n          keyPositionMultiplier: JSON.stringify(rugbyData.data.keyPositionMultiplier || 1.15),\n`,
  'team snapshots new fields'
);
replaceAllRequired(
  `favoritePositions: JSON.stringify({}),\n`,
  `favoritePositions: JSON.stringify({}),\n            suitability: JSON.stringify({}),\n            positionPreferences: JSON.stringify({}),\n            publishedHalves: JSON.stringify({}),\n            keyPositionMultiplier: JSON.stringify(1.15),\n`,
  'new team snapshots new fields'
);

// Fix current-state dependency list and labels.
replaceRequired(
  `}, [players, playdays, lineups, ratings, training, favoritePositions, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes, hasLoaded, initialState]);`,
  `}, [players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences, publishedHalves, keyPositionMultiplier, allocationRules, availability, learningPlayerConfig, satisfactionWeights, playerNotes, hasLoaded, initialState]);`,
  'change detection domain deps'
);
replaceRequired(
  `        favoritePositions: '❤️ Favorite positions',`,
  `        favoritePositions: '❤️ Favorite positions',\n        suitability: '🎯 Position suitability',\n        positionPreferences: '🥇 Ranked preferences',\n        publishedHalves: '📣 Published lineups',\n        keyPositionMultiplier: '⚖️ Key-position weight',`,
  'refresh field labels'
);

// Ranked preference API replaces generic favorite toggling while maintaining legacy favorites for existing analytics.
replaceRequired(
  /  const isFavoritePosition = \(playerId, positionId\) =>[\s\S]*?\n  \};\n\n  const removePlayer/,
  `  const getPreferenceRank = (playerId, positionId) => {\n    const prefs = positionPreferences[playerId] || positionPreferences[String(playerId)];\n    if (prefs?.preference1 === positionId) return 1;\n    if (prefs?.preference2 === positionId) return 2;\n    const legacy = favoritePositions[playerId] || [];\n    const index = legacy.indexOf(positionId);\n    return index >= 0 && index < 2 ? index + 1 : null;\n  };\n\n  const isFavoritePosition = (playerId, positionId) => getPreferenceRank(playerId, positionId) !== null;\n\n  const setPreference = (playerId, rank, positionId) => {\n    const parsed = positionId ? Number(positionId) : null;\n    setPositionPreferences(prev => {\n      const current = prev[playerId] || { preference1: null, preference2: null };\n      const next = { ...current, [rank === 1 ? 'preference1' : 'preference2']: parsed };\n      if (next.preference1 && next.preference1 === next.preference2) {\n        next[rank === 1 ? 'preference2' : 'preference1'] = null;\n      }\n      setFavoritePositions(fav => ({ ...fav, [playerId]: [next.preference1, next.preference2].filter(Boolean) }));\n      return { ...prev, [playerId]: next };\n    });\n  };\n\n  const getSuitability = (playerId, positionId) => {\n    const key = \`${'${playerId}-${positionId}'}\`;\n    if (suitability[key] !== undefined) return normalizeSuitability(suitability[key]);\n    return training[key] ? 2 : 0;\n  };\n\n  const setPositionSuitability = (playerId, positionId, value) => {\n    const key = \`${'${playerId}-${positionId}'}\`;\n    setSuitability(prev => ({ ...prev, [key]: normalizeSuitability(Number(value)) }));\n  };\n\n  const removePlayer`,
  'ranked preference helpers'
);

// Remove-player cleanup for new maps.
replaceRequired(
  `      // Remove favorite positions\n      setFavoritePositions(prev => {\n        const updated = { ...prev };\n        delete updated[playerId];\n        return updated;\n      });`,
  `      // Remove preferences and position profiles\n      setFavoritePositions(prev => { const updated = { ...prev }; delete updated[playerId]; return updated; });\n      setPositionPreferences(prev => { const updated = { ...prev }; delete updated[playerId]; return updated; });\n      setSuitability(prev => {\n        const updated = { ...prev };\n        Object.keys(updated).forEach(key => { if (key.startsWith(\`${'${playerId}-'}\`)) delete updated[key]; });\n        return updated;\n      });`,
  'remove player new data'
);

// Suitability is a hard safety constraint; key-position multiplier and ranked preference enter scoring.
replaceRequired(
  `    const trainingKey = \`${'${player.id}-${position.id}'}\`;\n\n    // Apply HARD constraints`,
  `    const trainingKey = \`${'${player.id}-${position.id}'}\`;\n    const playerSuitability = getSuitability(player.id, position.id);\n    if (playerSuitability === 10) {\n      return { score: -Infinity, explanations: ['❌ Suitability 10: do not play this position (HARD)'] };\n    }\n\n    // Apply HARD constraints`,
  'suitability hard constraint'
);
replaceRequired(
  `          const strengthNormalized = (rating / 5) * 100; // 0-5 stars -> 0-100\n          const strengthScore = (strengthNormalized / 100) * rule.weight * 10;\n          score += strengthScore;\n          explanations.push(\`Skill (${'${rating}'}★): ${'${strengthScore.toFixed(2)}'} pts\`);`,
  `          const ratingNormalized = (rating / 5) * 100;\n          const suitabilityNormalized = ({ 0: 10, 1: 100, 2: 65, 3: 30 }[playerSuitability] ?? 0);\n          const strengthNormalized = (ratingNormalized * 0.6) + (suitabilityNormalized * 0.4);\n          const keyMultiplier = [1, 2, 3, 9, 10, 12].includes(position.id) ? keyPositionMultiplier : 1;\n          const strengthScore = (strengthNormalized / 100) * rule.weight * 10 * keyMultiplier;\n          score += strengthScore;\n          explanations.push(\`Skill (${'${rating}'}★, suitability ${'${playerSuitability}'})${'${keyMultiplier > 1 ? ` ×${keyMultiplier.toFixed(2)} key position` : ""}'}: ${'${strengthScore.toFixed(2)}'} pts\`);`,
  'suitability/key position scoring'
);
replaceRequired(
  `          const isFavorite = favoritePositions[player.id]?.includes(position.id);\n          const preferenceNormalized = isFavorite ? 100 : 0;\n          const preferenceScore = (preferenceNormalized / 100) * rule.weight * 10;\n          score += preferenceScore;\n          if (isFavorite) {\n            explanations.push(\`Fun (favorite ★): ${'${preferenceScore.toFixed(2)}'} pts\`);\n          }`,
  `          const preferenceRank = getPreferenceRank(player.id, position.id);\n          const preferenceNormalized = preferenceScore(preferenceRank);\n          const preferencePoints = (preferenceNormalized / 100) * rule.weight * 10;\n          score += preferencePoints;\n          if (preferenceRank) {\n            explanations.push(\`Fun (Preference ${'${preferenceRank}'}): ${'${preferencePoints.toFixed(2)}'} pts\`);\n          }`,
  'ranked preference scoring'
);

// Manual validation includes suitability=10.
replaceRequired(
  `        trained: trainedForPosition,\n        duplicate: false,`,
  `        trained: trainedForPosition,\n        duplicate: false,\n        suitability: getSuitability(playerId, posId),`,
  'manual suitability validation'
);

// Draft/publish lifecycle. Every lineup mutation returns a half to Draft.
replaceRequired(
  `  const updateLineup = (playdayId, matchId, half, fn) => {\n    const key = \`${'${playdayId}-${matchId}-${half}'}\`;\n    setLineups(prev => ({ ...prev, [key]: fn(prev[key] || { assignments: {}, bench: [] }) }));\n  };`,
  `  const markHalfDraft = (key) => setPublishedHalves(prev => { const next = { ...prev }; delete next[key]; return next; });\n\n  const updateLineup = (playdayId, matchId, half, fn) => {\n    const key = \`${'${playdayId}-${matchId}-${half}'}\`;\n    setLineups(prev => ({ ...prev, [key]: fn(prev[key] || { assignments: {}, bench: [] }) }));\n    markHalfDraft(key);\n  };\n\n  const getPublishErrors = (playdayId, matchId, half) => {\n    const key = \`${'${playdayId}-${matchId}-${half}'}\`;\n    const lineup = lineups[key] || { assignments: {}, bench: [] };\n    const mode = selectedPlayday?.type === 'training' ? 'training' : 'game';\n    const eligible = getEligiblePlayersForHalf(playdayId, matchId, half, mode);\n    return validateLineupForPublish({\n      positions: positions.map(p => p.id),\n      eligiblePlayerIds: eligible.map(p => p.id),\n      assignments: lineup.assignments || {},\n      bench: lineup.bench || [],\n      mode,\n      isTrained: (playerId, positionId) => !!training[\`${'${playerId}-${positionId}'}\`],\n      getSuitability: (playerId, positionId) => getSuitability(playerId, positionId),\n    });\n  };\n\n  const publishHalf = (playdayId, matchId, half) => {\n    const key = \`${'${playdayId}-${matchId}-${half}'}\`;\n    const errors = getPublishErrors(playdayId, matchId, half);\n    if (errors.length) {\n      alert(\`Cannot publish this half yet:\\n\\n${'${errors.map(e => `• ${e}`).join("\\n")}'}\`);\n      return;\n    }\n    const publication = { publishedAt: new Date().toISOString(), publishedBy: currentUsername || 'Coach' };\n    setPublishedHalves(prev => ({ ...prev, [key]: publication }));\n    logAction('publish_lineup', { playday_id: playdayId, match_id: matchId, half });\n  };`,
  'publish lifecycle'
);

// Direct mutation helpers must also mark draft.
replaceRequired(
  `      setLineups(prev => ({ ...prev, [key]: { assignments: { ...prevLineup.assignments }, bench: [...(prevLineup.bench || [])] } }));`,
  `      setLineups(prev => ({ ...prev, [key]: { assignments: { ...prevLineup.assignments }, bench: [...(prevLineup.bench || [])] } }));\n      markHalfDraft(key);`,
  'copy marks draft'
);
replaceRequired(
  `    setLineups(prev => ({ ...prev, [key]: { assignments: {}, bench: [] } }));`,
  `    setLineups(prev => ({ ...prev, [key]: { assignments: {}, bench: [] } }));\n    markHalfDraft(key);`,
  'clear marks draft'
);
replaceRequired(
  `    setLineups(prev => ({ ...prev, ...clearedLineups }));`,
  `    setLineups(prev => ({ ...prev, ...clearedLineups }));\n    setPublishedHalves(prev => {\n      const next = { ...prev };\n      Object.keys(clearedLineups).forEach(key => delete next[key]);\n      return next;\n    });`,
  'clear day marks draft'
);
replaceRequired(
  `    setLineups(prev => ({ ...prev, [key]: { assignments: newAssignments, bench: newBench } }));\n    setAllocationExplanations`,
  `    setLineups(prev => ({ ...prev, [key]: { assignments: newAssignments, bench: newBench } }));\n    markHalfDraft(key);\n    setAllocationExplanations`,
  'single proposal marks draft'
);
replaceRequired(
  `    setLineups(prev => ({ ...prev, ...newLineupsForDay }));\n    setAllocationExplanations`,
  `    setLineups(prev => ({ ...prev, ...newLineupsForDay }));\n    setPublishedHalves(prev => {\n      const next = { ...prev };\n      Object.keys(newLineupsForDay).forEach(key => delete next[key]);\n      return next;\n    });\n    setAllocationExplanations`,
  'full proposal marks draft'
);

// Delete cascade publication state too.
replaceRequired(
  `    setLineups(prev => cleanupLineupsForPlayday(prev, id));`,
  `    setLineups(prev => cleanupLineupsForPlayday(prev, id));\n    setPublishedHalves(prev => cleanupLineupsForPlayday(prev, id));`,
  'playday publication cascade'
);
replaceRequired(
  `    setLineups(prev => cleanupLineupsForMatch(prev, selectedPlaydayId, matchId));`,
  `    setLineups(prev => cleanupLineupsForMatch(prev, selectedPlaydayId, matchId));\n    setPublishedHalves(prev => cleanupLineupsForMatch(prev, selectedPlaydayId, matchId));`,
  'match publication cascade'
);

// Replace legacy favorite-position buttons with ranked Pref1/Pref2 selectors.
replaceRequired(
  /                  <div className="text-xs font-medium text-gray-500 mt-3 mb-1">Favorite Positions<\/div>[\s\S]*?                  <div className="text-xs font-medium text-gray-500 mb-2">Position Training & Ratings<\/div>/,
  `                  <div className="text-xs font-medium text-gray-500 mt-3 mb-1">Ranked Position Preferences</div>\n                  <div className="grid grid-cols-2 gap-2 mb-3">\n                    {[1, 2].map(rank => {\n                      const prefs = positionPreferences[player.id] || derivePreferences({ [player.id]: favoritePositions[player.id] || [] })[player.id] || {};\n                      const value = rank === 1 ? prefs.preference1 : prefs.preference2;\n                      return (\n                        <label key={rank} className="text-[10px] text-gray-500">\n                          Preference {rank}\n                          <select\n                            value={value || ''}\n                            onChange={(e) => setPreference(player.id, rank, e.target.value)}\n                            className="mt-1 w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-800"\n                          >\n                            <option value="">None</option>\n                            {positions.map(pos => <option key={pos.id} value={pos.id}>#{pos.code} {pos.name}</option>)}\n                          </select>\n                        </label>\n                      );\n                    })}\n                  </div>\n                  <div className="text-xs font-medium text-gray-500 mb-2">Position Training, Suitability & Ratings</div>`,
  'preference UI'
);

// Position profile card gets formal suitability selector and preference rank badge.
replaceRequired(
  `                      const isFav = isFavoritePosition(player.id, pos.id);\n                      const timesPlayed`,
  `                      const preferenceRank = getPreferenceRank(player.id, pos.id);\n                      const positionSuitability = getSuitability(player.id, pos.id);\n                      const timesPlayed`,
  'position card vars'
);
replaceRequired(
  `{isFav && <Icons.Star filled />}`,
  `{preferenceRank && <span className="text-[9px] font-bold text-yellow-600">P{preferenceRank}</span>}`,
  'preference badge'
);
replaceRequired(
  `                          <button onClick={() => handleTrainingToggle(player.id, pos.id)} className={`,
  `                          <select\n                            value={positionSuitability}\n                            onChange={(e) => setPositionSuitability(player.id, pos.id, e.target.value)}\n                            className={\`w-full mb-1 text-[9px] border rounded px-1 py-1 ${'${positionSuitability === 10 ? "bg-red-100 border-red-300 text-red-800" : "bg-white border-gray-200 text-gray-700"}'}\`}\n                            title="Suitability: 0 test, 1 best fit, 2 OK, 3 needs attention, 10 do not play"\n                          >\n                            <option value="0">S0 · test</option>\n                            <option value="1">S1 · best fit</option>\n                            <option value="2">S2 · OK</option>\n                            <option value="3">S3 · attention</option>\n                            <option value="10">S10 · do not play</option>\n                          </select>\n                          <button onClick={() => handleTrainingToggle(player.id, pos.id)} className={`,
  'suitability UI'
);

// Coverage analytics uses Suitability=1 counts.
replaceRequired(
  `        return { player, trained, rating, isFav };`,
  `        const suit = getSuitability(player.id, pos.id);\n        return { player, trained, rating, isFav, suitability: suit };`,
  'analytics suitability'
);
replaceRequired(
  `        avgRating: playersForPosition.length > 0`,
  `        bestFitCount: playersForPosition.filter(p => p.suitability === 1).length,\n        avgRating: playersForPosition.length > 0`,
  'analytics best fit count'
);
replaceRequired(
  `    const weakPositions = positionAnalytics.filter(pa => pa.playerCount < 2);`,
  `    const weakPositions = positionAnalytics.filter(pa => pa.bestFitCount <= 1);`,
  'coverage risk rule'
);
replaceRequired(
  `                  Limited depth at: {weakPositions.map(wp => \`#${'${wp.position.code}'} ${'${wp.position.name}'}\`).join(', ')}`,
  `                  Suitability-1 coverage risk at: {weakPositions.map(wp => \`#${'${wp.position.code}'} ${'${wp.position.name}'} (${'${wp.bestFitCount}'} best-fit)\`).join(', ')}`,
  'coverage risk wording'
);

// Key-position multiplier control in Rules view.
const rulesMarker = `      {/* Learning Player Definition Section */}`;
const keyPositionPanel = `      <div className="space-y-4">\n        <div>\n          <h3 className="text-lg font-bold text-gray-900">Key Position Weighting</h3>\n          <p className="text-xs text-gray-500">Small skill/suitability multiplier for positions 1, 2, 3, 9, 10 and 12</p>\n        </div>\n        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">\n          <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-gray-700">Multiplier</span><span className="text-sm font-bold" style={{ color: DIOK.blue }}>{keyPositionMultiplier.toFixed(2)}×</span></div>\n          <input type="range" min="100" max="130" value={Math.round(keyPositionMultiplier * 100)} onChange={(e) => setKeyPositionMultiplier(Number(e.target.value) / 100)} className="w-full" />\n          <p className="text-[11px] text-gray-500 mt-1">Kept deliberately small (1.00–1.30×) so it cannot overwhelm fairness.</p>\n        </div>\n      </div>\n\n`;
replaceRequired(rulesMarker, keyPositionPanel + rulesMarker, 'key position rules UI');

// Draft/published badge and publish button in each half header.
replaceRequired(
  `<div><div className="font-semibold text-gray-900 text-sm">{selectedPlayday.type === 'game' ? \`vs. ${'${opponent}'}\` : opponent}</div><div className="text-xs text-gray-500">{selectedPlayday.type === 'game' ? \`Game ${'${number}'}\` : \`Training ${'${number}'}\`} · Half {half}</div></div>`,
  `<div><div className="font-semibold text-gray-900 text-sm">{selectedPlayday.type === 'game' ? \`vs. ${'${opponent}'}\` : opponent}</div><div className="text-xs text-gray-500 flex items-center gap-1.5">{selectedPlayday.type === 'game' ? \`Game ${'${number}'}\` : \`Training ${'${number}'}\`} · Half {half}<span className={\`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${'${publishedHalves[key] ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}'}\`}>{publishedHalves[key] ? 'Published' : 'Draft'}</span></div></div>`,
  'draft badge'
);
replaceRequired(
  `<div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>`,
  `<div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>\n                        <button\n                          onClick={() => publishHalf(selectedPlayday.id, matchId, half)}\n                          className={\`px-2 py-1.5 rounded-lg text-[10px] font-semibold ${'${publishedHalves[key] ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}'}\`}\n                          title={publishedHalves[key] ? `Published by ${'${publishedHalves[key].publishedBy}'}` : 'Validate and publish this half'}\n                        >{publishedHalves[key] ? '✓ Published' : 'Publish'}</button>`,
  'publish button'
);

// Reduce redundant polling; realtime remains primary, slow fallback for resilience.
replaceRequired('const pollInterval = setInterval(fetchActiveUsers, 10000);', 'const pollInterval = setInterval(fetchActiveUsers, 60000);', 'presence polling reduction');
replaceRequired(
  `    fetchLoginHistory();\n\n    // Refresh every 30 seconds\n    const interval = setInterval(fetchLoginHistory, 30000);\n\n    return () => clearInterval(interval);\n  }, []);`,
  `    if (activeTab === 'admin') fetchLoginHistory();\n  }, [activeTab]);`,
  'admin history on demand'
);
replaceRequired(
  `    // Refresh every 30 seconds as fallback\n    const interval = setInterval(fetchActionLog, 30000);\n\n    return () => {\n      supabase.removeChannel(channel);\n      clearInterval(interval);\n    };`,
  `    return () => {\n      supabase.removeChannel(channel);\n    };`,
  'action log realtime only'
);
replaceRequired(
  `    // Then check every 10 seconds\n    const interval = setInterval(checkForRemoteChanges, 10000);\n\n    return () => clearInterval(interval);`,
  `    const channel = supabase\n      .channel(\`rugby_data_${'${rugbyDataId}'}\`)\n      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rugby_data', filter: \`id=eq.${'${rugbyDataId}'}\` }, payload => {\n        if (payload.new?.updated_at && payload.new.updated_at !== remoteUpdatedAt) setHasRemoteChanges(true);\n      })\n      .subscribe();\n\n    // Slow fallback in case realtime disconnects; no state replacement occurs here.\n    const interval = setInterval(checkForRemoteChanges, 60000);\n\n    return () => {\n      clearInterval(interval);\n      supabase.removeChannel(channel);\n    };`,
  'remote realtime plus slow fallback'
);

fs.writeFileSync(appPath, app);

// Extend pure domain with suitability, preferences and publish validation.
const plannerPath = path.join(root, 'src/domain/planner.ts');
let planner = fs.readFileSync(plannerPath, 'utf8');
planner += `\nexport type Suitability = 0 | 1 | 2 | 3 | 10;\n\nexport function normalizeSuitability(value: number): Suitability {\n  return ([0, 1, 2, 3, 10] as const).includes(value as Suitability) ? value as Suitability : 0;\n}\n\nexport function preferenceScore(rank: 1 | 2 | null | undefined) {\n  if (rank === 1) return 100;\n  if (rank === 2) return 60;\n  return 0;\n}\n\nexport function validateLineupForPublish(input: {\n  positions: Array<number | string>;\n  eligiblePlayerIds: Array<number | string>;\n  assignments: Record<string, number | string>;\n  bench: Array<number | string>;\n  mode: 'game' | 'training';\n  isTrained: (playerId: number | string, positionId: number | string) => boolean;\n  getSuitability: (playerId: number | string, positionId: number | string) => Suitability;\n}) {\n  const errors: string[] = [];\n  const eligible = new Set(input.eligiblePlayerIds.map(String));\n  const assignedIds: string[] = [];\n\n  for (const positionId of input.positions) {\n    const playerId = input.assignments[String(positionId)] ?? input.assignments[positionId as any];\n    if (playerId === undefined || playerId === null || playerId === '') {\n      errors.push(\`Position #\${positionId} is empty.\`);\n      continue;\n    }\n    const id = String(playerId);\n    assignedIds.push(id);\n    if (!eligible.has(id)) errors.push(\`Player \${playerId} at #\${positionId} is not eligible for this half.\`);\n    if (input.getSuitability(playerId, positionId) === 10) errors.push(\`Player \${playerId} has suitability 10 at #\${positionId}.\`);\n    if (input.mode === 'game' && !input.isTrained(playerId, positionId)) errors.push(\`Player \${playerId} is not trained for #\${positionId}.\`);\n  }\n\n  const duplicateAssigned = assignedIds.filter((id, index) => assignedIds.indexOf(id) !== index);\n  if (duplicateAssigned.length) errors.push('A player is assigned to more than one field position.');\n\n  const benchIds = input.bench.map(String);\n  const duplicateBench = benchIds.filter((id, index) => benchIds.indexOf(id) !== index);\n  if (duplicateBench.length) errors.push('A player appears more than once on the bench.');\n  if (benchIds.some(id => assignedIds.includes(id))) errors.push('A player appears both on the field and on the bench.');\n  if (benchIds.some(id => !eligible.has(id))) errors.push('The bench contains an ineligible player.');\n\n  const expectedBench = Math.max(0, input.eligiblePlayerIds.length - input.positions.length);\n  if (input.bench.length !== expectedBench) errors.push(\`Bench should contain \${expectedBench} player(s), currently \${input.bench.length}.\`);\n\n  const participating = new Set([...assignedIds, ...benchIds]);\n  const missingEligible = [...eligible].filter(id => !participating.has(id));\n  if (missingEligible.length) errors.push(\`\${missingEligible.length} eligible player(s) are not assigned to field or bench.\`);\n\n  return [...new Set(errors)];\n}\n`;
fs.writeFileSync(plannerPath, planner);

// Tests for the newly formalized domain.
const testPath = path.join(root, 'src/domain/__tests__/planner.test.ts');
let tests = fs.readFileSync(testPath, 'utf8');
tests = tests.replace(
  "import { availabilityKey, cleanupLineupsForMatch, cleanupLineupsForPlayday, getAvailabilityStatus, getDynamicBenchSize, getHistoryRange, isEligibleForHalf, validateAssignment } from '../planner';",
  "import { availabilityKey, cleanupLineupsForMatch, cleanupLineupsForPlayday, getAvailabilityStatus, getDynamicBenchSize, getHistoryRange, isEligibleForHalf, normalizeSuitability, preferenceScore, validateAssignment, validateLineupForPublish } from '../planner';"
);
tests = tests.replace(/\n\}\);\s*$/, `\n  it('supports the formal suitability values and ranked preferences', () => {\n    expect(normalizeSuitability(10)).toBe(10);\n    expect(normalizeSuitability(7)).toBe(0);\n    expect(preferenceScore(1)).toBe(100);\n    expect(preferenceScore(2)).toBe(60);\n    expect(preferenceScore(null)).toBe(0);\n  });\n\n  it('blocks publishing invalid halves', () => {\n    const errors = validateLineupForPublish({\n      positions: [1, 2],\n      eligiblePlayerIds: [10, 11, 12],\n      assignments: { 1: 10, 2: 11 },\n      bench: [12],\n      mode: 'game',\n      isTrained: (_player, position) => Number(position) !== 2,\n      getSuitability: (_player, position) => Number(position) === 1 ? 10 : 2,\n    });\n    expect(errors.some(error => error.includes('suitability 10'))).toBe(true);\n    expect(errors.some(error => error.includes('not trained'))).toBe(true);\n  });\n\n  it('accepts a complete valid published half', () => {\n    expect(validateLineupForPublish({\n      positions: [1, 2],\n      eligiblePlayerIds: [10, 11, 12],\n      assignments: { 1: 10, 2: 11 },\n      bench: [12],\n      mode: 'game',\n      isTrained: () => true,\n      getSuitability: () => 2,\n    })).toEqual([]);\n  });\n});\n`);
fs.writeFileSync(testPath, tests);

// Make old team migration repeat-safe and valid PostgreSQL.
const migrationPath = path.join(root, 'migrations/add_teams_table.sql');
let migration = fs.readFileSync(migrationPath, 'utf8');
migration = migration.replace(
  /INSERT INTO teams \(name, logo, created_by\)\nVALUES\n  \('Bulls Mini''s', '🐂', 'system'\),\n  \('Sharks Mini''s', '🦈', 'system'\);/,
  `INSERT INTO teams (name, logo, created_by)\nSELECT 'Bulls Mini''s', '🐂', 'system'\nWHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Bulls Mini''s');\n\nINSERT INTO teams (name, logo, created_by)\nSELECT 'Sharks Mini''s', '🦈', 'system'\nWHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Sharks Mini''s');`
);
migration = migration.replace(
  `UPDATE rugby_data\nSET team_id = (SELECT id FROM teams WHERE name = 'Bulls Mini''s')\nWHERE team_id IS NULL\nLIMIT 1;`,
  `WITH first_unlinked AS (\n  SELECT id FROM rugby_data WHERE team_id IS NULL ORDER BY created_at LIMIT 1\n)\nUPDATE rugby_data rd\nSET team_id = (SELECT id FROM teams WHERE name = 'Bulls Mini''s' ORDER BY created_at LIMIT 1)\nFROM first_unlinked f\nWHERE rd.id = f.id;`
);
migration = migration.replace(
  /INSERT INTO rugby_data \(team_id, team_name, data\)\nVALUES \([\s\S]*?\n\);\n\n-- Step 6:/,
  match => match.replace(/\n\);\n\n-- Step 6:/, `\n)\nSELECT t.id, 'Sharks Mini''s', d.data\nFROM teams t\nCROSS JOIN (SELECT '{"players":[],"playdays":[],"lineups":{},"ratings":{},"training":{},"favoritePositions":{},"allocationRules":{},"availability":{}}'::jsonb AS data) d\nWHERE t.name = 'Sharks Mini''s'\n  AND NOT EXISTS (SELECT 1 FROM rugby_data rd WHERE rd.team_id = t.id);\n\n-- Step 6:`)
);
// The previous regex transformation for Sharks may be unsafe if the legacy insert is complex; if it produced duplicate INSERT tokens, restore a concise idempotent file below.
if ((migration.match(/INSERT INTO rugby_data/g) || []).length > 1 || migration.includes('VALUES (\n  (SELECT id FROM teams')) {
  migration = `-- Migration: Add Multi-Team Support (idempotent R8 revision)\nCREATE TABLE IF NOT EXISTS teams (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name TEXT NOT NULL,\n  logo TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW(),\n  created_by TEXT\n);\n\nALTER TABLE rugby_data ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);\n\nINSERT INTO teams (name, logo, created_by) SELECT 'Bulls Mini''s', '🐂', 'system' WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Bulls Mini''s');\nINSERT INTO teams (name, logo, created_by) SELECT 'Sharks Mini''s', '🦈', 'system' WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Sharks Mini''s');\n\nWITH first_unlinked AS (SELECT id FROM rugby_data WHERE team_id IS NULL ORDER BY created_at LIMIT 1)\nUPDATE rugby_data rd SET team_id = (SELECT id FROM teams WHERE name = 'Bulls Mini''s' ORDER BY created_at LIMIT 1) FROM first_unlinked f WHERE rd.id = f.id;\n\nINSERT INTO rugby_data (team_id, team_name, data)\nSELECT t.id, 'Sharks Mini''s', '{"players":[],"playdays":[],"lineups":{},"ratings":{},"training":{},"favoritePositions":{},"suitability":{},"positionPreferences":{},"publishedHalves":{},"keyPositionMultiplier":1.15,"allocationRules":{},"availability":{}}'::jsonb\nFROM teams t WHERE t.name = 'Sharks Mini''s' AND NOT EXISTS (SELECT 1 FROM rugby_data rd WHERE rd.team_id = t.id);\n\nCREATE INDEX IF NOT EXISTS idx_rugby_data_team_id ON rugby_data(team_id);\n`;
}
fs.writeFileSync(migrationPath, migration);

console.log('R8 domain completion transformation complete.');
