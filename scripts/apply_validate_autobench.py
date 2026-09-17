from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

old = """  const getEligiblePlayersForHalf = (playdayId, matchId, half, mode = 'game') =>\n    activePlayers.filter(player => isEligibleForHalf(getHalfStatus(player.id, playdayId, matchId, half), mode));\n\n  const setHalfAvailability = (playerId, playdayId, matchId, half, status) => {\n    setAvailability(prev => ({ ...prev, [availabilityKey(playdayId, matchId, half, playerId)]: status }));\n  };\n"""
new = """  const getEligiblePlayersForHalf = (playdayId, matchId, half, mode = 'game') =>\n    activePlayers.filter(player => isEligibleForHalf(getHalfStatus(player.id, playdayId, matchId, half), mode));\n\n  // Bench is derived from the available players who are not currently on the field.\n  // Keep an explicit all-empty lineup empty so the Clear action still truly clears a half.\n  const normalizeLineupBench = (playdayId, matchId, half, lineup) => {\n    const assignments = { ...(lineup?.assignments || {}) };\n    const existingBench = [...(lineup?.bench || [])].filter(Boolean);\n    const assignedIds = new Set(Object.values(assignments).filter(Boolean));\n\n    if (assignedIds.size === 0 && existingBench.length === 0) {\n      return { ...(lineup || {}), assignments, bench: [] };\n    }\n\n    const playday = playdays.find(pd => pd.id === playdayId);\n    const mode = playday?.type === 'training' ? 'training' : 'game';\n    const eligibleIds = getEligiblePlayersForHalf(playdayId, matchId, half, mode).map(player => player.id);\n    const eligibleSet = new Set(eligibleIds);\n\n    const bench = existingBench.filter(id => eligibleSet.has(id) && !assignedIds.has(id));\n    eligibleIds.forEach(id => {\n      if (!assignedIds.has(id) && !bench.includes(id) && bench.length < 8) bench.push(id);\n    });\n\n    return { ...(lineup || {}), assignments, bench: bench.slice(0, 8) };\n  };\n\n  const getVisibleBenchSize = (eligibleCount, assignments, bench = []) => {\n    const assignedCount = Object.values(assignments || {}).filter(Boolean).length;\n    if (assignedCount === 0 && (bench || []).filter(Boolean).length === 0) return 0;\n    return Math.min(8, Math.max((bench || []).filter(Boolean).length, eligibleCount - assignedCount, 0));\n  };\n\n  const setHalfAvailability = (playerId, playdayId, matchId, half, status) => {\n    setAvailability(prev => ({ ...prev, [availabilityKey(playdayId, matchId, half, playerId)]: status }));\n  };\n"""
if old not in text:
    raise SystemExit('eligibility helper block not found')
text = text.replace(old, new, 1)

replacements = [
    (
        """  const calculateScores = (playdayId, matchId, half) => {\n    const key = `${playdayId}-${matchId}-${half}`;\n    const lineup = lineups[key] || { assignments: {}, bench: [] };\n""",
        """  const calculateScores = (playdayId, matchId, half) => {\n    const key = `${playdayId}-${matchId}-${half}`;\n    const lineup = normalizeLineupBench(playdayId, matchId, half, lineups[key] || { assignments: {}, bench: [] });\n"""
    ),
    (
        """  const getAssignedInHalf = (playdayId, matchId, half) => {\n    const key = `${playdayId}-${matchId}-${half}`;\n    const lineup = lineups[key] || { assignments: {}, bench: [] };\n""",
        """  const getAssignedInHalf = (playdayId, matchId, half) => {\n    const key = `${playdayId}-${matchId}-${half}`;\n    const lineup = normalizeLineupBench(playdayId, matchId, half, lineups[key] || { assignments: {}, bench: [] });\n"""
    ),
    (
        """    const assignedInHalf = getAssignedInHalf(playdayId, matchId, half);\n    const key = `${playdayId}-${matchId}-${half}`;\n    const lineup = lineups[key] || { assignments: {}, bench: [] };\n""",
        """    const assignedInHalf = getAssignedInHalf(playdayId, matchId, half);\n    const key = `${playdayId}-${matchId}-${half}`;\n    const lineup = normalizeLineupBench(playdayId, matchId, half, lineups[key] || { assignments: {}, bench: [] });\n"""
    ),
    (
        """  const updateLineup = (playdayId, matchId, half, fn) => {\n    const key = `${playdayId}-${matchId}-${half}`;\n    setLineups(prev => ({ ...prev, [key]: fn(prev[key] || { assignments: {}, bench: [] }) }));\n    markHalfDraft(key);\n  };\n""",
        """  const updateLineup = (playdayId, matchId, half, fn) => {\n    const key = `${playdayId}-${matchId}-${half}`;\n    setLineups(prev => {\n      const current = normalizeLineupBench(playdayId, matchId, half, prev[key] || { assignments: {}, bench: [] });\n      const next = fn(current);\n      return { ...prev, [key]: normalizeLineupBench(playdayId, matchId, half, next) };\n    });\n    markHalfDraft(key);\n  };\n"""
    ),
    (
        """  const getPublishErrors = (playdayId, matchId, half) => {\n    const key = `${playdayId}-${matchId}-${half}`;\n    const lineup = lineups[key] || { assignments: {}, bench: [] };\n""",
        """  const getPublishErrors = (playdayId, matchId, half) => {\n    const key = `${playdayId}-${matchId}-${half}`;\n    const lineup = normalizeLineupBench(playdayId, matchId, half, lineups[key] || { assignments: {}, bench: [] });\n"""
    ),
    (
        """    const assignedInHalf = getAssignedInHalf(playdayId, matchId, half);\n    const key = `${playdayId}-${matchId}-${half}`;\n    const lineup = lineups[key] || { assignments: {}, bench: [] };\n    const isCurrentlyHere = isBench ? lineup.bench?.includes(playerId) : lineup.assignments[posId] === playerId;\n""",
        """    const assignedInHalf = getAssignedInHalf(playdayId, matchId, half);\n    const key = `${playdayId}-${matchId}-${half}`;\n    const lineup = normalizeLineupBench(playdayId, matchId, half, lineups[key] || { assignments: {}, bench: [] });\n    const isCurrentlyHere = isBench ? lineup.bench?.includes(playerId) : lineup.assignments[posId] === playerId;\n"""
    ),
    (
        """        const mode = selectedPlayday?.type === 'training' ? 'training' : 'game';\n        const maxBenchSize = getDynamicBenchSize(getEligiblePlayersForHalf(playdayId, matchId, half, mode).length, positions.length);\n""",
        """        const mode = selectedPlayday?.type === 'training' ? 'training' : 'game';\n        const maxBenchSize = getVisibleBenchSize(getEligiblePlayersForHalf(playdayId, matchId, half, mode).length, newAssignments, newBench);\n"""
    ),
    (
        """      const key = `${selectedPlayday.id}-${matchId}-${half}`;\n      const lineup = lineups[key] || { assignments: {}, bench: [] };\n      return (\n        <div className=\"flex flex-wrap gap-0.5 items-end\">\n""",
        """      const key = `${selectedPlayday.id}-${matchId}-${half}`;\n      const lineup = normalizeLineupBench(selectedPlayday.id, matchId, half, lineups[key] || { assignments: {}, bench: [] });\n      return (\n        <div className=\"flex flex-wrap gap-0.5 items-end\">\n"""
    ),
    (
        """    const renderExpandedView = (matchId, half) => {\n      const key = `${selectedPlayday.id}-${matchId}-${half}`;\n      const lineup = lineups[key] || { assignments: {}, bench: [] };\n""",
        """    const renderExpandedView = (matchId, half) => {\n      const key = `${selectedPlayday.id}-${matchId}-${half}`;\n      const lineup = normalizeLineupBench(selectedPlayday.id, matchId, half, lineups[key] || { assignments: {}, bench: [] });\n"""
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit('expected source block not found:\n' + old[:180])
    text = text.replace(old, new, 1)

text = text.replace('Cannot publish this half yet:', 'Cannot validate this half yet:', 1)

old = """    const publication = { publishedAt: new Date().toISOString(), publishedBy: currentUsername || 'Coach' };\n    setPublishedHalves(prev => ({ ...prev, [key]: publication }));\n    logAction('publish_lineup', { playday_id: playdayId, match_id: matchId, half });\n"""
new = """    const publication = { publishedAt: new Date().toISOString(), publishedBy: currentUsername || 'Coach' };\n    setLineups(prev => ({\n      ...prev,\n      [key]: normalizeLineupBench(playdayId, matchId, half, prev[key] || { assignments: {}, bench: [] })\n    }));\n    setPublishedHalves(prev => ({ ...prev, [key]: publication }));\n    logAction('validate_lineup', { playday_id: playdayId, match_id: matchId, half });\n"""
if old not in text:
    raise SystemExit('publication block not found')
text = text.replace(old, new, 1)

old = """      } else {\n        const newAssignments = { ...prev.assignments };\n        delete newAssignments[posId];\n        return { ...prev, assignments: newAssignments };\n      }\n"""
new = """      } else {\n        const newAssignments = { ...prev.assignments };\n        const clearedPlayerId = newAssignments[posId];\n        delete newAssignments[posId];\n        const newBench = clearedPlayerId\n          ? [clearedPlayerId, ...(prev.bench || []).filter(id => id !== clearedPlayerId)]\n          : [...(prev.bench || [])];\n        return { ...prev, assignments: newAssignments, bench: newBench };\n      }\n"""
if old not in text:
    raise SystemExit('handleClearPosition field block not found')
text = text.replace(old, new, 1)

old_call = "getDynamicBenchSize(getEligiblePlayersForHalf(selectedPlayday.id, matchId, half, selectedPlayday.type === 'training' ? 'training' : 'game').length, positions.length)"
new_call = "getVisibleBenchSize(getEligiblePlayersForHalf(selectedPlayday.id, matchId, half, selectedPlayday.type === 'training' ? 'training' : 'game').length, lineup.assignments, lineup.bench)"
count = text.count(old_call)
if count < 2:
    raise SystemExit(f'expected at least two bench render calls, found {count}')
text = text.replace(old_call, new_call)

old = """                  {(selectedPosition.isBench ? lineup.bench?.[selectedPosition.benchIndex] : lineup.assignments[selectedPosition.posId]) && <button onClick={handleClearPosition} className=\"mb-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 border border-red-200\">Clear</button>}\n"""
new = """                  {!selectedPosition.isBench && lineup.assignments[selectedPosition.posId] && <button onClick={handleClearPosition} className=\"mb-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 border border-red-200\">Clear</button>}\n"""
if old not in text:
    raise SystemExit('Clear button block not found')
text = text.replace(old, new, 1)

text = text.replace("{publishedHalves[key] ? 'Published' : 'Draft'}", "{publishedHalves[key] ? 'Validated' : 'Draft'}")
text = text.replace("title={publishedHalves[key] ? 'Published lineup' : 'Validate and publish this half'}", "title={publishedHalves[key] ? 'Validated lineup' : 'Validate this half'}")
text = text.replace(">{publishedHalves[key] ? '✓ Published' : 'Publish'}</button>", ">{publishedHalves[key] ? '✓ Validated' : 'Validate'}</button>")
text = text.replace("publishedHalves: '📣 Published lineups'", "publishedHalves: '✅ Validated lineups'")

path.write_text(text, encoding='utf-8')
