-- Drop the existing foreign key constraint
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_family_id_fkey;

-- Add the constraint back with ON DELETE SET NULL
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE SET NULL;