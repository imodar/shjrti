-- Add missing email template: edit_suggestion_confirmed
INSERT INTO public.email_templates (
  template_key, 
  template_name, 
  subject, 
  body, 
  variables, 
  is_active
) VALUES (
  'edit_suggestion_confirmed',
  '{"ar": "تأكيد استلام اقتراح التعديل", "en": "Edit Suggestion Confirmed"}'::jsonb,
  '{"ar": "تم استلام اقتراحك بنجاح", "en": "Your Suggestion Was Received"}'::jsonb,
  '{"ar": "<div dir=\"rtl\" style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; direction: rtl;\"><div style=\"background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);\"><h1 style=\"color: #047857; margin-bottom: 20px; font-size: 24px;\">مرحباً {{name}}،</h1><p style=\"color: #374151; line-height: 1.6; margin-bottom: 15px;\">شكراً لك على مشاركتك معنا! تم استلام اقتراحك لتعديل شجرة العائلة <strong>{{familyName}}</strong> بنجاح.</p><div style=\"background-color: #f3f4f6; border-right: 4px solid #047857; padding: 15px; margin: 20px 0; border-radius: 4px;\"><p style=\"color: #1f2937; margin: 0; font-weight: 500;\">اقتراحك:</p><p style=\"color: #4b5563; margin: 10px 0 0 0;\">{{suggestionText}}</p></div><p style=\"color: #374151; line-height: 1.6; margin-bottom: 15px;\">سيقوم فريقنا بمراجعة اقتراحك وسنُعلمك بالنتيجة قريباً.</p><p style=\"color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;\">مع تحياتنا،<br>فريق شجرة العائلة</p></div></div>", "en": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;\"><div style=\"background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);\"><h1 style=\"color: #047857; margin-bottom: 20px; font-size: 24px;\">Hello {{name}},</h1><p style=\"color: #374151; line-height: 1.6; margin-bottom: 15px;\">Thank you for your contribution! Your suggestion to edit the <strong>{{familyName}}</strong> family tree has been successfully received.</p><div style=\"background-color: #f3f4f6; border-left: 4px solid #047857; padding: 15px; margin: 20px 0; border-radius: 4px;\"><p style=\"color: #1f2937; margin: 0; font-weight: 500;\">Your suggestion:</p><p style=\"color: #4b5563; margin: 10px 0 0 0;\">{{suggestionText}}</p></div><p style=\"color: #374151; line-height: 1.6; margin-bottom: 15px;\">Our team will review your suggestion and notify you of the outcome soon.</p><p style=\"color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;\">Best regards,<br>Family Tree Team</p></div></div>"}'::jsonb,
  ARRAY['name', 'familyName', 'suggestionText'],
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = now();