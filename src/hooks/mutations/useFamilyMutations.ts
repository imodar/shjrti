import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Add member mutation
export const useAddMemberMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (memberData: any) => {
      const { data, error } = await supabase
        .from('family_tree_members')
        .insert(memberData)
        .select()
        .single();
      if (error) throw error;
      return data;
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

// Update member mutation
export const useUpdateMemberMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates, twinIds }: { 
      id: string; 
      updates: any;
      twinIds?: string[];
    }) => {
      const { data, error } = await supabase
        .from('family_tree_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Update twins if provided
      if (twinIds && twinIds.length > 0 && updates.twin_group_id) {
        const twinUpdates = twinIds.map(twinId =>
          supabase
            .from('family_tree_members')
            .update({
              is_twin: true,
              twin_group_id: updates.twin_group_id
            })
            .eq('id', twinId)
        );
        await Promise.all(twinUpdates);
      }

      return data;
    },
    onSuccess: (updatedMember) => {
      // Update cache
      queryClient.setQueryData(
        ['members', updatedMember.family_id],
        (old: any[] = []) => old.map(m => m.id === updatedMember.id ? updatedMember : m)
      );
      
      // Invalidate to refresh twins
      queryClient.invalidateQueries({ 
        queryKey: ['members', updatedMember.family_id] 
      });
      
      // Also update single member cache if it exists
      queryClient.setQueryData(['member', updatedMember.id], updatedMember);
      
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات العضو والتوائم بنجاح',
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

// Delete member mutation
export const useDeleteMemberMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      const { error } = await supabase
        .from('family_tree_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
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

// Add marriage mutation
export const useAddMarriageMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (marriageData: any) => {
      const { data, error } = await supabase
        .from('marriages')
        .insert(marriageData)
        .select()
        .single();
      if (error) throw error;
      return data;
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

// Update marriage mutation
export const useUpdateMarriageMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates, familyId }: { id: string; updates: any; familyId: string }) => {
      const { data, error } = await supabase
        .from('marriages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
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
