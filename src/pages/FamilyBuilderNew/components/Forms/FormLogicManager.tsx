import React from "react";
import { MemberDetailForm } from "./MemberDetailForm";
import { SpouseForm } from "@/components/SpouseForm";
import { ImageUploadManager } from "../ImageManagement/ImageUploadManager";
import { useFormLogic } from "../../hooks/useFormLogic";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { Member } from "../../types/family.types";

interface FormLogicManagerProps {
  familyId: string;
  familyData: any;
  familyMembers: Member[];
  familyMarriages: any[];
  packageData: any;
  subscriptionData: any;
  editingMember: any;
  formMode: string;
  refreshFamilyData: () => Promise<void>;
  onFormModeChange: (mode: string) => void;
  onCurrentStepChange: (step: number) => void;
}

export const FormLogicManager: React.FC<FormLogicManagerProps> = ({
  familyId,
  familyData,
  familyMembers,
  familyMarriages,
  packageData,
  subscriptionData,
  editingMember,
  formMode,
  refreshFamilyData,
  onFormModeChange,
  onCurrentStepChange
}) => {
  const {
    // Form State
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    isSaving,
    
    // Spouse State
    wives,
    husband,
    currentWife,
    setCurrentWife,
    currentHusband,
    setCurrentHusband,
    showWifeForm,
    setShowWifeForm,
    showHusbandForm,
    setShowHusbandForm,
    wifeFamilyStatus,
    husbandFamilyStatus,
    wifeCommandOpen,
    setWifeCommandOpen,
    husbandCommandOpen,
    setHusbandCommandOpen,
    
    // Functions
    nextStep,
    prevStep,
    handleWifeFamilyStatusChange,
    handleHusbandFamilyStatusChange,
    handleAddWife,
    handleAddHusband,
    handleSpouseSave,
    handleFormSubmit,
    resetFormData,
    populateFormData
  } = useFormLogic(
    familyId,
    familyData,
    familyMembers,
    familyMarriages,
    packageData,
    subscriptionData,
    editingMember,
    formMode,
    refreshFamilyData
  );

  // Sync step changes with parent
  React.useEffect(() => {
    onCurrentStepChange(currentStep);
  }, [currentStep, onCurrentStepChange]);

  // Initialize form when editing member changes
  React.useEffect(() => {
    if (editingMember && formMode === 'edit') {
      populateFormData(editingMember);
    } else if (formMode === 'add') {
      resetFormData();
    }
  }, [editingMember, formMode]);

  const handleImageChange = (imageUrl: string | null) => {
    setFormData(prev => ({ ...prev, croppedImage: imageUrl }));
  };

  const getMemberName = () => {
    if (formData.first_name) {
      return formData.first_name;
    }
    if (editingMember?.name) {
      return editingMember.name;
    }
    return "العضو الجديد";
  };

  const handleSave = () => {
    handleFormSubmit(formData);
    resetFormData();
    onFormModeChange('view');
  };

  const handleCancel = () => {
    resetFormData();
    onFormModeChange('view');
  };

  if (formMode !== 'add' && formMode !== 'edit') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Step Content */}
      {currentStep === 1 && (
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
            formData={{
              firstName: formData.first_name || '',
              middleName: '',
              lastName: '',
              nickname: '',
              gender: formData.gender,
              birthDate: formData.birthDate,
              deathDate: formData.deathDate,
              birthPlace: '',
              deathPlace: '',
              currentResidence: '',
              occupation: '',
              education: '',
              biography: formData.bio || '',
              isAlive: formData.isAlive,
              isFounder: formData.isFounder || false,
              fatherId: formData.selectedParent || '',
              motherId: ''
            }}
            setFormData={(data) => setFormData(prev => ({
              ...prev,
              first_name: data.firstName || prev.first_name,
              gender: data.gender || prev.gender,
              birthDate: data.birthDate,
              deathDate: data.deathDate,
              isAlive: data.isAlive !== undefined ? data.isAlive : prev.isAlive,
              isFounder: data.isFounder !== undefined ? data.isFounder : prev.isFounder,
              selectedParent: data.fatherId || prev.selectedParent,
              bio: data.biography || prev.bio
            }))}
            familyMembers={familyMembers}
            editingMember={editingMember}
          />
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {formData.gender === "male" ? "معلومات الزوجة/الزوجات" : "معلومات الزوج"}
          </h3>
          <p className="text-sm text-muted-foreground -mt-1">
            {formData.gender === "male" ? "أضف معلومات الزوجة أو الزوجات إذا كان متزوجاً" : "أضف معلومات الزوج إذا كانت متزوجة"}
          </p>
          
          {formData.gender === "male" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Wives Display Panel */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4 w-full">
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                    <span className="w-3 h-3 text-white">♀</span>
                  </div>
                  <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300 font-arabic">الزوجات</h4>
                </div>
                
                <div className="space-y-3">
                  {wives.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <span className="w-12 h-12 mx-auto mb-3 opacity-30">♀</span>
                      <p className="font-arabic">لم يتم إضافة زوجات بعد</p>
                    </div>
                  ) : (
                    wives.map((wife, index) => (
                      <div key={index} className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 border-2 border-dashed border-pink-400/60 dark:border-pink-500/60 min-h-[160px]">
                        <div className="h-full flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 dark:text-gray-100 font-arabic text-lg mb-2">
                                  {wife.name || `الزوجة ${index + 1}`}
                                </h5>
                                <div className="space-y-2">
                                  {wife.isSaved && (
                                    <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                                      ✓ محفوظة
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Wife Form */}
              <div className="space-y-4 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4 w-full">
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                    <span className="w-3 h-3 text-white">♀</span>
                  </div>
                  <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300 font-arabic">إضافة زوجة</h4>
                </div>
                
                <SpouseForm 
                  spouseType="wife" 
                  spouse={currentWife || {
                    id: '',
                    firstName: '',
                    lastName: '',
                    name: '',
                    isAlive: true,
                    birthDate: null,
                    deathDate: null,
                    maritalStatus: 'married',
                    isFamilyMember: false,
                    existingFamilyMemberId: '',
                    croppedImage: null,
                    biography: '',
                    isSaved: false
                  }} 
                  onSpouseChange={setCurrentWife} 
                  familyMembers={familyMembers} 
                  selectedMember={null}
                  commandOpen={wifeCommandOpen} 
                  onCommandOpenChange={setWifeCommandOpen} 
                  familyStatus={wifeFamilyStatus[0] || 'no'} 
                  onFamilyStatusChange={(status) => handleWifeFamilyStatusChange(0, status)} 
                  onSave={() => handleSpouseSave('wife')} 
                  onAdd={handleAddWife} 
                  onClose={() => setShowWifeForm(false)} 
                  showForm={showWifeForm} 
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Husband Display Panel */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center">
                    <span className="w-3 h-3 text-white">♂</span>
                  </div>
                  <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 font-arabic">معلومات الزوج</h4>
                </div>
                
                <div className="space-y-3">
                  {!husband ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <span className="w-12 h-12 mx-auto mb-3 opacity-30">♂</span>
                      <p className="font-arabic">لم يتم إضافة زوج بعد</p>
                    </div>
                  ) : (
                    <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-4 border-2 border-dashed border-blue-400/60 dark:border-blue-500/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            ♂
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 font-arabic">
                              {husband.name || 'الزوج'}
                            </h5>
                            {husband.isSaved && (
                              <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                                ✓ محفوظ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Husband Form */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center">
                    <span className="w-3 h-3 text-white">♂</span>
                  </div>
                  <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 font-arabic">إضافة زوج</h4>
                </div>
                
                <SpouseForm 
                  spouseType="husband" 
                  spouse={currentHusband || {
                    id: '',
                    firstName: '',
                    lastName: '',
                    name: '',
                    isAlive: true,
                    birthDate: null,
                    deathDate: null,
                    maritalStatus: 'married',
                    isFamilyMember: false,
                    existingFamilyMemberId: '',
                    croppedImage: null,
                    biography: '',
                    isSaved: false
                  }} 
                  onSpouseChange={setCurrentHusband} 
                  familyMembers={familyMembers} 
                  selectedMember={null}
                  commandOpen={husbandCommandOpen} 
                  onCommandOpenChange={setHusbandCommandOpen} 
                  familyStatus={husbandFamilyStatus || 'no'} 
                  onFamilyStatusChange={handleHusbandFamilyStatusChange} 
                  onSave={() => handleSpouseSave('husband')} 
                  onAdd={handleAddHusband} 
                  onClose={() => setShowHusbandForm(false)} 
                  showForm={showHusbandForm} 
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ArrowRight className="h-4 w-4 mr-2" />
              السابق
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleCancel}>
            إلغاء
          </Button>
        </div>
        
        <div className="flex gap-2">
          {currentStep < 2 && (
            <Button type="button" onClick={nextStep}>
              التالي
              <ArrowLeft className="h-4 w-4 ml-2" />
            </Button>
          )}
          {currentStep === 2 && (
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'جاري الحفظ...' : 'حفظ العضو'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};