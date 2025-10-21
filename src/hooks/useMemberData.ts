import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MemberData {
  member: any | null;
  marriages: any[];
  memories: any[];
  familyMembers: any[];
}

export const useMemberData = (memberId: string | null, familyId: string | null) => {
  const [data, setData] = useState<MemberData>({
    member: null,
    marriages: [],
    memories: [],
    familyMembers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId || !familyId) {
      setLoading(false);
      return;
    }

    const fetchMemberData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch member details
        const { data: member, error: memberError } = await supabase
          .from('family_tree_members')
          .select('*')
          .eq('id', memberId)
          .single();

        if (memberError) throw memberError;

        // Fetch all family members for relationships
        const { data: familyMembers, error: familyMembersError } = await supabase
          .from('family_tree_members')
          .select('*')
          .eq('family_id', familyId);

        if (familyMembersError) throw familyMembersError;

        // Fetch marriages
        const { data: marriages, error: marriagesError } = await supabase
          .from('marriages')
          .select('*')
          .eq('family_id', familyId);

        if (marriagesError) throw marriagesError;

        // Fetch member memories
        const { data: memories, error: memoriesError } = await supabase
          .from('member_memories')
          .select('*')
          .eq('member_id', memberId)
          .order('uploaded_at', { ascending: false });

        // Memories might not exist for some members, so don't throw error
        const memberMemories = memoriesError ? [] : (memories || []);

        setData({
          member,
          marriages: marriages || [],
          memories: memberMemories,
          familyMembers: familyMembers || []
        });
      } catch (err) {
        console.error('Error fetching member data:', err);
        setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [memberId, familyId]);

  return { data, loading, error };
};
