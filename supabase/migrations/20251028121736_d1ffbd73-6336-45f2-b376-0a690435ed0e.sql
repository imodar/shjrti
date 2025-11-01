-- Add payment tokens table to store PayPal payment method tokens for recurring billing
CREATE TABLE IF NOT EXISTS public.payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_gateway TEXT NOT NULL DEFAULT 'paypal',
  token_id TEXT NOT NULL,
  customer_id TEXT,
  payment_source_type TEXT,
  setup_token_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, payment_gateway)
);

-- Enable RLS
ALTER TABLE public.payment_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_tokens
CREATE POLICY "Users can view their own payment tokens"
  ON public.payment_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment tokens"
  ON public.payment_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment tokens"
  ON public.payment_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment tokens"
  ON public.payment_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_payment_tokens_user_id ON public.payment_tokens(user_id);
CREATE INDEX idx_payment_tokens_status ON public.payment_tokens(status);

-- Add subscription_id to user_subscriptions for PayPal subscription tracking
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS payment_token_id UUID REFERENCES public.payment_tokens(id);

-- Add billing agreement fields to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS billing_agreement_id TEXT,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_payment_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_tokens_updated_at
  BEFORE UPDATE ON public.payment_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_tokens_updated_at();

-- Create function to handle recurring payment processing
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
$$ LANGUAGE plpgsql SECURITY DEFINER;