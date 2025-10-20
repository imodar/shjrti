import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDatabase } from "@/lib/dateUtils";
import { uploadMemberImage, deleteMemberImage } from "@/utils/imageUpload";
import { Member } from "../types/family.types";

export const useMemberOperations = () => {
  const { toast } = useToast();

  const addMember = useCallback(async (memberData: Partial<Member>, familyId: string, creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_tree_members')
        .insert([{
          ...memberData,
          family_id: familyId,
          created_by: creatorId,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم إضافة العضو",
        description: "تم إضافة العضو بنجاح",
      });

      return data;
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة العضو",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const updateMember = useCallback(async (id: string, updates: Partial<Member>) => {
    try {
      const { data, error } = await supabase
        .from('family_tree_members')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات العضو بنجاح",
      });

      return data;
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث العضو",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const deleteMember = useCallback(async (id: string) => {
    try {
      // First, get member image if exists
      const { data: member } = await supabase
        .from('family_tree_members')
        .select('image_url')
        .eq('id', id)
        .single();

      // Delete image from storage if exists
      if (member?.image_url && !member.image_url.startsWith('data:image/')) {
        await deleteMemberImage(member.image_url);
      }

      // Delete member
      const { error } = await supabase
        .from('family_tree_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف العضو بنجاح",
      });

      return true;
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف العضو",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  return {
    addMember,
    updateMember,
    deleteMember
  };
};