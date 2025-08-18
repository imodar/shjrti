import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FamilyMember {
  id: string;
  isFounder?: boolean;
  fatherId?: string;
  motherId?: string;
  [key: string]: any;
}

interface FamilyMarriage {
  husband?: { id: string };
  wife?: { id: string };
  [key: string]: any;
}

interface FamilyDataResult {
  familyId: string | null;
  familyData: any | null;
  familyMembers: FamilyMember[];
  familyMarriages: FamilyMarriage[];
  spousesData: any[];
  loading: boolean;
  refetchFamily: () => Promise<void>;
  addMember: (memberData: any) => Promise<boolean>;
  updateMember: (memberId: string, memberData: any) => Promise<boolean>;
  deleteMember: (memberId: string) => Promise<boolean>;
}

export const useFamilyData = (familyIdFromParams: string | null): FamilyDataResult => {
  const [familyId, setFamilyId] = useState<string | null>(familyIdFromParams);
  const [familyData, setFamilyData] = useState<any | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<FamilyMarriage[]>([]);
  const [spousesData, setSpousesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const calculateGenerationCount = (members: FamilyMember[], marriages: FamilyMarriage[]): number => {
    if (members.length === 0) return 1;
    
    const generationMap = new Map();
    
    members.forEach(member => {
      if (member.isFounder || (!member.fatherId && !member.motherId)) {
        generationMap.set(member.id, 1);
      }
    });
    
    let changed = true;
    let maxIterations = 50;
    let iterations = 0;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      members.forEach(member => {
        if (!generationMap.has(member.id)) {
          if (member.fatherId || member.motherId) {
            const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : undefined;
            const motherGeneration = member.motherId ? generationMap.get(member.motherId) : undefined;
            
            if (fatherGeneration !== undefined || motherGeneration !== undefined) {
              const parentGeneration = Math.max(
                fatherGeneration || 0, 
                motherGeneration || 0
              );
              generationMap.set(member.id, parentGeneration + 1);
              changed = true;
            }
          } else {
            generationMap.set(member.id, 1);
            changed = true;
          }
        }
      });
    }
    
    marriages.forEach(marriage => {
      const husbandGeneration = generationMap.get(marriage.husband?.id);
      const wifeGeneration = generationMap.get(marriage.wife?.id);
      
      if (husbandGeneration && !wifeGeneration) {
        generationMap.set(marriage.wife?.id, husbandGeneration);
      } else if (wifeGeneration && !husbandGeneration) {
        generationMap.set(marriage.husband?.id, wifeGeneration);
      }
    });
    
    const generations = Array.from(generationMap.values());
    return generations.length > 0 ? Math.max(...generations) : 1;
  };

  const fetchFamilyData = async () => {
    if (!familyId) return;
    
    try {
      setLoading(true);
      
      const [familyResult, membersResult, marriagesResult, spousesResult] = await Promise.all([
        supabase.from('families').select('*').eq('id', familyId).single(),
        supabase.from('family_members').select('*').eq('family_id', familyId),
        supabase.from('marriages').select('*').eq('family_id', familyId),
        Promise.resolve({ data: [], error: null })
      ]);

      if (familyResult.error) throw familyResult.error;
      if (membersResult.error) throw membersResult.error;
      if (marriagesResult.error) throw marriagesResult.error;
      if (spousesResult.error) throw spousesResult.error;

      setFamilyData(familyResult.data);
      setFamilyMembers(membersResult.data || []);
      setFamilyMarriages((marriagesResult.data as any) || []);
      setSpousesData(spousesResult.data || []);
      
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message || "حدث خطأ أثناء تحميل بيانات العائلة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refetchFamily = async () => {
    await fetchFamilyData();
  };

  const addMember = async (memberData: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('family_members')
        .insert([{ ...memberData, family_id: familyId }]);

      if (error) throw error;
      
      await fetchFamilyData();
      toast({
        title: "تم إضافة العضو بنجاح",
        description: "تم إضافة العضو الجديد إلى شجرة العائلة",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة العضو",
        description: error.message || "حدث خطأ أثناء إضافة العضو",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateMember = async (memberId: string, memberData: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('family_members')
        .update(memberData)
        .eq('id', memberId);

      if (error) throw error;
      
      await fetchFamilyData();
      toast({
        title: "تم تحديث البيانات بنجاح",
        description: "تم حفظ التغييرات على بيانات العضو",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث البيانات",
        description: error.message || "حدث خطأ أثناء تحديث بيانات العضو",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteMember = async (memberId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      await fetchFamilyData();
      toast({
        title: "تم حذف العضو بنجاح",
        description: "تم حذف العضو من شجرة العائلة",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "خطأ في حذف العضو",
        description: error.message || "حدث خطأ أثناء حذف العضو",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (familyIdFromParams) {
      setFamilyId(familyIdFromParams);
    }
  }, [familyIdFromParams]);

  useEffect(() => {
    fetchFamilyData();
  }, [familyId]);

  return {
    familyId,
    familyData,
    familyMembers,
    familyMarriages,
    spousesData,
    loading,
    refetchFamily,
    addMember,
    updateMember,
    deleteMember
  };
};