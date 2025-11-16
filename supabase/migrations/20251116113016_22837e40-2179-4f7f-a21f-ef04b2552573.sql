-- تحديث حالة المستخدمين الموجودين الذين سجلوا عبر Google
DO $$
DECLARE
  user_record RECORD;
  v_first_name text;
  v_last_name text;
  v_full_name text;
BEGIN
  -- تحديث جميع المستخدمين الذين سجلوا عبر OAuth
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    WHERE au.raw_user_meta_data->>'provider' IS NOT NULL
  LOOP
    -- تحديث حالة المستخدم إلى active
    INSERT INTO public.user_status (user_id, status, reason)
    VALUES (user_record.id, 'active', 'OAuth user - retroactive update')
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      reason = 'OAuth user - retroactive update',
      updated_at = now();
    
    -- استخراج الأسماء من metadata
    v_first_name := coalesce(
      user_record.raw_user_meta_data->>'given_name',
      user_record.raw_user_meta_data->>'first_name'
    );
    v_last_name := coalesce(
      user_record.raw_user_meta_data->>'family_name',
      user_record.raw_user_meta_data->>'last_name'
    );
    
    -- إذا لم نحصل على الأسماء، نحاول تقسيم full_name
    IF (v_first_name IS NULL OR v_last_name IS NULL) THEN
      v_full_name := coalesce(
        user_record.raw_user_meta_data->>'full_name',
        user_record.raw_user_meta_data->>'name'
      );
      
      IF v_full_name IS NOT NULL THEN
        v_first_name := coalesce(v_first_name, split_part(v_full_name, ' ', 1));
        v_last_name := coalesce(v_last_name, trim(substring(v_full_name from length(split_part(v_full_name, ' ', 1)) + 1)));
        IF v_last_name = '' THEN
          v_last_name := NULL;
        END IF;
      END IF;
    END IF;
    
    -- تحديث البروفايل إذا كانت الأسماء فارغة
    UPDATE public.profiles
    SET 
      first_name = COALESCE(first_name, v_first_name),
      last_name = COALESCE(last_name, v_last_name),
      updated_at = now()
    WHERE user_id = user_record.id
      AND (first_name IS NULL OR last_name IS NULL);
      
  END LOOP;
END $$;