-- Drop the existing foreign key constraint for related_person_id
ALTER TABLE public.family_tree_members 
DROP CONSTRAINT IF EXISTS family_tree_members_related_person_id_fkey;

-- Add new foreign key constraint to reference marriages table
ALTER TABLE public.family_tree_members 
ADD CONSTRAINT family_tree_members_related_person_id_fkey 
FOREIGN KEY (related_person_id) 
REFERENCES public.marriages(id) 
ON DELETE SET NULL;