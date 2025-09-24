INSERT INTO translations (key, language_code, value, category) VALUES 
('tree_settings.custom_domain_upgrade_message', 'ar', 'قم بترقية باقتك للحصول على إمكانية استخدام نطاق مخصص لشجرة عائلتك', 'tree_settings'),
('tree_settings.custom_domain_upgrade_message', 'en', 'Upgrade your package to get the ability to use a custom domain for your family tree', 'tree_settings'),
('tree_settings.custom_domain_not_available', 'ar', 'ميزة النطاق المخصص غير متاحة', 'tree_settings'),
('tree_settings.custom_domain_not_available', 'en', 'Custom Domain Feature Not Available', 'tree_settings')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value, updated_at = now();