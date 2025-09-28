import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, HeartCrack, Users, Crown, UserRound } from "lucide-react";

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
}

interface Position {
  x: number;
  y: number;
  width: number;
}

export const OrganizationalChart: React.FC<OrganizationalChartProps> = ({
  familyUnits,
  zoomLevel
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

  // Use effect to handle document-level mouse events when dragging
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

    if (isDragging) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
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

  // Calculate optimal positions using tree layout algorithm
  const calculatePositions = (): Map<string, Position> => {
    const positions = new Map<string, Position>();
    
    if (rootUnits.length === 0) return positions;

    // Start with root units
    let currentX = 0;
    
    const calculateSubtreeWidth = (unit: FamilyUnit): number => {
      const children = unit.childUnits
        .map(id => displayUnits.get(id))
        .filter(Boolean) as FamilyUnit[];
      
      if (children.length === 0) {
        return UNIT_WIDTH;
      }
      
      const childrenWidth = children.reduce((total, child) => {
        return total + calculateSubtreeWidth(child);
      }, 0);
      
      const spacingWidth = Math.max(0, (children.length - 1) * HORIZONTAL_SPACING);
      return Math.max(UNIT_WIDTH, childrenWidth + spacingWidth);
    };

    const positionSubtree = (unit: FamilyUnit, centerX: number, generation: number) => {
      const y = generation * (UNIT_HEIGHT + VERTICAL_SPACING);
      
      positions.set(unit.id, {
        x: centerX - UNIT_WIDTH / 2,
        y: y,
        width: UNIT_WIDTH
      });

      const children = unit.childUnits
        .map(id => displayUnits.get(id))
        .filter(Boolean) as FamilyUnit[];

      if (children.length > 0) {
        const subtreeWidth = calculateSubtreeWidth(unit);
        let childX = centerX - subtreeWidth / 2;

        children.forEach(child => {
          const childSubtreeWidth = calculateSubtreeWidth(child);
          const childCenterX = childX + childSubtreeWidth / 2;
          
          positionSubtree(child, childCenterX, generation + 1);
          childX += childSubtreeWidth + HORIZONTAL_SPACING;
        });
      }
    };

    // Position root units
    rootUnits.forEach((rootUnit, index) => {
      const subtreeWidth = calculateSubtreeWidth(rootUnit);
      const centerX = currentX + subtreeWidth / 2;
      
      positionSubtree(rootUnit, centerX, 0);
      currentX += subtreeWidth + HORIZONTAL_SPACING * 2;
    });

    return positions;
  };

  const positions = calculatePositions();

  // Center content on initial load - prevent infinite loop by using ref
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (displayUnits.size > 0 && !hasInitialized) {
      const allPositions = Array.from(positions.values());
      if (allPositions.length > 0) {
        const chartWidth = Math.max(
          1000,
          Math.max(...allPositions.map(pos => pos.x)) + UNIT_WIDTH + 100
        );
        const chartHeight = Math.max(
          600,
          Math.max(...allPositions.map(pos => pos.y)) + UNIT_HEIGHT + 100
        );
        
        const containerWidth = 1200; // Approximate container width
        const containerHeight = 600; // Minimum container height
        
        const centerX = Math.max(0, (containerWidth - chartWidth) / 2);
        const centerY = Math.max(0, (containerHeight - chartHeight) / 2);
        
        setPanOffset({ x: centerX, y: centerY });
        setHasInitialized(true);
      }
    }
  }, [displayUnits.size, hasInitialized]);

  // Render family unit with modern design
  const renderFamilyUnit = (unit: FamilyUnit, position: Position) => {
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
            
            <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-background/95 to-muted/95 backdrop-blur-sm overflow-hidden" 
                  style={{ height: `${UNIT_HEIGHT}px` }}>
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
                      <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-pink-300 ring-2 ring-pink-100 dark:ring-pink-900">
                        {wives[0].image_url ? (
                          <AvatarImage src={wives[0].image_url} alt={wives[0].name} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-pink-400/30 to-rose-500/30 text-pink-700 dark:text-pink-300 font-semibold">
                            {wives[0].name.slice(0, 2)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <h4 className="font-semibold text-sm text-foreground text-center break-words">{wives[0].name}</h4>
                      <Badge variant="outline" className="text-xs mt-1 border-pink-200 text-pink-700 dark:text-pink-300">
                        {(() => {
                          const husbandId = husband?.id;
                          if (!husbandId) return 'الزوجة';
                          const husbandMarriedUnits = Array.from(displayUnits.values()).filter(unit =>
                            unit.type === 'married' &&
                            unit.members.some(m => m?.id === husbandId && m?.gender === 'male')
                          );
                          const totalWives = husbandMarriedUnits.reduce((count, unit) =>
                            count + unit.members.filter(m => m?.gender === 'female').length, 0
                          );
                          return totalWives > 1 ? `الزوجة (أم ${wives[0].name})` : 'الزوجة';
                        })()}
                      </Badge>
                      {(() => {
                        try {
                          const wife = wives[0];
                          // Find wife's single unit to determine parents (display units)
                          const wifeSingleUnit = Array.from(displayUnits.values()).find((u: any) =>
                            u.type !== 'married' && (u as any).members?.[0]?.id === wife.id
                          ) as any | undefined;
                          const wParent: any = wifeSingleUnit?.parentUnitId ? displayUnits.get(wifeSingleUnit.parentUnitId) : undefined;
                          const candidates = wParent && wParent.type === 'married' ? (wParent.members || []).filter((m: any) => m?.gender === 'female') : [];
                          let hasMulti = (candidates?.length || 0) >= 2;
                          let mId: string | undefined = (wife as any).motherId || (wife as any).mother_id || (wife as any).motherID || (wife as any)?.mother?.id;
                          if (!mId && wParent) {
                            const siblingUnits = (wParent.childUnits || [])
                              .map((id: string) => displayUnits.get(id))
                              .filter(Boolean) as any[];
                            const inferred = siblingUnits
                              .map((u: any) => (u as any).members?.[0])
                              .find((s: any) => s && s.id !== wife.id && (s.motherId || s.mother_id));
                            mId = inferred?.motherId || inferred?.mother_id;
                          }
                          let mName: string | undefined;
                          if (mId) {
                            const found = candidates.find((w: any) => w?.id === mId);
                            mName = found?.name;
                          }
                          // Fallback: resolve via original (familyUnits) even if no single display unit exists
                          if (!mName) {
                            const wifeSingleOriginal = Array.from(familyUnits.values()).find((u: any) =>
                              u.type !== 'married' && (u as any).members?.[0]?.id === wife.id
                            ) as any | undefined;
                            const parentOriginal: any = wifeSingleOriginal?.parentUnitId ? familyUnits.get(wifeSingleOriginal.parentUnitId) : undefined;
                            if (parentOriginal) {
                              const father = (parentOriginal.members || []).find((m: any) => m?.gender === 'male');
                              const mother = (parentOriginal.members || []).find((m: any) => m?.gender === 'female');
                              const fatherMarriedUnits = Array.from(familyUnits.values()).filter((u: any) =>
                                u.type === 'married' && (u.members || []).some((m: any) => m?.id === father?.id && m?.gender === 'male')
                              );
                              const wivesCount = fatherMarriedUnits.reduce((acc: number, u: any) => acc + (u.members || []).filter((m: any) => m?.gender === 'female').length, 0);
                              if (wivesCount >= 2) hasMulti = true;
                              if (!mName) mName = mother?.name;
                            }
                          }
                          if (hasMulti && mName) {
                            return (
                              <Badge variant="outline" className="text-xs mt-1 border-pink-200 text-pink-700 dark:text-pink-300">
                                والدتها {mName}
                              </Badge>
                            );
                          }
                        } catch (e) {
                          // no-op
                        }
                        return null;
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
                        <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-blue-300 ring-2 ring-blue-100 dark:ring-blue-900">
                          {husband.image_url ? (
                            <AvatarImage src={husband.image_url} alt={husband.name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-400/30 to-cyan-500/30 text-blue-700 dark:text-blue-300 font-semibold">
                              {husband.name.slice(0, 2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <h4 className="font-semibold text-sm text-foreground text-center break-words">{husband.name}</h4>
                        <Badge variant="outline" className="text-xs mt-1 border-blue-200 text-blue-700 dark:text-blue-300">
                          الزوج
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  // Multiple wives layout - optimized to show more details
                  <div className="h-full flex flex-col justify-start pt-1">
                    {/* Husband section - extra compact */}
                    {husband && (
                      <div className="text-center mb-0.5">
                        <Avatar className="h-8 w-8 mx-auto mb-0.5 border-2 border-blue-300 ring-1 ring-blue-100 dark:ring-blue-900">
                          {husband.image_url ? (
                            <AvatarImage src={husband.image_url} alt={husband.name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-400/30 to-cyan-500/30 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                              {husband.name.slice(0, 2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <h4 className="font-semibold text-xs text-foreground text-center break-words leading-tight mb-0.5">{husband.name}</h4>
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
                            <Avatar className={`mx-auto mb-0.5 border border-pink-300 ring-1 ring-pink-100 dark:ring-pink-900 ${
                              wives.length <= 4 ? 'h-9 w-9' : 
                              wives.length <= 6 ? 'h-8 w-8' : 'h-7 w-7'
                            }`}>
                              {wife.image_url ? (
                                <AvatarImage src={wife.image_url} alt={wife.name} />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br from-pink-400/30 to-rose-500/30 text-pink-700 dark:text-pink-300 font-semibold text-xs">
                                  {wife.name.slice(0, 2)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <h5 className="font-medium text-xs text-foreground text-center break-words leading-tight mb-0.5" 
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
      
      // Determine mother when father has 2+ wives (robust)
      const parentUnit = unit.parentUnitId ? displayUnits.get(unit.parentUnitId) : undefined;
      const wives = parentUnit && (parentUnit as any).type === 'married'
        ? (parentUnit as any).members.filter((m: any) => m?.gender === 'female')
        : [];
      const fatherHasMultipleWives = wives.length >= 2;

      // Debug logging for specific members
      if (member.name === 'شهد' || member.name === 'أحمد') {
        console.log(`=== DEBUG ${member.name} ===`);
        console.log('Member:', member);
        console.log('Parent unit:', parentUnit);
        console.log('Wives:', wives);
        console.log('Father has multiple wives:', fatherHasMultipleWives);
      }

      let motherId: string | undefined =
        (member as any).motherId ||
        (member as any).mother_id ||
        (member as any).motherID ||
        (member as any)?.mother?.id;

      if (member.name === 'شهد' || member.name === 'أحمد') {
        console.log('Initial motherId:', motherId);
      }

      // Try to infer from siblings if missing
      if (!motherId && parentUnit) {
        const siblingUnits = ((parentUnit as any).childUnits || [])
          .map((id: string) => displayUnits.get(id))
          .filter(Boolean) as FamilyUnit[];
        const inferred = siblingUnits
          .map((u: FamilyUnit) => (u as any).members?.[0])
          .find((s: any) => s && s.id !== (member as any).id && (s.motherId || s.mother_id));
        const inferredMotherId = inferred?.motherId || inferred?.mother_id;
        if (inferredMotherId) motherId = inferredMotherId;
        
        if (member.name === 'شهد' || member.name === 'أحمد') {
          console.log('Sibling units:', siblingUnits);
          console.log('Inferred motherId:', inferredMotherId);
          console.log('Final motherId after sibling inference:', motherId);
        }
      }

      // Match mother by id within wives
      let motherName: string | undefined;
      let motherInUnit = motherId ? wives.find((w: any) => (w?.id === motherId)) : undefined;
      motherName = (motherInUnit?.name as string | undefined);

      if (member.name === 'شهد' || member.name === 'أحمد') {
        console.log('Mother in unit:', motherInUnit);
        console.log('Mother name from ID match:', motherName);
      }

      // Last resort: map via original married units (per-wife child mapping)
      if (!motherName && parentUnit && (parentUnit as any).originalUnitIds) {
        const originalIds = ((parentUnit as any).originalUnitIds as string[]) || [];
        if (member.name === 'شهد' || member.name === 'أحمد') {
          console.log('Original unit IDs:', originalIds);
        }
        
        for (const oid of originalIds) {
          const original = familyUnits.get(oid) as any;
          if (!original) continue;
          const wife = (original.members || []).find((m: any) => m?.gender === 'female');
          if ((original.childUnits || []).includes(unit.id)) {
            motherName = wife?.name;
            if (member.name === 'شهد' || member.name === 'أحمد') {
              console.log('Found mother via original unit:', original, 'Wife:', wife, 'Mother name:', motherName);
            }
            break;
          }
        }
      }

      if (member.name === 'شهد' || member.name === 'أحمد') {
        console.log('Final mother name:', motherName);
        console.log('=== END DEBUG ===');
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
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-background/95 to-muted/95 backdrop-blur-sm overflow-hidden"
                style={{ height: `${UNIT_HEIGHT}px` }}>
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
                  <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-primary/30 ring-2 ring-primary/10">
                    {member.image_url ? (
                      <AvatarImage src={member.image_url} alt={member.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-semibold text-lg">
                        {member.name.slice(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h3 className="font-bold text-lg text-foreground mb-2">{member.name}</h3>
                  
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <UserRound className="h-3 w-3 mr-1" />
                      {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                    </Badge>
                    {member.birth_date && (
                      <Badge variant="secondary" className="text-xs">
                        {new Date(member.birth_date).getFullYear()}
                      </Badge>
                    )}
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
      if (!parentPos) return;

      const parentCenterX = parentPos.x + UNIT_WIDTH / 2;
      const parentBottomY = parentPos.y + UNIT_HEIGHT;
      
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
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              className="drop-shadow-sm"
            />
            <line
              x1={parentCenterX}
              y1={parentBottomY + VERTICAL_SPACING / 3}
              x2={childCenterX}
              y2={parentBottomY + VERTICAL_SPACING / 3}
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              className="drop-shadow-sm"
            />
            <line
              x1={childCenterX}
              y1={parentBottomY + VERTICAL_SPACING / 3}
              x2={childCenterX}
              y2={childTopY}
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              className="drop-shadow-sm"
            />
          </g>
        );
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
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              className="drop-shadow-sm"
            />
            
            {/* Horizontal distribution line */}
            <line
              x1={leftmostX}
              y1={distributionY}
              x2={rightmostX}
              y2={distributionY}
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              className="drop-shadow-sm"
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
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  className="drop-shadow-sm"
                />
              );
            })}
          </g>
        );
      }
    });

    return connections;
  };

  if (displayUnits.size === 0) {
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

  // Calculate chart dimensions
  const allPositions = Array.from(positions.values());
  const chartWidth = Math.max(
    1000,
    Math.max(...allPositions.map(pos => pos.x)) + UNIT_WIDTH + 100
  );
  const chartHeight = Math.max(
    600,
    Math.max(...allPositions.map(pos => pos.y)) + UNIT_HEIGHT + 100
  );

  return (
    <div className="w-full h-full">
      <div
        className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-xl border border-border/50 shadow-inner cursor-grab active:cursor-grabbing select-none"
        style={{ 
          minHeight: '600px',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="relative"
          style={{ 
            width: chartWidth, 
            height: chartHeight
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'top center'
            }}
          >
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
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
            >
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="hsl(var(--primary))" floodOpacity="0.3"/>
                </filter>
              </defs>
              <g filter="url(#shadow)">
                {renderConnections()}
              </g>
            </svg>

            {/* Render all family units */}
            {Array.from(displayUnits.values()).map(unit => {
              const position = positions.get(unit.id);
              if (!position) return null;
              return renderFamilyUnit(unit, position);
            })}
          </div>
        </div>
      </div>
    </div>
  );
};