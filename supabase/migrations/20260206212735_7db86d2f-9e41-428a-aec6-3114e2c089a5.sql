INSERT INTO translations (key, language_code, value, category) VALUES
('dashboard.personal_workspace', 'en', 'Personal Workspace', 'dashboard'),
('dashboard.personal_workspace', 'ar', 'مساحة العمل الشخصية', 'dashboard'),
('dashboard.welcome_back', 'en', 'Welcome back', 'dashboard'),
('dashboard.welcome_back', 'ar', 'مرحباً بعودتك', 'dashboard'),
('dashboard.legacy_description', 'en', 'Your family legacy continues to grow. You have documented', 'dashboard'),
('dashboard.legacy_description', 'ar', 'إرث عائلتك يستمر بالنمو. لقد وثّقت', 'dashboard'),
('dashboard.relatives', 'en', 'relatives', 'dashboard'),
('dashboard.relatives', 'ar', 'فرد', 'dashboard'),
('dashboard.across_trees', 'en', 'across your family trees.', 'dashboard'),
('dashboard.across_trees', 'ar', 'عبر أشجار عائلتك.', 'dashboard')
ON CONFLICT DO NOTHING;