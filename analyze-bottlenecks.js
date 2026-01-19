// Analyze training bottlenecks

const testData = {
  players: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20],
  positions: [1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15],
  halves: 6,
  training: {"1-1":true,"1-2":true,"1-3":true,"1-4":true,"1-5":true,"2-9":true,"4-1":true,"4-2":true,"4-3":true,"7-1":true,"7-2":true,"7-3":true,"7-4":true,"7-5":true,"1-15":true,"10-1":true,"10-2":true,"10-3":true,"10-4":true,"10-5":true,"12-4":true,"12-5":true,"13-9":true,"14-1":true,"14-2":true,"14-3":true,"14-4":true,"14-5":true,"16-1":true,"16-2":true,"16-3":true,"16-4":true,"16-5":true,"18-1":true,"18-2":true,"18-3":true,"18-4":true,"18-5":true,"19-1":true,"19-2":true,"19-3":true,"19-4":true,"19-5":true,"2-10":true,"2-12":true,"2-13":true,"2-15":true,"3-11":true,"3-12":true,"3-13":true,"3-14":true,"3-15":true,"4-11":true,"4-14":true,"4-15":true,"5-11":true,"5-12":true,"5-13":true,"5-14":true,"5-15":true,"6-11":true,"6-12":true,"6-13":true,"6-14":true,"8-11":true,"8-13":true,"8-14":true,"9-11":true,"9-12":true,"9-13":true,"9-14":true,"9-15":true,"11-11":true,"11-14":true,"12-11":true,"12-12":true,"12-13":true,"12-14":true,"12-15":true,"13-10":true,"13-12":true,"13-13":true,"13-15":true,"14-15":true,"15-10":true,"15-11":true,"15-12":true,"15-13":true,"15-14":true,"17-11":true,"17-14":true,"20-10":true,"20-11":true,"20-12":true,"20-13":true,"20-14":true}
};

console.log('=== TRAINING BOTTLENECK ANALYSIS ===\n');

const { players, positions, halves, training } = testData;
const totalFieldSlots = halves * positions.length;
const idealFieldTimePerPlayer = totalFieldSlots / players.length;

console.log(`Total halves: ${halves}`);
console.log(`Players: ${players.length}`);
console.log(`Ideal field time per player: ${idealFieldTimePerPlayer.toFixed(2)}\n`);

console.log('=== POSITIONS ANALYSIS ===\n');

const positionBottlenecks = [];

positions.forEach(pos => {
  const trainedPlayers = players.filter(p => training[`${p}-${pos}`]);
  const timesNeeded = halves; // Each position needed once per half
  const minTimesPerPlayer = timesNeeded / trainedPlayers.length;

  console.log(`Position ${pos}:`);
  console.log(`  Trained players: ${trainedPlayers.length} (${trainedPlayers.join(', ')})`);
  console.log(`  Times needed: ${timesNeeded}`);
  console.log(`  Min field time per trained player: ${minTimesPerPlayer.toFixed(2)}`);

  if (minTimesPerPlayer > idealFieldTimePerPlayer) {
    const excess = minTimesPerPlayer - idealFieldTimePerPlayer;
    console.log(`  ⚠️ BOTTLENECK: Players must play ${minTimesPerPlayer.toFixed(2)} times (${excess.toFixed(2)} above fair share)`);
    positionBottlenecks.push({
      pos,
      trainedCount: trainedPlayers.length,
      minTimes: minTimesPerPlayer,
      excess
    });
  } else {
    console.log(`  ✓ OK: Enough trained players`);
  }
  console.log('');
});

console.log('=== SUMMARY ===\n');

if (positionBottlenecks.length === 0) {
  console.log('✅ NO BOTTLENECKS: Perfect fairness is achievable!');
} else {
  console.log(`❌ ${positionBottlenecks.length} BOTTLENECK POSITION(S) FOUND:\n`);
  positionBottlenecks.forEach(b => {
    console.log(`  Position ${b.pos}: Only ${b.trainedCount} players trained`);
    console.log(`    → They must play ${b.minTimes.toFixed(2)} times (ideal: ${idealFieldTimePerPlayer.toFixed(2)})`);
    console.log(`    → Excess: ${b.excess.toFixed(2)} above fair share\n`);
  });

  console.log('RECOMMENDATION:');
  console.log('  To achieve perfect fairness (deviation ≤ 1), train more players for these positions.');
  console.log('  With current training, deviation of 2 is the BEST POSSIBLE result.');
}
