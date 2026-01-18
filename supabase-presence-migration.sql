-- Migration to add presence tracking
-- Run this in Supabase SQL Editor to add active_users table

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
SELECT 'Presence tracking added successfully!' as message;
