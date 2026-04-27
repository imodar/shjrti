import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Member, Marriage } from '@/types/family.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useResolvedImageUrl } from '@/utils/useResolvedImageUrl';
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
  const imageUrl = useResolvedImageUrl(member?.image_url);

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

  const childMembers = (familyMembers || []).filter(
    (m) => m.father_id === member.id || m.mother_id === member.id
  );
  const childrenCount = childMembers.length;

  const childIds = new Set(childMembers.map((c) => c.id));
  const grandchildrenCount = (familyMembers || []).filter(
    (m) =>
      (m.father_id && childIds.has(m.father_id)) ||
      (m.mother_id && childIds.has(m.mother_id))
  ).length;

  const isFemale = member.gender === 'female';
  const spousesLabel = isFemale
    ? t('profile.husbands', 'الأزواج')
    : t('profile.wives', 'الزوجات');

  const toneConfig: Record<
    string,
    { wrap: string; icon: string; iconName: string }
  > = {
    alive: {
      wrap: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50',
      icon: 'text-emerald-500',
      iconName: 'cake',
    },
    deceased: {
      wrap: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300/70 dark:border-slate-600',
      icon: 'text-slate-500',
      iconName: 'history',
    },
    spouse: {
      wrap: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 border-pink-200/70 dark:border-pink-800/50',
      icon: 'text-pink-500',
      iconName: 'favorite',
    },
    neutral: {
      wrap: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      icon: 'text-slate-400',
      iconName: 'info',
    },
  };

  const tone = toneConfig[thirdLineTone];

  // Gender-aware accents
  const accent = isFemale
    ? {
        gradient:
          'from-pink-500/15 via-rose-400/10 to-transparent dark:from-pink-500/25 dark:via-rose-500/15',
        ring: 'ring-pink-300/60 dark:ring-pink-500/40',
        avatarBg:
          'bg-gradient-to-br from-pink-100 to-rose-50 dark:from-pink-900/40 dark:to-rose-900/30 text-pink-600 dark:text-pink-300',
      }
    : {
        gradient:
          'from-primary/15 via-primary/5 to-transparent dark:from-primary/25 dark:via-primary/10',
        ring: 'ring-primary/40 dark:ring-primary/40',
        avatarBg:
          'bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/30 dark:to-primary/10 text-primary',
      };

  const initials =
    member.first_name?.charAt(0) ||
    (member as any).name?.charAt(0) ||
    '?';

  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>{children as any}</HoverCardTrigger>
      <HoverCardContent
        side={side}
        align="center"
        className="w-72 p-0 overflow-hidden border border-border/60 shadow-2xl rounded-2xl bg-popover"
      >
        {/* Header: avatar + name on gradient */}
        <div className={cn('relative px-4 pt-4 pb-3 bg-gradient-to-br', accent.gradient)}>
          {isFounder && (
            <span className="absolute top-2 end-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/95 text-amber-950 text-[9px] font-bold uppercase tracking-wider shadow-sm">
              <span className="material-icons-round text-[11px]">workspace_premium</span>
              {t('tree_view.founder', 'مؤسس')}
            </span>
          )}

          <div className="flex items-center gap-3">
            <div
              className={cn(
                'relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-bold text-lg ring-2 ring-offset-2 ring-offset-popover shadow-md shrink-0',
                accent.avatarBg,
                accent.ring
              )}
            >
              {imageUrl ? (
                <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-foreground leading-tight truncate">
                {displayName}
              </h4>
              {parentageLine && (
                <p className="mt-1 text-[10px] text-muted-foreground font-semibold leading-snug line-clamp-2">
                  {parentageLine}
                </p>
              )}
            </div>
          </div>

          {thirdLineText && (
            <div className="mt-3">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm',
                  tone.wrap
                )}
              >
                <span className={cn('material-icons-round text-[12px]', tone.icon)}>
                  {tone.iconName}
                </span>
                {thirdLineText}
              </span>
            </div>
          )}
        </div>

        {/* Stats footer */}
        <div className="grid grid-cols-3 bg-muted/30 dark:bg-muted/20 border-t border-border/60">
          <StatBlock
            icon="favorite"
            value={spousesCount}
            label={spousesLabel}
            iconClass="text-pink-500"
          />
          <StatBlock
            icon="child_care"
            value={childrenCount}
            label={t('profile.children', 'الأبناء')}
            iconClass="text-sky-500"
            divider
          />
          <StatBlock
            icon="diversity_3"
            value={grandchildrenCount}
            label={t('profile.grandchildren', 'الأحفاد')}
            iconClass="text-amber-500"
            divider
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const StatBlock: React.FC<{
  icon: string;
  value: number;
  label: string;
  iconClass?: string;
  divider?: boolean;
}> = ({ icon, value, label, iconClass, divider }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-2.5 px-1 text-center transition-colors hover:bg-background/60',
      divider && 'border-s border-border/60'
    )}
  >
    <span className={cn('material-icons-round text-[16px] leading-none', iconClass || 'text-primary/70')}>
      {icon}
    </span>
    <span className="text-base font-extrabold text-foreground leading-none mt-1 tabular-nums">
      {value}
    </span>
    <span className="text-[9px] text-muted-foreground font-semibold leading-tight mt-0.5 truncate w-full">
      {label}
    </span>
  </div>
);

export default MemberHoverCard;