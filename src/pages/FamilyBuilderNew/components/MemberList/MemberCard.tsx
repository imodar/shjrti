import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User, UserIcon, Crown, Skull, Edit2, Trash2, Calendar } from "lucide-react";
import { DateDisplay } from "@/components/DateDisplay";
import { Member, Marriage } from "../../types/family.types";
import { useResolvedImageUrl } from "@/utils/useResolvedImageUrl";
import { differenceInYears, parseISO } from 'date-fns';
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
  // Resolve member image to signed URL with lazy loading
  const memberImageSrc = useResolvedImageUrl((member as any).image || member.image_url, true);

  const generateMemberDisplayName = () => {
    // Check if this member is married into the family (actual spouse from outside)
    const marriage = marriages?.find(m => m.husband_id === member.id || m.wife_id === member.id);
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
      // For all family members: show first name + family name for descendants
      const firstName = member.first_name || (member as any).name?.split(' ')[0] || (member as any).name || "غير معروف";
      const isDescendant = !member.is_founder && memberHasFamilyFather;
      
      if (isDescendant) {
        // Show first name with family name (if available)
        const familyName = member.last_name || "الشهيد"; // Default family name
        return `${firstName} ${familyName}`;
      }
      return firstName;
    }
  };
  const renderRelationship = () => {
    // Only show ابن/ابنة for blood family members (not founders, only descendants with fathers in the family)
    const memberHasFamilyFather = (member.father_id || (member as any).fatherId) && familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));
    const isDescendant = !member.is_founder && memberHasFamilyFather;
    if (isDescendant) {
      return <span className="text-sm text-muted-foreground font-normal">
          {member.gender === 'female' ? 'ابنة' : 'ابن'}
        </span>;
    }
    return null;
  };
  const renderParentage = () => {
    if (member.is_founder) return null;
    
    const mother = familyMembers?.find(m => m?.id === (member.mother_id || (member as any).motherId));
    const father = familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));
    
    // Check if mother is from Sheikh Saeed's family (has father_id in family tree)
    const motherIsFromFamily = mother && (mother.father_id || (mother as any).fatherId) && 
                              familyMembers?.find(m => m?.id === (mother.father_id || (mother as any).fatherId));
    
    const genderTerm = member.gender === 'female' ? 'ابنة' : 'ابن';
    
    // If mother is from Sheikh Saeed's family, show mother's lineage
    if (motherIsFromFamily) {
      const motherName = mother.first_name || (mother as any).name?.split(' ')[0] || (mother as any).name;
      const motherFather = familyMembers?.find(m => m?.id === (mother.father_id || (mother as any).fatherId));
      
      let lineage = motherName;
      
      if (motherFather) {
        const motherFatherName = motherFather.first_name || (motherFather as any).name?.split(' ')[0] || (motherFather as any).name;
        lineage += ` بنت ${motherFatherName}`;
        
        // Add grandfather if exists
        const motherGrandfather = familyMembers?.find(m => m?.id === (motherFather.father_id || (motherFather as any).fatherId));
        if (motherGrandfather) {
          const motherGrandfatherName = motherGrandfather.first_name || (motherGrandfather as any).name?.split(' ')[0] || (motherGrandfather as any).name;
          lineage += ` ابن ${motherGrandfatherName}`;
        }
      }
      
      return <p className="text-sm text-primary truncate font-arabic">
          {genderTerm} {lineage}
        </p>;
    }
    
    // Otherwise, show father's lineage (for members like Ibrahim)
    if (father) {
      const fatherName = father.first_name || (father as any).name?.split(' ')[0] || (father as any).name;
      const grandfather = familyMembers?.find(m => m?.id === (father.father_id || (father as any).fatherId));
      
      let lineage = fatherName;
      
      if (grandfather) {
        const grandfatherName = grandfather.first_name || (grandfather as any).name?.split(' ')[0] || (grandfather as any).name;
        lineage += ` ابن ${grandfatherName}`;
      }
      
      return <p className="text-sm text-primary truncate font-arabic">
          {genderTerm} {lineage}
        </p>;
    }
    
    return null;
  };
  const renderSpouseInfo = () => {
    // Show founder text for founders
    const isFounder = member.is_founder || (member as any).isFounder;
    if (isFounder) {
      return <p className="text-sm text-primary font-arabic whitespace-normal break-words">الجد الأكبر</p>;
    }

    // إذا كان العضو من داخل العائلة (له أب)، لا تعرض معلومات الزوج
    const memberHasFamilyFather = ((member as any).father_id || (member as any).fatherId) &&
      familyMembers?.find(m => m?.id === ((member as any).father_id || (member as any).fatherId));
    
    if (memberHasFamilyFather) {
      return null; // لا تعرض شيء للأعضاء من داخل العائلة
    }

    // فقط للأزواج من خارج العائلة: ابحث عن الزوج واعرض معلوماته
    const marriage = marriages?.find(m => m.husband_id === member.id || m.wife_id === member.id);
    if (!marriage) return null;

    const spouseId = marriage.husband_id === member.id ? marriage.wife_id : marriage.husband_id;
    const spouse = familyMembers?.find(m => m?.id === spouseId);
    if (!spouse) return null;

    // عرض معلومات الزوج بالتفصيل مع النسب
    const spouseFather = familyMembers?.find(m => m?.id === ((spouse as any).father_id || (spouse as any).fatherId));
    const spouseGrandfather = spouseFather ? familyMembers?.find(m => m?.id === ((spouseFather as any).father_id || (spouseFather as any).fatherId)) : null;

    const spouseName = (spouse as any).first_name || (spouse as any).name?.split(' ')[0] || (spouse as any).name || '';
    let spouseInfo = spouseName;
    
    if (spouseFather) {
      const fatherFirstName = (spouseFather as any).first_name || (spouseFather as any).name?.split(' ')[0];
      const genderTerm = (spouse as any).gender === 'female' ? 'ابنة' : 'ابن';
      spouseInfo += ` ${genderTerm} ${fatherFirstName}`;
      
      if (spouseGrandfather) {
        const grandfatherFirstName = (spouseGrandfather as any).first_name || (spouseGrandfather as any).name?.split(' ')[0];
        spouseInfo += ` ابن ${grandfatherFirstName}`;
      }
    }

    const relationLabel = (member as any).gender === 'male' ? 'زوج' : 'زوجة';
    return <p className="text-sm text-primary font-arabic whitespace-normal break-words">{relationLabel} {spouseInfo}</p>;
  };

  const renderBirthDeathInfo = () => {
    const birthDate = member.birth_date || (member as any).birthDate;
    const deathDate = member.death_date || (member as any).deathDate;
    const isAlive = member.is_alive !== false && (member as any).isAlive !== false;
    const gender = member.gender || (member as any).gender;
    
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
      const age = differenceInYears(new Date(), parseISO(birthDate));
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
      const age = differenceInYears(parseISO(deathDate), parseISO(birthDate));
      return (
        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
          <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          <span className="text-xs text-amber-700 dark:text-amber-300 font-arabic">
            {birthText} في <DateDisplay date={birthDate} /> - {deathText} في <DateDisplay date={deathDate} /> - {age} سنة
          </span>
        </div>
      );
    }
    
    return null;
  };
  return <TooltipProvider>
    <Card className="relative cursor-pointer bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 hover:bg-white/95 dark:hover:bg-gray-800/95 transition-all duration-300 hover:shadow-lg rounded-3xl overflow-hidden" onClick={() => onViewMember(member)}>
      {/* Black ribbon for deceased members */}
      {!(member as any).isAlive && <div className="absolute top-0 left-0 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-0 h-0 border-l-[40px] border-l-black border-b-[40px] border-b-transparent cursor-help"></div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>متوفى</p>
            </TooltipContent>
          </Tooltip>
        </div>}
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 min-h-[80px]">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-12 w-12 flex-shrink-0">
              {memberImageSrc && <AvatarImage src={memberImageSrc} alt={member.name} />}
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
                
                {/* Birth/Death date and other icons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {renderBirthDeathInfo()}
                  {[member.is_founder, (member as any).isFounder, (member as any).family_founder, (member as any).founder].some(v => v === true || v === 1 || v === 'true') && <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                    <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm text-yellow-600 dark:text-yellow-300 font-medium font-arabic">المؤسس</span>
                  </div>}
                </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </TooltipProvider>;
};