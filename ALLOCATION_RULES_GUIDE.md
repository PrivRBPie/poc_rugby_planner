# Rugby Lineup Planner - Allocation Rules System

## Overview

This document explains how the enhanced allocation rules system works in the Rugby Lineup Planner application. The system has been designed to provide intelligent, configurable lineup suggestions while maintaining full manual control.

---

## Table of Contents

1. [Key Features](#key-features)
2. [How Allocation Works](#how-allocation-works)
3. [Allocation Rules](#allocation-rules)
4. [Game vs Training Modes](#game-vs-training-modes)
5. [Manual Override Features](#manual-override-features)
6. [Understanding Allocation Insights](#understanding-allocation-insights)

---

## Key Features

### ✅ What Has Been Implemented

1. **New "Rules" Tab** - Configure allocation rules with weights and priorities
2. **Player Preference (Fun) Rule** - Optimize for player enjoyment by assigning favorite positions
3. **Game vs Training Toggle** - Different rule configurations for competitive games vs developmental training
4. **Weighted Scoring Algorithm** - Smart lineup suggestions based on configurable rule priorities
5. **Position Swap Feature** - Easily swap two players' positions with visual feedback
6. **Allocation Explanations** - See why each player was selected for their position
7. **Rule Reordering** - Change rule priority order (except locked rules)
8. **Weight Sliders** - Fine-tune the importance of each soft rule (0-100%)

---

## How Allocation Works

### Algorithm Overview

The allocation system uses a **weighted optimization approach**:

1. **Hard Constraints** are applied first (must be satisfied):
   - No duplicate assignments (player can only play one position per half)
   - Player must be trained for the position

2. **Soft Rules** are then scored and weighted:
   - Each enabled rule contributes points based on its weight
   - Rules are applied in priority order (top to bottom)
   - The player with the highest total score for each position is selected

### Scoring Formula

```
Total Score = Σ (Rule Score × Rule Weight)
```

For each player-position combination:
- **Equal Play Time**: `(maxFieldCount - playerFieldCount) × 0.80` (in game mode)
- **Optimize Half Score**: `(rating / 5) × 0.60` (in game mode)
- **Position Variety**: `(1 / (timesPlayed + 1)) × 0.40` (if enabled)
- **Player Preference**: `(isFavorite ? 1.0 : 0) × 0.70` (in game mode)

---

## Allocation Rules

### 1. No Duplicate Assignments (HARD) 🔒

**Type**: HARD constraint
**Locked**: Yes (cannot be disabled)
**Description**: A player can only play ONE position per half

**How it works**:
- Automatically filters out players already assigned in the current half
- Prevents double-booking a player to field and bench
- Cannot be turned off or adjusted

---

### 2. Equal Play Time (SOFT)

**Type**: SOFT optimization
**Default Weight**: 80% (Game) / 90% (Training)
**Description**: Each player should play the same amount of time within limits

**How it works**:
- Tracks field play history across all matches
- Prioritizes players with fewer field appearances
- Higher weight in Training mode for fairness emphasis

**Example**:
- Player A: 2 halves played → gets 0.80 × (3-2) = 0.80 points
- Player B: 3 halves played → gets 0.80 × (3-3) = 0.00 points
- Player A is prioritized for fairness

---

### 3. Available Players Limit (CONFIG)

**Type**: CONFIG setting
**Default**: 16 players
**Description**: Coach sets how many players are available for game experience

**How it works**:
- Filters the player pool for allocation
- Can be adjusted per game/training session
- Useful for managing squad rotation

---

### 4. Optimize Half Score (SOFT)

**Type**: SOFT optimization
**Default Weight**: 60% (Game) / 30% (Training)
**Description**: Prefer higher-rated players in each position

**How it works**:
- Uses position-specific skill ratings (1-5 stars)
- Higher ratings = higher priority for that position
- Significantly weighted in Game mode, less in Training mode

**Example**:
- Player with 5-star rating → gets 0.60 × (5/5) = 0.60 points
- Player with 3-star rating → gets 0.60 × (3/5) = 0.36 points

---

### 5. Position Variety (SOFT)

**Type**: SOFT optimization
**Default Weight**: 40% (Game) / 80% (Training)
**Enabled by default**: No (Game) / Yes (Training)
**Description**: Encourage players to try different positions over time

**How it works**:
- Tracks how many times each player has played each position
- Players with no experience at a position get higher scores
- Highly weighted in Training mode for development

**Example**:
- Player never played position → gets 0.80 × (1/1) = 0.80 points
- Player played position 2 times → gets 0.80 × (1/3) = 0.27 points

---

### 6. Player Preference (Fun) ⭐ NEW

**Type**: SOFT optimization
**Default Weight**: 70% (Game) / 50% (Training)
**Description**: Optimize for what players prefer/enjoy

**How it works**:
- Each player can mark up to 2 favorite positions (in Squad tab)
- Significant bonus when assigned to a favorite position
- Improves player happiness and engagement

**Example**:
- Player assigned to favorite position → gets 0.70 × 1.0 = 0.70 points
- Player assigned to non-favorite → gets 0.70 × 0 = 0.00 points

**Setting Favorites**:
1. Go to Squad tab
2. Expand a player card
3. Click on positions to mark as favorites (★)
4. Maximum 2 favorites per player

---

## Game vs Training Modes

### 🏆 Game Mode (Competitive)

**Optimized for winning matches**

Active Rules:
- ✅ No Duplicate Assignments (100% - locked)
- ✅ Equal Play Time (80%)
- ✅ Optimize Half Score (60%) ← Higher weight
- ✅ Player Preference (70%)
- ❌ Position Variety (disabled)

**Philosophy**: Prioritize skill ratings and player preferences to field the strongest, happiest lineup while maintaining basic fairness.

### 📚 Training Mode (Development)

**Optimized for player development**

Active Rules:
- ✅ No Duplicate Assignments (100% - locked)
- ✅ Equal Play Time (90%) ← Higher weight
- ✅ Optimize Half Score (30%) ← Lower weight
- ✅ Position Variety (80%) ← Enabled & high weight
- ✅ Player Preference (50%)

**Philosophy**: Maximize fairness and position variety to develop all players while still considering some skill matching and preferences.

### Switching Modes

1. Go to the **Rules** tab
2. Toggle between 🏆 Game Mode and 📚 Training Mode
3. The Auto Propose button will use the active mode settings
4. Button shows current mode: "Auto Propose (🏆)" or "Auto Propose (📚)"

---

## Manual Override Features

### 1a) Manual Position Assignment

**How to use**:
1. Go to Lineup tab
2. Expand a match half
3. Click on any position (field or bench)
4. Select a player from the candidates panel
5. The assignment is applied immediately

**Features**:
- Overrides any auto-proposed lineup
- Shows best matches and alternatives
- Prevents duplicate assignments with warnings
- Real-time validation

### 1b) Position Swap Feature 🔄

**How to use**:
1. In expanded lineup view, click "🔄 Swap Positions"
2. Click on the first player you want to swap
3. Click on the second player to complete the swap
4. Players instantly trade positions
5. Click "Cancel Swap" to exit swap mode

**Visual Feedback**:
- First selected player: Purple ring with "1" badge
- Other swappable players: Purple highlight
- Clear instructions shown above field

**Benefits**:
- Quick manual adjustments to auto-proposed lineups
- No need to clear and reassign
- Preserves other assignments

### 1c) Checking Rule Calculations

**Verify the algorithm**:
1. Use "Auto Propose" to generate a lineup
2. Click on any field position
3. View the "Why selected" explanation box
4. See individual rule contributions and total score
5. Compare with other candidates in the panel

**What you'll see**:
```
Why selected:
• Fair play: 2 halves played (0.80 pts)
• Skill rating: 4/5 stars (0.48 pts)
• Position variety: played 1× (0.40 pts)
• Favorite position! (0.70 pts)
Total: 2.38 pts
```

### 1d) Allocation Insights 💡

**Understanding why positions were assigned**:

When you use Auto Propose, you'll see:
1. **Blue info banner** at the top showing which mode was used
2. **"Why selected" box** when clicking positions (shows scoring breakdown)
3. **Mode indicator** on Auto Propose button (🏆 or 📚)

**Insight Components**:
- Rule contribution (e.g., "Fair play: 2 halves played (0.80 pts)")
- Scoring explanations for each active rule
- Total weighted score
- Mode used for allocation

### 1e) Rule Priority and Toggle Impact

**How rule order affects allocation**:

Rules are applied **top to bottom** in priority order. You can:
- **Reorder rules**: Use ↑ Move Up / ↓ Move Down buttons
- **Toggle rules on/off**: Click the green/gray switch
- **Adjust weights**: Drag the slider (0-100%)
- **Cannot move locked rules** (like "No Duplicate Assignments")

**Impact of turning rules off**:
- Rule no longer contributes to scoring
- Other rules maintain their weights
- Can completely change proposed lineups
- Useful for experimenting with different strategies

**Example Impact**:
- Turning OFF "Optimize Half Score" → Ignores skill ratings
- Turning ON "Position Variety" → Prioritizes developmental assignments
- Increasing "Player Preference" to 100% → Heavily favors favorite positions

---

## Training vs Game Toggle (Feature #2)

### Separate Rule Configurations

The system maintains **two independent rule configurations**:
1. **Game rules** - Used when mode is set to 🏆 Game
2. **Training rules** - Used when mode is set to 📚 Training

### Switching Behavior

When you toggle modes:
- All rule states (enabled/disabled, weights, order) are preserved separately
- Auto Propose uses the active mode's configuration
- Changes to one mode don't affect the other
- Each mode remembers your customizations

### Practical Usage

**Before a competitive match**:
1. Switch to 🏆 Game Mode
2. Ensure "Optimize Half Score" is weighted high
3. Consider enabling "Player Preference" for happiness
4. Use Auto Propose for strong lineup

**During training sessions**:
1. Switch to 📚 Training Mode
2. Ensure "Position Variety" is enabled
3. Weight "Equal Play Time" higher
4. Use Auto Propose for developmental rotation

---

## Best Practices

### For Coaches

1. **Set Favorites Early**: Ask players their preferred positions in Squad tab
2. **Use Game Mode for Tournaments**: Maximize win probability
3. **Use Training Mode for Development**: Build well-rounded players
4. **Review Allocation Insights**: Understand and explain assignments to players
5. **Manual Override When Needed**: Algorithm is a suggestion, not a mandate
6. **Adjust Weights Gradually**: Small changes can have big impacts
7. **Test Before Important Games**: Preview Auto Propose, then adjust manually

### For Understanding the System

1. **Start with defaults**: The preset weights are well-balanced
2. **Use Auto Propose first**: See what the algorithm suggests
3. **Check explanations**: Click positions to understand reasoning
4. **Experiment with modes**: Compare Game vs Training suggestions
5. **Customize gradually**: Adjust one rule at a time to see effects

---

## Technical Details

### Implementation Files

- **Main Component**: `src/App.jsx`
- **Rules State**: Lines 467-485 (game/training configurations)
- **Scoring Algorithm**: Lines 656-704 (`calculatePlayerPositionScore`)
- **Auto Propose**: Lines 706-752 (`proposeLineup`)
- **Swap Logic**: Lines 841-861 (`handleSwapPositions`)
- **Rules UI**: Lines 1323-1524 (`RulesView` component)

### Data Models

**Allocation Rule**:
```javascript
{
  id: number,
  name: string,
  type: 'HARD' | 'SOFT' | 'CONFIG',
  enabled: boolean,
  locked: boolean,
  weight: number (0.0-1.0),
  description: string,
  limit?: number (for CONFIG rules)
}
```

**Allocation Explanation**:
```javascript
{
  position: Position,
  player: Player,
  score: number,
  explanations: string[]
}
```

---

## Future Enhancements (Not Yet Implemented)

Potential additions:
- **More rules**: Teammate preferences, position exclusions, rest requirements
- **Rule templates**: Save and load custom rule configurations
- **Analytics**: Historical allocation fairness reports
- **Constraints**: Min/max field time per player per day
- **Machine Learning**: Learn optimal weights from past success

---

## Support & Feedback

This allocation system is designed to be:
- ✅ **Flexible**: Configure to your coaching philosophy
- ✅ **Transparent**: See why each decision was made
- ✅ **Controllable**: Always override with manual assignments
- ✅ **Fair**: Multiple fairness metrics and adjustable weights

For questions or suggestions, please refer to the application's help documentation or contact the development team.

---

**Version**: 1.0
**Last Updated**: 2026-01-01
**Author**: Rugby Planner Development Team
