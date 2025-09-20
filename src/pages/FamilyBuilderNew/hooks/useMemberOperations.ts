import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Member } from "../types/family.types";

interface MemberFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  gender: string;
  birthDate: Date | undefined;
  deathDate: Date | undefined;
  birthPlace: string;
  deathPlace: string;
  currentResidence: string;
  occupation: string;
  education: string;
  biography: string;
  isAlive: boolean;
  isFounder: boolean;
  fatherId: string;
  motherId: string;
  imageUrl?: string;
}

interface UseMemberOperationsResult {
  isLoading: boolean;
  createMember: (familyId: string, formData: MemberFormData) => Promise<Member | null>;
  updateMember: (memberId: string, formData: MemberFormData) => Promise<Member | null>;
  deleteMember: (memberId: string) => Promise<boolean>;
  uploadMemberImage: (file: File, memberId?: string) => Promise<string | null>;
}

export const useMemberOperations = (): UseMemberOperationsResult => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createMember = useCallback(async (familyId: string, formData: MemberFormData): Promise<Member | null> => {
    try {
      setIsLoading(true);

      const memberData = {
        family_id: familyId,
        name: `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim(),
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender,
        birth_date: formData.birthDate?.toISOString(),
        death_date: formData.deathDate?.toISOString(),
        birth_place: formData.birthPlace,
        death_place: formData.deathPlace,
        biography: formData.biography,
        is_alive: formData.isAlive,
        is_founder: formData.isFounder,
        father_id: formData.fatherId || null,
        mother_id: formData.motherId || null,
        image_url: formData.imageUrl
      };

      const { data: member, error } = await supabase
        .from('family_tree_members')
        .insert(memberData)
        .select()
        .single();

      if (error) {
        console.error('Error creating member:', error);
        toast({
          title: "خطأ في الإنشاء",
          description: "حدث خطأ أثناء إنشاء العضو الجديد",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إنشاء العضو الجديد بنجاح"
      });

      return member;
    } catch (error) {
      console.error('Error in createMember:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع أثناء إنشاء العضو",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateMember = useCallback(async (memberId: string, formData: MemberFormData): Promise<Member | null> => {
    try {
      setIsLoading(true);

      const memberData = {
        name: `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim(),
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender,
        birth_date: formData.birthDate?.toISOString(),
        death_date: formData.deathDate?.toISOString(),
        birth_place: formData.birthPlace,
        death_place: formData.deathPlace,
        biography: formData.biography,
        is_alive: formData.isAlive,
        is_founder: formData.isFounder,
        father_id: formData.fatherId || null,
        mother_id: formData.motherId || null,
        image_url: formData.imageUrl
      };

      const { data: member, error } = await supabase
        .from('family_tree_members')
        .update(memberData)
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('Error updating member:', error);
        toast({
          title: "خطأ في التحديث",
          description: "حدث خطأ أثناء تحديث بيانات العضو",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات العضو بنجاح"
      });

      return member;
    } catch (error) {
      console.error('Error in updateMember:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع أثناء تحديث العضو",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteMember = useCallback(async (memberId: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('family_tree_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Error deleting member:', error);
        toast({
          title: "خطأ في الحذف",
          description: "حدث خطأ أثناء حذف العضو",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف العضو بنجاح"
      });

      return true;
    } catch (error) {
      console.error('Error in deleteMember:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع أثناء حذف العضو",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const uploadMemberImage = useCallback(async (file: File, memberId?: string): Promise<string | null> => {
    try {
      setIsLoading(true);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${memberId || Date.now()}.${fileExt}`;
      const filePath = `member-images/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('family-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast({
          title: "خطأ في رفع الصورة",
          description: "حدث خطأ أثناء رفع الصورة",
          variant: "destructive"
        });
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('family-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadMemberImage:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع أثناء رفع الصورة",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    createMember,
    updateMember,
    deleteMember,
    uploadMemberImage
  };
};