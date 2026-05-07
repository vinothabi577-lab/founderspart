-- Add missing columns to the tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_daily BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Fix status column default to match app expectations
ALTER TABLE tasks
  ALTER COLUMN status SET DEFAULT 'pending';

-- Fix duration/time_left defaults to be in minutes/seconds (not seconds/seconds)
ALTER TABLE tasks
  ALTER COLUMN duration SET DEFAULT 25,
  ALTER COLUMN time_left SET DEFAULT 1500;

-- Update any existing tasks with old 'todo' status to 'pending'
UPDATE tasks SET status = 'pending' WHERE status = 'todo';
