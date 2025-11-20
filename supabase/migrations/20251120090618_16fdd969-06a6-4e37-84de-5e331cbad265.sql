-- Create storage bucket for social media Open Graph images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'family-tree-images',
  'family-tree-images',
  true,  -- Public bucket so images can be accessed via URL
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- RLS Policy: Allow admins to upload images
CREATE POLICY "Admins can upload family tree images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'family-tree-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policy: Allow admins to update images
CREATE POLICY "Admins can update family tree images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'family-tree-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policy: Allow admins to delete images
CREATE POLICY "Admins can delete family tree images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'family-tree-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policy: Allow everyone to view public images
CREATE POLICY "Anyone can view family tree images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'family-tree-images');