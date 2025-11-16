-- إنشاء جدول لتسجيل محاولات تسجيل الدخول
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  failure_reason TEXT
);

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time 
ON public.login_attempts(email, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time 
ON public.login_attempts(ip_address, attempted_at DESC);

-- تمكين RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- سياسة للـ admins فقط
CREATE POLICY "Admins can view all login attempts"
ON public.login_attempts
FOR SELECT
USING (is_admin(auth.uid()));

-- Function للتحقق من عدد المحاولات الفاشلة
CREATE OR REPLACE FUNCTION public.check_failed_login_attempts(
  user_email TEXT,
  max_attempts INT DEFAULT 5,
  time_window_minutes INT DEFAULT 15
)
RETURNS TABLE(
  is_allowed BOOLEAN,
  attempts_count INT,
  remaining_attempts INT,
  reset_time TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count INT;
  oldest_attempt TIMESTAMP WITH TIME ZONE;
BEGIN
  -- حساب عدد المحاولات الفاشلة
  SELECT COUNT(*), MIN(attempted_at)
  INTO attempt_count, oldest_attempt
  FROM public.login_attempts
  WHERE email = user_email
    AND success = FALSE
    AND attempted_at > NOW() - (time_window_minutes || ' minutes')::INTERVAL;
  
  -- حساب وقت الإعادة
  RETURN QUERY SELECT 
    attempt_count < max_attempts,
    attempt_count,
    GREATEST(0, max_attempts - attempt_count),
    CASE 
      WHEN oldest_attempt IS NOT NULL 
      THEN oldest_attempt + (time_window_minutes || ' minutes')::INTERVAL
      ELSE NOW()
    END;
END;
$$;

-- Function لتسجيل محاولة تسجيل الدخول
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  user_email TEXT,
  user_ip TEXT,
  user_agent_text TEXT,
  is_success BOOLEAN,
  reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_id UUID;
BEGIN
  INSERT INTO public.login_attempts (
    email,
    ip_address,
    user_agent,
    success,
    failure_reason
  ) VALUES (
    user_email,
    user_ip,
    user_agent_text,
    is_success,
    reason
  )
  RETURNING id INTO attempt_id;
  
  RETURN attempt_id;
END;
$$;

-- Function لتنظيف المحاولات القديمة (أكثر من 30 يوم)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts
  WHERE attempted_at < NOW() - INTERVAL '30 days';
END;
$$;