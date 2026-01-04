-- pgcrypto موجود في schema extensions في Supabase

-- Drop existing functions (both possible signatures)
DROP FUNCTION IF EXISTS public.hash_share_password(text);
DROP FUNCTION IF EXISTS public.verify_share_password(text, text);

-- Create hash_share_password using schema-qualified pgcrypto funcs
CREATE FUNCTION public.hash_share_password(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN extensions.crypt(plain_password, extensions.gen_salt('bf', 10));
END;
$$;

-- Create verify_share_password (plain_password, hashed_password)
CREATE FUNCTION public.verify_share_password(plain_password text, hashed_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (extensions.crypt(plain_password, hashed_password) = hashed_password);
END;
$$;

-- (Optional) Grant execute to authenticated/anon via default privileges in Supabase;
-- functions are callable via RPC as long as schema is exposed and privileges are set by platform.