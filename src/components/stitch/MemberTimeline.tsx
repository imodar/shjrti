import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DateDisplay } from '@/components/DateDisplay';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  type: 'birth' | 'marriage' | 'children' | 'death';
  date: string | null;
  icon: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  title: string;
  description: string;
  dateLabel: string;
}

interface MemberTimelineProps {
  member: any;
  spouses: any[];
  children: any[];
  familyMembers: any[];
  marriages: any[];
}

export const MemberTimeline: React.FC<MemberTimelineProps> = ({
  member,
  spouses,
  children,
  familyMembers,
  marriages,
}) => {
  const { t, direction } = useLanguage();

  const getDisplayName = () => {
    if (member.first_name && member.last_name) return `${member.first_name} ${member.last_name}`;
    return member.name || t('common.unknown', 'Unknown');
  };

  const birthDate = member?.birth_date || member?.birthDate;
  const deathDate = member?.death_date || member?.deathDate;
  const isAlive = member?.is_alive !== false && !deathDate;

  const events = useMemo(() => {
    const items: TimelineEvent[] = [];

    // Birth event
    const bornVerb = member?.gender === 'female' ? t('timeline.born_female_verb', 'وُلدت') : t('timeline.born_male_verb', 'وُلد');
    if (birthDate) {
      items.push({
        type: 'birth',
        date: birthDate,
        icon: 'child_care',
        borderColor: 'border-primary',
        bgColor: 'bg-primary/5',
        textColor: 'text-primary',
        title: `${bornVerb} ${getDisplayName()}`,
        description: '',
        dateLabel: birthDate,
      });
    } else {
      items.push({
        type: 'birth',
        date: null,
        icon: 'child_care',
        borderColor: 'border-primary',
        bgColor: 'bg-primary/5',
        textColor: 'text-primary',
        title: `${bornVerb} ${getDisplayName()}`,
        description: t('timeline.birth_date_unknown', 'تاريخ الميلاد غير معروف'),
        dateLabel: '',
      });
    }

    // Marriage events
    if (spouses.length > 0) {
      spouses.forEach((spouse: any) => {
        const spouseName = spouse.first_name
          ? `${spouse.first_name} ${spouse.last_name || ''}`
          : spouse.name || '';

        const marriage = marriages.find(m =>
          (m.husband_id === member?.id && m.wife_id === spouse.id) ||
          (m.wife_id === member?.id && m.husband_id === spouse.id)
        );

        const marriageDate = marriage?.marriage_date || null;

        items.push({
          type: 'marriage',
          date: marriageDate,
          icon: 'favorite',
          borderColor: 'border-secondary',
          bgColor: 'bg-secondary/5',
          textColor: 'text-secondary',
          title: `${t('timeline.marriage_with', 'Union with')} ${spouseName.trim()}`,
          description: '',
          dateLabel: marriageDate || '',
        });
      });
    }

    // Children events - one per child
    if (children.length > 0) {
      const sortedChildren = [...children].sort((a: any, b: any) => {
        const dateA = a.birth_date || a.birthDate || '';
        const dateB = b.birth_date || b.birthDate || '';
        return dateA.localeCompare(dateB);
      });

      sortedChildren.forEach((child: any) => {
        const childName = child.first_name
          ? `${child.first_name} ${child.last_name || ''}`
          : child.name || t('common.unknown', 'Unknown');
        const childBirthDate = child.birth_date || child.birthDate || null;
        const isMale = child.gender === 'male';

        const childVerb = isMale
          ? t('timeline.son_born', 'وُلد لهم')
          : t('timeline.daughter_born', 'وُلدت لهم');

        // If member has multiple spouses, show which spouse is the parent
        let spouseHint = '';
        if (spouses.length > 1) {
          const spouseId = member?.gender === 'male' ? child.mother_id : child.father_id;
          const spouse = spouseId ? familyMembers.find((m: any) => m.id === spouseId) : null;
          if (spouse) {
            if (spouse.first_name === 'unknown_mother' || spouse.first_name === 'unknown_father') {
              spouseHint = member?.gender === 'male'
                ? t('profile.unknown_wife')
                : t('profile.unknown_husband', 'بيانات الزوج غير متوفرة');
            } else {
              const spouseName = spouse.first_name
                ? `${spouse.first_name} ${spouse.last_name || ''}`
                : spouse.name || '';
              const fromLabel = member?.gender === 'male'
                ? t('timeline.from_wife', 'من')
                : t('timeline.from_husband', 'من');
              spouseHint = `${fromLabel} ${spouseName.trim()}`;
            }
          }
        }

        items.push({
          type: 'children',
          date: childBirthDate,
          icon: isMale ? 'boy' : 'girl',
          borderColor: isMale ? 'border-sky-400' : 'border-pink-400',
          bgColor: isMale ? 'bg-sky-50 dark:bg-sky-900/20' : 'bg-pink-50 dark:bg-pink-900/20',
          textColor: isMale ? 'text-sky-500' : 'text-pink-500',
          title: `${childVerb} ${childName.trim()}`,
          description: spouseHint,
          dateLabel: childBirthDate || '',
        });
      });
    }

    // Death event
    if (!isAlive) {
      const deathVerb = member?.gender === 'female' ? t('timeline.died_female_verb', 'توفيت') : t('timeline.died_male_verb', 'توفي');

      items.push({
        type: 'death',
        date: deathDate,
        icon: 'local_florist',
        borderColor: 'border-slate-300 dark:border-slate-600',
        bgColor: 'bg-slate-50 dark:bg-slate-800/30',
        textColor: 'text-slate-400',
        title: `${deathVerb} ${getDisplayName()}`,
        description: '',
        dateLabel: deathDate,
      });
    }

    return items;
  }, [member, spouses, children, marriages, birthDate, deathDate, isAlive, t]);

  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm text-center">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl">history</span>
        </div>
        <h3 className="font-bold text-slate-800 dark:text-white mb-2">{t('timeline.no_events', 'No Timeline Events')}</h3>
        <p className="text-sm text-slate-500">{t('timeline.add_dates_hint', 'Add birth and death dates to see the timeline.')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-sm">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">history</span>
        </div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
          {t('timeline.life_journey_of', 'The Life Journey of')} {getDisplayName()}
        </h3>
        <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 font-medium uppercase tracking-widest mt-1 sm:mt-2">
          {t('timeline.chronological_history', 'A Chronological History of Leadership and Legacy')}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Centered Vertical Line */}
        <div className="absolute left-4 sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-slate-200 dark:to-slate-700" />

        <div className="space-y-16">
          {events.map((event, index) => {
            const isLeft = index % 2 === 0;
            return (
              <div key={index} className="relative flex items-start sm:items-center">
                {/* Mobile: icon on the line + content to the right */}
                {/* Desktop: alternating left/right */}
                
                {/* Left content or spacer (desktop only) */}
                {isLeft ? (
                  <div className={cn("hidden sm:block flex-1", direction === 'rtl' ? 'text-left pl-12' : 'text-right pr-12')}>
                    <TimelineCard event={event} />
                  </div>
                ) : (
                  <div className="hidden sm:block flex-1" />
                )}

                {/* Center icon */}
                <div className={cn(
                  "absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center z-10 shadow-lg",
                  event.borderColor,
                  "border-2 sm:border-4"
                )}>
                  <span className={cn("material-symbols-outlined text-sm sm:text-base", event.textColor)}>{event.icon}</span>
                </div>

                {/* Mobile content (always right of line) */}
                <div className="sm:hidden flex-1 pl-10">
                  <TimelineCard event={event} />
                </div>

                {/* Right content or spacer (desktop only) */}
                {!isLeft ? (
                  <div className={cn("hidden sm:block flex-1", direction === 'rtl' ? 'pr-12' : 'pl-12')}>
                    <TimelineCard event={event} />
                  </div>
                ) : (
                  <div className="hidden sm:block flex-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Sub-component for timeline cards
const TimelineCard: React.FC<{ event: TimelineEvent }> = ({ event }) => (
  <div className={cn(
    "inline-block p-6 rounded-3xl border hover:shadow-md transition-shadow",
    event.bgColor,
    event.type === 'death' ? 'border-slate-200 dark:border-slate-700' : `${event.bgColor.replace('/5', '/10')}`
  )}>
    <h4 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-white">{event.title}</h4>
    {event.description && (
      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">{event.description}</p>
    )}
    {event.dateLabel && (
      <span className={cn("text-[10px] sm:text-xs font-extrabold uppercase tracking-widest mt-2 block", event.textColor)}>
        <DateDisplay date={event.dateLabel} />
      </span>
    )}
  </div>
);

export default MemberTimeline;
