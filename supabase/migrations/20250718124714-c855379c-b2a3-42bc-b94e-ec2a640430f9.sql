-- Add is_featured field to packages table for most selected badge
ALTER TABLE public.packages 
ADD COLUMN is_featured BOOLEAN DEFAULT false;

-- Set one package as featured (you can change this in admin panel later)
UPDATE public.packages 
SET is_featured = true 
WHERE display_order = 2 
LIMIT 1;