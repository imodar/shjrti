-- Remove package_id from families table since packages are user-based, not tree-based
ALTER TABLE public.families 
DROP COLUMN IF EXISTS package_id;