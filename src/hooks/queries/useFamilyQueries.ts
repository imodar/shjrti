import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Query for single member
export const useMemberQuery = (memberId: string | null) => {
  return useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('id', memberId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
  });
};

// Query for member memories
export const useMemberMemoriesQuery = (memberId: string | null) => {
  return useQuery({
    queryKey: ['memories', memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase
        .from('member_memories')
        .select('*')
        .eq('member_id', memberId)
        .order('uploaded_at', { ascending: false });
      
      // Don't throw error if memories don't exist
      if (error && error.code !== 'PGRST116') throw error;
      return data || [];
    },
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Query for family data
export const useFamilyQuery = (familyId: string | null) => {
  return useQuery({
    queryKey: ['family', familyId],
    queryFn: async () => {
      if (!familyId) return null;
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Query for all family members (lightweight for list views)
export const useMembersQuery = (familyId: string | null) => {
  return useQuery({
    queryKey: ['members', familyId],
    queryFn: async () => {
      if (!familyId) return [];
      const { data, error } = await supabase
        .from('family_tree_members')
        .select('id, name, first_name, last_name, father_id, mother_id, spouse_id, gender, birth_date, is_alive, image_url, marital_status, is_founder')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Query for marriages
export const useMarriagesQuery = (familyId: string | null) => {
  return useQuery({
    queryKey: ['marriages', familyId],
    queryFn: async () => {
      if (!familyId) return [];
      const { data, error } = await supabase
        .from('marriages')
        .select('*')
        .eq('family_id', familyId);
      if (error) throw error;
      return data;
    },
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
