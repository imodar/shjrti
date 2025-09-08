-- Add RLS policy for public access to families and family tree members for sharing
CREATE POLICY "Allow public read access to families for sharing"
ON public.families
FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to family tree members for sharing"
ON public.family_tree_members
FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to marriages for sharing"
ON public.marriages
FOR SELECT
USING (true);