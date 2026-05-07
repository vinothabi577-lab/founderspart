-- Create daily_updates table
CREATE TABLE daily_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'good', -- great, good, neutral, tough
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date) -- one update per user per day
);

-- Enable RLS
ALTER TABLE daily_updates ENABLE ROW LEVEL SECURITY;

-- All authenticated users (co-founders) can read all updates
CREATE POLICY "Authenticated users can read all updates"
  ON daily_updates FOR SELECT TO authenticated USING (true);

-- Users can only insert their own updates
CREATE POLICY "Users can insert own updates"
  ON daily_updates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own updates
CREATE POLICY "Users can update own updates"
  ON daily_updates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can only delete their own updates
CREATE POLICY "Users can delete own updates"
  ON daily_updates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
