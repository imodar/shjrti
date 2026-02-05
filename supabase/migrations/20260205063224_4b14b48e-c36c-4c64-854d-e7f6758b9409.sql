-- Insert Stitch header translations
INSERT INTO translations (key, language_code, value, category) VALUES 
('stitch.tab.dashboard', 'ar', 'لوحة التحكم', 'stitch'),
('stitch.tab.dashboard', 'en', 'Dashboard', 'stitch'),
('stitch.tab.tree_view', 'ar', 'عرض الشجرة', 'stitch'),
('stitch.tab.tree_view', 'en', 'Tree View', 'stitch'),
('stitch.tab.gallery', 'ar', 'المعرض', 'stitch'),
('stitch.tab.gallery', 'en', 'Gallery', 'stitch'),
('stitch.tab.statistics', 'ar', 'الإحصائيات', 'stitch'),
('stitch.tab.statistics', 'en', 'Statistics', 'stitch'),
('stitch.tab.suggestions', 'ar', 'الاقتراحات', 'stitch'),
('stitch.tab.suggestions', 'en', 'Suggestions', 'stitch'),
('stitch.genealogy_platform', 'ar', 'منصة الأنساب', 'stitch'),
('stitch.genealogy_platform', 'en', 'Genealogy Platform', 'stitch'),
('stitch.free_plan', 'ar', 'باقة مجانية', 'stitch'),
('stitch.free_plan', 'en', 'Free Plan', 'stitch')
ON CONFLICT (key, language_code) DO NOTHING;