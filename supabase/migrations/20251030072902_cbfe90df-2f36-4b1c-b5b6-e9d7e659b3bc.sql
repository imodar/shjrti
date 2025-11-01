-- Add FamilyHeader translations
INSERT INTO translations (key, category, language_code, value) VALUES
('family_header.family_prefix', 'family_header', 'ar', 'عائلة'),
('family_header.family_prefix', 'family_header', 'en', 'Family'),
('family_header.family_tree_default', 'family_header', 'ar', 'شجرة العائلة'),
('family_header.family_tree_default', 'family_header', 'en', 'Family Tree'),
('family_header.members', 'family_header', 'ar', 'أعضاء العائلة'),
('family_header.members', 'family_header', 'en', 'Family Members'),
('family_header.tree_view', 'family_header', 'ar', 'عرض الشجرة'),
('family_header.tree_view', 'family_header', 'en', 'Tree View'),
('family_header.gallery', 'family_header', 'ar', 'ألبوم العائلة'),
('family_header.gallery', 'family_header', 'en', 'Gallery'),
('family_header.statistics', 'family_header', 'ar', 'الإحصائيات'),
('family_header.statistics', 'family_header', 'en', 'Statistics'),
('family_header.settings', 'family_header', 'ar', 'الإعدادات'),
('family_header.settings', 'family_header', 'en', 'Settings'),
('family_header.total_members', 'family_header', 'ar', 'إجمالي أعضاء العائلة'),
('family_header.total_members', 'family_header', 'en', 'Total Family Members'),
('family_header.male_count', 'family_header', 'ar', 'عدد الذكور في العائلة'),
('family_header.male_count', 'family_header', 'en', 'Number of Males in Family'),
('family_header.female_count', 'family_header', 'ar', 'عدد الإناث في العائلة'),
('family_header.female_count', 'family_header', 'en', 'Number of Females in Family'),
('family_header.generation_count', 'family_header', 'ar', 'عدد الأجيال في العائلة'),
('family_header.generation_count', 'family_header', 'en', 'Number of Generations in Family')
ON CONFLICT (key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();