from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

replacements = [
    (
        "    const actualBenchSize = Math.max(0, eligiblePlayers.length - positions.length);",
        "    const actualBenchSize = getDynamicBenchSize(eligiblePlayers.length, positions.length);",
    ),
    (
        "    remainingPlayers.forEach(p => {\n      newBench.push(p.id);\n    });",
        "    remainingPlayers.forEach(p => {\n      if (newBench.length < actualBenchSize) newBench.push(p.id);\n    });",
    ),
    (
        "        .map(p => p.id);\n      bench.forEach(id => { benchCounts[id] = (benchCounts[id] || 0) + 1; });",
        "        .map(p => p.id)\n        .slice(0, getDynamicBenchSize(eligible.length, positions.length));\n      bench.forEach(id => { benchCounts[id] = (benchCounts[id] || 0) + 1; });",
    ),
    (
        "    const { playdayId, matchId, half, posId, isBench } = selectedPosition;",
        "    const { playdayId, matchId, half, posId, isBench, benchIndex } = selectedPosition;",
    ),
    (
        "      if (isBench) { if (!newBench.includes(playerId)) newBench.push(playerId); }\n      else newAssignments[posId] = playerId;",
        "      if (isBench) {\n        const mode = selectedPlayday?.type === 'training' ? 'training' : 'game';\n        const maxBenchSize = getDynamicBenchSize(getEligiblePlayersForHalf(playdayId, matchId, half, mode).length, positions.length);\n        if (benchIndex !== undefined && benchIndex < maxBenchSize) newBench[benchIndex] = playerId;\n        else if (!newBench.includes(playerId) && newBench.length < maxBenchSize) newBench.push(playerId);\n        newBench = newBench.filter(Boolean).slice(0, maxBenchSize);\n      } else newAssignments[posId] = playerId;",
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f'Expected source fragment not found:\n{old}')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
