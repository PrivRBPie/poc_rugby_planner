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
      "game": {
        "enabled": true,
        "minFieldTime": 3,
        "maxFieldTime": 4,
        "strictBenchFairness": true,
        "enableLearning": true
      },
      "training": {
        "enabled": false,
        "minFieldTime": 2,
        "maxFieldTime": 3,
        "strictBenchFairness": false,
        "enableLearning": false
      }
    },
    "availability": {}
  }'::jsonb
);

-- Step 6: Create index for faster team_id lookups
CREATE INDEX IF NOT EXISTS idx_rugby_data_team_id ON rugby_data(team_id);

-- Verification queries (comment these out for production)
-- SELECT * FROM teams ORDER BY created_at;
-- SELECT id, team_id, team_name FROM rugby_data;
