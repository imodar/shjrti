-- Add date_preference column to profiles table to store user's preferred calendar type
ALTER TABLE public.profiles 
ADD COLUMN date_preference text DEFAULT 'gregorian' CHECK (date_preference IN ('gregorian', 'hijri'));