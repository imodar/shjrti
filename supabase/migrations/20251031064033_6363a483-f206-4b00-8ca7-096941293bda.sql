BEGIN;
-- 1) Remove overloaded 2-arg version that conflicts with RPC resolution
DROP FUNCTION IF EXISTS public.complete_payment_and_upgrade(uuid, text);

-- 2) Replace the main function with robust logic (no dependency on 'pending' status,
--    and no ON CONFLICT requirement on partial unique index)
CREATE OR REPLACE FUNCTION public.complete_payment_and_upgrade(
  p_invoice_id uuid,
  p_payment_id text DEFAULT NULL::text,
  p_payment_gateway text DEFAULT 'paypal'::text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invoice_record RECORD;
BEGIN
  -- Fetch invoice regardless of current payment_status
  SELECT * INTO invoice_record
  FROM invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Update invoice safely depending on gateway
  IF p_payment_gateway = 'paypal' THEN
    UPDATE invoices
    SET 
      payment_status = 'paid',
      status = 'paid',
      paypal_order_id = COALESCE(paypal_order_id, p_payment_id),
      payment_gateway = 'paypal',
      updated_at = NOW()
    WHERE id = p_invoice_id;
  ELSE
    UPDATE invoices
    SET 
      payment_status = 'paid',
      status = 'paid',
      stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, p_payment_id),
      payment_gateway = 'stripe',
      updated_at = NOW()
    WHERE id = p_invoice_id;
  END IF;

  -- Upsert active subscription without relying on partial unique indexes
  UPDATE user_subscriptions
  SET 
    package_id = invoice_record.package_id,
    started_at = NOW(),
    expires_at = NOW() + INTERVAL '1 year',
    updated_at = NOW()
  WHERE user_id = invoice_record.user_id
    AND status = 'active';

  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (
      user_id, package_id, status, started_at, expires_at
    ) VALUES (
      invoice_record.user_id,
      invoice_record.package_id,
      'active',
      NOW(),
      NOW() + INTERVAL '1 year'
    );
  END IF;

  RETURN TRUE;
END;
$function$;
COMMIT;