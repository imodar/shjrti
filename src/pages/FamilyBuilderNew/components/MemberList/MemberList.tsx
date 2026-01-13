import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MemberCard } from "@/components/shared/MemberCard";
import { MemberCardSkeleton } from "@/components/skeletons/MemberCardSkeleton";
interface MemberListProps {
  members: any[];
  onEditMember: (member: any) => void;
  onViewMember: (member: any) => void;
  onDeleteMember: (member: any) => void;
  onSpouseEditAttempt: (member: any) => void;
  checkIfMemberIsSpouse: (member: any) => boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedFilter: string;
  onFilterChange: (value: string) => void;
  getAdditionalInfo: (member: any) => string;
  getGenderColor: (gender: string) => string;
  familyMembers: any[];
  marriages: any[];
  memberListLoading: boolean;
  formMode: 'add' | 'edit' | 'view' | 'profile' | 'tree-settings';
  onAddMember: () => void;
  packageData: any;
  generationCount: number;
}

export const MemberList: React.FC<MemberListProps> = ({
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
  generationCount
}) => {
  const { t } = useLanguage();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      const container = containerRef.current;
      if (!container) return;

      // Get parent CardContent height
      const parent = container.closest('.relative.overflow-y-auto');
      if (!parent) return;

      const parentHeight = parent.clientHeight;
      
      // Calculate heights of other elements (search row + button + gaps)
      const searchRow = container.querySelector('.flex.gap-3');
      const addButton = container.querySelector('button');
      const searchHeight = searchRow?.clientHeight || 0;
      const buttonHeight = formMode === 'view' ? (addButton?.clientHeight || 0) : 0;
      const gaps = formMode === 'view' ? 32 : 16; // gap-4 = 1rem = 16px
      
      const availableHeight = parentHeight - searchHeight - buttonHeight - gaps;
      setMaxHeight(availableHeight > 0 ? availableHeight : null);
    };

    // Initial calculation
    updateHeight();

    // Watch for resize
    const resizeObserver = new ResizeObserver(updateHeight);
    const parent = containerRef.current.closest('.relative.overflow-y-auto');
    if (parent) {
      resizeObserver.observe(parent);
    }

    // Watch for window resize
    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [formMode]);

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col overflow-hidden gap-4 px-2 pt-2" 
      style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
    >
      {/* Search and Filter on the same row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('family_builder.search_placeholder')} 
            value={searchTerm} 
            onChange={e => onSearchChange(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <div className="flex-1">
          <Select value={selectedFilter} onValueChange={onFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('family_builder.filter_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('family_builder.filter_all')}</SelectItem>
              <SelectItem value="alive">{t('family_builder.filter_alive')}</SelectItem>
              <SelectItem value="deceased">{t('family_builder.filter_deceased')}</SelectItem>
              <SelectItem value="male">{t('family_builder.filter_male')}</SelectItem>
              <SelectItem value="female">{t('family_builder.filter_female')}</SelectItem>
              <SelectItem value="founders">{t('family_builder.filter_founders')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add Member Button */}
      {(formMode === 'view' || formMode === 'profile') && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onAddMember} className="w-full flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {packageData && familyMembers.length >= packageData.max_family_members 
                  ? `تم الوصول للحد الأقصى (${packageData.max_family_members} أعضاء)` 
                  : 'إضافة عضو جديد'
                }
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" side="top">
              {packageData && familyMembers.length >= packageData.max_family_members ? (
                <div className="text-center">
                  <p className="font-semibold text-destructive mb-1">
                    🚫 تم الوصول للحد الأقصى
                  </p>
                  <p className="text-sm">
                    باقتك الحالية تسمح بإضافة {packageData.max_family_members} أعضاء فقط
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    قم بترقية باقتك لإضافة المزيد من الأعضاء
                  </p>
                </div>
              ) : (
                <p className="text-sm">انقر لإضافة عضو جديد إلى الشجرة</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Member List */}
      <div className="space-y-3 flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
        {memberListLoading ? (
          // Loading skeletons with shimmer and wave effect
          Array.from({ length: 8 }).map((_, index) => (
            <MemberCardSkeleton key={index} index={index} />
          ))
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد أعضاء</p>
          </div>
        ) : (
          members.map((member: any) => (
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
    </div>
  );
};
