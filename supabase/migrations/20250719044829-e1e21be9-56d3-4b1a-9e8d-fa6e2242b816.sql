-- Update create_invoice function to make family_id optional
CREATE OR REPLACE FUNCTION create_invoice(
    p_user_id UUID,
    p_family_id UUID DEFAULT NULL,
    p_package_id UUID,
    p_amount NUMERIC,
    p_currency TEXT DEFAULT 'SAR'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invoice_id UUID;
    due_date_val TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set due date to 30 days from now
    due_date_val := NOW() + INTERVAL '30 days';
    
    -- Insert new invoice (family_id can be null for user-based subscriptions)
    INSERT INTO public.invoices (
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
$$;

-- Update complete_payment_and_upgrade function to handle user-based subscriptions
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
    
    -- Create or update user subscription (no family needed)
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
    ON CONFLICT (user_id, status)
    DO UPDATE SET
        package_id = EXCLUDED.package_id,
        started_at = EXCLUDED.started_at,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;