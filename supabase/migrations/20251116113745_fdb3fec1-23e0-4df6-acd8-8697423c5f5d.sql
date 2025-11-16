-- 1) إسقاط وإنشاء تريغر إنشاء المستخدم لربط handle_new_user
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    EXECUTE 'DROP TRIGGER on_auth_user_created ON auth.users';
  END IF;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) تحديث دالة handle_new_user لاستخراج بيانات Google بشكل أدق وتفعيل الحالة لمستخدمي OAuth/المؤكد بريدهم
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_language text := 'ar';
  v_supabase_url text;
  v_service_key text;
  v_provider text;
begin
  -- مزود الدخول من app meta (الأدق) أو user meta كاحتياط
  v_provider := coalesce(
    new.raw_app_meta_data->>'provider',
    new.raw_user_meta_data->>'provider'
  );

  -- استخراج الأسماء من metadata
  v_first_name := coalesce(
    new.raw_user_meta_data->>'given_name', 
    new.raw_user_meta_data->>'first_name'
  );
  v_last_name := coalesce(
    new.raw_user_meta_data->>'family_name', 
    new.raw_user_meta_data->>'last_name'
  );

  -- إذا كان فقط full_name موجود قم بتقسيمه
  IF (v_first_name IS NULL OR v_last_name IS NULL) THEN
    v_full_name := coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    );
    IF v_full_name IS NOT NULL THEN
      v_first_name := coalesce(v_first_name, split_part(v_full_name, ' ', 1));
      v_last_name := coalesce(v_last_name, nullif(trim(substring(v_full_name from length(split_part(v_full_name, ' ', 1)) + 1)), ''));
    END IF;
  END IF;

  -- إدراج أو تحديث البروفايل (احترازياً لو حصل تكرار)
  INSERT INTO public.profiles (id, user_id, email, first_name, last_name)
  VALUES (gen_random_uuid(), new.id, new.email, v_first_name, v_last_name)
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name  = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    email      = EXCLUDED.email,
    updated_at = now();

  -- تفعيل الحالة لمستخدمي Google/OAuth أو أي مستخدم بريدُه مؤكَّد
  IF coalesce(v_provider, '') <> 'email' OR new.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_status (user_id, status, reason)
    VALUES (new.id, 'active', 'Auto-activated on signup (OAuth or confirmed email)')
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      reason = 'Auto-activated on signup (OAuth or confirmed email)',
      updated_at = now();
  END IF;

  -- إرسال ترحيب (إن أمكن)
  begin
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_key := current_setting('app.settings.supabase_service_role_key', true);
    if v_supabase_url is null then
      v_supabase_url := 'https://xzakoccnfswabrdwvukp.supabase.co';
    end if;
    if v_supabase_url is not null then
      perform extensions.http_post(
        url := v_supabase_url || '/functions/v1/send-welcome-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(v_service_key, '')
        ),
        body := jsonb_build_object(
          'email', new.email,
          'firstName', v_first_name,
          'lastName', v_last_name,
          'language', v_language
        )::text
      );
    end if;
  exception when others then
    raise warning 'Failed to send welcome email for %: %', new.email, sqlerrm;
  end;

  return new;
end;
$function$;

-- 3) تحديث بأثر رجعي: تفعيل المستخدمين ذوي البريد المؤكد وملء الأسماء الناقصة
DO $$
DECLARE
  u RECORD;
  v_first text;
  v_last text;
  v_full text;
BEGIN
  FOR u IN 
    SELECT id, email, raw_user_meta_data, raw_app_meta_data, email_confirmed_at
    FROM auth.users
  LOOP
    -- تفعيل إذا كان البريد مؤكداً
    IF u.email_confirmed_at IS NOT NULL THEN
      INSERT INTO public.user_status (user_id, status, reason)
      VALUES (u.id, 'active', 'Retroactive activation (confirmed email)')
      ON CONFLICT (user_id) DO UPDATE SET
        status = 'active',
        reason = 'Retroactive activation (confirmed email)',
        updated_at = now();
    END IF;

    -- استكمال الأسماء للبروفايل
    v_first := coalesce(u.raw_user_meta_data->>'given_name', u.raw_user_meta_data->>'first_name');
    v_last  := coalesce(u.raw_user_meta_data->>'family_name', u.raw_user_meta_data->>'last_name');
    IF (v_first IS NULL OR v_last IS NULL) THEN
      v_full := coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name');
      IF v_full IS NOT NULL THEN
        v_first := coalesce(v_first, split_part(v_full, ' ', 1));
        v_last  := coalesce(v_last, nullif(trim(substring(v_full from length(split_part(v_full, ' ', 1)) + 1)), ''));
      END IF;
    END IF;

    UPDATE public.profiles
    SET 
      first_name = COALESCE(first_name, v_first),
      last_name  = COALESCE(last_name, v_last),
      updated_at = now()
    WHERE user_id = u.id
      AND (first_name IS NULL OR last_name IS NULL);
  END LOOP;
END $$;