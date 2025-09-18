import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, UserPlus, Eye, Edit } from "lucide-react";
import { MemberProfileView } from "@/components/MemberProfileView";
import { Member } from "../../types/family.types";

interface FormPanelContainerProps {
  formMode: 'view' | 'add' | 'edit' | 'profile' | 'tree-settings';
  editingMember: Member | null;
  memberProfileData: any;
  profileLoading: boolean;
  familyMembers: Member[];
  familyMarriages: any[];
  familyData?: any;
  familyId?: string;
  generationCount?: number;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onAddMember?: () => void;
  onShowSettings?: () => void;
  children?: React.ReactNode;
}

export const FormPanelContainer: React.FC<FormPanelContainerProps> = ({
  formMode,
  editingMember,
  memberProfileData,
  profileLoading,
  familyMembers,
  familyMarriages,
  familyData,
  familyId,
  generationCount,
  onClose,
  onEdit,
  onAddMember,
  onShowSettings,
  children
}) => {
  const getTitle = () => {
    switch (formMode) {
      case 'add':
        return 'إضافة عضو جديد';
      case 'edit':
        return 'تعديل بيانات العضو';
      case 'profile':
        return 'ملف العضو';
      case 'tree-settings':
        return 'إعدادات الشجرة';
      default:
        return 'اختر عضواً لعرض تفاصيله';
    }
  };

  const getIcon = () => {
    switch (formMode) {
      case 'add':
        return <UserPlus className="h-5 w-5" />;
      case 'edit':
        return <Edit className="h-5 w-5" />;
      case 'profile':
        return <Eye className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (formMode === 'profile' && memberProfileData) {
    return (
      <div className="h-full overflow-auto">
        <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h2 className="text-lg font-semibold">{getTitle()}</h2>
          </div>
          <div className="flex items-center gap-2">
            {editingMember && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(editingMember)}
              >
                <Edit className="h-4 w-4 mr-2" />
                تعديل
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <MemberProfileView
            member={memberProfileData}
            familyMembers={familyMembers}
            marriages={familyMarriages}
            onEdit={() => editingMember && onEdit(editingMember)}
            onDelete={() => {}}
            onBack={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h2 className="text-lg font-semibold">{getTitle()}</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};