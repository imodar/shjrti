-- Create table for storing OTP codes
CREATE TABLE IF NOT EXISTS public.auth_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'login', 'reset_password')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_auth_otp_codes_email ON public.auth_otp_codes(email);
CREATE INDEX idx_auth_otp_codes_expires_at ON public.auth_otp_codes(expires_at);

-- Enable RLS
ALTER TABLE public.auth_otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to manage OTP codes (edge functions will use service role)
CREATE POLICY "Service role can manage OTP codes"
ON public.auth_otp_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to clean up expired OTP codes (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.auth_otp_codes
  WHERE expires_at < NOW() OR (is_used = true AND created_at < NOW() - INTERVAL '1 day');
END;
$$;