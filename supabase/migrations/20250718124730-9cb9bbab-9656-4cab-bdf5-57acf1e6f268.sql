-- Add is_featured field to packages table for most selected badge
ALTER TABLE public.packages 
ADD COLUMN is_featured BOOLEAN DEFAULT false;

-- Set one package as featured (basic/premium plan)
UPDATE public.packages 
SET is_featured = true 
WHERE display_order = 2;