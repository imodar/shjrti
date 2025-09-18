import { useMemo } from 'react';

interface Member {
  id: string;
  name: string;
  isFounder?: boolean;
  fatherId?: string;
  motherId?: string;
}

interface Marriage {
  id: string;
  husband_id: string;
  wife_id: string;
}

interface GenerationStats {
  generation: number;
  count: number;
}

interface UseGenerationCalculationResult {
  generationCount: number;
  generationStats: GenerationStats[];
  generationMap: Map<string, number>;
  getMemberGeneration: (memberId: string) => number;
}

/**
 * Custom hook لحساب الأجيال وإدارة إحصائياتها
 * @param familyMembers - قائمة أعضاء العائلة
 * @param familyMarriages - قائمة الزيجات
 * @param loading - حالة التحميل
 * @returns نتائج حساب الأجيال والإحصائيات
 */
export const useGenerationCalculation = (
  familyMembers: Member[],
  familyMarriages: Marriage[],
  loading: boolean = false
): UseGenerationCalculationResult => {
  
  // حساب عدد الأجيال الإجمالي وخريطة الأجيال
  const { generationCount, generationMap } = useMemo(() => {
    console.log('🔍 calculateGenerationCount called with familyMembers.length:', familyMembers.length);
    console.log('🔍 familyMarriages.length:', familyMarriages?.length || 0);
    
    if (familyMembers.length === 0) {
      console.log('🔍 No family members, returning 1');
      return { generationCount: 1, generationMap: new Map<string, number>() };
    }

    console.log('🔍 Starting generation calculation with members:', familyMembers.map(m => ({
      id: m.id,
      name: m.name,
      isFounder: m.isFounder,
      fatherId: m.fatherId,
      motherId: m.motherId
    })));

    const generationMap = new Map<string, number>();

    // الخطوة 1: العثور على المؤسس وتخصيص الجيل 1
    const founder = familyMembers.find(member => member.isFounder);
    if (founder) {
      generationMap.set(founder.id, 1);
      console.log(`🔍 Assigned generation 1 to founder: ${founder.name}`);

      // الخطوة 2: العثور على زوج/زوجة المؤسس وتخصيص الجيل 1
      familyMarriages.forEach(marriage => {
        if (marriage.husband_id === founder.id && marriage.wife_id) {
          generationMap.set(marriage.wife_id, 1);
          const spouse = familyMembers.find(m => m.id === marriage.wife_id);
          console.log(`🔍 Assigned generation 1 to founder's spouse: ${spouse?.name}`);
        } else if (marriage.wife_id === founder.id && marriage.husband_id) {
          generationMap.set(marriage.husband_id, 1);
          const spouse = familyMembers.find(m => m.id === marriage.husband_id);
          console.log(`🔍 Assigned generation 1 to founder's spouse: ${spouse?.name}`);
        }
      });
    }

    // الخطوة 3: تخصيص الأجيال بناءً على علاقات الوالد-الطفل
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (generationMap.has(member.id)) return; // تجاهل إذا تم تخصيصه بالفعل

        const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : null;
        const motherGeneration = member.motherId ? generationMap.get(member.motherId) : null;

        // إذا كان أحد الوالدين على الأقل له جيل، خصص جيل الطفل
        if ((fatherGeneration !== undefined && fatherGeneration !== null) || 
            (motherGeneration !== undefined && motherGeneration !== null)) {
          const parentGeneration = Math.max(fatherGeneration || 0, motherGeneration || 0);
          const childGeneration = parentGeneration + 1;
          generationMap.set(member.id, childGeneration);
          console.log(`🔍 Assigned generation ${childGeneration} to ${member.name} (child of generation ${parentGeneration})`);
          changed = true;

          // الخطوة 4: خصص نفس الجيل لزوج/زوجته
          familyMarriages.forEach(marriage => {
            let spouseId = null;
            if (marriage.husband_id === member.id && marriage.wife_id) {
              spouseId = marriage.wife_id;
            } else if (marriage.wife_id === member.id && marriage.husband_id) {
              spouseId = marriage.husband_id;
            }
            
            if (spouseId && !generationMap.has(spouseId)) {
              generationMap.set(spouseId, childGeneration);
              const spouse = familyMembers.find(m => m.id === spouseId);
              console.log(`🔍 Assigned generation ${childGeneration} to spouse: ${spouse?.name}`);
              changed = true;
            }
          });
        }
      });
      
      console.log(`🔍 Iteration ${iterations}: ${generationMap.size} members assigned`);
    }

    // الخطوة 5: خصص الجيل 1 لأي أعضاء متبقين بدون والدين (احتياطي)
    familyMembers.forEach(member => {
      if (!generationMap.has(member.id) && !member.fatherId && !member.motherId) {
        generationMap.set(member.id, 1);
        console.log(`🔍 Assigned generation 1 to ${member.name} (no parents, fallback)`);
      }
    });

    // السجل النهائي لجميع التخصيصات
    console.log("🔍 Final generation assignments:");
    familyMembers.forEach(member => {
      const gen = generationMap.get(member.id) || 1;
      console.log(`🔍 ${member.name} -> Generation ${gen}`);
    });

    const maxGeneration = generationMap.size > 0 ? Math.max(...Array.from(generationMap.values())) : 1;
    console.log("🔍 Max generation calculated:", maxGeneration);
    
    return { generationCount: maxGeneration, generationMap };
  }, [familyMembers, familyMarriages, loading]);

  // حساب إحصائيات الأجيال
  const generationStats = useMemo((): GenerationStats[] => {
    if (familyMembers.length === 0) return [];
    
    const generationCounts = new Map<number, number>();
    
    // حساب عدد الأعضاء في كل جيل
    generationMap.forEach(generation => {
      generationCounts.set(generation, (generationCounts.get(generation) || 0) + 1);
    });
    
    return Array.from(generationCounts.entries())
      .map(([generation, count]) => ({ generation, count }))
      .sort((a, b) => a.generation - b.generation);
  }, [familyMembers, generationMap]);

  // دالة للحصول على جيل عضو محدد
  const getMemberGeneration = (memberId: string): number => {
    return generationMap.get(memberId) || 1;
  };

  return {
    generationCount,
    generationStats,
    generationMap,
    getMemberGeneration
  };
};