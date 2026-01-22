// One-time script to fix player ratings and favorite positions in the database
// Run this in your browser console while the app is open

const fixedRatings = {
  // Player 1 - Eick
  '1-1': 4, '1-2': 5, '1-3': 4, '1-4': 3, '1-5': 3, '1-15': 5,
  // Player 2 - Janes
  '2-9': 5, '2-10': 5, '2-12': 3, '2-13': 3, '2-15': 5,
  // Player 3 - Esca
  '3-11': 4, '3-12': 4, '3-13': 4, '3-14': 4, '3-15': 5,
  // Player 4 - Huib
  '4-1': 5, '4-2': 3, '4-3': 5, '4-11': 2, '4-14': 2, '4-15': 3,
  // Player 5 - Dries
  '5-11': 3, '5-12': 4, '5-13': 4, '5-14': 3, '5-15': 5,
  // Player 6 - Liam
  '6-11': 5, '6-12': 5, '6-13': 5, '6-14': 5,
  // Player 7 - Francois
  '7-1': 4, '7-2': 5, '7-3': 4, '7-4': 5, '7-5': 5,
  // Player 8 - Lewis
  '8-11': 4, '8-13': 4, '8-14': 3,
  // Player 9 - Tobia
  '9-11': 4, '9-12': 4, '9-13': 4, '9-14': 4, '9-15': 1,
  // Player 10 - Alexander
  '10-1': 4, '10-2': 3, '10-3': 4, '10-4': 5, '10-5': 5,
  // Player 11 - Okke
  '11-11': 2, '11-14': 2,
  // Player 12 - Rosa
  '12-4': 5, '12-5': 5, '12-11': 5, '12-12': 4, '12-13': 4, '12-14': 5, '12-15': 5,
  // Player 13 - Yannick
  '13-9': 5, '13-10': 5, '13-12': 5, '13-13': 5, '13-15': 4,
  // Player 14 - Ot
  '14-1': 4, '14-2': 5, '14-3': 4, '14-4': 3, '14-5': 3, '14-15': 2,
  // Player 15 - Tjalle
  '15-10': 2, '15-11': 4, '15-12': 4, '15-13': 4, '15-14': 4,
  // Player 16 - Chris
  '16-1': 5, '16-2': 4, '16-3': 5, '16-4': 3, '16-5': 3,
  // Player 17 - Ivan
  '17-11': 5, '17-14': 5,
  // Player 18 - Edward
  '18-1': 5, '18-2': 5, '18-3': 5, '18-4': 4, '18-5': 4,
  // Player 19 - Teo
  '19-1': 5, '19-2': 5, '19-3': 5, '19-4': 4, '19-5': 4,
  // Player 20 - Hedwig
  '20-10': 3, '20-11': 3, '20-12': 3, '20-13': 3, '20-14': 3,
};

const fixedFavoritePositions = {
  1: [15, 1, 2, 3],        // Eick: Fullback, Loosehead, Hooker, Tighthead
  2: [9, 10],              // Janes: Scrumhalf, Flyhalf
  3: [15, 12, 13],         // Esca: Fullback, Inside Center, Outside Center
  4: [1, 2, 3, 15],        // Huib: Front row, Fullback
  5: [15],                 // Dries: Fullback
  6: [11, 14],             // Liam: Left Wing, Right Wing
  7: [1, 2, 3, 4, 5],      // Francois: Front row + Locks
  8: [14, 13, 11],         // Lewis: Right Wing, Outside Center, Left Wing
  9: [11, 13, 12, 14],     // Tobia: Wings and Centers
  10: [5, 4, 1, 3],        // Alexander: Lock, Flanker, Props
  11: [11, 14],            // Okke: Left Wing, Right Wing
  12: [15],                // Rosa: Fullback
  13: [9, 10],             // Yannick: Scrumhalf, Flyhalf
  14: [1, 2, 3, 4, 5],     // Ot: Front row + Locks
  15: [10, 11, 14],        // Tjalle: Flyhalf, Wings
  16: [1, 2, 3, 4, 5],     // Chris: Front row + Locks
  17: [11, 14],            // Ivan: Left Wing, Right Wing
  18: [1, 2, 3, 4, 5],     // Edward: Front row + Locks
  19: [2, 1, 3],           // Teo: Hooker, Props
  20: [12, 13, 11, 14],    // Hedwig: Centers and Wings
};

const fixedTraining = {
  // All rated combinations are trained
  '1-1': true, '1-2': true, '1-3': true, '1-4': true, '1-5': true, '1-15': true,
  '2-9': true, '2-10': true, '2-12': true, '2-13': true, '2-15': true,
  '3-11': true, '3-12': true, '3-13': true, '3-14': true, '3-15': true,
  '4-1': true, '4-2': true, '4-3': true, '4-11': true, '4-14': true, '4-15': true,
  '5-11': true, '5-12': true, '5-13': true, '5-14': true, '5-15': true,
  '6-11': true, '6-12': true, '6-13': true, '6-14': true,
  '7-1': true, '7-2': true, '7-3': true, '7-4': true, '7-5': true,
  '8-11': true, '8-13': true, '8-14': true,
  '9-11': true, '9-12': true, '9-13': true, '9-14': true, '9-15': true,
  '10-1': true, '10-2': true, '10-3': true, '10-4': true, '10-5': true,
  '11-11': true, '11-14': true,
  '12-4': true, '12-5': true, '12-11': true, '12-12': true, '12-13': true, '12-14': true, '12-15': true,
  '13-9': true, '13-10': true, '13-12': true, '13-13': true, '13-15': true,
  '14-1': true, '14-2': true, '14-3': true, '14-4': true, '14-5': true, '14-15': true,
  '15-10': true, '15-11': true, '15-12': true, '15-13': true, '15-14': true,
  '16-1': true, '16-2': true, '16-3': true, '16-4': true, '16-5': true,
  '17-11': true, '17-14': true,
  '18-1': true, '18-2': true, '18-3': true, '18-4': true, '18-5': true,
  '19-1': true, '19-2': true, '19-3': true, '19-4': true, '19-5': true,
  '20-10': true, '20-11': true, '20-12': true, '20-13': true, '20-14': true,
};

console.log('Fixed data prepared. Copy and paste this into your app state:');
console.log('Ratings:', JSON.stringify(fixedRatings, null, 2));
console.log('Favorite Positions:', JSON.stringify(fixedFavoritePositions, null, 2));
console.log('Training:', JSON.stringify(fixedTraining, null, 2));
