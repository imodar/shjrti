-- First, update empty or invalid descriptions to be valid JSON
UPDATE packages 
SET description = '{"en": ""}' 
WHERE description = '' OR description IS NULL;

UPDATE packages 
SET description = CASE 
  WHEN description::text ~ '^{.*}$' THEN description 
  ELSE ('{"en": "' || REPLACE(description, '"', '\"') || '"}')::text
END
WHERE description IS NOT NULL;

-- Now convert description column to jsonb
ALTER TABLE packages 
ALTER COLUMN description TYPE jsonb USING description::jsonb;

-- Handle name column - some are already JSON, some are not
UPDATE packages 
SET name = CASE 
  WHEN name::text ~ '^{.*}$' THEN name 
  ELSE ('{"en": "' || REPLACE(name, '"', '\"') || '"}')::text
END;

-- Now convert name column to jsonb
ALTER TABLE packages 
ALTER COLUMN name TYPE jsonb USING name::jsonb;