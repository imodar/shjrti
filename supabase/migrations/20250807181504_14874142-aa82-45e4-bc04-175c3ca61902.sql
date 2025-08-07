-- Create a secure function to delete family and all related data
CREATE OR REPLACE FUNCTION public.delete_family_complete(family_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is the creator of the family
  IF NOT EXISTS (
    SELECT 1 FROM families 
    WHERE id = family_uuid AND creator_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only delete families you created';
  END IF;

  -- Delete family tree members (this will CASCADE to marriages via foreign keys)
  DELETE FROM family_tree_members WHERE family_id = family_uuid;
  
  -- Delete marriages explicitly in case CASCADE doesn't work
  DELETE FROM marriages WHERE family_id = family_uuid;
  
  -- Delete family members (if table exists)
  DELETE FROM family_members WHERE family_id = family_uuid;
  
  -- Delete the family itself
  DELETE FROM families WHERE id = family_uuid;
  
  RETURN TRUE;
END;
$function$;