-- Update the handle_new_user function to send welcome email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_first_name text;
  v_last_name text;
  v_language text := 'ar'; -- Default language
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

  -- Send welcome email asynchronously using pg_net (non-blocking)
  -- This ensures user signup is not blocked if email fails
  perform
    net.http_post(
      url := (select current_setting('app.settings.supabase_url', true) || '/functions/v1/send-welcome-email'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select current_setting('app.settings.supabase_service_role_key', true))
      ),
      body := jsonb_build_object(
        'email', new.email,
        'firstName', v_first_name,
        'lastName', v_last_name,
        'language', v_language
      )
    );

  return new;
exception
  when others then
    -- Log error but don't fail the signup
    raise warning 'Failed to send welcome email for %: %', new.email, sqlerrm;
    return new;
end;
$$;