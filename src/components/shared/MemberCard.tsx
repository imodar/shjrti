import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown, Skull, Calendar, Lock } from "lucide-react";
import { DateDisplay } from "@/components/DateDisplay";
import { Member, Marriage } from "@/types/family.types";
import { useResolvedImageUrl } from "@/utils/useResolvedImageUrl";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getFounderLastName,
  isMemberFromFamily,
  buildLineageChain,
  getParentageInfo,
  getSpouseDisplayInfo,
  getBirthDeathDisplayInfo,
  generateMemberDisplayName as generateDisplayName
} from '@/lib/memberDisplayUtils';

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
  const { t, direction } = useLanguage();

  // Check if member has hidden name or image (from privacy settings)
  const isNameHidden = (member as any).name_hidden === true;
  const isImageHidden = (member as any).image_hidden === true;

  // Use shared utilities from memberDisplayUtils.ts
  // Local wrapper functions that pass the component's familyMembers array
  
  const getMemberDisplayName = () => {
    return generateDisplayName(member, familyMembers, marriages, isNameHidden);
  };

  const renderRelationship = () => {
    // Only show ابن/ابنة for blood family members (not founders, only descendants with fathers in the family)
    const memberHasFamilyFather = (member.father_id || (member as any).fatherId) && familyMembers?.find(m => m?.id === (member.father_id || (member as any).fatherId));
    const isDescendantMember = !member.is_founder && memberHasFamilyFather;
    if (isDescendantMember) {
      return <span className="text-sm text-muted-foreground font-normal">
          {member.gender === 'female' ? 'ابنة' : 'ابن'}
        </span>;
    }
    return null;
  };

  const renderParentage = () => {
    const parentageInfo = getParentageInfo(member, familyMembers);
    if (!parentageInfo) return null;
    
    return (
      <p className="text-sm text-primary truncate font-arabic">
        {parentageInfo.genderTerm} {parentageInfo.lineage}
      </p>
    );
  };

  const renderSpouseInfo = () => {
    const spouseInfo = getSpouseDisplayInfo(member, familyMembers, marriages);
    if (!spouseInfo) return null;
    
    const displayText = spouseInfo.label 
      ? `${spouseInfo.label} ${spouseInfo.info}` 
      : spouseInfo.info;
    
    return (
      <p className="text-sm text-primary font-arabic whitespace-normal break-words">
        {displayText}
      </p>
    );
  };

  const renderBirthDeathInfo = () => {
    const translations = {
      born_male: t('member.born_male', 'ولد'),
      born_female: t('member.born_female', 'ولدت'),
      died_male: t('member.died_male', 'توفي'),
      died_female: t('member.died_female', 'توفيت'),
      in_text: t('member.in', 'في'),
      years: t('member.years', 'سنة')
    };
    
    const info = getBirthDeathDisplayInfo(member, translations);
    if (!info) return null;
    
    const inText = translations.in_text;
    const yearsText = translations.years;
    
    // حالة: يوجد تاريخ وفاة فقط
    if (info.type === 'death_only') {
      return (
        <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
          <Skull className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-arabic">
            {info.deathText} {inText} <DateDisplay date={info.deathDate!} />
          </span>
        </div>
      );
    }
    
    // حالة: يوجد تاريخ ولادة + العضو متوفي + لا يوجد تاريخ وفاة
    if (info.type === 'birth_only') {
      return (
        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
          <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-blue-700 dark:text-blue-300 font-arabic">
            {info.birthText} {inText} <DateDisplay date={info.birthDate!} />
          </span>
        </div>
      );
    }
    
    // حالة: يوجد تاريخ ولادة + العضو على قيد الحياة
    if (info.type === 'alive') {
      return (
        <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
          <Calendar className="h-3 w-3 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-700 dark:text-green-300 font-arabic">
            {info.birthText} {inText} <DateDisplay date={info.birthDate!} /> - {info.age} {yearsText}
          </span>
        </div>
      );
    }
    
    // حالة: يوجد تاريخ ولادة + تاريخ وفاة
    if (info.type === 'both') {
      return (
        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
          <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          <span className="text-xs text-amber-700 dark:text-amber-300 font-arabic">
            {info.birthText} {inText} {info.birthYear} - {info.deathText} {inText} {info.deathYear} - {info.age} {yearsText}
          </span>
        </div>
      );
    }
    
    return null;
  };
  return <TooltipProvider>
    <Card className="relative cursor-pointer bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 hover:bg-white/95 dark:hover:bg-gray-800/95 transition-all duration-300 hover:shadow-lg rounded-3xl overflow-hidden" onClick={() => onViewMember(member)}>
      {/* Black ribbon for deceased members */}
      {((member as any).death_date || (member as any).deathDate || (member as any).is_alive === false) && <div className={`absolute top-0 ${direction === 'rtl' ? 'left-0' : 'right-0'} z-10`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`w-12 h-12 bg-black cursor-help ${direction === 'rtl' ? 'rounded-tl-[24px]' : 'rounded-tr-[24px]'}`}
                style={{
                  clipPath: direction === 'rtl' ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)'
                }}
              ></div>
            </TooltipTrigger>
            <TooltipContent side={direction === 'rtl' ? 'right' : 'left'}>
              <p>{t('member.deceased', 'متوفى')}</p>
            </TooltipContent>
          </Tooltip>
        </div>}
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 min-h-[80px]">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-12 w-12 flex-shrink-0">
              {!isImageHidden && memberImageSrc && <AvatarImage src={memberImageSrc} alt={member.name} />}
              <AvatarFallback className={getGenderColor(member.gender)}>
                {isImageHidden ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('member.image_hidden', 'تم إخفاء الصورة من قبل مدير الشجرة')}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  ((member as any).name || member.first_name || "؟").charAt(0)
                )}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 space-y-1">
              {/* Individual Name with relationship inline */}
              <h3 className="font-semibold text-base font-arabic leading-tight flex items-center gap-2">
                {isNameHidden && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('member.name_hidden', 'تم إخفاء الاسم من قبل مدير الشجرة')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {getMemberDisplayName()}
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