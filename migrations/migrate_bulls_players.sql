-- Migration: Add players array to Bulls Mini's team
-- Description: Extracts current hardcoded players and adds them to Bulls team's rugby_data

-- This migration adds the "players" field to the Bulls team's rugby_data
-- with all the current players from the application

UPDATE rugby_data
SET data = jsonb_set(
  data,
  '{players}',
  '[
    {"id": 1, "name": "Rosa On", "miniYear": "2nd year"},
    {"id": 2, "name": "Teo Gorri", "miniYear": "2nd year"},
    {"id": 3, "name": "Dries Wage", "miniYear": "2nd year"},
    {"id": 4, "name": "Lewis Deel", "miniYear": "2nd year"},
    {"id": 5, "name": "Tjalle Kals", "miniYear": "2nd year"},
    {"id": 6, "name": "Eick Soe", "miniYear": "2nd year"},
    {"id": 7, "name": "Janes Bark", "miniYear": "2nd year"},
    {"id": 8, "name": "Esca Zand", "miniYear": "2nd year"},
    {"id": 9, "name": "Huib Schr", "miniYear": "2nd year"},
    {"id": 10, "name": "Liam Hass", "miniYear": "2nd year"},
    {"id": 11, "name": "Francois Ross", "miniYear": "2nd year"},
    {"id": 12, "name": "Tobia Conc", "miniYear": "2nd year"},
    {"id": 13, "name": "Alexander Jans", "miniYear": "2nd year"},
    {"id": 14, "name": "Yannick Huis", "miniYear": "2nd year"},
    {"id": 15, "name": "Ot Dubbe", "miniYear": "2nd year"},
    {"id": 16, "name": "Chris Klin", "miniYear": "2nd year"},
    {"id": 17, "name": "Edward Serf", "miniYear": "2nd year"},
    {"id": 18, "name": "Hedwig Bong", "miniYear": "2nd year"},
    {"id": 19, "name": "Okke Zwaa", "miniYear": "2nd year"}
  ]'::jsonb
)
WHERE team_id = (SELECT id FROM teams WHERE name = 'Bulls Mini''s');

-- Verification: Check that players were added
SELECT
  team_name,
  jsonb_array_length(data->'players') as player_count,
  data->'players'->0->>'name' as first_player,
  data->'players'->18->>'name' as last_player
FROM rugby_data
WHERE team_id = (SELECT id FROM teams WHERE name = 'Bulls Mini''s');

-- Expected output:
-- team_name: Bulls Mini's
-- player_count: 19
-- first_player: Rosa On
-- last_player: Okke Zwaa
