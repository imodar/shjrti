import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Family {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  custom_domain?: string;
  share_password?: string;
  share_gallery?: boolean;
  created_at: string;
  updated_at: string;
}

interface Member {
  id: string;
  family_id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  gender: string;
  father_id?: string;
  mother_id?: string;
  spouse_id?: string;
  birth_date?: string;
  death_date?: string;
  is_alive: boolean;
  is_founder: boolean;
  marital_status: string;
  image_url?: string;
  biography?: string;
  created_at: string;
  updated_at: string;
}

interface Marriage {
  id: string;
  family_id: string;
  husband_id: string;
  wife_id: string;
  is_active: boolean;
  marital_status: string;
  created_at: string;
  updated_at: string;
}

interface FamilyDataContextType {
  familyData: Family | null;
  familyMembers: Member[];
  marriages: Marriage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Helper functions
  getMemberById: (id: string) => Member | undefined;
  getMemberMarriages: (memberId: string) => Marriage[];
  getMemberChildren: (memberId: string) => Member[];
  getMemberParents: (memberId: string) => { father?: Member; mother?: Member };
  getMemberSpouses: (memberId: string) => Member[];
}

const FamilyDataContext = createContext<FamilyDataContextType | undefined>(undefined);

interface FamilyDataProviderProps {
  children: ReactNode;
  familyId: string | null;
}

export const FamilyDataProvider: React.FC<FamilyDataProviderProps> = ({ children, familyId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for family data
  const { data: familyData = null, isLoading: familyLoading, error: familyError } = useQuery({
    queryKey: ['family', familyId],
    queryFn: async () => {
      if (!familyId) return null;
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();
      if (error) throw error;
      return data as Family;
    },
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });

  // Query for family members
  const { data: familyMembers = [], isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ['members', familyId],
    queryFn: async () => {
      if (!familyId) return [];
      const { data, error } = await supabase
        .from('family_tree_members')
        .select('id, name, first_name, last_name, father_id, mother_id, spouse_id, gender, birth_date, death_date, is_alive, is_founder, image_url, marital_status, biography, family_id, created_at, updated_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Member[];
    },
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query for marriages
  const { data: marriages = [], isLoading: marriagesLoading, error: marriagesError } = useQuery({
    queryKey: ['marriages', familyId],
    queryFn: async () => {
      if (!familyId) return [];
      const { data, error } = await supabase
        .from('marriages')
        .select('*')
        .eq('family_id', familyId);
      if (error) throw error;
      return data as Marriage[];
    },
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const loading = familyLoading || membersLoading || marriagesLoading;
  const error = familyError?.message || membersError?.message || marriagesError?.message || null;

  // Refetch all data
  const refetch = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['family', familyId] }),
      queryClient.invalidateQueries({ queryKey: ['members', familyId] }),
      queryClient.invalidateQueries({ queryKey: ['marriages', familyId] }),
    ]);
  };

  // Helper: Get member by ID
  const getMemberById = (id: string): Member | undefined => {
    return familyMembers.find(m => m.id === id);
  };

  // Helper: Get member's marriages
  const getMemberMarriages = (memberId: string): Marriage[] => {
    return marriages.filter(m => m.husband_id === memberId || m.wife_id === memberId);
  };

  // Helper: Get member's children
  const getMemberChildren = (memberId: string): Member[] => {
    return familyMembers.filter(m => m.father_id === memberId || m.mother_id === memberId);
  };

  // Helper: Get member's parents
  const getMemberParents = (memberId: string): { father?: Member; mother?: Member } => {
    const member = getMemberById(memberId);
    if (!member) return {};
    
    return {
      father: member.father_id ? getMemberById(member.father_id) : undefined,
      mother: member.mother_id ? getMemberById(member.mother_id) : undefined,
    };
  };

  // Helper: Get member's spouses
  const getMemberSpouses = (memberId: string): Member[] => {
    const memberMarriages = getMemberMarriages(memberId);
    return memberMarriages
      .map(m => {
        const spouseId = m.husband_id === memberId ? m.wife_id : m.husband_id;
        return getMemberById(spouseId);
      })
      .filter(Boolean) as Member[];
  };

  const value: FamilyDataContextType = {
    familyData,
    familyMembers,
    marriages,
    loading,
    error,
    refetch,
    getMemberById,
    getMemberMarriages,
    getMemberChildren,
    getMemberParents,
    getMemberSpouses,
  };

  return <FamilyDataContext.Provider value={value}>{children}</FamilyDataContext.Provider>;
};

export const useFamilyData = () => {
  const context = useContext(FamilyDataContext);
  if (context === undefined) {
    throw new Error('useFamilyData must be used within a FamilyDataProvider');
  }
  return context;
};
