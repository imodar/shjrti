-- Add image upload feature flag to packages table
ALTER TABLE packages 
ADD COLUMN image_upload_enabled boolean DEFAULT false;

-- Update existing packages to set appropriate defaults
-- Free packages: disable image uploads
UPDATE packages 
SET image_upload_enabled = false 
WHERE (name->>'en' ILIKE '%free%' OR name->>'ar' ILIKE '%مجاني%' OR price_usd = 0 OR price_sar = 0);

-- Paid packages: enable image uploads
UPDATE packages 
SET image_upload_enabled = true 
WHERE NOT (name->>'en' ILIKE '%free%' OR name->>'ar' ILIKE '%مجاني%' OR price_usd = 0 OR price_sar = 0);