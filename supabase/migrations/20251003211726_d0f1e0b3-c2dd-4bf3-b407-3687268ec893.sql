-- Create family_memories table for family-level photo gallery
CREATE TABLE IF NOT EXISTS public.family_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  caption TEXT,
  uploaded_by UUID NOT NULL DEFAULT auth.uid(),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_memories ENABLE ROW LEVEL SECURITY;

-- Users can view memories for their families
CREATE POLICY "Users can view family memories"
ON public.family_memories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = family_memories.family_id
    AND (
      f.creator_id = auth.uid()
      OR f.id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- Users can insert memories for their families
CREATE POLICY "Users can insert family memories"
ON public.family_memories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = family_memories.family_id
    AND (
      f.creator_id = auth.uid()
      OR f.id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- Users can update their own uploaded memories
CREATE POLICY "Users can update their family memories"
ON public.family_memories
FOR UPDATE
USING (uploaded_by = auth.uid());

-- Users can delete their own uploaded memories
CREATE POLICY "Users can delete their family memories"
ON public.family_memories
FOR DELETE
USING (uploaded_by = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_family_memories_updated_at
BEFORE UPDATE ON public.family_memories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for family memories (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-memories', 'family-memories', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for family memories
CREATE POLICY "Users can view family memory files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'family-memories'
  AND (storage.foldername(name))[1] IN (
    SELECT f.id::text FROM families f
    WHERE f.creator_id = auth.uid()
    OR f.id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can upload family memory files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'family-memories'
  AND (storage.foldername(name))[1] IN (
    SELECT f.id::text FROM families f
    WHERE f.creator_id = auth.uid()
    OR f.id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their family memory files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'family-memories'
  AND (storage.foldername(name))[1] IN (
    SELECT f.id::text FROM families f
    WHERE f.creator_id = auth.uid()
    OR f.id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  )
);