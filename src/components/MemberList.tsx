import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, User, Eye, Edit, Trash2, Heart, Skull, Crown, Plus } from "lucide-react";

interface MemberListProps {
  members: any[];
  onEditMember: (member: any) => void;
  onViewMember: (member: any) => void;
  onDeleteMember: (member: any) => void;
  onSpouseEditAttempt?: (member: any) => void;
  checkIfMemberIsSpouse?: (member: any) => boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedFilter: string;
  onFilterChange: (value: string) => void;
  getAdditionalInfo?: (member: any) => string;
  getGenderColor?: (gender: string) => string;
  familyMembers: any[];
  marriages: any[];
  memberListLoading: boolean;
  formMode: string;
  onAddMember: () => void;
  packageData: any;
}

const MemberList = memo(({
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
  packageData
}: MemberListProps) => {
  if (memberListLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="البحث في أعضاء العائلة..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white/50 border-white/30 backdrop-blur-sm"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "الكل", icon: Users },
          { key: "male", label: "ذكور", icon: User },
          { key: "female", label: "إناث", icon: User },
          { key: "alive", label: "أحياء", icon: Heart },
          { key: "deceased", label: "متوفين", icon: Skull },
          { key: "founders", label: "المؤسسين", icon: Crown }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={selectedFilter === key ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(key)}
            className="flex items-center gap-2"
          >
            <Icon className="h-3 w-3" />
            {label}
          </Button>
        ))}
      </div>

      {/* Members List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد أعضاء</p>
            {formMode === 'view' && (
              <Button onClick={onAddMember} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                إضافة العضو الأول
              </Button>
            )}
          </div>
        ) : (
          members.map((member: any) => (
            <Card key={member.id} className="bg-white/30 backdrop-blur-sm border-white/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.image_url} />
                      <AvatarFallback className={getGenderColor ? getGenderColor(member.gender) : "bg-gray-200"}>
                        {member.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '؟'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                        {member.gender === 'male' ? (
                          <User className="h-3 w-3 text-blue-500" />
                        ) : (
                          <User className="h-3 w-3 text-pink-500" />
                        )}
                        <span>{getAdditionalInfo ? getAdditionalInfo(member) : member.gender}</span>
                        {!member.is_alive && <Skull className="h-3 w-3 text-gray-500" />}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 space-x-reverse">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewMember(member)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (checkIfMemberIsSpouse && checkIfMemberIsSpouse(member)) {
                          onSpouseEditAttempt && onSpouseEditAttempt(member);
                        } else {
                          onEditMember(member);
                        }
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteMember(member)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
});

MemberList.displayName = "MemberList";

export default MemberList;