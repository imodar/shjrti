import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { membersApi, marriagesApi } from '@/lib/api';
import type { MemberCreateInput, MemberUpdateInput, MarriageCreateInput, MarriageUpdateInput } from '@/lib/api/types';

// Add member mutation - NOW USING API
export const useAddMemberMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (memberData: MemberCreateInput) => {
      return await membersApi.create(memberData);
    },
    onSuccess: (newMember) => {
      // Update cache directly instead of refetching
      queryClient.setQueryData(
        ['members', newMember.family_id],
        (old: any[] = []) => [...old, newMember]
      );
      
      toast({
        title: 'تم إضافة العضو',
        description: 'تم إضافة عضو جديد إلى شجرة العائلة',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إضافة العضو',
        variant: 'destructive',
      });
    },
  });
};

// Update member mutation - NOW USING API
export const useUpdateMemberMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MemberUpdateInput }) => {
      return await membersApi.update(id, updates);
    },
    onSuccess: (updatedMember) => {
      // Update cache
      queryClient.setQueryData(
        ['members', updatedMember.family_id],
        (old: any[] = []) => old.map(m => m.id === updatedMember.id ? updatedMember : m)
      );
      
      // Also update single member cache if it exists
      queryClient.setQueryData(['member', updatedMember.id], updatedMember);
      
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات العضو بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث العضو',
        variant: 'destructive',
      });
    },
  });
};

// Delete member mutation - NOW USING API
export const useDeleteMemberMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      await membersApi.delete(id);
      return { id, familyId };
    },
    onSuccess: ({ id, familyId }) => {
      // Remove from cache
      queryClient.setQueryData(
        ['members', familyId],
        (old: any[] = []) => old.filter(m => m.id !== id)
      );
      
      // Invalidate single member query
      queryClient.removeQueries({ queryKey: ['member', id] });
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف العضو من شجرة العائلة',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف العضو',
        variant: 'destructive',
      });
    },
  });
};

// Add marriage mutation - NOW USING API
export const useAddMarriageMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (marriageData: MarriageCreateInput) => {
      return await marriagesApi.create(marriageData);
    },
    onSuccess: (newMarriage) => {
      // Update cache
      queryClient.setQueryData(
        ['marriages', newMarriage.family_id],
        (old: any[] = []) => [...old, newMarriage]
      );
      
      toast({
        title: 'تم الإضافة',
        description: 'تم إضافة زواج جديد',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إضافة الزواج',
        variant: 'destructive',
      });
    },
  });
};

// Update marriage mutation - NOW USING API
export const useUpdateMarriageMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates, familyId }: { id: string; updates: MarriageUpdateInput; familyId: string }) => {
      const data = await marriagesApi.update(id, updates);
      return { data, familyId };
    },
    onSuccess: ({ data, familyId }) => {
      // Update cache
      queryClient.setQueryData(
        ['marriages', familyId],
        (old: any[] = []) => old.map(m => m.id === data.id ? data : m)
      );
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث الزواج',
        variant: 'destructive',
      });
    },
  });
};

// Add founder parent mutation - STILL USES RPC (special database function)
export const useAddFounderParentMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      familyId, 
      parentData,
      userId
    }: { 
      familyId: string; 
      parentData: {
        father: {
          first_name: string;
          last_name?: string;
          birth_date?: string;
          death_date?: string;
          is_alive: boolean;
        };
        mother: {
          first_name: string;
          last_name?: string;
          birth_date?: string;
          death_date?: string;
          is_alive: boolean;
        };
      };
      userId: string;
    }) => {
      if (!userId) throw new Error('User not authenticated');
      
      // This RPC function handles complex logic - keep using direct call
      const { data, error } = await supabase
        .rpc('add_founder_parent', {
          p_family_id: familyId,
          p_parent_data: parentData,
          p_user_id: userId
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newParentId, { familyId }) => {
      // Invalidate and refetch all family data
      queryClient.invalidateQueries({ queryKey: ['members', familyId] });
      queryClient.invalidateQueries({ queryKey: ['family', familyId] });
      queryClient.invalidateQueries({ queryKey: ['marriages', familyId] });
      
      toast({
        title: 'تم بنجاح',
        description: 'تمت إضافة الوالدين (الأب والأم) وعلاقة الزواج للشجرة',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إضافة الوالدين',
        variant: 'destructive',
      });
    },
  });
};
