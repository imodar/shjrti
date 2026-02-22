
INSERT INTO public.translations (key, value, language_code, category) VALUES
('suggestions.reviewed_merged', 'Reviewed and merged by Admin', 'en', 'suggestions'),
('suggestions.reviewed_merged', 'تمت المراجعة والدمج بواسطة المسؤول', 'ar', 'suggestions'),
('suggestions.reviewed_rejected', 'Rejected by Admin', 'en', 'suggestions'),
('suggestions.reviewed_rejected', 'تم الرفض بواسطة المسؤول', 'ar', 'suggestions'),
('suggestions.dialog_subtitle', 'Review your decision before updating the family tree.', 'en', 'suggestions'),
('suggestions.dialog_subtitle', 'راجع قرارك قبل تحديث شجرة العائلة.', 'ar', 'suggestions'),
('suggestions.message_label', 'Message for the contributor (Optional)', 'en', 'suggestions'),
('suggestions.message_label', 'رسالة للمساهم (اختياري)', 'ar', 'suggestions'),
('suggestions.dialog_info', 'The contributor will be notified of your decision. If accepted, the changes will be automatically merged into the tree.', 'en', 'suggestions'),
('suggestions.dialog_info', 'سيتم إشعار المساهم بقرارك. في حال القبول، سيتم دمج التغييرات تلقائياً في الشجرة.', 'ar', 'suggestions'),
('suggestions.confirm_send', 'Confirm & Send', 'en', 'suggestions'),
('suggestions.confirm_send', 'تأكيد وإرسال', 'ar', 'suggestions'),
('suggestions.type.member_edit', 'Member Edit', 'en', 'suggestions'),
('suggestions.type.member_edit', 'تعديل عضو', 'ar', 'suggestions'),
('suggestions.type.add_member', 'Add Member', 'en', 'suggestions'),
('suggestions.type.add_member', 'إضافة عضو', 'ar', 'suggestions'),
('suggestions.type.correction', 'Correction', 'en', 'suggestions'),
('suggestions.type.correction', 'تصحيح', 'ar', 'suggestions'),
('suggestions.type.general', 'General', 'en', 'suggestions'),
('suggestions.type.general', 'عام', 'ar', 'suggestions')
ON CONFLICT (key, language_code) DO NOTHING;
