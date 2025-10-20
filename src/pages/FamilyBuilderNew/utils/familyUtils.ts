import { Member, Marriage } from "../types/family.types";

export const calculateGenerations = (members: Member[], marriages: Marriage[]): number => {
  if (members.length === 0) return 1;
  
  const generationMap = new Map<string, number>();

  // Find founder and assign generation 1
  const founder = members.find(member => member.is_founder);
  if (founder) {
    generationMap.set(founder.id, 1);

    // Assign generation 1 to founder's spouse(s)
    marriages.forEach(marriage => {
      if (marriage.husband_id === founder.id && marriage.wife_id) {
        generationMap.set(marriage.wife_id, 1);
      } else if (marriage.wife_id === founder.id && marriage.husband_id) {
        generationMap.set(marriage.husband_id, 1);
      }
    });
  }

  // Iteratively assign generations based on parent-child relationships
  let changed = true;
  let iterations = 0;
  const maxIterations = 10;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    members.forEach(member => {
      if (generationMap.has(member.id)) return;

      const fatherGeneration = member.father_id ? generationMap.get(member.father_id) : null;
      const motherGeneration = member.mother_id ? generationMap.get(member.mother_id) : null;

      if (fatherGeneration !== undefined || motherGeneration !== undefined) {
        const parentGeneration = Math.max(fatherGeneration || 0, motherGeneration || 0);
        const childGeneration = parentGeneration + 1;
        generationMap.set(member.id, childGeneration);
        changed = true;

        // Assign same generation to spouse(s)
        marriages.forEach(marriage => {
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

  // Assign generation 1 to members without parents
  members.forEach(member => {
    if (!generationMap.has(member.id) && !member.father_id && !member.mother_id) {
      generationMap.set(member.id, 1);
    }
  });

  const maxGeneration = Math.max(...Array.from(generationMap.values()), 1);
  return maxGeneration;
};

export const getGenerationForMember = (
  member: Member, 
  members: Member[], 
  marriages: Marriage[]
): number => {
  const generationMap = new Map<string, number>();

  // Same logic as calculateGenerations but returns specific member's generation
  const founder = members.find(m => m.is_founder);
  if (founder) {
    generationMap.set(founder.id, 1);
  }

  let changed = true;
  let iterations = 0;
  const maxIterations = 10;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    members.forEach(m => {
      if (generationMap.has(m.id)) return;

      const fatherGen = m.father_id ? generationMap.get(m.father_id) : null;
      const motherGen = m.mother_id ? generationMap.get(m.mother_id) : null;

      if (fatherGen !== undefined || motherGen !== undefined) {
        const parentGen = Math.max(fatherGen || 0, motherGen || 0);
        generationMap.set(m.id, parentGen + 1);
        changed = true;
      }
    });
  }

  members.forEach(m => {
    if (!generationMap.has(m.id) && !m.father_id && !m.mother_id) {
      generationMap.set(m.id, 1);
    }
  });

  return generationMap.get(member.id) || 1;
};

export const getMemberDisplayName = (member: Member): string => {
  if (member.name) return member.name;
  if (member.first_name && member.last_name) {
    return `${member.first_name} ${member.last_name}`;
  }
  return member.first_name || member.last_name || "بدون اسم";
};

export const getGenerationStats = (members: Member[], marriages: Marriage[]) => {
  const generationMap = new Map<string, number>();

  members.forEach(member => {
    if (member.is_founder || (!member.father_id && !member.mother_id)) {
      generationMap.set(member.id, 1);
    }
  });

  let changed = true;
  let maxIterations = members.length * 2;
  let iterations = 0;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    members.forEach(member => {
      if (generationMap.has(member.id)) return;
      
      if (!member.father_id && !member.mother_id) {
        generationMap.set(member.id, 1);
        changed = true;
        return;
      }

      const fatherGeneration = member.father_id ? generationMap.get(member.father_id) : null;
      const motherGeneration = member.mother_id ? generationMap.get(member.mother_id) : null;

      if (fatherGeneration !== undefined || motherGeneration !== undefined) {
        const parentGeneration = Math.max(fatherGeneration || 0, motherGeneration || 0);
        generationMap.set(member.id, parentGeneration + 1);
        changed = true;
      }
    });
  }

  const generationCounts = new Map<number, number>();
  generationMap.forEach(generation => {
    generationCounts.set(generation, (generationCounts.get(generation) || 0) + 1);
  });

  return Array.from(generationCounts.entries()).sort((a, b) => a[0] - b[0]);
};