-- Add share_gallery column to families table
ALTER TABLE families 
ADD COLUMN share_gallery boolean DEFAULT false;

-- Create policy to allow public read access to family_memories when share_gallery is true
CREATE POLICY "Allow public read for shared galleries"
ON family_memories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM families 
    WHERE families.id = family_memories.family_id 
    AND families.share_gallery = true
  )
);

-- Create storage policy to allow public access to shared gallery images
CREATE POLICY "Allow public read for shared gallery images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'family-memories' 
  AND EXISTS (
    SELECT 1 FROM family_memories fm
    JOIN families f ON f.id = fm.family_id
    WHERE storage.objects.name = fm.file_path
    AND f.share_gallery = true
  )
);