import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Maximize } from "lucide-react";
import { OrganizationalChart } from "@/components/OrganizationalChart";

interface FamilyUnit {
  id: string;
  type: 'married' | 'single';
  members: any[];
  generation: number;
  parentUnitId?: string;
  childUnits: string[];
}

interface TreeViewProps {
  familyMembers: any[];
  familyMarriages: any[];
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSuggestEdit?: (memberId: string, memberName: string) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({
  familyMembers,
  familyMarriages,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSuggestEdit
}) => {
  console.log('[TreeView] Rendering with:', {
    membersCount: familyMembers.length,
    marriagesCount: familyMarriages.length
  });

  // Generate family tree structure
  const familyUnits = useMemo(() => {
    console.log('[TreeView] Creating familyUnits from:', {
      members: familyMembers.length,
      marriages: familyMarriages.length
    });
    
    const units = new Map<string, FamilyUnit>();

    // Create units for married couples
    familyMarriages.forEach((marriage: any) => {
      const husband = familyMembers.find((m: any) => m.id === marriage.husband_id);
      const wife = familyMembers.find((m: any) => m.id === marriage.wife_id);

      if (husband && wife) {
        const unitId = `marriage-${marriage.id}`;
        units.set(unitId, {
          id: unitId,
          type: 'married',
          members: [husband, wife],
          generation: 0,
          childUnits: []
        });
      }
    });

    // Create units for single members (not in any marriage)
    familyMembers.forEach((member: any) => {
      const isInMarriage = familyMarriages.some(
        (m: any) => m.husband_id === member.id || m.wife_id === member.id
      );

      if (!isInMarriage) {
        const unitId = `single-${member.id}`;
        units.set(unitId, {
          id: unitId,
          type: 'single',
          members: [member],
          generation: 0,
          childUnits: []
        });
      }
    });

    // Clean invalid links
    units.forEach((u) => {
      u.childUnits = Array.from(new Set(u.childUnits.filter((cid) => units.has(cid))));
      if (u.parentUnitId && !units.has(u.parentUnitId)) {
        u.parentUnitId = undefined;
      }
      u.generation = 0;
    });

    // Recompute generations with BFS - identify true roots
    const roots: string[] = [];
    units.forEach((u, id) => {
      // Check if this unit contains a founder - founders are ALWAYS roots
      const hasFounder = u.members.some((m: any) => m.is_founder);
      if (hasFounder) {
        roots.push(id);
        console.log('[TreeView] Founder unit identified as root:', u.members.map((m: any) => m.name).join(' & '));
        return;
      }
      
      // A unit is a root if BOTH parents of ALL members are either null or not in any unit
      const isRoot = u.members.every((m: any) => {
        const fatherId = m.father_id;
        const motherId = m.mother_id;
        
        // If both parents are null, this is definitely a root
        if (!fatherId && !motherId) return true;
        
        // Check if either parent exists in ANY unit
        let fatherInUnits = false;
        let motherInUnits = false;
        
        units.forEach((cand) => {
          if (fatherId && cand.members.some((x) => x.id === fatherId)) {
            fatherInUnits = true;
          }
          if (motherId && cand.members.some((x) => x.id === motherId)) {
            motherInUnits = true;
          }
        });
        
        // If either parent exists in units, this member has parents in the tree
        if (fatherInUnits || motherInUnits) return false;
        
        // If we reach here, both parents are either null or not in the tree
        return true;
      });
      
      if (isRoot) {
        roots.push(id);
        console.log('[TreeView] Identified root unit:', id, 'with members:', u.members.map((m: any) => m.name));
      }
    });

    const q: Array<{ id: string; gen: number }> = roots.map((id) => ({ id, gen: 1 }));
    const seen = new Set<string>();

    while (q.length) {
      const { id, gen } = q.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const u = units.get(id);
      if (!u) continue;
      u.generation = gen;

      // find children by checking if u.members contains the father/mother of a member
      familyMembers.forEach((member: any) => {
        const parentIds = u.members.map((mm: any) => mm.id);
        if (parentIds.includes(member.father_id) || parentIds.includes(member.mother_id)) {
          // locate child's unit
          units.forEach((childUnit, childId) => {
            if (childUnit.members.some((mm: any) => mm.id === member.id)) {
              // Protect founder units from being assigned parents
              const isFounderChild = childUnit.members.some((m: any) => m.is_founder);
              if (!isFounderChild && childId !== id) {
                childUnit.parentUnitId = id;
                childUnit.generation = gen + 1;
                if (!u.childUnits.includes(childId)) u.childUnits.push(childId);
                q.push({ id: childId, gen: gen + 1 });
              }
            }
          });
        }
      });
    }

    // Ensure we have at least one root
    let rootCount = 0;
    units.forEach((u) => { if (!u.parentUnitId) rootCount++; });
    if (rootCount === 0) {
      // force roots by clearing parent on minimal generation units
      let minGen = Infinity;
      units.forEach((u) => { minGen = Math.min(minGen, u.generation); });
      units.forEach((u) => { if (u.generation === minGen) u.parentUnitId = undefined; });
    }

    console.log('[TreeView] familyUnits created:', units.size, 'units');
    console.log('[TreeView] Root units identified:', roots.length, 'roots');
    
    // Additional diagnostic: show generations distribution
    const genDistribution: { [gen: number]: number } = {};
    units.forEach((u) => {
      genDistribution[u.generation] = (genDistribution[u.generation] || 0) + 1;
    });
    console.log('[TreeView] Generation distribution:', genDistribution);
    
    return units;
  }, [familyMembers, familyMarriages]);

  console.log('[TreeView] About to render OrganizationalChart with familyUnits.size =', familyUnits.size);

  return (
    <div className="space-y-4">
      {/* Debug Panel */}
      <div className="bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-600 rounded-lg p-4 text-sm">
        <p className="font-bold mb-2">🔍 معلومات التصحيح:</p>
        <p>عدد الأعضاء: {familyMembers.length}</p>
        <p>عدد الزيجات: {familyMarriages.length}</p>
        <p>عدد الوحدات المُنشأة: {familyUnits.size}</p>
        <p>حالة الرسم: {familyUnits.size > 0 ? '✅ جاهز للعرض' : '❌ لا توجد وحدات'}</p>
      </div>

      {/* Zoom Controls */}
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
          className="bg-white/80 hover:bg-white"
        >
          <ZoomIn className="h-4 w-4 ml-2" />
          تكبير
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
          className="bg-white/80 hover:bg-white"
        >
          <ZoomOut className="h-4 w-4 ml-2" />
          تصغير
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetZoom}
          className="bg-white/80 hover:bg-white"
        >
          <RotateCcw className="h-4 w-4 ml-2" />
          إعادة تعيين
        </Button>
      </div>

      {/* Tree Chart */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 overflow-hidden">
        <OrganizationalChart
          familyUnits={familyUnits}
          zoomLevel={zoomLevel}
          isPublicView={true}
          onSuggestEdit={onSuggestEdit}
          marriages={familyMarriages}
          members={familyMembers}
        />
      </div>

      {familyMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد أعضاء في شجرة العائلة بعد</p>
        </div>
      )}
    </div>
  );
};
