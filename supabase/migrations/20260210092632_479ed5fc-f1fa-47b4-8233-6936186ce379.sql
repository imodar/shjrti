INSERT INTO translations (key, value, language_code, category) VALUES
('settings.tab_general', 'General Settings', 'en', 'stitch'),
('settings.tab_general', 'اعدادات عامة', 'ar', 'stitch'),
('settings.tab_admins', 'Admins & Permissions', 'en', 'stitch'),
('settings.tab_admins', 'المشرفون والصلاحيات', 'ar', 'stitch'),
('settings.tab_advanced', 'Advanced Settings', 'en', 'stitch'),
('settings.tab_advanced', 'اعدادات متقدمة', 'ar', 'stitch'),
('settings.admins_coming_soon_title', 'Coming Soon', 'en', 'stitch'),
('settings.admins_coming_soon_title', 'قريباً', 'ar', 'stitch'),
('settings.admins_coming_soon_desc', 'Soon you will be able to add admins and assign different permissions to manage the family tree.', 'en', 'stitch'),
('settings.admins_coming_soon_desc', 'ستتمكن قريباً من إضافة مشرفين وتعيين صلاحيات مختلفة لإدارة شجرة العائلة.', 'ar', 'stitch')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;