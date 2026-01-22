// Script to recover players array from existing Bulls team data
// Run this in browser console on the Bulls team

const recoverPlayers = () => {
  // Extract all unique player IDs from ratings, training, favoritePositions
  const playerIdsSet = new Set();

  // Get from ratings (format: "playerId-positionId")
  Object.keys(ratings).forEach(key => {
    const playerId = parseInt(key.split('-')[0]);
    if (!isNaN(playerId)) playerIdsSet.add(playerId);
  });

  // Get from training
  Object.keys(training).forEach(key => {
    const playerId = parseInt(key.split('-')[0]);
    if (!isNaN(playerId)) playerIdsSet.add(playerId);
  });

  // Get from favoritePositions
  Object.keys(favoritePositions).forEach(key => {
    const playerId = parseInt(key);
    if (!isNaN(playerId)) playerIdsSet.add(playerId);
  });

  // Get from lineups
  Object.values(lineups).forEach(lineup => {
    Object.values(lineup.assignments || {}).forEach(playerId => {
      if (typeof playerId === 'number') playerIdsSet.add(playerId);
    });
    (lineup.bench || []).forEach(playerId => {
      if (typeof playerId === 'number') playerIdsSet.add(playerId);
    });
  });

  const playerIds = Array.from(playerIdsSet).sort((a, b) => a - b);

  console.log('Found player IDs:', playerIds);

  // Default player names based on your original data
  const playerNames = {
    1: 'Eick Soe',
    2: 'Janes',
    3: 'Esca',
    4: 'Huib Schr',
    5: 'Dries',
    6: 'Liam',
    7: 'Francois Ross',
    8: 'Lewis',
    9: 'Tobia',
    10: 'Alexander Jans',
    11: 'Okke',
    12: 'Rosa On',
    13: 'Yannick',
    14: 'Ot Dubbe',
    15: 'Tjalle',
    16: 'Chris Klin',
    17: 'Ivan',
    18: 'Edward Serf',
    19: 'Teo Gorri',
    20: 'Hedwig',
    46: 'New Player' // Unknown player ID 46
  };

  // Reconstruct players array
  const recoveredPlayers = playerIds.map(id => ({
    id: id,
    name: playerNames[id] || `Player ${id}`,
    miniYear: id <= 10 ? '1st year' : '2nd year' // Guess based on ID
  }));

  console.log('Recovered players:', recoveredPlayers);
  console.log('Total:', recoveredPlayers.length, 'players');

  // Set players in app
  setPlayers(recoveredPlayers);

  console.log('✅ Players recovered! Now click Save to write to database.');

  return recoveredPlayers;
};

// Run recovery
recoverPlayers();
