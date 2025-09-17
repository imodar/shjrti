import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Family, Member, Marriage } from "../types/family.types";

interface UseFamilyDataResult {
  familyData: Family | null;
  familyMembers: Member[];
  marriages: Marriage[];
  loading: boolean;
  dataLoaded: boolean;
  refreshFamilyData: () => Promise<void>;
  setFamilyData: (data: Family | null) => void;
  setFamilyMembers: (members: Member[]) => void;
  setMarriages: (marriages: Marriage[]) => void;
}

export const useFamilyData = (familyId: string | null): UseFamilyDataResult => {
  const { toast } = useToast();
  
  const [familyData, setFamilyData] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const fetchFamilyData = useCallback(async () => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch family data
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (familyError) {
        console.error('Error fetching family:', familyError);
        toast({
          title: "خطأ في تحميل بيانات العائلة",
          description: "حدث خطأ أثناء تحميل بيانات العائلة",
          variant: "destructive"
        });
        return;
      }

      setFamilyData(family);

      // Fetch family tree members
      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (membersError) {
        console.error('Error fetching family tree members:', membersError);
        toast({
          title: "خطأ في تحميل الأعضاء",
          description: "حدث خطأ أثناء تحميل أعضاء العائلة",
          variant: "destructive"
        });
        return;
      }

      setFamilyMembers(members || []);

      // Fetch marriages
      const { data: marriagesList, error: marriagesError } = await supabase
        .from('marriages')
        .select('*')
        .eq('family_id', familyId);

      if (marriagesError) {
        console.error('Error fetching marriages:', marriagesError);
        toast({
          title: "خطأ في تحميل الزيجات",
          description: "حدث خطأ أثناء تحميل بيانات الزيجات",
          variant: "destructive"
        });
        return;
      }

      setMarriages(marriagesList || []);
      setDataLoaded(true);
      
    } catch (error) {
      console.error('Error in fetchFamilyData:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع أثناء تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [familyId, toast]);

  const refreshFamilyData = useCallback(async () => {
    await fetchFamilyData();
  }, [fetchFamilyData]);

  useEffect(() => {
    fetchFamilyData();
  }, [fetchFamilyData]);

  return {
    familyData,
    familyMembers,
    marriages,
    loading,
    dataLoaded,
    refreshFamilyData,
    setFamilyData,
    setFamilyMembers,
    setMarriages
  };
};