import React from 'react';
import { cn } from '@/lib/utils';
import { Member } from '@/types/family.types';
import { useResolvedImageUrl } from '@/utils/useResolvedImageUrl';

interface MemberAvatarProps {
  member: Member;
  isFounder: boolean;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ member, isFounder }) => {
  const resolvedUrl = useResolvedImageUrl(member.image_url);

  const getInitials = () => {
    if (member.first_name) {
      return member.first_name.charAt(0).toUpperCase();
    }
    return (member as any).name?.charAt(0)?.toUpperCase() || '?';
  };

  const getDisplayName = () => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return (member as any).name || 'Unknown';
  };

  return (
    <div className={cn(
      'w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0',
      resolvedUrl
        ? 'border border-slate-100 dark:border-slate-800'
        : isFounder
          ? 'bg-slate-200 dark:bg-slate-700 text-primary'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
    )}>
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={getDisplayName()}
          className="w-full h-full object-cover"
        />
      ) : (
        getInitials()
      )}
    </div>
  );
};
