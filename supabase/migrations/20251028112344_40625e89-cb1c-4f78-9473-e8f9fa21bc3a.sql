-- Create payment gateway settings table
CREATE TABLE IF NOT EXISTS payment_gateway_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name TEXT NOT NULL DEFAULT 'paypal',
  is_active BOOLEAN DEFAULT true,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_gateway_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_gateway_settings
CREATE POLICY "Admins can manage payment gateway settings"
ON payment_gateway_settings
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Everyone can read active payment gateway settings"
ON payment_gateway_settings
FOR SELECT
USING (is_active = true);

-- Insert default PayPal settings
INSERT INTO payment_gateway_settings (gateway_name, is_active, environment) 
VALUES ('paypal', true, 'sandbox')
ON CONFLICT DO NOTHING;

-- Add PayPal-specific fields to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'paypal';

-- Make stripe_payment_intent_id nullable for backward compatibility
ALTER TABLE invoices 
ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

-- Update complete_payment_and_upgrade function to work with both PayPal and Stripe
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
    -- Get invoice details
    SELECT * INTO invoice_record
    FROM invoices
    WHERE id = p_invoice_id AND payment_status = 'pending';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update invoice based on payment gateway
    IF p_payment_gateway = 'paypal' THEN
        UPDATE invoices
        SET 
            payment_status = 'paid',
            status = 'paid',
            paypal_order_id = p_payment_id,
            payment_gateway = 'paypal',
            updated_at = NOW()
        WHERE id = p_invoice_id;
    ELSE
        UPDATE invoices
        SET 
            payment_status = 'paid',
            status = 'paid',
            stripe_payment_intent_id = p_payment_id,
            payment_gateway = 'stripe',
            updated_at = NOW()
        WHERE id = p_invoice_id;
    END IF;
    
    -- Create or update user subscription
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

-- Create trigger for updated_at on payment_gateway_settings
CREATE TRIGGER update_payment_gateway_settings_updated_at
BEFORE UPDATE ON payment_gateway_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();