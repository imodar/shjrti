-- Add comprehensive translations for TreeSettings components
-- Each translation needs two rows: one for Arabic (ar) and one for English (en)

-- SuggestedEditsPanel additional translations
INSERT INTO translations (key, category, language_code, value) VALUES
('suggestions.notification_failed', 'suggestions', 'ar', 'تم تحديث الاقتراح، لكن فشل إرسال إشعار البريد الإلكتروني'),
('suggestions.notification_failed', 'suggestions', 'en', 'Suggestion updated, but notification email failed'),
('suggestions.accepted_notified', 'suggestions', 'ar', 'تم قبول الاقتراح وإشعار المستخدم'),
('suggestions.accepted_notified', 'suggestions', 'en', 'Suggestion accepted and user notified'),
('suggestions.rejected_notified', 'suggestions', 'ar', 'تم رفض الاقتراح وإشعار المستخدم'),
('suggestions.rejected_notified', 'suggestions', 'en', 'Suggestion rejected and user notified')
ON CONFLICT (key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();