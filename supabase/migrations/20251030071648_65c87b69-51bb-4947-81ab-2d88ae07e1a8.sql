-- Add TreeSettingsView translations (Part 2: Sharing & Links)
INSERT INTO translations (key, category, language_code, value) VALUES
('tree_settings.sharing_domain_title', 'tree_settings', 'ar', 'إعدادات المشاركة والنطاق'),
('tree_settings.sharing_domain_title', 'tree_settings', 'en', 'Sharing & Domain Settings'),
('tree_settings.sharing_domain_subtitle', 'tree_settings', 'ar', 'تحكم في كيفية مشاركة شجرة العائلة ونطاقها المخصص'),
('tree_settings.sharing_domain_subtitle', 'tree_settings', 'en', 'Control how your family tree is shared and its custom domain'),
('tree_settings.public_link_label', 'tree_settings', 'ar', 'الرابط العام للشجرة'),
('tree_settings.public_link_label', 'tree_settings', 'en', 'Public Tree Link'),
('tree_settings.public_link_info', 'tree_settings', 'ar', 'يمكن لأي شخص عرض الشجرة باستخدام هذا الرابط'),
('tree_settings.public_link_info', 'tree_settings', 'en', 'Anyone can view the tree using this link'),
('tree_settings.share', 'tree_settings', 'ar', 'مشاركة'),
('tree_settings.share', 'tree_settings', 'en', 'Share'),
('tree_settings.copy_link', 'tree_settings', 'ar', 'تم نسخ الرابط'),
('tree_settings.copy_link', 'tree_settings', 'en', 'Link copied'),
('tree_settings.copy_link_desc', 'tree_settings', 'ar', 'تم نسخ رابط الشجرة إلى الحافظة'),
('tree_settings.copy_link_desc', 'tree_settings', 'en', 'Tree link copied to clipboard'),
('tree_settings.copy_public_link', 'tree_settings', 'ar', 'تم نسخ الرابط العام'),
('tree_settings.copy_public_link', 'tree_settings', 'en', 'Public link copied'),
('tree_settings.copy_public_link_desc', 'tree_settings', 'ar', 'تم نسخ رابط المشاركة العام إلى الحافظة'),
('tree_settings.copy_public_link_desc', 'tree_settings', 'en', 'Public share link copied to clipboard'),
('tree_settings.copy_custom_domain', 'tree_settings', 'ar', 'تم نسخ الرابط المخصص'),
('tree_settings.copy_custom_domain', 'tree_settings', 'en', 'Custom link copied'),
('tree_settings.copy_custom_domain_desc', 'tree_settings', 'ar', 'تم نسخ رابط النطاق المخصص بنجاح'),
('tree_settings.copy_custom_domain_desc', 'tree_settings', 'en', 'Custom domain link copied successfully'),
('tree_settings.share_tree_title', 'tree_settings', 'ar', 'شجرة عائلة {name}'),
('tree_settings.share_tree_title', 'tree_settings', 'en', 'Family tree {name}')
ON CONFLICT (key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();