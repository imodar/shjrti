import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { MemberFormData } from "../../types/family.types";
import { ImageUploadSection } from "./ImageUploadSection";

interface BasicInfoStepProps {
  formData: MemberFormData;
  onFormDataChange: (data: Partial<MemberFormData>) => void;
  isEditMode: boolean;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  onFormDataChange,
  isEditMode
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="first_name">الاسم الأول *</Label>
        <Input
          id="first_name"
          value={formData.first_name || ''}
          onChange={(e) => onFormDataChange({ first_name: e.target.value })}
          placeholder="أدخل الاسم الأول"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">الجنس *</Label>
        <Select
          value={formData.gender || 'male'}
          onValueChange={(value) => onFormDataChange({ gender: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر الجنس" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">ذكر</SelectItem>
            <SelectItem value="female">أنثى</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">تاريخ الميلاد</Label>
        <EnhancedDatePicker
          value={formData.birthDate || undefined}
          onChange={(date) => onFormDataChange({ birthDate: date || null })}
        />
      </div>

      <div className="space-y-2">
        <Label>الصورة</Label>
        <ImageUploadSection
          imageUrl={formData.imageUrl}
          croppedImage={formData.croppedImage}
          onImageChange={(imageUrl, croppedImage) =>
            onFormDataChange({ imageUrl, croppedImage })
          }
        />
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <input
          type="checkbox"
          id="isFounder"
          checked={formData.isFounder || false}
          onChange={(e) => onFormDataChange({ isFounder: e.target.checked })}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isFounder" className="cursor-pointer">
          هل هذا العضو هو مؤسس العائلة؟
        </Label>
      </div>
    </div>
  );
};