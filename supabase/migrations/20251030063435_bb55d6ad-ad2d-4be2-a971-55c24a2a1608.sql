-- إضافة ترجمات قسم اقتراحات التعديل
INSERT INTO translations (key, language_code, value, category) VALUES
  ('tree_settings.edit_suggestions', 'ar', 'اقتراحات التعديل', 'tree_settings'),
  ('tree_settings.edit_suggestions', 'en', 'Edit Suggestions', 'tree_settings'),
  ('tree_settings.edit_suggestions_desc', 'ar', 'مراجعة اقتراحات التعديل من زوار الشجرة', 'tree_settings'),
  ('tree_settings.edit_suggestions_desc', 'en', 'Review edit suggestions from tree visitors', 'tree_settings')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;