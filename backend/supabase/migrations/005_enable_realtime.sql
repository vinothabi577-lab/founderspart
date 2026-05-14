-- Enable Realtime for all core tables
-- This adds the tables to the supabase_realtime publication
-- allowing the frontend to receive updates via WebSockets.

begin;
  -- Create the publication if it doesn't exist (it usually does in Supabase)
  -- If it exists, this might fail, so we just try to add tables.
  
  -- Add tasks table
  alter publication supabase_realtime add table tasks;
  
  -- Add daily_updates table
  alter publication supabase_realtime add table daily_updates;
  
  -- Add finance table
  alter publication supabase_realtime add table finance;
  
  -- Add goals table
  alter publication supabase_realtime add table goals;
  
  -- Add profiles table (useful for avatar/name updates)
  alter publication supabase_realtime add table profiles;
commit;
