
INSERT INTO translations (key, value, language_code, category) VALUES
('stitch.recent_activities', 'Recent Activities', 'en', 'stitch'),
('stitch.recent_activities', 'الأنشطة الأخيرة', 'ar', 'stitch'),
('stitch.view_all', 'View All', 'en', 'stitch'),
('stitch.view_all', 'عرض الكل', 'ar', 'stitch'),
('stitch.no_recent_activities', 'No recent activities', 'en', 'stitch'),
('stitch.no_recent_activities', 'لا توجد أنشطة حديثة', 'ar', 'stitch'),
('stitch.quick_actions', 'Quick Actions', 'en', 'stitch'),
('stitch.quick_actions', 'إجراءات سريعة', 'ar', 'stitch')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;
