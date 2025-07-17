-- Create family_tree_members table for storing detailed family member information
CREATE TABLE public.family_tree_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')) DEFAULT 'male',
  birth_date DATE,
  death_date DATE,
  is_alive BOOLEAN DEFAULT true,
  biography TEXT,
  relation TEXT NOT NULL, -- father, mother, son, daughter, etc.
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.family_tree_members ENABLE ROW LEVEL SECURITY;

-- Create policies for family_tree_members
CREATE POLICY "Users can view family tree members of their families" 
ON public.family_tree_members 
FOR SELECT 
USING (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create family tree members for their families" 
ON public.family_tree_members 
FOR INSERT 
WITH CHECK (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update family tree members of their families" 
ON public.family_tree_members 
FOR UPDATE 
USING (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete family tree members of their families" 
ON public.family_tree_members 
FOR DELETE 
USING (
  family_id IN (
    SELECT id FROM public.families 
    WHERE creator_id = auth.uid() 
    OR id IN (
      SELECT family_id FROM public.family_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- Admins can do everything
CREATE POLICY "Admins can manage all family tree members" 
ON public.family_tree_members 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_tree_members_updated_at
BEFORE UPDATE ON public.family_tree_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_family_tree_members_family_id ON public.family_tree_members(family_id);
CREATE INDEX idx_family_tree_members_created_by ON public.family_tree_members(created_by);