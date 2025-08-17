import React, { useState, useMemo } from 'react';
import { Search, Plus, Users, ChevronDown, ChevronRight, Heart, Clock, TreePine, Sparkles, ArrowRight, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FamilyMember {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  gender: string;
  is_alive: boolean;
  is_founder: boolean;
  father_id?: string;
  mother_id?: string;
  spouse_id?: string;
  image_url?: string;
  birth_date?: string;
  death_date?: string;
  biography?: string;
}

interface InnovativeFamilyViewProps {
  members: FamilyMember[];
  familyMembers: FamilyMember[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  memberListLoading: boolean;
  formMode: string;
  onAddMember: () => void;
  packageData: any;
  getAdditionalInfo: (member: FamilyMember) => string;
  getGenderColor: (member: FamilyMember) => string;
  onMemberClick: (member: FamilyMember) => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (member: FamilyMember) => void;
}

// Family relationship clusters
const getRelationshipCluster = (member: FamilyMember, allMembers: FamilyMember[]) => {
  // Find spouse
  const spouse = allMembers.find(m => m.id === member.spouse_id);
  
  // Find children
  const children = allMembers.filter(m => 
    m.father_id === member.id || m.mother_id === member.id
  );
  
  // Find parents
  const father = allMembers.find(m => m.id === member.father_id);
  const mother = allMembers.find(m => m.id === member.mother_id);
  
  // Find siblings
  const siblings = allMembers.filter(m => 
    m.id !== member.id && 
    ((m.father_id && m.father_id === member.father_id) || 
     (m.mother_id && m.mother_id === member.mother_id))
  );

  return {
    member,
    spouse,
    children,
    parents: [father, mother].filter(Boolean),
    siblings,
    hasRelationships: !!(spouse || children.length || father || mother || siblings.length)
  };
};

// Timeline calculation
const getTimelinePosition = (member: FamilyMember) => {
  if (member.birth_date) {
    const birthYear = new Date(member.birth_date).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = member.is_alive ? currentYear - birthYear : 
      member.death_date ? new Date(member.death_date).getFullYear() - birthYear : currentYear - birthYear;
    
    return {
      birthYear,
      age,
      era: birthYear < 1970 ? 'قديم' : birthYear < 2000 ? 'متوسط' : 'حديث'
    };
  }
  return { birthYear: 0, age: 0, era: 'غير محدد' };
};

export function InnovativeFamilyView({
  members,
  familyMembers,
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  memberListLoading,
  formMode,
  onAddMember,
  packageData,
  getAdditionalInfo,
  getGenderColor,
  onMemberClick,
  onEditMember,
  onDeleteMember
}: InnovativeFamilyViewProps) {
  const [viewMode, setViewMode] = useState<'relationships' | 'timeline' | 'constellation'>('relationships');
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Create relationship clusters
  const relationshipClusters = useMemo(() => {
    const clusters = new Map();
    const processedMembers = new Set();
    
    members.forEach(member => {
      if (processedMembers.has(member.id)) return;
      
      const cluster = getRelationshipCluster(member, familyMembers);
      if (cluster.hasRelationships) {
        // Mark all related members as processed
        [cluster.member, cluster.spouse, ...cluster.children, ...cluster.parents, ...cluster.siblings]
          .filter(Boolean)
          .forEach(m => processedMembers.add(m.id));
        
        clusters.set(member.id, cluster);
      }
    });
    
    // Add remaining members as individual clusters
    members.forEach(member => {
      if (!processedMembers.has(member.id)) {
        clusters.set(member.id, getRelationshipCluster(member, familyMembers));
      }
    });
    
    return Array.from(clusters.values());
  }, [members, familyMembers]);

  // Timeline groups
  const timelineGroups = useMemo(() => {
    const groups = {
      'قديم': [],
      'متوسط': [],
      'حديث': [],
      'غير محدد': []
    };
    
    members.forEach(member => {
      const timeline = getTimelinePosition(member);
      groups[timeline.era].push({ member, timeline });
    });
    
    // Sort by birth year within each group
    Object.keys(groups).forEach(era => {
      groups[era].sort((a, b) => a.timeline.birthYear - b.timeline.birthYear);
    });
    
    return groups;
  }, [members]);

  // Constellation view (circular layout)
  const constellationData = useMemo(() => {
    const founders = members.filter(m => m.is_founder);
    const others = members.filter(m => !m.is_founder);
    
    return {
      center: founders,
      rings: [
        others.filter(m => m.father_id || m.mother_id), // Children
        others.filter(m => !m.father_id && !m.mother_id && !m.is_founder) // Others
      ]
    };
  }, [members]);

  const renderMemberCard = (member: FamilyMember, size: 'sm' | 'md' | 'lg' = 'md') => {
    const memberName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim();
    const additionalInfo = getAdditionalInfo(member);
    
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-12 w-12',
      lg: 'h-16 w-16'
    };

    return (
      <div
        key={member.id}
        className={`group relative cursor-pointer transition-all duration-300 hover:scale-105 ${
          size === 'lg' ? 'p-4' : size === 'md' ? 'p-3' : 'p-2'
        }`}
        onClick={() => onMemberClick(member)}
      >
        <div className={`
          relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 
          rounded-2xl border-2 border-gray-200 dark:border-gray-700 
          hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10
          ${size === 'lg' ? 'min-h-[120px]' : size === 'md' ? 'min-h-[100px]' : 'min-h-[80px]'}
        `}>
          {/* Floating avatar */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Avatar className={`${sizeClasses[size]} border-4 border-white dark:border-gray-800 shadow-lg`}>
              <AvatarImage src={member.image_url} alt={memberName} />
              <AvatarFallback className={`${getGenderColor(member)} font-bold`}>
                {memberName.split(' ').slice(0, 2).map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Content */}
          <div className={`pt-${size === 'lg' ? '8' : size === 'md' ? '6' : '4'} text-center space-y-1`}>
            <h3 className={`font-bold text-foreground truncate ${
              size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'
            }`}>
              {memberName}
            </h3>
            
            {size !== 'sm' && (
              <>
                <div className="flex justify-center gap-1 flex-wrap">
                  {member.is_founder && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      👑 مؤسس
                    </Badge>
                  )}
                  {!member.is_alive && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      💐 متوفى
                    </Badge>
                  )}
                </div>
                
                {additionalInfo && size === 'lg' && (
                  <p className="text-xs text-muted-foreground truncate">
                    {additionalInfo}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Action buttons - appear on hover */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditMember(member);
              }}
              className="h-6 w-6 p-0 text-xs"
            >
              ✏️
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteMember(member);
              }}
              className="h-6 w-6 p-0 text-xs"
            >
              🗑️
            </Button>
          </div>

          {/* Connection indicator */}
          {member.spouse_id && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <Heart className="h-3 w-3 text-red-500 fill-current" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRelationshipCluster = (cluster: any) => {
    const { member, spouse, children, parents, siblings } = cluster;
    
    return (
      <Card key={member.id} className="relative overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          {/* Main couple */}
          <div className="flex justify-center gap-4 mb-4">
            {renderMemberCard(member, 'lg')}
            {spouse && (
              <>
                <div className="flex items-center justify-center">
                  <Heart className="h-6 w-6 text-red-500 fill-current animate-pulse" />
                </div>
                {renderMemberCard(spouse, 'lg')}
              </>
            )}
          </div>

          {/* Parents */}
          {parents.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 rotate-180" />
                الوالدين
              </h4>
              <div className="flex justify-center gap-2">
                {parents.map(parent => renderMemberCard(parent, 'md'))}
              </div>
            </div>
          )}

          {/* Children */}
          {children.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                الأطفال ({children.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {children.map(child => renderMemberCard(child, 'md'))}
              </div>
            </div>
          )}

          {/* Siblings */}
          {siblings.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                الأشقاء ({siblings.length})
              </h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {siblings.map(sibling => renderMemberCard(sibling, 'sm'))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTimelineView = () => (
    <div className="space-y-6">
      {Object.entries(timelineGroups).map(([era, members]) => {
        if (members.length === 0) return null;
        
        return (
          <div key={era} className="relative">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 mb-4">
              <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2">
                <Clock className="h-5 w-5" />
                الجيل {era} ({members.length} أعضاء)
              </h3>
            </div>
            
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary to-primary/30 rounded-full"></div>
            
            <div className="space-y-8">
              {members.map(({ member, timeline }, index) => (
                <div key={member.id} className={`flex items-center gap-4 ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                }`}>
                  <div className="flex-1 max-w-sm">
                    {renderMemberCard(member, 'lg')}
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="relative">
                    <div className="w-4 h-4 bg-primary rounded-full border-4 border-background shadow-lg"></div>
                    {timeline.birthYear > 0 && (
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <Badge variant="secondary" className="text-xs">
                          {timeline.birthYear}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 max-w-sm">
                    {/* Empty space for alternating layout */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderConstellationView = () => (
    <div className="relative min-h-[600px] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-3xl p-8 overflow-hidden">
      {/* Center - Founders */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex gap-4">
          {constellationData.center.map(founder => (
            <div key={founder.id} className="relative animate-pulse">
              {renderMemberCard(founder, 'lg')}
              <div className="absolute -inset-4 border-2 border-yellow-400 rounded-full opacity-50"></div>
            </div>
          ))}
        </div>
      </div>

      {/* First ring - Direct children */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {constellationData.rings[0].map((member, index) => {
          const angle = (360 / constellationData.rings[0].length) * index;
          const radius = 200;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          
          return (
            <div
              key={member.id}
              className="absolute"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              {renderMemberCard(member, 'md')}
              {/* Connection line */}
              <div
                className="absolute top-1/2 left-1/2 w-1 bg-primary/30 origin-left"
                style={{
                  height: '2px',
                  width: `${radius}px`,
                  transform: `translate(-${radius}px, -1px) rotate(${angle + 180}deg)`,
                }}
              ></div>
            </div>
          );
        })}
      </div>

      {/* Second ring - Others */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {constellationData.rings[1].map((member, index) => {
          const angle = (360 / Math.max(constellationData.rings[1].length, 1)) * index;
          const radius = 350;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          
          return (
            <div
              key={member.id}
              className="absolute"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              {renderMemberCard(member, 'sm')}
            </div>
          );
        })}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );

  if (memberListLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="🔍 ابحث في الذكريات والأسماء..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-full border-2 border-primary/20 focus:border-primary/50"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={selectedFilter} onValueChange={onFilterChange}>
            <SelectTrigger className="w-fit">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="تصفية ذكية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأعضاء</SelectItem>
              <SelectItem value="alive">الأحياء ❤️</SelectItem>
              <SelectItem value="deceased">ذكريات الراحلين 🕊️</SelectItem>
              <SelectItem value="male">الرجال 👨</SelectItem>
              <SelectItem value="female">النساء 👩</SelectItem>
              <SelectItem value="founders">المؤسسون 👑</SelectItem>
            </SelectContent>
          </Select>

          {formMode === 'view' && (
            <Button 
              onClick={onAddMember} 
              disabled={packageData && familyMembers.length >= packageData.max_family_members}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Plus className="h-4 w-4" />
              {packageData && familyMembers.length >= packageData.max_family_members 
                ? `💎 حد الباقة (${packageData.max_family_members})`
                : '✨ إضافة ذكرى جديدة'
              }
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/50">
          <TabsTrigger value="relationships" className="rounded-full flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">العلاقات</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-full flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">الخط الزمني</span>
          </TabsTrigger>
          <TabsTrigger value="constellation" className="rounded-full flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">الكوكبة</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="relationships" className="space-y-6">
          {relationshipClusters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TreePine className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">لا توجد ذكريات بعد</h3>
              <p>ابدأ ببناء شجرة عائلتك وإضافة الذكريات الجميلة</p>
            </div>
          ) : (
            <div className="space-y-8">
              {relationshipClusters.map(renderRelationshipCluster)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          {renderTimelineView()}
        </TabsContent>

        <TabsContent value="constellation">
          {renderConstellationView()}
        </TabsContent>
      </Tabs>
    </div>
  );
}