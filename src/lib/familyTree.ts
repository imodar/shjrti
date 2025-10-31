// Shared utilities for building and normalizing family tree units used by both public and private tree views
// Keep logic aligned with FamilyTreeView.tsx to avoid divergence

export interface FamilyUnit {
  id: string;
  type: 'married' | 'single';
  members: any[]; // Keep 'any' for compatibility with existing code
  generation: number;
  parentUnitId?: string;
  childUnits: string[];
}

// Create units from raw members and marriages
export function createFamilyUnitsFromData(
  familyMembers: any[],
  familyMarriages: any[]
): Map<string, FamilyUnit> {
  const units = new Map<string, FamilyUnit>();
  const processedMembers = new Set<string>();

  // Married units
  familyMarriages.forEach((marriage) => {
    if (marriage.is_active !== false) {
      const husband = familyMembers.find((m) => m.id === marriage.husband_id);
      const wife = familyMembers.find((m) => m.id === marriage.wife_id);
      if (husband && wife) {
        const unitId = `married_${marriage.id}`;
        units.set(unitId, {
          id: unitId,
          type: 'married',
          members: [husband, wife],
          generation: 0,
          childUnits: [],
        });
        processedMembers.add(husband.id);
        processedMembers.add(wife.id);
      }
    }
  });

  // Single units
  familyMembers.forEach((member) => {
    if (!processedMembers.has(member.id)) {
      const unitId = `single_${member.id}`;
      units.set(unitId, {
        id: unitId,
        type: 'single',
        members: [member],
        generation: 0,
        childUnits: [],
      });
    }
  });

  return units;
}

function getUnitByMemberId(memberId: string, units: Map<string, FamilyUnit>): FamilyUnit | undefined {
  for (const unit of units.values()) {
    if (unit.members.some((m) => m.id === memberId)) return unit;
  }
  return undefined;
}

// Establish parent-child relationships and propagate generations
export function assignGenerationsToUnits(units: Map<string, FamilyUnit>) {
  // Founder units (explicit is_founder flag)
  units.forEach((unit) => {
    if (unit.members.some((m: any) => m.is_founder)) {
      unit.generation = 1;
    }
  });

  // Build parent-child links
  units.forEach((unit, unitId) => {
    unit.members.forEach((member: any) => {
      const fatherId = member.father_id;
      const motherId = member.mother_id;
      if (fatherId || motherId) {
        const parentUnit = fatherId
          ? getUnitByMemberId(fatherId, units)
          : motherId
          ? getUnitByMemberId(motherId, units)
          : undefined;
        if (parentUnit && parentUnit.id !== unitId) {
          unit.parentUnitId = parentUnit.id;
          if (!parentUnit.childUnits.includes(unitId)) parentUnit.childUnits.push(unitId);
        }
      }
    });
  });

  // Propagate generations from parents to children
  let changed = true;
  let iterations = 0;
  const maxIterations = 20;
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    units.forEach((unit) => {
      if (unit.generation === 0 && unit.parentUnitId) {
        const parent = units.get(unit.parentUnitId);
        if (parent && parent.generation > 0) {
          unit.generation = parent.generation + 1;
          changed = true;
        }
      }
    });
  }
}

// Filter units to descendants of the selected root marriage and recompute generations from that root
export function filterUnitsByRootMarriage(
  units: Map<string, FamilyUnit>,
  familyMarriages: any[],
  selectedRootMarriage: string
): Map<string, FamilyUnit> {
  if (!selectedRootMarriage || selectedRootMarriage === 'all') return units;
  const rootMarriage = familyMarriages.find((m) => m.id === selectedRootMarriage);
  if (!rootMarriage) return units;

  const filtered = new Map<string, FamilyUnit>();
  const rootUnitId = `married_${rootMarriage.id}`;

  const collectDescendants = (unitId: string, visited = new Set<string>()) => {
    if (visited.has(unitId)) return;
    visited.add(unitId);
    const unit = units.get(unitId);
    if (!unit) return;
    filtered.set(unitId, unit);
    unit.childUnits.forEach((cid) => collectDescendants(cid, visited));
  };

  collectDescendants(rootUnitId);

  // Rebuild map and clean relationships to the subset
  const out = new Map<string, FamilyUnit>();
  filtered.forEach((unit, id) => out.set(id, unit));

  out.forEach((unit) => {
    if (unit.parentUnitId && !out.has(unit.parentUnitId)) unit.parentUnitId = undefined;
    unit.childUnits = unit.childUnits.filter((cid) => out.has(cid));
  });

  // Reset generations and BFS from root
  out.forEach((u) => (u.generation = 0));
  if (out.has(rootUnitId)) {
    const q: Array<{ id: string; gen: number }> = [{ id: rootUnitId, gen: 1 }];
    const seen = new Set<string>();
    while (q.length) {
      const { id, gen } = q.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const u = out.get(id);
      if (!u) continue;
      u.generation = gen;
      u.childUnits.forEach((cid) => out.has(cid) && q.push({ id: cid, gen: gen + 1 }));
    }
  }

  return out;
}

// Ensure there is at least one root with generation >= 1.
// If no generations exist, assign from roots (units without parents) or first unit as last resort.
export function ensureGenerations(
  units: Map<string, FamilyUnit>,
  familyMarriages: any[],
  selectedRootMarriage: string,
  familyMembers: any[]
) {
  let hasAnyGeneration = false;
  units.forEach((u) => {
    if (u.generation > 0) hasAnyGeneration = true;
  });

  if (!hasAnyGeneration) {
    // Determine roots: selected root marriage if provided, otherwise units without parents
    const roots: string[] = [];
    if (selectedRootMarriage && selectedRootMarriage !== 'all') {
      const rm = familyMarriages.find((m) => m.id === selectedRootMarriage);
      if (rm) roots.push(`married_${rm.id}`);
    }
    if (roots.length === 0) {
      units.forEach((u, id) => {
        if (!u.parentUnitId) roots.push(id);
      });
    }

    // Reset generations and BFS assign
    units.forEach((u) => (u.generation = 0));
    const queue: Array<{ id: string; gen: number }> = roots.map((id) => ({ id, gen: 1 }));
    const visited = new Set<string>();
    while (queue.length) {
      const { id, gen } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const u = units.get(id);
      if (!u) continue;
      u.generation = gen;
      u.childUnits.forEach((cid) => units.has(cid) && queue.push({ id: cid, gen: gen + 1 }));
    }
  }

  // Normalization: ensure at least one explicit root has generation >= 1
  const rootCandidates = Array.from(units.values()).filter((u) => !u.parentUnitId);
  if (rootCandidates.length > 0) {
    rootCandidates.forEach((u) => {
      if (u.generation < 1) u.generation = 1;
    });
  } else if (units.size > 0) {
    // Try to use members without known parents
    const noParentMembers = familyMembers.filter((m) => !m.father_id && !m.mother_id);
    if (noParentMembers.length > 0) {
      units.forEach((u) => {
        if (u.members.some((m) => noParentMembers.some((npm) => npm.id === m.id))) {
          u.generation = 1;
          u.parentUnitId = undefined;
        }
      });
    } else {
      // Last resort: pick unit(s) with minimal generation
      const gens = Array.from(units.values()).map((u) => u.generation);
      const minGen = gens.length ? Math.min(...gens) : 0;
      const minGenUnits = Array.from(units.values()).filter((u) => u.generation === minGen);
      if (minGenUnits.length > 0) {
        minGenUnits[0].generation = 1;
        minGenUnits[0].parentUnitId = undefined;
      }
    }
  }
}
