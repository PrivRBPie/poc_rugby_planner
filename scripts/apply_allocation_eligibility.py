from pathlib import Path

app = Path('src/App.jsx')
text = app.read_text()

old = """  const getEligiblePlayersForHalf = (playdayId, matchId, half) => {
    const mode = getPlaydayMode(playdayId);
    return activePlayers.filter(player => isEligibleForHalf(getHalfStatus(player.id, playdayId, matchId, half), mode));
  };
"""
new = """  const getEligiblePlayersForHalf = (playdayId, matchId, half) => {
    const mode = getPlaydayMode(playdayId);
    return activePlayers.filter(player => isEligibleForHalf(getHalfStatus(player.id, playdayId, matchId, half), mode));
  };

  // Auto-allocation applies BOTH the playday restriction and the selected
  // allocation mode. A game playday is always Available-only. On a training
  // playday, Game allocation is Available-only while Training allocation may
  // also use Train Only players.
  const getAllocationEligiblePlayersForHalf = (playdayId, matchId, half, mode = allocationMode) => {
    const playdayMode = getPlaydayMode(playdayId);
    const eligibilityMode = playdayMode === 'game' || mode === 'game' ? 'game' : 'training';
    return activePlayers.filter(player => isEligibleForHalf(getHalfStatus(player.id, playdayId, matchId, half), eligibilityMode));
  };
"""
if old not in text:
    raise SystemExit('eligible helper marker not found')
text = text.replace(old, new, 1)

old = """  const proposeLineup = (playdayId, matchId, half, mode = allocationMode) => {
    const eligiblePlayers = getEligiblePlayersForHalf(playdayId, matchId, half, mode);
"""
new = """  const proposeLineup = (playdayId, matchId, half, mode = allocationMode) => {
    const eligiblePlayers = getAllocationEligiblePlayersForHalf(playdayId, matchId, half, mode);
"""
if old not in text:
    raise SystemExit('proposeLineup marker not found')
text = text.replace(old, new, 1)

old = """    halves.forEach(({ matchId, half }) => {
      const eligible = getEligiblePlayersForHalf(playdayId, matchId, half, mode);
      const totalSlotsForDay = halves.reduce((sum, h) => sum + Math.min(positions.length, getEligiblePlayersForHalf(playdayId, h.matchId, h.half, mode).length), 0);
      const target = eligible.length > 0 ? totalSlotsForDay / Math.max(1, players.filter(p => halves.some(h => getEligiblePlayersForHalf(playdayId, h.matchId, h.half, mode).some(ep => ep.id === p.id))).length) : 0;
"""
new = """    halves.forEach(({ matchId, half }) => {
      const eligible = getAllocationEligiblePlayersForHalf(playdayId, matchId, half, mode);
      const totalSlotsForDay = halves.reduce((sum, h) => sum + Math.min(positions.length, getAllocationEligiblePlayersForHalf(playdayId, h.matchId, h.half, mode).length), 0);
      const target = eligible.length > 0 ? totalSlotsForDay / Math.max(1, players.filter(p => halves.some(h => getAllocationEligiblePlayersForHalf(playdayId, h.matchId, h.half, mode).some(ep => ep.id === p.id))).length) : 0;
"""
if old not in text:
    raise SystemExit('full-day eligibility marker not found')
text = text.replace(old, new, 1)

app.write_text(text)
