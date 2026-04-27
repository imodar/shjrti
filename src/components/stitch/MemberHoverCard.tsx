import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Member, Marriage } from '@/types/family.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  generateMemberDisplayName,
  getParentageInfo,
  getSpouseDisplayInfo,
  getBirthDeathDisplayInfo,
} from '@/lib/memberDisplayUtils';

interface MemberHoverCardProps {
  member: Member;
  familyMembers: Member[];
  marriages: Marriage[];
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Hover card displaying quick member info (name, lineage, vitality)
 * with side stats (spouses, children, grandchildren counts).
 * Mirrors the Sidebar member-list rows.
 */
export const MemberHoverCard: React.FC<MemberHoverCardProps> = ({
  member,
  familyMembers,
  marriages,
  children,
  side = 'top',
}) => {
  const { t } = useLanguage();

  // Skip placeholders
  if (
    !member ||
    member.first_name === 'unknown_mother' ||
    member.first_name === 'unknown_father'
  ) {
    return <>{children}</>;
  }

  // Line 1: full display name (with lineage / surname inheritance)
  const displayName =
    generateMemberDisplayName(member, familyMembers, marriages) ||
    member.first_name ||
    (member as any).name ||
    t('common.unknown', 'Unknown');

  // Line 2: parentage / founder
  const parentageInfo = getParentageInfo(member, familyMembers);
  const isFounder = member.is_founder || (member as any).isFounder;
  let parentageLine: string | null = null;
  if (parentageInfo) {
    parentageLine = `${parentageInfo.genderTerm} ${parentageInfo.lineage}`;
  } else if (isFounder) {
    parentageLine = t('member.founder', 'المؤسس');
  }

  // Line 3: vitality / spouse info
  const translations = {
    born_male: t('member.born_male', 'ولد'),
    born_female: t('member.born_female', 'ولدت'),
    died_male: t('member.died_male', 'توفي'),
    died_female: t('member.died_female', 'توفيت'),
    in_text: t('member.in', 'في'),
    years: t('member.years', 'سنة'),
  };
  const yearsText = translations.years;
  const inText = translations.in_text;

  const spouseInfo = getSpouseDisplayInfo(member, familyMembers, marriages);
  const birthDeath = getBirthDeathDisplayInfo(member, translations);

  let thirdLineText: string | null = null;
  let thirdLineTone: 'alive' | 'deceased' | 'spouse' | 'neutral' = 'neutral';

  if (spouseInfo && spouseInfo.label) {
    thirdLineText = `${spouseInfo.label} ${spouseInfo.info}`;
    thirdLineTone = 'spouse';
  } else if (birthDeath) {
    switch (birthDeath.type) {
      case 'alive':
        thirdLineText = `${birthDeath.birthText} ${inText} ${birthDeath.birthDate?.split('-')[0]} - ${birthDeath.age} ${yearsText}`;
        thirdLineTone = 'alive';
        break;
      case 'death_only':
        thirdLineText = `${birthDeath.deathText} ${inText} ${birthDeath.deathDate?.split('-')[0]}`;
        thirdLineTone = 'deceased';
        break;
      case 'birth_only':
        thirdLineText = `${birthDeath.birthText} ${inText} ${birthDeath.birthDate?.split('-')[0]}`;
        thirdLineTone = 'alive';
        break;
      case 'both':
        thirdLineText = `${birthDeath.birthYear} - ${birthDeath.deathYear} (${birthDeath.age} ${yearsText})`;
        thirdLineTone = 'deceased';
        break;
    }
  }

  // Side stats: spouses, children, grandchildren
  const memberMarriages = (marriages || []).filter(
    (m) => m.husband_id === member.id || m.wife_id === member.id
  );
  const spousesCount = memberMarriages.length;

  const children = (familyMembers || []).filter(
    (m) => m.father_id === member.id || m.mother_id === member.id
  );
  const childrenCount = children.length;

  const childIds = new Set(children.map((c) => c.id));
  const grandchildrenCount = (familyMembers || []).filter(
    (m) =>
      (m.father_id && childIds.has(m.father_id)) ||
      (m.mother_id && childIds.has(m.mother_id))
  ).length;

  const isFemale = member.gender === 'female';
  const spousesLabel = isFemale
    ? t('profile.husbands', 'الأزواج')
    : t('profile.wives', 'الزوجات');

  const toneClasses: Record<string, string> = {
    alive:
      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    deceased:
      'bg-slate-200 dark:bg-slate-700 text-black dark:text-slate-200 border-slate-300 dark:border-slate-600',
    spouse:
      'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/50',
    neutral:
      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>{children as any}</HoverCardTrigger>
      <HoverCardContent
        side={side}
        align="center"
        className="w-80 p-0 overflow-hidden border-primary/20 shadow-xl"
      >
        <div className="flex">
          {/* Main info */}
          <div className="flex-1 p-3 space-y-1.5">
            <h4 className="text-sm font-bold text-foreground leading-snug">
              {displayName}
            </h4>
            {parentageLine && (
              <p className="text-[10px] text-muted-foreground uppercase font-semibold leading-snug">
                {parentageLine}
              </p>
            )}
            {thirdLineText && (
              <div>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border',
                    toneClasses[thirdLineTone]
                  )}
                >
                  {thirdLineText}
                </span>
              </div>
            )}
          </div>

          {/* Side stats */}
          <div className="w-24 bg-primary/5 dark:bg-primary/10 border-s border-primary/10 flex flex-col divide-y divide-primary/10">
            <StatBlock
              icon="favorite"
              value={spousesCount}
              label={spousesLabel}
            />
            <StatBlock
              icon="child_care"
              value={childrenCount}
              label={t('profile.children', 'الأبناء')}
            />
            <StatBlock
              icon="diversity_3"
              value={grandchildrenCount}
              label={t('profile.grandchildren', 'الأحفاد')}
            />
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const StatBlock: React.FC<{ icon: string; value: number; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <div className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 text-center">
    <span className="material-icons-round text-[14px] text-primary/70 leading-none">
      {icon}
    </span>
    <span className="text-sm font-bold text-foreground leading-tight mt-0.5">
      {value}
    </span>
    <span className="text-[9px] text-muted-foreground font-medium leading-tight truncate w-full">
      {label}
    </span>
  </div>
);

export default MemberHoverCard;