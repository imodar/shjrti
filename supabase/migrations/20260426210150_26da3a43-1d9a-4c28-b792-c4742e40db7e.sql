UPDATE public.family_tree_members AS m
SET last_name = founder.last_name,
    updated_at = now()
FROM public.family_tree_members AS founder
WHERE founder.family_id = m.family_id
  AND founder.is_founder = true
  AND founder.last_name IS NOT NULL
  AND m.is_founder IS NOT TRUE
  AND m.last_name IS DISTINCT FROM founder.last_name
  AND m.father_id IN (
    SELECT ftm2.id FROM public.family_tree_members ftm2 WHERE ftm2.family_id = m.family_id
  );