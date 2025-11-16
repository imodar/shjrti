-- Create function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, email, first_name, last_name)
  values (
    gen_random_uuid(),
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'given_name', new.raw_user_meta_data->>'first_name'),
    coalesce(new.raw_user_meta_data->>'family_name', new.raw_user_meta_data->>'last_name')
  );
  return new;
end;
$$;

-- Create trigger to automatically create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();