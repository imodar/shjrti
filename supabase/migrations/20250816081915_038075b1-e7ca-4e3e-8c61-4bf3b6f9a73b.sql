-- Add first_name and last_name columns to family_tree_members table
ALTER TABLE public.family_tree_members 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update existing records to split name into first_name and last_name
UPDATE public.family_tree_members 
SET 
  first_name = CASE 
    WHEN POSITION(' ' IN name) > 0 THEN TRIM(SUBSTRING(name FROM 1 FOR POSITION(' ' IN name) - 1))
    ELSE name
  END,
  last_name = CASE 
    WHEN POSITION(' ' IN name) > 0 THEN TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
    ELSE NULL
  END
WHERE name IS NOT NULL;

-- Create a function to automatically update the full name when first_name or last_name changes
CREATE OR REPLACE FUNCTION public.update_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Combine first_name and last_name into name field
  NEW.name = TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  
  -- If name becomes empty or just spaces, set it to NULL
  IF NEW.name = '' OR NEW.name IS NULL THEN
    NEW.name = COALESCE(NEW.first_name, NEW.last_name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update name when first_name or last_name changes
CREATE TRIGGER trigger_update_full_name
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON public.family_tree_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_full_name();