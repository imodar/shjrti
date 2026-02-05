import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Member, Marriage } from '@/types/family.types';
import { StitchFamilyCard } from './FamilyCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface StitchTreeCanvasProps {
  familyMembers: Member[];
  marriages: Marriage[];
  zoomLevel: number;
  viewMode: 'vertical' | 'horizontal' | 'radial';
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  selectedRootMarriage?: string;
}

interface FamilyUnit {
  id: string;
  type: 'married' | 'single' | 'polygamy';
  husband?: Member;
  wives: Member[];
  children: Member[];
  isFounder: boolean;
  generation: number;
  parentUnitId?: string;
  childUnits: string[];
  // For root selection by specific marriage
  marriageIds?: string[];
}

interface Position {
  x: number;
  y: number;
  width: number;
}

const UNIT_WIDTH = 420;
const UNIT_HEIGHT_SINGLE = 160;
const UNIT_HEIGHT_MARRIED = 160;
const UNIT_HEIGHT_POLYGAMY = 280;
const VERTICAL_SPACING = 100;
const HORIZONTAL_SPACING = 40;

export const StitchTreeCanvas: React.FC<StitchTreeCanvasProps> = ({
  familyMembers,
  marriages,
  zoomLevel,
  viewMode,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  selectedRootMarriage = 'all'
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rootCenter, setRootCenter] = useState({ x: 0, y: 0 });
  const hasCenteredOnce = useRef(false);
  const lastRootIdRef = useRef<string>('');
  const prevSelectedRootRef = useRef<string>(selectedRootMarriage);
  const lastCenterKeyRef = useRef<string>('');

  // Get height based on unit type
  const getUnitHeight = (unit: FamilyUnit): number => {
    if (unit.type === 'polygamy') return UNIT_HEIGHT_POLYGAMY;
    if (unit.type === 'married') return UNIT_HEIGHT_MARRIED;
    return UNIT_HEIGHT_SINGLE;
  };

  // Build family units from members and marriages (same logic as OrganizationalChart)
  const familyUnits = useMemo(() => {
    const units = new Map<string, FamilyUnit>();
    const processedMemberIds = new Set<string>();

    // Group marriages by husband to detect polygamy and create units
    const marriagesByHusband = new Map<string, { marriages: Marriage[], marriageIds: string[] }>();
    marriages.forEach(m => {
      const existing = marriagesByHusband.get(m.husband_id) || { marriages: [], marriageIds: [] };
      existing.marriages.push(m);
      existing.marriageIds.push(m.id);
      marriagesByHusband.set(m.husband_id, existing);
    });

    // Process marriages - use FIRST marriage ID as the unit ID for consistency
    marriagesByHusband.forEach((data, husbandId) => {
      const husband = familyMembers.find(m => m.id === husbandId);
      if (!husband) return;

      const wives = data.marriages
        .map(m => familyMembers.find(mem => mem.id === m.wife_id))
        .filter(Boolean) as Member[];

      const isFounder = husband.is_founder;
      const type = wives.length > 1 ? 'polygamy' : 'married';
      
      // Use first marriage ID as unit ID (matches how FamilyTreeView works)
      const primaryMarriageId = data.marriageIds[0];
      const unitId = `married_${primaryMarriageId}`;

      units.set(unitId, {
        id: unitId,
        type,
        husband,
        wives,
        children: [],
        isFounder: isFounder || false,
        generation: 0,
        childUnits: [],
        marriageIds: data.marriageIds
      });

      processedMemberIds.add(husbandId);
      wives.forEach(w => processedMemberIds.add(w.id));
    });

    // Add unmarried members as single units
    familyMembers.forEach(member => {
      if (!processedMemberIds.has(member.id)) {
        const unitId = `single_${member.id}`;
        units.set(unitId, {
          id: unitId,
          type: 'single',
          husband: member.gender === 'male' ? member : undefined,
          wives: member.gender === 'female' ? [member] : [],
          children: [],
          isFounder: member.is_founder || false,
          generation: 0,
          childUnits: [],
          marriageIds: []
        });
      }
    });

    // Establish parent-child relationships
    units.forEach((unit, unitId) => {
      const isFounderUnit = (unit.husband?.is_founder) || unit.wives.some(w => w.is_founder);
      if (isFounderUnit) return;

      // Already has a parent assigned? Skip
      if (unit.parentUnitId) return;

      const members = unit.husband ? [unit.husband, ...unit.wives] : [...unit.wives];
      
      // Find parent unit - stop once found
      let foundParent = false;
      for (const member of members) {
        if (foundParent) break;
        
        if (member.father_id || member.mother_id) {
          for (const [potentialParentId, potentialParent] of units.entries()) {
            if (potentialParentId === unitId) continue;

            const parentMemberIds = new Set<string>();
            if (potentialParent.husband) parentMemberIds.add(potentialParent.husband.id);
            potentialParent.wives.forEach(w => parentMemberIds.add(w.id));

            const hasFather = member.father_id && parentMemberIds.has(member.father_id);
            const hasMother = member.mother_id && parentMemberIds.has(member.mother_id);

            let isValidParent = false;
            if (member.father_id && member.mother_id) {
              isValidParent = !!(hasFather && hasMother);
            } else if (member.father_id || member.mother_id) {
              isValidParent = !!(hasFather || hasMother);
            }

            if (isValidParent) {
              unit.parentUnitId = potentialParentId;
              if (!potentialParent.childUnits.includes(unitId)) {
                potentialParent.childUnits.push(unitId);
              }
              foundParent = true;
              break;
            }
          }
        }
      }
    });

    // Assign generations using BFS from root units
    const rootUnitIds: string[] = [];
    units.forEach((unit, unitId) => {
      if (!unit.parentUnitId) {
        rootUnitIds.push(unitId);
        unit.generation = 1;
      }
    });

    const queue: Array<{ id: string; gen: number }> = rootUnitIds.map(id => ({ id, gen: 1 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, gen } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const unit = units.get(id);
      if (!unit) continue;

      unit.generation = gen;

      unit.childUnits.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({ id: childId, gen: gen + 1 });
        }
      });
    }

    return units;
  }, [familyMembers, marriages, selectedRootMarriage]);

  // Filter units based on selected root marriage
  const filteredFamilyUnits = useMemo(() => {
    if (selectedRootMarriage === 'all') {
      return familyUnits;
    }

    // Find the unit that corresponds to this marriageId
    const rootUnit = Array.from(familyUnits.values()).find(u => (u.marriageIds || []).includes(selectedRootMarriage));
    if (!rootUnit) return familyUnits; // Fallback to all if not found

    const rootUnitId = rootUnit.id;

    const filteredUnits = new Map<string, FamilyUnit>();
    
    // Collect descendants recursively
    const collectDescendants = (unitId: string, visited = new Set<string>()) => {
      if (visited.has(unitId)) return;
      visited.add(unitId);
      
      const unit = familyUnits.get(unitId);
      if (unit) {
        // Clone unit to avoid mutation
        filteredUnits.set(unitId, { ...unit, childUnits: [...unit.childUnits] });
        unit.childUnits.forEach(childId => collectDescendants(childId, visited));
      }
    };
    
    collectDescendants(rootUnitId);
    
    // Clean up parent/child references
    filteredUnits.forEach((unit) => {
      if (unit.parentUnitId && !filteredUnits.has(unit.parentUnitId)) {
        unit.parentUnitId = undefined;
      }
      unit.childUnits = unit.childUnits.filter(id => filteredUnits.has(id));
    });

    // Recompute generations from selected root
    filteredUnits.forEach(u => { u.generation = 0; });
    if (filteredUnits.has(rootUnitId)) {
      const q: Array<{ id: string; gen: number }> = [{ id: rootUnitId, gen: 1 }];
      const seen = new Set<string>();
      while (q.length) {
        const { id, gen } = q.shift()!;
        if (seen.has(id)) continue;
        seen.add(id);
        const u = filteredUnits.get(id);
        if (!u) continue;
        u.generation = gen;
        u.childUnits.forEach(cid => { 
          if (filteredUnits.has(cid)) q.push({ id: cid, gen: gen + 1 }); 
        });
      }
    }

    return filteredUnits;
  }, [familyUnits, selectedRootMarriage]);

  // Get root units (no parent)
  const rootUnits = useMemo(() => {
    return Array.from(filteredFamilyUnits.values()).filter(u => !u.parentUnitId);
  }, [filteredFamilyUnits]);

  // Calculate positions using centered tree layout (same as OrganizationalChart)
  const positions = useMemo((): Map<string, Position> => {
    const positionsMap = new Map<string, Position>();
    if (rootUnits.length === 0) return positionsMap;

    // Calculate max height per generation for proper vertical spacing
    const maxHeightPerGeneration = new Map<number, number>();
    filteredFamilyUnits.forEach(unit => {
      const height = getUnitHeight(unit);
      const currentMax = maxHeightPerGeneration.get(unit.generation) || 0;
      if (height > currentMax) {
        maxHeightPerGeneration.set(unit.generation, height);
      }
    });

    // Calculate cumulative Y offset per generation
    const generationYOffset = new Map<number, number>();
    let cumulativeY = 0;
    const maxGen = Math.max(...Array.from(filteredFamilyUnits.values()).map(u => u.generation));
    for (let gen = 1; gen <= maxGen; gen++) {
      generationYOffset.set(gen, cumulativeY);
      const genHeight = maxHeightPerGeneration.get(gen) || UNIT_HEIGHT_MARRIED;
      cumulativeY += genHeight + VERTICAL_SPACING;
    }

    const calculateSubtreeWidth = (unitId: string, memo: Map<string, number>): number => {
      if (memo.has(unitId)) return memo.get(unitId)!;

      const unit = filteredFamilyUnits.get(unitId);
      if (!unit) return UNIT_WIDTH;

      if (unit.childUnits.length === 0) {
        memo.set(unitId, UNIT_WIDTH);
        return UNIT_WIDTH;
      }

      let totalWidth = 0;
      unit.childUnits.forEach((childId, index) => {
        const childWidth = calculateSubtreeWidth(childId, memo);
        totalWidth += childWidth;
        if (index < unit.childUnits.length - 1) {
          totalWidth += HORIZONTAL_SPACING;
        }
      });

      const width = Math.max(UNIT_WIDTH, totalWidth);
      memo.set(unitId, width);
      return width;
    };

    const subtreeWidths = new Map<string, number>();
    rootUnits.forEach(root => {
      calculateSubtreeWidth(root.id, subtreeWidths);
    });

    const positionUnit = (unitId: string, startX: number, generation: number): void => {
      const unit = filteredFamilyUnits.get(unitId);
      if (!unit) return;

      const y = generationYOffset.get(generation) || 0;

      if (unit.childUnits.length === 0) {
        positionsMap.set(unitId, { x: startX, y, width: UNIT_WIDTH });
        return;
      }

      let currentX = startX;
      const childCenters: number[] = [];

      unit.childUnits.forEach((childId) => {
        const childWidth = subtreeWidths.get(childId) || UNIT_WIDTH;
        positionUnit(childId, currentX, generation + 1);

        const childActualPosition = positionsMap.get(childId);
        if (childActualPosition) {
          const childCenter = childActualPosition.x + UNIT_WIDTH / 2;
          childCenters.push(childCenter);
        }

        currentX += childWidth + HORIZONTAL_SPACING;
      });

      const leftmostChild = childCenters[0];
      const rightmostChild = childCenters[childCenters.length - 1];
      const childrenCenter = (leftmostChild + rightmostChild) / 2;
      const parentX = childrenCenter - UNIT_WIDTH / 2;

      positionsMap.set(unitId, { x: parentX, y, width: UNIT_WIDTH });
    };

    let currentRootX = 0;
    rootUnits.forEach((root) => {
      positionUnit(root.id, currentRootX, root.generation);
      const rootWidth = subtreeWidths.get(root.id) || UNIT_WIDTH;
      currentRootX += rootWidth + HORIZONTAL_SPACING * 3;
    });

    return positionsMap;
  }, [familyUnits, rootUnits]);

  // Calculate tree dimensions
  const treeDimensions = useMemo(() => {
    if (positions.size === 0) return { width: 1000, height: 1000 };

    let maxX = 0;
    let maxY = 0;

    positions.forEach((pos) => {
      maxX = Math.max(maxX, pos.x + UNIT_WIDTH + 100);
      maxY = Math.max(maxY, pos.y + UNIT_HEIGHT_POLYGAMY);
    });

    return {
      width: maxX + HORIZONTAL_SPACING * 2,
      height: maxY + VERTICAL_SPACING * 2
    };
  }, [positions]);

  // Center on root unit (accounts for zoom)
  useEffect(() => {
    if (rootUnits.length === 0 || positions.size === 0 || !containerRef.current) return;

    const currentRootId = rootUnits[0].id;
    const rootPosition = positions.get(currentRootId);
    if (!rootPosition) return;

    // If selectedRootMarriage changes but points to the same unit (polygamy alias),
    // we still must re-center.
    const centerKey = `${currentRootId}:${selectedRootMarriage}`;
    const keyChanged = lastCenterKeyRef.current !== centerKey;

    const rootChanged = lastRootIdRef.current !== currentRootId;
    const shouldCenter = keyChanged || rootChanged || !hasCenteredOnce.current;

    if (!shouldCenter) return;

    lastRootIdRef.current = currentRootId;
    lastCenterKeyRef.current = centerKey;
    hasCenteredOnce.current = true;

    const containerWidth = containerRef.current.clientWidth || 1200;
    const containerHeight = containerRef.current.clientHeight || 800;
    const rootCenterX = rootPosition.x + UNIT_WIDTH / 2;
    const rootUnit = rootUnits[0];
    const rootHeight = rootUnit ? getUnitHeight(rootUnit) : UNIT_HEIGHT_MARRIED;
    const rootCenterY = rootPosition.y + rootHeight / 2;

    setRootCenter({ x: rootCenterX, y: rootCenterY });
    setPanOffset({
      // NOTE: We scale around `transformOrigin` = rootCenter, so the root point
      // does NOT move with zoom. Centering should therefore be independent of zoom.
      x: containerWidth / 2 - rootCenterX,
      y: containerHeight / 3 - rootCenterY  // Position root at upper third of screen
    });
  }, [positions, rootUnits, selectedRootMarriage]);

  // Reset centering when root selection changes
  useEffect(() => {
    // Only trigger when root actually changes (not on initial mount)
    if (prevSelectedRootRef.current === selectedRootMarriage) return;
    prevSelectedRootRef.current = selectedRootMarriage;
    
    hasCenteredOnce.current = false;
    lastRootIdRef.current = '';
    // Reset zoom to default when changing root
    onResetZoom();
  }, [selectedRootMarriage, onResetZoom]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Render connection lines
  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    const primaryColor = 'hsl(var(--primary))';

    filteredFamilyUnits.forEach(parentUnit => {
      const children = parentUnit.childUnits
        .map(id => filteredFamilyUnits.get(id))
        .filter(Boolean) as FamilyUnit[];

      if (children.length === 0) return;

      const parentPos = positions.get(parentUnit.id);
      if (!parentPos) return;

      const parentHeight = getUnitHeight(parentUnit);
      const parentCenterX = parentPos.x + UNIT_WIDTH / 2;
      const parentBottomY = parentPos.y + parentHeight;

      if (children.length === 1) {
        const child = children[0];
        const childPos = positions.get(child.id);
        if (!childPos) return;

        const childCenterX = childPos.x + UNIT_WIDTH / 2;
        const childTopY = childPos.y;

        connections.push(
          <g key={`connection-${parentUnit.id}-${child.id}`}>
            <line x1={parentCenterX} y1={parentBottomY} x2={parentCenterX} y2={parentBottomY + VERTICAL_SPACING / 3} stroke={primaryColor} strokeWidth="3" />
            <line x1={parentCenterX} y1={parentBottomY + VERTICAL_SPACING / 3} x2={childCenterX} y2={parentBottomY + VERTICAL_SPACING / 3} stroke={primaryColor} strokeWidth="3" />
            <line x1={childCenterX} y1={parentBottomY + VERTICAL_SPACING / 3} x2={childCenterX} y2={childTopY} stroke={primaryColor} strokeWidth="3" />
          </g>
        );
      } else {
        const childPositions = children.map(child => positions.get(child.id)).filter(Boolean) as Position[];
        const leftmostX = Math.min(...childPositions.map(pos => pos.x + UNIT_WIDTH / 2));
        const rightmostX = Math.max(...childPositions.map(pos => pos.x + UNIT_WIDTH / 2));
        const distributionY = parentBottomY + VERTICAL_SPACING / 2;

        connections.push(
          <g key={`connection-group-${parentUnit.id}`}>
            <line x1={parentCenterX} y1={parentBottomY} x2={parentCenterX} y2={distributionY} stroke={primaryColor} strokeWidth="3" />
            <line x1={leftmostX} y1={distributionY} x2={rightmostX} y2={distributionY} stroke={primaryColor} strokeWidth="3" />
            {children.map(child => {
              const childPos = positions.get(child.id);
              if (!childPos) return null;
              const childCenterX = childPos.x + UNIT_WIDTH / 2;
              return (
                <line key={`child-line-${child.id}`} x1={childCenterX} y1={distributionY} x2={childCenterX} y2={childPos.y} stroke={primaryColor} strokeWidth="3" />
              );
            })}
          </g>
        );
      }
    });

    return connections;
  };

  return (
    <main className="relative h-[calc(100vh-120px)] overflow-hidden tree-canvas-bg">
      {/* Zoom Controls */}
      <div className="absolute bottom-8 right-8 rtl:right-auto rtl:left-8 z-40 flex flex-col gap-3">
        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
          <button onClick={onZoomIn} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <span className="material-icons-round">add</span>
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2"></div>
          <button onClick={onZoomOut} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <span className="material-icons-round">remove</span>
          </button>
        </div>
        <button onClick={onResetZoom} className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
          <span className="material-icons-round">filter_center_focus</span>
        </button>
      </div>

      {/* Tree Container with Pan/Zoom */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute"
          style={{
            top: 0,
            left: 0,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: `${rootCenter.x}px ${rootCenter.y}px`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {/* SVG for connection lines */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={treeDimensions.width}
            height={treeDimensions.height}
          >
            {renderConnections()}
          </svg>

          {/* Render all family units */}
          {Array.from(filteredFamilyUnits.values()).map(unit => {
            const position = positions.get(unit.id);
            if (!position) return null;
            return (
              <div
                key={unit.id}
                className="absolute"
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  width: `${UNIT_WIDTH}px`
                }}
              >
                <StitchFamilyCard unit={unit} familyMembers={familyMembers} />
              </div>
            );
          })}

          {/* Empty State */}
          {familyMembers.length === 0 && (
            <div className="text-center py-20" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-icons-round text-5xl text-primary">account_tree</span>
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                {t('tree_view.no_members', 'No family members yet')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {t('tree_view.start_adding', 'Start by adding the founder of your family tree')}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .tree-canvas-bg {
          background-image: radial-gradient(circle, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </main>
  );
};