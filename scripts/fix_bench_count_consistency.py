from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')

old = "const matchLineup = lineups[lineupKey] || { assignments: {}, bench: [] };"
new = "const matchLineup = normalizeLineupBench(playdayIdForBenchCount, m.id, h, lineups[lineupKey] || { assignments: {}, bench: [] });"

# We intentionally patch the three playday bench-count loops separately so each
# uses the same effective automatic bench that is rendered on screen.

# 1) Candidate scoring / playday counts
candidate_old = """      playday.matches.forEach(m => {\n        [1, 2].forEach(h => {\n          const lineupKey = `${playdayId}-${m.id}-${h}`;\n          const matchLineup = lineups[lineupKey] || { assignments: {}, bench: [] };\n          (matchLineup.bench || []).forEach(playerId => {\n"""
candidate_new = """      playday.matches.forEach(m => {\n        [1, 2].forEach(h => {\n          const lineupKey = `${playdayId}-${m.id}-${h}`;\n          const matchLineup = normalizeLineupBench(playdayId, m.id, h, lineups[lineupKey] || { assignments: {}, bench: [] });\n          (matchLineup.bench || []).forEach(playerId => {\n"""
if candidate_old not in text:
    raise SystemExit('candidate bench-count block not found')
text = text.replace(candidate_old, candidate_new, 1)

# 2) Bench button orange-dot count
bench_button_old = """          selectedPlayday.matches.forEach(m => {\n            [1, 2].forEach(h => {\n              const lineupKey = `${selectedPlayday.id}-${m.id}-${h}`;\n              const matchLineup = lineups[lineupKey] || { assignments: {}, bench: [] };\n              if (matchLineup.bench?.includes(player.id)) playdayBenchCount++;\n"""
bench_button_new = """          selectedPlayday.matches.forEach(m => {\n            [1, 2].forEach(h => {\n              const lineupKey = `${selectedPlayday.id}-${m.id}-${h}`;\n              const matchLineup = normalizeLineupBench(selectedPlayday.id, m.id, h, lineups[lineupKey] || { assignments: {}, bench: [] });\n              if (matchLineup.bench?.includes(player.id)) playdayBenchCount++;\n"""
if bench_button_old not in text:
    raise SystemExit('bench button count block not found')
text = text.replace(bench_button_old, bench_button_new, 1)

# 3) Selected player Field/Bench stats card
stats_old = """                      selectedPlayday.matches.forEach(m => {\n                        [1, 2].forEach(h => {\n                          const lineupKey = `${selectedPlayday.id}-${m.id}-${h}`;\n                          const matchLineup = lineups[lineupKey] || { assignments: {}, bench: [] };\n                          if (Object.values(matchLineup.assignments).includes(currentPlayerId)) {\n"""
stats_new = """                      selectedPlayday.matches.forEach(m => {\n                        [1, 2].forEach(h => {\n                          const lineupKey = `${selectedPlayday.id}-${m.id}-${h}`;\n                          const matchLineup = normalizeLineupBench(selectedPlayday.id, m.id, h, lineups[lineupKey] || { assignments: {}, bench: [] });\n                          if (Object.values(matchLineup.assignments).includes(currentPlayerId)) {\n"""
if stats_old not in text:
    raise SystemExit('selected player stats block not found')
text = text.replace(stats_old, stats_new, 1)

path.write_text(text, encoding='utf-8')
