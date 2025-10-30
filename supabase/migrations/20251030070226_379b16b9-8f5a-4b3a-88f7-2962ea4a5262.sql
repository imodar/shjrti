-- Add ShareLinkModal translations
INSERT INTO translations (key, category, language_code, value) VALUES
('share_modal.title', 'tree_settings', 'ar', 'مشاركة رابط الشجرة'),
('share_modal.title', 'tree_settings', 'en', 'Share Tree Link'),
('share_modal.description', 'tree_settings', 'ar', 'شارك شجرة عائلة {familyName} مع الآخرين'),
('share_modal.description', 'tree_settings', 'en', 'Share family tree {familyName} with others'),
('share_modal.custom_link', 'tree_settings', 'ar', 'الرابط المخصص'),
('share_modal.custom_link', 'tree_settings', 'en', 'Custom Link'),
('share_modal.public_link', 'tree_settings', 'ar', 'الرابط العام'),
('share_modal.public_link', 'tree_settings', 'en', 'Public Link'),
('share_modal.copy', 'tree_settings', 'ar', 'نسخ'),
('share_modal.copy', 'tree_settings', 'en', 'Copy'),
('share_modal.link_copied', 'tree_settings', 'ar', 'تم نسخ الرابط'),
('share_modal.link_copied', 'tree_settings', 'en', 'Link copied'),
('share_modal.link_copied_desc', 'tree_settings', 'ar', 'تم نسخ رابط الشجرة إلى الحافظة'),
('share_modal.link_copied_desc', 'tree_settings', 'en', 'Tree link copied to clipboard'),
('share_modal.public_link_copied', 'tree_settings', 'ar', 'تم نسخ الرابط العام'),
('share_modal.public_link_copied', 'tree_settings', 'en', 'Public link copied'),
('share_modal.public_link_copied_desc', 'tree_settings', 'ar', 'تم نسخ الرابط العام إلى الحافظة'),
('share_modal.public_link_copied_desc', 'tree_settings', 'en', 'Public link copied to clipboard'),
('share_modal.open_new_window', 'tree_settings', 'ar', 'فتح الرابط في نافذة جديدة'),
('share_modal.open_new_window', 'tree_settings', 'en', 'Open link in new window'),
('share_modal.share_message', 'tree_settings', 'ar', 'شاهد شجرة عائلة {familyName}'),
('share_modal.share_message', 'tree_settings', 'en', 'Check out family tree {familyName}')
ON CONFLICT (key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();