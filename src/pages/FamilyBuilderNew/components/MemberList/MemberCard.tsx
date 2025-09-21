import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, UserIcon, Crown, Skull, Edit2, Trash2 } from "lucide-react";
import { DateDisplay } from "@/components/DateDisplay";
import { Member, Marriage } from "../../types/family.types";

interface MemberCardProps {
  member: Member;
  familyMembers: Member[];
  marriages: Marriage[];
  onViewMember: (member: Member) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
  onSpouseEditAttempt: (member: Member) => void;
  checkIfMemberIsSpouse: (member: Member) => boolean;
  getGenderColor: (gender: string) => string;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  familyMembers,
  marriages,
  onViewMember,
  onEditMember,
  onDeleteMember,
  onSpouseEditAttempt,
  checkIfMemberIsSpouse,
  getGenderColor
}) => {
  const generateMemberDisplayName = () => {
    const isSpouse = !member.father_id && !member.mother_id && !member.is_founder;
    if (isSpouse) {
      // For spouses: show first_name + last_name, or name if missing
      const firstName = member.first_name || '';
      const lastName = member.last_name || '';
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
      return (member as any).name || "غير معروف";
    } else {
      // For founders and other native family members: show first_name, or split name if missing
      return member.first_name || (member as any).name?.split(' ')[0] || (member as any).name || "غير معروف";
    }
  };

  const renderRelationship = () => {
    // Only show ابن/ابنة for blood family members (not founders, only descendants with fathers in the family)
    const memberHasFamilyFather = member.father_id && familyMembers?.find(m => m?.id === member.father_id);
    const isDescendant = !member.is_founder && memberHasFamilyFather;
    if (isDescendant) {
      return (
        <span className="text-xs text-muted-foreground font-normal">
          {member.gender === 'female' ? 'ابنة' : 'ابن'}
        </span>
      );
    }
    return null;
  };

  const renderParentage = () => {
    const father = familyMembers?.find(m => m?.id === member.father_id);
    const grandfather = father ? familyMembers?.find(m => m?.id === father.father_id) : null;
    if (father && grandfather) {
      const fatherFirstName = father.first_name || (father as any).name?.split(' ')[0] || (father as any).name;
      const grandfatherFirstName = grandfather.first_name || (grandfather as any).name?.split(' ')[0] || (grandfather as any).name;
      return (
        <p className="text-sm text-muted-foreground truncate font-arabic">
          {fatherFirstName} ابن {grandfatherFirstName}
        </p>
      );
    } else if (father) {
      const fatherFirstName = father.first_name || (father as any).name?.split(' ')[0] || (father as any).name;
      return (
        <p className="text-sm text-muted-foreground truncate font-arabic">
          {fatherFirstName}
        </p>
      );
    }
    return null;
  };

  const renderSpouseInfo = () => {
    // Show founder text for founders
    if (member.is_founder) {
      return (
        <p className="text-xs text-blue-600 dark:text-blue-400 truncate font-arabic">
          الجد الأكبر للعائلة
        </p>
      );
    }

    // Find marriage where this member is husband or wife
    const marriage = marriages?.find(m => 
      m.husband_id === member.id || m.wife_id === member.id
    );
    
    if (marriage) {
      // Determine if this member is the husband or wife
      const isHusband = marriage.husband_id === member.id;

      // Get spouse data
      let spouseId = isHusband ? marriage.wife_id : marriage.husband_id;
      let spouse = familyMembers?.find(m => m?.id === spouseId);

      if (spouse) {
        // Check if current member is a non-family member (married into the family)
        const memberHasFamilyFather = member.father_id && familyMembers?.find(m => m?.id === member.father_id);

        // Only show spouse info for non-family members (those without family fathers)
        if (!memberHasFamilyFather) {
          // Get spouse's father from familyMembers
          const spouseFather = familyMembers?.find(m => m?.id === spouse.father_id);

          // Build simplified spouse info: زوجة محمد ابن سعيد (first name only)
          const spouseName = spouse.first_name || (spouse as any).name?.split(' ')[0] || (spouse as any).name;
          let spouseInfo = spouseName;
          if (spouseFather) {
            const fatherFirstName = spouseFather.first_name || (spouseFather as any).name?.split(' ')[0] || (spouseFather as any).name;
            const genderTerm = spouse.gender === 'female' ? 'ابنة' : 'ابن';
            spouseInfo += ` ${genderTerm} ${fatherFirstName}`;
          }

          // Use زوج for husband, زوجة for wife (from member's perspective)
          const relationLabel = member.gender === 'male' ? 'زوج' : 'زوجة';
          return (
            <p className="text-xs text-blue-600 dark:text-blue-400 truncate font-arabic">
              {relationLabel} {spouseInfo}
            </p>
          );
        }
      }
    }
    return null;
  };

  return (
    <Card 
      className="group relative cursor-pointer bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 rounded-2xl overflow-hidden transform hover:-translate-y-1" 
      onClick={() => onViewMember(member)}
    >
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${member.is_founder ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : member.gender === 'male' ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-pink-400 to-rose-500'}`} />
      
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Avatar with status indicators */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-11 w-11 ring-2 ring-white dark:ring-gray-800 group-hover:ring-primary/20">
              <AvatarImage src={(member as any).image} className="object-cover" />
              <AvatarFallback className={`${getGenderColor(member.gender)} text-sm font-semibold`}>
                {((member as any).name || member.first_name || "؟").charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {/* Status badges */}
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              {member.is_founder && (
                <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-0.5">
                  <Crown className="h-2.5 w-2.5 text-white" />
                </div>
              )}
              {!(member as any).isAlive && (
                <div className="bg-gray-500 rounded-full p-0.5">
                  <Skull className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0 space-y-0.5">
            {/* Compact parentage display */}
            {renderParentage() && (
              <p className="text-xs text-muted-foreground/80 font-arabic leading-tight truncate">
                {(() => {
                  const father = familyMembers?.find(m => m?.id === member.father_id);
                  const grandfather = father ? familyMembers?.find(m => m?.id === father.father_id) : null;
                  if (father && grandfather) {
                    const fatherName = father.first_name || (father as any).name?.split(' ')[0] || (father as any).name;
                    const grandfatherName = grandfather.first_name || (grandfather as any).name?.split(' ')[0] || (grandfather as any).name;
                    return `${fatherName} ابن ${grandfatherName}`;
                  } else if (father) {
                    return father.first_name || (father as any).name?.split(' ')[0] || (father as any).name;
                  }
                  return null;
                })()}
              </p>
            )}
            
            {/* Member name with gender indicator */}
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm font-arabic leading-tight text-foreground group-hover:text-primary transition-colors truncate">
                {member.name || member.first_name || "غير معروف"}
              </h3>
              <div className="flex items-center gap-1">
                {member.gender === 'male' ? 
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-0.5">
                    <User className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                  </div> : 
                  <div className="bg-pink-100 dark:bg-pink-900/30 rounded-full p-0.5">
                    <UserIcon className="h-2.5 w-2.5 text-pink-600 dark:text-pink-400" />
                  </div>
                }
                {renderRelationship() && (
                  <span className="text-xs text-muted-foreground/70 font-normal">
                    {member.gender === 'female' ? 'ابنة' : 'ابن'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Spouse/founder info - compact */}
            {renderSpouseInfo() && (
              <p className="text-xs text-primary/70 dark:text-primary/60 font-arabic leading-tight truncate">
                {member.is_founder ? 'الجد الأكبر للعائلة' : (() => {
                  const marriage = marriages?.find(m => m.husband_id === member.id || m.wife_id === member.id);
                  if (marriage) {
                    const isHusband = marriage.husband_id === member.id;
                    const spouseId = isHusband ? marriage.wife_id : marriage.husband_id;
                    const spouse = familyMembers?.find(m => m?.id === spouseId);
                    const memberHasFamilyFather = member.father_id && familyMembers?.find(m => m?.id === member.father_id);
                    
                    if (spouse && !memberHasFamilyFather) {
                      const spouseName = spouse.first_name || (spouse as any).name?.split(' ')[0] || (spouse as any).name;
                      const relationLabel = member.gender === 'male' ? 'زوج' : 'زوجة';
                      return `${relationLabel} ${spouseName}`;
                    }
                  }
                  return null;
                })()}
              </p>
            )}
            
            {/* Birth date - minimal */}
            {member.birth_date && (
              <DateDisplay 
                date={member.birth_date} 
                className="text-xs text-muted-foreground/60 font-arabic leading-tight" 
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};