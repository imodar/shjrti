-- Add email sender fields to email_templates table
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS from_email TEXT DEFAULT 'no-reply@shjrti.com',
ADD COLUMN IF NOT EXISTS from_name TEXT DEFAULT 'شجرتي',
ADD COLUMN IF NOT EXISTS reply_to TEXT;

-- Add comments for documentation
COMMENT ON COLUMN email_templates.from_email IS 'Email address used as sender (e.g., no-reply@shjrti.com)';
COMMENT ON COLUMN email_templates.from_name IS 'Display name for sender (e.g., شجرتي or Shjrti Support)';
COMMENT ON COLUMN email_templates.reply_to IS 'Optional reply-to email address for receiving replies';

-- Update existing templates with default values if needed
UPDATE email_templates 
SET 
  from_email = COALESCE(from_email, 'no-reply@shjrti.com'),
  from_name = COALESCE(from_name, 'شجرتي')
WHERE from_email IS NULL OR from_name IS NULL;