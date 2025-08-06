-- Add AI features column to packages table
ALTER TABLE public.packages ADD COLUMN ai_features_enabled BOOLEAN DEFAULT false;

-- Update existing packages to have AI features only in premium packages
UPDATE public.packages 
SET ai_features_enabled = true 
WHERE name->>'en' IN ('Pro', 'Unlimited');