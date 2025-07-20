-- Add network error translation keys
INSERT INTO public.translations (language_code, key, value, category) VALUES
-- Arabic translations for network errors
('ar', 'network_error', 'مشكلة في الاتصال بالخادم. يرجى المحاولة مرة أخرى.', 'auth'),
('ar', 'irreversible_action', 'هذا الإجراء', 'common'),
('ar', 'cannot_be_undone', 'لا يمكن التراجع عنه', 'common'),
('ar', 'serious_warning', 'تحذير خطير', 'common'),
('ar', 'usage_limit', 'حد الاستخدام', 'common'),
('ar', 'build_family_history', 'ابدأ في بناء تاريخ عائلتك', 'family'),
('ar', 'members', 'فرد', 'family'),

-- English translations for network errors
('en', 'network_error', 'Connection issue with server. Please try again.', 'auth'),
('en', 'irreversible_action', 'This action', 'common'),
('en', 'cannot_be_undone', 'cannot be undone', 'common'),
('en', 'serious_warning', 'Serious Warning', 'common'),
('en', 'usage_limit', 'Usage Limit', 'common'),
('en', 'build_family_history', 'Start building your family history', 'family'),
('en', 'members', 'member', 'family')
ON CONFLICT (language_code, key) DO NOTHING;