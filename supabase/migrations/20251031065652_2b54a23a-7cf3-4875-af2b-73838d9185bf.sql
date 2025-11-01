-- Function to process scheduled package changes
CREATE OR REPLACE FUNCTION process_scheduled_package_change(p_user_id UUID, p_scheduled_change_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_change_record RECORD;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the scheduled change
  SELECT * INTO v_change_record
  FROM scheduled_package_changes
  WHERE id = p_scheduled_change_id
    AND user_id = p_user_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new expiry date (1 year from now)
  v_new_expiry := NOW() + INTERVAL '1 year';
  
  -- Update or insert subscription
  INSERT INTO user_subscriptions (user_id, package_id, status, started_at, expires_at)
  VALUES (p_user_id, v_change_record.target_package_id, 'active', NOW(), v_new_expiry)
  ON CONFLICT (user_id, status)
  WHERE status = 'active'
  DO UPDATE SET
    package_id = v_change_record.target_package_id,
    started_at = NOW(),
    expires_at = v_new_expiry,
    updated_at = NOW();
  
  -- Mark the scheduled change as completed
  UPDATE scheduled_package_changes
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_scheduled_change_id;
  
  -- Create notification for user
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'تم تطبيق تغيير الباقة',
    'تم تطبيق الباقة الجديدة على اشتراكك بنجاح',
    'success'
  );
  
  RETURN TRUE;
END;
$$;

-- Trigger function to auto-apply scheduled changes on subscription expiry
CREATE OR REPLACE FUNCTION auto_apply_scheduled_package_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_scheduled_change RECORD;
BEGIN
  -- Check if subscription expired or became inactive
  IF (NEW.status != 'active' OR NEW.expires_at <= NOW()) 
     AND (OLD.status = 'active' OR OLD.expires_at > NOW()) THEN
    
    -- Look for pending scheduled change
    SELECT * INTO v_scheduled_change
    FROM scheduled_package_changes
    WHERE user_id = NEW.user_id
      AND status = 'pending'
      AND scheduled_date <= NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If found, apply it
    IF FOUND THEN
      PERFORM process_scheduled_package_change(NEW.user_id, v_scheduled_change.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_subscriptions
DROP TRIGGER IF EXISTS trigger_auto_apply_scheduled_change ON user_subscriptions;
CREATE TRIGGER trigger_auto_apply_scheduled_change
AFTER UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION auto_apply_scheduled_package_change();

-- Function to cancel scheduled package change
CREATE OR REPLACE FUNCTION cancel_scheduled_package_change(p_user_id UUID, p_scheduled_change_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE scheduled_package_changes
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_scheduled_change_id
    AND user_id = p_user_id
    AND status = 'pending';
  
  IF FOUND THEN
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      p_user_id,
      'تم إلغاء تغيير الباقة',
      'تم إلغاء التغيير المجدول للباقة بنجاح',
      'info'
    );
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;