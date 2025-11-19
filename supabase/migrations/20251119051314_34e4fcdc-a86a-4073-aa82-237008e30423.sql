-- Drop the existing function
DROP FUNCTION IF EXISTS public.regenerate_share_token(uuid, integer);

-- Create improved function with stronger 50-character alphanumeric token
CREATE OR REPLACE FUNCTION public.regenerate_share_token(
  p_family_id UUID,
  p_expires_in_hours INTEGER DEFAULT 2
)
RETURNS TABLE (
  share_token TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_creator_id UUID;
  v_calling_user_id UUID;
BEGIN
  -- Get the calling user's ID
  v_calling_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get the creator_id of the family
  SELECT creator_id INTO v_creator_id
  FROM families
  WHERE id = p_family_id;
  
  -- Check if family exists
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Family not found';
  END IF;
  
  -- Check if user is the creator or an admin
  IF v_creator_id != v_calling_user_id AND NOT is_admin(v_calling_user_id) THEN
    RAISE EXCEPTION 'Permission denied: only family creator or admin can regenerate share token';
  END IF;
  
  -- Generate a strong 50-character alphanumeric token (uppercase, lowercase, numbers)
  -- Using a combination of random strings to ensure 50 characters
  v_new_token := 
    -- Generate random alphanumeric string (50 chars)
    encode(gen_random_bytes(38), 'base64')::text;
  
  -- Remove special characters and trim to exactly 50 chars
  v_new_token := regexp_replace(v_new_token, '[^a-zA-Z0-9]', '', 'g');
  v_new_token := substring(v_new_token, 1, 50);
  
  -- If somehow it's shorter than 50, pad with more random chars
  WHILE length(v_new_token) < 50 LOOP
    v_new_token := v_new_token || encode(gen_random_bytes(10), 'base64')::text;
    v_new_token := regexp_replace(v_new_token, '[^a-zA-Z0-9]', '', 'g');
  END LOOP;
  
  -- Ensure exactly 50 characters
  v_new_token := substring(v_new_token, 1, 50);
  
  -- Calculate expiration
  v_expires_at := now() + (p_expires_in_hours || ' hours')::INTERVAL;
  
  -- Update the family with new token and expiration
  UPDATE families
  SET 
    share_token = v_new_token,
    share_token_expires_at = v_expires_at,
    updated_at = now()
  WHERE id = p_family_id;
  
  -- Return the new token and expiration
  RETURN QUERY
  SELECT v_new_token, v_expires_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.regenerate_share_token(UUID, INTEGER) TO authenticated;

-- Update share_token column type to TEXT if it's still UUID
ALTER TABLE public.families 
  ALTER COLUMN share_token TYPE TEXT;