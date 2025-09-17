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
    const isSpouse = checkIfMemberIsSpouse(member);
    if (isSpouse) {
      // For spouses: show full name (first_name + last_name)
      const firstName = member.first_name || '';
      const lastName = member.last_name || '';
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
      return (member as any).name || "غير معروف";
    } else {
      // For family members: show first name only
      if (member.first_name) {
        return member.first_name;
      } else if ((member as any).name) {
        // Extract first word from name field
        return ((member as any).name).split(' ')[0];
      }
      return "غير معروف";
    }
  };

  const renderRelationship = () => {
    // Only show ابن/ابنة for blood family members (not founders, only descendants with fathers in the family)
    const fatherId = member.father_id || (member as any).fatherId;
    const isFounder = member.is_founder || (member as any).isFounder;
    const memberHasFamilyFather = fatherId && familyMembers?.find(m => m?.id === fatherId);
    const isDescendant = !isFounder && memberHasFamilyFather;
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
    const fatherId = member.father_id || (member as any).fatherId;
    const father = familyMembers?.find(m => m?.id === fatherId);
    const grandfatherFatherId = father?.father_id || (father as any)?.fatherId;
    const grandfather = father ? familyMembers?.find(m => m?.id === grandfatherFatherId) : null;
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
        const memberFatherId = member.father_id || (member as any).fatherId;
        const memberHasFamilyFather = memberFatherId && familyMembers?.find(m => m?.id === memberFatherId);

        // Only show spouse info for non-family members (those without family fathers)
        if (!memberHasFamilyFather) {
          // Get spouse's father from familyMembers
          const spouseFatherId = spouse.father_id || (spouse as any).fatherId;
          const spouseFather = familyMembers?.find(m => m?.id === spouseFatherId);

          // Build simplified spouse info: زوجة محمد ابن سعيد (first name only)
          const spouseName = spouse.first_name || (spouse as any).name?.split(' ')[0] || (spouse as any).name;
          let spouseInfo = spouseName;
          if (spouseFather) {
            const fatherFirstName = spouseFather.first_name || (spouseFather as any).name?.split(' ')[0] || (spouseFather as any).name;
            const genderTerm = spouse.gender === 'female' ? 'ابنة' : 'ابن';
            spouseInfo += ` ${genderTerm} ${fatherFirstName}`;
          }

          // For wives: show husband's name, for husbands: show relation only
          if (member.gender === 'female') {
            // For wives: show "زوجة [husband name]" with full lineage
            let husbandName = spouse.first_name;
            if (!husbandName && (spouse as any).name) {
              // Extract only the first word from the full name
              husbandName = (spouse as any).name.split(' ')[0];
            }
            if (!husbandName) {
              husbandName = "غير معروف";
            }
            
            // Build husband's lineage
            const husbandFatherId = spouse.father_id || (spouse as any).fatherId;
            const husbandFather = familyMembers?.find(m => m?.id === husbandFatherId);
            let husbandLineage = husbandName;
            
            if (husbandFather) {
              const fatherFirstName = husbandFather.first_name || (husbandFather as any).name?.split(' ')[0] || (husbandFather as any).name;
              husbandLineage += ` ابن ${fatherFirstName}`;
              
              // Check for grandfather
              const grandfatherFatherId = husbandFather.father_id || (husbandFather as any).fatherId;
              const husbandGrandfather = familyMembers?.find(m => m?.id === grandfatherFatherId);
              if (husbandGrandfather) {
                const grandfatherFirstName = husbandGrandfather.first_name || (husbandGrandfather as any).name?.split(' ')[0] || (husbandGrandfather as any).name;
                husbandLineage += ` ابن ${grandfatherFirstName}`;
              }
            }
            return (
              <p className="text-xs text-blue-600 dark:text-blue-400 truncate font-arabic">
                زوجة {husbandLineage}
              </p>
            );
          } else {
            // For husbands: don't show spouse info
            return null;
          }
        }
      }
    }
    return null;
  };

  return (
    <Card 
      className="group relative cursor-pointer bg-card/95 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/10" 
      onClick={() => onViewMember(member)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar section */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
              <AvatarImage src={(member as any).image} className="object-cover" />
              <AvatarFallback className={`${getGenderColor(member.gender)} text-sm font-semibold`}>
                {((member as any).name || member.first_name || "؟").charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {/* Gender & Status indicators */}
            <div className="absolute -bottom-1 -right-1 flex">
              <div className={`w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${
                member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
              }`}>
                {member.gender === 'male' ? 
                  <User className="h-2 w-2 text-white" /> : 
                  <UserIcon className="h-2 w-2 text-white" />
                }
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Name and relationship */}
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground font-arabic leading-tight truncate">
                {generateMemberDisplayName()}
              </h3>
              {renderRelationship() && (
                <span className="px-2 py-0.5 text-xs bg-primary/15 text-primary rounded-md font-medium flex-shrink-0">
                  {member.gender === 'female' ? 'ابنة' : 'ابن'}
                </span>
              )}
            </div>
            
            {/* Additional info */}
            <div className="space-y-0.5 text-xs text-muted-foreground">
              {renderParentage()}
              {renderSpouseInfo()}
              {member.birth_date && (
                <DateDisplay date={member.birth_date} className="text-xs text-muted-foreground font-arabic block" />
              )}
            </div>
          </div>
          
          {/* Status and actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Status icons */}
            {member.is_founder && (
              <div className="w-6 h-6 bg-primary/15 rounded-full flex items-center justify-center">
                <Crown className="h-3 w-3 text-primary" />
              </div>
            )}
            {!(member as any).isAlive && (
              <div className="w-6 h-6 bg-muted/30 rounded-full flex items-center justify-center">
                <Skull className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            
            {/* Action buttons - compact */}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {!checkIfMemberIsSpouse(member) ? (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditMember(member);
                  }} 
                  className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpouseEditAttempt(member);
                  }} 
                  className="h-7 w-7 p-0 hover:bg-accent/15 hover:text-accent-foreground"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
              
              <Button 
                type="button" 
                size="sm" 
                variant="ghost" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (checkIfMemberIsSpouse(member)) {
                    onSpouseEditAttempt(member);
                  } else {
                    onDeleteMember(member);
                  }
                }} 
                className={`h-7 w-7 p-0 ${
                  checkIfMemberIsSpouse(member) 
                    ? 'hover:bg-accent/15 hover:text-accent-foreground' 
                    : 'hover:bg-destructive/10 hover:text-destructive'
                }`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};