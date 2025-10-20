import { supabase } from "@/integrations/supabase/client";
import { Family } from "../types/family.types";

export const familyService = {
  async getFamilyById(familyId: string): Promise<Family | null> {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (error) {
      console.error('Error fetching family:', error);
      throw error;
    }

    return data;
  },

  async updateFamily(familyId: string, updates: Partial<Family>): Promise<Family> {
    const { data, error } = await supabase
      .from('families')
      .update(updates)
      .eq('id', familyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating family:', error);
      throw error;
    }

    return data;
  },

  async deleteFamily(familyId: string): Promise<void> {
    const { error } = await supabase
      .from('families')
      .delete()
      .eq('id', familyId);

    if (error) {
      console.error('Error deleting family:', error);
      throw error;
    }
  }
};