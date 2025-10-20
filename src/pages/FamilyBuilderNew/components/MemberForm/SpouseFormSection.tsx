import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MemberFormData } from "../../types/family.types";

interface SpouseFormSectionProps {
  formData: MemberFormData;
  onFormDataChange: (data: Partial<MemberFormData>) => void;
}

export const SpouseFormSection: React.FC<SpouseFormSectionProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-lg font-semibold">العلاقات الزوجية</Label>
        
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">
            {formData.gender === 'male' 
              ? 'يمكنك إضافة الزوجات في هذه الخطوة'
              : 'يمكنك إضافة الزوج في هذه الخطوة'
            }
          </p>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // This will be handled by the parent component
              console.log('Add spouse clicked');
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {formData.gender === 'male' ? 'إضافة زوجة' : 'إضافة زوج'}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>* يمكنك إضافة العلاقات الزوجية الآن أو لاحقاً</p>
        <p>* سيتم حفظ البيانات بشكل تلقائي</p>
      </div>
    </div>
  );
};