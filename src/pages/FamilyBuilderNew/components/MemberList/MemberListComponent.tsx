import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, Users, Menu } from "lucide-react";
import { MemberCard } from "@/pages/FamilyBuilderNew/components/MemberList/MemberCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface MemberListComponentProps {
  members: any[];
  familyMembers: any[];
  marriages: any[];
  searchTerm: string;
  selectedFilter: string;
  memberListLoading: boolean;
  formMode: 'view' | 'add' | 'edit' | 'profile' | 'tree-settings';
  packageData: any;
  isMemberListOpen: boolean;
  onSearchChange: (term: string) => void;
  onFilterChange: (filter: string) => void;
  onEditMember: (member: any) => void;
  onViewMember: (member: any) => void;
  onDeleteMember: (member: any) => void;
  onSpouseEditAttempt: (member: any) => void;
  onAddMember: () => void;
  onToggleMemberList: () => void;
  onShowUpgradeModal: () => void;
  checkIfMemberIsSpouse: (member: any) => boolean;
  getAdditionalInfo: (member: any) => string;
  getGenderColor: (gender: string) => string;
}

const MemberList = ({
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
  onShowUpgradeModal,
  packageData
}: {
  members: any[];
  onEditMember: (member: any) => void;
  onViewMember: (member: any) => void;
  onDeleteMember: (member: any) => void;
  onSpouseEditAttempt: (member: any) => void;
  checkIfMemberIsSpouse: (member: any) => boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  getAdditionalInfo: (member: any) => string;
  getGenderColor: (gender: string) => string;
  familyMembers: any[];
  marriages: any[];
  memberListLoading: boolean;
  formMode: string;
  onAddMember: () => void;
  onShowUpgradeModal: () => void;
  packageData: any;
}) => {
  return (
    <div className="space-y-4">
      {/* Search and Filter on the same row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="ابحث عن عضو..." 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <div className="flex-1">
          <Select value={selectedFilter} onValueChange={onFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="تصفية حسب..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأعضاء</SelectItem>
              <SelectItem value="alive">الأحياء</SelectItem>
              <SelectItem value="deceased">المتوفين</SelectItem>
              <SelectItem value="male">الذكور</SelectItem>
              <SelectItem value="female">الإناث</SelectItem>
              <SelectItem value="founders">المؤسسون</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add Member Button */}
      {formMode === 'view' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => {
                  if (packageData && familyMembers.length >= packageData.max_family_members) {
                    onShowUpgradeModal();
                  } else {
                    onAddMember();
                  }
                }} 
                className="w-full flex items-center gap-2"
              >
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
      <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
        {memberListLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <div 
              key={index} 
              className="p-4 rounded-3xl border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 bg-white/50 dark:bg-gray-800/50"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
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

export const MemberListComponent: React.FC<MemberListComponentProps> = ({
  members,
  familyMembers,
  marriages,
  searchTerm,
  selectedFilter,
  memberListLoading,
  formMode,
  packageData,
  isMemberListOpen,
  onSearchChange,
  onFilterChange,
  onEditMember,
  onViewMember,
  onDeleteMember,
  onSpouseEditAttempt,
  onAddMember,
  onToggleMemberList,
  onShowUpgradeModal,
  checkIfMemberIsSpouse,
  getAdditionalInfo,
  getGenderColor
}) => {
  const isMobile = useIsMobile();

  // Filter members based on search term and selected filter
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      selectedFilter === "all" ||
      (selectedFilter === "alive" && member.isAlive) ||
      (selectedFilter === "deceased" && !member.isAlive) ||
      (selectedFilter === "male" && member.gender === "male") ||
      (selectedFilter === "female" && member.gender === "female") ||
      (selectedFilter === "founders" && member.isFounder);
    
    return matchesSearch && matchesFilter;
  });

  if (isMobile) {
    return (
      <Drawer open={isMemberListOpen} onOpenChange={onToggleMemberList}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-50 shadow-lg bg-background/95 backdrop-blur-sm"
          >
            <Menu className="h-4 w-4 mr-2" />
            الأعضاء ({filteredMembers.length})
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[80vh]">
          <div className="p-4">
            <MemberList 
              members={filteredMembers}
              onEditMember={onEditMember}
              onViewMember={onViewMember}
              onDeleteMember={onDeleteMember}
              onSpouseEditAttempt={onSpouseEditAttempt}
              checkIfMemberIsSpouse={checkIfMemberIsSpouse}
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              selectedFilter={selectedFilter}
              onFilterChange={onFilterChange}
              getAdditionalInfo={getAdditionalInfo}
              getGenderColor={getGenderColor}
              familyMembers={familyMembers}
              marriages={marriages}
              memberListLoading={memberListLoading}
              formMode={formMode}
              onAddMember={onAddMember}
              onShowUpgradeModal={onShowUpgradeModal}
              packageData={packageData}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">أعضاء العائلة ({filteredMembers.length})</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <MemberList 
          members={filteredMembers}
          onEditMember={onEditMember}
          onViewMember={onViewMember}
          onDeleteMember={onDeleteMember}
          onSpouseEditAttempt={onSpouseEditAttempt}
          checkIfMemberIsSpouse={checkIfMemberIsSpouse}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          selectedFilter={selectedFilter}
          onFilterChange={onFilterChange}
          getAdditionalInfo={getAdditionalInfo}
          getGenderColor={getGenderColor}
          familyMembers={familyMembers}
          marriages={marriages}
              memberListLoading={memberListLoading}
              formMode={formMode}
              onAddMember={onAddMember}
              onShowUpgradeModal={onShowUpgradeModal}
              packageData={packageData}
        />
      </CardContent>
    </Card>
  );
};