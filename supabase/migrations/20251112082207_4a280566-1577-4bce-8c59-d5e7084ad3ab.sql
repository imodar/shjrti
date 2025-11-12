-- Create enum for payment funnel event types
CREATE TYPE payment_event_type AS ENUM (
  'view_packages',
  'click_upgrade', 
  'select_package',
  'initiate_payment',
  'payment_success',
  'payment_failed'
);

-- Create payment funnel events table
CREATE TABLE public.payment_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type payment_event_type NOT NULL,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  amount NUMERIC(10,2),
  currency TEXT,
  payment_gateway TEXT,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_payment_events_user_id ON public.payment_funnel_events(user_id);
CREATE INDEX idx_payment_events_type ON public.payment_funnel_events(event_type);
CREATE INDEX idx_payment_events_created_at ON public.payment_funnel_events(created_at DESC);
CREATE INDEX idx_payment_events_package_id ON public.payment_funnel_events(package_id);

-- Enable RLS
ALTER TABLE public.payment_funnel_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all events
CREATE POLICY "Admins can view all payment events"
ON public.payment_funnel_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.role = 'admin'
  )
);

-- RLS Policy: Users can view their own events
CREATE POLICY "Users can view their own payment events"
ON public.payment_funnel_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Anyone can insert events (for tracking)
CREATE POLICY "Anyone can insert payment events"
ON public.payment_funnel_events
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Function to log payment events
CREATE OR REPLACE FUNCTION public.log_payment_event(
  p_event_type payment_event_type,
  p_package_id UUID DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_currency TEXT DEFAULT NULL,
  p_payment_gateway TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.payment_funnel_events (
    user_id,
    event_type,
    package_id,
    amount,
    currency,
    payment_gateway,
    failure_reason,
    metadata
  ) VALUES (
    auth.uid(), -- Will be NULL for anonymous users
    p_event_type,
    p_package_id,
    p_amount,
    p_currency,
    p_payment_gateway,
    p_failure_reason,
    p_metadata
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Function to get payment funnel analytics for admins
CREATE OR REPLACE FUNCTION public.get_payment_funnel_analytics(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS TABLE (
  total_package_views BIGINT,
  total_upgrade_clicks BIGINT,
  total_package_selections BIGINT,
  total_payment_initiations BIGINT,
  total_payment_successes BIGINT,
  total_payment_failures BIGINT,
  conversion_rate_click_to_initiate NUMERIC,
  conversion_rate_initiate_to_success NUMERIC,
  conversion_rate_overall NUMERIC,
  total_revenue NUMERIC,
  avg_transaction_value NUMERIC,
  top_package_id UUID,
  top_package_name JSONB,
  top_failure_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package_views BIGINT;
  v_upgrade_clicks BIGINT;
  v_package_selections BIGINT;
  v_payment_initiations BIGINT;
  v_payment_successes BIGINT;
  v_payment_failures BIGINT;
  v_total_revenue NUMERIC;
  v_avg_transaction NUMERIC;
  v_top_package UUID;
  v_top_package_name JSONB;
  v_top_failure TEXT;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can view analytics';
  END IF;

  -- Get event counts
  SELECT COUNT(*) INTO v_package_views
  FROM payment_funnel_events
  WHERE event_type = 'view_packages'
  AND created_at BETWEEN p_start_date AND p_end_date;

  SELECT COUNT(*) INTO v_upgrade_clicks
  FROM payment_funnel_events
  WHERE event_type = 'click_upgrade'
  AND created_at BETWEEN p_start_date AND p_end_date;

  SELECT COUNT(*) INTO v_package_selections
  FROM payment_funnel_events
  WHERE event_type = 'select_package'
  AND created_at BETWEEN p_start_date AND p_end_date;

  SELECT COUNT(*) INTO v_payment_initiations
  FROM payment_funnel_events
  WHERE event_type = 'initiate_payment'
  AND created_at BETWEEN p_start_date AND p_end_date;

  SELECT COUNT(*) INTO v_payment_successes
  FROM payment_funnel_events
  WHERE event_type = 'payment_success'
  AND created_at BETWEEN p_start_date AND p_end_date;

  SELECT COUNT(*) INTO v_payment_failures
  FROM payment_funnel_events
  WHERE event_type = 'payment_failed'
  AND created_at BETWEEN p_start_date AND p_end_date;

  -- Calculate revenue
  SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue
  FROM payment_funnel_events
  WHERE event_type = 'payment_success'
  AND created_at BETWEEN p_start_date AND p_end_date;

  -- Calculate average transaction value
  SELECT COALESCE(AVG(amount), 0) INTO v_avg_transaction
  FROM payment_funnel_events
  WHERE event_type = 'payment_success'
  AND amount IS NOT NULL
  AND created_at BETWEEN p_start_date AND p_end_date;

  -- Get top package
  SELECT pfe.package_id, p.name INTO v_top_package, v_top_package_name
  FROM payment_funnel_events pfe
  LEFT JOIN packages p ON pfe.package_id = p.id
  WHERE pfe.event_type = 'payment_success'
  AND pfe.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY pfe.package_id, p.name
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Get top failure reason
  SELECT failure_reason INTO v_top_failure
  FROM payment_funnel_events
  WHERE event_type = 'payment_failed'
  AND failure_reason IS NOT NULL
  AND created_at BETWEEN p_start_date AND p_end_date
  GROUP BY failure_reason
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Return results
  RETURN QUERY SELECT
    v_package_views,
    v_upgrade_clicks,
    v_package_selections,
    v_payment_initiations,
    v_payment_successes,
    v_payment_failures,
    CASE WHEN v_upgrade_clicks > 0 
      THEN ROUND((v_payment_initiations::NUMERIC / v_upgrade_clicks::NUMERIC * 100), 2)
      ELSE 0 
    END,
    CASE WHEN v_payment_initiations > 0 
      THEN ROUND((v_payment_successes::NUMERIC / v_payment_initiations::NUMERIC * 100), 2)
      ELSE 0 
    END,
    CASE WHEN v_upgrade_clicks > 0 
      THEN ROUND((v_payment_successes::NUMERIC / v_upgrade_clicks::NUMERIC * 100), 2)
      ELSE 0 
    END,
    v_total_revenue,
    v_avg_transaction,
    v_top_package,
    v_top_package_name,
    v_top_failure;
END;
$$;