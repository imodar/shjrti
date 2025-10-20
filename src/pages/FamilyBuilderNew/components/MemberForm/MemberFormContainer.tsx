import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Save, X } from "lucide-react";
import { BasicInfoStep } from "./BasicInfoStep";
import { AdditionalInfoStep } from "./AdditionalInfoStep";
import { SpouseFormSection } from "./SpouseFormSection";
import { MemberFormData } from "../../types/family.types";

interface MemberFormContainerProps {
  formMode: 'add' | 'edit';
  formData: MemberFormData;
  currentStep: number;
  isSaving: boolean;
  onFormDataChange: (data: Partial<MemberFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onStepChange: (step: number) => void;
}

export const MemberFormContainer: React.FC<MemberFormContainerProps> = ({
  formMode,
  formData,
  currentStep,
  isSaving,
  onFormDataChange,
  onSubmit,
  onCancel,
  onStepChange
}) => {
  const isEditMode = formMode === 'edit';
  
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {isEditMode ? 'تعديل بيانات عضو' : 'إضافة عضو جديد'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6">
            {currentStep === 1 && (
              <BasicInfoStep
                formData={formData}
                onFormDataChange={onFormDataChange}
                isEditMode={isEditMode}
              />
            )}

            {currentStep === 2 && (
              <AdditionalInfoStep
                formData={formData}
                onFormDataChange={onFormDataChange}
              />
            )}

            {currentStep === 3 && (
              <SpouseFormSection
                formData={formData}
                onFormDataChange={onFormDataChange}
              />
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => onStepChange(currentStep - 1)}
              disabled={isSaving}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              السابق
            </Button>
          )}

          <div className="flex-1" />

          {currentStep < 3 ? (
            <Button onClick={() => onStepChange(currentStep + 1)} disabled={isSaving}>
              التالي
            </Button>
          ) : (
            <Button onClick={onSubmit} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};