/**
 * AddMemberForm - Stitch Theme Add/Edit Member Form
 * Modular component for adding and editing family members
 */

import React, { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { SpouseForm, SpouseData } from '@/components/SpouseForm';
import Cropper from 'react-easy-crop';
import { useAddMemberForm } from './useAddMemberForm';
import { AddMemberFormProps, FormMode } from './AddMemberFormTypes';

export const AddMemberForm: React.FC<AddMemberFormProps> = ({
  familyId,
  familyMembers,
  marriages,
  familyData,
  editingMember,
  formMode,
  onClose,
  onMemberSaved,
  onMemberDeleted
}) => {
  const { t, direction } = useLanguage();
  const isRTL = direction === 'rtl';

  const {
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    isSaving,
    parentsLocked,
    wives,
    husbands,
    currentSpouse,
    setCurrentSpouse,
    activeSpouseType,
    showSpouseForm,
    spouseCommandOpen,
    setSpouseCommandOpen,
    spouseFamilyStatus,
    setSpouseFamilyStatus,
    selectedImage,
    croppedImage,
    showCropDialog,
    setShowCropDialog,
    editingMemberImageUrl,
    crop,
    setCrop,
    zoom,
    setZoom,
    fileInputRef,
    isImageUploadEnabled,
    handleImageSelect,
    handleCropSave,
    handleDeleteImage,
    onCropComplete,
    handleAddSpouse,
    handleSpouseSave,
    handleSpouseDelete,
    handleSpouseEdit,
    closeSpouseForm,
    populateFormData,
    handleFormSubmit,
    nextStep,
    prevStep,
    currentSiblings
  } = useAddMemberForm({
    familyId,
    familyMembers,
    marriages,
    familyData,
    editingMember,
    formMode,
    onClose,
    onMemberSaved
  });

  // Populate form data when editing
  useEffect(() => {
    if (formMode === 'edit' && editingMember) {
      populateFormData(editingMember);
    }
  }, [formMode, editingMember, populateFormData]);

  // Build marriage options for parent selection
  const marriageOptions = marriages.map(marriage => {
    const husband = familyMembers.find(m => m.id === marriage.husband_id);
    const wife = familyMembers.find(m => m.id === marriage.wife_id);
    const husbandName = husband?.first_name || husband?.name || t('member.unknown', 'غير معروف');
    const wifeName = wife?.first_name || wife?.name || t('member.unknown', 'غير معروف');
    return {
      id: marriage.id,
      label: `${husbandName} & ${wifeName}`,
      husband,
      wife
    };
  });

  // Get display image
  const displayImage = croppedImage || editingMemberImageUrl || null;

  return (
    <div className={cn(
      'h-full overflow-y-auto bg-white dark:bg-slate-900 p-6 custom-scrollbar',
      isRTL && 'rtl'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-icons-round text-slate-500">
              {isRTL ? 'arrow_forward' : 'arrow_back'}
            </span>
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {formMode === 'edit' 
                ? t('member.edit', 'تعديل العضو')
                : t('member.add', 'إضافة عضو جديد')}
            </h2>
            <p className="text-sm text-slate-500">
              {t('member.step', 'الخطوة')} {currentStep} {t('member.of', 'من')} 2
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
            currentStep >= 1 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          )}>
            1
          </div>
          <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
            currentStep >= 2 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          )}>
            2
          </div>
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Photo */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className={cn(
                'w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center',
                displayImage && 'border-primary/50'
              )}>
                {displayImage ? (
                  <img 
                    src={displayImage} 
                    alt="Member" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-icons-round text-4xl text-slate-300">person</span>
                )}
              </div>
              {isImageUploadEnabled && (
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:opacity-90 transition-opacity">
                  <span className="material-icons-round text-sm">add_a_photo</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>
            {displayImage && (
              <button
                onClick={handleDeleteImage}
                className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <span className="material-icons-round text-sm">delete</span>
                {t('member.delete_image', 'حذف الصورة')}
              </button>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                {t('member.first_name', 'الاسم الأول')} *
              </Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  first_name: e.target.value,
                  name: `${e.target.value} ${prev.name.split(' ').slice(1).join(' ')}`.trim()
                }))}
                placeholder={t('member.first_name_placeholder', 'أحمد')}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                {t('member.last_name', 'اسم العائلة')}
              </Label>
              <Input
                value={formData.name.split(' ').slice(1).join(' ') || familyData?.name || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  name: `${prev.first_name} ${e.target.value}`.trim()
                }))}
                placeholder={familyData?.name || t('member.last_name_placeholder', 'السعيد')}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              {t('member.gender', 'الجنس')} *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                  formData.gender === 'male'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                )}
              >
                <span className="material-icons-round">male</span>
                <span className="font-medium">{t('member.male', 'ذكر')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                  formData.gender === 'female'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                )}
              >
                <span className="material-icons-round">female</span>
                <span className="font-medium">{t('member.female', 'أنثى')}</span>
              </button>
            </div>
          </div>

          {/* Parents Selection (only for adding new members) */}
          {formMode === 'add' && marriageOptions.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                {t('member.parents', 'الوالدين')}
              </Label>
              <Select
                value={formData.selectedParent || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  selectedParent: value === 'none' ? null : value 
                }))}
                disabled={parentsLocked}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={t('member.select_parents', 'اختر الوالدين')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('member.no_parents', 'بدون والدين (مؤسس)')}</SelectItem>
                  {marriageOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.selectedParent && formMode === 'add' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <span className="material-icons-round text-sm">info</span>
                  {t('member.founder_hint', 'سيتم تسجيله كمؤسس')}
                </p>
              )}
            </div>
          )}

          {/* Birth Date */}
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              {t('member.birth_date', 'تاريخ الميلاد')}
            </Label>
            <EnhancedDatePicker
              value={formData.birthDate || undefined}
              onChange={(date) => setFormData(prev => ({ ...prev, birthDate: date || null }))}
              placeholder={t('member.select_date', 'اختر التاريخ')}
            />
          </div>

          {/* Is Alive */}
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              {t('member.status', 'الحالة')}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isAlive: true, deathDate: null }))}
                className={cn(
                  'p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                  formData.isAlive
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                )}
              >
                <span className="material-icons-round text-sm">favorite</span>
                <span className="font-medium text-sm">{t('member.alive', 'على قيد الحياة')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isAlive: false }))}
                className={cn(
                  'p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                  !formData.isAlive
                    ? 'border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-600'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                )}
              >
                <span className="material-icons-round text-sm">history</span>
                <span className="font-medium text-sm">{t('member.deceased', 'متوفى')}</span>
              </button>
            </div>
          </div>

          {/* Death Date (if deceased) */}
          {!formData.isAlive && (
            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                {t('member.death_date', 'تاريخ الوفاة')}
              </Label>
            <EnhancedDatePicker
              value={formData.deathDate || undefined}
              onChange={(date) => setFormData(prev => ({ ...prev, deathDate: date || null }))}
              placeholder={t('member.select_date', 'اختر التاريخ')}
            />
            </div>
          )}

          {/* Biography */}
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              {t('member.biography', 'السيرة الذاتية')}
            </Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder={t('member.biography_placeholder', 'اكتب نبذة عن العضو...')}
              className="min-h-[100px] rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary resize-none"
            />
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={nextStep}
              disabled={!formData.first_name.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-11"
            >
              {t('member.next', 'التالي')}
              <span className={cn('material-icons-round text-sm', isRTL ? 'mr-2' : 'ml-2')}>
                {isRTL ? 'arrow_back' : 'arrow_forward'}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Marriage Information */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Marriage Section Header */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-900/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                <span className="material-icons-round text-pink-600">favorite</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {t('member.marriage_info', 'معلومات الزواج')}
                </h3>
                <p className="text-sm text-slate-500">
                  {formData.gender === 'male' 
                    ? t('member.add_wives', 'أضف زوجة أو أكثر')
                    : t('member.add_husband', 'أضف الزوج')}
                </p>
              </div>
            </div>
          </div>

          {/* Existing Spouses List */}
          {formData.gender === 'male' && wives.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('member.current_wives', 'الزوجات الحالية')} ({wives.length})
              </Label>
              {wives.map((wife, index) => (
                <div 
                  key={wife.id || index}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                      {wife.croppedImage ? (
                        <img src={wife.croppedImage} alt={wife.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-pink-600 font-bold">
                          {wife.firstName?.charAt(0) || wife.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {wife.name || `${wife.firstName} ${wife.lastName}`.trim() || t('member.unnamed', 'بدون اسم')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {wife.isFamilyMember 
                          ? t('member.family_member', 'من أفراد العائلة')
                          : t('member.external', 'خارج العائلة')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpouseEdit('wife', wife, index)}
                      className="p-2 text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-icons-round text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => handleSpouseDelete(wife, index)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <span className="material-icons-round text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {formData.gender === 'female' && husbands.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('member.current_husband', 'الزوج الحالي')}
              </Label>
              {husbands.map((husband, index) => (
                <div 
                  key={husband.id || index}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      {husband.croppedImage ? (
                        <img src={husband.croppedImage} alt={husband.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-blue-600 font-bold">
                          {husband.firstName?.charAt(0) || husband.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {husband.name || `${husband.firstName} ${husband.lastName}`.trim() || t('member.unnamed', 'بدون اسم')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {husband.isFamilyMember 
                          ? t('member.family_member', 'من أفراد العائلة')
                          : t('member.external', 'خارج العائلة')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpouseEdit('husband', husband, index)}
                      className="p-2 text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-icons-round text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => handleSpouseDelete(husband, index)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <span className="material-icons-round text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Spouse Form */}
          {showSpouseForm && currentSpouse && activeSpouseType && (
            <SpouseForm
              spouseType={activeSpouseType}
              spouse={currentSpouse}
              onSpouseChange={(spouse) => setCurrentSpouse(spouse)}
              familyMembers={familyMembers}
              selectedMember={editingMember}
              commandOpen={spouseCommandOpen}
              onCommandOpenChange={setSpouseCommandOpen}
              familyStatus={spouseFamilyStatus || 'no'}
              onFamilyStatusChange={(status) => setSpouseFamilyStatus(status as 'yes' | 'no')}
              onSave={() => handleSpouseSave(activeSpouseType)}
              onAdd={() => {}}
              onClose={closeSpouseForm}
              showForm={true}
              marriages={marriages}
            />
          )}

          {/* Add Spouse Button */}
          {!showSpouseForm && (
            <>
              {formData.gender === 'male' && wives.length < 4 && (
                <button
                  onClick={() => handleAddSpouse('wife')}
                  className="w-full p-4 border-2 border-dashed border-pink-300 dark:border-pink-700 rounded-xl text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round">add</span>
                  {t('member.add_wife', 'إضافة زوجة')}
                </button>
              )}
              {formData.gender === 'female' && husbands.length === 0 && (
                <button
                  onClick={() => handleAddSpouse('husband')}
                  className="w-full p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round">add</span>
                  {t('member.add_husband', 'إضافة زوج')}
                </button>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={prevStep}
              className="rounded-xl px-6 h-11"
            >
              <span className={cn('material-icons-round text-sm', isRTL ? 'ml-2' : 'mr-2')}>
                {isRTL ? 'arrow_forward' : 'arrow_back'}
              </span>
              {t('member.back', 'السابق')}
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-11"
            >
              {isSaving ? (
                <>
                  <span className="material-icons-round animate-spin text-sm mr-2">refresh</span>
                  {t('member.saving', 'جاري الحفظ...')}
                </>
              ) : (
                <>
                  <span className="material-icons-round text-sm mr-2">save</span>
                  {formMode === 'edit' 
                    ? t('member.save_changes', 'حفظ التغييرات')
                    : t('member.save_member', 'حفظ العضو')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Image Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('member.crop_image', 'قص الصورة')}</DialogTitle>
          </DialogHeader>
          <div className="relative h-64 bg-slate-900 rounded-xl overflow-hidden">
            {selectedImage && (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-slate-500">{t('member.zoom', 'التكبير')}</Label>
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={1}
                max={3}
                step={0.1}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCropDialog(false)}
                className="rounded-xl"
              >
                {t('common.cancel', 'إلغاء')}
              </Button>
              <Button
                onClick={handleCropSave}
                className="bg-primary text-primary-foreground rounded-xl"
              >
                {t('member.apply', 'تطبيق')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddMemberForm;
