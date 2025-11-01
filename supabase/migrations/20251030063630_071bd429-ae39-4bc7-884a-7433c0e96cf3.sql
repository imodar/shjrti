-- إضافة ترجمات لوحة اقتراحات التعديل
INSERT INTO translations (key, language_code, value, category) VALUES
  -- العناوين والأوصاف
  ('suggestions.title', 'ar', 'اقتراحات التعديل', 'suggestions'),
  ('suggestions.title', 'en', 'Suggested Edits', 'suggestions'),
  ('suggestions.pending_count', 'ar', 'اقتراح معلق', 'suggestions'),
  ('suggestions.pending_count', 'en', 'pending suggestions', 'suggestions'),
  ('suggestions.no_pending', 'ar', 'لا توجد اقتراحات معلقة', 'suggestions'),
  ('suggestions.no_pending', 'en', 'No pending suggestions', 'suggestions'),
  ('suggestions.filter_by_status', 'ar', 'تصفية حسب الحالة', 'suggestions'),
  ('suggestions.filter_by_status', 'en', 'Filter by status', 'suggestions'),
  ('suggestions.no_suggestions_found', 'ar', 'لم يتم العثور على اقتراحات', 'suggestions'),
  ('suggestions.no_suggestions_found', 'en', 'No suggestions found', 'suggestions'),
  
  -- حالات الاقتراحات
  ('suggestions.status.all', 'ar', 'جميع الاقتراحات', 'suggestions'),
  ('suggestions.status.all', 'en', 'All Suggestions', 'suggestions'),
  ('suggestions.status.pending', 'ar', 'معلق', 'suggestions'),
  ('suggestions.status.pending', 'en', 'Pending', 'suggestions'),
  ('suggestions.status.under_review', 'ar', 'قيد المراجعة', 'suggestions'),
  ('suggestions.status.under_review', 'en', 'Under Review', 'suggestions'),
  ('suggestions.status.accepted', 'ar', 'مقبول', 'suggestions'),
  ('suggestions.status.accepted', 'en', 'Accepted', 'suggestions'),
  ('suggestions.status.rejected', 'ar', 'مرفوض', 'suggestions'),
  ('suggestions.status.rejected', 'en', 'Rejected', 'suggestions'),
  
  -- الأزرار والإجراءات
  ('suggestions.accept', 'ar', 'قبول', 'suggestions'),
  ('suggestions.accept', 'en', 'Accept', 'suggestions'),
  ('suggestions.reject', 'ar', 'رفض', 'suggestions'),
  ('suggestions.reject', 'en', 'Reject', 'suggestions'),
  ('suggestions.cancel', 'ar', 'إلغاء', 'suggestions'),
  ('suggestions.cancel', 'en', 'Cancel', 'suggestions'),
  ('suggestions.confirm', 'ar', 'تأكيد', 'suggestions'),
  ('suggestions.confirm', 'en', 'Confirm', 'suggestions'),
  ('suggestions.notes', 'ar', 'ملاحظات: ', 'suggestions'),
  ('suggestions.notes', 'en', 'Notes: ', 'suggestions'),
  
  -- العناوين والأوصاف للنوافذ
  ('suggestions.accept_title', 'ar', 'قبول الاقتراح', 'suggestions'),
  ('suggestions.accept_title', 'en', 'Accept Suggestion', 'suggestions'),
  ('suggestions.reject_title', 'ar', 'رفض الاقتراح', 'suggestions'),
  ('suggestions.reject_title', 'en', 'Reject Suggestion', 'suggestions'),
  ('suggestions.accept_desc', 'ar', 'أضف ملاحظات اختيارية لشكر المساهم', 'suggestions'),
  ('suggestions.accept_desc', 'en', 'Add optional notes to thank the contributor', 'suggestions'),
  ('suggestions.reject_desc', 'ar', 'أضف ملاحظات اختيارية لشرح سبب عدم قبول هذا الاقتراح', 'suggestions'),
  ('suggestions.reject_desc', 'en', 'Add optional notes explaining why this suggestion isn''t being accepted', 'suggestions'),
  ('suggestions.add_notes_placeholder', 'ar', 'أضف ملاحظات (اختياري)', 'suggestions'),
  ('suggestions.add_notes_placeholder', 'en', 'Add notes (optional)', 'suggestions'),
  
  -- رسائل التأكيد والأخطاء
  ('suggestions.delete_confirm', 'ar', 'هل أنت متأكد من حذف هذا الاقتراح؟', 'suggestions'),
  ('suggestions.delete_confirm', 'en', 'Are you sure you want to delete this suggestion?', 'suggestions'),
  ('suggestions.deleted_success', 'ar', 'تم حذف الاقتراح', 'suggestions'),
  ('suggestions.deleted_success', 'en', 'Suggestion deleted', 'suggestions'),
  ('suggestions.load_error', 'ar', 'فشل تحميل الاقتراحات', 'suggestions'),
  ('suggestions.load_error', 'en', 'Failed to load suggestions', 'suggestions'),
  ('suggestions.delete_error', 'ar', 'فشل حذف الاقتراح', 'suggestions'),
  ('suggestions.delete_error', 'en', 'Failed to delete suggestion', 'suggestions'),
  ('suggestions.process_error', 'ar', 'فشل معالجة الاقتراح', 'suggestions'),
  ('suggestions.process_error', 'en', 'Failed to process suggestion', 'suggestions')
ON CONFLICT (key, language_code) DO UPDATE SET value = EXCLUDED.value;