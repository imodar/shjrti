-- Insert invitation email template
INSERT INTO public.email_templates (template_key, template_name, subject, body, description, variables, is_active)
VALUES (
  'family_invitation',
  '{"en": "Family Collaboration Invitation", "ar": "دعوة للتعاون في إدارة الشجرة"}'::jsonb,
  '{"en": "You''ve been invited to manage a family tree", "ar": "تمت دعوتك لإدارة شجرة عائلة"}'::jsonb,
  '{"en": "<h2>Hello!</h2><p>You have been invited by <strong>{{inviter_name}}</strong> to help manage the family tree <strong>\"{{family_name}}\"</strong> on Shjrti.</p><p>Click the link below to accept the invitation:</p><p><a href=\"{{accept_url}}\">Accept Invitation</a></p><p>This invitation expires in 7 days.</p><p>Best regards,<br/>Shjrti Team</p>", "ar": "<h2>مرحباً!</h2><p>تمت دعوتك من قبل <strong>{{inviter_name}}</strong> للمساعدة في إدارة شجرة عائلة <strong>\"{{family_name}}\"</strong> على شجرتي.</p><p>اضغط على الرابط أدناه لقبول الدعوة:</p><p><a href=\"{{accept_url}}\">قبول الدعوة</a></p><p>تنتهي صلاحية هذه الدعوة خلال 7 أيام.</p><p>مع أطيب التحيات،<br/>فريق شجرتي</p>"}'::jsonb,
  'Email sent when a tree owner invites a collaborator',
  ARRAY['inviter_name', 'family_name', 'accept_url'],
  true
)
ON CONFLICT (template_key) DO NOTHING;