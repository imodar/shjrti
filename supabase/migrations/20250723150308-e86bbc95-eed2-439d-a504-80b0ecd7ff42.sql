-- Add missing translation for last_update

-- Arabic translation
INSERT INTO translations (language_code, key, value, category) VALUES
('ar', 'last_update', 'آخر تحديث', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;

-- English translation  
INSERT INTO translations (language_code, key, value, category) VALUES
('en', 'last_update', 'Last Update', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;