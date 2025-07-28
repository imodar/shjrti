import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Users } from "lucide-react";

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

export const OrganizationalChart: React.FC<OrganizationalChartProps> = ({ 
  familyUnits, 
  zoomLevel 
}) => {
  // Build hierarchical structure
  const buildHierarchy = () => {
    const hierarchy: { [generation: number]: FamilyUnit[] } = {};
    
    familyUnits.forEach(unit => {
      if (unit.generation > 0) {
        if (!hierarchy[unit.generation]) {
          hierarchy[unit.generation] = [];
        }
        hierarchy[unit.generation].push(unit);
      }
    });
    
    return hierarchy;
  };

  const hierarchy = buildHierarchy();
  const generations = Object.keys(hierarchy).map(Number).sort();
  
  // Calculate positions for each generation
  const calculatePositions = () => {
    const positions: { [unitId: string]: { x: number; y: number } } = {};
    const generationWidth = 300; // Base width per generation level
    
    generations.forEach((gen, genIndex) => {
      const units = hierarchy[gen];
      const startX = -(units.length - 1) * generationWidth / 2;
      
      units.forEach((unit, unitIndex) => {
        positions[unit.id] = {
          x: startX + unitIndex * generationWidth,
          y: genIndex * 200
        };
      });
    });
    
    return positions;
  };

  const positions = calculatePositions();

  // Find founder unit
  const getFounderUnit = (): FamilyUnit | undefined => {
    return Array.from(familyUnits.values()).find(unit => 
      unit.members.some(member => member.is_founder)
    );
  };

  // Get children of a unit
  const getChildren = (parentUnit: FamilyUnit): FamilyUnit[] => {
    return parentUnit.childUnits
      .map(childId => familyUnits.get(childId))
      .filter(Boolean) as FamilyUnit[];
  };

  // Render family unit box
  const renderFamilyUnit = (unit: FamilyUnit, position: { x: number; y: number }) => {
    if (unit.type === 'married' && unit.members.length === 2) {
      const [husband, wife] = unit.members;
      return (
        <div
          key={unit.id}
          className="absolute flex flex-col items-center"
          style={{
            left: `calc(50% + ${position.x}px)`,
            top: `${position.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <Card className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-emerald-300 dark:border-emerald-600 shadow-xl min-w-[280px]">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-blue-300">
                  {husband.image_url ? (
                    <AvatarImage src={husband.image_url} alt={husband.name} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 text-blue-800 font-bold">
                      {husband.name.slice(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{husband.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">الزوج</p>
              </div>
              
              <Heart className="h-8 w-8 text-pink-500 animate-pulse" />
              
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-pink-300">
                  {wife.image_url ? (
                    <AvatarImage src={wife.image_url} alt={wife.name} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-pink-500/30 to-pink-600/30 text-pink-800 font-bold">
                      {wife.name.slice(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{wife.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">الزوجة</p>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                <Users className="h-3 w-3 mr-1" />
                عائلة {husband.name}
              </Badge>
            </div>
          </Card>
          
          {/* Connection point for children */}
          <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-transparent"></div>
        </div>
      );
    } else {
      const member = unit.members[0];
      return (
        <div
          key={unit.id}
          className="absolute flex flex-col items-center"
          style={{
            left: `calc(50% + ${position.x}px)`,
            top: `${position.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <Card className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-amber-300 dark:border-amber-600 shadow-xl min-w-[200px]">
            <div className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-amber-400">
                {member.image_url ? (
                  <AvatarImage src={member.image_url} alt={member.name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-amber-400/30 to-amber-600/30 text-amber-800 font-bold text-lg">
                    {member.name.slice(0, 2)}
                  </AvatarFallback>
                )}
              </Avatar>
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{member.name}</h3>
              <Badge variant="outline" className="text-xs mt-2">
                {member.gender === 'male' ? 'ذكر' : 'أنثى'}
              </Badge>
              {member.birth_date && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {new Date(member.birth_date).getFullYear()}
                </p>
              )}
            </div>
          </Card>
          
          {/* Connection point for children */}
          <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-transparent"></div>
        </div>
      );
    }
  };

  // Render connection lines
  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    
    // Group children by parent
    const childrenByParent = new Map<string, FamilyUnit[]>();
    
    generations.forEach((gen, genIndex) => {
      if (genIndex === 0) return; // Skip founder generation
      
      const units = hierarchy[gen];
      
      units.forEach(unit => {
        if (!unit.parentUnitId) return;
        
        if (!childrenByParent.has(unit.parentUnitId)) {
          childrenByParent.set(unit.parentUnitId, []);
        }
        childrenByParent.get(unit.parentUnitId)!.push(unit);
      });
    });
    
    // Draw connections for each parent
    childrenByParent.forEach((children, parentId) => {
      const parentPosition = positions[parentId];
      if (!parentPosition || children.length === 0) return;
      
      // Calculate connection points - adjust for SVG coordinate system
      const parentCenterX = chartWidth / 2 + parentPosition.x;
      const parentBottomY = parentPosition.y + 140; // Below parent box
      const distributionY = parentBottomY + 30; // Horizontal distribution line
      
      if (children.length === 1) {
        // Direct connection for single child
        const child = children[0];
        const childPosition = positions[child.id];
        if (!childPosition) return;
        
        const childCenterX = chartWidth / 2 + childPosition.x;
        const childTopY = childPosition.y - 6;
        
        connections.push(
          <g key={`single-connection-${child.id}`}>
            {/* Vertical line from parent down */}
            <line
              x1={parentCenterX}
              y1={parentBottomY}
              x2={parentCenterX}
              y2={distributionY}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            {/* Horizontal line to child */}
            <line
              x1={parentCenterX}
              y1={distributionY}
              x2={childCenterX}
              y2={distributionY}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            {/* Vertical line down to child */}
            <line
              x1={childCenterX}
              y1={distributionY}
              x2={childCenterX}
              y2={childTopY}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
          </g>
        );
      } else {
        // Multiple children - org chart style
        const childPositions = children.map(child => positions[child.id]).filter(Boolean);
        const leftmostX = Math.min(...childPositions.map(pos => chartWidth / 2 + pos!.x));
        const rightmostX = Math.max(...childPositions.map(pos => chartWidth / 2 + pos!.x));
        
        connections.push(
          <g key={`multi-connection-${parentId}`}>
            {/* Vertical line from parent down */}
            <line
              x1={parentCenterX}
              y1={parentBottomY}
              x2={parentCenterX}
              y2={distributionY}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            
            {/* Horizontal distribution line */}
            <line
              x1={leftmostX}
              y1={distributionY}
              x2={rightmostX}
              y2={distributionY}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            
            {/* Vertical lines to each child */}
            {children.map(child => {
              const childPosition = positions[child.id];
              if (!childPosition) return null;
              
              const childCenterX = chartWidth / 2 + childPosition.x;
              const childTopY = childPosition.y - 6;
              
              return (
                <line
                  key={`child-line-${child.id}`}
                  x1={childCenterX}
                  y1={distributionY}
                  x2={childCenterX}
                  y2={childTopY}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
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
        <div>
          <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">لا توجد بيانات عائلة لعرضها</p>
        </div>
      </div>
    );
  }

  const founderUnit = getFounderUnit();
  if (!founderUnit) return null;

  const chartWidth = Math.max(1200, generations.length * 400);
  const chartHeight = Math.max(800, generations.length * 200 + 200);

  return (
    <div 
      className="relative w-full overflow-auto bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg border border-emerald-200/30 dark:border-emerald-700/30"
      style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
    >
      <div 
        className="relative mx-auto"
        style={{ width: chartWidth, height: chartHeight }}
      >
        {/* SVG for connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height="100%"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          {renderConnections()}
        </svg>

        {/* Render all family units */}
        {Array.from(familyUnits.values()).map(unit => {
          const position = positions[unit.id];
          if (!position) return null;
          return renderFamilyUnit(unit, position);
        })}
      </div>
    </div>
  );
};