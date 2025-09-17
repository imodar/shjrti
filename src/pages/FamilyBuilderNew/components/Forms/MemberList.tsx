import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, UserPlus, Crown, User, UserRoundIcon, Heart, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MemberCard } from '../MemberList/MemberCard';

interface Member {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  gender: string;
  birth_date?: string;
  death_date?: string;
  is_alive?: boolean;
  is_founder?: boolean;
  image_url?: string;
  biography?: string;
  family_id: string;
  created_at: string;
  updated_at: string;
}

interface Marriage {
  id: string;
  husband?: { id: string; name: string };
  wife?: { id: string; name: string };
}

interface MemberListProps {
  members: Member[];
  onEditMember: (member: Member) => void;
  onViewMember: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
  onSpouseEditAttempt: (member: Member) => void;
  checkIfMemberIsSpouse: (member: Member) => boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  getAdditionalInfo: (member: Member) => string;
  getGenderColor: (gender: string) => string;
  familyMembers: Member[];
  marriages: Marriage[];
  memberListLoading: boolean;
  formMode: string;
  onAddMember: () => void;
  packageData?: any;
  className?: string;
}

export const MemberListComponent: React.FC<MemberListProps> = ({
  members,
  onEditMember,
  onViewMember,
  onDeleteMember,
  onSpouseEditAttempt,
  checkIfMemberIsSpouse,
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  getAdditionalInfo,
  getGenderColor,
  familyMembers,
  marriages,
  memberListLoading,
  formMode,
  onAddMember,
  packageData,
  className
}) => {
  const canAddMoreMembers = () => {
    if (!packageData) return true;
    const maxMembers = packageData.max_members;
    if (maxMembers === -1) return true; // Unlimited
    return familyMembers.length < maxMembers;
  };

  if (memberListLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-20 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="ابحث عن عضو..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="font-arabic pl-4 pr-10 h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
          />
        </div>

        {/* Filter Dropdown */}
        <Select value={selectedFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300">
            <SelectValue placeholder="تصفية الأعضاء" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-arabic">جميع الأعضاء</SelectItem>
            <SelectItem value="male" className="font-arabic">الذكور فقط</SelectItem>
            <SelectItem value="female" className="font-arabic">الإناث فقط</SelectItem>
            <SelectItem value="founders" className="font-arabic">المؤسسين فقط</SelectItem>
            <SelectItem value="alive" className="font-arabic">الأحياء فقط</SelectItem>
            <SelectItem value="deceased" className="font-arabic">المتوفين فقط</SelectItem>
          </SelectContent>
        </Select>

        {/* Stats Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-arabic">
              العدد الكلي: {familyMembers.length}
            </Badge>
            <Badge variant="outline" className="font-arabic text-blue-600 border-blue-200">
              <User className="h-3 w-3 ml-1" />
              ذكور: {familyMembers.filter(m => m.gender === 'male').length}
            </Badge>
            <Badge variant="outline" className="font-arabic text-pink-600 border-pink-200">
              <UserRoundIcon className="h-3 w-3 ml-1" />
              إناث: {familyMembers.filter(m => m.gender === 'female').length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Add Member Button */}
      {formMode !== 'add' && formMode !== 'edit' && (
        <div className="pb-4">
          {canAddMoreMembers() ? (
            <Button
              onClick={onAddMember}
              className="w-full h-12 font-arabic bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground border-0 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <UserPlus className="h-4 w-4 ml-2" />
              إضافة عضو جديد
            </Button>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold font-arabic">وصلت للحد الأقصى</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-arabic">
                لقد وصلت للحد الأقصى من الأعضاء ({packageData?.max_members}). 
                قم بترقية باقتك لإضافة المزيد من الأعضاء.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2 font-arabic">لا توجد أعضاء</h3>
            <p className="text-muted-foreground font-arabic mb-4">
              {searchTerm ? 'لم يتم العثور على أعضاء مطابقة لبحثك' : 'لم يتم إضافة أي أعضاء بعد'}
            </p>
            {!searchTerm && canAddMoreMembers() && (
              <Button onClick={onAddMember} className="font-arabic">
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول عضو
              </Button>
            )}
          </div>
        ) : (
          members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              familyMembers={familyMembers}
              marriages={marriages}
              onViewMember={onViewMember}
              onEditMember={onEditMember}
              onDeleteMember={onDeleteMember}
              onSpouseEditAttempt={onSpouseEditAttempt}
              checkIfMemberIsSpouse={checkIfMemberIsSpouse}
              getGenderColor={getGenderColor}
            />
          ))
        )}
      </div>

      {/* Bottom Stats */}
      {members.length > 0 && (
        <div className="pt-4 border-t border-border">
          <div className="text-center text-sm text-muted-foreground font-arabic">
            عرض {members.length} من أصل {familyMembers.length} عضو
          </div>
        </div>
      )}
    </div>
  );
};