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

-- Success message
SELECT 'Rugby Planner schema created successfully!' as message;
