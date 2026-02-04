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

          return (
            <div
              key={member.id}
              onClick={() => onMemberClick(member)}
              className={cn(
                'p-3 rounded-xl border transition-all cursor-pointer group',
                selectedMemberId === member.id 
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-primary/30' 
                  : 'bg-white dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 hover:border-primary/30'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0',
                  member.image_url 
                    ? '' 
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

                {/* Info - 3 Lines */}
                <div className="flex-1 min-w-0">
                  {/* Line 1: Name */}
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                      {getDisplayName(member)}
                    </h4>
                    {/* Founder Badge */}
                    {isFounder && (
                      <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="material-icons-round text-[12px] text-amber-500">workspace_premium</span>
                      </div>
                    )}
                  </div>

                  {/* Line 2: Parentage (ابن/ابنة + سلسلة النسب) */}
                  {parentageLine && (
                    <p className="text-[11px] text-primary truncate font-arabic mt-0.5">
                      {parentageLine}
                    </p>
                  )}

                  {/* Line 3: Birth/Death or Spouse Info */}
                  {thirdLine && (
                    <div className={cn(
                      'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px]',
                      thirdLine.type === 'founder' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
                      thirdLine.type === 'spouse' && 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
                      thirdLine.type === 'alive' && 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
                      thirdLine.type === 'birth' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                      thirdLine.type === 'death' && 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    )}>
                      {thirdLine.type === 'founder' && <span className="material-icons-round text-[10px]">workspace_premium</span>}
                      {thirdLine.type === 'spouse' && <span className="material-icons-round text-[10px]">favorite</span>}
                      {thirdLine.type === 'alive' && <span className="material-icons-round text-[10px]">cake</span>}
                      {thirdLine.type === 'birth' && <span className="material-icons-round text-[10px]">calendar_today</span>}
                      {thirdLine.type === 'death' && <span className="material-icons-round text-[10px]">schedule</span>}
                      <span className="font-arabic">{thirdLine.text}</span>
                    </div>
                  )}
                </div>
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
          {t('stitch.add_member', 'Add New Member')}
        </button>
      </div>
    </aside>
  );
};

export default StitchSidebar;
