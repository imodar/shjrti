import { useMemo } from 'react';

interface FamilyMember {
  id: string;
  fatherId?: string;
  motherId?: string;
  isFounder?: boolean;
}

interface Marriage {
  husband?: { id: string };
  wife?: { id: string };
}

export const useGenerationStats = (familyMembers: FamilyMember[], familyMarriages: Marriage[]) => {
  const generationMap = useMemo(() => {
    if (familyMembers.length === 0) return new Map();
    
    const map = new Map();
    
    // Start with founders as generation 1
    familyMembers.forEach(member => {
      if (member.isFounder || (!member.fatherId && !member.motherId)) {
        map.set(member.id, 1);
      }
    });
    
    // Assign generations based on parent-child relationships
    let changed = true;
    let maxIterations = 50;
    let iterations = 0;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (!map.has(member.id)) {
          if (member.fatherId || member.motherId) {
            const fatherGeneration = member.fatherId ? map.get(member.fatherId) : undefined;
            const motherGeneration = member.motherId ? map.get(member.motherId) : undefined;
            
            if (fatherGeneration !== undefined || motherGeneration !== undefined) {
              const parentGeneration = Math.max(fatherGeneration || 0, motherGeneration || 0);
              map.set(member.id, parentGeneration + 1);
              changed = true;
            }
          } else {
            map.set(member.id, 1);
            changed = true;
          }
        }
      });
    }
    
    // Assign spouses to same generation
    familyMarriages.forEach(marriage => {
      const husbandGeneration = map.get(marriage.husband?.id);
      const wifeGeneration = map.get(marriage.wife?.id);
      
      if (husbandGeneration && !wifeGeneration) {
        map.set(marriage.wife?.id, husbandGeneration);
      } else if (wifeGeneration && !husbandGeneration) {
        map.set(marriage.husband?.id, wifeGeneration);
      }
    });
    
    return map;
  }, [familyMembers, familyMarriages]);

  const generationCount = useMemo(() => {
    const generations = Array.from(generationMap.values());
    return generations.length > 0 ? Math.max(...generations) : 1;
  }, [generationMap]);

  const generationStats = useMemo(() => {
    const generationCounts = new Map();
    generationMap.forEach((generation) => {
      generationCounts.set(generation, (generationCounts.get(generation) || 0) + 1);
    });
    
    return Array.from(generationCounts.entries()).sort((a, b) => a[0] - b[0]);
  }, [generationMap]);

  return {
    generationMap,
    generationCount,
    generationStats
  };
};