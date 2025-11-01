-- Fix search_path for new functions
CREATE OR REPLACE FUNCTION update_payment_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

CREATE OR REPLACE FUNCTION process_recurring_payment(
  p_user_id UUID,
  p_package_id UUID,
  p_payment_token_id UUID,
  p_amount DECIMAL,
  p_currency TEXT
) RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
BEGIN
  -- Create invoice
  INSERT INTO public.invoices (
    user_id,
    package_id,
    amount,
    currency,
    payment_status,
    is_recurring,
    payment_gateway
  ) VALUES (
    p_user_id,
    p_package_id,
    p_amount,
    p_currency,
    'pending',
    true,
    'paypal'
  ) RETURNING id INTO v_invoice_id;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';