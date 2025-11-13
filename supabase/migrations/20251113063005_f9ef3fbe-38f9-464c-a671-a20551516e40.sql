-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create function to log admin settings changes
CREATE OR REPLACE FUNCTION public.log_admin_settings_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log custom_javascript changes
  IF (TG_OP = 'UPDATE' AND OLD.setting_key = 'custom_javascript') OR 
     (TG_OP = 'INSERT' AND NEW.setting_key = 'custom_javascript') THEN
    
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action_type,
      table_name,
      record_id,
      old_value,
      new_value
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for admin_settings changes
DROP TRIGGER IF EXISTS audit_admin_settings_changes ON public.admin_settings;
CREATE TRIGGER audit_admin_settings_changes
  AFTER INSERT OR UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_settings_change();

-- Create index for faster audit log queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);