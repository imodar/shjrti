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
    if (birthDate) {
      items.push({
        type: 'birth',
        date: birthDate,
        icon: 'child_care',
        borderColor: 'border-primary',
        bgColor: 'bg-primary/5',
        textColor: 'text-primary',
        title: t('timeline.born_event', 'Born'),
        description: t('timeline.birth_description', 'The beginning of a life journey and the start of a new chapter in the family history.'),
        dateLabel: birthDate,
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

        items.push({
          type: 'marriage',
          date: marriage?.created_at || null,
          icon: 'favorite',
          borderColor: 'border-secondary',
          bgColor: 'bg-secondary/5',
          textColor: 'text-secondary',
          title: `${t('timeline.marriage_with', 'Union with')} ${spouseName.trim()}`,
          description: t('timeline.marriage_description', 'A union that strengthened the family bonds and continued the legacy.'),
          dateLabel: marriage?.created_at || '',
        });
      });
    }

    // Children event
    if (children.length > 0) {
      const maleCount = children.filter((c: any) => c.gender === 'male').length;
      const femaleCount = children.filter((c: any) => c.gender === 'female').length;

      const parts: string[] = [];
      if (maleCount > 0) parts.push(`${maleCount} ${t('timeline.sons', 'sons')}`);
      if (femaleCount > 0) parts.push(`${femaleCount} ${t('timeline.daughters', 'daughters')}`);
      const childrenSummary = parts.join(` ${t('common.and', 'and')} `);

      // Sort children by birth date to get range
      const childBirthDates = children
        .map((c: any) => c.birth_date || c.birthDate)
        .filter(Boolean)
        .sort();

      const rangeStart = childBirthDates[0]?.split('-')[0];
      const rangeEnd = childBirthDates[childBirthDates.length - 1]?.split('-')[0];

      items.push({
        type: 'children',
        date: childBirthDates[0] || null,
        icon: 'family_history',
        borderColor: 'border-primary',
        bgColor: 'bg-primary/5',
        textColor: 'text-primary',
        title: t('timeline.family_growth', 'The Foundation of Legacy'),
        description: `${t('timeline.welcomed', 'Welcomed')} ${childrenSummary}. ${rangeStart && rangeEnd && rangeStart !== rangeEnd ? `(${rangeStart} — ${rangeEnd})` : ''}`,
        dateLabel: rangeStart && rangeEnd && rangeStart !== rangeEnd
          ? `${rangeStart} — ${rangeEnd}`
          : rangeStart || '',
      });
    }

    // Death event
    if (!isAlive && deathDate) {
      const birthYear = birthDate?.split('-')[0];
      const deathYear = deathDate?.split('-')[0];
      const age = birthYear && deathYear ? parseInt(deathYear) - parseInt(birthYear) : null;

      items.push({
        type: 'death',
        date: deathDate,
        icon: 'local_florist',
        borderColor: 'border-slate-300 dark:border-slate-600',
        bgColor: 'bg-slate-50 dark:bg-slate-800/30',
        textColor: 'text-slate-400',
        title: t('timeline.passing', 'A Peacefully Concluded Life'),
        description: age
          ? `${t('timeline.passed_at_age', 'Passed away at age')} ${age}. ${t('timeline.remembered', 'Remembered as a pillar of the family whose legacy continues.')}`
          : t('timeline.remembered', 'Remembered as a pillar of the family whose legacy continues.'),
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
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
          {t('timeline.life_journey_of', 'The Life Journey of')} {getDisplayName()}
        </h3>
        <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-2">
          {t('timeline.chronological_history', 'A Chronological History of Leadership and Legacy')}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Centered Vertical Line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-slate-200 dark:to-slate-700 hidden md:block" />

        <div className="space-y-16">
          {events.map((event, index) => {
            const isLeft = index % 2 === 0;
            return (
              <div key={index} className="relative flex flex-col md:flex-row items-center">
                {/* Left content or spacer */}
                {isLeft ? (
                  <div className={cn("flex-1 mb-4 md:mb-0", direction === 'rtl' ? 'md:text-left md:pl-12' : 'md:text-right md:pr-12')}>
                    <TimelineCard event={event} />
                  </div>
                ) : (
                  <div className="flex-1 hidden md:block" />
                )}

                {/* Center icon */}
                <div className={cn(
                  "absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center z-10 shadow-lg hidden md:flex",
                  event.borderColor,
                  "border-4"
                )}>
                  <span className={cn("material-symbols-outlined", event.textColor)}>{event.icon}</span>
                </div>

                {/* Right content or spacer */}
                {!isLeft ? (
                  <div className={cn("flex-1", direction === 'rtl' ? 'md:pr-12' : 'md:pl-12')}>
                    <TimelineCard event={event} />
                  </div>
                ) : (
                  <div className="flex-1 hidden md:block" />
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
    {event.dateLabel && (
      <span className={cn("text-xs font-extrabold uppercase tracking-widest", event.textColor)}>
        {event.type === 'children' || event.type === 'marriage'
          ? event.dateLabel
          : <DateDisplay date={event.dateLabel} />}
      </span>
    )}
    <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-1">{event.title}</h4>
    <p className="text-sm text-slate-500 mt-2 max-w-sm">{event.description}</p>
  </div>
);

export default MemberTimeline;
