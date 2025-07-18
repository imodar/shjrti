
-- Add payment_status to invoices table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'payment_status') THEN
        ALTER TABLE public.invoices ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Add invoice_number to invoices table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number') THEN
        ALTER TABLE public.invoices ADD COLUMN invoice_number TEXT UNIQUE;
    END IF;
END $$;

-- Add due_date to invoices table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'due_date') THEN
        ALTER TABLE public.invoices ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
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
$$;

-- Create function to create invoice
CREATE OR REPLACE FUNCTION create_invoice(
    p_user_id UUID,
    p_family_id UUID,
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
    
    -- Insert new invoice
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
        p_family_id,
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

-- Create function to mark invoice as paid and upgrade plan
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
    family_record RECORD;
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
    
    -- Get or create family
    SELECT * INTO family_record
    FROM families
    WHERE id = invoice_record.family_id;
    
    IF NOT FOUND THEN
        -- Create family if it doesn't exist
        INSERT INTO families (
            id,
            name,
            creator_id,
            package_id,
            subscription_status,
            subscription_end_date
        )
        VALUES (
            invoice_record.family_id,
            'عائلة المستخدم',
            invoice_record.user_id,
            invoice_record.package_id,
            'active',
            NOW() + INTERVAL '1 year'
        );
    ELSE
        -- Update existing family
        UPDATE families
        SET 
            package_id = invoice_record.package_id,
            subscription_status = 'active',
            subscription_end_date = NOW() + INTERVAL '1 year',
            updated_at = NOW()
        WHERE id = invoice_record.family_id;
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
    ON CONFLICT (user_id, status)
    DO UPDATE SET
        package_id = EXCLUDED.package_id,
        started_at = EXCLUDED.started_at,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;
