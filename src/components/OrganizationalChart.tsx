import React, { useState } from "react";
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
  const UNIT_WIDTH = 320;
  const UNIT_HEIGHT = 180;
  const VERTICAL_SPACING = 120;
  const HORIZONTAL_SPACING = 60;

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Build hierarchical structure
  const buildHierarchy = () => {
    const hierarchy: { [generation: number]: FamilyUnit[] } = {};
    const rootUnits: FamilyUnit[] = [];

    familyUnits.forEach(unit => {
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
        .map(id => familyUnits.get(id))
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
        .map(id => familyUnits.get(id))
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

  // Render family unit with modern design
  const renderFamilyUnit = (unit: FamilyUnit, position: Position) => {
    if (unit.type === 'married' && unit.members.length === 2) {
      const [husband, wife] = unit.members;
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
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-background/95 to-muted/95 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
              {isFounder && (
                <div className="flex justify-center mb-3">
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
                    <Crown className="h-3 w-3 mr-1" />
                    المؤسس
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-4">
                {/* Wife */}
                <div className="flex-1 text-center">
                  <Avatar className="h-14 w-14 mx-auto mb-2 border-2 border-pink-300 ring-2 ring-pink-100 dark:ring-pink-900">
                    {wife.image_url ? (
                      <AvatarImage src={wife.image_url} alt={wife.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-pink-400/30 to-rose-500/30 text-pink-700 dark:text-pink-300 font-semibold">
                        {wife.name.slice(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h4 className="font-semibold text-sm text-foreground truncate">{wife.name}</h4>
                  <Badge variant="outline" className="text-xs mt-1 border-pink-200 text-pink-700 dark:text-pink-300">
                    الزوجة
                  </Badge>
                </div>

                {/* Marriage Status */}
                <div className="flex flex-col items-center justify-center">
                  {(husband.marital_status === 'divorced' || wife.marital_status === 'divorced') ? (
                    <HeartCrack className="h-6 w-6 text-muted-foreground/60" />
                  ) : (
                    <Heart className="h-6 w-6 text-pink-500 animate-pulse" />
                  )}
                </div>

                {/* Husband */}
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
                  <h4 className="font-semibold text-sm text-foreground truncate">{husband.name}</h4>
                  <Badge variant="outline" className="text-xs mt-1 border-blue-200 text-blue-700 dark:text-blue-300">
                    الزوج
                  </Badge>
                </div>
              </div>

              <div className="text-center mt-4">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
                  <Users className="h-3 w-3 mr-1" />
                  عائلة {husband.name}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      const member = unit.members[0];
      const isFounder = member.is_founder;
      
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
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-background/95 to-muted/95 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
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
                </div>
                
                {member.marital_status && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {member.marital_status === 'single' ? 'أعزب' : 
                     member.marital_status === 'married' ? 'متزوج' :
                     member.marital_status === 'divorced' ? 'مطلق' : 'أرمل'}
                  </Badge>
                )}
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

    familyUnits.forEach(parentUnit => {
      const children = parentUnit.childUnits
        .map(id => familyUnits.get(id))
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

  if (familyUnits.size === 0) {
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
          minHeight: '600px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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
            {Array.from(familyUnits.values()).map(unit => {
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