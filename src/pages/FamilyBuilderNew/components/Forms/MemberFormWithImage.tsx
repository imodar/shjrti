import React from "react";
import { MemberDetailForm } from "./MemberDetailForm";
import { ImageUploadManager } from "../ImageManagement/ImageUploadManager";
import { Member } from "../../types/family.types";

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  gender: "male" | "female" | "";
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

interface MemberFormWithImageProps {
  formData: FormData & { croppedImage?: string | null };
  setFormData: (data: Partial<FormData & { croppedImage?: string | null }>) => void;
  familyMembers: Member[];
  editingMember?: Member | null;
  currentStep: number;
}

export const MemberFormWithImage: React.FC<MemberFormWithImageProps> = ({
  formData,
  setFormData,
  familyMembers,
  editingMember,
  currentStep
}) => {
  const handleImageChange = (imageUrl: string | null) => {
    setFormData({ croppedImage: imageUrl });
  };

  const getMemberName = () => {
    if (formData.firstName) {
      return formData.firstName;
    }
    if (editingMember?.name) {
      return editingMember.name;
    }
    return "العضو الجديد";
  };

  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        {/* Image Upload Section */}
        <div className="flex justify-center">
          <ImageUploadManager
            currentImage={formData.croppedImage || editingMember?.image_url}
            onImageChange={handleImageChange}
            memberName={getMemberName()}
            size="lg"
          />
        </div>

        {/* Basic Form */}
        <MemberDetailForm
          formData={formData}
          setFormData={setFormData}
          familyMembers={familyMembers}
          editingMember={editingMember}
        />
      </div>
    );
  }

  return (
    <MemberDetailForm
      formData={formData}
      setFormData={setFormData}
      familyMembers={familyMembers}
      editingMember={editingMember}
    />
  );
};