-- Insert translation keys for TreeSettings component
INSERT INTO translations (key, language_code, value, category) VALUES 
('tree_settings.custom_domain', 'ar', 'النطاق المخصص', 'tree_settings'),
('tree_settings.custom_domain', 'en', 'Custom Domain', 'tree_settings'),
('tree_settings.sharing_links', 'ar', 'روابط المشاركة', 'tree_settings'),
('tree_settings.sharing_links', 'en', 'Sharing Links', 'tree_settings'),
('tree_settings.password_protection', 'ar', 'حماية بكلمة مرور', 'tree_settings'),
('tree_settings.password_protection', 'en', 'Password Protection', 'tree_settings'),
('tree_settings.family_description', 'ar', 'وصف العائلة', 'tree_settings'),
('tree_settings.family_description', 'en', 'Family Description', 'tree_settings'),
('tree_settings.advanced_settings', 'ar', 'إعدادات متقدمة', 'tree_settings'),
('tree_settings.advanced_settings', 'en', 'Advanced Settings', 'tree_settings')
ON CONFLICT (key, language_code) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = now();