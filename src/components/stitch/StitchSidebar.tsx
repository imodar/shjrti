import React from 'react';
import { Search, Filter, UserPlus, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

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
      'stitch-sidebar',
      !isOpen && 'lg:hidden'
    )}>
      {/* Header */}
      <div className="stitch-sidebar-header">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-heading">Family Members</h2>
            <p className="text-xs text-stitch-muted flex items-center gap-1 mt-0.5">
              <Users className="h-3.5 w-3.5" />
              {totalCount} Total Members
            </p>
          </div>
          <button 
            onClick={onAddMember}
            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stitch-muted h-4 w-4" />
          <Input
            className="stitch-input pl-10"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select className="stitch-select flex-1">
            <option>All Branches</option>
          </select>
          <button className="p-1.5 bg-stitch-surface rounded-lg text-stitch-muted">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="stitch-sidebar-content custom-scrollbar space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            onClick={() => onMemberClick(member)}
            className={cn(
              'member-card',
              selectedMemberId === member.id && 'border-primary/30 bg-primary/5'
            )}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className={cn(
                'stitch-avatar overflow-hidden',
                member.image_url ? '' : 'bg-stitch-surface text-stitch-muted'
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
                  <p className="text-[10px] text-stitch-muted uppercase font-semibold truncate">
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
      <div className="stitch-sidebar-footer">
        <Button
          onClick={onAddMember}
          className="stitch-btn-primary w-full py-2.5 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Member
        </Button>
      </div>
    </aside>
  );
};

export default StitchSidebar;
