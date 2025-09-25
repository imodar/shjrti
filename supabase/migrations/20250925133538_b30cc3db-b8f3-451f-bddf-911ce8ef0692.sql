-- Create storage bucket for member memories
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-memories',
  'member-memories',
  false,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create RLS policies for member memories
-- Allow users to upload memories for family members they can access
CREATE POLICY "Users can upload memories for accessible family members"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'member-memories' AND
  EXISTS (
    SELECT 1 FROM family_tree_members ftm
    JOIN families f ON ftm.family_id = f.id
    WHERE ftm.id::text = (storage.foldername(storage.objects.name))[1]
    AND (f.creator_id = auth.uid() OR f.id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  )
);

-- Allow users to view memories for accessible family members
CREATE POLICY "Users can view memories for accessible family members"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'member-memories' AND
  EXISTS (
    SELECT 1 FROM family_tree_members ftm
    JOIN families f ON ftm.family_id = f.id
    WHERE ftm.id::text = (storage.foldername(storage.objects.name))[1]
    AND (f.creator_id = auth.uid() OR f.id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  )
);

-- Allow users to delete memories they uploaded
CREATE POLICY "Users can delete their own uploaded memories"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'member-memories' AND
  owner = auth.uid()
);

-- Allow users to update memories they uploaded
CREATE POLICY "Users can update their own uploaded memories"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'member-memories' AND
  owner = auth.uid()
);

-- Create a table to track memory metadata
CREATE TABLE public.member_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES family_tree_members(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL DEFAULT auth.uid(),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on member_memories table
ALTER TABLE public.member_memories ENABLE ROW LEVEL SECURITY;

-- RLS policies for member_memories table
CREATE POLICY "Users can insert memories for accessible family members"
ON public.member_memories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM family_tree_members ftm
    JOIN families f ON ftm.family_id = f.id
    WHERE ftm.id = member_id
    AND (f.creator_id = auth.uid() OR f.id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can view memories for accessible family members"
ON public.member_memories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_tree_members ftm
    JOIN families f ON ftm.family_id = f.id
    WHERE ftm.id = member_id
    AND (f.creator_id = auth.uid() OR f.id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can update their own uploaded memories"
ON public.member_memories
FOR UPDATE
USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own uploaded memories"
ON public.member_memories
FOR DELETE
USING (uploaded_by = auth.uid());

-- Create index for better performance
CREATE INDEX idx_member_memories_member_id ON public.member_memories(member_id);
CREATE INDEX idx_member_memories_uploaded_by ON public.member_memories(uploaded_by);

-- Create trigger for updating updated_at
CREATE TRIGGER update_member_memories_updated_at
  BEFORE UPDATE ON public.member_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();