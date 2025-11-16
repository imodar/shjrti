-- إضافة ترجمة subtitle لصفحة Family Creator

-- العربية
INSERT INTO translations (key, value, language_code, category) VALUES
('memory_journey_subtitle', 'ابدأ في كتابة تاريخ عائلتك وصنع إرث يدوم للأبد', 'ar', 'family_creator')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;

-- الإنجليزية
INSERT INTO translations (key, value, language_code, category) VALUES
('memory_journey_subtitle', 'Start writing your family history and create a legacy that lasts forever', 'en', 'family_creator')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;