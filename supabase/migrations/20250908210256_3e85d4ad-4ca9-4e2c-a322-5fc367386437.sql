-- Add password protection field to families table
ALTER TABLE public.families 
ADD COLUMN share_password text DEFAULT NULL;