-- إصلاح دالة handle_new_user: يجب أن يكون profiles.id = auth.users.id
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

  -- إدراج البروفايل - CRITICAL FIX: id يجب أن يساوي user_id
  INSERT INTO public.profiles (id, user_id, email, first_name, last_name)
  VALUES (new.id, new.id, new.email, v_first_name, v_last_name)
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name  = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    email      = EXCLUDED.email,
    updated_at = now();

  -- تفعيل الحالة لمستخدمي Google/OAuth أو أي مستخدم بريدُه مؤكَّد
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