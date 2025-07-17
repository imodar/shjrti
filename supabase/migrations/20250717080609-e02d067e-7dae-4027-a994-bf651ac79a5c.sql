-- Add related_person_id field to family_tree_members table to track relationships
ALTER TABLE public.family_tree_members 
ADD COLUMN related_person_id UUID REFERENCES public.family_tree_members(id);

-- Add index for better performance on relationship queries
CREATE INDEX idx_family_tree_members_related_person_id ON public.family_tree_members(related_person_id);