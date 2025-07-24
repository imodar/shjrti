-- Phase 1: Critical Database Security Fixes

-- 1. Enable RLS on newsletter_subscriptions table and add proper policies
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Add policy for newsletter subscriptions - only admins can view all subscriptions
CREATE POLICY "Admins can view all newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Allow public insert for newsletter subscriptions (anonymous users can subscribe)
CREATE POLICY "Allow public newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- 2. Fix Database Functions Security - Add proper search_path to prevent search_path injection attacks

-- Update get_user_family_ids function
CREATE OR REPLACE FUNCTION public.get_user_family_ids(user_uuid uuid)
 RETURNS TABLE(family_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  -- Get families where user is creator
  SELECT id as family_id FROM families WHERE creator_id = user_uuid
  UNION
  -- Get families where user is a member (using direct query without RLS)
  SELECT fm.family_id FROM family_members fm WHERE fm.user_id = user_uuid;
$function$;

-- Update generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    invoice_num TEXT;
    year_month TEXT;
    sequence_num INTEGER;
BEGIN
    -- Get current year and month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_month || '-%';
    
    -- Generate invoice number
    invoice_num := 'INV-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$function$;

-- Update complete_payment_and_upgrade function
CREATE OR REPLACE FUNCTION public.complete_payment_and_upgrade(p_invoice_id uuid, p_stripe_payment_intent_id text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    invoice_record RECORD;
BEGIN
    -- Get invoice details
    SELECT * INTO invoice_record
    FROM invoices
    WHERE id = p_invoice_id AND payment_status = 'pending';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update invoice status
    UPDATE invoices
    SET 
        payment_status = 'paid',
        status = 'paid',
        stripe_payment_intent_id = p_stripe_payment_intent_id,
        updated_at = NOW()
    WHERE id = p_invoice_id;
    
    -- Create or update user subscription (completely user-centric, no family involved)
    INSERT INTO user_subscriptions (
        user_id,
        package_id,
        status,
        started_at,
        expires_at
    )
    VALUES (
        invoice_record.user_id,
        invoice_record.package_id,
        'active',
        NOW(),
        NOW() + INTERVAL '1 year'
    )
    ON CONFLICT (user_id, status) WHERE status = 'active'
    DO UPDATE SET
        package_id = EXCLUDED.package_id,
        started_at = EXCLUDED.started_at,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$function$;

-- Update create_invoice function
CREATE OR REPLACE FUNCTION public.create_invoice(p_user_id uuid, p_package_id uuid, p_amount numeric, p_currency text DEFAULT 'SAR'::text, p_family_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    invoice_id UUID;
    due_date_val TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set due date to 30 days from now
    due_date_val := NOW() + INTERVAL '30 days';
    
    -- Insert new invoice (family_id can be null for user-based subscriptions)
    INSERT INTO invoices (
        user_id,
        family_id,
        package_id,
        amount,
        currency,
        payment_status,
        invoice_number,
        due_date,
        status
    )
    VALUES (
        p_user_id,
        p_family_id,  -- This can now be NULL
        p_package_id,
        p_amount,
        p_currency,
        'pending',
        generate_invoice_number(),
        due_date_val,
        'pending'
    )
    RETURNING id INTO invoice_id;
    
    RETURN invoice_id;
END;
$function$;

-- 3. Create a secure admin role checking function to prevent recursive RLS issues
CREATE OR REPLACE FUNCTION public.is_admin_secure(user_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$function$;