import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Users, Eye, Edit, Trash2 } from "lucide-react";
import { Member } from "../../types/family.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SimplifiedMemberListProps {
  familyMembers: Member[];
  onMemberSelect: (member: Member) => Promise<void>;
  onMemberEdit: (member: Member) => void;
  onMemberDelete?: (member: Member) => Promise<void>;
  onAddMember: () => void;
  searchable?: boolean;
}

export const SimplifiedMemberList: React.FC<SimplifiedMemberListProps> = ({
  familyMembers,
  onMemberSelect,
  onMemberEdit,
  onMemberDelete,
  onAddMember,
  searchable = true
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Filter members based on search term and selected filter
  const filteredMembers = useMemo(() => {
    return familyMembers.filter(member => {
      const memberName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim();
      const matchesSearch = !searchTerm || memberName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        selectedFilter === "all" ||
        (selectedFilter === "alive" && member.is_alive !== false) ||
        (selectedFilter === "deceased" && member.is_alive === false) ||
        (selectedFilter === "male" && member.gender === "male") ||
        (selectedFilter === "female" && member.gender === "female") ||
        (selectedFilter === "founders" && member.is_founder);
      
      return matchesSearch && matchesFilter;
    });
  }, [familyMembers, searchTerm, selectedFilter]);

  const getGenderColor = (gender: string) => {
    return gender === 'male' ? 'text-blue-600' : gender === 'female' ? 'text-pink-600' : 'text-gray-600';
  };

  const getMemberDisplayName = (member: Member) => {
    return member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'غير محدد';
  };

  const getInitials = (member: Member) => {
    const name = getMemberDisplayName(member);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">أعضاء العائلة ({filteredMembers.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        {searchable && (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="ابحث عن عضو..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <div className="flex-1">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
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
        )}

        {/* Add Member Button */}
        <Button 
          onClick={onAddMember} 
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة عضو جديد
        </Button>

        {/* Member List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>لا توجد أعضاء</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div 
                key={member.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.image_url} />
                    <AvatarFallback className={getGenderColor(member.gender)}>
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="font-semibold">{getMemberDisplayName(member)}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.gender === 'male' ? 'ذكر' : member.gender === 'female' ? 'أنثى' : 'غير محدد'}
                      {member.birth_date && (
                        <span> • {new Date(member.birth_date).getFullYear()}</span>
                      )}
                      {member.is_founder && <span> • مؤسس</span>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMemberSelect(member)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMemberEdit(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {onMemberDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف العضو</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف العضو "{getMemberDisplayName(member)}"؟ 
                              هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onMemberDelete(member)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};