
INSERT INTO public.translations (key, language_code, value, category) VALUES
('dashboard.shared_trees', 'ar', 'أشجار أقوم بإدارتها', 'dashboard'),
('dashboard.shared_trees', 'en', 'Trees I Manage', 'dashboard'),
('dashboard.shared_trees_subtitle', 'ar', 'أشجار العائلة المشاركة معك كمتعاون', 'dashboard'),
('dashboard.shared_trees_subtitle', 'en', 'Family trees shared with you as a collaborator', 'dashboard'),
('dashboard.editor_role', 'ar', 'محرر', 'dashboard'),
('dashboard.editor_role', 'en', 'Editor', 'dashboard')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
