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
      className="group relative cursor-pointer bg-card/70 backdrop-blur-xl border-0 hover:bg-card/90 transition-all duration-500 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 hover:scale-[1.02]" 
      onClick={() => onViewMember(member)}
    >
      {/* Floating Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="w-full h-full bg-card rounded-2xl" />
      </div>
      
      <CardContent className="relative p-5">
        {/* Top floating icons */}
        <div className="absolute top-2 right-3 flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
          {member.is_founder && (
            <div className="relative">
              <Crown className="h-4 w-4 text-primary animate-pulse" />
              <div className="absolute inset-0 h-4 w-4 text-primary animate-ping opacity-30" />
            </div>
          )}
          {!(member as any).isAlive && <Skull className="h-4 w-4 text-muted-foreground/70" />}
        </div>

        <div className="flex items-start gap-4 min-h-[90px]">
          {/* Avatar with enhanced styling */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-110" />
            <Avatar className="relative h-14 w-14 ring-2 ring-primary/20 ring-offset-2 ring-offset-background group-hover:ring-primary/40 transition-all duration-300">
              <AvatarImage src={(member as any).image} className="object-cover" />
              <AvatarFallback className={`${getGenderColor(member.gender)} text-lg font-bold`}>
                {((member as any).name || member.first_name || "؟").charAt(0)}
              </AvatarFallback>
            </Avatar>
            {/* Gender indicator */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
              {member.gender === 'male' ? 
                <User className="h-3 w-3 text-white" /> : 
                <UserIcon className="h-3 w-3 text-white" />
              }
            </div>
          </div>
          
          {/* Main content with better spacing */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Name with enhanced typography */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg font-arabic leading-tight text-foreground group-hover:text-primary transition-colors duration-300">
                  {generateMemberDisplayName()}
                </h3>
                {renderRelationship() && (
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">
                    {member.gender === 'female' ? 'ابنة' : 'ابن'}
                  </span>
                )}
              </div>
              
              {/* Enhanced parentage display */}
              {renderParentage() && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  {renderParentage()}
                </div>
              )}
              
              {/* Enhanced spouse/founder info */}
              {renderSpouseInfo() && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-accent/70" />
                  {renderSpouseInfo()}
                </div>
              )}
            </div>
            
            {/* Birth date with icon */}
            {member.birth_date && (
              <div className="flex items-center gap-2 pt-1">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent opacity-60" />
                <DateDisplay date={member.birth_date} className="text-sm text-muted-foreground font-arabic" />
              </div>
            )}
          </div>
          
          {/* Enhanced action buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-all duration-300">
            {!checkIfMemberIsSpouse(member) ? (
              <Button 
                type="button" 
                size="sm" 
                variant="ghost" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditMember(member);
                }} 
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg"
              >
                <Edit2 className="h-4 w-4" />
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
                className="h-8 w-8 p-0 hover:bg-accent/20 hover:text-accent-foreground transition-all duration-200 rounded-lg"
              >
                <Edit2 className="h-4 w-4" />
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
              className={`h-8 w-8 p-0 transition-all duration-200 rounded-lg ${
                checkIfMemberIsSpouse(member) 
                  ? 'hover:bg-accent/20 hover:text-accent-foreground' 
                  : 'hover:bg-destructive/10 hover:text-destructive'
              }`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};