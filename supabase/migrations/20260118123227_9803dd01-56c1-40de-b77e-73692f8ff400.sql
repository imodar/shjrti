-- Fix Fayed's marital status to single (was incorrectly set to married due to a bug)
UPDATE family_tree_members 
SET marital_status = 'single', updated_at = now()
WHERE id = 'fa609881-dfde-48d0-8507-175722a312c3';