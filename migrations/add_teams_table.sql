-- Migration: Add Multi-Team Support (idempotent R8 revision)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT
);

ALTER TABLE rugby_data ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

INSERT INTO teams (name, logo, created_by) SELECT 'Bulls Mini''s', '🐂', 'system' WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Bulls Mini''s');
INSERT INTO teams (name, logo, created_by) SELECT 'Sharks Mini''s', '🦈', 'system' WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Sharks Mini''s');

WITH first_unlinked AS (SELECT id FROM rugby_data WHERE team_id IS NULL ORDER BY created_at LIMIT 1)
UPDATE rugby_data rd SET team_id = (SELECT id FROM teams WHERE name = 'Bulls Mini''s' ORDER BY created_at LIMIT 1) FROM first_unlinked f WHERE rd.id = f.id;

INSERT INTO rugby_data (team_id, team_name, data)
SELECT t.id, 'Sharks Mini''s', '{"players":[],"playdays":[],"lineups":{},"ratings":{},"training":{},"favoritePositions":{},"suitability":{},"positionPreferences":{},"publishedHalves":{},"keyPositionMultiplier":1.15,"allocationRules":{},"availability":{}}'::jsonb
FROM teams t WHERE t.name = 'Sharks Mini''s' AND NOT EXISTS (SELECT 1 FROM rugby_data rd WHERE rd.team_id = t.id);

CREATE INDEX IF NOT EXISTS idx_rugby_data_team_id ON rugby_data(team_id);
