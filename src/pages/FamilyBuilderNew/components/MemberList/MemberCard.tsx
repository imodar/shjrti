import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, UserIcon, Crown, Skull, Edit2, Trash2, Calendar } from "lucide-react";
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
    // Check if this member is married into the family (actual spouse from outside)
    const marriage = marriages?.find(m => 
      m.husband_id === member.id || m.wife_id === member.id
    );
    
    const memberHasFamilyFather = (member.father_id || (member as any).fatherId) && familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));
    
    // Show full name for spouses who married into the family (not blood family members)
    const isSpouseFromOutside = marriage && !memberHasFamilyFather && !member.is_founder;
    
    if (isSpouseFromOutside) {
      // For spouses from outside: show full name (first_name + last_name or complete name)
      if (member.first_name && member.last_name) {
        return `${member.first_name} ${member.last_name}`;
      }
      // If full name is available in the name field, use it
      return (member as any).name || member.first_name || "غير معروف";
    } else {
      // For all family members: show first name with ابن/ابنة if they are descendants
      const firstName = member.first_name || (member as any).name?.split(' ')[0] || (member as any).name || "غير معروف";
      const isDescendant = !member.is_founder && memberHasFamilyFather;
      
      if (isDescendant) {
        const genderTerm = member.gender === 'female' ? 'ابنة' : 'ابن';
        return (
          <span>
            {firstName} <span className="text-xs bg-muted px-1.5 py-0.5 rounded-md font-normal">{genderTerm}</span>
          </span>
        );
      }
      
      return firstName;
    }
  };

  const renderRelationship = () => {
    // Only show ابن/ابنة for blood family members (not founders, only descendants with fathers in the family)
    const memberHasFamilyFather = (member.father_id || (member as any).fatherId) && familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));
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
    const father = familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));
    const grandfather = father ? familyMembers?.find(m => m?.id === (father.father_id || (father as any).fatherId)) : null;
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
    const isFounder = member.is_founder || (member as any).isFounder;
    if (isFounder) {
      return (
        <p className="text-xs text-blue-600 dark:text-blue-400 font-arabic whitespace-normal break-words">
          الجد الأكبر
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
        const memberHasFamilyFather = (member.father_id || (member as any).fatherId) && familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));

        // Only show spouse info for non-family members (those without family fathers)
        if (!memberHasFamilyFather) {
          // Get spouse's father and grandfather from familyMembers
          const spouseFather = familyMembers?.find(m => m?.id === (spouse.father_id || (spouse as any).fatherId));
          const spouseGrandfather = spouseFather ? familyMembers?.find(m => m?.id === (spouseFather.father_id || (spouseFather as any).fatherId)) : null;

          // Build detailed spouse info: زوجة مضر ابن أمير ابن مظهر
          const spouseName = spouse.first_name || (spouse as any).name?.split(' ')[0] || (spouse as any).name;
          let spouseInfo = spouseName;
          
          if (spouseFather) {
            const fatherFirstName = spouseFather.first_name || (spouseFather as any).name?.split(' ')[0] || (spouseFather as any).name;
            const genderTerm = spouse.gender === 'female' ? 'ابنة' : 'ابن';
            spouseInfo += ` ${genderTerm} ${fatherFirstName}`;
            
            // Add grandfather if exists
            if (spouseGrandfather) {
              const grandfatherFirstName = spouseGrandfather.first_name || (spouseGrandfather as any).name?.split(' ')[0] || (spouseGrandfather as any).name;
              spouseInfo += ` ابن ${grandfatherFirstName}`;
            }
          }

          // Use زوج for husband, زوجة for wife (from member's perspective)
          const relationLabel = member.gender === 'male' ? 'زوج' : 'زوجة';
          return (
            <p className="text-xs text-blue-600 dark:text-blue-400 font-arabic whitespace-normal break-words">
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
      {/* Black ribbon for deceased members */}
      {!(member as any).isAlive && (
        <div className="absolute top-0 left-0 z-10">
          <div className="w-0 h-0 border-l-[40px] border-l-black border-b-[40px] border-b-transparent"></div>
          <div className="absolute top-1 left-1 text-white text-xs font-bold transform -rotate-45 origin-top-left">
            ✝
          </div>
        </div>
      )}
      
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
              {/* Individual Name with relationship inline */}
              <h3 className="font-semibold text-base font-arabic leading-tight">
                {generateMemberDisplayName()}
              </h3>
              
              {/* Father + Grandfather names */}
              {renderParentage()}
              
              {/* Spouse information - show founder text for founders, spouse info for non-family members */}
              {renderSpouseInfo()}
              
              {/* Birth date and other icons */}
              <div className="flex items-center gap-2">
                {(member.birth_date || (member as any).birthDate) && (
                  <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                    <Calendar className="h-3 w-3 text-blue-600" />
                    <DateDisplay date={(member as any).birthDate || member.birth_date} className="text-xs text-blue-700 font-medium font-arabic" />
                  </div>
                )}
                {([member.is_founder, (member as any).isFounder, (member as any).family_founder, (member as any).founder].some(v => v === true || v === 1 || v === 'true')) && (
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs text-yellow-700 font-medium font-arabic">المؤسس</span>
                  </div>
                )}
                {!(member as any).isAlive && <Skull className="h-4 w-4 text-red-500" />}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};