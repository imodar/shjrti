-- Update the check constraint for date_preference to include the new gregorian-levantine option
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_date_preference_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_date_preference_check 
CHECK (date_preference IN ('gregorian', 'gregorian-levantine', 'hijri'));