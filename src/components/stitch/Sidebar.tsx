import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Member, Marriage } from '@/types/family.types';
import { 
  getParentageInfo, 
  getSpouseDisplayInfo, 
  getBirthDeathDisplayInfo 
} from '@/lib/memberDisplayUtils';

interface StitchSidebarProps {
  members: Member[];
  totalCount: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onMemberClick: (member: Member) => void;
  onAddMember: () => void;
  selectedMemberId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  familyMembers: Member[];
  marriages: Marriage[];
}

export const StitchSidebar: React.FC<StitchSidebarProps> = ({
  members,
  totalCount,
  searchTerm,
  onSearchChange,
  onMemberClick,
  onAddMember,
  selectedMemberId,
  isOpen = true,
  onClose,
  familyMembers,
  marriages
}) => {
  const { t, direction } = useLanguage();

  const getInitials = (member: Member) => {
    if (member.first_name) {
      return member.first_name.charAt(0).toUpperCase();
    }
    return (member as any).name?.charAt(0)?.toUpperCase() || '?';
  };

  const getDisplayName = (member: Member) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return (member as any).name || 'Unknown';
  };

  // Get parentage line (ابن/ابنة + سلسلة النسب)
  const getParentageLine = (member: Member): string | null => {
    const info = getParentageInfo(member, familyMembers);
    if (!info) return null;
    return `${info.genderTerm} ${info.lineage}`;
  };

  // Get third line info (founder label, spouse info, or birth/death)
  const getThirdLineInfo = (member: Member): { type: 'founder' | 'spouse' | 'birth' | 'death' | 'alive' | null; text: string } | null => {
    // Founders
    if (member.is_founder || (member as any).isFounder) {
      return { type: 'founder', text: t('member.founder', 'المؤسس') };
    }

    // Spouse info for external spouses
    const spouseInfo = getSpouseDisplayInfo(member, familyMembers, marriages);
    if (spouseInfo && spouseInfo.label) {
      return { type: 'spouse', text: `${spouseInfo.label} ${spouseInfo.info}` };
    }

    // Birth/Death info
    const translations = {
      born_male: t('member.born_male', 'ولد'),
      born_female: t('member.born_female', 'ولدت'),
      died_male: t('member.died_male', 'توفي'),
      died_female: t('member.died_female', 'توفيت'),
      in_text: t('member.in', 'في'),
      years: t('member.years', 'سنة')
    };

    const birthDeathInfo = getBirthDeathDisplayInfo(member, translations);
    if (!birthDeathInfo) return null;

    const inText = translations.in_text;
    const yearsText = translations.years;

    switch (birthDeathInfo.type) {
      case 'alive':
        return { 
          type: 'alive', 
          text: `${birthDeathInfo.birthText} ${inText} ${birthDeathInfo.birthDate?.split('-')[0]} - ${birthDeathInfo.age} ${yearsText}` 
        };
      case 'death_only':
        return { 
          type: 'death', 
          text: `${birthDeathInfo.deathText} ${inText} ${birthDeathInfo.deathDate?.split('-')[0]}` 
        };
      case 'birth_only':
        return { 
          type: 'birth', 
          text: `${birthDeathInfo.birthText} ${inText} ${birthDeathInfo.birthDate?.split('-')[0]}` 
        };
      case 'both':
        return { 
          type: 'death', 
          text: `${birthDeathInfo.birthYear} - ${birthDeathInfo.deathYear} (${birthDeathInfo.age} ${yearsText})` 
        };
      default:
        return null;
    }
  };

  return (
    <aside className={cn(
      'w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-30 shadow-xl lg:shadow-none',
      !isOpen && 'hidden'
    )}>
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">{t('stitch.family_members', 'Family Members')}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <span className="material-icons-round text-[14px]">groups</span>
              {totalCount} {t('stitch.total_members', 'Total Members')}
            </p>
          </div>
          <button 
            onClick={onAddMember}
            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <span className="material-icons-round">person_add</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            placeholder={t('stitch.search_placeholder', 'Search by name...')}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select className="text-xs border-none bg-slate-50 dark:bg-slate-800/50 rounded-lg focus:ring-primary/20 py-1.5 flex-1">
            <option>{t('stitch.all_branches', 'All Branches')}</option>
          </select>
          <button className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-400">
            <span className="material-icons-round text-lg">filter_list</span>
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {members.map((member) => {
          const parentageLine = getParentageLine(member);
          const thirdLine = getThirdLineInfo(member);
          const isFounder = member.is_founder || (member as any).isFounder;
          const isDeceased = (member as any).death_date || (member as any).deathDate || (member as any).is_alive === false;

          return (
            <div
              key={member.id}
              onClick={() => onMemberClick(member)}
              className={cn(
                'relative p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer group overflow-hidden',
                selectedMemberId === member.id 
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-primary/30' 
                  : isFounder
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    : isDeceased
                      ? 'bg-white dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      : 'bg-white dark:bg-slate-800/20 border-primary/10 hover:border-primary/40'
              )}
            >
              {/* Deceased Ribbon - Rotated Corner */}
              {isDeceased && (
                <div className={cn(
                  "absolute top-0 w-12 h-12 bg-black shadow-md z-10",
                  direction === 'rtl' 
                    ? "left-0 -rotate-45 -translate-x-6 -translate-y-6" 
                    : "right-0 rotate-45 translate-x-6 -translate-y-6"
                )} />
              )}

              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0',
                  member.image_url 
                    ? 'border border-slate-100 dark:border-slate-800' 
                    : isFounder
                      ? 'bg-slate-200 dark:bg-slate-700 text-primary'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                )}>
                  {member.image_url ? (
                    <img 
                      src={member.image_url} 
                      alt={getDisplayName(member)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(member)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Line 1: Name */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                      {getDisplayName(member)}
                    </h4>
                  </div>

                  {/* Line 2: Parentage/Relationship */}
                  {parentageLine ? (
                    <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">
                      {parentageLine}
                    </p>
                  ) : isFounder ? (
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">
                      {t('member.founder', 'Grandfather • Founder')}
                    </p>
                  ) : null}

                  {/* Line 3: Status Badge */}
                  <div className="mt-1.5">
                    {isFounder && isDeceased ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-tighter">
                        {t('member.deceased', 'Deceased')} {thirdLine?.type === 'death' && `(${(member as any).death_date?.split('-')[0] || ''})`}
                      </span>
                    ) : thirdLine?.type === 'alive' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/50">
                        <span className="material-symbols-outlined text-[12px] mr-1">cake</span>
                        {thirdLine.text}
                      </span>
                    ) : thirdLine?.type === 'death' || isDeceased ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-bold border border-amber-500/20">
                        <span className="material-symbols-outlined text-[12px] mr-1">history</span>
                        {thirdLine?.text || t('member.deceased', 'Deceased')}
                      </span>
                    ) : thirdLine?.type === 'spouse' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 text-[10px] font-bold border border-pink-200 dark:border-pink-800/50">
                        <span className="material-symbols-outlined text-[12px] mr-1">favorite</span>
                        {thirdLine.text}
                      </span>
                    ) : thirdLine?.type === 'birth' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/50">
                        <span className="material-symbols-outlined text-[12px] mr-1">cake</span>
                        {thirdLine.text}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-400 text-[10px] font-medium italic border border-slate-200 dark:border-slate-700">
                        {t('member.no_birth_date', 'No birth date available')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Founder Crown Badge */}
                {isFounder && (
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-round text-[14px] text-amber-500">workspace_premium</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer - Add Button */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
        <button
          onClick={onAddMember}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-icons-round text-lg">add</span>
          {t('family_builder.add_new_member', 'Add New Member')}
        </button>
      </div>
    </aside>
  );
};

export default StitchSidebar;
