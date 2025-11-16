-- إضافة unique constraint على user_id في جدول profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);