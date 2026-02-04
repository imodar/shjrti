import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  gender?: string;
  is_founder?: boolean;
  role?: string;
}

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
  onClose
}) => {
  const { t, direction } = useLanguage();

  const getInitials = (member: Member) => {
    if (member.first_name) {
      return member.first_name.charAt(0).toUpperCase();
    }
    return member.name?.charAt(0).toUpperCase() || '?';
  };

  const getDisplayName = (member: Member) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.name || 'Unknown';
  };

  const getRoleLabel = (member: Member) => {
    if (member.is_founder) return 'Grandfather • Founder';
    if (member.role) return member.role;
    return '';
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
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Family Members</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <span className="material-icons-round text-[14px]">groups</span>
              {totalCount} Total Members
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
            placeholder="Search by name..."
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select className="text-xs border-none bg-slate-50 dark:bg-slate-800/50 rounded-lg focus:ring-primary/20 py-1.5 flex-1">
            <option>All Branches</option>
            <option>Al-Saeed Branch</option>
          </select>
          <button className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-400">
            <span className="material-icons-round text-lg">filter_list</span>
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {members.map((member) => (
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
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden',
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

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                  {getDisplayName(member)}
                </h4>
                {getRoleLabel(member) && (
                  <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">
                    {getRoleLabel(member)}
                  </p>
                )}
              </div>

              {/* Founder Badge */}
              {member.is_founder && (
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-round text-[14px] text-amber-500">workspace_premium</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - Add Button */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
        <button
          onClick={onAddMember}
          className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-icons-round text-lg">add</span>
          Add New Member
        </button>
      </div>
    </aside>
  );
};

export default StitchSidebar;
