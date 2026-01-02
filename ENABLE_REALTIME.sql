-- OPTIONAL BUT RECOMMENDED: Enable Realtime for instant updates
-- Run this if you want users to see new strategies without refreshing the page.

begin;
  -- Check if the publication exists (it usually does in Supabase)
  -- Then add the strategies table to it
  alter publication supabase_realtime add table public.strategies;
commit;
