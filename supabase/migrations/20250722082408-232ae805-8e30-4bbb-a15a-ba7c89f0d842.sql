-- Remove marriage_date and divorce_date columns from marriages table
ALTER TABLE public.marriages 
DROP COLUMN IF EXISTS marriage_date,
DROP COLUMN IF EXISTS divorce_date;