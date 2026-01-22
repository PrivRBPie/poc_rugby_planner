-- SQL Script to completely reset Bulls team data
-- Run this in Supabase SQL Editor

-- 1. First, let's see what teams exist
SELECT id, name, created_at FROM teams ORDER BY created_at;

-- 2. Delete all rugby_data for Bulls team (we'll recreate it fresh)
-- REPLACE 'YOUR-BULLS-TEAM-ID-HERE' with the actual Bulls team ID from step 1
DELETE FROM rugby_data
WHERE team_id = 'YOUR-BULLS-TEAM-ID-HERE';

-- 3. The app will create fresh data on next load with correct default values
-- Just refresh the app after running this, and the Bulls team will have clean data
