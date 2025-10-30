-- إضافة ترجمات منصات التواصل الاجتماعي والنصوص الأخرى

-- منصات التواصل الاجتماعي
INSERT INTO translations (key, language_code, value, category) VALUES
  ('social.facebook', 'ar', 'فيسبوك', 'social'),
  ('social.facebook', 'en', 'Facebook', 'social'),
  ('social.twitter', 'ar', 'تويتر', 'social'),
  ('social.twitter', 'en', 'X (Twitter)', 'social'),
  ('social.linkedin', 'ar', 'لينكد إن', 'social'),
  ('social.linkedin', 'en', 'LinkedIn', 'social'),
  ('social.whatsapp', 'ar', 'واتساب', 'social'),
  ('social.whatsapp', 'en', 'WhatsApp', 'social'),
  ('social.share_via', 'ar', 'المشاركة عبر', 'social'),
  ('social.share_via', 'en', 'Share via', 'social')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;