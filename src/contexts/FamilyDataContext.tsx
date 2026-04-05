import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { familiesApi } from '@/lib/api';
import type { Family, Member, Marriage } from '@/lib/api/types';

// Re-export types for consumers
export type { Family, Member, Marriage } from '@/lib/api/types';

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

export const FamilyDataContext = createContext<FamilyDataContextType | undefined>(undefined);

interface FamilyDataProviderProps {
  children: ReactNode;
  familyId: string | null;
  initialData?: {
    family: Family | null;
    members: Member[];
    marriages: Marriage[];
  };
}

export const FamilyDataProvider: React.FC<FamilyDataProviderProps> = ({ children, familyId, initialData }) => {
  const queryClient = useQueryClient();

  // If initialData is provided, skip queries entirely
  const shouldFetch = !!familyId && !initialData;

  // Query for family data - NOW USING API
  const { data: familyData = initialData?.family ?? null, isLoading: familyLoading, error: familyError } = useQuery({
    queryKey: ['family', familyId],
    queryFn: async () => {
      if (!familyId) return null;
      return await familiesApi.get(familyId);
    },
    enabled: shouldFetch,
    initialData: initialData?.family,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Query for family members - NOW USING API
  const { data: familyMembers = initialData?.members ?? [], isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ['members', familyId],
    queryFn: async () => {
      if (!familyId) return [];
      return await familiesApi.getMembers(familyId);
    },
    enabled: shouldFetch,
    initialData: initialData?.members,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query for marriages - NOW USING API
  const { data: marriages = initialData?.marriages ?? [], isLoading: marriagesLoading, error: marriagesError } = useQuery({
    queryKey: ['marriages', familyId],
    queryFn: async () => {
      if (!familyId) return [];
      return await familiesApi.getMarriages(familyId);
    },
    enabled: shouldFetch,
    initialData: initialData?.marriages,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // If initialData is provided, never show loading state
  const loading = initialData ? false : (familyLoading || membersLoading || marriagesLoading);
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
