import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Member } from '@/types/family.types';
import { useResolvedImageUrl } from '@/utils/useResolvedImageUrl';

interface ParentData {
  first_name: string;
  last_name?: string;
  birth_date?: string;
  death_date?: string;
  is_alive: boolean;
}

interface AddFounderParentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFounder: Member | null;
  familyName: string;
  onConfirm: (data: { father: ParentData; mother: ParentData }) => Promise<void>;
  isLoading?: boolean;
}

type Step = 'warning' | 'data' | 'confirmation';

export const AddFounderParentDrawer: React.FC<AddFounderParentDrawerProps> = ({
  isOpen,
  onClose,
  currentFounder,
  familyName,
  onConfirm,
  isLoading = false,
}) => {
  const { t, direction } = useLanguage();
  const [currentStep, setCurrentStep] = useState<Step>('warning');

  const [fatherFirstName, setFatherFirstName] = useState('');
  const [fatherLastName, setFatherLastName] = useState(currentFounder?.last_name || '');
  const [fatherBirthDate, setFatherBirthDate] = useState<Date | undefined>();
  const [fatherDeathDate, setFatherDeathDate] = useState<Date | undefined>();
  const [fatherIsAlive, setFatherIsAlive] = useState(true);

  const [motherFirstName, setMotherFirstName] = useState('');
  const [motherLastName, setMotherLastName] = useState('');
  const [motherBirthDate, setMotherBirthDate] = useState<Date | undefined>();
  const [motherDeathDate, setMotherDeathDate] = useState<Date | undefined>();
  const [motherIsAlive, setMotherIsAlive] = useState(true);

  const [understood, setUnderstood] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const founderImageSrc = useResolvedImageUrl(currentFounder?.image_url || null);

  const resetForm = () => {
    setCurrentStep('warning');
    setFatherFirstName('');
    setFatherLastName(currentFounder?.last_name || '');
    setFatherBirthDate(undefined);
    setFatherDeathDate(undefined);
    setFatherIsAlive(true);
    setMotherFirstName('');
    setMotherLastName('');
    setMotherBirthDate(undefined);
    setMotherDeathDate(undefined);
    setMotherIsAlive(true);
    setUnderstood(false);
    setConfirmationText('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleConfirm = async () => {
    await onConfirm({
      father: {
        first_name: fatherFirstName,
        last_name: fatherLastName || undefined,
        birth_date: fatherBirthDate?.toISOString().split('T')[0],
        death_date: fatherDeathDate?.toISOString().split('T')[0],
        is_alive: fatherIsAlive,
      },
      mother: {
        first_name: motherFirstName,
        last_name: motherLastName || undefined,
        birth_date: motherBirthDate?.toISOString().split('T')[0],
        death_date: motherDeathDate?.toISOString().split('T')[0],
        is_alive: motherIsAlive,
      },
    });
    handleClose();
  };

  const canProceedToConfirmation = fatherFirstName.trim().length > 0 && motherFirstName.trim().length > 0;
  const canConfirm = understood && confirmationText.trim().toLowerCase() === familyName.trim().toLowerCase();

  const currentFounderName = currentFounder?.first_name || currentFounder?.name || t('founder.current_founder', 'المؤسس الحالي');
  const newFatherName = fatherFirstName || t('founder.new_father_name', 'الأب الجديد');
  const newMotherName = motherFirstName || t('founder.new_mother_name', 'الأم الجديدة');

  const steps: { key: Step; label: string }[] = [
    { key: 'warning', label: t('founder.step_warning', 'تحذير') },
    { key: 'data', label: t('founder.step_data_entry', 'إدخال البيانات') },
    { key: 'confirmation', label: t('founder.step_confirmation', 'التأكيد النهائي') },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  if (!isOpen) return null;

  return (
    <div className={cn("fixed inset-0 z-[60] flex", direction === 'rtl' ? 'justify-end' : 'justify-start')}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className="relative w-full max-w-[700px] h-full bg-slate-50 dark:bg-background shadow-2xl flex flex-col"
        style={{
          animation: direction === 'rtl'
            ? 'slide-in-from-right-full 0.3s ease-out forwards'
            : 'slide-in-from-left-full 0.3s ease-out forwards'
        }}
      >
        {/* Header */}
        <div className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">account_tree</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white font-serif">
                {t('founder.add_parents_to_founder', 'إضافة والدين للمؤسس')}
              </h3>
              <div className="flex items-center gap-4 mt-1">
                {steps.map((step, index) => (
                  <div key={step.key} className="flex items-center gap-1.5">
                    <span className={cn(
                      'rounded-full',
                      index === currentStepIndex ? 'w-5 h-1.5 bg-primary' : 'w-2 h-2 bg-slate-300 dark:bg-slate-600'
                    )} />
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-widest',
                      index === currentStepIndex ? 'text-primary' : 'text-slate-400'
                    )}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {currentStep === 'warning' && renderWarningStep()}
          {currentStep === 'data' && renderDataStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-4">
          {currentStep === 'warning' ? (
            <>
              <button
                onClick={handleClose}
                className="flex-1 py-3 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors"
              >
                {t('founder.cancel', 'إلغاء')}
              </button>
              <button
                onClick={() => setCurrentStep('data')}
                className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {t('founder.continue_to_data', 'متابعة لإدخال البيانات')}
                <span className="material-symbols-outlined text-lg">
                  {direction === 'rtl' ? 'arrow_back' : 'arrow_forward'}
                </span>
              </button>
            </>
          ) : currentStep === 'data' ? (
            <>
              <button
                onClick={() => setCurrentStep('warning')}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">
                  {direction === 'rtl' ? 'arrow_forward' : 'arrow_back'}
                </span>
                {t('founder.back', 'رجوع')}
              </button>
              <button
                onClick={() => setCurrentStep('confirmation')}
                disabled={!canProceedToConfirmation}
                className={cn(
                  "flex-[2] py-3 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all",
                  !canProceedToConfirmation ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                )}
              >
                {t('founder.continue_to_review', 'متابعة للمراجعة')}
                <span className="material-symbols-outlined text-lg">
                  {direction === 'rtl' ? 'arrow_back' : 'arrow_forward'}
                </span>
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={() => setCurrentStep('data')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                <span className="material-symbols-outlined text-lg">
                  {direction === 'rtl' ? 'arrow_forward' : 'arrow_back'}
                </span>
                {t('founder.back', 'رجوع')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm || isLoading}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all text-sm",
                  (!canConfirm || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'
                )}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    {t('common.processing', 'جاري المعالجة...')}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    {t('founder.confirm_add_parents', 'تأكيد إضافة الوالدين')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // === Step 1: Warning ===
  function renderWarningStep() {
    return (
      <div className="space-y-8 py-4">
        {/* Warning Icon */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 mb-2">
            <span className="material-symbols-outlined text-4xl">warning_amber</span>
          </div>
          <h4 className="text-xl font-bold text-slate-800 dark:text-white font-serif italic">
            {t('founder.add_parent_warning_title', 'تغيير مؤسس شجرة العائلة')}
          </h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            {t('founder.add_parents_warning_description', 'أنت على وشك إضافة والدين (أب وأم) للمؤسس الحالي. هذا الإجراء سيغير هيكل الشجرة بالكامل.')}
            {' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">{currentFounderName}</span>
          </p>
        </div>

        {/* Impact Cards */}
        <div className="space-y-4">
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="text-amber-500">
              <span className="material-symbols-outlined">account_tree</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {t('founder.generation_shift', 'تحول في الأجيال')}
              </h5>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                {t('founder.generations_reorder', 'سيتم إعادة ترتيب جميع الأجيال في الشجرة')}
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="text-amber-500">
              <span className="material-symbols-outlined">family_history</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {t('founder.historical_hierarchy', 'التسلسل التاريخي')}
              </h5>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                {t('founder.new_father_founder', 'سيصبح الأب الجديد هو المؤسس')}
              </p>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // === Step 2: Data Entry ===
  function renderDataStep() {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Father */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-[#3b82f6]">male</span>
              <h4 className="font-bold text-sm uppercase tracking-wide">
                {t('founder.father_info', 'بيانات الأب (المؤسس الجديد)')}
              </h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('common.first_name', 'الاسم الأول')} *
                </label>
                <Input
                  value={fatherFirstName}
                  onChange={(e) => setFatherFirstName(e.target.value)}
                  placeholder={t('common.first_name', 'الاسم الأول')}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('common.birth_date', 'تاريخ الميلاد')}
                </label>
                <EnhancedDatePicker
                  value={fatherBirthDate}
                  onChange={setFatherBirthDate}
                  placeholder={t('common.select_date', 'اختر التاريخ')}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('common.vitality', 'حالة الحياة')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setFatherIsAlive(true); setFatherDeathDate(undefined); }}
                    className={cn(
                      'py-2.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all',
                      fatherIsAlive
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    )}
                  >
                    {fatherIsAlive && <span className="material-symbols-outlined text-sm">check_circle</span>}
                    {t('common.is_alive', 'على قيد الحياة')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFatherIsAlive(false)}
                    className={cn(
                      'py-2.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all',
                      !fatherIsAlive
                        ? 'border-slate-600 bg-slate-600/5 text-slate-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    )}
                  >
                    {!fatherIsAlive && <span className="material-symbols-outlined text-sm">skull</span>}
                    {t('common.deceased', 'متوفى')}
                  </button>
                </div>
              </div>
              <div className={cn(!fatherIsAlive ? '' : 'opacity-50 pointer-events-none')}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('common.death_date', 'تاريخ الوفاة')}
                </label>
                <EnhancedDatePicker
                  value={fatherDeathDate}
                  onChange={(date) => {
                    setFatherDeathDate(date);
                    if (date) setFatherIsAlive(false);
                  }}
                  placeholder={t('common.select_date', 'اختر التاريخ')}
                  disabled={fatherIsAlive}
                />
              </div>
            </div>
          </div>

          {/* Mother */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined text-[#ec4899]">female</span>
              <h4 className="font-bold text-sm uppercase tracking-wide">
                {t('founder.mother_info', 'بيانات الأم (زوجة المؤسس الجديد)')}
              </h4>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('common.first_name', 'الاسم الأول')} *
                  </label>
                  <Input
                    value={motherFirstName}
                    onChange={(e) => setMotherFirstName(e.target.value)}
                    placeholder={t('common.first_name', 'الاسم الأول')}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('common.last_name', 'اسم العائلة')}
                  </label>
                  <Input
                    value={motherLastName}
                    onChange={(e) => setMotherLastName(e.target.value)}
                    placeholder={t('common.optional', 'اختياري')}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('common.birth_date', 'تاريخ الميلاد')}
                </label>
                <EnhancedDatePicker
                  value={motherBirthDate}
                  onChange={setMotherBirthDate}
                  placeholder={t('common.select_date', 'اختر التاريخ')}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('common.vitality', 'حالة الحياة')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setMotherIsAlive(true); setMotherDeathDate(undefined); }}
                    className={cn(
                      'py-2.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all',
                      motherIsAlive
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    )}
                  >
                    {motherIsAlive && <span className="material-symbols-outlined text-sm">check_circle</span>}
                    {t('common.is_alive', 'على قيد الحياة')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMotherIsAlive(false)}
                    className={cn(
                      'py-2.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all',
                      !motherIsAlive
                        ? 'border-[#ec4899] bg-[#ec4899]/5 text-[#ec4899]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400'
                    )}
                  >
                    {!motherIsAlive && <span className="material-symbols-outlined text-sm">skull</span>}
                    {t('common.deceased', 'متوفى')}
                  </button>
                </div>
              </div>
              <div className={cn(!motherIsAlive ? '' : 'opacity-50 pointer-events-none')}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('common.death_date', 'تاريخ الوفاة')}
                </label>
                <EnhancedDatePicker
                  value={motherDeathDate}
                  onChange={(date) => {
                    setMotherDeathDate(date);
                    if (date) setMotherIsAlive(false);
                  }}
                  placeholder={t('common.select_date', 'اختر التاريخ')}
                  disabled={motherIsAlive}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Structural Preview */}
        <div className="bg-slate-100 dark:bg-slate-800/40 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {t('founder.new_structure_preview', 'معاينة الهيكل الجديد')}
            </h5>
            <span className="material-symbols-outlined text-slate-400">info</span>
          </div>
          <div className="flex flex-col items-center gap-6 relative">
            <div className="flex items-center gap-12 relative">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-200 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{newFatherName}</p>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-px w-12 bg-slate-300 dark:bg-slate-700" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 border-2 border-pink-200 flex items-center justify-center text-pink-600">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{newMotherName}</p>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border-2 border-primary flex items-center justify-center shadow-md overflow-hidden">
                {founderImageSrc ? (
                  <img src={founderImageSrc} alt={currentFounderName} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <span className="text-lg font-bold text-slate-400">{currentFounderName.charAt(0)}</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-primary uppercase">{currentFounderName}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === Step 3: Confirmation ===
  function renderConfirmationStep() {
    return (
      <div className="space-y-8">
        {/* Summary */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {t('founder.new_connections_summary', 'ملخص الروابط الجديدة')}
          </h4>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                <span className="material-symbols-outlined text-2xl">male</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">
                  {t('founder.father_label', 'الأب')}
                </p>
                <p className="font-bold text-slate-800 dark:text-white">
                  {fatherFirstName} {fatherLastName}
                </p>
                {(fatherBirthDate || fatherDeathDate) && (
                  <p className="text-xs text-slate-500">
                    {fatherBirthDate?.getFullYear() || '?'} — {!fatherIsAlive ? (fatherDeathDate?.getFullYear() || '?') : t('profile.present', 'Present')}
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-pink-500">
                <span className="material-symbols-outlined text-2xl">female</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-pink-500 uppercase tracking-tight">
                  {t('founder.mother_label', 'الأم')}
                </p>
                <p className="font-bold text-slate-800 dark:text-white">
                  {motherFirstName} {motherLastName}
                </p>
                {(motherBirthDate || motherDeathDate) && (
                  <p className="text-xs text-slate-500">
                    {motherBirthDate?.getFullYear() || '?'} — {!motherIsAlive ? (motherDeathDate?.getFullYear() || '?') : t('profile.present', 'Present')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Connection Info */}
        <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <span className="material-symbols-outlined text-primary">link</span>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t('founder.connecting_as_parents', 'سيتم ربطهم كوالدين لـ')}{' '}
            <span className="font-bold text-slate-800 dark:text-white">{currentFounderName}</span>
          </p>
        </div>

        {/* Confirmation Fields */}
        <div className="space-y-5 pt-4">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              {t('founder.type_family_name', 'اكتب اسم العائلة للتأكيد')}
            </label>
            <p className="text-xs text-slate-500 mb-2">
              {t('founder.type_to_authorize', 'اكتب')} <span className="font-bold text-primary italic">{familyName}</span> {t('founder.to_authorize_update', 'للمتابعة')}
            </p>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={familyName}
              className="px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-medium"
            />
          </div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5">
              <Checkbox
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(!!checked)}
              />
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400 leading-snug select-none group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
              {t('founder.confirm_understanding', 'أفهم أن هذه العملية لا يمكن التراجع عنها وستؤدي إلى تغيير هيكل الشجرة بالكامل.')}
            </span>
          </label>
        </div>
      </div>
    );
  }
};

export default AddFounderParentDrawer;
