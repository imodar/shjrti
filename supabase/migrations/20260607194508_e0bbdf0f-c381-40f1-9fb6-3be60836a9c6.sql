
-- Insert Stripe gateway settings row (if not already exists)
INSERT INTO public.payment_gateway_settings (gateway_name, is_active, environment)
SELECT 'stripe', false, 'sandbox'
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_gateway_settings WHERE gateway_name = 'stripe'
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status_created
  ON public.invoices(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_gateway
  ON public.invoices(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_intent
  ON public.invoices(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_orders_status_created
  ON public.store_orders(status, created_at DESC);

-- Allow admins to read all store_orders via existing admin RLS pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'store_orders' AND policyname = 'Admins can manage all store orders'
  ) THEN
    CREATE POLICY "Admins can manage all store orders"
      ON public.store_orders
      FOR ALL
      TO authenticated
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;
