-- Create email_templates table for managing email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  template_name JSONB NOT NULL DEFAULT '{}'::jsonb,
  subject JSONB NOT NULL DEFAULT '{}'::jsonb,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON public.email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON public.email_logs(template_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Everyone can read active email templates"
  ON public.email_templates
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for email_logs
CREATE POLICY "Admins can view all email logs"
  ON public.email_logs
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role can insert email logs"
  ON public.email_logs
  FOR INSERT
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_key, template_name, subject, body, description, variables) VALUES
('welcome', 
 '{"en": "Welcome Email", "ar": "بريد الترحيب"}'::jsonb,
 '{"en": "Welcome to Family Tree", "ar": "مرحباً بك في شجرة العائلة"}'::jsonb,
 '{"en": "<h1>Welcome {{name}}!</h1><p>Thank you for registering with Family Tree.</p><p>We''re excited to have you on board.</p>", "ar": "<h1>مرحباً {{name}}!</h1><p>شكراً لتسجيلك في شجرة العائلة.</p><p>نحن متحمسون لانضمامك.</p>"}'::jsonb,
 'Email sent after user registration',
 ARRAY['name', 'email']),

('payment_confirmation',
 '{"en": "Payment Confirmation", "ar": "تأكيد الدفع"}'::jsonb,
 '{"en": "Payment Received - {{amount}} {{currency}}", "ar": "تم استلام الدفع - {{amount}} {{currency}}"}'::jsonb,
 '{"en": "<h1>Payment Confirmed</h1><p>Hello {{name}},</p><p>We have received your payment of {{amount}} {{currency}} for {{packageName}}.</p><p>Invoice Number: {{invoiceNumber}}</p><p>Thank you for your payment!</p>", "ar": "<h1>تم تأكيد الدفع</h1><p>مرحباً {{name}}،</p><p>لقد استلمنا دفعتك بقيمة {{amount}} {{currency}} للباقة {{packageName}}.</p><p>رقم الفاتورة: {{invoiceNumber}}</p><p>شكراً لدفعك!</p>"}'::jsonb,
 'Email sent after successful payment',
 ARRAY['name', 'email', 'amount', 'currency', 'packageName', 'invoiceNumber']),

('subscription_renewal',
 '{"en": "Subscription Renewal Reminder", "ar": "تذكير بتجديد الاشتراك"}'::jsonb,
 '{"en": "Your subscription expires soon", "ar": "اشتراكك ينتهي قريباً"}'::jsonb,
 '{"en": "<h1>Subscription Renewal</h1><p>Hello {{name}},</p><p>Your subscription to {{packageName}} will expire on {{expiryDate}}.</p><p>Please renew to continue enjoying our services.</p>", "ar": "<h1>تجديد الاشتراك</h1><p>مرحباً {{name}}،</p><p>اشتراكك في {{packageName}} سينتهي في {{expiryDate}}.</p><p>يرجى التجديد لمواصلة الاستمتاع بخدماتنا.</p>"}'::jsonb,
 'Email sent before subscription expires',
 ARRAY['name', 'email', 'packageName', 'expiryDate']),

('temp_password',
 '{"en": "Temporary Password", "ar": "كلمة مرور مؤقتة"}'::jsonb,
 '{"en": "Your temporary password", "ar": "كلمة المرور المؤقتة الخاصة بك"}'::jsonb,
 '{"en": "<h1>Temporary Password</h1><p>Hello {{name}},</p><p>Your temporary password is: <strong>{{tempPassword}}</strong></p><p>Please change it after logging in.</p>", "ar": "<h1>كلمة مرور مؤقتة</h1><p>مرحباً {{name}}،</p><p>كلمة المرور المؤقتة الخاصة بك: <strong>{{tempPassword}}</strong></p><p>يرجى تغييرها بعد تسجيل الدخول.</p>"}'::jsonb,
 'Email with temporary password for login',
 ARRAY['name', 'email', 'tempPassword']),

('password_reset_otp',
 '{"en": "Password Reset Code", "ar": "كود إعادة تعيين كلمة المرور"}'::jsonb,
 '{"en": "Reset your password", "ar": "إعادة تعيين كلمة المرور"}'::jsonb,
 '{"en": "<h1>Password Reset</h1><p>Hello {{name}},</p><p>Your password reset code is: <strong>{{otp}}</strong></p><p>This code expires in {{expiryMinutes}} minutes.</p>", "ar": "<h1>إعادة تعيين كلمة المرور</h1><p>مرحباً {{name}}،</p><p>كود إعادة تعيين كلمة المرور: <strong>{{otp}}</strong></p><p>هذا الكود صالح لمدة {{expiryMinutes}} دقيقة.</p>"}'::jsonb,
 'Email with OTP code for password reset',
 ARRAY['name', 'email', 'otp', 'expiryMinutes']),

('package_upgrade',
 '{"en": "Package Upgraded Successfully", "ar": "تم ترقية الباقة بنجاح"}'::jsonb,
 '{"en": "Your package has been upgraded", "ar": "تم ترقية باقتك"}'::jsonb,
 '{"en": "<h1>Package Upgraded!</h1><p>Hello {{name}},</p><p>Your package has been upgraded to {{newPackage}}.</p><p>Amount paid: {{amount}} {{currency}}</p><p>Invoice: {{invoiceNumber}}</p><p>Thank you for upgrading!</p>", "ar": "<h1>تم ترقية الباقة!</h1><p>مرحباً {{name}}،</p><p>تم ترقية باقتك إلى {{newPackage}}.</p><p>المبلغ المدفوع: {{amount}} {{currency}}</p><p>الفاتورة: {{invoiceNumber}}</p><p>شكراً لترقيتك!</p>"}'::jsonb,
 'Email sent after package upgrade with payment details',
 ARRAY['name', 'email', 'newPackage', 'amount', 'currency', 'invoiceNumber']),

('package_downgrade_warning',
 '{"en": "Package Downgrade Scheduled", "ar": "تم جدولة تخفيض الباقة"}'::jsonb,
 '{"en": "Your package downgrade is scheduled", "ar": "تم جدولة تخفيض باقتك"}'::jsonb,
 '{"en": "<h1>Package Downgrade Scheduled</h1><p>Hello {{name}},</p><p>Your package downgrade to {{newPackage}} has been scheduled for {{scheduledDate}}.</p><p><strong>Important:</strong> The downgrade will only be applied when your number of family members and trees is within the limits of the new package.</p><p>Current limits: {{currentMembers}} members, {{currentTrees}} trees</p><p>New package limits: {{maxMembers}} members, {{maxTrees}} trees</p>", "ar": "<h1>تم جدولة تخفيض الباقة</h1><p>مرحباً {{name}}،</p><p>تم جدولة تخفيض باقتك إلى {{newPackage}} في تاريخ {{scheduledDate}}.</p><p><strong>مهم:</strong> سيتم تطبيق التخفيض فقط عندما يكون عدد أفراد العائلة والأشجار ضمن حدود الباقة الجديدة.</p><p>الحدود الحالية: {{currentMembers}} عضو، {{currentTrees}} شجرة</p><p>حدود الباقة الجديدة: {{maxMembers}} عضو، {{maxTrees}} شجرة</p>"}'::jsonb,
 'Email confirming package downgrade with warning about limits',
 ARRAY['name', 'email', 'newPackage', 'scheduledDate', 'currentMembers', 'currentTrees', 'maxMembers', 'maxTrees']),

('edit_suggestion_verification',
 '{"en": "Verify Your Edit Suggestion", "ar": "تحقق من اقتراح التعديل"}'::jsonb,
 '{"en": "Verify Your Edit Suggestion for {{familyName}}", "ar": "تحقق من اقتراح التعديل لـ {{familyName}}"}'::jsonb,
 '{"en": "<h1>Verify Your Edit Suggestion</h1><p>Hello {{name}},</p><p>Thank you for suggesting an edit to {{familyName}}.</p><p>Please use the following verification code:</p><h2 style=\"font-size: 32px; letter-spacing: 4px; color: #2563eb;\">{{verificationCode}}</h2><p>This code expires in {{expiryMinutes}} minutes.</p>", "ar": "<h1>تحقق من اقتراح التعديل</h1><p>مرحباً {{name}}،</p><p>شكراً لاقتراحك تعديلاً على {{familyName}}.</p><p>يرجى استخدام كود التحقق التالي:</p><h2 style=\"font-size: 32px; letter-spacing: 4px; color: #2563eb;\">{{verificationCode}}</h2><p>هذا الكود صالح لمدة {{expiryMinutes}} دقيقة.</p>"}'::jsonb,
 'Email with verification code for edit suggestion',
 ARRAY['name', 'email', 'familyName', 'verificationCode', 'expiryMinutes']),

('suggestion_submitted',
 '{"en": "Suggestion Submitted Successfully", "ar": "تم تقديم الاقتراح بنجاح"}'::jsonb,
 '{"en": "Your Edit Suggestion Has Been Submitted", "ar": "تم تقديم اقتراح التعديل"}'::jsonb,
 '{"en": "<h1>Suggestion Submitted Successfully</h1><p>Hello {{name}},</p><p>Thank you for your suggestion to {{familyName}}.</p><p>Your suggestion has been submitted and the tree owner will review it shortly.</p><p>We''ll send you an email when your suggestion is reviewed.</p>", "ar": "<h1>تم تقديم الاقتراح بنجاح</h1><p>مرحباً {{name}}،</p><p>شكراً لاقتراحك على {{familyName}}.</p><p>تم تقديم اقتراحك وسيقوم صاحب الشجرة بمراجعته قريباً.</p><p>سنرسل لك بريداً إلكترونياً عند مراجعة اقتراحك.</p>"}'::jsonb,
 'Email confirming suggestion submission',
 ARRAY['name', 'email', 'familyName', 'suggestionText']),

('suggestion_accepted',
 '{"en": "Your Suggestion Was Accepted", "ar": "تم قبول اقتراحك"}'::jsonb,
 '{"en": "Great news! Your suggestion was accepted", "ar": "أخبار رائعة! تم قبول اقتراحك"}'::jsonb,
 '{"en": "<h1>Suggestion Accepted!</h1><p>Hello {{name}},</p><p>Great news! Your edit suggestion for {{familyName}} has been accepted by the tree owner.</p><p><strong>Your suggestion:</strong></p><p>{{suggestionText}}</p>{{#if adminNotes}}<p><strong>Admin notes:</strong></p><p>{{adminNotes}}</p>{{/if}}<p>Thank you for helping maintain accurate family history!</p>", "ar": "<h1>تم قبول الاقتراح!</h1><p>مرحباً {{name}}،</p><p>أخبار رائعة! تم قبول اقتراح التعديل الخاص بك لـ {{familyName}} من قبل صاحب الشجرة.</p><p><strong>اقتراحك:</strong></p><p>{{suggestionText}}</p>{{#if adminNotes}}<p><strong>ملاحظات المسؤول:</strong></p><p>{{adminNotes}}</p>{{/if}}<p>شكراً لمساعدتك في الحفاظ على دقة تاريخ العائلة!</p>"}'::jsonb,
 'Email when suggestion is accepted',
 ARRAY['name', 'email', 'familyName', 'suggestionText', 'adminNotes']),

('suggestion_rejected',
 '{"en": "Your Suggestion Update", "ar": "تحديث حول اقتراحك"}'::jsonb,
 '{"en": "Update on your edit suggestion", "ar": "تحديث حول اقتراح التعديل"}'::jsonb,
 '{"en": "<h1>Suggestion Update</h1><p>Hello {{name}},</p><p>Thank you for your suggestion to {{familyName}}.</p><p>After review, the tree owner has decided not to accept this suggestion at this time.</p><p><strong>Your suggestion:</strong></p><p>{{suggestionText}}</p>{{#if adminNotes}}<p><strong>Admin notes:</strong></p><p>{{adminNotes}}</p>{{/if}}<p>We appreciate your contribution to maintaining accurate family history.</p>", "ar": "<h1>تحديث الاقتراح</h1><p>مرحباً {{name}}،</p><p>شكراً لاقتراحك على {{familyName}}.</p><p>بعد المراجعة، قرر صاحب الشجرة عدم قبول هذا الاقتراح في الوقت الحالي.</p><p><strong>اقتراحك:</strong></p><p>{{suggestionText}}</p>{{#if adminNotes}}<p><strong>ملاحظات المسؤول:</strong></p><p>{{adminNotes}}</p>{{/if}}<p>نقدر مساهمتك في الحفاظ على دقة تاريخ العائلة.</p>"}'::jsonb,
 'Email when suggestion is rejected',
 ARRAY['name', 'email', 'familyName', 'suggestionText', 'adminNotes'])

ON CONFLICT (template_key) DO NOTHING;