-- Allow anonymous public read access for public storage buckets
-- This is needed because making a bucket public doesn't automatically bypass RLS

-- Drop existing restrictive policies for member-memories public read
DROP POLICY IF EXISTS "Public read access for shared member memories" ON storage.objects;

-- Create simple public read policy for member-memories bucket
CREATE POLICY "Public read access to member memories bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'member-memories');

-- Drop existing restrictive policies for family-memories public read
DROP POLICY IF EXISTS "Public read access for shared galleries" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read for shared gallery images" ON storage.objects;

-- Create simple public read policy for family-memories bucket
CREATE POLICY "Public read access to family memories bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'family-memories');