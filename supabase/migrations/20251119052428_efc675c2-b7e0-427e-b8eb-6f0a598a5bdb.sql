-- Update regenerate_share_token to generate base64-style tokens like the example
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
  v_random_data TEXT;
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
  
  -- Generate random data by combining multiple UUIDs and random values
  v_random_data := 
    gen_random_uuid()::text || 
    gen_random_uuid()::text || 
    gen_random_uuid()::text || 
    gen_random_uuid()::text ||
    random()::text || 
    clock_timestamp()::text || 
    random()::text;
  
  -- Encode to base64 to create a long token similar to the example
  -- This will create a token around 160-170 characters
  v_new_token := encode(v_random_data::bytea, 'base64');
  
  -- Remove newlines that base64 encoding might add
  v_new_token := replace(v_new_token, E'\n', '');
  
  -- Trim to approximately 170 characters to match the example length
  v_new_token := substring(v_new_token, 1, 170);
  
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