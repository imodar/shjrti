-- Add beta badge translations
INSERT INTO translations (language_code, key, value) VALUES
('ar', 'badge.beta', 'إطلاق تجريبي'),
('en', 'badge.beta', 'Beta Launch')
ON CONFLICT (language_code, key) DO UPDATE 
SET value = EXCLUDED.value;