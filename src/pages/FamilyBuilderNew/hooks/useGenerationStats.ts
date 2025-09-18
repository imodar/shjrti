import { useMemo } from "react";
import { Member, Marriage } from "../types/family.types";

interface GenerationStats {
  generation: number;
  count: number;
}

export const useGenerationStats = (
  familyMembers: Member[], 
  familyMarriages: Marriage[],
  loading: boolean
) => {
  const generationCount = useMemo(() => {
    console.log('🔍 calculateGenerationCount called with familyMembers.length:', familyMembers.length);
    console.log('🔍 familyMarriages.length:', familyMarriages?.length || 0);
    console.log('🔍 loading state:', loading);
    
    if (familyMembers.length === 0) {
      console.log('🔍 No family members, returning 1');
      return 1;
    }

    console.log('🔍 Starting generation calculation with members:', familyMembers.map(m => ({
      id: m.id,
      name: m.name,
      is_founder: m.is_founder,
      father_id: m.father_id,
      mother_id: m.mother_id
    })));

    const generationMap = new Map<string, number>();

    // Step 1: Find the founder and assign generation 1
    const founder = familyMembers.find(member => member.is_founder);
    if (founder) {
      generationMap.set(founder.id, 1);
      console.log(`🔍 Assigned generation 1 to founder: ${founder.name}`);

      // Step 2: Find founder's spouse(s) from marriages and assign generation 1
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

    // Step 3: Iteratively assign generations based on parent-child relationships
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (generationMap.has(member.id)) return; // Skip if already assigned

        const fatherGeneration = member.father_id ? generationMap.get(member.father_id) : null;
        const motherGeneration = member.mother_id ? generationMap.get(member.mother_id) : null;

        // If at least one parent has a generation, assign child generation
        if (fatherGeneration !== undefined && fatherGeneration !== null || 
            motherGeneration !== undefined && motherGeneration !== null) {
          const parentGeneration = Math.max(fatherGeneration || 0, motherGeneration || 0);
          const childGeneration = parentGeneration + 1;
          generationMap.set(member.id, childGeneration);
          console.log(`🔍 Assigned generation ${childGeneration} to ${member.name} (child of generation ${parentGeneration})`);
          changed = true;

          // Step 4: Also assign the same generation to their spouse(s)
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

    // Step 5: Assign generation 1 to any remaining members without parents (fallback)
    familyMembers.forEach(member => {
      if (!generationMap.has(member.id) && !member.father_id && !member.mother_id) {
        generationMap.set(member.id, 1);
        console.log(`🔍 Assigned generation 1 to ${member.name} (no parents, fallback)`);
      }
    });

    // Final log of all assignments
    console.log("🔍 Final generation assignments:");
    familyMembers.forEach(member => {
      const gen = generationMap.get(member.id) || 1;
      console.log(`🔍 ${member.name} -> Generation ${gen}`);
    });

    const maxGeneration = Math.max(...Array.from(generationMap.values()));
    console.log("🔍 Max generation calculated:", maxGeneration);
    return maxGeneration;
  }, [familyMembers, familyMarriages, loading]);

  const getGenerationStats = useMemo((): GenerationStats[] => {
    if (familyMembers.length === 0) return [];
    
    const generationMap = new Map<string, number>();

    // Use the same logic as generationCount but return detailed stats
    const founder = familyMembers.find(member => member.is_founder);
    if (founder) {
      generationMap.set(founder.id, 1);
      
      familyMarriages.forEach(marriage => {
        if (marriage.husband_id === founder.id && marriage.wife_id) {
          generationMap.set(marriage.wife_id, 1);
        } else if (marriage.wife_id === founder.id && marriage.husband_id) {
          generationMap.set(marriage.husband_id, 1);
        }
      });
    }

    let changed = true;
    let iterations = 0;
    const maxIterations = 10;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (generationMap.has(member.id)) return;

        const fatherGeneration = member.father_id ? generationMap.get(member.father_id) : null;
        const motherGeneration = member.mother_id ? generationMap.get(member.mother_id) : null;

        if (fatherGeneration !== undefined && fatherGeneration !== null || 
            motherGeneration !== undefined && motherGeneration !== null) {
          const parentGeneration = Math.max(fatherGeneration || 0, motherGeneration || 0);
          const childGeneration = parentGeneration + 1;
          generationMap.set(member.id, childGeneration);
          changed = true;

          familyMarriages.forEach(marriage => {
            let spouseId = null;
            if (marriage.husband_id === member.id && marriage.wife_id) {
              spouseId = marriage.wife_id;
            } else if (marriage.wife_id === member.id && marriage.husband_id) {
              spouseId = marriage.husband_id;
            }
            
            if (spouseId && !generationMap.has(spouseId)) {
              generationMap.set(spouseId, childGeneration);
              changed = true;
            }
          });
        }
      });
    }

    familyMembers.forEach(member => {
      if (!generationMap.has(member.id) && !member.father_id && !member.mother_id) {
        generationMap.set(member.id, 1);
      }
    });

    // Count members by generation
    const generationCounts = new Map<number, number>();
    generationMap.forEach(generation => {
      generationCounts.set(generation, (generationCounts.get(generation) || 0) + 1);
    });

    return Array.from(generationCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([generation, count]) => ({ generation, count }));
  }, [familyMembers, familyMarriages]);

  return {
    generationCount,
    generationStats: getGenerationStats
  };
};