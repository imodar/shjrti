
-- Create table for photo member tags (tagging members in photos with position)
CREATE TABLE public.photo_member_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.family_memories(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.family_tree_members(id) ON DELETE CASCADE,
  x_percent NUMERIC NOT NULL DEFAULT 50,
  y_percent NUMERIC NOT NULL DEFAULT 50,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(memory_id, member_id)
);

-- Enable RLS
ALTER TABLE public.photo_member_tags ENABLE ROW LEVEL SECURITY;

-- Policies: users who have access to the family can manage tags
CREATE POLICY "Users can view tags for their family memories"
ON public.photo_member_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_memories fm
    JOIN families f ON f.id = fm.family_id
    WHERE fm.id = photo_member_tags.memory_id
    AND (f.creator_id = auth.uid() OR f.id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Public read for shared family photo tags"
ON public.photo_member_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_memories fm
    JOIN families f ON f.id = fm.family_id
    WHERE fm.id = photo_member_tags.memory_id AND f.share_gallery = true
  )
);

CREATE POLICY "Users can create tags for their family memories"
ON public.photo_member_tags
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM family_memories fm
    JOIN families f ON f.id = fm.family_id
    WHERE fm.id = photo_member_tags.memory_id
    AND (f.creator_id = auth.uid() OR f.id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Users can delete tags for their family memories"
ON public.photo_member_tags
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM family_memories fm
    JOIN families f ON f.id = fm.family_id
    WHERE fm.id = photo_member_tags.memory_id
    AND (f.creator_id = auth.uid() OR f.id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    ))
  )
);

-- Index for fast lookups
CREATE INDEX idx_photo_member_tags_memory ON public.photo_member_tags(memory_id);
CREATE INDEX idx_photo_member_tags_member ON public.photo_member_tags(member_id);
