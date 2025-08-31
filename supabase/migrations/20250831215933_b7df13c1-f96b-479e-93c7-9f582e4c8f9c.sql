-- إضافة عمود الروابط المخصصة إلى جدول الحزم
ALTER TABLE public.packages 
ADD COLUMN custom_domains_enabled BOOLEAN DEFAULT false;