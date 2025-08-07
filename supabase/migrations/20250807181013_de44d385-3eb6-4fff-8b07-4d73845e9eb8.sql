-- إضافة foreign key constraints مع CASCADE DELETE للتأكد من مسح البيانات المرتبطة

-- 1. إضافة foreign key constraint لجدول family_tree_members
-- (إذا لم يكن موجود مسبقاً)
DO $$
BEGIN
    -- فحص إذا كان constraint موجود
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'family_tree_members_family_id_fkey_cascade'
    ) THEN
        -- مسح constraint القديم إذا وجد
        ALTER TABLE public.family_tree_members 
        DROP CONSTRAINT IF EXISTS family_tree_members_family_id_fkey;
        
        -- إضافة constraint جديد مع CASCADE DELETE
        ALTER TABLE public.family_tree_members 
        ADD CONSTRAINT family_tree_members_family_id_fkey_cascade 
        FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. إضافة foreign key constraint لجدول marriages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'marriages_family_id_fkey_cascade'
    ) THEN
        ALTER TABLE public.marriages 
        DROP CONSTRAINT IF EXISTS marriages_family_id_fkey;
        
        ALTER TABLE public.marriages 
        ADD CONSTRAINT marriages_family_id_fkey_cascade 
        FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. إضافة foreign key constraint لجدول family_members إذا كان موجود
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'family_members_family_id_fkey_cascade'
        ) THEN
            ALTER TABLE public.family_members 
            DROP CONSTRAINT IF EXISTS family_members_family_id_fkey;
            
            ALTER TABLE public.family_members 
            ADD CONSTRAINT family_members_family_id_fkey_cascade 
            FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 4. إضافة foreign key constraints للروابط بين أعضاء العائلة
DO $$
BEGIN
    -- Father relationship
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'family_tree_members_father_id_fkey_cascade'
    ) THEN
        ALTER TABLE public.family_tree_members 
        DROP CONSTRAINT IF EXISTS family_tree_members_father_id_fkey;
        
        ALTER TABLE public.family_tree_members 
        ADD CONSTRAINT family_tree_members_father_id_fkey_cascade 
        FOREIGN KEY (father_id) REFERENCES public.family_tree_members(id) ON DELETE SET NULL;
    END IF;
    
    -- Mother relationship  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'family_tree_members_mother_id_fkey_cascade'
    ) THEN
        ALTER TABLE public.family_tree_members 
        DROP CONSTRAINT IF EXISTS family_tree_members_mother_id_fkey;
        
        ALTER TABLE public.family_tree_members 
        ADD CONSTRAINT family_tree_members_mother_id_fkey_cascade 
        FOREIGN KEY (mother_id) REFERENCES public.family_tree_members(id) ON DELETE SET NULL;
    END IF;
    
    -- Spouse relationship
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'family_tree_members_spouse_id_fkey_cascade'
    ) THEN
        ALTER TABLE public.family_tree_members 
        DROP CONSTRAINT IF EXISTS family_tree_members_spouse_id_fkey;
        
        ALTER TABLE public.family_tree_members 
        ADD CONSTRAINT family_tree_members_spouse_id_fkey_cascade 
        FOREIGN KEY (spouse_id) REFERENCES public.family_tree_members(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. إضافة constraints لجدول marriages للروابط مع أعضاء العائلة
DO $$
BEGIN
    -- Husband relationship
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'marriages_husband_id_fkey_cascade'
    ) THEN
        ALTER TABLE public.marriages 
        DROP CONSTRAINT IF EXISTS marriages_husband_id_fkey;
        
        ALTER TABLE public.marriages 
        ADD CONSTRAINT marriages_husband_id_fkey_cascade 
        FOREIGN KEY (husband_id) REFERENCES public.family_tree_members(id) ON DELETE CASCADE;
    END IF;
    
    -- Wife relationship
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'marriages_wife_id_fkey_cascade'
    ) THEN
        ALTER TABLE public.marriages 
        DROP CONSTRAINT IF EXISTS marriages_wife_id_fkey;
        
        ALTER TABLE public.marriages 
        ADD CONSTRAINT marriages_wife_id_fkey_cascade 
        FOREIGN KEY (wife_id) REFERENCES public.family_tree_members(id) ON DELETE CASCADE;
    END IF;
END $$;