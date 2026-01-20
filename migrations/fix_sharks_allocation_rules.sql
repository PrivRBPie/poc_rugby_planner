-- Migration: Fix Sharks Team AllocationRules Structure
-- Description: Update allocationRules from incorrect object format to correct array format

UPDATE rugby_data
SET data = jsonb_set(
  data,
  '{allocationRules}',
  '{
    "game": [
      {"id": 1, "name": "No Duplicate Assignments", "type": "HARD", "enabled": true, "locked": true, "weight": 1.0, "description": "A player can only play ONE position per half"},
      {"id": 7, "name": "Must Be Trained", "type": "HARD", "enabled": true, "locked": true, "weight": 1.0, "description": "Player must have trained for this position (game mode only)"},
      {"id": 2, "name": "Fair PlayTime", "type": "SOFT", "enabled": true, "locked": false, "weight": 0.80, "description": "Each player should play the same amount of time within limits"},
      {"id": 3, "name": "Learning Opportunities", "type": "SOFT", "enabled": true, "locked": false, "weight": 0.30, "description": "Prefer less experienced players for growth opportunities", "limit": 6},
      {"id": 4, "name": "Player Skill", "type": "SOFT", "enabled": true, "locked": false, "weight": 0.60, "description": "Prefer higher-rated players in each position"},
      {"id": 5, "name": "Position Variety", "type": "SOFT", "enabled": false, "locked": false, "weight": 0.40, "description": "Encourage players to try different positions over time"},
      {"id": 6, "name": "Player Fun", "type": "SOFT", "enabled": true, "locked": false, "weight": 0.70, "description": "Assign players to their favorite positions"}
    ],
    "training": [
      {"id": 1, "name": "No Duplicate Assignments", "type": "HARD", "enabled": true, "locked": true, "weight": 1.0, "description": "A player can only play ONE position per half"},
      {"id": 2, "name": "Fair PlayTime", "type": "SOFT", "enabled": true, "locked": false, "weight": 0.90, "description": "Each player should play the same amount of time within limits"},
      {"id": 3, "name": "Learning Opportunities", "type": "SOFT", "enabled": true, "locked": false, "weight": 0.70, "description": "Prefer less experienced players for growth opportunities", "limit": 12},
      {"id": 4, "name": "Player Skill", "type": "SOFT", "enabled": false, "locked": false, "weight": 0.30, "description": "Prefer higher-rated players in each position"},
      {"id": 5, "name": "Position Variety", "type": "SOFT", "enabled": true, "locked": false, "weight": 0.80, "description": "Encourage players to try different positions over time"},
      {"id": 6, "name": "Player Fun", "type": "SOFT", "enabled": true, "locked": false, "weight": 0.50, "description": "Assign players to their favorite positions"}
    ]
  }'::jsonb
)
WHERE team_id = (SELECT id FROM teams WHERE name = 'Sharks Mini''s');

-- Verification
SELECT
  team_name,
  jsonb_array_length(data->'allocationRules'->'game') as game_rules_count,
  jsonb_array_length(data->'allocationRules'->'training') as training_rules_count
FROM rugby_data
WHERE team_id = (SELECT id FROM teams WHERE name = 'Sharks Mini''s');

-- Expected output:
-- team_name: Sharks Mini's
-- game_rules_count: 7
-- training_rules_count: 6
