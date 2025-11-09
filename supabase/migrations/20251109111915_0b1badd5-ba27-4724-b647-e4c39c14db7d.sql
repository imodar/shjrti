-- Add translation key for deceased label
INSERT INTO translations (language_code, key, value, category) VALUES
('en', 'member.deceased', 'Deceased', 'member'),
('ar', 'member.deceased', 'متوفى', 'member')
ON CONFLICT (language_code, key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = now();