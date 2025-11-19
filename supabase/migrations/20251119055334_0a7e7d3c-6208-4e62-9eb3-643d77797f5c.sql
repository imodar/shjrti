-- Fix 1: Implement password hashing for families.share_password
-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to hash passwords using bcrypt
CREATE OR REPLACE FUNCTION public.hash_share_password(plain_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use bcrypt (blowfish) with cost factor 10
  RETURN crypt(plain_password, gen_salt('bf', 10));
END;
$$;

-- Create function to verify share passwords
CREATE OR REPLACE FUNCTION public.verify_share_password(plain_password TEXT, hashed_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Compare using crypt function - returns hashed version of plain_password
  -- If it matches hashed_password, passwords match
  RETURN (crypt(plain_password, hashed_password) = hashed_password);
END;
$$;

-- Hash existing plain text passwords in families table
-- Note: Existing passwords will be hashed in place
DO $$
DECLARE
  family_record RECORD;
BEGIN
  FOR family_record IN 
    SELECT id, share_password 
    FROM families 
    WHERE share_password IS NOT NULL 
    AND share_password NOT LIKE '$2a$%' -- Only hash if not already hashed (bcrypt format)
  LOOP
    UPDATE families 
    SET share_password = public.hash_share_password(family_record.share_password)
    WHERE id = family_record.id;
    
    RAISE NOTICE 'Hashed password for family: %', family_record.id;
  END LOOP;
END;
$$;

-- Add comment to document the change
COMMENT ON COLUMN families.share_password IS 'Bcrypt hashed password for family tree sharing protection. Use hash_share_password() to hash and verify_share_password() to verify.';

-- Fix 3: Add NOT NULL constraints to critical user_id columns
-- Since there are no NULL values, we can safely add constraints

-- admin_users.user_id
ALTER TABLE public.admin_users 
ALTER COLUMN user_id SET NOT NULL;

-- families.creator_id  
ALTER TABLE public.families 
ALTER COLUMN creator_id SET NOT NULL;

-- profiles.user_id
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- Add comments documenting the security fix
COMMENT ON COLUMN admin_users.user_id IS 'Foreign key to auth.users. NOT NULL constraint prevents RLS bypass vulnerabilities.';
COMMENT ON COLUMN families.creator_id IS 'Foreign key to auth.users. NOT NULL constraint prevents RLS bypass vulnerabilities.';
COMMENT ON COLUMN profiles.user_id IS 'Foreign key to auth.users. NOT NULL constraint prevents RLS bypass vulnerabilities.';