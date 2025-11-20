-- Add public read access policy for family_memories bucket
-- This allows public access to images from families with share_gallery enabled

-- First, check if the policy already exists and drop it if needed
DROP POLICY IF EXISTS "Public read access for shared galleries" ON storage.objects;

-- Create policy for public read access to family-memories bucket
-- Only for families that have share_gallery enabled
CREATE POLICY "Public read access for shared galleries"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'family-memories'
  AND EXISTS (
    SELECT 1 
    FROM family_memories fm
    JOIN families f ON fm.family_id = f.id
    WHERE fm.file_path = storage.objects.name
    AND f.share_gallery = true
  )
);