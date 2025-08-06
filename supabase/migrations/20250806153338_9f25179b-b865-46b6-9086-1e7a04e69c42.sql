-- إضافة جدول لحالات المستخدمين
CREATE TYPE public.user_status_type AS ENUM (
  'active',           -- فعال
  'pending',          -- بانتظار التفعيل
  'suspended',        -- موقف من الإدمن
  'inactive'          -- غير مفعل
);

-- إضافة جدول user_status
CREATE TABLE public.user_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status user_status_type NOT NULL DEFAULT 'pending',
  reason TEXT NULL,
  updated_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;

-- إنشاء policies
CREATE POLICY "Admins can manage all user statuses" 
ON public.user_status 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own status" 
ON public.user_status 
FOR SELECT 
USING (auth.uid() = user_id);

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_user_status_updated_at
BEFORE UPDATE ON public.user_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء function لتحديث حالة المستخدم
CREATE OR REPLACE FUNCTION public.update_user_status(
  target_user_id UUID,
  new_status user_status_type,
  status_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- التحقق من أن المستخدم الحالي إدمن
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only admins can update user status';
  END IF;

  -- إدراج أو تحديث حالة المستخدم
  INSERT INTO user_status (user_id, status, reason, updated_by)
  VALUES (target_user_id, new_status, status_reason, auth.uid())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    reason = EXCLUDED.reason,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  RETURN TRUE;
END;
$function$;

-- حذف الدالة الموجودة
DROP FUNCTION IF EXISTS public.get_all_users_for_admin();

-- إعادة إنشاء الدالة مع الحقول الجديدة
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(
  id uuid, 
  email text, 
  email_confirmed_at timestamp with time zone, 
  phone text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  profile_id uuid, 
  first_name text, 
  last_name text, 
  profile_phone text,
  user_status user_status_type,
  status_reason text,
  subscription_status text,
  subscription_package_name jsonb,
  subscription_expires_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.phone,
    au.created_at,
    au.updated_at,
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.phone as profile_phone,
    COALESCE(us.status, 'pending'::user_status_type) as user_status,
    us.reason as status_reason,
    COALESCE(sub.status, 'none') as subscription_status,
    pkg.name as subscription_package_name,
    sub.expires_at as subscription_expires_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.user_id
  LEFT JOIN public.user_status us ON au.id = us.user_id
  LEFT JOIN public.user_subscriptions sub ON au.id = sub.user_id AND sub.status = 'active'
  LEFT JOIN public.packages pkg ON sub.package_id = pkg.id
  ORDER BY au.created_at DESC;
$function$;