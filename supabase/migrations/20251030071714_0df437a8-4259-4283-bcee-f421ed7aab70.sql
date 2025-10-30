-- Add TreeSettingsView translations (Part 3: Custom Domain & Premium)
INSERT INTO translations (key, category, language_code, value) VALUES
('tree_settings.custom_link', 'tree_settings', 'ar', 'الرابط المخصص'),
('tree_settings.custom_link', 'tree_settings', 'en', 'Custom Link'),
('tree_settings.premium_feature', 'tree_settings', 'ar', '👑 Premium'),
('tree_settings.premium_feature', 'tree_settings', 'en', '👑 Premium'),
('tree_settings.upgrade_now', 'tree_settings', 'ar', 'ترقية الآن'),
('tree_settings.upgrade_now', 'tree_settings', 'en', 'Upgrade Now'),
('tree_settings.custom_link_benefit', 'tree_settings', 'ar', 'احصل على رابط مخصص سهل التذكر لشجرتك'),
('tree_settings.custom_link_benefit', 'tree_settings', 'en', 'Get a custom easy-to-remember link for your tree'),
('tree_settings.available', 'tree_settings', 'ar', 'متاح'),
('tree_settings.available', 'tree_settings', 'en', 'Available'),
('tree_settings.add_custom_link', 'tree_settings', 'ar', 'إضافة رابط مخصص لشجرتك'),
('tree_settings.add_custom_link', 'tree_settings', 'en', 'Add custom link to your tree'),
('tree_settings.custom_link_example', 'tree_settings', 'ar', 'اختر رابطاً سهلاً مثل: https://shjrti.com/my-family'),
('tree_settings.custom_link_example', 'tree_settings', 'en', 'Choose an easy link like: https://shjrti.com/my-family'),
('tree_settings.edit', 'tree_settings', 'ar', 'تعديل'),
('tree_settings.edit', 'tree_settings', 'en', 'Edit'),
('tree_settings.copy', 'tree_settings', 'ar', 'نسخ'),
('tree_settings.copy', 'tree_settings', 'en', 'Copy')
ON CONFLICT (key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();