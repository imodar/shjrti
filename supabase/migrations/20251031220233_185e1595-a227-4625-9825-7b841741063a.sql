-- Add translations for SuggestEditDialog
INSERT INTO translations (key, language_code, value, category) VALUES
-- Dialog titles and descriptions
('suggestEdit.title', 'en', 'Suggest an Edit', 'suggestions'),
('suggestEdit.title', 'ar', 'اقترح تعديل', 'suggestions'),
('suggestEdit.descriptionWithMember', 'en', 'Suggest changes for {memberName}', 'suggestions'),
('suggestEdit.descriptionWithMember', 'ar', 'اقترح تغييرات لـ {memberName}', 'suggestions'),
('suggestEdit.descriptionGeneral', 'en', 'Suggest changes to this family tree', 'suggestions'),
('suggestEdit.descriptionGeneral', 'ar', 'اقترح تغييرات لشجرة العائلة', 'suggestions'),

-- Form labels
('suggestEdit.yourName', 'en', 'Your Name', 'suggestions'),
('suggestEdit.yourName', 'ar', 'اسمك', 'suggestions'),
('suggestEdit.yourEmail', 'en', 'Your Email', 'suggestions'),
('suggestEdit.yourEmail', 'ar', 'بريدك الإلكتروني', 'suggestions'),
('suggestEdit.yourSuggestion', 'en', 'Your Suggestion', 'suggestions'),
('suggestEdit.yourSuggestion', 'ar', 'اقتراحك', 'suggestions'),

-- Placeholders
('suggestEdit.namePlaceholder', 'en', 'Enter your full name', 'suggestions'),
('suggestEdit.namePlaceholder', 'ar', 'أدخل اسمك الكامل', 'suggestions'),
('suggestEdit.emailPlaceholder', 'en', 'your.email@example.com', 'suggestions'),
('suggestEdit.emailPlaceholder', 'ar', 'بريدك@مثال.com', 'suggestions'),
('suggestEdit.suggestionPlaceholder', 'en', 'Describe the changes you''d like to suggest...', 'suggestions'),
('suggestEdit.suggestionPlaceholder', 'ar', 'صف التغييرات التي تقترحها...', 'suggestions'),
('suggestEdit.codePlaceholder', 'en', 'Enter 6-digit code', 'suggestions'),
('suggestEdit.codePlaceholder', 'ar', 'أدخل الرمز المكون من 6 أرقام', 'suggestions'),

-- Helper text
('suggestEdit.emailHelper', 'en', 'We''ll send a verification code to this email', 'suggestions'),
('suggestEdit.emailHelper', 'ar', 'سنرسل رمز التحقق إلى هذا البريد', 'suggestions'),
('suggestEdit.codeExpiry', 'en', 'The code will expire in 10 minutes', 'suggestions'),
('suggestEdit.codeExpiry', 'ar', 'سينتهي الرمز خلال 10 دقائق', 'suggestions'),

-- Verification step
('suggestEdit.verifyTitle', 'en', 'Verify Your Email', 'suggestions'),
('suggestEdit.verifyTitle', 'ar', 'تحقق من بريدك الإلكتروني', 'suggestions'),
('suggestEdit.verifyDescription', 'en', 'We''ve sent a 6-digit verification code to {email}', 'suggestions'),
('suggestEdit.verifyDescription', 'ar', 'أرسلنا رمز تحقق مكون من 6 أرقام إلى {email}', 'suggestions'),
('suggestEdit.verificationCode', 'en', 'Verification Code', 'suggestions'),
('suggestEdit.verificationCode', 'ar', 'رمز التحقق', 'suggestions'),

-- Buttons
('suggestEdit.cancel', 'en', 'Cancel', 'suggestions'),
('suggestEdit.cancel', 'ar', 'إلغاء', 'suggestions'),
('suggestEdit.submit', 'en', 'Submit Suggestion', 'suggestions'),
('suggestEdit.submit', 'ar', 'إرسال الاقتراح', 'suggestions'),
('suggestEdit.back', 'en', 'Back', 'suggestions'),
('suggestEdit.back', 'ar', 'رجوع', 'suggestions'),
('suggestEdit.verifySubmit', 'en', 'Verify & Submit', 'suggestions'),
('suggestEdit.verifySubmit', 'ar', 'تحقق وإرسال', 'suggestions'),

-- Toast messages
('suggestEdit.fillAllFields', 'en', 'Please fill in all fields', 'suggestions'),
('suggestEdit.fillAllFields', 'ar', 'يرجى ملء جميع الحقول', 'suggestions'),
('suggestEdit.invalidEmail', 'en', 'Please enter a valid email address', 'suggestions'),
('suggestEdit.invalidEmail', 'ar', 'يرجى إدخال بريد إلكتروني صحيح', 'suggestions'),
('suggestEdit.codeSent', 'en', 'Verification code sent to your email!', 'suggestions'),
('suggestEdit.codeSent', 'ar', 'تم إرسال رمز التحقق إلى بريدك!', 'suggestions'),
('suggestEdit.submitError', 'en', 'Failed to submit suggestion. Please try again later.', 'suggestions'),
('suggestEdit.submitError', 'ar', 'فشل إرسال الاقتراح. يرجى المحاولة لاحقاً.', 'suggestions'),
('suggestEdit.invalidCode', 'en', 'Please enter the 6-digit verification code', 'suggestions'),
('suggestEdit.invalidCode', 'ar', 'يرجى إدخال رمز التحقق المكون من 6 أرقام', 'suggestions'),
('suggestEdit.submitSuccess', 'en', 'Your suggestion has been submitted successfully!', 'suggestions'),
('suggestEdit.submitSuccess', 'ar', 'تم إرسال اقتراحك بنجاح!', 'suggestions'),
('suggestEdit.codeExpired', 'en', 'Verification code has expired. Please submit again.', 'suggestions'),
('suggestEdit.codeExpired', 'ar', 'انتهت صلاحية رمز التحقق. يرجى الإرسال مرة أخرى.', 'suggestions'),
('suggestEdit.wrongCode', 'en', 'Invalid verification code. Please check and try again.', 'suggestions'),
('suggestEdit.wrongCode', 'ar', 'رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.', 'suggestions'),
('suggestEdit.verifyError', 'en', 'Failed to verify code. Please try again.', 'suggestions'),
('suggestEdit.verifyError', 'ar', 'فشل التحقق من الرمز. يرجى المحاولة مرة أخرى.', 'suggestions')

ON CONFLICT (key, language_code) DO UPDATE 
SET value = EXCLUDED.value, updated_at = now();