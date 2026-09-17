from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

replacements = [
    (
        "import { availabilityKey, getAvailabilityStatus, isEligibleForHalf, getDynamicBenchSize, cleanupLineupsForPlayday, cleanupLineupsForMatch, getHistoryRange, validateAssignment, validateLineupForPublish, normalizeAvailabilityStatus, normalizeSuitability, preferenceScore } from './domain/planner';",
        "import { availabilityKey, getAvailabilityStatus, isEligibleForHalf, getDynamicBenchSize, cleanupLineupsForPlayday, cleanupLineupsForMatch, getHistoryRange, validateLineupForPublish, normalizeAvailabilityStatus, normalizeSuitability, preferenceScore } from './domain/planner';",
    ),
    (
        "    return getEligiblePlayersForHalf(playdayId, matchId, half, allocationMode).map(p => {",
        "    return getEligiblePlayersForHalf(playdayId, matchId, half, allocationMode)\n      .filter(p => forBench || getSuitability(p.id, positionId) !== 10)\n      .map(p => {",
    ),
    (
        "    if (!isBench) {\n      const status = getHalfStatus(playerId, playdayId, matchId, half);\n      const trainedForPosition = training[`${playerId}-${posId}`] || false;\n      const violations = validateAssignment({\n        status,\n        mode: selectedPlayday?.type === 'training' ? 'training' : 'game',\n        trained: trainedForPosition,\n        duplicate: false,\n        suitability: getSuitability(playerId, posId),\n      });\n      if (violations.length > 0) {\n        const reason = window.prompt(`Coach override required:\\n\\n${violations.join(\"\\n\")}\\n\\nEnter an override reason to continue, or Cancel to stop.`);\n        if (!reason?.trim()) return;\n        logAction('coach_override', { player_id: playerId, position_id: posId, playday_id: playdayId, match_id: matchId, half, reason: reason.trim(), violations });\n      }\n    }",
        "    // A red × is a true hard block. Untrained players may still be assigned manually,\n    // but a player explicitly blocked from this position may never be placed here.\n    if (!isBench && getSuitability(playerId, posId) === 10) return;",
    ),
    (
        "                            <div className=\"pt-1\">\n                              <select\n                                value={getHalfStatus(currentPlayerId, selectedPlayday.id, matchId, half)}\n                                onChange={(e) => setHalfAvailability(currentPlayerId, selectedPlayday.id, matchId, half, e.target.value)}\n                                className=\"w-full border border-gray-300 rounded px-1 py-0.5 text-[9px] bg-white\"\n                              >\n                                {availabilityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}\n                              </select>\n                            </div>\n",
        "",
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f'Expected source fragment not found:\n{old}')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
