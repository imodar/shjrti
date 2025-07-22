-- Add marital_status column to family_tree_members table
ALTER TABLE public.family_tree_members 
ADD COLUMN marital_status text DEFAULT 'single';

-- Add a check constraint for valid marital status values
ALTER TABLE public.family_tree_members 
ADD CONSTRAINT check_marital_status 
CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'engaged'));