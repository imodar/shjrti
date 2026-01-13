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

  // ✅ Prefer member data from context (public views return privacy-masked data here)
  const memberFromContext = memberId
    ? (familyMembers || []).find((m: any) => m?.id === memberId) ?? null
    : null;

  // ✅ Fallback to direct query ONLY when context doesn't have the member
  const shouldFetchMember = !!memberId && !memberFromContext;
  const memberQuery = useMemberQuery(shouldFetchMember ? memberId : null);

  const member = memberFromContext ?? memberQuery.data ?? null;
  const memberLoading = memberFromContext ? false : memberQuery.isLoading;

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
