-- Update the handle_new_user function to send welcome email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_first_name text;
  v_last_name text;
  v_language text := 'ar';
  v_supabase_url text;
  v_service_key text;
begin
  -- Extract names from metadata
  v_first_name := coalesce(
    new.raw_user_meta_data->>'given_name', 
    new.raw_user_meta_data->>'first_name'
  );
  v_last_name := coalesce(
    new.raw_user_meta_data->>'family_name', 
    new.raw_user_meta_data->>'last_name'
  );

  -- Insert profile
  insert into public.profiles (id, user_id, email, first_name, last_name)
  values (
    gen_random_uuid(),
    new.id,
    new.email,
    v_first_name,
    v_last_name
  );

  -- Get Supabase URL and Service Key from vault or environment
  begin
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_key := current_setting('app.settings.supabase_service_role_key', true);
    
    -- If not set in app.settings, use environment defaults
    if v_supabase_url is null then
      v_supabase_url := 'https://xzakoccnfswabrdwvukp.supabase.co';
    end if;
    
    -- Send welcome email asynchronously
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
  exception
    when others then
      -- Log error but don't fail the signup
      raise warning 'Failed to send welcome email for %: %', new.email, sqlerrm;
  end;

  return new;
end;
$$;