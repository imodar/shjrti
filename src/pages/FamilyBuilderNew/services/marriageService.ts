import { supabase } from "@/integrations/supabase/client";
import { Marriage } from "../types/family.types";

export const marriageService = {
  async getMarriagesByFamilyId(familyId: string): Promise<Marriage[]> {
    const { data, error } = await supabase
      .from('marriages')
      .select('*')
      .eq('family_id', familyId);

    if (error) {
      console.error('Error fetching marriages:', error);
      throw error;
    }

    return data || [];
  },

  async createMarriage(marriageData: Partial<Marriage>): Promise<Marriage> {
    const { data, error } = await supabase
      .from('marriages')
      .insert([marriageData])
      .select()
      .single();

    if (error) {
      console.error('Error creating marriage:', error);
      throw error;
    }

    return data;
  },

  async updateMarriage(marriageId: string, updates: Partial<Marriage>): Promise<Marriage> {
    const { data, error } = await supabase
      .from('marriages')
      .update(updates)
      .eq('id', marriageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating marriage:', error);
      throw error;
    }

    return data;
  },

  async deleteMarriage(marriageId: string): Promise<void> {
    const { error } = await supabase
      .from('marriages')
      .delete()
      .eq('id', marriageId);

    if (error) {
      console.error('Error deleting marriage:', error);
      throw error;
    }
  },

  async deactivateMarriages(marriageIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('marriages')
      .update({ is_active: false })
      .in('id', marriageIds);

    if (error) {
      console.error('Error deactivating marriages:', error);
      throw error;
    }
  }
};