-- Convert name and description columns from text to jsonb for proper multilingual support
ALTER TABLE packages 
ALTER COLUMN name TYPE jsonb USING name::jsonb,
ALTER COLUMN description TYPE jsonb USING description::jsonb;