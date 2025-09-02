-- Create daily sessions table to track start/end times
CREATE TABLE IF NOT EXISTS daily_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time slots table for 15-minute intervals
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES daily_sessions(id) ON DELETE CASCADE,
  slot_time TIMESTAMPTZ NOT NULL,
  activity TEXT,
  condition_score INTEGER CHECK (condition_score >= 1 AND condition_score <= 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_sessions
CREATE POLICY "Users can view their own sessions" ON daily_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON daily_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON daily_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON daily_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for time_slots
CREATE POLICY "Users can view their own time slots" ON time_slots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time slots" ON time_slots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time slots" ON time_slots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time slots" ON time_slots
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_sessions_user_date ON daily_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_slots_session ON time_slots(session_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_user_time ON time_slots(user_id, slot_time);
