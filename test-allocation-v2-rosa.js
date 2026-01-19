// Test script for fair allocation algorithm V2 with Rosa On trained for position 9
// Testing: What if we add one more player to position 9?

const testData = {
  players: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20],
  positions: [1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15],
  halves: 6,
  ratings: {"1-1":4,"1-2":5,"1-3":4,"1-4":3,"1-5":3,"2-9":5,"4-1":5,"4-2":3,"4-3":5,"7-1":4,"7-2":5,"7-3":4,"7-4":5,"7-5":5,"1-15":5,"10-1":4,"10-2":3,"10-3":4,"10-4":5,"10-5":5,"12-4":5,"12-5":5,"13-9":5,"14-1":4,"14-2":5,"14-3":4,"14-4":3,"14-5":3,"16-1":5,"16-2":4,"16-3":5,"16-4":3,"16-5":3,"18-1":5,"18-2":5,"18-3":5,"18-4":4,"18-5":4,"19-1":5,"19-2":5,"19-3":5,"19-4":4,"19-5":4,"2-10":5,"2-12":3,"2-13":3,"2-15":5,"3-11":4,"3-12":4,"3-13":4,"3-14":4,"3-15":5,"4-11":2,"4-14":2,"4-15":3,"5-11":3,"5-12":4,"5-13":4,"5-14":3,"5-15":5,"6-11":5,"6-12":5,"6-13":5,"6-14":5,"8-11":4,"8-13":4,"8-14":3,"9-11":4,"9-12":4,"9-13":4,"9-14":4,"9-15":1,"11-11":2,"11-14":2,"12-11":5,"12-12":4,"12-13":4,"12-14":5,"12-15":5,"13-10":5,"13-12":5,"13-13":5,"13-15":4,"14-15":2,"15-10":2,"15-11":4,"15-12":4,"15-13":4,"15-14":4,"17-11":5,"17-14":5,"20-10":3,"20-11":3,"20-12":3,"20-13":3,"20-14":3,
    // ADD: Rosa On (let's assume player 19) trained for position 9 with rating 3
    "19-9":3
  },
  training: {"1-1":true,"1-2":true,"1-3":true,"1-4":true,"1-5":true,"2-9":true,"4-1":true,"4-2":true,"4-3":true,"7-1":true,"7-2":true,"7-3":true,"7-4":true,"7-5":true,"1-15":true,"10-1":true,"10-2":true,"10-3":true,"10-4":true,"10-5":true,"12-4":true,"12-5":true,"13-9":true,"14-1":true,"14-2":true,"14-3":true,"14-4":true,"14-5":true,"16-1":true,"16-2":true,"16-3":true,"16-4":true,"16-5":true,"18-1":true,"18-2":true,"18-3":true,"18-4":true,"18-5":true,"19-1":true,"19-2":true,"19-3":true,"19-4":true,"19-5":true,"2-10":true,"2-12":true,"2-13":true,"2-15":true,"3-11":true,"3-12":true,"3-13":true,"3-14":true,"3-15":true,"4-11":true,"4-14":true,"4-15":true,"5-11":true,"5-12":true,"5-13":true,"5-14":true,"5-15":true,"6-11":true,"6-12":true,"6-13":true,"6-14":true,"8-11":true,"8-13":true,"8-14":true,"9-11":true,"9-12":true,"9-13":true,"9-14":true,"9-15":true,"11-11":true,"11-14":true,"12-11":true,"12-12":true,"12-13":true,"12-14":true,"12-15":true,"13-10":true,"13-12":true,"13-13":true,"13-15":true,"14-15":true,"15-10":true,"15-11":true,"15-12":true,"15-13":true,"15-14":true,"17-11":true,"17-14":true,"20-10":true,"20-11":true,"20-12":true,"20-13":true,"20-14":true,
    // ADD: Rosa On (player 19) trained for position 9
    "19-9":true
  },
  favorites: {"1":[15,1,2,3],"2":[9,10],"3":[15,12,13],"4":[1,2,3,15],"5":[15],"6":[11,14],"7":[1,2,3,4,5],"8":[14,13,11],"9":[11,13,12,14],"10":[5,4,1,3],"11":[11,14],"12":[15],"13":[9,10],"14":[1,2,3,4,5],"15":[10,11,14],"16":[1,2,3,4,5],"17":[11,14],"18":[1,2,3,4,5],"19":[2,1,3],"20":[12,13,11,14]},
  rules: {
    fairPlayTime: 1.0,
    playerFun: 0.7,
    playerSkill: 0.6,
    positionVariety: 0.4,
    learningOpp: 0.3
  }
};

// Iterative approach: Assign halves one by one, always choosing assignments that maintain fairness
function runFairAllocationV2() {
  console.log('=== TESTING: Rosa On (Player 19) TRAINED FOR POSITION 9 ===\n');

  const { players, positions, halves, rules } = testData;
  const positionsPerHalf = positions.length;
  const totalFieldSlots = halves * positionsPerHalf;
  const idealFieldTimePerPlayer = totalFieldSlots / players.length;

  console.log(`Players: ${players.length}`);
  console.log(`Halves: ${halves}`);
  console.log(`Positions per half: ${positionsPerHalf}`);
  console.log(`Total field slots: ${totalFieldSlots}`);
  console.log(`Ideal field time per player: ${idealFieldTimePerPlayer.toFixed(2)}`);

  // Check position 9 trained players
  const pos9Trained = players.filter(p => testData.training[`${p}-9`]);
  console.log(`\nPosition 9 trained players: ${pos9Trained.length} (${pos9Trained.join(', ')})`);
  console.log(`Min times per player for position 9: ${(halves / pos9Trained.length).toFixed(2)}\n`);

  const fieldCounts = {};
  players.forEach(p => fieldCounts[p] = 0);

  const allAssignments = [];

  // For each half, assign positions
  for (let halfIdx = 0; halfIdx < halves; halfIdx++) {
    console.log(`\n=== HALF ${halfIdx + 1} ===`);

    // Calculate fairness scores for each player (how much they need field time)
    const fairnessScores = {};
    players.forEach(p => {
      const currentRatio = fieldCounts[p] / (halfIdx + 1);
      const targetRatio = idealFieldTimePerPlayer / halves;
      fairnessScores[p] = targetRatio - currentRatio; // Positive = needs more field time
    });

    // Build score matrix for this half
    const candidateAssignments = [];

    positions.forEach(pos => {
      players.forEach(player => {
        const key = `${player}-${pos}`;
        let score = 0;

        // Training requirement (HARD - must be trained)
        if (!testData.training[key]) {
          return; // Skip untrained combinations
        }

        // Fairness (weighted heavily by rule weight)
        const fairnessComponent = fairnessScores[player] * rules.fairPlayTime * 50; // Scale up significantly
        score += fairnessComponent;

        // Player skill
        const rating = testData.ratings[key] || 0;
        score += rating * rules.playerSkill;

        // Player fun
        const favorites = testData.favorites[player] || [];
        if (favorites.includes(pos)) {
          score += 5 * rules.playerFun;
        }

        candidateAssignments.push({ player, pos, score, fairnessComponent });
      });
    });

    // Greedy assignment: pick best pairs without conflicts
    candidateAssignments.sort((a, b) => b.score - a.score);

    const halfAssignments = {};
    const assignedPlayers = new Set();
    const assignedPositions = new Set();

    candidateAssignments.forEach(candidate => {
      if (!assignedPlayers.has(candidate.player) && !assignedPositions.has(candidate.pos)) {
        halfAssignments[candidate.pos] = candidate.player;
        assignedPlayers.add(candidate.player);
        assignedPositions.add(candidate.pos);
      }
    });

    // Update field counts
    assignedPlayers.forEach(p => fieldCounts[p]++);

    // Show position 9 assignment
    if (halfAssignments[9]) {
      console.log(`  Position 9 -> Player ${halfAssignments[9]}`);
    }

    allAssignments.push(halfAssignments);
  }

  // Final validation
  console.log(`\n=== FINAL VALIDATION ===`);
  console.log('\nField counts per player:');
  players.forEach(p => {
    const benchCount = halves - fieldCounts[p];
    console.log(`  Player ${p}: ${fieldCounts[p]} field / ${benchCount} bench`);
  });

  const minField = Math.min(...Object.values(fieldCounts));
  const maxField = Math.max(...Object.values(fieldCounts));
  const deviation = maxField - minField;

  console.log(`\nField time range: ${minField} - ${maxField}`);
  console.log(`Deviation: ${deviation}`);

  if (deviation <= 1) {
    console.log(`✅ EXCELLENT: Deviation ≤ 1`);
  } else if (deviation <= 2) {
    console.log(`✓ GOOD: Deviation ≤ 2`);
  } else {
    console.log(`❌ POOR: Deviation > 2`);
  }

  // Check position 9 usage
  console.log(`\nPosition 9 usage:`);
  const pos9Usage = {};
  allAssignments.forEach(half => {
    const player = half[9];
    if (player) {
      pos9Usage[player] = (pos9Usage[player] || 0) + 1;
    }
  });
  Object.entries(pos9Usage).forEach(([player, count]) => {
    console.log(`  Player ${player}: ${count} times`);
  });

  return { assignments: allAssignments, fieldCounts };
}

runFairAllocationV2();
