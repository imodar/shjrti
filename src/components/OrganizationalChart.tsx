import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, HeartCrack, Users, Crown, UserRound, Edit3 } from "lucide-react";
import { useResolvedImageUrl } from "@/utils/useResolvedImageUrl";

// Helper component to resolve member images with lazy loading
const MemberAvatar: React.FC<{
  member: any;
  size?: string;
  borderColor?: string;
  ringColor?: string;
  fallbackBg?: string;
  fallbackText?: string;
  textSize?: string;
}> = ({ member, size = "h-14 w-14", borderColor = "border-primary/30", ringColor = "ring-primary/10", fallbackBg = "from-primary/20 to-primary/30", fallbackText = "text-primary", textSize = "text-lg" }) => {
  const imageSrc = useResolvedImageUrl(member?.image_url || member?.image, true);
  
  return (
    <Avatar className={`${size} mx-auto border-2 ${borderColor} ring-2 ${ringColor}`}>
      {imageSrc ? (
        <AvatarImage src={imageSrc} alt={member?.name || ""} />
      ) : (
        <AvatarFallback className={`bg-gradient-to-br ${fallbackBg} ${fallbackText} font-semibold ${textSize}`}>
          {(member?.name || "؟").slice(0, 2)}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

interface FamilyUnit {
  id: string;
  type: 'married' | 'single';
  members: any[];
  generation: number;
  parentUnitId?: string;
  childUnits: string[];
}

interface OrganizationalChartProps {
  familyUnits: Map<string, FamilyUnit>;
  zoomLevel: number;
  isPublicView?: boolean;
  onSuggestEdit?: (memberId: string, memberName: string) => void;
  marriages?: any[];
  members?: any[];
}

interface Position {
  x: number;
  y: number;
  width: number;
}

export const OrganizationalChart: React.FC<OrganizationalChartProps> = ({
  familyUnits,
  zoomLevel,
  isPublicView = false,
  onSuggestEdit,
  marriages = [],
  members = []
}) => {
  const UNIT_WIDTH = 380;
  const UNIT_HEIGHT = 180;
  const VERTICAL_SPACING = 120;
  const HORIZONTAL_SPACING = 60;

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
  };

  // Touch event handlers for mobile dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - panOffset.x,
        y: touch.clientY - panOffset.y
      });
    }
  };

  // Use effect to handle document-level mouse and touch events when dragging
  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleDocumentMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        setIsDragging(false);
      }
    };

    const handleDocumentTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      setPanOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    };

    const handleDocumentTouchEnd = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
      document.addEventListener('touchend', handleDocumentTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, [isDragging, dragStart.x, dragStart.y]);

  // Merge married units with the same husband into a single box
  const mergeMarriedUnits = (units: Map<string, FamilyUnit>) => {
    const merged = new Map<string, any>();
    const originalToMerged = new Map<string, string>();

    units.forEach((unit) => {
      if (unit.type === 'married') {
        const husband = unit.members.find((m: any) => m?.gender === 'male');
        const wives = unit.members.filter((m: any) => m?.gender === 'female');
        const key = husband?.id ? `merged-${husband.id}` : unit.id;

        if (!merged.has(key)) {
          merged.set(key, {
            id: key,
            type: 'married',
            members: husband ? [husband, ...wives] : [...unit.members],
            generation: unit.generation,
            parentUnitId: unit.parentUnitId,
            childUnits: [...unit.childUnits],
            originalUnitIds: [unit.id],
            parentCandidates: [unit.parentUnitId],
          });
        } else {
          const mu = merged.get(key);
          const existingKeys = new Set((mu.members || []).map((m: any) => m?.id || m?.name));
          const addMember = (m: any) => {
            const mk = m?.id || m?.name;
            if (!existingKeys.has(mk)) {
              mu.members.push(m);
              existingKeys.add(mk);
            }
          };
          wives.forEach(addMember);
          if (husband && !mu.members.some((m: any) => (m?.id || m?.name) === (husband.id || husband.name))) {
            mu.members.unshift(husband);
          }
          mu.generation = Math.min(mu.generation, unit.generation);
          mu.parentCandidates.push(unit.parentUnitId);
          mu.childUnits = Array.from(new Set([...(mu.childUnits || []), ...unit.childUnits]));
          mu.originalUnitIds.push(unit.id);
        }
        originalToMerged.set(unit.id, key);
      } else {
        merged.set(unit.id, { ...unit, originalUnitIds: [unit.id], parentCandidates: [unit.parentUnitId] });
        originalToMerged.set(unit.id, unit.id);
      }
    });

    const mapId = (id?: string) => (id ? originalToMerged.get(id) || id : undefined);

    merged.forEach((mu: any) => {
      const parent = mu.parentCandidates.find((p: any) => p != null);
      mu.parentUnitId = mapId(parent);
      mu.childUnits = Array.from(new Set((mu.childUnits || []).map((cid: string) => mapId(cid)).filter(Boolean)));
      delete mu.parentCandidates;
    });

    return { displayUnits: merged as Map<string, FamilyUnit>, originalToMerged };
  };

  const { displayUnits } = mergeMarriedUnits(familyUnits);

  // Build hierarchical structure
  const buildHierarchy = () => {
    const hierarchy: { [generation: number]: FamilyUnit[] } = {};
    const rootUnits: FamilyUnit[] = [];

    displayUnits.forEach(unit => {
      if (!hierarchy[unit.generation]) {
        hierarchy[unit.generation] = [];
      }
      hierarchy[unit.generation].push(unit);

      if (!unit.parentUnitId) {
        rootUnits.push(unit);
      }
    });

    return { hierarchy, rootUnits };
  };

  const { hierarchy, rootUnits } = buildHierarchy();
  const generations = Object.keys(hierarchy).map(Number).sort();
  
  // Calculate optimal positions using centered tree layout (bottom-up) - memoized
  const positions = React.useMemo((): Map<string, Position> => {
    const positionsMap = new Map<string, Position>();
    
    if (rootUnits.length === 0) return positionsMap;

    // Helper: Calculate subtree width recursively
    const calculateSubtreeWidth = (unitId: string, memo: Map<string, number>): number => {
      if (memo.has(unitId)) return memo.get(unitId)!;
      
      const unit = displayUnits.get(unitId);
      if (!unit) return UNIT_WIDTH;
      
      // If no children, width is just the unit itself
      if (unit.childUnits.length === 0) {
        memo.set(unitId, UNIT_WIDTH);
        return UNIT_WIDTH;
      }
      
      // Calculate total width of all children + spacing between them
      let totalWidth = 0;
      unit.childUnits.forEach((childId, index) => {
        const childWidth = calculateSubtreeWidth(childId, memo);
        totalWidth += childWidth;
        if (index < unit.childUnits.length - 1) {
          totalWidth += HORIZONTAL_SPACING;
        }
      });
      
      // Width is the maximum of unit width or total children width
      const width = Math.max(UNIT_WIDTH, totalWidth);
      memo.set(unitId, width);
      return width;
    };

    // 1. Calculate subtree widths for all units
    const subtreeWidths = new Map<string, number>();
    rootUnits.forEach(root => {
      calculateSubtreeWidth(root.id, subtreeWidths);
    });

    // 2. Recursive function to position units (bottom-up approach)
    const positionUnit = (
      unitId: string,
      startX: number, // Starting X position
      generation: number
    ): void => {
      const unit = displayUnits.get(unitId);
      if (!unit) return;
      
      const y = (generation - 1) * (UNIT_HEIGHT + VERTICAL_SPACING);
      const subtreeWidth = subtreeWidths.get(unitId) || UNIT_WIDTH;
      
      // If no children, place unit directly
      if (unit.childUnits.length === 0) {
        positionsMap.set(unitId, { x: startX, y, width: UNIT_WIDTH });
        return;
      }
      
      // 3. Position children first (left to right)
      let currentX = startX;
      const childCenters: number[] = []; // Centers of children
      
      unit.childUnits.forEach((childId, index) => {
        const childWidth = subtreeWidths.get(childId) || UNIT_WIDTH;
        
        // Position child recursively
        positionUnit(childId, currentX, generation + 1);
        
        // Read child's ACTUAL position after placement
        const childActualPosition = positionsMap.get(childId);
        if (childActualPosition) {
          // Calculate center based on ACTUAL position (not startX)
          const childCenter = childActualPosition.x + UNIT_WIDTH / 2;
          childCenters.push(childCenter);
        }
        
        // Move to next child
        currentX += childWidth + HORIZONTAL_SPACING;
      });
      
      // 4. Position parent centered above children
      const leftmostChild = childCenters[0];
      const rightmostChild = childCenters[childCenters.length - 1];
      const childrenCenter = (leftmostChild + rightmostChild) / 2;
      
      // Parent X position (centered above children)
      const parentX = childrenCenter - UNIT_WIDTH / 2;
      
      positionsMap.set(unitId, { x: parentX, y, width: UNIT_WIDTH });
    };

    // 5. Position each root unit
    let currentRootX = 0;
    rootUnits.forEach((root, index) => {
      positionUnit(root.id, currentRootX, root.generation);
      
      const rootWidth = subtreeWidths.get(root.id) || UNIT_WIDTH;
      currentRootX += rootWidth + HORIZONTAL_SPACING * 3; // Extra spacing between trees
    });

    return positionsMap;
  }, [displayUnits, rootUnits, UNIT_WIDTH, UNIT_HEIGHT, VERTICAL_SPACING, HORIZONTAL_SPACING]);

  // Calculate tree dimensions for SVG canvas
  const treeDimensions = React.useMemo(() => {
    if (positions.size === 0) return { width: 1000, height: 1000 };
    
    let maxX = 0;
    let maxY = 0;
    
    positions.forEach((pos) => {
      maxX = Math.max(maxX, pos.x + UNIT_WIDTH);
      maxY = Math.max(maxY, pos.y + UNIT_HEIGHT);
    });
    
    // Add padding for connection lines
    return {
      width: maxX + HORIZONTAL_SPACING * 2,
      height: maxY + VERTICAL_SPACING * 2
    };
  }, [positions, UNIT_WIDTH, UNIT_HEIGHT, HORIZONTAL_SPACING, VERTICAL_SPACING]);
  
  // Diagnostic: check if positions is empty despite having units
  if (displayUnits.size > 0 && positions.size === 0) {
    console.error('[OrganizationalChart] CRITICAL: Failed to calculate positions!', {
      displayUnitsSize: displayUnits.size,
      rootUnitsCount: rootUnits.length,
      rootUnits: rootUnits.map(u => ({ id: u.id, generation: u.generation, parentUnitId: u.parentUnitId }))
    });
  }

  // Center root/founder unit at top-center of viewport
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lastRootIdRef = React.useRef<string>('');
  const hasCenteredOnce = React.useRef(false);
  const [containerReady, setContainerReady] = React.useState(false);
  
  // Callback ref for reliable container mounting detection
  const containerRefCallback = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log('[OrganizationalChart] Container mounted, dimensions:', {
        width: node.offsetWidth,
        height: node.offsetHeight
      });
      containerRef.current = node;
      setContainerReady(true);
    }
  }, []);
  
  // Create stable positions key for dependency tracking
  const positionsKey = React.useMemo(() => {
    const key = JSON.stringify(Array.from(positions.entries()));
    console.log('[OrganizationalChart] Positions key generated, size:', positions.size);
    return key;
  }, [positions]);
  
  useEffect(() => {
    console.log('[OrganizationalChart] Centering useEffect triggered:', {
      containerReady,
      rootUnitsLength: rootUnits.length,
      positionsSize: positions.size,
      hasCenteredOnce: hasCenteredOnce.current
    });

    if (rootUnits.length === 0 || positions.size === 0 || !containerReady || !containerRef.current) {
      console.log('[OrganizationalChart] Centering skipped - conditions not met');
      return;
    }

    const currentRootId = rootUnits[0].id;
    const rootPosition = positions.get(currentRootId);
    
    if (!rootPosition) {
      console.warn('[OrganizationalChart] No position found for root unit:', currentRootId);
      return;
    }

    // Check if root changed or if this is the first centering
    const rootChanged = lastRootIdRef.current !== currentRootId;
    const shouldCenter = rootChanged || !hasCenteredOnce.current;

    if (!shouldCenter) {
      console.log('[OrganizationalChart] Centering skipped - already centered on this root');
      return;
    }

    lastRootIdRef.current = currentRootId;
    hasCenteredOnce.current = true;

    const containerWidth = containerRef.current.offsetWidth || 1200;
    const containerHeight = containerRef.current.offsetHeight || 800;

    const rootCenterX = rootPosition.x + rootPosition.width / 2;
    const rootCenterY = rootPosition.y + UNIT_HEIGHT / 2;

    // Simple offset calculation - zoom is applied separately via transform-origin
    const offsetX = containerWidth / 2 - rootCenterX;
    const offsetY = 150 - rootCenterY;

    console.log('[OrganizationalChart] 🎯 SIMPLE CENTERING:', {
      rootId: currentRootId,
      rootCenter: { x: rootCenterX, y: rootCenterY },
      containerWidth,
      offset: { x: offsetX, y: offsetY },
      note: 'Zoom applied via transform-origin: center center'
    });

    setPanOffset({ x: offsetX, y: offsetY });
  }, [containerReady, positionsKey, rootUnits, UNIT_HEIGHT]);

  // Render family unit with modern design
  const renderFamilyUnit = (unit: FamilyUnit, position: Position) => {
    console.log('[OrganizationalChart] Rendering unit:', {
      unitId: unit.id,
      generation: unit.generation,
      type: unit.type,
      membersCount: unit.members?.length || 0,
      position: {
        x: position.x,
        y: position.y,
        width: position.width
      },
      isFounder: unit.members?.some(m => m.is_founder) || false,
      isRoot: rootUnits.some(r => r.id === unit.id)
    });
    
    if (unit.type === 'married' && unit.members.length >= 2) {
      // Find husband and wives
      const husband = unit.members.find(member => member.gender === 'male');
      const wives = unit.members.filter(member => member.gender === 'female');
      const isFounder = unit.members.some(member => member.is_founder);
      
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
          <div className="relative">
            {/* Family badge on top border */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm text-xs">
                <Users className="h-3 w-3 mr-1" />
                عائلة {husband?.name || unit.members[0]?.name}
              </Badge>
            </div>
            
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-background/95 to-muted/95 backdrop-blur-sm overflow-hidden relative" 
                  style={{ height: `${UNIT_HEIGHT}px` }}>
              {/* Suggest Edit Button - Shows on hover for public view */}
              {isPublicView && onSuggestEdit && husband && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 bg-background/80 hover:bg-background shadow-sm z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSuggestEdit(husband.id, husband.name);
                  }}
                >
                  <Edit3 className="h-3 w-3 ml-1" />
                  <span className="text-xs">اقتراح تعديل</span>
                </Button>
              )}
              <CardContent className="p-4 h-full flex flex-col justify-center">
                {isFounder && (
                  <div className="flex justify-center mb-3">
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
                      <Crown className="h-3 w-3 mr-1" />
                      المؤسس
                    </Badge>
                  </div>
                )}
                
                {wives.length === 1 ? (
                  // Single wife layout - centered vertically
                  <div className="flex items-center justify-between gap-4">
                    {/* Wife */}
                    <div className="flex-1 text-center">
                      <MemberAvatar 
                        member={wives[0]} 
                        size="h-14 w-14"
                        borderColor="border-pink-300"
                        ringColor="ring-pink-100 dark:ring-pink-900"
                        fallbackBg="from-pink-400/30 to-rose-500/30"
                        fallbackText="text-pink-700 dark:text-pink-300"
                      />
                      <h4 className="font-semibold text-sm text-foreground text-center break-words mt-2">{wives[0].name}</h4>
                      <Badge variant="outline" className="text-xs mt-1 border-pink-200 text-pink-700 dark:text-pink-300">
                        الزوجة
                      </Badge>
                      {(() => {
                        const wife = wives[0];
                        const fatherId = (wife as any).father_id || (wife as any).fatherId || (wife as any)?.father?.id;
                        const motherId = (wife as any).mother_id || (wife as any).motherId || (wife as any)?.mother?.id;
                        if (!fatherId || !motherId) return null;
                        const fatherMarriages = (marriages || []).filter((m: any) => m.husband_id === fatherId && (m.is_active !== false));
                        const uniqueWives = new Set(fatherMarriages.map((m: any) => m.wife_id));
                        if (uniqueWives.size < 2) return null;
                        const motherMember = (members || []).find((m: any) => m.id === motherId);
                        const motherName = motherMember?.name as string | undefined;
                        if (!motherName) return null;
                        return (
                          <Badge variant="outline" className="text-xs mt-1 border-pink-200 text-pink-700 dark:text-pink-300">
                            والدتها {motherName}
                          </Badge>
                        );
                      })()}
                    </div>

                    {/* Marriage Status */}
                    <div className="flex flex-col items-center justify-center">
                      {(husband?.marital_status === 'divorced' || wives[0].marital_status === 'divorced') ? (
                        <HeartCrack className="h-6 w-6 text-muted-foreground/60" />
                      ) : (
                        <Heart className="h-6 w-6 text-pink-500 animate-pulse" />
                      )}
                    </div>

                    {/* Husband */}
                    {husband && (
                      <div className="flex-1 text-center">
                        <MemberAvatar 
                          member={husband} 
                          size="h-14 w-14"
                          borderColor="border-blue-300"
                          ringColor="ring-blue-100 dark:ring-blue-900"
                          fallbackBg="from-blue-400/30 to-cyan-500/30"
                          fallbackText="text-blue-700 dark:text-blue-300"
                        />
                        <h4 className="font-semibold text-sm text-foreground text-center break-words mt-2">{husband.name}</h4>
                        <Badge variant="outline" className="text-xs mt-1 border-blue-200 text-blue-700 dark:text-blue-300">
                          الزوج
                        </Badge>
                        {(() => {
                          const fatherId = (husband as any).father_id || (husband as any).fatherId || (husband as any)?.father?.id;
                          const motherId = (husband as any).mother_id || (husband as any).motherId || (husband as any)?.mother?.id;
                          if (!fatherId || !motherId) return null;
                          const fatherMarriages = (marriages || []).filter((m: any) => m.husband_id === fatherId && (m.is_active !== false));
                          const uniqueWives = new Set(fatherMarriages.map((m: any) => m.wife_id));
                          if (uniqueWives.size < 2) return null;
                          const motherMember = (members || []).find((m: any) => m.id === motherId);
                          const motherName = motherMember?.name as string | undefined;
                          if (!motherName) return null;
                          return (
                            <Badge variant="outline" className="text-xs mt-1 border-blue-200 text-blue-700 dark:text-blue-300">
                              والدته {motherName}
                            </Badge>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  // Multiple wives layout - optimized to show more details
                  <div className="h-full flex flex-col justify-start pt-1">
                    {/* Husband section - extra compact */}
                    {husband && (
                      <div className="text-center mb-0.5">
                        <MemberAvatar 
                          member={husband} 
                          size="h-8 w-8"
                          borderColor="border-blue-300"
                          ringColor="ring-blue-100 dark:ring-blue-900"
                          fallbackBg="from-blue-400/30 to-cyan-500/30"
                          fallbackText="text-blue-700 dark:text-blue-300"
                          textSize="text-xs"
                        />
                        <h4 className="font-semibold text-xs text-foreground text-center break-words leading-tight mb-0.5 mt-0.5">{husband.name}</h4>
                        {(() => {
                          const fatherId = (husband as any).father_id || (husband as any).fatherId || (husband as any)?.father?.id;
                          const motherId = (husband as any).mother_id || (husband as any).motherId || (husband as any)?.mother?.id;
                          if (!fatherId || !motherId) return null;
                          const fatherMarriages = (marriages || []).filter((m: any) => m.husband_id === fatherId && (m.is_active !== false));
                          const uniqueWives = new Set(fatherMarriages.map((m: any) => m.wife_id));
                          if (uniqueWives.size < 2) return null;
                          const motherMember = (members || []).find((m: any) => m.id === motherId);
                          const motherName = motherMember?.name as string | undefined;
                          if (!motherName) return null;
                          return (
                            <Badge variant="outline" className="text-[8px] border-blue-200 text-blue-700 dark:text-blue-300 px-0.5 py-0 mt-0.5">
                              والدته {motherName}
                            </Badge>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Wives section - flexible grid that adapts to number of wives */}
                    <div className="flex-1 flex flex-col justify-start">
                      <div className="grid gap-0.5 pt-1" style={{
                        gridTemplateColumns: wives.length === 2 ? 'repeat(2, 1fr)' :
                                           wives.length === 3 ? 'repeat(3, 1fr)' :
                                           wives.length === 4 ? 'repeat(2, 1fr)' :
                                           wives.length <= 6 ? 'repeat(3, 1fr)' :
                                           wives.length <= 9 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
                        gridTemplateRows: wives.length <= 3 ? '1fr' :
                                        wives.length <= 6 ? 'repeat(2, 1fr)' :
                                        wives.length <= 9 ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)'
                      }}>
                        {wives.map((wife, index) => (
                          <div key={wife.id} className="text-center py-0.5 px-0.5">
                            <MemberAvatar 
                              member={wife} 
                              size={wives.length <= 4 ? 'h-9 w-9' : wives.length <= 6 ? 'h-8 w-8' : 'h-7 w-7'}
                              borderColor="border-pink-300"
                              ringColor="ring-pink-100 dark:ring-pink-900"
                              fallbackBg="from-pink-400/30 to-rose-500/30"
                              fallbackText="text-pink-700 dark:text-pink-300"
                              textSize="text-xs"
                            />
                            <h5 className="font-medium text-xs text-foreground text-center break-words leading-tight mb-0.5 mt-0.5"
                                style={{ 
                                  fontSize: wives.length <= 4 ? '11px' : wives.length <= 6 ? '10px' : '9px', 
                                  lineHeight: '1.1' 
                                }}>
                              {wives.length > 6 && wife.name.length > 5 ? wife.name.slice(0, 5) + '...' : wife.name}
                            </h5>
                            <Badge variant="outline" className="text-xs border-pink-200 text-pink-700 dark:text-pink-300 px-0.5 py-0" 
                                   style={{ 
                                     fontSize: wives.length <= 4 ? '6px' : wives.length <= 6 ? '5px' : '4px' 
                                   }}>
                              {wife.marital_status === 'divorced' ? 'زوجة سابقة' : 'زوجة'}
                            </Badge>
                            {wife.birth_date && wives.length <= 6 && (
                              <div className="text-xs text-muted-foreground mt-0.5" style={{ fontSize: '7px' }}>
                                {new Date(wife.birth_date).getFullYear()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    } else {
      const member = unit.members[0];
      const isFounder = member.is_founder;
      
      // Robust mother badge logic using original data with fallback to unit composition
      const fatherId = (member as any).father_id || (member as any).fatherId || (member as any)?.father?.id;
      const motherId = (member as any).mother_id || (member as any).motherId || (member as any)?.mother?.id;

      // Parent unit wives count (fallback when marriages data is incomplete)
      const parentUnit = unit.parentUnitId ? displayUnits.get(unit.parentUnitId) : undefined;
      const parentWivesCount = parentUnit && (parentUnit as any).type === 'married'
        ? ((parentUnit as any).members || []).filter((m: any) => m?.gender === 'female').length
        : 0;
      
      // Count unique wives from marriages data
      const fatherMarriages = fatherId
        ? marriages.filter((m: any) => m.husband_id === fatherId)
        : [];
      const uniqueWives = new Set(fatherMarriages.map((m: any) => m.wife_id));
      const fatherHasMultipleWives = uniqueWives.size >= 2 || parentWivesCount >= 2;
      
      // Resolve mother name from global members
      let motherName: string | undefined;
      if (motherId && fatherHasMultipleWives) {
        const motherMember = members.find((m: any) => m.id === motherId);
        motherName = motherMember?.name;
      }

      // Enhanced debug for شهد case
      if ((member?.name || '').includes('شهد') || member?.id === '7e280f45-571b-4eba-be6c-93da2558522b') {
        console.log('=== [شهد Debug] ===', {
          memberName: member?.name,
          memberId: member?.id,
          fatherId,
          motherId,
          marriagesTotal: marriages.length,
          fatherMarriages,
          uniqueWivesArray: Array.from(uniqueWives),
          uniqueWivesCount: uniqueWives.size,
          parentWivesCount,
          fatherHasMultipleWives,
          membersTotal: members.length,
          motherMember: members.find((m: any) => m.id === motherId),
          motherName,
          willShowBadge: fatherHasMultipleWives && motherName ? 'YES' : 'NO'
        });
      }

      const motherLabel = (member.gender === 'female' ? 'والدتها ' : 'والدته ');
      
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
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-background/95 to-muted/95 backdrop-blur-sm overflow-hidden relative"
                style={{ height: `${UNIT_HEIGHT}px` }}>
            {/* Suggest Edit Button - Shows on hover for public view */}
            {isPublicView && onSuggestEdit && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 bg-background/80 hover:bg-background shadow-sm z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  onSuggestEdit(member.id, member.name);
                }}
              >
                <Edit3 className="h-3 w-3 ml-1" />
                <span className="text-xs">اقتراح تعديل</span>
              </Button>
            )}
            <CardContent className="p-4 h-full flex flex-col justify-between">
                {isFounder && (
                  <div className="flex justify-center mb-3">
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
                      <Crown className="h-3 w-3 mr-1" />
                      المؤسس
                    </Badge>
                  </div>
                )}
                
                <div className="text-center">
                  <MemberAvatar 
                    member={member} 
                    size="h-16 w-16"
                    borderColor="border-primary/30"
                    ringColor="ring-primary/10"
                    fallbackBg="from-primary/20 to-primary/30"
                    fallbackText="text-primary"
                    textSize="text-lg"
                  />
                  <h3 className="font-bold text-lg text-foreground mb-2 mt-3">{member.name}</h3>
                  
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <UserRound className="h-3 w-3 mr-1" />
                      {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                    </Badge>
                    {member.marital_status && (
                      <Badge variant="outline" className="text-xs">
                        {member.marital_status === 'single' ? 'أعزب' : 
                         member.marital_status === 'married' ? 'متزوج' :
                         member.marital_status === 'divorced' ? 'مطلق' : 'أرمل'}
                      </Badge>
                    )}
                    {fatherHasMultipleWives && motherName && (
                      <Badge variant="outline" className="text-xs">
                        {motherLabel}{motherName}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      );
    }
  };

  // Render clean connection lines
  const renderConnections = () => {
    const connections: JSX.Element[] = [];

    displayUnits.forEach(parentUnit => {
      const children = parentUnit.childUnits
        .map(id => displayUnits.get(id))
        .filter(Boolean) as FamilyUnit[];

      if (children.length === 0) return;

      const parentPos = positions.get(parentUnit.id);
      if (!parentPos) {
        console.log(`🚨 [renderConnections] Parent unit has no position:`, {
          parentId: parentUnit.id,
          parentNames: parentUnit.members.map(m => `${m.name} [${m.id.slice(0, 8)}]`).join(' & '),
          childUnitsCount: parentUnit.childUnits.length
        });
        return;
      }
      
      // Check if any children are missing from displayUnits or positions
      const missingChildren = parentUnit.childUnits.filter(childId => {
        const childInDisplay = displayUnits.has(childId);
        const childPos = positions.get(childId);
        return !childInDisplay || !childPos;
      });
      
      if (missingChildren.length > 0) {
        console.log(`🚨 [renderConnections] Parent has children missing from displayUnits or positions:`, {
          parentId: parentUnit.id,
          parentNames: parentUnit.members.map(m => `${m.name} [${m.id.slice(0, 8)}]`).join(' & '),
          missingChildIds: missingChildren,
          totalChildren: parentUnit.childUnits.length
        });
      }

      const parentCenterX = parentPos.x + UNIT_WIDTH / 2;
      const parentBottomY = parentPos.y + UNIT_HEIGHT;
      
      children.forEach((childUnit, idx) => {
        const childPos = positions.get(childUnit.id);
        if (!childPos) {
          console.log(`🚨 [renderConnections] Child has no position:`, {
            childId: childUnit.id,
            childNames: childUnit.members.map(m => `${m.name} [${m.id.slice(0, 8)}]`).join(' & '),
            parentNames: parentUnit.members.map(m => `${m.name} [${m.id.slice(0, 8)}]`).join(' & ')
          });
          return;
        }
        
        const childCenterX = childPos.x + UNIT_WIDTH / 2;
        const childTopY = childPos.y;
        
        console.log(`🔗 [renderConnections] Line ${idx + 1}/${children.length}:`, {
          from: `${parentUnit.members.map(m => m.name).join(' & ')}`,
          to: `${childUnit.members.map(m => m.name).join(' & ')}`,
          parentPos: { x: parentPos.x, y: parentPos.y },
          childPos: { x: childPos.x, y: childPos.y },
          lineCoords: {
            start: { x: parentCenterX, y: parentBottomY },
            end: { x: childCenterX, y: childTopY }
          }
        });
      });
      
      if (children.length === 1) {
        // Single child - direct line
        const child = children[0];
        const childPos = positions.get(child.id);
        if (!childPos) return;

        const childCenterX = childPos.x + UNIT_WIDTH / 2;
        const childTopY = childPos.y;

        connections.push(
          <g key={`connection-${parentUnit.id}-${child.id}`}>
            <line
              x1={parentCenterX}
              y1={parentBottomY}
              x2={parentCenterX}
              y2={parentBottomY + VERTICAL_SPACING / 3}
              stroke={primaryColor}
              strokeWidth="3"
              fill="none"
              strokeOpacity="1"
            />
            <line
              x1={parentCenterX}
              y1={parentBottomY + VERTICAL_SPACING / 3}
              x2={childCenterX}
              y2={parentBottomY + VERTICAL_SPACING / 3}
              stroke={primaryColor}
              strokeWidth="3"
              fill="none"
              strokeOpacity="1"
            />
            <line
              x1={childCenterX}
              y1={parentBottomY + VERTICAL_SPACING / 3}
              x2={childCenterX}
              y2={childTopY}
              stroke={primaryColor}
              strokeWidth="3"
              fill="none"
              strokeOpacity="1"
            />
          </g>
        );
        
        console.log('🎨 [SVG Group Created - Single Child]:', {
          parentNames: parentUnit.members.map(m => m.name).join(' & '),
          childName: child.members.map(m => m.name).join(' & '),
          linesInGroup: 3,
          segment1Coords: { x1: parentCenterX, y1: parentBottomY, x2: parentCenterX, y2: parentBottomY + VERTICAL_SPACING / 3 },
          segment2Coords: { x1: parentCenterX, y1: parentBottomY + VERTICAL_SPACING / 3, x2: childCenterX, y2: parentBottomY + VERTICAL_SPACING / 3 },
          segment3Coords: { x1: childCenterX, y1: parentBottomY + VERTICAL_SPACING / 3, x2: childCenterX, y2: childTopY },
          stroke: primaryColor,
          strokeWidth: 3
        });
      } else {
        // Multiple children - org chart style
        const childPositions = children
          .map(child => positions.get(child.id))
          .filter(Boolean) as Position[];

        const leftmostX = Math.min(...childPositions.map(pos => pos.x + UNIT_WIDTH / 2));
        const rightmostX = Math.max(...childPositions.map(pos => pos.x + UNIT_WIDTH / 2));
        const distributionY = parentBottomY + VERTICAL_SPACING / 2;

        connections.push(
          <g key={`connection-group-${parentUnit.id}`}>
            {/* Main vertical line from parent */}
            <line
              x1={parentCenterX}
              y1={parentBottomY}
              x2={parentCenterX}
              y2={distributionY}
              stroke={primaryColor}
              strokeWidth="3"
              fill="none"
              strokeOpacity="1"
            />
            
            {/* Horizontal distribution line */}
            <line
              x1={leftmostX}
              y1={distributionY}
              x2={rightmostX}
              y2={distributionY}
              stroke={primaryColor}
              strokeWidth="3"
              fill="none"
              strokeOpacity="1"
            />
            
            {/* Vertical lines to each child */}
            {children.map(child => {
              const childPos = positions.get(child.id);
              if (!childPos) return null;

              const childCenterX = childPos.x + UNIT_WIDTH / 2;
              const childTopY = childPos.y;

              return (
                <line
                  key={`child-line-${child.id}`}
                  x1={childCenterX}
                  y1={distributionY}
                  x2={childCenterX}
                  y2={childTopY}
                  stroke={primaryColor}
                  strokeWidth="3"
                  fill="none"
                  strokeOpacity="1"
                />
              );
            })}
          </g>
        );
        
        console.log('🎨 [SVG Group Created - Multiple Children]:', {
          parentNames: parentUnit.members.map(m => m.name).join(' & '),
          childCount: children.length,
          totalLinesInGroup: 2 + children.length, // vertical + horizontal + child lines
          verticalLineCoords: { x1: parentCenterX, y1: parentBottomY, x2: parentCenterX, y2: distributionY },
          horizontalLineCoords: { x1: leftmostX, y1: distributionY, x2: rightmostX, y2: distributionY },
          childLineCoords: children.map(child => {
            const pos = positions.get(child.id);
            return pos ? {
              childName: child.members.map(m => m.name).join(' & '),
              coords: { x1: pos.x + UNIT_WIDTH / 2, y1: distributionY, x2: pos.x + UNIT_WIDTH / 2, y2: pos.y }
            } : null;
          }).filter(Boolean),
          stroke: primaryColor,
          strokeWidth: 3
        });
      }
    });

    return connections;
  };

  console.log('[OrganizationalChart] Final check before render:', {
    displayUnitsSize: displayUnits.size,
    positionsSize: positions.size,
    willRender: displayUnits.size > 0 && positions.size > 0
  });

  if (displayUnits.size === 0) {
    console.log('[OrganizationalChart] Rendering empty state - no display units');
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div className="text-muted-foreground">
          <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">لا توجد بيانات عائلة لعرضها</p>
          <p className="text-sm mt-2">ابدأ بإضافة أعضاء العائلة لبناء الشجرة</p>
        </div>
      </div>
    );
  }

  // Visual guardian: if we have units but no positions, show a diagnostic message
  if (displayUnits.size > 0 && positions.size === 0) {
    console.error('[OrganizationalChart] Have units but no positions calculated!', {
      displayUnitsSize: displayUnits.size,
      rootUnitsCount: rootUnits.length
    });
    return (
      <div className="flex items-center justify-center h-64 text-center p-8">
        <div className="max-w-md">
          <p className="text-destructive font-semibold mb-2">تعذّر حساب مواضع الرسم (لا جذور).</p>
          <p className="text-sm text-muted-foreground">
            يوجد {displayUnits.size} وحدة لكن لم يتم العثور على وحدات جذرية. تحقق من وحدة التحكم للمزيد من التفاصيل.
          </p>
        </div>
      </div>
    );
  }

  console.log('[OrganizationalChart] ✅ PASSED positions check! About to render:', {
    displayUnitsSize: displayUnits.size,
    positionsSize: positions.size,
    rootUnitsCount: rootUnits.length
  });

  // Get the computed primary color for SVG stroke
  const primaryColor = React.useMemo(() => {
    const computed = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    return `hsl(${computed})`;
  }, []);

  const connectionElements = renderConnections();

  return (
    <div className="w-full h-full">
      <div
        ref={containerRefCallback}
        className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-xl border border-border/50 shadow-inner cursor-grab active:cursor-grabbing select-none"
        style={{ 
          minHeight: '600px',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out'
          }}
        >
          {/* Background grid pattern */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
            {/* Background grid pattern */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, hsl(var(--primary)/0.15) 1px, transparent 0)
                `,
                backgroundSize: '40px 40px'
              }}
            />

            {/* SVG for connection lines */}
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              width={treeDimensions.width}
              height={treeDimensions.height}
            >
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="hsl(var(--primary))" floodOpacity="0.3"/>
                </filter>
              </defs>

              {connectionElements}
              
              <g filter="url(#shadow)" opacity="0.2">
                {/* Shadow layer */}
              </g>
            </svg>

            {/* Render all family units */}
            {Array.from(displayUnits.values()).map(unit => {
              const position = positions.get(unit.id);
              if (!position) {
                console.warn('[OrganizationalChart] No position found for unit:', unit.id);
                return null;
              }
              return renderFamilyUnit(unit, position);
            })}
          </div>
        </div>
      </div>
    );
  };