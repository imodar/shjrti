import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users } from "lucide-react";
import { MemberCard } from "@/components/shared/MemberCard";

interface FamilyMembersListProps {
  familyMembers: any[];
  familyMarriages: any[];
  readOnly?: boolean;
  onMemberClick?: (member: any) => void;
  onAddClick?: () => void;
  onEditClick?: (member: any) => void;
  onDeleteClick?: (member: any) => void;
}

export const FamilyMembersList: React.FC<FamilyMembersListProps> = ({
  familyMembers,
  familyMarriages,
  readOnly = false,
  onMemberClick,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [generationFilter, setGenerationFilter] = useState<string>("all");

  // Calculate generations
  const memberGenerations = useMemo(() => {
    const generationMap = new Map();
    
    // Assign generation 1 to founders
    familyMembers.forEach(member => {
      if (member.isFounder || member.is_founder) {
        generationMap.set(member.id, 1);
      }
    });
    
    // Calculate generations based on parents
    let changed = true;
    let iterations = 0;
    const maxIterations = 50;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (!generationMap.has(member.id)) {
          const fatherId = member.fatherId || member.father_id;
          const motherId = member.motherId || member.mother_id;
          
          if (fatherId || motherId) {
            const fatherGen = fatherId ? generationMap.get(fatherId) : undefined;
            const motherGen = motherId ? generationMap.get(motherId) : undefined;
            
            if (fatherGen !== undefined || motherGen !== undefined) {
              const parentGen = Math.max(fatherGen || 0, motherGen || 0);
              generationMap.set(member.id, parentGen + 1);
              changed = true;
            }
          }
        }
      });
    }
    
    // Assign spouses to same generation
    familyMarriages.forEach(marriage => {
      const husbandGen = generationMap.get(marriage.husband_id);
      const wifeGen = generationMap.get(marriage.wife_id);
      
      if (husbandGen && !wifeGen) {
        generationMap.set(marriage.wife_id, husbandGen);
      } else if (wifeGen && !husbandGen) {
        generationMap.set(marriage.husband_id, wifeGen);
      }
    });
    
    return generationMap;
  }, [familyMembers, familyMarriages]);

  // Filter members
  const filteredMembers = useMemo(() => {
    return familyMembers.filter(member => {
      const matchesSearch = 
        (member.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.first_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.last_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const memberGen = memberGenerations.get(member.id);
      const matchesGeneration = generationFilter === "all" || 
        (memberGen && memberGen.toString() === generationFilter);
      
      return matchesSearch && matchesGeneration;
    });
  }, [familyMembers, searchQuery, generationFilter, memberGenerations]);

  // Get unique generations
  const generations = useMemo(() => {
    const gens = new Set<number>();
    memberGenerations.forEach(gen => gens.add(gen));
    return Array.from(gens).sort((a, b) => a - b);
  }, [memberGenerations]);

  // Helper function for gender colors
  const getGenderColor = (gender: string) => {
    return gender === "male" 
      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" 
      : "bg-pink-100 text-pink-600 dark:bg-pink-900/20";
  };

  // Dummy handlers for readOnly mode
  const handleViewMember = (member: any) => onMemberClick?.(member);
  const handleEditMember = (member: any) => !readOnly && onEditClick?.(member);
  const handleDeleteMember = (member: any) => !readOnly && onDeleteClick?.(member);
  const handleSpouseEditAttempt = () => {};
  const checkIfMemberIsSpouse = () => false;

  return (
    <div className="space-y-6">

      {/* Filters */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-3">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث عن عضو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Generation Filter */}
            <Select value={generationFilter} onValueChange={setGenerationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الجيل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأجيال</SelectItem>
                {generations.map(gen => (
                  <SelectItem key={gen} value={gen.toString()}>
                    الجيل {gen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredMembers.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              familyMembers={familyMembers}
              marriages={familyMarriages}
              onViewMember={handleViewMember}
              onEditMember={handleEditMember}
              onDeleteMember={handleDeleteMember}
              onSpouseEditAttempt={handleSpouseEditAttempt}
              checkIfMemberIsSpouse={checkIfMemberIsSpouse}
              getGenderColor={getGenderColor}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              لا توجد نتائج
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              لم يتم العثور على أعضاء مطابقين لمعايير البحث
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
