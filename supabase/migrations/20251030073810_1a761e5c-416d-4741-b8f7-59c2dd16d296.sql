-- Add FamilyBuilderNew translations
INSERT INTO translations (key, category, language_code, value) VALUES
('family_builder.members_title', 'family_builder', 'ar', 'أعضاء العائلة'),
('family_builder.members_title', 'family_builder', 'en', 'Family Members')
ON CONFLICT (key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();