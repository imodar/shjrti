
-- Add a function to check if user subscription is expired
CREATE OR REPLACE FUNCTION public.is_subscription_expired(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Add a function to get user subscription details
CREATE OR REPLACE FUNCTION public.get_user_subscription_details(user_uuid uuid)
RETURNS TABLE (
  subscription_id uuid,
  package_name text,
  status text,
  expires_at timestamp with time zone,
  days_until_expiry integer,
  is_expired boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    us.id,
    p.name,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);
