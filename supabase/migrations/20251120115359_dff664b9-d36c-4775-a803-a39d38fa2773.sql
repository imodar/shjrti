-- Add public read access policy for member-memories bucket
-- This allows public access to member images from families with share_gallery enabled

-- First, check if the policy already exists and drop it if needed
DROP POLICY IF EXISTS "Public read access for shared member memories" ON storage.objects;

-- Create policy for public read access to member-memories bucket
-- Only for families that have share_gallery enabled
CREATE POLICY "Public read access for shared member memories"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'member-memories'
  AND EXISTS (
    SELECT 1 
    FROM member_memories mm
    JOIN family_tree_members ftm ON mm.member_id = ftm.id
    JOIN families f ON ftm.family_id = f.id
    WHERE mm.file_path = storage.objects.name
    AND f.share_gallery = true
  )
);