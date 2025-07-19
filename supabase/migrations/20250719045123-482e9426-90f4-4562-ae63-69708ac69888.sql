-- Update complete_payment_and_upgrade function to be completely user-centric (remove family logic)
CREATE OR REPLACE FUNCTION complete_payment_and_upgrade(
    p_invoice_id UUID, 
    p_stripe_payment_intent_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;