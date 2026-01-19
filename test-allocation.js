// Test script for fair allocation algorithm
const testData = {
  players: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20], // 17 unavailable
  positions: [1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15],
  halves: 6, // 3 matches × 2 halves
  ratings: {"1-1":4,"1-2":5,"1-3":4,"1-4":3,"1-5":3,"2-9":5,"4-1":5,"4-2":3,"4-3":5,"7-1":4,"7-2":5,"7-3":4,"7-4":5,"7-5":5,"1-15":5,"10-1":4,"10-2":3,"10-3":4,"10-4":5,"10-5":5,"12-4":5,"12-5":5,"13-9":5,"14-1":4,"14-2":5,"14-3":4,"14-4":3,"14-5":3,"16-1":5,"16-2":4,"16-3":5,"16-4":3,"16-5":3,"18-1":5,"18-2":5,"18-3":5,"18-4":4,"18-5":4,"19-1":5,"19-2":5,"19-3":5,"19-4":4,"19-5":4,"2-10":5,"2-12":3,"2-13":3,"2-15":5,"3-11":4,"3-12":4,"3-13":4,"3-14":4,"3-15":5,"4-11":2,"4-14":2,"4-15":3,"5-11":3,"5-12":4,"5-13":4,"5-14":3,"5-15":5,"6-11":5,"6-12":5,"6-13":5,"6-14":5,"8-11":4,"8-13":4,"8-14":3,"9-11":4,"9-12":4,"9-13":4,"9-14":4,"9-15":1,"11-11":2,"11-14":2,"12-11":5,"12-12":4,"12-13":4,"12-14":5,"12-15":5,"13-10":5,"13-12":5,"13-13":5,"13-15":4,"14-15":2,"15-10":2,"15-11":4,"15-12":4,"15-13":4,"15-14":4,"17-11":5,"17-14":5,"20-10":3,"20-11":3,"20-12":3,"20-13":3,"20-14":3},
  training: {"1-1":true,"1-2":true,"1-3":true,"1-4":true,"1-5":true,"2-9":true,"4-1":true,"4-2":true,"4-3":true,"7-1":true,"7-2":true,"7-3":true,"7-4":true,"7-5":true,"1-15":true,"10-1":true,"10-2":true,"10-3":true,"10-4":true,"10-5":true,"12-4":true,"12-5":true,"13-9":true,"14-1":true,"14-2":true,"14-3":true,"14-4":true,"14-5":true,"16-1":true,"16-2":true,"16-3":true,"16-4":true,"16-5":true,"18-1":true,"18-2":true,"18-3":true,"18-4":true,"18-5":true,"19-1":true,"19-2":true,"19-3":true,"19-4":true,"19-5":true,"2-10":true,"2-12":true,"2-13":true,"2-15":true,"3-11":true,"3-12":true,"3-13":true,"3-14":true,"3-15":true,"4-11":true,"4-14":true,"4-15":true,"5-11":true,"5-12":true,"5-13":true,"5-14":true,"5-15":true,"6-11":true,"6-12":true,"6-13":true,"6-14":true,"8-11":true,"8-13":true,"8-14":true,"9-11":true,"9-12":true,"9-13":true,"9-14":true,"9-15":true,"11-11":true,"11-14":true,"12-11":true,"12-12":true,"12-13":true,"12-14":true,"12-15":true,"13-10":true,"13-12":true,"13-13":true,"13-15":true,"14-15":true,"15-10":true,"15-11":true,"15-12":true,"15-13":true,"15-14":true,"17-11":true,"17-14":true,"20-10":true,"20-11":true,"20-12":true,"20-13":true,"20-14":true},
  favorites: {"1":[15,1,2,3],"2":[9,10],"3":[15,12,13],"4":[1,2,3,15],"5":[15],"6":[11,14],"7":[1,2,3,4,5],"8":[14,13,11],"9":[11,13,12,14],"10":[5,4,1,3],"11":[11,14],"12":[15],"13":[9,10],"14":[1,2,3,4,5],"15":[10,11,14],"16":[1,2,3,4,5],"17":[11,14],"18":[1,2,3,4,5],"19":[2,1,3],"20":[12,13,11,14]},
  rules: {
    fairPlayTime: 1.0,      // 100% - highest priority
    playerFun: 0.7,         // 70%
    playerSkill: 0.6,       // 60%
    positionVariety: 0.4,   // 40%
    learningOpp: 0.3        // 30%
  }
};

// PHASE 1: FAIR FIELD/BENCH DISTRIBUTION
// Goal: Ensure everyone plays approximately equal field time
function distributeFairFieldTime(players, halves, positionsPerHalf) {
  const totalFieldSlots = halves * positionsPerHalf;
  const idealFieldTimePerPlayer = totalFieldSlots / players.length;

  console.log(`\n=== FAIR DISTRIBUTION CALCULATION ===`);
  console.log(`Players: ${players.length}`);
  console.log(`Halves: ${halves}`);
  console.log(`Positions per half: ${positionsPerHalf}`);
  console.log(`Total field slots: ${totalFieldSlots}`);
  console.log(`Ideal field time per player: ${idealFieldTimePerPlayer.toFixed(2)}`);

  // Calculate target field times for each player
  const targetFieldTimes = {};
  players.forEach(p => {
    targetFieldTimes[p] = Math.round(idealFieldTimePerPlayer);
  });

  // Adjust to ensure sum equals total slots
  const targetSum = Object.values(targetFieldTimes).reduce((a, b) => a + b, 0);
  const adjustment = totalFieldSlots - targetSum;

  console.log(`Target sum: ${targetSum}, Adjustment needed: ${adjustment}`);

  if (adjustment !== 0) {
    for (let i = 0; i < Math.abs(adjustment); i++) {
      const player = players[i % players.length];
      targetFieldTimes[player] += Math.sign(adjustment);
    }
  }

  console.log(`\nTarget field times per player:`);
  players.forEach(p => {
    console.log(`  Player ${p}: ${targetFieldTimes[p]} field times`);
  });

  return targetFieldTimes;
}

// PHASE 2: ASSIGN FIELD SLOTS PER HALF
// Distribute field slots across halves to meet targets
function assignFieldSlotsPerHalf(players, targetFieldTimes, halves, positionsPerHalf) {
  console.log(`\n=== FIELD SLOT ASSIGNMENT ===`);

  const fieldPlayersPerHalf = []; // Array of arrays - which players on field each half
  const currentFieldCount = {}; // Track current assignments
  players.forEach(p => currentFieldCount[p] = 0);

  for (let half = 0; half < halves; half++) {
    // Select players who need field time most
    const candidates = [...players]
      .filter(p => currentFieldCount[p] < targetFieldTimes[p])
      .sort((a, b) => {
        const aNeeded = targetFieldTimes[a] - currentFieldCount[a];
        const bNeeded = targetFieldTimes[b] - currentFieldCount[b];
        if (aNeeded !== bNeeded) return bNeeded - aNeeded;
        return currentFieldCount[a] - currentFieldCount[b];
      });

    const selectedForField = candidates.slice(0, positionsPerHalf);
    fieldPlayersPerHalf.push(selectedForField);

    selectedForField.forEach(p => currentFieldCount[p]++);

    console.log(`Half ${half + 1}: ${selectedForField.length} players on field`);
  }

  console.log(`\nFinal field counts:`);
  players.forEach(p => {
    console.log(`  Player ${p}: ${currentFieldCount[p]}/${targetFieldTimes[p]} field times`);
  });

  return { fieldPlayersPerHalf, finalFieldCounts: currentFieldCount };
}

// PHASE 3: OPTIMIZE POSITION ASSIGNMENTS
// Within each half, assign specific positions to maximize objectives
// Use greedy algorithm with backtracking to ensure all positions filled
function optimizePositionAssignments(fieldPlayersPerHalf, positions, data) {
  console.log(`\n=== POSITION OPTIMIZATION ===`);

  const assignments = [];

  fieldPlayersPerHalf.forEach((fieldPlayers, halfIdx) => {
    console.log(`\nHalf ${halfIdx + 1}:`);

    // Build score matrix
    const scoreMatrix = {};
    positions.forEach(pos => {
      fieldPlayers.forEach(player => {
        const key = `${player}-${pos}`;
        let score = 0;

        // Training requirement (must have trained)
        if (!data.training[key]) {
          score = -1000; // Penalty for not trained
        } else {
          // Player skill
          const rating = data.ratings[key] || 0;
          score += rating * data.rules.playerSkill;

          // Player fun (favorite position)
          const favorites = data.favorites[player] || [];
          if (favorites.includes(pos)) {
            score += 5 * data.rules.playerFun;
          }
        }

        scoreMatrix[`${player}-${pos}`] = score;
      });
    });

    // Use greedy with best-first approach
    const halfAssignments = {};
    const assignedPlayers = new Set();
    const assignedPositions = new Set();

    // Sort all possible assignments by score
    const allPairs = [];
    positions.forEach(pos => {
      fieldPlayers.forEach(player => {
        const key = `${player}-${pos}`;
        allPairs.push({ player, pos, score: scoreMatrix[key] });
      });
    });
    allPairs.sort((a, b) => b.score - a.score);

    // Greedily assign best pairs
    allPairs.forEach(pair => {
      if (!assignedPlayers.has(pair.player) && !assignedPositions.has(pair.pos)) {
        halfAssignments[pair.pos] = pair.player;
        assignedPlayers.add(pair.player);
        assignedPositions.add(pair.pos);
        console.log(`  Position ${pair.pos} -> Player ${pair.player} (score: ${pair.score.toFixed(2)})`);
      }
    });

    // Check if all positions filled
    const unfilledPositions = positions.filter(pos => !assignedPositions.has(pos));
    if (unfilledPositions.length > 0) {
      console.log(`  ⚠️ WARNING: ${unfilledPositions.length} positions unfilled: ${unfilledPositions.join(', ')}`);
    }

    assignments.push(halfAssignments);
  });

  return assignments;
}

// MAIN ALGORITHM
function runFairAllocation() {
  console.log('=== RUGBY PLANNER - FAIR ALLOCATION TEST ===');

  // Phase 1: Calculate fair distribution
  const targetFieldTimes = distributeFairFieldTime(
    testData.players,
    testData.halves,
    testData.positions.length
  );

  // Phase 2: Assign field slots per half
  const { fieldPlayersPerHalf, finalFieldCounts } = assignFieldSlotsPerHalf(
    testData.players,
    targetFieldTimes,
    testData.halves,
    testData.positions.length
  );

  // Phase 3: Optimize position assignments
  const assignments = optimizePositionAssignments(
    fieldPlayersPerHalf,
    testData.positions,
    testData
  );

  // Validation
  console.log(`\n=== VALIDATION ===`);
  const fieldCounts = finalFieldCounts;
  const minField = Math.min(...Object.values(fieldCounts));
  const maxField = Math.max(...Object.values(fieldCounts));
  const deviation = maxField - minField;

  console.log(`Field time range: ${minField} - ${maxField}`);
  console.log(`Deviation: ${deviation} (target: ≤1)`);

  if (deviation <= 1) {
    console.log(`✅ FAIR DISTRIBUTION ACHIEVED!`);
  } else {
    console.log(`❌ UNFAIR: Deviation too high`);
  }

  return { assignments, fieldCounts };
}

// Run test
runFairAllocation();
