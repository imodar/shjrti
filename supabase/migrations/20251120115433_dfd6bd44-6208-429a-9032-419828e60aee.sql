-- Make family-memories and member-memories buckets public
-- This allows public URLs to work while RLS policies control access

-- Update family-memories bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'family-memories';

-- Update member-memories bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'member-memories';