import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Member, Marriage } from '@/types/family.types';
import { StyledDropdown } from './StyledDropdown';
import { 
  getParentageInfo, 
  getSpouseDisplayInfo, 
  getBirthDeathDisplayInfo 
} from '@/lib/memberDisplayUtils';
import { MemberAvatar } from './MemberAvatar';

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
  canAddMember?: boolean;
  maxFamilyMembers?: number | null;
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
  marriages,
  canAddMember = true,
  maxFamilyMembers
}) => {
  const { t, direction } = useLanguage();
  const [filter, setFilter] = useState('all');

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
  const getThirdLineInfo = (member: Member): { type: 'founder' | 'spouse' | 'spouse-divorced' | 'birth' | 'death' | 'alive' | null; text: string } | null => {
    // Founders
    if (member.is_founder || (member as any).isFounder) {
      return { type: 'founder', text: t('member.founder', 'المؤسس') };
    }

    // Spouse info for external spouses
    const spouseInfo = getSpouseDisplayInfo(member, familyMembers, marriages);
    if (spouseInfo && spouseInfo.label) {
      // Check if divorced
      const marriage = marriages?.find(m => m.husband_id === member.id || m.wife_id === member.id);
      const isDivorced = (marriage as any)?.marital_status === 'divorced';
      return { type: isDivorced ? 'spouse-divorced' : 'spouse', text: `${spouseInfo.label} ${spouseInfo.info}` };
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
            <h2 className="font-bold text-slate-800 dark:text-slate-100">{t('family_builder.members_title', 'Family Members')}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <span className="material-icons-round text-[14px]">groups</span>
              {totalCount} {t('stitch.total_members', 'Total Members')}
            </p>
          </div>
          <button 
            onClick={onAddMember}
            disabled={!canAddMember}
            className={cn(
              "p-2 rounded-lg transition-colors",
              canAddMember 
                ? "bg-primary/10 text-primary hover:bg-primary/20" 
                : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-600/40 cursor-not-allowed animate-pulse"
            )}
            title={!canAddMember && maxFamilyMembers ? `تم الوصول للحد الأقصى (${maxFamilyMembers} أعضاء)` : undefined}
          >
            <span className="material-icons-round">person_add</span>
          </button>
        </div>

        {/* Search & Filter in one row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
              placeholder={t('family_builder.search_placeholder', 'Search by name...')}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <StyledDropdown
              value={filter}
              onChange={setFilter}
              accentColor="primary"
              options={[
                { value: 'all', label: t('stitch.all_members', 'الكل'), icon: 'groups' },
                { value: 'male', label: t('stitch.males', 'الذكور'), icon: 'male' },
                { value: 'female', label: t('stitch.females', 'الإناث'), icon: 'female' },
                { value: 'alive', label: t('stitch.alive', 'الأحياء'), icon: 'favorite' },
                { value: 'deceased', label: t('stitch.deceased', 'المتوفين'), icon: 'history' },
                { value: 'founders', label: t('stitch.founders', 'المؤسسين'), icon: 'workspace_premium' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {members.filter((member) => {
          if (filter === 'male') return member.gender === 'male';
          if (filter === 'female') return member.gender === 'female';
          if (filter === 'alive') return member.is_alive !== false && !(member as any).death_date;
          if (filter === 'deceased') return member.is_alive === false || !!(member as any).death_date;
          if (filter === 'founders') return member.is_founder || (member as any).isFounder;
          return true;
        }).map((member) => {
          const parentageLine = getParentageLine(member);
          const thirdLine = getThirdLineInfo(member);
          const isFounder = member.is_founder || (member as any).isFounder;
          const isDeceased = (member as any).death_date || (member as any).deathDate || (member as any).is_alive === false;

          return (
            <div
              key={member.id}
              onClick={() => onMemberClick(member)}
              className={cn(
                'relative p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer group overflow-hidden',
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
                <MemberAvatar member={member} isFounder={isFounder} />

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

                  {/* Line 3: Spouse Badge (for spouses only) */}
                  {(thirdLine?.type === 'spouse' || thirdLine?.type === 'spouse-divorced') && (
                    <div className="mt-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        thirdLine.type === 'spouse-divorced'
                          ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/50"
                          : "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/50"
                      )}>
                        <span className="material-symbols-outlined text-[12px]">
                          {thirdLine.type === 'spouse-divorced' ? 'heart_broken' : 'favorite'}
                        </span>
                        {thirdLine.text}
                      </span>
                    </div>
                  )}

                  {/* Line 4: Vitality/Date Badge (always shown) */}
                  <div className="mt-1">
                    {(() => {
                      const isMemberDeceased = isDeceased;
                      const birthYear = member.birth_date?.split('-')[0];
                      const deathYear = (member as any).death_date?.split('-')[0];
                      const hasBirth = !!member.birth_date;
                      const hasDeath = !!(member as any).death_date;
                      const isFemale = member.gender === 'female';
                      const yearsText = t('member.years', 'سنة');

                      if (isMemberDeceased) {
                        if (hasBirth && hasDeath) {
                          const age = Number(deathYear) - Number(birthYear);
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-black dark:text-slate-200 text-[10px] font-bold border border-slate-300 dark:border-slate-600">
                              <span className="material-symbols-outlined text-[12px] me-1">history</span>
                              {birthYear} - {deathYear} ({age} {yearsText})
                            </span>
                          );
                        }
                        if (!hasBirth && hasDeath) {
                          const deathText = isFemale ? t('member.died_female', 'توفيت') : t('member.died_male', 'توفي');
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-black dark:text-slate-200 text-[10px] font-bold border border-slate-300 dark:border-slate-600">
                              {deathText} {deathYear}
                            </span>
                          );
                        }
                        const deceasedText = isFemale ? t('member.deceased_female', 'متوفية') : t('member.deceased', 'متوفى');
                        return (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-black dark:text-slate-200 text-[10px] font-bold border border-slate-300 dark:border-slate-600">
                            {deceasedText}
                          </span>
                        );
                      }

                      if (hasBirth) {
                        const now = new Date();
                        const age = now.getFullYear() - Number(birthYear);
                        return (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/50">
                            <span className="material-symbols-outlined text-[12px] me-1">cake</span>
                            {birthYear} - {age} {yearsText}
                          </span>
                        );
                      }

                      return (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/50">
                          {t('member.alive', 'على قيد الحياة')}
                        </span>
                      );
                    })()}
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
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
        <button
          onClick={onAddMember}
          disabled={!canAddMember}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            canAddMember 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90" 
              : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-600/40 cursor-not-allowed shadow-sm shadow-amber-200/30"
          )}
        >
          <span className="material-icons-round text-lg">add</span>
          {canAddMember 
            ? t('family_builder.add_new_member', 'Add New Member')
            : maxFamilyMembers 
              ? `${t('family_builder.max_reached', 'تم الوصول للحد الأقصى')} (${maxFamilyMembers})`
              : t('family_builder.add_new_member', 'Add New Member')
          }
        </button>
      </div>
    </aside>
  );
};

export default StitchSidebar;
