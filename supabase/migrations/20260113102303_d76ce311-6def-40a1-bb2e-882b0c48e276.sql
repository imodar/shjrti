-- Add female privacy settings columns to families table
ALTER TABLE families 
ADD COLUMN IF NOT EXISTS female_name_privacy TEXT DEFAULT 'full' 
  CHECK (female_name_privacy IN ('full', 'family_only', 'hidden'));

ALTER TABLE families 
ADD COLUMN IF NOT EXISTS female_photo_hidden BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN families.female_name_privacy IS 'Privacy setting for female names in public links: full (show all), family_only (hide first name), hidden (hide completely)';
COMMENT ON COLUMN families.female_photo_hidden IS 'Whether to hide female photos in public links';