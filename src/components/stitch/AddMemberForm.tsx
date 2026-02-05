/**
 * AddMemberForm - Stitch Theme Add/Edit Member Form
 * Single-step form matching the new design with 3-column layout
 */

import React, { useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import Cropper from 'react-easy-crop';
import { useAddMemberForm } from './useAddMemberForm';
import { AddMemberFormProps } from './AddMemberFormTypes';
import { SpouseDrawer } from './SpouseDrawer';
import { SearchableDropdown } from '@/components/SearchableDropdown';
import { StyledDropdown } from './StyledDropdown';

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

  // Build marriage options for parent selection - matching FamilyBuilderNew format
  const marriageOptions = useMemo(() => {
    if (!marriages || !familyMembers) return [];
    
    return marriages
      .filter(marriage => marriage && marriage.id && marriage.husband_id && marriage.wife_id)
      .map(marriage => {
        const husbandMember = familyMembers.find(m => m.id === marriage.husband_id);
        const wifeMember = familyMembers.find(m => m.id === marriage.wife_id);
        
        // Helper to build full name with lineage (matching FamilyBuilderNew logic)
        const buildFullName = (member: any, isWife: boolean = false) => {
          if (!member) return t('member.unknown', 'غير معروف');
          const firstName = member.first_name || member.name?.split(' ')[0] || '';
          const father = familyMembers.find(m => m.id === member.father_id);
          const grandfather = father ? familyMembers.find(m => m.id === father.father_id) : null;
          const isInternal = Boolean(father) || Boolean(member.is_founder);

          if (isInternal) {
            if (isWife) {
              if (father) {
                const relationship = member.gender === 'female' ? 'بنت' : 'ابن';
                const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
                if (grandfather) {
                  const grandfatherFirstName = grandfather.first_name || grandfather.name?.split(' ')[0] || grandfather.name;
                  return `${firstName} ${relationship} ${fatherFirstName} بن ${grandfatherFirstName}`;
                }
                return `${firstName} ${relationship} ${fatherFirstName}`;
              }
              return firstName;
            } else {
              if (father) {
                const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
                if (grandfather) {
                  const grandfatherFirstName = grandfather.first_name || grandfather.name?.split(' ')[0] || grandfather.name;
                  return `${firstName} بن ${fatherFirstName} بن ${grandfatherFirstName}`;
                }
                return `${firstName} بن ${fatherFirstName}`;
              }
              return firstName;
            }
          } else {
            return member.name || firstName;
          }
        };

        const husbandName = buildFullName(husbandMember);
        const wifeName = buildFullName(wifeMember, true);

        return {
          value: marriage.id,
          familyMember: husbandName,
          spouse: wifeName,
          heartIcon: marriage.divorce_date ? 'heart-crack' as const : 'heart' as const,
          isFounder: husbandMember?.is_founder || false
        };
      });
  }, [marriages, familyMembers, t]);

  // Get display image
  const displayImage = croppedImage || editingMemberImageUrl || null;

  return (
    <section className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-slate-50 dark:bg-background-dark">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">person_add</span>
            {formMode === 'edit' 
              ? t('member.edit', 'تعديل العضو')
              : t('stitch.add_new_member', 'Add New Member')}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {formMode === 'edit'
              ? t('member.edit_desc', 'قم بتعديل بيانات العضو')
              : t('stitch.add_member_desc', `Create a new profile for a family member in the ${familyData?.name || 'family'} tree.`)}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-8">
            {/* Row 1: Name (1/4), Gender (1/4), Family Relation (2/4) */}
            <div className="grid grid-cols-4 gap-6">
              {/* First Name - 1/4 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">person</span>
                  {t('member.first_name', 'First Name')} *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    first_name: e.target.value,
                    name: `${e.target.value} ${prev.name.split(' ').slice(1).join(' ')}`.trim()
                  }))}
                  placeholder={t('member.first_name_placeholder', 'Enter first name')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Gender - 1/4 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">wc</span>
                  {t('member.gender', 'Gender')} *
                </label>
                <StyledDropdown
                  options={[
                    { value: 'male', label: t('member.male', 'Male'), icon: 'male' },
                    { value: 'female', label: t('member.female', 'Female'), icon: 'female' }
                  ]}
                  value={formData.gender}
                  onChange={(value) => setFormData(prev => ({ ...prev, gender: value as 'male' | 'female' }))}
                  accentColor="primary"
                />
              </div>

              {/* Family Relation - 2/4 */}
              <div className="col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">account_tree</span>
                  {t('member.family_relation', 'Family Relation')} *
                </label>
                <StyledDropdown
                  options={marriageOptions.length > 0 ? marriageOptions.map(opt => ({
                    value: opt.value,
                    label: `${opt.familyMember} ❤ ${opt.spouse}`,
                    icon: 'family_restroom'
                  })) : [{
                    value: "no-data",
                    label: t('member.no_marriages', 'لا توجد زيجات مسجلة'),
                    icon: 'info'
                  }]}
                  value={formData.selectedParent || ''}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    selectedParent: value === 'none' || value === 'no-data' ? null : value,
                    isFounder: !value || value === 'none' || value === 'no-data'
                  }))}
                  disabled={parentsLocked}
                  placeholder={parentsLocked 
                    ? t('member.parents_locked', 'تم اختيار الوالدين تلقائياً')
                    : t('member.select_parents', 'اختر الوالدين')}
                  searchable={true}
                  searchPlaceholder={t('member.search_parents', 'ابحث عن الوالدين...')}
                  accentColor="primary"
                />
                {!formData.selectedParent && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="material-icons-round text-sm">info</span>
                    {t('member.founder_hint', 'Will be registered as founder')}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Twins (1/4), Birth Date (1/4), Vitality (1/4), Death Date (1/4) */}
            <div className="grid grid-cols-4 gap-6">
              {/* Twins - 1/4 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">groups</span>
                  {t('member.twins', 'Twins')}
                </label>
                <StyledDropdown
                  options={[
                    { value: 'no', label: t('common.no', 'No'), icon: 'person' },
                    { value: 'yes', label: t('common.yes', 'Yes'), icon: 'group' }
                  ]}
                  value={formData.is_twin ? 'yes' : 'no'}
                  onChange={(value) => setFormData(prev => ({ ...prev, is_twin: value === 'yes' }))}
                  accentColor="primary"
                />
              </div>

              {/* Birth Date - 1/4 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
                  {t('member.birth_date', 'Birth Date')}
                </label>
                <input
                  type="date"
                  value={formData.birthDate ? formData.birthDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    birthDate: e.target.value ? new Date(e.target.value) : null 
                  }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Vitality Status - 1/4 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">vital_signs</span>
                  {t('member.vitality_status', 'Vitality Status')}
                </label>
                <StyledDropdown
                  options={[
                    { value: 'living', label: t('member.living', 'Living'), icon: 'favorite' },
                    { value: 'deceased', label: t('member.deceased', 'Deceased'), icon: 'heart_broken' }
                  ]}
                  value={formData.isAlive ? 'living' : 'deceased'}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    isAlive: value === 'living',
                    deathDate: value === 'living' ? null : prev.deathDate
                  }))}
                  accentColor="primary"
                />
              </div>

              {/* Death Date - 1/4 (only visible if deceased) */}
              <div className="space-y-2">
                {!formData.isAlive ? (
                  <>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-primary text-lg">event</span>
                      {t('member.death_date', 'Death Date')}
                    </label>
                    <input
                      type="date"
                      value={formData.deathDate ? formData.deathDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        deathDate: e.target.value ? new Date(e.target.value) : null 
                      }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </>
                ) : (
                  <div className="h-full" />
                )}
              </div>
            </div>

            {/* Row 3: Biography (3/4), Profile Picture (1/4) */}
            <div className="grid grid-cols-4 gap-6">
              {/* Biography - 3/4 */}
              <div className="col-span-3 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">history_edu</span>
                  {t('member.biography', 'Biography')}
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={t('member.biography_placeholder', 'Brief history or description...')}
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Profile Picture - 1/4 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">image</span>
                  {t('member.profile_picture', 'Profile Picture')}
                </label>
                {displayImage ? (
                  <div className="relative">
                    <img 
                      src={displayImage} 
                      alt="Profile" 
                      className="w-full h-28 object-cover rounded-2xl border-2 border-slate-200 dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className="absolute top-2 end-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 h-28 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/30 hover:border-primary hover:bg-emerald-50/10 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-2xl text-primary mb-1">upload</span>
                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {t('member.click_to_upload', 'Click to upload')}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={!isImageUploadEnabled}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Spouses Section */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-pink-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                <h3 className="text-xs font-bold text-pink-500 uppercase tracking-widest">
                  {t('member.spouses_info', 'Spouses Information')}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Existing Spouses */}
                {formData.gender === 'male' && wives.map((wife, index) => (
                  <div 
                    key={wife.id || index}
                    className="p-6 bg-white dark:bg-slate-900 border border-pink-100 dark:border-pink-900/30 rounded-2xl flex items-start gap-5 relative group hover:shadow-lg hover:shadow-pink-500/5 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-pink-500/20 shrink-0">
                      {wife.croppedImage ? (
                        <img src={wife.croppedImage} alt={wife.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">
                        {wife.name || `${wife.firstName} ${wife.lastName}`.trim() || t('member.unnamed', 'Unnamed')}
                      </h4>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-pink-500 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                          {t('member.spouse', 'Spouse')} ({wife.maritalStatus || 'Married'})
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button 
                          type="button"
                          onClick={() => handleSpouseEdit('wife', wife, index)}
                          className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-pink-100 dark:border-pink-900/50 text-pink-600 dark:text-pink-400 text-xs font-bold rounded-lg hover:bg-pink-50 transition-colors"
                        >
                          {t('common.edit', 'Edit')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleSpouseDelete(wife, index)}
                          className="px-4 py-1.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 text-xs font-bold rounded-lg hover:bg-pink-100 transition-colors"
                        >
                          {t('common.delete', 'Delete')}
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-4 end-4 text-pink-500/30">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                  </div>
                ))}

                {formData.gender === 'female' && husbands.map((husband, index) => (
                  <div 
                    key={husband.id || index}
                    className="p-6 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-start gap-5 relative group hover:shadow-lg hover:shadow-blue-500/5 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0">
                      {husband.croppedImage ? (
                        <img src={husband.croppedImage} alt={husband.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">
                        {husband.name || `${husband.firstName} ${husband.lastName}`.trim() || t('member.unnamed', 'Unnamed')}
                      </h4>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {t('member.spouse', 'Spouse')} ({husband.maritalStatus || 'Married'})
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button 
                          type="button"
                          onClick={() => handleSpouseEdit('husband', husband, index)}
                          className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          {t('common.edit', 'Edit')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleSpouseDelete(husband, index)}
                          className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          {t('common.delete', 'Delete')}
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-4 end-4 text-blue-500/30">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                  </div>
                ))}

                {/* Add Spouse Button */}
                {((formData.gender === 'male' && wives.length < 4) || (formData.gender === 'female' && husbands.length === 0)) && (
                  <button
                    type="button"
                    onClick={() => handleAddSpouse(formData.gender === 'male' ? 'wife' : 'husband')}
                    className="p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-emerald-50/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary/20 group-hover:text-primary flex items-center justify-center transition-all">
                      <span className="material-symbols-outlined text-xl">add</span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-primary block">
                        {formData.gender === 'male' 
                          ? t('member.add_spouse', 'Add Spouse')
                          : t('member.add_husband', 'Add Husband')}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-8 flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3.5 text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-700 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSaving || !formData.first_name.trim()}
                className="px-10 py-3.5 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                {isSaving 
                  ? t('member.saving', 'Saving...')
                  : formMode === 'edit' 
                    ? t('member.save_changes', 'Save Changes')
                    : t('member.save_member', 'Save Member')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Spouse Drawer */}
      <SpouseDrawer
        isOpen={showSpouseForm}
        onClose={closeSpouseForm}
        spouseType={activeSpouseType}
        currentSpouse={currentSpouse}
        onSpouseChange={setCurrentSpouse}
        familyMembers={familyMembers}
        marriages={marriages}
        spouseCommandOpen={spouseCommandOpen}
        onCommandOpenChange={setSpouseCommandOpen}
        spouseFamilyStatus={spouseFamilyStatus}
        onFamilyStatusChange={setSpouseFamilyStatus}
        onSave={() => activeSpouseType && handleSpouseSave(activeSpouseType)}
      />

      {/* Image Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('member.crop_image', 'Crop Image')}</DialogTitle>
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
              <Label className="text-sm text-slate-500">{t('member.zoom', 'Zoom')}</Label>
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
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleCropSave}
                className="bg-primary text-primary-foreground rounded-xl"
              >
                {t('member.apply', 'Apply')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AddMemberForm;
