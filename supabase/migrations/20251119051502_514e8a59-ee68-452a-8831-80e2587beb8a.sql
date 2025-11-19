-- Test and fix the regenerate_share_token function
-- The issue is that the current implementation might not generate exactly 50 characters reliably

DROP FUNCTION IF EXISTS public.regenerate_share_token(uuid, integer);

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
  v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  v_length INTEGER := 50;
  v_random_bytes BYTEA;
  i INTEGER;
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
  
  -- Generate a strong 50-character alphanumeric token
  v_new_token := '';
  v_random_bytes := gen_random_bytes(50);
  
  FOR i IN 0..49 LOOP
    v_new_token := v_new_token || substring(v_chars, (get_byte(v_random_bytes, i) % 62) + 1, 1);
  END LOOP;
  
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

GRANT EXECUTE ON FUNCTION public.regenerate_share_token(UUID, INTEGER) TO authenticated;