/**
 * SpouseDrawer - Slide-out drawer for adding/editing spouse details
 * Opens from left-to-right in Arabic, right-to-left in English
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Member, Marriage } from '@/types/family.types';
import { SpouseData } from '@/components/SpouseForm';
import { buildLineageChain } from '@/lib/memberDisplayUtils';
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
  isEditing?: boolean;
  excludeMemberIds?: string[];
  editingMemberId?: string;
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
  isEditing = false,
  excludeMemberIds = [],
  editingMemberId,
  onImageUploadClick
}) => {
  const { t, direction } = useLanguage();
  const isRTL = direction === 'rtl';

  // Build set of forbidden member IDs (relatives + already-married)
  const forbiddenIds = React.useMemo(() => {
    const ids = new Set<string>(excludeMemberIds);
    if (!editingMemberId) return ids;

    const member = familyMembers.find(m => m.id === editingMemberId);
    if (!member) return ids;

    // 1. Exclude the member themselves
    ids.add(editingMemberId);

    // 2. Exclude all ancestors (parents, grandparents, etc.)
    const addAncestors = (memberId: string) => {
      const m = familyMembers.find(fm => fm.id === memberId);
      if (!m) return;
      if (m.father_id) { ids.add(m.father_id); addAncestors(m.father_id); }
      if (m.mother_id) { ids.add(m.mother_id); addAncestors(m.mother_id); }
    };
    addAncestors(editingMemberId);

    // 3. Exclude siblings (same father or same mother)
    familyMembers.forEach(m => {
      if (m.id === editingMemberId) return;
      if ((member.father_id && m.father_id === member.father_id) ||
          (member.mother_id && m.mother_id === member.mother_id)) {
        ids.add(m.id);
      }
    });

    // 4. Exclude aunts/uncles (father's siblings + mother's siblings)
    const addSiblings = (parentId: string | undefined) => {
      if (!parentId) return;
      const parent = familyMembers.find(m => m.id === parentId);
      if (!parent) return;
      familyMembers.forEach(m => {
        if (m.id === parentId) return;
        if ((parent.father_id && m.father_id === parent.father_id) ||
            (parent.mother_id && m.mother_id === parent.mother_id)) {
          ids.add(m.id);
        }
      });
    };
    addSiblings(member.father_id);
    addSiblings(member.mother_id);

    // 5. Exclude children and descendants
    const addDescendants = (parentId: string) => {
      familyMembers.forEach(m => {
        if (m.father_id === parentId || m.mother_id === parentId) {
          ids.add(m.id);
          addDescendants(m.id);
        }
      });
    };
    addDescendants(editingMemberId);

    // 6. Exclude already-linked spouses of this member
    marriages.forEach(mar => {
      if (mar.husband_id === editingMemberId) ids.add(mar.wife_id);
      if (mar.wife_id === editingMemberId) ids.add(mar.husband_id);
    });

    return ids;
  }, [editingMemberId, familyMembers, marriages, excludeMemberIds]);

  // Filter family members for linking
  const availableMembers = familyMembers.filter(m => {
    // Exclude forbidden relatives
    if (forbiddenIds.has(m.id)) return false;
    // Gender filter
    if (spouseType === 'wife' && m.gender !== 'female') return false;
    if (spouseType === 'husband' && m.gender !== 'male') return false;
    // Only show unmarried/single/widowed members
    const activeMarriageCount = marriages.filter(mar =>
      (mar.husband_id === m.id || mar.wife_id === m.id)
    ).length;
    if (m.gender === 'female' && activeMarriageCount > 0) return false;
    if (m.gender === 'male' && activeMarriageCount >= 4) return false;
    return true;
  });

  // Helper: check if member is a paternal descendant of founder
  const isDescendantOfFounder = React.useCallback((memberId: string, visited = new Set<string>()): boolean => {
    if (visited.has(memberId)) return false;
    visited.add(memberId);
    const m = familyMembers.find(fm => fm.id === memberId);
    if (!m) return false;
    if (m.is_founder) return true;
    if (m.father_id) return isDescendantOfFounder(m.father_id, visited);
    return false;
  }, [familyMembers]);

  // Build display label for member in dropdown
  const getMemberLabel = React.useCallback((member: Member): string => {
    if (isDescendantOfFounder(member.id)) {
      return buildLineageChain(member, familyMembers);
    }
    const firstName = member.first_name || member.name?.split(' ')[0] || member.name || '';
    const lastName = member.last_name || '';
    return `${firstName} ${lastName}`.trim();
  }, [familyMembers, isDescendantOfFounder]);

  // Hide toggle when editing existing spouse
  const shouldHideToggle = hideToggle || isEditing;

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
          {!shouldHideToggle && (
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
                      label: getMemberLabel(member),
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
                currentSpouse.croppedImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <img src={currentSpouse.croppedImage} alt="Spouse" className="w-20 h-20 rounded-full object-cover border-2 border-pink-300 dark:border-pink-600" />
                      <button
                        type="button"
                        onClick={onImageUploadClick}
                        className="absolute -bottom-1 -end-1 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        <span className="material-icons-round text-sm text-slate-500">edit</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">{t('member.click_to_change', 'Click to change')}</span>
                  </div>
                ) : (
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
                )
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
