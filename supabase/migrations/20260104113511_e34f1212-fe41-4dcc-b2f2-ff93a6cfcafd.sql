-- Enable pgcrypto for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing functions first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS public.hash_share_password(text);
DROP FUNCTION IF EXISTS public.verify_share_password(text, text);

-- Create hash_share_password function using bcrypt
CREATE FUNCTION public.hash_share_password(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN crypt(plain_password, gen_salt('bf', 10));
END;
$$;

-- Create verify_share_password function
CREATE FUNCTION public.verify_share_password(plain_password text, hashed_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (crypt(plain_password, hashed_password) = hashed_password);
END;
$$;