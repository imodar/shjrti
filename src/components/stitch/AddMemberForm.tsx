/**
 * AddMemberForm - Stitch Theme Add/Edit Member Form
 * Single-step form matching the new design with 3-column layout
 */

import React, { useEffect, useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
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
import { HeritageDatePicker } from '@/components/ui/heritage-date-picker';

export const AddMemberForm: React.FC<AddMemberFormProps> = ({
  familyId,
  familyMembers,
  marriages,
  familyData,
  editingMember,
  formMode,
  onClose,
  onMemberSaved,
  onMemberDeleted,
  initialFormData
}) => {
  const { t, direction } = useLanguage();
  const isRTL = direction === 'rtl';

  const {
    formData,
    setFormData,
    isSaving,
    parentsLocked,
    setParentsLocked,
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

  // Apply initial form data (e.g., pre-selected parent from "Add Child" button)
  useEffect(() => {
    if (initialFormData && formMode === 'add') {
      setFormData(prev => ({ ...prev, ...initialFormData }));
      if (initialFormData.selectedParent) {
        setParentsLocked(true);
      }
    }
  }, [initialFormData, formMode, setParentsLocked]);

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
          if (member.first_name === 'unknown_mother') return t('member.unknown_wife', 'زوجة غير معروفة');
          const firstName = member.first_name || member.name?.split(' ')[0] || '';
          const father = familyMembers.find(m => m.id === member.father_id);
          const grandfather = father ? familyMembers.find(m => m.id === father.father_id) : null;
          const isInternal = Boolean(father) || Boolean(member.is_founder);

          if (isInternal) {
          if (isWife) {
              if (father) {
                const relationship = member.gender === 'female' ? t('member.daughter_of', 'بنت') : t('member.child_of_male', 'ابن');
                const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
                if (grandfather) {
                  const grandfatherFirstName = grandfather.first_name || grandfather.name?.split(' ')[0] || grandfather.name;
                  return `${firstName} ${relationship} ${fatherFirstName} ${t('member.son_of', 'بن')} ${grandfatherFirstName}`;
                }
                return `${firstName} ${relationship} ${fatherFirstName}`;
              }
              return firstName;
            } else {
              if (father) {
                const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
                if (grandfather) {
                  const grandfatherFirstName = grandfather.first_name || grandfather.name?.split(' ')[0] || grandfather.name;
                  return `${firstName} ${t('member.son_of', 'بن')} ${fatherFirstName} ${t('member.son_of', 'بن')} ${grandfatherFirstName}`;
                }
                return `${firstName} ${t('member.son_of', 'بن')} ${fatherFirstName}`;
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
              : t('stitch.add_member_desc', 'أنشئ ملفاً شخصياً جديداً لعضو في شجرة العائلة')}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-8">
            {/* Row 1: Name (1/4), Gender (1/4), Family Relation (2/4) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
              {/* First Name - 1/4 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">person</span>
                  {t('first_name', 'First Name')} *
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
                  {t('family_builder.gender', 'Gender')} *
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
              <div className="sm:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">account_tree</span>
                  {t('family_builder.choose_family', 'Family Relation')} *
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
              </div>
            </div>

            {/* Row 2: Twins (1/4), Birth Date (1/4), Vitality (1/4), Death Date (1/4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Twins - 1/4 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">groups</span>
                  {t('is_twin', 'Twins')}
                </label>
                {currentSiblings.length > 0 ? (
                  <StyledDropdown
                    options={[
                      { value: 'no', label: t('common.no', 'No'), icon: 'person' },
                      ...currentSiblings.map((sibling: any) => ({
                        value: sibling.id,
                        label: sibling.first_name || sibling.name || t('member.unknown', 'Unknown'),
                        icon: 'group'
                      }))
                    ]}
                    value={formData.is_twin && formData.selected_twins.length > 0 ? formData.selected_twins[0] : 'no'}
                    onChange={(value) => {
                      if (value === 'no') {
                        setFormData(prev => ({ ...prev, is_twin: false, selected_twins: [], twin_group_id: null }));
                      } else {
                        // Find if the selected sibling already has a twin_group_id
                        const selectedSibling = currentSiblings.find((s: any) => s.id === value);
                        const existingGroupId = selectedSibling?.twin_group_id || formData.twin_group_id || null;
                        setFormData(prev => ({ ...prev, is_twin: true, selected_twins: [value], twin_group_id: existingGroupId }));
                      }
                    }}
                    accentColor="primary"
                  />
                ) : (
                  <StyledDropdown
                    options={[
                      { value: 'no', label: t('common.no', 'No'), icon: 'person' },
                    ]}
                    value="no"
                    onChange={() => {}}
                    disabled={true}
                    accentColor="primary"
                  />
                )}
              </div>

              {/* Birth Date - 1/4 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
                  {t('family_builder.birth_year', 'Birth Date')}
                </label>
                <HeritageDatePicker
                  value={formData.birthDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, birthDate: date || null }))}
                  placeholder={t('family_builder.birth_year', 'Birth Date')}
                  disableFuture={true}
                  fromYear={550}
                  toYear={new Date().getFullYear()}
                />
              </div>

              {/* Vitality Status - 1/4 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">vital_signs</span>
                  {t('family_builder.alive', 'Vitality Status')}
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
                    <HeritageDatePicker
                      value={formData.deathDate}
                      onChange={(date) => setFormData(prev => ({ ...prev, deathDate: date || null }))}
                      placeholder={t('member.death_date', 'Death Date')}
                      disableFuture={true}
                      fromYear={550}
                      toYear={new Date().getFullYear()}
                    />
                  </>
                ) : (
                  <div className="h-full" />
                )}
              </div>
            </div>

            {/* Row 3: Profile Picture (1/4), Biography (3/4) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 items-stretch">
              {/* Profile Picture - 1/4 */}
              <div className="space-y-2 flex flex-col">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">image</span>
                  {t('family_builder.upload_image', 'Profile Picture')}
                </label>
                {!isImageUploadEnabled ? (
                  <div className="flex-1 border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-amber-50/50 dark:bg-amber-900/10 min-h-[200px]">
                    <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-2xl text-amber-500">lock</span>
                    </div>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {t('upgrade.feature_locked', 'Premium Feature')}
                    </p>
                    <p className="text-[10px] text-amber-500/70 mt-1">{t('upgrade.unlock_photos', 'Unlock photo uploads')}</p>
                    <button
                      type="button"
                      onClick={() => window.location.href = '/plan-selection'}
                      className="mt-3 px-4 py-1.5 text-[10px] font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      {t('upgrade.upgrade_now', 'Upgrade Now')}
                    </button>
                  </div>
                ) : displayImage ? (
                  <div className="relative flex-1 min-h-[200px]">
                    <img 
                      src={displayImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-2xl border-2 border-slate-200 dark:border-slate-700"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl p-3 flex items-end justify-between">
                      <p className="text-[10px] text-white/80 font-medium">{t('member.profile_photo', 'Profile Photo')}</p>
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="p-1.5 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors backdrop-blur-sm"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/30 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group min-h-[200px]">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl text-primary">add_a_photo</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t('member.click_to_upload', 'Click to upload')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{t('common.formats_jpg_png', 'JPG, PNG')}</p>
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

              {/* Biography - 3/4 */}
              <div className="sm:col-span-3 space-y-2 flex flex-col">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">history_edu</span>
                  {t('family_builder.biography', 'Biography')}
                </label>
                <div className="flex-1 relative">
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder={t('member.biography_placeholder', 'Brief history or description...')}
                    className="w-full h-full min-h-[200px] px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                  <div className="absolute bottom-3 end-3 text-[10px] text-slate-300 dark:text-slate-600 pointer-events-none">
                    {formData.bio?.length || 0} {t('common.characters', 'chars')}
                  </div>
                </div>
              </div>
            </div>

            {/* Spouses Section */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <span className={`material-symbols-outlined text-xl ${formData.gender === 'female' ? 'text-blue-500' : 'text-pink-500'}`} style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                <h3 className={`text-xs font-bold uppercase tracking-widest ${formData.gender === 'female' ? 'text-blue-500' : 'text-pink-500'}`}>
                  {formData.gender === 'female' 
                    ? t('member.husband_info', 'Husband Information')
                    : t('member.wife_info', 'Wife Information')}
                </h3>
              </div>

              {/* Wife Known Switch - only for male members */}
              {formData.gender === 'male' && (
                <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <Switch
                    checked={!formData.motherUnknown}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, motherUnknown: !checked }))}
                  />
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('member.wife_known', 'هل الزوجة معروفة؟')}
                  </label>
                </div>
              )}

              {/* Unknown wife banner */}
              {formData.gender === 'male' && formData.motherUnknown && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-500">info</span>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t('member.unknown_wife_note', 'سيتم إنشاء سجل زوجة غير معروفة تلقائياً وربط الأبناء بالأب مباشرة')}
                  </p>
                </div>
              )}
              
              {!(formData.gender === 'male' && formData.motherUnknown) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Existing Spouses */}
                {formData.gender === 'male' && wives.map((wife, index) => {
                  const isDivorced = wife.maritalStatus === 'divorced';
                  const isDeceased = wife.isAlive === false;
                  return (
                  <div 
                    key={wife.id || index}
                    className="p-6 bg-white dark:bg-slate-900 border border-pink-100 dark:border-pink-900/30 rounded-2xl flex items-start gap-5 relative group hover:shadow-lg hover:shadow-pink-500/5 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-pink-500/20 shrink-0">
                      {wife.croppedImage ? (
                        <img src={wife.croppedImage} alt={wife.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isDivorced ? 'heart_broken' : 'favorite'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">
                        {wife.name || `${wife.firstName} ${wife.lastName}`.trim() || t('member.unnamed', 'Unnamed')}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase ${isDivorced ? 'text-slate-400' : 'text-pink-500'}`}>
                          <span className={`material-symbols-outlined text-xs`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isDivorced ? 'heart_broken' : 'favorite'}
                          </span>
                          {isDivorced 
                            ? t('profile.divorced_female', 'Divorced') 
                            : t('member.married', 'Married')}
                        </span>
                        {isDeceased && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                            <span className="material-symbols-outlined text-xs">deceased</span>
                            {t('member.deceased', 'Deceased')}
                          </span>
                        )}
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
                    <div className="absolute top-4 end-4">
                      <span className={`material-symbols-outlined text-lg ${isDivorced ? 'text-slate-300' : 'text-pink-500/30'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isDivorced ? 'heart_broken' : 'favorite'}
                      </span>
                    </div>
                  </div>
                  );
                })}

                {formData.gender === 'female' && husbands.map((husband, index) => {
                  const isDivorced = husband.maritalStatus === 'divorced';
                  const isDeceased = husband.isAlive === false;
                  return (
                  <div 
                    key={husband.id || index}
                    className="p-6 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-start gap-5 relative group hover:shadow-lg hover:shadow-blue-500/5 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0">
                      {husband.croppedImage ? (
                        <img src={husband.croppedImage} alt={husband.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isDivorced ? 'heart_broken' : 'favorite'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">
                        {husband.name || `${husband.firstName} ${husband.lastName}`.trim() || t('member.unnamed', 'Unnamed')}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase ${isDivorced ? 'text-slate-400' : 'text-blue-500'}`}>
                          <span className={`material-symbols-outlined text-xs`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isDivorced ? 'heart_broken' : 'favorite'}
                          </span>
                          {isDivorced 
                            ? t('profile.divorced_male', 'Divorced') 
                            : t('member.married', 'Married')}
                        </span>
                        {isDeceased && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                            <span className="material-symbols-outlined text-xs">deceased</span>
                            {t('member.deceased', 'Deceased')}
                          </span>
                        )}
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
                    <div className="absolute top-4 end-4">
                      <span className={`material-symbols-outlined text-lg ${isDivorced ? 'text-slate-300' : 'text-blue-500/30'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isDivorced ? 'heart_broken' : 'favorite'}
                      </span>
                    </div>
                  </div>
                  );
                })}

                {/* Add Spouse Button */}
                {((formData.gender === 'male' && wives.length < 4) || (formData.gender === 'female' && !husbands.some(h => h.maritalStatus !== 'divorced' && h.isAlive !== false))) && (
                  <button
                    type="button"
                    onClick={() => handleAddSpouse(formData.gender === 'male' ? 'wife' : 'husband')}
                    className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group ${
                      formData.gender === 'female' 
                        ? 'border-blue-100 dark:border-blue-900/30 hover:border-blue-400 hover:bg-blue-50/20' 
                        : 'border-pink-100 dark:border-pink-900/30 hover:border-pink-400 hover:bg-pink-50/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      formData.gender === 'female'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-400 group-hover:bg-blue-100 group-hover:text-blue-500'
                        : 'bg-pink-50 dark:bg-pink-900/20 text-pink-400 group-hover:bg-pink-100 group-hover:text-pink-500'
                    }`}>
                      <span className="material-symbols-outlined text-xl">add</span>
                    </div>
                    <div className="text-center">
                      <span className={`text-xs font-bold block ${
                        formData.gender === 'female'
                          ? 'text-blue-500 dark:text-blue-400 group-hover:text-blue-600'
                          : 'text-pink-500 dark:text-pink-400 group-hover:text-pink-600'
                      }`}>
                        {formData.gender === 'male' 
                          ? t('member.add_wife', 'Add Wife')
                          : t('member.add_husband', 'Add Husband')}
                      </span>
                    </div>
                  </button>
                )}
              </div>
              )}
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
        isImageUploadEnabled={isImageUploadEnabled}
        isEditing={!!(currentSpouse?.id && !currentSpouse.id.startsWith('temp_'))}
        excludeMemberIds={currentSpouse?.existingFamilyMemberId ? [currentSpouse.existingFamilyMemberId] : (currentSpouse?.id && !currentSpouse.id.startsWith('temp_') ? [currentSpouse.id] : [])}
        editingMemberId={editingMember?.id}
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
