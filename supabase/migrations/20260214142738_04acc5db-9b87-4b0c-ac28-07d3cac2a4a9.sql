
INSERT INTO translations (key, language_code, value, category) VALUES 
('gallery.unlock_title', 'ar', 'افتح معرض صور العائلة', 'gallery'),
('gallery.unlock_title', 'en', 'Unlock Your Family Gallery', 'gallery'),
('gallery.unlock_description', 'ar', 'معرض الصور ميزة مميزة. قم بالترقية إلى الباقة الكاملة لبدء رفع وحفظ ذكريات عائلتك.', 'gallery'),
('gallery.unlock_description', 'en', 'The Media Gallery is a premium feature. Upgrade to the Complete Plan to start uploading and preserving your family memories.', 'gallery'),
('gallery.upgrade_to_premium', 'ar', 'ترقية للباقة المميزة', 'gallery'),
('gallery.upgrade_to_premium', 'en', 'Upgrade to Premium', 'gallery')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;
