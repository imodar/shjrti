-- Function to check family tree limits before insert
CREATE OR REPLACE FUNCTION check_family_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Count existing non-archived families for this creator
  SELECT COUNT(*) INTO current_count
  FROM families 
  WHERE creator_id = NEW.creator_id 
  AND (is_archived = false OR is_archived IS NULL);
  
  -- Get max allowed from user's active subscription package
  SELECT COALESCE(p.max_family_trees, 1) INTO max_allowed
  FROM user_subscriptions us
  JOIN packages p ON p.id = us.package_id
  WHERE us.user_id = NEW.creator_id 
  AND us.status = 'active'
  LIMIT 1;
  
  -- If no active subscription, use default limit of 1
  IF max_allowed IS NULL THEN
    max_allowed := 1;
  END IF;
  
  -- Check if limit would be exceeded
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'FAMILY_LIMIT_EXCEEDED:تجاوزت الحد الأقصى للأشجار (%) في باقتك', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce family limit on insert
DROP TRIGGER IF EXISTS enforce_family_limit ON families;
CREATE TRIGGER enforce_family_limit
BEFORE INSERT ON families
FOR EACH ROW
EXECUTE FUNCTION check_family_limit();