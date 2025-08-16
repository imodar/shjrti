-- Add theme preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_variant TEXT DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'light';

-- Add check constraints for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT theme_variant_check CHECK (theme_variant IN ('modern', 'professional')),
ADD CONSTRAINT theme_mode_check CHECK (theme_mode IN ('light', 'dark'));