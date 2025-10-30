-- Add FamilyTreeView translations
INSERT INTO translations (key, category, language_code, value) VALUES
('tree_view.choose_root', 'tree_view', 'ar', 'اختر جذر الشجرة'),
('tree_view.choose_root', 'tree_view', 'en', 'Choose Tree Root'),
('tree_view.choose_marriage_placeholder', 'tree_view', 'ar', 'اختر الزواج كجذر للشجرة'),
('tree_view.choose_marriage_placeholder', 'tree_view', 'en', 'Choose marriage as tree root'),
('tree_view.search_family_placeholder', 'tree_view', 'ar', 'ابحث عن العائلة...'),
('tree_view.search_family_placeholder', 'tree_view', 'en', 'Search for family...'),
('tree_view.display_full_tree', 'tree_view', 'ar', 'عرض الشجرة كاملة'),
('tree_view.display_full_tree', 'tree_view', 'en', 'Display Full Tree')
ON CONFLICT (key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();