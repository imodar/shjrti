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
  // Generate family tree structure
  const familyUnits = useMemo(() => {
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

    // Assign generations based on parent-child relationships
    const assignGenerations = () => {
      const foundersUnits: string[] = [];
      
      units.forEach((unit, unitId) => {
        const hasParent = unit.members.some((m: any) => m.father_id || m.mother_id);
        if (!hasParent) {
          foundersUnits.push(unitId);
          unit.generation = 0;
        }
      });

      // BFS to assign generations
      const queue = [...foundersUnits];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const currentUnitId = queue.shift()!;
        if (visited.has(currentUnitId)) continue;
        visited.add(currentUnitId);

        const currentUnit = units.get(currentUnitId);
        if (!currentUnit) continue;

        // Find children
        familyMembers.forEach((member: any) => {
          const memberParents = currentUnit.members.map((m: any) => m.id);
          
          if (memberParents.includes(member.father_id) || memberParents.includes(member.mother_id)) {
            // Find unit containing this child
            units.forEach((childUnit, childUnitId) => {
              if (childUnit.members.some((m: any) => m.id === member.id)) {
                childUnit.generation = currentUnit.generation + 1;
                childUnit.parentUnitId = currentUnitId;
                currentUnit.childUnits.push(childUnitId);
                queue.push(childUnitId);
              }
            });
          }
        });
      }
    };

    assignGenerations();
    return units;
  }, [familyMembers, familyMarriages]);

  return (
    <div className="space-y-4">
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
        <div 
          className="transition-transform duration-300 ease-in-out origin-top-left"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <OrganizationalChart
            familyUnits={familyUnits}
            zoomLevel={zoomLevel}
            isPublicView={true}
            onSuggestEdit={onSuggestEdit}
            marriages={familyMarriages}
            members={familyMembers}
          />
        </div>
      </div>

      {familyMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد أعضاء في شجرة العائلة بعد</p>
        </div>
      )}
    </div>
  );
};
