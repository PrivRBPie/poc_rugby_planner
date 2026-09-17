from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')


def replace(old, new, label):
    global text
    if old not in text:
        if new in text:
            print(f'{label}: already applied')
            return
        raise RuntimeError(f'{label}: expected source text not found')
    text = text.replace(old, new, 1)
    print(f'{label}: applied')

replace(
"""  const benchHistory = useMemo(() => {
    const counts = {};
    players.forEach(p => counts[p.id] = 0);
    Object.values(currentSeasonLineups).forEach(lineup => {
      (lineup.bench || []).forEach(playerId => {
        if (playerId) counts[playerId] = (counts[playerId] || 0) + 1;
      });
    });
    return counts;
  }, [lineups, players]);""",
"""  const benchHistory = useMemo(() => {
    const counts = {};
    players.forEach(p => counts[p.id] = 0);
    Object.values(currentSeasonLineups).forEach(lineup => {
      (lineup.bench || []).forEach(playerId => {
        if (playerId) counts[playerId] = (counts[playerId] || 0) + 1;
      });
    });
    return counts;
  }, [currentSeasonLineups, players]);""",
'bench history dependencies')

replace(
"""  const fieldHistory = useMemo(() => {
    const counts = {};
    players.forEach(p => counts[p.id] = 0);
    Object.values(currentSeasonLineups).forEach(lineup => {
      Object.values(lineup.assignments || {}).forEach(playerId => {
        if (playerId) counts[playerId] = (counts[playerId] || 0) + 1;
      });
    });
    return counts;
  }, [lineups, players]);""",
"""  const fieldHistory = useMemo(() => {
    const counts = {};
    players.forEach(p => counts[p.id] = 0);
    Object.values(currentSeasonLineups).forEach(lineup => {
      Object.values(lineup.assignments || {}).forEach(playerId => {
        if (playerId) counts[playerId] = (counts[playerId] || 0) + 1;
      });
    });
    return counts;
  }, [currentSeasonLineups, players]);""",
'field history dependencies')

replace(
"""  const playerPositionCounts = useMemo(() => {
    const counts = {};
    Object.values(currentSeasonLineups).forEach(lineup => {
      Object.entries(lineup.assignments || {}).forEach(([posId, playerId]) => {
        if (!playerId) return;
        if (!counts[playerId]) counts[playerId] = {};
        counts[playerId][posId] = (counts[playerId][posId] || 0) + 1;
      });
    });
    return counts;
  }, [lineups]);""",
"""  const playerPositionCounts = useMemo(() => {
    const counts = {};
    Object.values(currentSeasonLineups).forEach(lineup => {
      Object.entries(lineup.assignments || {}).forEach(([posId, playerId]) => {
        if (!playerId) return;
        if (!counts[playerId]) counts[playerId] = {};
        counts[playerId][posId] = (counts[playerId][posId] || 0) + 1;
      });
    });
    return counts;
  }, [currentSeasonLineups]);""",
'position history dependencies')

replace(
"""    const totalRatings = Object.values(ratings);
    const star5Count = totalRatings.filter(r => r === 5).length;""",
"""    const activePlayerIdSet = new Set(activePlayers.map(player => String(player.id)));
    const totalRatings = Object.entries(ratings)
      .filter(([key]) => activePlayerIdSet.has(key.split('-')[0]))
      .map(([, rating]) => rating);
    const star5Count = totalRatings.filter(r => r === 5).length;""",
'active-player rating analytics')

replace(
"""      const nextInactivePlayerIds = Array.from(new Set([...inactivePlayerIds, playerId]));
      const nextAvailability = { ...availability, [playerId]: 'not-selected' };
      const nextSourceData = {
        players, playdays, lineups, ratings, training, favoritePositions, suitability, positionPreferences,
        publishedHalves, keyPositionMultiplier, allocationRules, availability: nextAvailability,
        learningPlayerConfig, satisfactionWeights, playerNotes,
        inactivePlayerIds: nextInactivePlayerIds,
        seasonStartDate
      };""",
"""      const nextInactivePlayerIds = Array.from(new Set([...inactivePlayerIds, playerId]));
      const nextAvailability = { ...availability, [playerId]: 'not-selected' };

      // Keep completed matches as historical evidence, but remove the player from
      // today's/upcoming lineups so they cannot remain scheduled for the old team.
      const today = new Date().toISOString().split('T')[0];
      const currentOrFuturePlaydayIds = new Set(
        playdays
          .filter(playday => !playday.date || playday.date >= today)
          .map(playday => String(playday.id))
      );
      const changedFutureLineupKeys = new Set();
      const nextSourceLineups = Object.fromEntries(
        Object.entries(lineups).map(([key, lineup]) => {
          const playdayId = String(key).split('-')[0];
          if (!currentOrFuturePlaydayIds.has(playdayId)) return [key, lineup];

          const hadPlayer = Object.values(lineup.assignments || {}).includes(playerId)
            || (lineup.bench || []).includes(playerId);
          if (!hadPlayer) return [key, lineup];

          changedFutureLineupKeys.add(key);
          return [key, {
            ...lineup,
            assignments: Object.fromEntries(
              Object.entries(lineup.assignments || {}).filter(([, assignedPlayerId]) => assignedPlayerId !== playerId)
            ),
            bench: (lineup.bench || []).filter(benchPlayerId => benchPlayerId !== playerId)
          }];
        })
      );
      const nextPublishedHalves = { ...publishedHalves };
      changedFutureLineupKeys.forEach(key => delete nextPublishedHalves[key]);

      const nextSourceData = {
        players, playdays, lineups: nextSourceLineups, ratings, training, favoritePositions, suitability, positionPreferences,
        publishedHalves: nextPublishedHalves, keyPositionMultiplier, allocationRules, availability: nextAvailability,
        learningPlayerConfig, satisfactionWeights, playerNotes,
        inactivePlayerIds: nextInactivePlayerIds,
        seasonStartDate
      };""",
'clear future source assignments on move')

replace(
"""      setInactivePlayerIds(nextInactivePlayerIds);
      setAvailability(nextAvailability);
      setRemoteUpdatedAt(updatedSource.updated_at);""",
"""      setInactivePlayerIds(nextInactivePlayerIds);
      setAvailability(nextAvailability);
      setLineups(nextSourceLineups);
      setPublishedHalves(nextPublishedHalves);
      setInitialState(prev => prev ? {
        ...prev,
        lineups: JSON.stringify(nextSourceLineups),
        publishedHalves: JSON.stringify(nextPublishedHalves),
        availability: JSON.stringify(nextAvailability)
      } : prev);
      setHasUnsavedChanges(false);
      setRemoteUpdatedAt(updatedSource.updated_at);""",
'sync local source state after move')

path.write_text(text, encoding='utf-8')
print('Verification fixes complete.')
