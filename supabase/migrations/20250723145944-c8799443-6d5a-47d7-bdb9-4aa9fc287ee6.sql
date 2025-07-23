-- Add missing button translations that were already referenced in the code

-- Arabic translations for buttons
INSERT INTO translations (language_code, key, value, category) VALUES
('ar', 'manage', 'إدارة', 'dashboard'),
('ar', 'view', 'عرض', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;

-- English translations for buttons
INSERT INTO translations (language_code, key, value, category) VALUES
('en', 'manage', 'Manage', 'dashboard'),
('en', 'view', 'View', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;