CREATE OR REPLACE FUNCTION public.admin_change_user_package(target_user_id uuid, new_package_id uuid, change_type text DEFAULT 'paid'::text, custom_amount numeric DEFAULT NULL)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  package_record record;
  current_subscription_id uuid;
  invoice_id uuid;
  final_amount numeric;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only admins can change user packages';
  END IF;

  SELECT * INTO package_record FROM packages WHERE id = new_package_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found or inactive';
  END IF;

  SELECT id INTO current_subscription_id 
  FROM user_subscriptions 
  WHERE user_id = target_user_id AND status = 'active'
  LIMIT 1;

  IF change_type = 'free' THEN
    IF current_subscription_id IS NOT NULL THEN
      UPDATE user_subscriptions
      SET package_id = new_package_id, updated_at = NOW()
      WHERE id = current_subscription_id;
    ELSE
      INSERT INTO user_subscriptions (user_id, package_id, status, started_at, expires_at)
      VALUES (target_user_id, new_package_id, 'active', NOW(), NOW() + INTERVAL '1 year');
    END IF;
  ELSE
    final_amount := COALESCE(custom_amount, package_record.price_sar, package_record.price_usd, 0);
    
    SELECT public.create_invoice(
      target_user_id,
      new_package_id,
      final_amount,
      'SAR',
      NULL
    ) INTO invoice_id;
    
    IF invoice_id IS NULL THEN
      RAISE EXCEPTION 'Failed to create invoice';
    END IF;
  END IF;

  RETURN TRUE;
END;
$function$;