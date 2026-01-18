-- Rugby Planner Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Create the main table to store rugby data
CREATE TABLE IF NOT EXISTS rugby_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL DEFAULT 'Bulls Mini''s',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS rugby_data_updated_at_idx ON rugby_data(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE rugby_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read
CREATE POLICY "Allow public read access" ON rugby_data
  FOR SELECT USING (true);

-- Create a policy that allows anyone to insert
CREATE POLICY "Allow public insert access" ON rugby_data
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows anyone to update
CREATE POLICY "Allow public update access" ON rugby_data
  FOR UPDATE USING (true);

-- Create a policy that allows anyone to delete (optional, for cleanup)
CREATE POLICY "Allow public delete access" ON rugby_data
  FOR DELETE USING (true);

-- Create a function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rugby_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS rugby_data_updated_at_trigger ON rugby_data;
CREATE TRIGGER rugby_data_updated_at_trigger
  BEFORE UPDATE ON rugby_data
  FOR EACH ROW
  EXECUTE FUNCTION update_rugby_data_updated_at();

-- Insert initial row for the team (will be updated by the app)
INSERT INTO rugby_data (team_name, data)
VALUES ('Bulls Mini''s', '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE rugby_data;

-- Create active_users table for presence tracking
CREATE TABLE IF NOT EXISTS active_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast cleanup of stale sessions
CREATE INDEX IF NOT EXISTS active_users_last_seen_idx ON active_users(last_seen DESC);

-- Enable Row Level Security
ALTER TABLE active_users ENABLE ROW LEVEL SECURITY;

-- Allow public access for presence system
CREATE POLICY "Allow public read access" ON active_users
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON active_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON active_users
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON active_users
  FOR DELETE USING (true);

-- Enable realtime for presence updates
ALTER PUBLICATION supabase_realtime ADD TABLE active_users;

-- Success message
SELECT 'Rugby Planner schema created successfully!' as message;
