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
    // Check if this member is a spouse (married into the family)
    const memberHasFamilyFather = member.father_id && familyMembers?.find(m => m?.id === member.father_id);
    const isSpouseFromOutsideFamily = !memberHasFamilyFather && !member.is_founder;
    
    if (isSpouseFromOutsideFamily && member.last_name) {
      // For spouses from outside: show first_name + family name (last_name)
      const firstName = member.first_name || (member as any).name?.split(' ')[0] || (member as any).name;
      return `${firstName} ${member.last_name}`;
    } else {
      // For family members and founders: show only first name
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
      className="relative cursor-pointer bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 hover:bg-white/95 dark:hover:bg-gray-800/95 transition-all duration-300 hover:shadow-lg rounded-3xl overflow-hidden" 
      onClick={() => onViewMember(member)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 min-h-[80px]">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={(member as any).image} />
              <AvatarFallback className={getGenderColor(member.gender)}>
                {((member as any).name || member.first_name || "؟").charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 space-y-1">
              {/* Individual Name with relationship */}
              <h3 className="font-semibold text-base font-arabic leading-tight">
                {generateMemberDisplayName()}
                {!member.is_founder && member.father_id && familyMembers?.find(m => m?.id === member.father_id) && (
                  <span className="text-xs text-muted-foreground font-normal mr-2">
                    {member.gender === 'female' ? 'ابنة' : 'ابن'}
                  </span>
                )}
              </h3>
              
              {/* Father + Grandfather names */}
              {renderParentage()}
              
              {/* Spouse information - show founder text for founders, spouse info for non-family members */}
              {renderSpouseInfo()}
              
              {/* Birth date and other icons */}
              <div className="flex items-center gap-2">
                {member.birth_date && <DateDisplay date={member.birth_date} className="text-xs text-muted-foreground font-arabic" />}
                {member.is_founder && <Crown className="h-3 w-3 text-yellow-500" />}
                {!(member as any).isAlive && <Skull className="h-3 w-3 text-muted-foreground" />}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};