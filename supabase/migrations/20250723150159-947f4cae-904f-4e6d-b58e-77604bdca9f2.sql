-- Add missing translation for total_members

-- Arabic translation
INSERT INTO translations (language_code, key, value, category) VALUES
('ar', 'total_members', 'إجمالي الأفراد', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;

-- English translation  
INSERT INTO translations (language_code, key, value, category) VALUES
('en', 'total_members', 'Total Members', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;