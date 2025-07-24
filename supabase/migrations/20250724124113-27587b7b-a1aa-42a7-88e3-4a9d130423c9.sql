-- Fix the final remaining functions that need search_path set

CREATE OR REPLACE FUNCTION public.get_user_subscription_details(user_uuid uuid)
 RETURNS TABLE(subscription_id uuid, package_name jsonb, status text, expires_at timestamp with time zone, days_until_expiry integer, is_expired boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT 
    us.id,
    p.name,  -- This will now return the jsonb object directly
    us.status,
    us.expires_at,
    CASE 
      WHEN us.expires_at IS NULL THEN NULL
      ELSE EXTRACT(days FROM (us.expires_at - now()))::integer
    END,
    CASE 
      WHEN us.expires_at IS NULL THEN false
      WHEN us.expires_at <= now() THEN true
      ELSE false
    END
  FROM user_subscriptions us
  JOIN packages p ON us.package_id = p.id
  WHERE us.user_id = user_uuid 
  AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_subscription_expired(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_subscriptions 
      WHERE user_id = user_uuid 
      AND status = 'active' 
      AND (expires_at IS NULL OR expires_at > now())
    ) THEN false
    ELSE true
  END;
$function$;

CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_record record;
BEGIN
  -- Check if user exists in profiles
  SELECT * INTO user_record FROM profiles WHERE email = admin_email;
  
  IF user_record.id IS NOT NULL THEN
    -- Insert into admin_users if not already exists
    INSERT INTO admin_users (user_id, email, role)
    VALUES (user_record.user_id, admin_email, 'admin')
    ON CONFLICT (email) DO NOTHING;
  END IF;
END;
$function$;

-- Update the original is_admin function too for completeness
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$function$;