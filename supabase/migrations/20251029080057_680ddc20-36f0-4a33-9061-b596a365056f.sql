-- إضافة ترجمات صفحة نجاح الدفع

-- النصوص العربية
INSERT INTO translations (language_code, key, value, category) VALUES
('ar', 'payment_success.verifying', 'جاري التحقق من الدفع...', 'payment'),
('ar', 'payment_success.please_wait', 'يرجى الانتظار بينما نتحقق من حالة دفعتك', 'payment'),
('ar', 'payment_success.success_title', 'تم الدفع بنجاح! 🎉', 'payment'),
('ar', 'payment_success.failed_title', 'فشل في الدفع', 'payment'),
('ar', 'payment_success.success_description', 'تم تفعيل اشتراكك وترقية حسابك بنجاح', 'payment'),
('ar', 'payment_success.failed_description', 'لم يتم إتمام عملية الدفع. يرجى المحاولة مرة أخرى.', 'payment'),
('ar', 'payment_success.invoice', 'الفاتورة', 'payment'),
('ar', 'payment_success.package', 'الباقة', 'payment'),
('ar', 'payment_success.payment_status', 'حالة الدفع', 'payment'),
('ar', 'payment_success.paid', 'مدفوع ✓', 'payment'),
('ar', 'payment_success.go_to_dashboard', 'الذهاب إلى حسابي', 'payment'),
('ar', 'payment_success.try_again', 'المحاولة مرة أخرى', 'payment')
ON CONFLICT (language_code, key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = now();

-- النصوص الإنجليزية
INSERT INTO translations (language_code, key, value, category) VALUES
('en', 'payment_success.verifying', 'Verifying Payment...', 'payment'),
('en', 'payment_success.please_wait', 'Please wait while we verify your payment status', 'payment'),
('en', 'payment_success.success_title', 'Payment Successful! 🎉', 'payment'),
('en', 'payment_success.failed_title', 'Payment Failed', 'payment'),
('en', 'payment_success.success_description', 'Your subscription has been activated successfully', 'payment'),
('en', 'payment_success.failed_description', 'Payment was not completed. Please try again.', 'payment'),
('en', 'payment_success.invoice', 'Invoice', 'payment'),
('en', 'payment_success.package', 'Package', 'payment'),
('en', 'payment_success.payment_status', 'Payment Status', 'payment'),
('en', 'payment_success.paid', 'Paid ✓', 'payment'),
('en', 'payment_success.go_to_dashboard', 'Go to My Account', 'payment'),
('en', 'payment_success.try_again', 'Try Again', 'payment')
ON CONFLICT (language_code, key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = now();