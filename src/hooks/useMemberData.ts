import { useMemberQuery, useMemberMemoriesQuery } from '@/hooks/queries/useFamilyQueries';
import { useFamilyData } from '@/contexts/FamilyDataContext';

interface MemberData {
  member: any | null;
  marriages: any[];
  memories: any[];
  familyMembers: any[];
}

export const useMemberData = (memberId: string | null, familyId: string | null) => {
  // ✅ Use FamilyDataContext for shared data (no duplicate queries!)
  const { familyMembers, marriages } = useFamilyData();
  
  // ✅ Use React Query for specific member data
  const { data: member = null, isLoading: memberLoading } = useMemberQuery(memberId);
  
  // ✅ Use React Query for member memories
  const { data: memories = [], isLoading: memoriesLoading } = useMemberMemoriesQuery(memberId);

  const loading = memberLoading || memoriesLoading;
  const error = null; // Errors are handled by React Query

  return {
    data: {
      member,
      marriages,
      memories,
      familyMembers,
    },
    loading,
    error,
  };
};
