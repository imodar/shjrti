/**
 * SpouseDrawer - Slide-out drawer for adding/editing spouse details
 * Opens from left-to-right in Arabic, right-to-left in English
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Member, Marriage } from '@/types/family.types';
import { SpouseData } from '@/components/SpouseForm';
import { StyledDropdown } from './StyledDropdown';

interface SpouseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  spouseType: 'wife' | 'husband' | null;
  currentSpouse: SpouseData | null;
  onSpouseChange: (spouse: SpouseData) => void;
  familyMembers: Member[];
  marriages: Marriage[];
  spouseCommandOpen: boolean;
  onCommandOpenChange: (open: boolean) => void;
  spouseFamilyStatus: 'yes' | 'no' | null;
  onFamilyStatusChange: (status: 'yes' | 'no') => void;
  onSave: () => void;
  isImageUploadEnabled?: boolean;
  hideToggle?: boolean;
  onImageUploadClick?: () => void;
}

export const SpouseDrawer: React.FC<SpouseDrawerProps> = ({
  isOpen,
  onClose,
  spouseType,
  currentSpouse,
  onSpouseChange,
  familyMembers,
  marriages,
  spouseCommandOpen,
  onCommandOpenChange,
  spouseFamilyStatus,
  onFamilyStatusChange,
  onSave,
  isImageUploadEnabled = false,
  hideToggle = false,
  onImageUploadClick
}) => {
  const { t, direction } = useLanguage();
  const isRTL = direction === 'rtl';

  // Filter family members for linking
  const availableMembers = familyMembers.filter(m => {
    // For wife: show females not already married (or allow multiple based on rules)
    // For husband: show males
    if (spouseType === 'wife') {
      return m.gender === 'female';
    } else if (spouseType === 'husband') {
      return m.gender === 'male';
    }
    return false;
  });

  const handleInputChange = (field: keyof SpouseData, value: any) => {
    if (currentSpouse) {
      onSpouseChange({ ...currentSpouse, [field]: value });
    }
  };

  const handleExistingMemberSelect = (memberId: string) => {
    const member = familyMembers.find(m => m.id === memberId);
    if (member && currentSpouse) {
      onSpouseChange({
        ...currentSpouse,
        existingFamilyMemberId: memberId,
        firstName: member.first_name || '',
        lastName: member.last_name || '',
        name: member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim(),
        isFamilyMember: true
      });
    }
  };

  if (!currentSpouse) return null;
  // Note: Keep DOM mounted even when !isOpen so CSS transitions work

  return (
    <>
      {/* Overlay - always mounted, animated via CSS */}
      <div 
        className={cn(
          "fixed inset-0 z-[60]",
          "bg-slate-900/40 backdrop-blur-sm",
          "transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Drawer - always mounted, slides in/out */}
      <aside 
        className={cn(
          "fixed top-0 h-full w-[400px] max-w-[90vw] bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col",
          "border-slate-200 dark:border-slate-800",
          "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "" : "pointer-events-none",
          isRTL 
            ? cn("left-0 border-r", isOpen ? "translate-x-0" : "-translate-x-full")
            : cn("right-0 border-l", isOpen ? "translate-x-0" : "translate-x-full")
        )}
        style={{
          boxShadow: isOpen 
            ? (isRTL ? '20px 0 60px -15px rgba(0,0,0,0.3)' : '-20px 0 60px -15px rgba(0,0,0,0.3)')
            : 'none'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              spouseType === 'husband' 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' 
                : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600'
            }`}>
              <span className="material-symbols-outlined">favorite</span>
            </div>
            <h3 className={`font-bold text-lg ${spouseType === 'husband' ? 'text-blue-600' : 'text-pink-600'}`}>
              {spouseType === 'wife' 
                ? t('member.add_wife_details', 'Wife Information')
                : t('member.add_husband_details', 'Husband Information')}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Toggle: Create New / Link Existing */}
          {!hideToggle && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onFamilyStatusChange('no')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                spouseFamilyStatus === 'no' || !spouseFamilyStatus
                  ? `bg-white dark:bg-slate-700 shadow-sm ${spouseType === 'husband' ? 'text-blue-600' : 'text-pink-600'}`
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              {t('member.create_new', 'Create New')}
            </button>
            <button
              type="button"
              onClick={() => onFamilyStatusChange('yes')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                spouseFamilyStatus === 'yes'
                  ? `bg-white dark:bg-slate-700 shadow-sm ${spouseType === 'husband' ? 'text-blue-600' : 'text-pink-600'}`
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              {t('member.link_existing', 'Link Existing Member')}
            </button>
          </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {spouseFamilyStatus === 'yes' ? (
              /* Link Existing Member */
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                    {t('member.select_member', 'Select Member')} *
                  </label>
                  <StyledDropdown
                    options={availableMembers.map(member => ({
                      value: member.id,
                      label: `${member.first_name || member.name} ${member.last_name || ''}`.trim(),
                      icon: 'person'
                    }))}
                    value={currentSpouse.existingFamilyMemberId || ''}
                    onChange={handleExistingMemberSelect}
                    placeholder={t('member.select_placeholder', 'Select a family member...')}
                    searchable={true}
                    searchPlaceholder={t('common.search', 'Search...')}
                    accentColor={spouseType === 'husband' ? 'blue' : 'pink'}
                  />
                </div>

                {/* Marriage Status - shown after selecting a member */}
                {currentSpouse.existingFamilyMemberId && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                      {t('member.marriage_status', 'Marriage Status')}
                    </label>
                    <StyledDropdown
                      options={[
                        { value: 'married', label: t('member.married', 'Married'), icon: 'favorite' },
                        { value: 'divorced', label: t('member.divorced', 'Divorced'), icon: 'heart_broken' },
                        { value: 'widowed', label: t('member.widowed', 'Widowed'), icon: 'deceased' }
                      ]}
                      value={currentSpouse.maritalStatus || 'married'}
                      onChange={(value) => handleInputChange('maritalStatus', value)}
                      accentColor={spouseType === 'husband' ? 'blue' : 'pink'}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Create New */
              <>
                {/* First Name & Last Name - 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                      {t('member.first_name', 'First Name')} *
                    </label>
                    <div className="relative">
                      <span className="material-icons-round absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">person</span>
                      <input
                        type="text"
                        value={currentSpouse.firstName || ''}
                        onChange={(e) => {
                          const firstName = e.target.value;
                          handleInputChange('firstName', firstName);
                          handleInputChange('name', `${firstName} ${currentSpouse.lastName || ''}`.trim());
                        }}
                        placeholder={t('member.first_name_placeholder', 'First name')}
                        className={`w-full ps-9 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 ${
                          spouseType === 'husband' ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-pink-500/20 focus:border-pink-500'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                      {t('member.last_name', 'Last Name')}
                    </label>
                    <div className="relative">
                      <span className="material-icons-round absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">badge</span>
                      <input
                        type="text"
                        value={currentSpouse.lastName || ''}
                        onChange={(e) => {
                          const lastName = e.target.value;
                          handleInputChange('lastName', lastName);
                          handleInputChange('name', `${currentSpouse.firstName || ''} ${lastName}`.trim());
                        }}
                        placeholder={t('member.last_name_placeholder', 'Last name')}
                        className={`w-full ps-9 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 ${
                          spouseType === 'husband' ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-pink-500/20 focus:border-pink-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Birth Date & Marriage Status - 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                      {t('member.birth_date', 'Birth Date')}
                    </label>
                    <div className="relative">
                      <span className="material-icons-round absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">calendar_today</span>
                      <input
                        type="date"
                        value={currentSpouse.birthDate ? (currentSpouse.birthDate instanceof Date ? currentSpouse.birthDate.toISOString().split('T')[0] : currentSpouse.birthDate) : ''}
                        onChange={(e) => handleInputChange('birthDate', e.target.value ? new Date(e.target.value) : null)}
                        className={`w-full ps-9 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 ${
                          spouseType === 'husband' ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-pink-500/20 focus:border-pink-500'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                      {t('member.marriage_status', 'Marriage Status')}
                    </label>
                    <StyledDropdown
                      options={[
                        { value: 'married', label: t('member.married', 'Married'), icon: 'favorite' },
                        { value: 'divorced', label: t('member.divorced', 'Divorced'), icon: 'heart_broken' },
                        { value: 'widowed', label: t('member.widowed', 'Widowed'), icon: 'deceased' }
                      ]}
                      value={currentSpouse.maritalStatus || 'married'}
                      onChange={(value) => handleInputChange('maritalStatus', value)}
                      accentColor={spouseType === 'husband' ? 'blue' : 'pink'}
                    />
                  </div>
                </div>

                {/* Vitality Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                    {t('member.vitality_status', 'Vitality Status')}
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleInputChange('isAlive', true)}
                      className={cn(
                        "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                        currentSpouse.isAlive !== false
                          ? "bg-green-500 text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      <span className="material-icons-round text-sm">favorite</span>
                      {t('member.alive', 'Alive')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('isAlive', false)}
                      className={cn(
                        "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                        currentSpouse.isAlive === false
                          ? "bg-slate-600 text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      <span className="material-icons-round text-sm">heart_broken</span>
                      {t('member.deceased', 'Deceased')}
                    </button>
                  </div>
                </div>

                {/* Death Date - only show if deceased */}
                {currentSpouse.isAlive === false && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                      {t('member.death_date', 'Death Date')}
                    </label>
                    <div className="relative">
                      <span className="material-icons-round absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">event_busy</span>
                      <input
                        type="date"
                        value={currentSpouse.deathDate ? (currentSpouse.deathDate instanceof Date ? currentSpouse.deathDate.toISOString().split('T')[0] : currentSpouse.deathDate) : ''}
                        onChange={(e) => handleInputChange('deathDate', e.target.value ? new Date(e.target.value) : null)}
                        className={`w-full ps-9 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 ${
                          spouseType === 'husband' ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-pink-500/20 focus:border-pink-500'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Biography */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                    {t('member.biography', 'Biography')}
                  </label>
                  <div className="relative">
                    <span className="material-icons-round absolute start-3 top-3 text-slate-400 text-sm">notes</span>
                    <textarea
                      value={currentSpouse.biography || ''}
                      onChange={(e) => handleInputChange('biography', e.target.value)}
                      placeholder={t('member.biography_placeholder', 'Write a short biography...')}
                      rows={3}
                      className={`w-full ps-9 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 resize-none ${
                        spouseType === 'husband' ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-pink-500/20 focus:border-pink-500'
                      }`}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Photo Upload (Optional) */}
            {spouseFamilyStatus !== 'yes' && (
              isImageUploadEnabled ? (
                <div onClick={onImageUploadClick} className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                  spouseType === 'husband'
                    ? 'border-blue-500/20 bg-blue-50/30 dark:bg-blue-900/5 hover:bg-blue-50/50'
                    : 'border-pink-500/20 bg-pink-50/30 dark:bg-pink-900/5 hover:bg-pink-50/50'
                }`}>
                  <span className={`material-symbols-outlined ${spouseType === 'husband' ? 'text-blue-500' : 'text-pink-500'}`}>upload_file</span>
                  <span className={`text-xs font-medium ${spouseType === 'husband' ? 'text-blue-600' : 'text-pink-600'}`}>
                    {t('member.upload_photo_optional', 'Upload Photo (Optional)')}
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 flex flex-col items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-amber-500">lock</span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {t('upgrade.feature_locked', 'Premium Feature')}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.location.href = '/plan-selection'}
                    className="text-[9px] font-bold text-amber-700 underline hover:text-amber-800"
                  >
                    {t('upgrade.upgrade_now', 'Upgrade Now')}
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!currentSpouse.name && !currentSpouse.existingFamilyMemberId}
            className={`flex-1 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              spouseType === 'husband'
                ? 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700'
                : 'bg-pink-600 shadow-pink-600/20 hover:bg-pink-700'
            }`}
          >
            {spouseType === 'husband' 
              ? t('member.confirm_husband', 'Confirm Husband')
              : t('member.confirm_wife', 'Confirm Wife')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SpouseDrawer;
