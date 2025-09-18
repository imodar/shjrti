import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, ArrowRight, ArrowLeft } from "lucide-react";
import { MemberBasicInfoForm } from "./MemberBasicInfoForm";
import { ImageUploadSection } from "../ImageUpload/ImageUploadSection";
import { ImageCropDialog } from "../ImageUpload/ImageCropDialog";
import { useImageCrop } from "../../hooks/useImageCrop";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";
import { Member, Marriage } from "../../types/family.types";

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  gender: string;
  birthDate: Date | undefined;
  deathDate: Date | undefined;
  birthPlace: string;
  deathPlace: string;
  currentResidence: string;
  occupation: string;
  education: string;
  biography: string;
  isAlive: boolean;
  isFounder: boolean;
  fatherId: string;
  motherId: string;
}

interface MemberFormContainerProps {
  formData: FormData;
  setFormData: (data: Partial<FormData>) => void;
  familyMembers: Member[];
  familyMarriages: Marriage[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isSaving: boolean;
  loading: boolean;
  onSave: () => void;
  editingMember?: Member | null;
}

export const MemberFormContainer: React.FC<MemberFormContainerProps> = ({
  formData,
  setFormData,
  familyMembers,
  familyMarriages,
  currentStep,
  setCurrentStep,
  isSaving,
  loading,
  onSave,
  editingMember
}) => {
  const {
    selectedImage,
    croppedImage,
    showCropDialog,
    imageChanged,
    crop,
    zoom,
    fileInputRef,
    handleImageSelect,
    handleCropSave,
    handleDeleteImage,
    handleEditImage,
    onCropComplete,
    setCrop,
    setZoom,
    setShowCropDialog
  } = useImageCrop();

  const { isImageUploadEnabled, loading: uploadLoading } = useImageUploadPermission();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
                <Badge variant="outline">الخطوة 1 من 3</Badge>
              </div>
              
              <MemberBasicInfoForm
                formData={{
                  first_name: formData.firstName,
                  gender: formData.gender,
                  birthDate: formData.birthDate,
                  selectedParent: formData.fatherId,
                  isAlive: formData.isAlive,
                  deathDate: formData.deathDate,
                  isFounder: formData.isFounder
                }}
                setFormData={(data) => {
                  setFormData({
                    firstName: data.first_name || formData.firstName,
                    gender: data.gender || formData.gender,
                    birthDate: data.birthDate,
                    fatherId: data.selectedParent || formData.fatherId,
                    isAlive: data.isAlive !== undefined ? data.isAlive : formData.isAlive,
                    deathDate: data.deathDate,
                    isFounder: data.isFounder !== undefined ? data.isFounder : formData.isFounder
                  });
                }}
                familyMembers={familyMembers}
                familyMarriages={familyMarriages}
                loading={loading}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">الصورة الشخصية</h3>
                <Badge variant="outline">الخطوة 2 من 3</Badge>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <ImageUploadSection
                    croppedImage={croppedImage}
                    currentImage={editingMember?.image_url}
                    onImageSelect={handleImageSelect}
                    onEditImage={handleEditImage}
                    onDeleteImage={handleDeleteImage}
                    fileInputRef={fileInputRef}
                    isImageUploadEnabled={isImageUploadEnabled}
                    loading={uploadLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">معلومات إضافية</h3>
                <Badge variant="outline">الخطوة 3 من 3</Badge>
              </div>
              
              <div className="grid gap-4">
                {/* Additional form fields would go here */}
                <p className="text-sm text-muted-foreground text-center py-8">
                  الحقول الإضافية قريباً...
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Form Content */}
      {renderStep()}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isSaving}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              السابق
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!formData.firstName || !formData.gender}
            >
              التالي
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onSave}
              disabled={isSaving || !formData.firstName || !formData.gender}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ العضو'}
            </Button>
          )}
        </div>
      </div>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={showCropDialog}
        onClose={() => setShowCropDialog(false)}
        selectedImage={selectedImage}
        crop={crop}
        zoom={zoom}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
        onSave={handleCropSave}
      />
    </div>
  );
};