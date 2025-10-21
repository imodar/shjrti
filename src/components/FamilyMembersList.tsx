import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Users, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, MapPin } from "lucide-react";
import { DateDisplay } from "@/components/DateDisplay";
import { useResolvedImageUrl } from "@/utils/useResolvedImageUrl";

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
  const [genderFilter, setGenderFilter] = useState<string>("all");
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
      
      const matchesGender = genderFilter === "all" || member.gender === genderFilter;
      
      const memberGen = memberGenerations.get(member.id);
      const matchesGeneration = generationFilter === "all" || 
        (memberGen && memberGen.toString() === generationFilter);
      
      return matchesSearch && matchesGender && matchesGeneration;
    });
  }, [familyMembers, searchQuery, genderFilter, generationFilter, memberGenerations]);

  // Get unique generations
  const generations = useMemo(() => {
    const gens = new Set<number>();
    memberGenerations.forEach(gen => gens.add(gen));
    return Array.from(gens).sort((a, b) => a - b);
  }, [memberGenerations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              قائمة الأعضاء
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredMembers.length} من {familyMembers.length} عضو
            </p>
          </div>
        </div>
        {!readOnly && onAddClick && (
          <Button
            onClick={onAddClick}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <UserPlus className="h-5 w-5 ml-2" />
            إضافة عضو
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث عن عضو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Gender Filter */}
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الجنس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="male">ذكور</SelectItem>
                <SelectItem value="female">إناث</SelectItem>
              </SelectContent>
            </Select>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map(member => (
            <SimpleMemberCard
              key={member.id}
              member={member}
              generation={memberGenerations.get(member.id) || 1}
              onClick={() => onMemberClick?.(member)}
              readOnly={readOnly}
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

// Simple Member Card Component
interface SimpleMemberCardProps {
  member: any;
  generation: number;
  onClick: () => void;
  readOnly: boolean;
}

const SimpleMemberCard: React.FC<SimpleMemberCardProps> = ({ member, generation, onClick, readOnly }) => {
  const memberImageSrc = useResolvedImageUrl(member.image || member.image_url);
  
  const getGenderColor = (gender: string) => {
    return gender === "male" 
      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" 
      : "bg-pink-100 text-pink-600 dark:bg-pink-900/20";
  };

  return (
    <Card 
      className="cursor-pointer bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 hover:shadow-lg transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            {memberImageSrc && <AvatarImage src={memberImageSrc} alt={member.name} />}
            <AvatarFallback className={getGenderColor(member.gender)}>
              {(member.name || member.first_name || "؟").charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">
              {member.name || `${member.first_name || ""} ${member.last_name || ""}`.trim() || "غير معروف"}
            </h3>
            
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge variant="secondary" className="text-xs">
                الجيل {generation}
              </Badge>
              
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {member.gender === "male" ? "ذكر" : "أنثى"}
              </span>
              
              {(member.is_founder || member.isFounder) && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Crown className="h-3 w-3" />
                  <span className="text-xs">مؤسس</span>
                </div>
              )}
            </div>
            
            {(member.birth_date || member.birthDate) && (
              <div className="flex items-center gap-1 mt-1 text-gray-600 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                <DateDisplay 
                  date={member.birth_date || member.birthDate} 
                  className="text-xs"
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
