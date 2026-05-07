-- Fix the foreign key on daily_updates to reference public.profiles
-- so that PostgREST can resolve the join relationship.

-- First drop the existing FK to auth.users
ALTER TABLE daily_updates
  DROP CONSTRAINT IF EXISTS daily_updates_user_id_fkey;

-- Re-add it pointing to public.profiles (which itself references auth.users)
ALTER TABLE daily_updates
  ADD CONSTRAINT daily_updates_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
