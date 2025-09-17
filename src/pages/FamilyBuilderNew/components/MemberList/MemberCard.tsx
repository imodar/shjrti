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
      
      <CardContent className="relative p-0 overflow-hidden">
        {/* Innovative hexagonal design */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 overflow-hidden">
          {/* Animated geometric patterns */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-2 left-4 w-8 h-8 border-2 border-primary/40 rotate-45 animate-spin" style={{animationDuration: '8s'}} />
            <div className="absolute top-6 right-8 w-6 h-6 border-2 border-accent/40 rounded-full animate-pulse" />
            <div className="absolute bottom-4 left-8 w-4 h-4 bg-secondary/40 rotate-45 animate-bounce" style={{animationDuration: '3s'}} />
          </div>
          
          {/* Status indicators - floating */}
          <div className="absolute top-3 right-3 flex gap-2">
            {member.is_founder && (
              <div className="relative">
                <div className="w-8 h-8 bg-primary/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 w-8 h-8 bg-primary/30 rounded-full animate-ping" />
              </div>
            )}
            {!(member as any).isAlive && (
              <div className="w-8 h-8 bg-muted/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <Skull className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Avatar - positioned creatively */}
          <div className="absolute bottom-0 left-4 transform translate-y-1/2">
            <div className="relative">
              {/* Multiple rings effect */}
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary/30 rounded-full animate-ping" style={{animationDuration: '2s'}} />
              <div className="absolute inset-0 w-16 h-16 border-2 border-accent/40 rounded-full animate-pulse" />
              
              <Avatar className="relative w-16 h-16 border-4 border-background shadow-2xl">
                <AvatarImage src={(member as any).image} className="object-cover" />
                <AvatarFallback className={`${getGenderColor(member.gender)} text-xl font-bold`}>
                  {((member as any).name || member.first_name || "؟").charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* Gender badge - innovative positioning */}
              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-xl border-2 border-background ${
                member.gender === 'male' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-pink-500 to-pink-600'
              }`}>
                {member.gender === 'male' ? 
                  <User className="h-3 w-3 text-white" /> : 
                  <UserIcon className="h-3 w-3 text-white" />
                }
              </div>
            </div>
          </div>
        </div>

        {/* Content section - innovative layout */}
        <div className="pt-10 pb-4 px-4 space-y-3">
          {/* Name section - diagonal design */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-xl font-arabic leading-tight text-foreground group-hover:text-primary transition-all duration-500 transform group-hover:scale-105">
                  {generateMemberDisplayName()}
                </h3>
                
                {/* Relationship tag */}
                {renderRelationship() && (
                  <div className="inline-block mt-1">
                    <span className="px-3 py-1 text-xs bg-gradient-to-r from-primary/20 to-accent/20 text-primary rounded-full font-medium border border-primary/30 backdrop-blur-sm">
                      {member.gender === 'female' ? 'ابنة' : 'ابن'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Action buttons - floating design */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-4">
                {!checkIfMemberIsSpouse(member) ? (
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMember(member);
                    }} 
                    className="h-9 w-9 p-0 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  >
                    <Edit2 className="h-4 w-4 text-primary" />
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
                    className="h-9 w-9 p-0 rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  >
                    <Edit2 className="h-4 w-4 text-accent-foreground" />
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
                  className={`h-9 w-9 p-0 rounded-full border backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
                    checkIfMemberIsSpouse(member) 
                      ? 'bg-accent/10 hover:bg-accent/20 border-accent/20' 
                      : 'bg-destructive/10 hover:bg-destructive/20 border-destructive/20'
                  }`}
                >
                  <Trash2 className={`h-4 w-4 ${
                    checkIfMemberIsSpouse(member) ? 'text-accent-foreground' : 'text-destructive'
                  }`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Info cards - innovative stacked design */}
          <div className="space-y-2">
            {/* Parentage info */}
            {renderParentage() && (
              <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-muted/30 to-transparent rounded-lg border-r-2 border-primary/40">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <div className="text-sm text-muted-foreground font-arabic">
                  {renderParentage()}
                </div>
              </div>
            )}
            
            {/* Spouse/Founder info */}
            {renderSpouseInfo() && (
              <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-accent/20 to-transparent rounded-lg border-r-2 border-accent/40">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <div className="text-xs text-accent-foreground font-arabic">
                  {renderSpouseInfo()}
                </div>
              </div>
            )}
            
            {/* Birth date */}
            {member.birth_date && (
              <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-secondary/30 to-transparent rounded-lg border-r-2 border-secondary/40">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse opacity-70" />
                <DateDisplay date={member.birth_date} className="text-sm text-muted-foreground font-arabic" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};