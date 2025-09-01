-- Add custom_domain column to families table
ALTER TABLE public.families ADD COLUMN custom_domain TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_families_custom_domain ON public.families(custom_domain);

-- Add constraint to ensure custom_domain follows proper format (no dots, minimum 5 characters, alphanumeric and hyphens only)
ALTER TABLE public.families ADD CONSTRAINT custom_domain_format 
CHECK (custom_domain IS NULL OR (
  LENGTH(custom_domain) >= 5 
  AND custom_domain ~ '^[a-z0-9-]+$' 
  AND custom_domain NOT LIKE '%.%'
));