-- Migration: Add Multi-Team Support
-- Description: Create teams table and link rugby_data to teams

-- Step 1: Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT
);

-- Step 2: Add team_id column to rugby_data table
ALTER TABLE rugby_data
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

-- Step 3: Create initial teams (Bulls and Sharks)
INSERT INTO teams (name, logo, created_by)
VALUES
  ('Bulls Mini''s', '🐂', 'system'),
  ('Sharks Mini''s', '🦈', 'system');

-- Step 4: Link existing rugby_data to Bulls team
-- Get the Bulls team ID and update the first rugby_data record
UPDATE rugby_data
SET team_id = (SELECT id FROM teams WHERE name = 'Bulls Mini''s')
WHERE team_id IS NULL
LIMIT 1;

-- Step 5: Create empty rugby_data for Sharks team
INSERT INTO rugby_data (team_id, team_name, data)
VALUES (
  (SELECT id FROM teams WHERE name = 'Sharks Mini''s'),
  'Sharks Mini''s',
  '{
    "players": [],
    "playdays": [],
    "lineups": {},
    "ratings": {},
    "training": {},
    "favoritePositions": {},
    "allocationRules": {
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
    },
    "availability": {}
  }'::jsonb
);

-- Step 6: Create index for faster team_id lookups
CREATE INDEX IF NOT EXISTS idx_rugby_data_team_id ON rugby_data(team_id);

-- Verification queries (comment these out for production)
-- SELECT * FROM teams ORDER BY created_at;
-- SELECT id, team_id, team_name FROM rugby_data;
