-- Update create_invoice function to make family_id optional (fix parameter order)
CREATE OR REPLACE FUNCTION create_invoice(
    p_user_id UUID,
    p_package_id UUID,
    p_amount NUMERIC,
    p_currency TEXT DEFAULT 'SAR',
    p_family_id UUID DEFAULT NULL
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