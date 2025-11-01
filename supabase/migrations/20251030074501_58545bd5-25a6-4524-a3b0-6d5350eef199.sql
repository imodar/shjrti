-- Add FamilyBuilderNew search and filter translations
INSERT INTO translations (key, category, language_code, value) VALUES
('family_builder.search_placeholder', 'family_builder', 'ar', 'ابحث عن عضو...'),
('family_builder.search_placeholder', 'family_builder', 'en', 'Search for member...'),
('family_builder.filter_placeholder', 'family_builder', 'ar', 'تصفية حسب...'),
('family_builder.filter_placeholder', 'family_builder', 'en', 'Filter by...'),
('family_builder.filter_all', 'family_builder', 'ar', 'جميع الأعضاء'),
('family_builder.filter_all', 'family_builder', 'en', 'All Members'),
('family_builder.filter_alive', 'family_builder', 'ar', 'الأحياء'),
('family_builder.filter_alive', 'family_builder', 'en', 'Living'),
('family_builder.filter_deceased', 'family_builder', 'ar', 'المتوفين'),
('family_builder.filter_deceased', 'family_builder', 'en', 'Deceased'),
('family_builder.filter_male', 'family_builder', 'ar', 'الذكور'),
('family_builder.filter_male', 'family_builder', 'en', 'Males'),
('family_builder.filter_female', 'family_builder', 'ar', 'الإناث'),
('family_builder.filter_female', 'family_builder', 'en', 'Females'),
('family_builder.filter_founders', 'family_builder', 'ar', 'المؤسسون'),
('family_builder.filter_founders', 'family_builder', 'en', 'Founders')
ON CONFLICT (key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();