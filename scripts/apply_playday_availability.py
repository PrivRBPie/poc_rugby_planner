from pathlib import Path

app = Path('src/App.jsx')
text = app.read_text()

old = """  const getHalfStatus = (playerId, playdayId, matchId, half) =>
    getAvailabilityStatus(availability, playerId, playdayId, matchId, half);

  const getEligiblePlayersForHalf = (playdayId, matchId, half, mode = 'game') =>
    activePlayers.filter(player => isEligibleForHalf(getHalfStatus(player.id, playdayId, matchId, half), mode));
"""
new = """  const getHalfStatus = (playerId, playdayId, matchId, half) =>
    getAvailabilityStatus(availability, playerId, playdayId, matchId, half);

  // Attendance eligibility is determined by the playday itself, not by which
  // optimisation rule set the coach happens to view/use.
  // Game day: Available only. Training day: Available + Train Only.
  const getPlaydayMode = (playdayId) =>
    playdays.find(pd => pd.id === playdayId)?.type === 'training' ? 'training' : 'game';

  const getEligiblePlayersForHalf = (playdayId, matchId, half) => {
    const mode = getPlaydayMode(playdayId);
    return activePlayers.filter(player => isEligibleForHalf(getHalfStatus(player.id, playdayId, matchId, half), mode));
  };
"""
if old not in text:
    raise SystemExit('eligible-player helper marker not found')
text = text.replace(old, new, 1)

old = """  const normalizeLineupBench = (playdayId, matchId, half, lineup) => {
    const assignments = { ...(lineup?.assignments || {}) };
    const existingBench = [...(lineup?.bench || [])].filter(Boolean);
    const assignedIds = new Set(Object.values(assignments).filter(Boolean));

    if (assignedIds.size === 0 && existingBench.length === 0) {
      return { ...(lineup || {}), assignments, bench: [] };
    }

    const playday = playdays.find(pd => pd.id === playdayId);
    const mode = playday?.type === 'training' ? 'training' : 'game';
    const eligibleIds = getEligiblePlayersForHalf(playdayId, matchId, half, mode).map(player => player.id);
    const eligibleSet = new Set(eligibleIds);

    const bench = existingBench.filter(id => eligibleSet.has(id) && !assignedIds.has(id));
    eligibleIds.forEach(id => {
      if (!assignedIds.has(id) && !bench.includes(id) && bench.length < 8) bench.push(id);
    });

    return { ...(lineup || {}), assignments, bench: bench.slice(0, 8) };
  };
"""
new = """  const normalizeLineupBench = (playdayId, matchId, half, lineup) => {
    const eligibleIds = getEligiblePlayersForHalf(playdayId, matchId, half).map(player => player.id);
    const eligibleSet = new Set(eligibleIds.map(String));

    // Never display/allocate an ineligible player in this half. This also cleans
    // stale lineups created before the availability rules were enforced strictly.
    const assignments = Object.fromEntries(
      Object.entries(lineup?.assignments || {}).filter(([, playerId]) => playerId && eligibleSet.has(String(playerId)))
    );
    const existingBench = [...(lineup?.bench || [])].filter(Boolean);
    const assignedIds = new Set(Object.values(assignments).filter(Boolean).map(String));

    if (assignedIds.size === 0 && existingBench.length === 0) {
      return { ...(lineup || {}), assignments, bench: [] };
    }

    const bench = existingBench.filter(id => eligibleSet.has(String(id)) && !assignedIds.has(String(id)));
    eligibleIds.forEach(id => {
      if (!assignedIds.has(String(id)) && !bench.some(benchId => String(benchId) === String(id)) && bench.length < 8) bench.push(id);
    });

    return { ...(lineup || {}), assignments, bench: bench.slice(0, 8) };
  };
"""
if old not in text:
    raise SystemExit('normalizeLineupBench marker not found')
text = text.replace(old, new, 1)

old = """  const setHalfAvailability = (playerId, playdayId, matchId, half, status) => {
    setAvailability(prev => ({ ...prev, [availabilityKey(playdayId, matchId, half, playerId)]: status }));
  };
"""
new = """  const setHalfAvailability = (playerId, playdayId, matchId, half, status) => {
    const normalizedStatus = normalizeAvailabilityStatus(status);
    const key = `${playdayId}-${matchId}-${half}`;
    setAvailability(prev => ({ ...prev, [availabilityKey(playdayId, matchId, half, playerId)]: normalizedStatus }));

    // If a status change makes a player ineligible for this playday, remove them
    // immediately from field and bench. Available remains eligible everywhere;
    // Train Only remains eligible only on training days.
    if (!isEligibleForHalf(normalizedStatus, getPlaydayMode(playdayId))) {
      setLineups(prev => {
        const existing = prev[key];
        if (!existing) return prev;
        const assignments = Object.fromEntries(
          Object.entries(existing.assignments || {}).filter(([, assignedPlayerId]) => String(assignedPlayerId) !== String(playerId))
        );
        const bench = (existing.bench || []).filter(benchPlayerId => String(benchPlayerId) !== String(playerId));
        return { ...prev, [key]: { ...existing, assignments, bench } };
      });
    }

    markHalfDraft(key);
  };
"""
if old not in text:
    raise SystemExit('setHalfAvailability marker not found')
text = text.replace(old, new, 1)

old = """    // A red × is a true hard block. Untrained players may still be assigned manually,
    // but a player explicitly blocked from this position may never be placed here.
    if (!isBench && getSuitability(playerId, posId) === 10) return;
"""
new = """    // Availability is a hard eligibility rule for both field and bench.
    // Game day: Available only. Training day: Available + Train Only.
    if (!isEligibleForHalf(getHalfStatus(playerId, playdayId, matchId, half), getPlaydayMode(playdayId))) return;

    // A red × is a true hard block. Untrained players may still be assigned manually,
    // but a player explicitly blocked from this position may never be placed here.
    if (!isBench && getSuitability(playerId, posId) === 10) return;
"""
if old not in text:
    raise SystemExit('manual assignment eligibility marker not found')
text = text.replace(old, new, 1)

old = """      setLineups(prev => ({ ...prev, [key]: { assignments: { ...prevLineup.assignments }, bench: [...(prevLineup.bench || [])] } }));
      markHalfDraft(key);
"""
new = """      const copiedLineup = normalizeLineupBench(playdayId, matchId, half, {
        assignments: { ...prevLineup.assignments },
        bench: [...(prevLineup.bench || [])],
      });
      setLineups(prev => ({ ...prev, [key]: copiedLineup }));
      markHalfDraft(key);
"""
if old not in text:
    raise SystemExit('copy previous lineup marker not found')
text = text.replace(old, new, 1)

old = """                  const availablePlayersCount = availablePlayers.length;
                  const unallocatedCount = availablePlayersCount - allocatedPlayerIds.size;
                  return `Unallocated available players: ${unallocatedCount}`;
"""
new = """                  const eligiblePlayersCount = getEligiblePlayersForHalf(selectedPlayday.id, matchId, half).length;
                  const unallocatedCount = Math.max(0, eligiblePlayersCount - allocatedPlayerIds.size);
                  const eligibilityLabel = selectedPlayday.type === 'training' ? 'eligible players' : 'available players';
                  return `Unallocated ${eligibilityLabel}: ${unallocatedCount}`;
"""
if old not in text:
    raise SystemExit('unallocated count marker not found')
text = text.replace(old, new, 1)

app.write_text(text)
