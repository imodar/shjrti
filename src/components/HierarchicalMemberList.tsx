import React, { useState, useMemo } from 'react';
import { Search, Plus, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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

interface HierarchicalMemberListProps {
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

// Generation icons mapping
const GENERATION_ICONS = {
  0: '👴', // Great grandparents and above
  1: '👨', // Grandparents  
  2: '👥', // Parents
  3: '👶', // Children
  4: '👼', // Grandchildren and below
};

// Generation colors
const GENERATION_COLORS = {
  0: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
  1: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
  2: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
  3: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
  4: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700',
};

const GENERATION_NAMES = {
  0: 'الأجداد العظام',
  1: 'الأجداد',
  2: 'الآباء والأمهات',
  3: 'الأبناء والبنات',
  4: 'الأحفاد',
};

export function HierarchicalMemberList({
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
}: HierarchicalMemberListProps) {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true
  });

  // Calculate generation for each member
  const calculateGeneration = (member: FamilyMember, allMembers: FamilyMember[], memo: Map<string, number> = new Map()): number => {
    if (memo.has(member.id)) {
      return memo.get(member.id)!;
    }

    // If founder, they are generation 2 (parents level)
    if (member.is_founder) {
      memo.set(member.id, 2);
      return 2;
    }

    // If no parents, assume they are founders (generation 2)
    if (!member.father_id && !member.mother_id) {
      memo.set(member.id, 2);
      return 2;
    }

    // Find parents
    const father = allMembers.find(m => m.id === member.father_id);
    const mother = allMembers.find(m => m.id === member.mother_id);

    let parentGeneration = 2; // Default to parent generation

    if (father) {
      parentGeneration = Math.max(parentGeneration, calculateGeneration(father, allMembers, memo));
    }
    if (mother) {
      parentGeneration = Math.max(parentGeneration, calculateGeneration(mother, allMembers, memo));
    }

    const generation = Math.min(4, parentGeneration + 1); // Children are one generation below parents
    memo.set(member.id, generation);
    return generation;
  };

  // Group members by generation
  const membersByGeneration = useMemo(() => {
    const groups: Record<number, FamilyMember[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    
    members.forEach(member => {
      const generation = calculateGeneration(member, familyMembers);
      groups[generation].push(member);
    });

    // Sort each generation by name
    Object.keys(groups).forEach(gen => {
      groups[parseInt(gen)].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    });

    return groups;
  }, [members, familyMembers]);

  const toggleSection = (generation: number) => {
    setOpenSections(prev => ({
      ...prev,
      [generation]: !prev[generation]
    }));
  };

  const renderMemberCard = (member: FamilyMember) => {
    const memberName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim();
    const additionalInfo = getAdditionalInfo(member);
    
    return (
      <Card key={member.id} className={`transition-all duration-200 hover:shadow-md border-2 ${getGenderColor(member)}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-white shadow-md">
              <AvatarImage src={member.image_url} alt={memberName} />
              <AvatarFallback className="text-sm font-medium">
                {memberName.split(' ').slice(0, 2).map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0" onClick={() => onMemberClick(member)}>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate text-foreground">
                  {memberName}
                </h3>
                {member.is_founder && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    مؤسس
                  </Badge>
                )}
                {!member.is_alive && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-muted-foreground/30">
                    متوفى
                  </Badge>
                )}
              </div>
              
              {additionalInfo && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {additionalInfo}
                </p>
              )}

              <div className="flex gap-1 text-xs text-muted-foreground">
                {member.birth_date && (
                  <span className="bg-muted/50 px-2 py-0.5 rounded-full">
                    ولد: {new Date(member.birth_date).getFullYear()}
                  </span>
                )}
                {member.death_date && (
                  <span className="bg-muted/50 px-2 py-0.5 rounded-full">
                    توفي: {new Date(member.death_date).getFullYear()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditMember(member);
                }}
                className="h-8 w-8 p-0 hover:bg-primary/10"
              >
                ✏️
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMember(member);
                }}
                className="h-8 w-8 p-0 hover:bg-destructive/10"
              >
                🗑️
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGenerationSection = (generation: number) => {
    const generationMembers = membersByGeneration[generation];
    if (generationMembers.length === 0) return null;

    const isOpen = openSections[generation];
    const icon = GENERATION_ICONS[generation] || '👥';
    const name = GENERATION_NAMES[generation] || `الجيل ${generation}`;
    const colorClass = GENERATION_COLORS[generation] || 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';

    return (
      <Collapsible key={generation} open={isOpen} onOpenChange={() => toggleSection(generation)}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-between p-4 h-auto rounded-xl ${colorClass} hover:opacity-80 transition-all duration-200`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div className="text-right">
                <h3 className="font-bold text-base text-foreground">{name}</h3>
                <p className="text-sm text-muted-foreground">
                  {generationMembers.length} {generationMembers.length === 1 ? 'عضو' : 'أعضاء'}
                </p>
              </div>
            </div>
            {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-3 mt-3 mr-8">
          {generationMembers.map(renderMemberCard)}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث عن عضو..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter */}
      <Select value={selectedFilter} onValueChange={onFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="تصفية حسب..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع الأعضاء</SelectItem>
          <SelectItem value="alive">الأحياء</SelectItem>
          <SelectItem value="deceased">المتوفين</SelectItem>
          <SelectItem value="male">الذكور</SelectItem>
          <SelectItem value="female">الإناث</SelectItem>
          <SelectItem value="founders">المؤسسون</SelectItem>
        </SelectContent>
      </Select>

      {/* Add Member Button */}
      {formMode === 'view' && (
        <Button 
          onClick={onAddMember} 
          disabled={packageData && familyMembers.length >= packageData.max_family_members}
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {packageData && familyMembers.length >= packageData.max_family_members 
            ? `تم الوصول للحد الأقصى (${packageData.max_family_members} أعضاء)`
            : 'إضافة عضو جديد'
          }
        </Button>
      )}

      {/* Hierarchical Member List */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
        {memberListLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 rounded-xl border-2 border-dashed border-muted/50 bg-muted/10">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          ))
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد أعضاء</p>
          </div>
        ) : (
          Object.keys(membersByGeneration)
            .map(Number)
            .sort((a, b) => a - b)
            .map(renderGenerationSection)
        )}
      </div>
    </div>
  );
}