import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { ImageUploadSection } from "../ImageUpload/ImageUploadSection";
import { Heart, Save, UserPlus } from "lucide-react";
import { Member } from "../../types/family.types";

export interface SpouseData {
  id?: string;
  existingFamilyMemberId?: string;
  name: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  birthDate?: Date;
  deathDate?: Date;
  isAlive: boolean;
  imageUrl?: string;
  isFamilyMember?: boolean;
  isSaved?: boolean;
}

interface SpouseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberGender: 'male' | 'female';
  familyMembers: Member[];
  existingSpouse?: SpouseData;
  onSave: (spouseData: SpouseData) => void;
  title: string;
}

export const SpouseFormDialog: React.FC<SpouseFormDialogProps> = ({
  open,
  onOpenChange,
  memberGender,
  familyMembers,
  existingSpouse,
  onSave,
  title
}) => {
  const [formData, setFormData] = useState<SpouseData>({
    name: '',
    firstName: '',
    lastName: '',
    gender: memberGender === 'male' ? 'female' : 'male',
    isAlive: true,
    isFamilyMember: false,
    isSaved: false
  });

  const [isExistingMember, setIsExistingMember] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  // Get available family members of opposite gender
  const availableMembers = familyMembers.filter(member => 
    member.gender === (memberGender === 'male' ? 'female' : 'male')
  );

  useEffect(() => {
    if (existingSpouse) {
      setFormData(existingSpouse);
      if (existingSpouse.existingFamilyMemberId) {
        setIsExistingMember(true);
        setSelectedMemberId(existingSpouse.existingFamilyMemberId);
      }
    } else {
      setFormData({
        name: '',
        firstName: '',
        lastName: '',
        gender: memberGender === 'male' ? 'female' : 'male',
        isAlive: true,
        isFamilyMember: false,
        isSaved: false
      });
      setIsExistingMember(false);
      setSelectedMemberId('');
    }
  }, [existingSpouse, memberGender, open]);

  const handleExistingMemberChange = (memberId: string) => {
    const member = familyMembers.find(m => m.id === memberId);
    if (member) {
      setSelectedMemberId(memberId);
      setFormData({
        ...formData,
        existingFamilyMemberId: member.id,
        name: member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim(),
        firstName: member.first_name || '',
        lastName: member.last_name || '',
        gender: member.gender as 'male' | 'female',
        birthDate: member.birth_date ? new Date(member.birth_date) : undefined,
        deathDate: member.death_date ? new Date(member.death_date) : undefined,
        isAlive: member.is_alive ?? true,
        imageUrl: member.image_url || undefined,
        isFamilyMember: true
      });
    }
  };

  const handleSave = () => {
    const spouseData: SpouseData = {
      ...formData,
      isSaved: true
    };

    // Ensure name is constructed properly
    if (!spouseData.name && (spouseData.firstName || spouseData.lastName)) {
      spouseData.name = `${spouseData.firstName || ''} ${spouseData.lastName || ''}`.trim();
    }

    onSave(spouseData);
    onOpenChange(false);
  };

  const isFormValid = () => {
    if (isExistingMember) {
      return selectedMemberId !== '';
    }
    return formData.firstName.trim() !== '' || formData.name.trim() !== '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Member Type Selection */}
          <div className="space-y-3">
            <Label>نوع العضو</Label>
            <Select
              value={isExistingMember ? 'existing' : 'new'}
              onValueChange={(value) => {
                setIsExistingMember(value === 'existing');
                if (value === 'new') {
                  setSelectedMemberId('');
                  setFormData({
                    ...formData,
                    existingFamilyMemberId: undefined,
                    isFamilyMember: false
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">عضو جديد (خارج العائلة)</SelectItem>
                <SelectItem value="existing">اختيار من أعضاء العائلة الحاليين</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isExistingMember ? (
            /* Existing Member Selection */
            <div className="space-y-3">
              <Label>اختيار العضو</Label>
              <Select value={selectedMemberId} onValueChange={handleExistingMemberChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر عضواً من العائلة" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            /* New Spouse Form */
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="flex justify-center">
                <ImageUploadSection
                  currentImage={formData.imageUrl}
                  onImageChange={(imageUrl) => setFormData({ ...formData, imageUrl: imageUrl || undefined })}
                  memberName={formData.name || 'الزوج/الزوجة'}
                />
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">الاسم الأول *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="الاسم الأول"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">اسم العائلة</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="اسم العائلة"
                  />
                </div>
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label>تاريخ الميلاد</Label>
                <EnhancedDatePicker
                  value={formData.birthDate}
                  onChange={(date) => setFormData({ ...formData, birthDate: date })}
                  placeholder="اختر تاريخ الميلاد"
                />
              </div>

              {/* Living Status */}
              <div className="space-y-3">
                <Label>الحالة</Label>
                <Select
                  value={formData.isAlive ? 'alive' : 'deceased'}
                  onValueChange={(value) => {
                    const isAlive = value === 'alive';
                    setFormData({ 
                      ...formData, 
                      isAlive,
                      deathDate: isAlive ? undefined : formData.deathDate
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alive">على قيد الحياة</SelectItem>
                    <SelectItem value="deceased">متوفى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Death Date (if deceased) */}
              {!formData.isAlive && (
                <div className="space-y-2">
                  <Label>تاريخ الوفاة</Label>
                  <EnhancedDatePicker
                    value={formData.deathDate}
                    onChange={(date) => setFormData({ ...formData, deathDate: date })}
                    placeholder="اختر تاريخ الوفاة"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={!isFormValid()}>
              <Save className="h-4 w-4 mr-2" />
              حفظ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};