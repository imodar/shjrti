import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Users, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, Skull } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
          <SimpleMemberCard
            key={member.id}
            member={member}
            generation={memberGenerations.get(member.id) || 1}
            onClick={() => onMemberClick?.(member)}
            readOnly={readOnly}
            familyMembers={familyMembers}
            marriages={familyMarriages}
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
  familyMembers: any[];
  marriages: any[];
}

const SimpleMemberCard: React.FC<SimpleMemberCardProps> = ({ 
  member, 
  generation, 
  onClick, 
  readOnly,
  familyMembers,
  marriages,
}) => {
  const memberImageSrc = useResolvedImageUrl(member.image || member.image_url);
  
  const getGenderColor = (gender: string) => {
    return gender === "male" 
      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" 
      : "bg-pink-100 text-pink-600 dark:bg-pink-900/20";
  };

  // Generate parentage display (son of X son of Y)
  const renderParentage = () => {
    const father = familyMembers.find((m) => m.id === member.father_id);
    const mother = familyMembers.find((m) => m.id === member.mother_id);
    
    // Prioritize mother's lineage if she's from the main family
    const primaryParent = mother?.father_id ? mother : father;
    
    if (!primaryParent) return null;

    const grandfather = familyMembers.find(
      (m) => m.id === primaryParent.father_id
    );

    const relationship = member.gender === "male" ? "ابن" : "بنت";
    const parentRelationship = primaryParent.gender === "male" ? "ابن" : "بنت";
    const grandfatherFirstName = grandfather?.first_name || grandfather?.name?.split(' ')[0] || grandfather?.name;
    const primaryParentFirstName = primaryParent.first_name || primaryParent.name?.split(' ')[0] || primaryParent.name;

    if (grandfather) {
      return `${relationship} ${primaryParentFirstName} ${parentRelationship === "ابن" ? "ابن" : "بن"} ${grandfatherFirstName}`;
    }
    return `${relationship} ${primaryParentFirstName}`;
  };

  // Generate spouse info for non-family members
  const renderSpouseInfo = () => {
    if (member.is_founder || member.isFounder) {
      return "الجد الأكبر";
    }

    const marriage = marriages.find(
      (m) =>
        (m.husband_id === member.id || m.wife_id === member.id) &&
        m.is_active
    );

    if (!marriage) return null;

    const spouseId = marriage.husband_id === member.id ? marriage.wife_id : marriage.husband_id;
    const spouse = familyMembers.find((m) => m.id === spouseId);

    if (!spouse) return null;

    const spouseRelation = member.gender === "male" ? "زوج" : "زوجة";
    
    // If spouse has family lineage, show it
    const spouseFather = familyMembers.find((m) => m.id === spouse.father_id);
    if (spouseFather) {
      const spouseRelationship = spouse.gender === "male" ? "ابن" : "ابنة";
      return `${spouseRelation} ${spouse.first_name || spouse.name} ${spouseRelationship} ${spouseFather.first_name || spouseFather.name}`;
    }

    return `${spouseRelation} ${spouse.first_name || spouse.name}`;
  };

  return (
    <TooltipProvider>
      <Card 
        className="relative cursor-pointer bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 hover:bg-white/95 dark:hover:bg-gray-800/95 transition-all duration-300 hover:shadow-lg rounded-3xl overflow-hidden"
        onClick={onClick}
      >
        {/* Black ribbon for deceased members */}
        {(member.death_date || member.deathDate || member.is_alive === false) && (
          <div className="absolute top-0 left-0 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="w-12 h-12 bg-black cursor-help rounded-tl-[24px]"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 0 100%)'
                  }}
                ></div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>متوفى</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3 min-h-[80px]">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="h-12 w-12 flex-shrink-0">
                {memberImageSrc && <AvatarImage src={memberImageSrc} alt={member.name} />}
                <AvatarFallback className={getGenderColor(member.gender)}>
                  {(member.name || member.first_name || "؟").charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 space-y-1">
                {/* Individual Name */}
                <h3 className="font-semibold text-base font-arabic leading-tight">
                  {(() => {
                    // Check if this member is married into the family (actual spouse from outside)
                    const marriage = marriages?.find(m => m.husband_id === member.id || m.wife_id === member.id);
                    const memberHasFamilyFather = member.father_id && familyMembers?.find(m => m?.id === member.father_id);

                    // Show full name for spouses who married into the family (not blood family members)
                    const isSpouseFromOutside = marriage && !memberHasFamilyFather && !member.is_founder;
                    if (isSpouseFromOutside) {
                      // For spouses from outside: show full name (first_name + last_name or complete name)
                      if (member.first_name && member.last_name) {
                        return `${member.first_name} ${member.last_name}`;
                      }
                      return member.name || member.first_name || "غير معروف";
                    } else {
                      // For all family members: show first name + family name for descendants
                      const firstName = member.first_name || member.name?.split(' ')[0] || member.name || "غير معروف";
                      const isDescendant = !member.is_founder && memberHasFamilyFather;
                      
                      if (isDescendant) {
                        // Show first name with family name (if available)
                        const familyName = member.last_name || "الشهيد";
                        return `${firstName} ${familyName}`;
                      }
                      return firstName;
                    }
                  })()}
                </h3>
                
                {/* Father + Grandfather names */}
                {(() => {
                  if (member.is_founder) return null;
                  
                  const mother = familyMembers?.find(m => m?.id === member.mother_id);
                  const father = familyMembers?.find(m => m?.id === member.father_id);
                  
                  // Check if mother is from Sheikh Saeed's family (has father_id in family tree)
                  const motherIsFromFamily = mother && mother.father_id && 
                                            familyMembers?.find(m => m?.id === mother.father_id);
                  
                  const genderTerm = member.gender === 'female' ? 'ابنة' : 'ابن';
                  
                  // If mother is from Sheikh Saeed's family, show mother's lineage
                  if (motherIsFromFamily) {
                    const motherName = mother.first_name || mother.name?.split(' ')[0] || mother.name;
                    const motherFather = familyMembers?.find(m => m?.id === mother.father_id);
                    
                    let lineage = motherName;
                    
                    if (motherFather) {
                      const motherFatherName = motherFather.first_name || motherFather.name?.split(' ')[0] || motherFather.name;
                      lineage += ` بنت ${motherFatherName}`;
                      
                      // Add grandfather if exists
                      const motherGrandfather = familyMembers?.find(m => m?.id === motherFather.father_id);
                      if (motherGrandfather) {
                        const motherGrandfatherName = motherGrandfather.first_name || motherGrandfather.name?.split(' ')[0] || motherGrandfather.name;
                        lineage += ` بن ${motherGrandfatherName}`;
                      }
                    }
                    
                    return <p className="text-sm text-primary truncate font-arabic">
                        {genderTerm} {lineage}
                      </p>;
                  }
                  
                  // Otherwise, show father's lineage
                  if (father) {
                    const fatherName = father.first_name || father.name?.split(' ')[0] || father.name;
                    const grandfather = familyMembers?.find(m => m?.id === father.father_id);
                    
                    let lineage = fatherName;
                    
                    if (grandfather) {
                      const grandfatherName = grandfather.first_name || grandfather.name?.split(' ')[0] || grandfather.name;
                      lineage += ` بن ${grandfatherName}`;
                    }
                    
                    return <p className="text-sm text-primary truncate font-arabic">
                        {genderTerm} {lineage}
                      </p>;
                  }
                  
                  return null;
                })()}
                
                {/* Spouse information - show founder text for founders, spouse info for non-family members */}
                {(() => {
                  // Show founder text for founders
                  const isFounder = member.is_founder || member.isFounder;
                  if (isFounder) {
                    return <p className="text-sm text-primary font-arabic whitespace-normal break-words">الجد الأكبر</p>;
                  }

                  // إذا كان العضو من داخل العائلة (له أب)، لا تعرض معلومات الزوج
                  const memberHasFamilyFather = member.father_id &&
                    familyMembers?.find(m => m?.id === member.father_id);
                  
                  if (memberHasFamilyFather) {
                    return null;
                  }

                  // فقط للأزواج من خارج العائلة: ابحث عن الزوج واعرض معلوماته
                  const marriage = marriages?.find(m => m.husband_id === member.id || m.wife_id === member.id);
                  if (!marriage) return null;

                  const spouseId = marriage.husband_id === member.id ? marriage.wife_id : marriage.husband_id;
                  const spouse = familyMembers?.find(m => m?.id === spouseId);
                  if (!spouse) return null;

                  // عرض معلومات الزوج بالتفصيل مع النسب
                  const spouseFather = familyMembers?.find(m => m?.id === spouse.father_id);
                  const spouseGrandfather = spouseFather ? familyMembers?.find(m => m?.id === spouseFather.father_id) : null;

                  const spouseName = spouse.first_name || spouse.name?.split(' ')[0] || spouse.name || '';
                  let spouseInfo = spouseName;
                  
                  if (spouseFather) {
                    const fatherFirstName = spouseFather.first_name || spouseFather.name?.split(' ')[0];
                    const genderTerm = spouse.gender === 'female' ? 'ابنة' : 'ابن';
                    spouseInfo += ` ${genderTerm} ${fatherFirstName}`;
                    
                    if (spouseGrandfather) {
                      const grandfatherFirstName = spouseGrandfather.first_name || spouseGrandfather.name?.split(' ')[0];
                      spouseInfo += ` ابن ${grandfatherFirstName}`;
                    }
                  }

                  const relationLabel = member.gender === 'male' ? 'زوج' : 'زوجة';
                  return <p className="text-sm text-primary font-arabic whitespace-normal break-words">{relationLabel} {spouseInfo}</p>;
                })()}
                  
                {/* Birth/Death date and other icons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const birthDate = member.birth_date || member.birthDate;
                    const deathDate = member.death_date || member.deathDate;
                    const isAlive = member.is_alive !== false && !deathDate;
                    const gender = member.gender;
                    
                    // حالة 1: لا يوجد تاريخ ولادة ولا وفاة
                    if (!birthDate && !deathDate) return null;
                    
                    // حالة 2: يوجد تاريخ وفاة فقط (بدون تاريخ ولادة)
                    if (!birthDate && deathDate) {
                      const deathText = gender === 'female' ? 'توفيت' : 'توفي';
                      return (
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          <Skull className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-arabic">
                            {deathText} في <DateDisplay date={deathDate} />
                          </span>
                        </div>
                      );
                    }
                    
                    // حالة 3: يوجد تاريخ ولادة + العضو متوفي + لا يوجد تاريخ وفاة
                    if (birthDate && !isAlive && !deathDate) {
                      const birthText = gender === 'female' ? 'ولدت' : 'ولد';
                      return (
                        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                          <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs text-blue-700 dark:text-blue-300 font-arabic">
                            {birthText} في <DateDisplay date={birthDate} />
                          </span>
                        </div>
                      );
                    }
                    
                    // حالة 4: يوجد تاريخ ولادة + العضو على قيد الحياة
                    if (birthDate && isAlive) {
                      const birthText = gender === 'female' ? 'ولدت' : 'ولد';
                      const age = Math.floor((new Date().getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
                      return (
                        <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                          <Calendar className="h-3 w-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-green-700 dark:text-green-300 font-arabic">
                            {birthText} في <DateDisplay date={birthDate} /> - {age} سنة
                          </span>
                        </div>
                      );
                    }
                    
                    // حالة 5: يوجد تاريخ ولادة + تاريخ وفاة
                    if (birthDate && deathDate) {
                      const birthText = gender === 'female' ? 'ولدت' : 'ولد';
                      const deathText = gender === 'female' ? 'توفيت' : 'توفي';
                      const age = Math.floor((new Date(deathDate).getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
                      const birthYear = new Date(birthDate).getFullYear();
                      const deathYear = new Date(deathDate).getFullYear();
                      return (
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                          <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs text-amber-700 dark:text-amber-300 font-arabic">
                            {birthText} في {birthYear} - {deathText} في {deathYear} - {age} سنة
                          </span>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                  
                  {(member.is_founder || member.isFounder) && (
                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                      <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm text-yellow-600 dark:text-yellow-300 font-medium font-arabic">المؤسس</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
