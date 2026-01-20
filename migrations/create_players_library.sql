-- Migration: Create Global Players Library
-- Description: Create a shared players table that all teams can reference

-- Step 1: Create global players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mini_year TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT
);

-- Step 2: Create team_players junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS team_players (
  id SERIAL PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  added_by TEXT,
  UNIQUE(team_id, player_id)  -- Prevent duplicate player assignments
);

-- Step 3: Migrate existing Bulls players from rugby_data to players table
-- Extract players from Bulls team's rugby_data and insert into players table
DO $$
DECLARE
  bulls_team_id UUID;
  player_record JSONB;
  new_player_id INTEGER;
BEGIN
  -- Get Bulls team ID
  SELECT id INTO bulls_team_id FROM teams WHERE name = 'Bulls Mini''s';

  -- Only proceed if Bulls team exists
  IF bulls_team_id IS NOT NULL THEN
    -- Loop through each player in Bulls rugby_data.players array
    FOR player_record IN
      SELECT jsonb_array_elements(data->'players') as player
      FROM rugby_data
      WHERE team_id = bulls_team_id
    LOOP
      -- Insert player into global players table
      INSERT INTO players (id, name, mini_year, created_by)
      VALUES (
        (player_record->>'id')::INTEGER,
        player_record->>'name',
        player_record->>'miniYear',
        'migration'
      )
      ON CONFLICT (id) DO NOTHING;  -- Skip if already exists

      -- Link player to Bulls team
      INSERT INTO team_players (team_id, player_id, added_by)
      VALUES (
        bulls_team_id,
        (player_record->>'id')::INTEGER,
        'migration'
      )
      ON CONFLICT (team_id, player_id) DO NOTHING;  -- Skip if already linked
    END LOOP;
  END IF;
END $$;

-- Step 4: Set the sequence for players.id to continue from max existing ID
SELECT setval('players_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM players), false);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON team_players(player_id);

-- Verification queries
SELECT
  'Players in library' as description,
  COUNT(*) as count
FROM players;

SELECT
  'Team-Player links' as description,
  COUNT(*) as count
FROM team_players;

SELECT
  t.name as team_name,
  COUNT(tp.player_id) as player_count
FROM teams t
LEFT JOIN team_players tp ON t.id = tp.team_id
GROUP BY t.name
ORDER BY t.name;
