
-- Create activity_log table
CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  target_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups by family
CREATE INDEX idx_activity_log_family_created ON public.activity_log (family_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Owners and collaborators can read activity logs
CREATE POLICY "Users with access can view activity logs"
ON public.activity_log
FOR SELECT
USING (has_family_access(auth.uid(), family_id));

-- Only service role (edge functions) can insert
CREATE POLICY "Service role can insert activity logs"
ON public.activity_log
FOR INSERT
WITH CHECK (true);

-- Cleanup function for 90-day retention
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.activity_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;
