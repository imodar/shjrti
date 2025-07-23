-- Update the get_user_subscription_details function to return package name as jsonb
CREATE OR REPLACE FUNCTION public.get_user_subscription_details(user_uuid uuid)
 RETURNS TABLE(subscription_id uuid, package_name jsonb, status text, expires_at timestamp with time zone, days_until_expiry integer, is_expired boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
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