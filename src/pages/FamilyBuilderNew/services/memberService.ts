import { supabase } from "@/integrations/supabase/client";
import { Member } from "../types/family.types";
import { formatDateForDatabase } from "@/lib/dateUtils";

export const memberService = {
  async getMembersByFamilyId(familyId: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from('family_tree_members')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      throw error;
    }

    return data || [];
  },

  async getMemberById(memberId: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('family_tree_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) {
      console.error('Error fetching member:', error);
      throw error;
    }

    return data;
  },

  async createMember(memberData: Partial<Member>): Promise<Member> {
    if (!memberData.family_id) {
      throw new Error('family_id is required');
    }
    
    // Compute name if not provided
    const name = memberData.name || 
                 `${memberData.first_name || ''} ${memberData.last_name || ''}`.trim() ||
                 memberData.first_name || 
                 'غير معروف';
    
    const { data, error } = await supabase
      .from('family_tree_members')
      .insert([{
        ...memberData,
        name,
        family_id: memberData.family_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', error);
      throw error;
    }

    return data;
  },

  async updateMember(memberId: string, updates: Partial<Member>): Promise<Member> {
    const { data, error } = await supabase
      .from('family_tree_members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      throw error;
    }

    return data;
  },

  async deleteMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('family_tree_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }
};