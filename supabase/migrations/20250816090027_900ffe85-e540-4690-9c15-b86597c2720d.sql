-- Create trigger for family_tree_members to automatically update name field
CREATE TRIGGER update_family_tree_members_name
  BEFORE INSERT OR UPDATE ON family_tree_members
  FOR EACH ROW
  EXECUTE FUNCTION update_full_name();