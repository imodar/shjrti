-- Restore last_name for descendants whose father is an external spouse (not founder, no father in tree)
UPDATE public.family_tree_members AS m
SET last_name = father.last_name
FROM public.family_tree_members AS father
WHERE m.father_id = father.id
  AND m.family_id = father.family_id
  AND COALESCE(father.is_founder, false) = false
  AND father.father_id IS NULL
  AND father.last_name IS NOT NULL
  AND father.last_name <> ''
  AND m.last_name IS DISTINCT FROM father.last_name;