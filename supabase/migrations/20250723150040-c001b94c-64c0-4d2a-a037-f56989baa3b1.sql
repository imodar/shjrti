-- Add missing translations for dashboard status messages

-- Arabic translations
INSERT INTO translations (language_code, key, value, category) VALUES
('ar', 'ready_to_start', 'جاهز للبدء؟', 'dashboard'),
('ar', 'manage_trees', 'إدارة أشجارك أدناه', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;

-- English translations  
INSERT INTO translations (language_code, key, value, category) VALUES
('en', 'ready_to_start', 'Ready to start?', 'dashboard'),
('en', 'manage_trees', 'Manage your trees below', 'dashboard')
ON CONFLICT (language_code, key) DO UPDATE SET value = EXCLUDED.value;