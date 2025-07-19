-- Add marital status to marriages table to track if marriage is active, divorced, etc.
ALTER TABLE public.marriages 
ADD COLUMN marital_status TEXT DEFAULT 'married' CHECK (marital_status IN ('married', 'divorced', 'widowed'));

-- Add comment for clarity
COMMENT ON COLUMN public.marriages.marital_status IS 'Status of the marriage: married, divorced, or widowed';