import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { MemberFormData } from "../../types/family.types";

interface AdditionalInfoStepProps {
  formData: MemberFormData;
  onFormDataChange: (data: Partial<MemberFormData>) => void;
}

export const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 space-x-reverse mb-4">
        <input
          type="checkbox"
          id="isAlive"
          checked={formData.isAlive !== false}
          onChange={(e) => {
            const isAlive = e.target.checked;
            onFormDataChange({
              isAlive,
              deathDate: isAlive ? null : formData.deathDate
            });
          }}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isAlive" className="cursor-pointer">
          على قيد الحياة
        </Label>
      </div>

      {formData.isAlive === false && (
        <div className="space-y-2">
          <Label htmlFor="deathDate">تاريخ الوفاة</Label>
          <EnhancedDatePicker
            value={formData.deathDate || undefined}
            onChange={(date) => onFormDataChange({ deathDate: date || null })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="bio">السيرة الذاتية</Label>
        <Textarea
          id="bio"
          value={formData.bio || ''}
          onChange={(e) => onFormDataChange({ bio: e.target.value })}
          placeholder="أضف معلومات إضافية عن العضو..."
          rows={6}
        />
      </div>
    </div>
  );
};