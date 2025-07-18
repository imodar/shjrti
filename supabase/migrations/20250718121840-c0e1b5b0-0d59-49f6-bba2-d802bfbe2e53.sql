-- إضافة حقول جديدة لجدول الباقات للتحكم في عدد الأفراد والشجرات
ALTER TABLE public.packages 
ADD COLUMN max_family_members INTEGER DEFAULT 100,
ADD COLUMN max_family_trees INTEGER DEFAULT 1,
ADD COLUMN display_order INTEGER DEFAULT 0;

-- تحديث البيانات الموجودة بقيم افتراضية مناسبة
UPDATE public.packages 
SET max_family_members = 100, 
    max_family_trees = 1, 
    display_order = 1 
WHERE name ILIKE '%free%' OR name ILIKE '%مجاني%';

UPDATE public.packages 
SET max_family_members = 500, 
    max_family_trees = 3, 
    display_order = 2 
WHERE name ILIKE '%basic%' OR name ILIKE '%أساسي%';

UPDATE public.packages 
SET max_family_members = 1000, 
    max_family_trees = 10, 
    display_order = 3 
WHERE name ILIKE '%premium%' OR name ILIKE '%مميز%';