import React from "react";
import { Crown, Heart } from "lucide-react";
import { Member, Marriage } from "../../types/family.types";

interface MemberRelationshipsProps {
  member: Member;
  familyMembers: Member[];
  marriages: Marriage[];
}

export const MemberRelationships: React.FC<MemberRelationshipsProps> = ({
  member,
  familyMembers,
  marriages
}) => {
  const renderParentage = () => {
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
  };

  const renderRelationship = () => {
    const memberHasFamilyFather = member.father_id && familyMembers?.find(m => m?.id === member.father_id);
    const isDescendant = !member.is_founder && memberHasFamilyFather;
    
    if (isDescendant) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 text-accent-foreground text-sm rounded-full font-medium border border-accent/30">
          <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
          {member.gender === 'female' ? 'ابنة' : 'ابن'}
        </span>
      );
    }
    return null;
  };

  const renderSpouseInfo = () => {
    if (member.is_founder) {
      return (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-lg p-2 border border-amber-200/50 dark:border-amber-800/30">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-arabic text-center font-medium flex items-center justify-center gap-2">
            <Crown className="h-4 w-4" />
            الجد الأكبر للعائلة
          </p>
        </div>
      );
    }

    const marriage = marriages?.find(m => m.husband_id === member.id || m.wife_id === member.id);
    
    if (marriage) {
      const isHusband = marriage.husband_id === member.id;
      const spouseId = isHusband ? marriage.wife_id : marriage.husband_id;
      const spouse = familyMembers?.find(m => m?.id === spouseId);
      const memberHasFamilyFather = member.father_id && familyMembers?.find(m => m?.id === member.father_id);
      
      if (spouse && !memberHasFamilyFather) {
        const spouseName = spouse.first_name || (spouse as any).name?.split(' ')[0] || (spouse as any).name;
        const relationLabel = member.gender === 'male' ? 'زوج' : 'زوجة';
        
        return (
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 rounded-lg p-2 border border-rose-200/50 dark:border-rose-800/30">
            <p className="text-sm text-rose-700 dark:text-rose-300 font-arabic text-center font-medium flex items-center justify-center gap-2">
              <Heart className="h-4 w-4" />
              {relationLabel} {spouseName}
            </p>
          </div>
        );
      }
    }
    return null;
  };

  const parentageText = renderParentage();

  return (
    <div className="space-y-2">
      {/* Parentage */}
      {parentageText && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border/50 to-transparent h-px top-1/2 transform -translate-y-1/2" />
          <div className="relative flex justify-center">
            <span className="text-xs text-muted-foreground font-arabic px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full border border-border/50 shadow-sm">
              {parentageText}
            </span>
          </div>
        </div>
      )}
      
      {/* Relationship badge */}
      <div className="flex justify-center">
        {renderRelationship()}
      </div>
      
      {/* Spouse/founder info */}
      {renderSpouseInfo()}
    </div>
  );
};