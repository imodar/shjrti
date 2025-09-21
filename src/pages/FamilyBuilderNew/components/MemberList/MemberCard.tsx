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
      
      <CardContent className="relative p-4 overflow-hidden">
        {/* Creative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary/20" />
          <div className="absolute bottom-4 left-4 w-6 h-6 rounded-full bg-secondary/20" />
          <div className="absolute top-1/2 right-1/4 w-4 h-4 rounded-full bg-accent/20" />
        </div>

        <div className="relative z-10">
          {/* Header section with avatar and status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Enhanced avatar with glow effect */}
              <div className="relative">
                <div className={`absolute inset-0 rounded-full blur-md opacity-30 ${
                  member.is_founder 
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500' 
                    : member.gender === 'male' 
                    ? 'bg-gradient-to-br from-blue-400 to-cyan-500' 
                    : 'bg-gradient-to-br from-pink-400 to-rose-500'
                }`} />
                <Avatar className="relative h-12 w-12 ring-2 ring-background shadow-lg">
                  <AvatarImage src={(member as any).image} className="object-cover" />
                  <AvatarFallback className={`${getGenderColor(member.gender)} text-sm font-bold shadow-inner`}>
                    {((member as any).name || member.first_name || "؟").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Floating status indicators */}
                {member.is_founder && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1 shadow-lg animate-pulse">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
                {!(member as any).isAlive && (
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full p-1 shadow-lg">
                    <Skull className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Gender indicator pill */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${
              member.gender === 'male' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                : 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
            }`}>
              {member.gender === 'male' ? '♂' : '♀'}
            </div>
          </div>

          {/* Main content section */}
          <div className="space-y-2">
            {/* Parentage line - decorative */}
            {renderParentage() && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="font-arabic px-2 bg-background/50 backdrop-blur-sm rounded-full border">
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
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
              </div>
            )}
            
            {/* Member name - prominent */}
            <div className="text-center">
              <h3 className="font-bold text-lg font-arabic text-foreground group-hover:text-primary transition-colors duration-300 mb-1">
                {member.name || member.first_name || "غير معروف"}
              </h3>
              
              {/* Relationship badge */}
              {renderRelationship() && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent-foreground text-xs rounded-full font-medium">
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                  {member.gender === 'female' ? 'ابنة' : 'ابن'}
                </span>
              )}
            </div>
            
            {/* Special info section */}
            {(renderSpouseInfo() || member.is_founder) && (
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-2 border border-primary/10">
                <p className="text-xs text-primary font-arabic text-center leading-relaxed">
                  {member.is_founder ? (
                    <span className="flex items-center justify-center gap-1">
                      <Crown className="h-3 w-3" />
                      الجد الأكبر للعائلة
                    </span>
                  ) : (() => {
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
              </div>
            )}
            
            {/* Birth date - elegant */}
            {member.birth_date && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground/80">
                <div className="w-1 h-1 bg-current rounded-full opacity-50" />
                <DateDisplay 
                  date={member.birth_date} 
                  className="font-arabic" 
                />
                <div className="w-1 h-1 bg-current rounded-full opacity-50" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};