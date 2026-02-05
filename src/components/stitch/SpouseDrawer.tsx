/**
 * SpouseDrawer - Slide-out drawer for adding/editing spouse details
 * Opens from left-to-right in Arabic, right-to-left in English
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Member, Marriage } from '@/types/family.types';
import { SpouseData } from '@/components/SpouseForm';

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
  onSave
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

  if (!isOpen || !currentSpouse) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]",
          "transition-all duration-500 ease-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <aside 
        className={cn(
          "fixed top-0 h-full w-[400px] bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col",
          "border-slate-200 dark:border-slate-800",
          "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isRTL 
            ? cn("left-0 border-r", isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0")
            : cn("right-0 border-l", isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0")
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
            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">favorite</span>
            </div>
            <h3 className="font-bold text-lg">
              {spouseType === 'wife' 
                ? t('member.add_wife_details', 'Add Wife Details')
                : t('member.add_husband_details', 'Add Husband Details')}
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
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onFamilyStatusChange('no')}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                spouseFamilyStatus === 'no' || !spouseFamilyStatus
                  ? "bg-white dark:bg-slate-700 text-pink-600 shadow-sm"
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
                  ? "bg-white dark:bg-slate-700 text-pink-600 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              {t('member.link_existing', 'Link Existing Member')}
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {spouseFamilyStatus === 'yes' ? (
              /* Link Existing Member */
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                  {t('member.select_member', 'Select Member')} *
                </label>
                <select
                  value={currentSpouse.existingFamilyMemberId || ''}
                  onChange={(e) => handleExistingMemberSelect(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                >
                  <option value="">{t('member.select_placeholder', 'Select a family member...')}</option>
                  {availableMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.first_name || member.name} {member.last_name || ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Create New */
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                    {t('member.spouse_name', 'Spouse Name')} *
                  </label>
                  <div className="relative">
                    <span className="material-icons-round absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">person</span>
                    <input
                      type="text"
                      value={currentSpouse.name || ''}
                      onChange={(e) => {
                        const name = e.target.value;
                        const [firstName = '', ...rest] = name.split(' ');
                        handleInputChange('name', name);
                        handleInputChange('firstName', firstName);
                        handleInputChange('lastName', rest.join(' '));
                      }}
                      placeholder={t('member.enter_full_name', 'Enter full name')}
                      className="w-full ps-9 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                    />
                  </div>
                </div>

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
                      className="w-full ps-9 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ms-1">
                {t('member.marriage_status', 'Marriage Status')}
              </label>
              <select
                value={currentSpouse.maritalStatus || 'married'}
                onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
              >
                <option value="married">{t('member.married', 'Married')}</option>
                <option value="divorced">{t('member.divorced', 'Divorced')}</option>
                <option value="widowed">{t('member.widowed', 'Widowed')}</option>
              </select>
            </div>

            {/* Photo Upload (Optional) */}
            {spouseFamilyStatus !== 'yes' && (
              <div className="p-4 rounded-xl border-2 border-dashed border-pink-500/20 bg-pink-50/30 dark:bg-pink-900/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-pink-50/50 transition-colors">
                <span className="material-symbols-outlined text-pink-500">upload_file</span>
                <span className="text-xs font-medium text-pink-600">
                  {t('member.upload_photo_optional', 'Upload Photo (Optional)')}
                </span>
              </div>
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
            className="flex-1 py-2.5 bg-pink-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-600/20 hover:bg-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('member.confirm_spouse', 'Confirm Spouse')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SpouseDrawer;
