/**
 * Memories Mutations Hooks
 * Provides React Query mutations for memory operations using the API
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memoriesApi } from '@/lib/api';
import type { 
  MemberMemoryCreateInput, 
  MemberMemoryUpdateInput,
  FamilyMemoryCreateInput,
  FamilyMemoryUpdateInput 
} from '@/lib/api/endpoints/memories';
import { toast } from 'sonner';

// ============= Member Memory Mutations =============

export const useCreateMemberMemoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: MemberMemoryCreateInput) => memoriesApi.createMemberMemory(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memories', variables.member_id] });
      toast.success('تم رفع الصورة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Create member memory error:', error);
      toast.error('فشل رفع الصورة');
    },
  });
};

export const useUpdateMemberMemoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, memberId, ...input }: MemberMemoryUpdateInput & { id: string; memberId: string }) => 
      memoriesApi.updateMemberMemory(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memories', variables.memberId] });
      toast.success('تم تحديث الذكرى بنجاح');
    },
    onError: (error: Error) => {
      console.error('Update member memory error:', error);
      toast.error('فشل تحديث الذكرى');
    },
  });
};

export const useDeleteMemberMemoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id }: { id: string; memberId: string }) => memoriesApi.deleteMemberMemory(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memories', variables.memberId] });
      toast.success('تم حذف الصورة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Delete member memory error:', error);
      toast.error('فشل حذف الصورة');
    },
  });
};

// ============= Family Memory Mutations =============

export const useCreateFamilyMemoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: FamilyMemoryCreateInput) => memoriesApi.createFamilyMemory(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['familyMemories', variables.family_id] });
      toast.success('تم رفع الصورة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Create family memory error:', error);
      toast.error('فشل رفع الصورة');
    },
  });
};

export const useUpdateFamilyMemoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, familyId, ...input }: FamilyMemoryUpdateInput & { id: string; familyId: string }) => 
      memoriesApi.updateFamilyMemory(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['familyMemories', variables.familyId] });
      toast.success('تم تحديث الذكرى بنجاح');
    },
    onError: (error: Error) => {
      console.error('Update family memory error:', error);
      toast.error('فشل تحديث الذكرى');
    },
  });
};

export const useDeleteFamilyMemoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id }: { id: string; familyId: string }) => memoriesApi.deleteFamilyMemory(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['familyMemories', variables.familyId] });
      toast.success('تم حذف الصورة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Delete family memory error:', error);
      toast.error('فشل حذف الصورة');
    },
  });
};

// ============= Combined Hook =============

export const useMemoriesMutations = () => {
  return {
    // Member memories
    createMemberMemory: useCreateMemberMemoryMutation(),
    updateMemberMemory: useUpdateMemberMemoryMutation(),
    deleteMemberMemory: useDeleteMemberMemoryMutation(),
    // Family memories
    createFamilyMemory: useCreateFamilyMemoryMutation(),
    updateFamilyMemory: useUpdateFamilyMemoryMutation(),
    deleteFamilyMemory: useDeleteFamilyMemoryMutation(),
  };
};
