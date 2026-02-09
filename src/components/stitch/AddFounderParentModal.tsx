import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Member } from '@/types/family.types';

interface ParentData {
  first_name: string;
  last_name?: string;
  birth_date?: string;
  death_date?: string;
  is_alive: boolean;
}

interface StitchAddFounderParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFounder: Member | null;
  familyName: string;
  onConfirm: (data: { father: ParentData; mother: ParentData }) => Promise<void>;
  isLoading?: boolean;
}

type Step = 'warning' | 'data' | 'confirmation';

export const StitchAddFounderParentModal: React.FC<StitchAddFounderParentModalProps> = ({
  isOpen,
  onClose,
  currentFounder,
  familyName,
  onConfirm,
  isLoading = false,
}) => {
  const { t, direction } = useLanguage();
  console.log('StitchAddFounderParentModal render, isOpen:', isOpen);
  const [currentStep, setCurrentStep] = useState<Step>('warning');

  // Father form data
  const [fatherFirstName, setFatherFirstName] = useState('');
  const [fatherBirthDate, setFatherBirthDate] = useState('');
  const [fatherDeathDate, setFatherDeathDate] = useState('');
  const [fatherIsAlive, setFatherIsAlive] = useState(true);

  // Mother form data
  const [motherFirstName, setMotherFirstName] = useState('');
  const [motherLastName, setMotherLastName] = useState('');
  const [motherBirthDate, setMotherBirthDate] = useState('');
  const [motherDeathDate, setMotherDeathDate] = useState('');
  const [motherIsAlive, setMotherIsAlive] = useState(true);

  // Confirmation
  const [understood, setUnderstood] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const resetForm = () => {
    setCurrentStep('warning');
    setFatherFirstName('');
    setFatherBirthDate('');
    setFatherDeathDate('');
    setFatherIsAlive(true);
    setMotherFirstName('');
    setMotherLastName('');
    setMotherBirthDate('');
    setMotherDeathDate('');
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
        last_name: currentFounder?.last_name || undefined,
        birth_date: fatherBirthDate || undefined,
        death_date: fatherDeathDate || undefined,
        is_alive: fatherIsAlive,
      },
      mother: {
        first_name: motherFirstName,
        last_name: motherLastName || undefined,
        birth_date: motherBirthDate || undefined,
        death_date: motherDeathDate || undefined,
        is_alive: motherIsAlive,
      },
    });
    handleClose();
  };

  const canProceedToConfirmation = fatherFirstName.trim().length > 0 && motherFirstName.trim().length > 0;
  const canConfirm = understood && confirmationText.trim().toLowerCase() === familyName.trim().toLowerCase();

  const currentFounderName = currentFounder?.first_name || currentFounder?.name || t('founder.current_founder', 'المؤسس الحالي');
  const childRelation = currentFounder?.gender === 'female'
    ? t('founder.daughter_of_new_founder', 'ابنة المؤسس الجديد')
    : t('founder.son_of_new_founder', 'ابن المؤسس الجديد');

  const steps: Step[] = ['warning', 'data', 'confirmation'];

  const renderStepIndicator = () => {
    const stepLabels = {
      warning: t('founder.step_warning', 'تحذير'),
      data: t('founder.step_data_entry', 'إدخال البيانات'),
      confirmation: t('founder.step_confirmation', 'التأكيد النهائي'),
    };

    return (
      <div className="flex items-center justify-center gap-4">
        {steps.map((step, index) => {
          const isActive = step === currentStep;
          const isPast = steps.indexOf(currentStep) > index;

          return (
            <React.Fragment key={step}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    isActive && 'bg-primary text-white ring-4 ring-primary/20',
                    isPast && 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
                    !isActive && !isPast && 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                  )}
                >
                  {isPast ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider',
                    isActive && 'text-foreground',
                    isPast && 'text-emerald-500',
                    !isActive && !isPast && 'text-slate-400 dark:text-slate-600'
                  )}
                >
                  {stepLabels[step]}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-px w-8 transition-all',
                    isPast ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ===== STEP 1: WARNING =====
  const renderWarningStep = () => (
    <>
      <div className="p-10 flex-1 flex flex-col items-center text-center">
        {/* Warning Card */}
        <div className="w-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-8 mb-8">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-4xl">warning</span>
          </div>
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-3">
            {t('founder.add_parent_warning_title', 'تغيير مؤسس شجرة العائلة')}
          </h3>
          <p className="text-amber-800/80 dark:text-amber-200/60 leading-relaxed max-w-lg mx-auto">
            {t('founder.add_parents_warning_description', 'أنت على وشك إضافة والدين (أب وأم) للمؤسس الحالي. هذا الإجراء سيغير هيكل الشجرة بالكامل.')}
          </p>
        </div>

        {/* Expected Changes */}
        <div className={cn("w-full space-y-4 max-w-lg mx-auto mb-8", direction === 'rtl' ? 'text-right' : 'text-left')}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">info</span>
            <h4 className="font-bold text-foreground uppercase text-xs tracking-widest">
              {t('founder.changes_summary', 'التغييرات التي ستحدث')}
            </h4>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t('founder.new_father_founder', 'سيصبح الأب الجديد هو المؤسس')}
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t('founder.current_founder_will_become', 'سيصبح المؤسس الحالي')} ({currentFounderName}) {childRelation}
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t('founder.generations_reorder', 'سيتم إعادة ترتيب جميع الأجيال في الشجرة')}
              </p>
            </li>
          </ul>
        </div>

        {/* Non-reversible badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-full text-red-600 dark:text-red-400">
          <span className="material-symbols-outlined text-sm">dangerous</span>
          <span className="text-xs font-bold uppercase tracking-wider">
            {t('founder.irreversible_action', 'هذه العملية لا يمكن التراجع عنها!')}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-4">
        <button
          onClick={handleClose}
          className="px-8 py-3 rounded-xl text-muted-foreground font-bold hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
        >
          {t('founder.cancel', 'إلغاء')}
        </button>
        <button
          onClick={() => setCurrentStep('data')}
          className="px-10 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-95"
        >
          <span>{t('founder.continue', 'متابعة')}</span>
          <span className="material-symbols-outlined text-sm">
            {direction === 'rtl' ? 'arrow_back' : 'arrow_forward'}
          </span>
        </button>
      </div>
    </>
  );

  // ===== STEP 2: DATA ENTRY =====
  const renderDataStep = () => (
    <>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start relative">
          {/* Heart Divider (desktop) */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex-col items-center gap-1">
            <div className="h-full w-px bg-slate-100 dark:bg-slate-800 absolute top-0 bottom-0 -z-10" />
            <div className="bg-background p-2 rounded-full border border-slate-100 dark:border-slate-800 shadow-md">
              <span className="material-symbols-outlined text-pink-500 text-lg">favorite</span>
            </div>
          </div>

          {/* Father Section - Blue */}
          <div className="p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">person</span>
                <h3 className="font-bold text-foreground">
                  {t('founder.father_info', 'بيانات الأب (المؤسس الجديد)')}
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                {t('founder.primary_parent', 'الوالد الأساسي')}
              </span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ms-1 uppercase tracking-tight">
                    {t('common.first_name', 'الاسم الأول')} *
                  </label>
                  <Input
                    value={fatherFirstName}
                    onChange={(e) => setFatherFirstName(e.target.value)}
                    placeholder={t('founder.father_name_placeholder', 'مثال: أحمد')}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ms-1 uppercase tracking-tight">
                    {t('common.birth_date', 'تاريخ الميلاد')}
                  </label>
                  <Input
                    type="date"
                    value={fatherBirthDate}
                    onChange={(e) => setFatherBirthDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ms-1 uppercase tracking-tight">
                    {t('family_builder.alive', 'الحالة')}
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full h-[38px]">
                    <button
                      type="button"
                      onClick={() => { setFatherIsAlive(false); }}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-lg transition-all',
                        !fatherIsAlive ? 'bg-slate-600 text-white shadow-sm' : 'text-muted-foreground'
                      )}
                    >
                      {t('family_builder.deceased', 'متوفى')}
                      <span className="material-symbols-outlined text-sm">heart_broken</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFatherIsAlive(true); setFatherDeathDate(''); }}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-lg transition-all',
                        fatherIsAlive ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'
                      )}
                    >
                      {t('family_builder.alive', 'حي')}
                      <span className="material-symbols-outlined text-sm">favorite</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ms-1 uppercase tracking-tight">
                    {t('common.death_date', 'تاريخ الوفاة')}
                  </label>
                  <Input
                    type="date"
                    value={fatherDeathDate}
                    onChange={(e) => setFatherDeathDate(e.target.value)}
                    disabled={fatherIsAlive}
                    className={cn('rounded-xl', fatherIsAlive && 'opacity-50 cursor-not-allowed')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mother Section - Pink */}
          <div className="p-5 rounded-2xl bg-pink-50/40 dark:bg-pink-950/10 border border-pink-100 dark:border-pink-900/30 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-pink-500">person</span>
              <h3 className="font-bold text-foreground">
                {t('founder.mother_info', 'بيانات الأم (زوجة المؤسس الجديد)')}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ms-1 uppercase tracking-tight">
                    {t('common.first_name', 'الاسم الأول')} *
                  </label>
                  <Input
                    value={motherFirstName}
                    onChange={(e) => setMotherFirstName(e.target.value)}
                    placeholder={t('founder.mother_name_placeholder', 'مثال: فاطمة')}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ms-1 uppercase tracking-tight">
                    {t('common.last_name', 'اسم العائلة')}
                  </label>
                  <Input
                    value={motherLastName}
                    onChange={(e) => setMotherLastName(e.target.value)}
                    placeholder={t('common.optional', 'اختياري')}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ms-1 uppercase tracking-tight">
                    {t('common.birth_date', 'تاريخ الميلاد')}
                  </label>
                  <Input
                    type="date"
                    value={motherBirthDate}
                    onChange={(e) => setMotherBirthDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ms-1 uppercase tracking-tight">
                    {t('common.death_date', 'تاريخ الوفاة')}
                  </label>
                  <Input
                    type="date"
                    value={motherDeathDate}
                    onChange={(e) => setMotherDeathDate(e.target.value)}
                    disabled={motherIsAlive}
                    className={cn('rounded-xl', motherIsAlive && 'opacity-50 cursor-not-allowed')}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground ms-1 uppercase tracking-tight">
                  {t('family_builder.alive', 'الحالة')}
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full h-[38px]">
                  <button
                    type="button"
                    onClick={() => { setMotherIsAlive(false); }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-lg transition-all',
                      !motherIsAlive ? 'bg-slate-600 text-white shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    {t('family_builder.deceased', 'متوفى')}
                    <span className="material-symbols-outlined text-sm">heart_broken</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMotherIsAlive(true); setMotherDeathDate(''); }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-lg transition-all',
                      motherIsAlive ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    {t('family_builder.alive', 'حي')}
                    <span className="material-symbols-outlined text-sm">favorite</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Structural Preview */}
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-amber-500 text-lg">account_tree</span>
            <h4 className="text-xs font-bold text-foreground">
              {t('founder.new_structure_preview', 'معاينة الهيكل الجديد')}
            </h4>
          </div>
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="flex items-center gap-8 relative">
              {/* Mother */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full border-[3px] border-pink-100 bg-background flex items-center justify-center text-pink-500 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-foreground">{motherFirstName || t('founder.new_mother_name', 'الأم الجديدة')}</div>
                </div>
              </div>
              {/* Heart */}
              <div className="absolute left-1/2 -translate-x-1/2 top-4">
                <span className="material-symbols-outlined text-pink-400 text-sm">favorite</span>
              </div>
              {/* Father */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full border-[3px] border-blue-100 bg-background flex items-center justify-center text-blue-500 shadow-sm relative">
                  <span className="material-symbols-outlined text-2xl">person</span>
                  <div className="absolute -top-0.5 -right-0.5 bg-amber-400 text-white p-0.5 rounded-full ring-1 ring-white">
                    <span className="material-symbols-outlined text-[8px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-foreground">{fatherFirstName || t('founder.new_father_name', 'الأب الجديد')}</div>
                </div>
              </div>
            </div>
            {/* Arrow */}
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-lg">south</span>
            {/* Current Founder */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground flex items-center justify-center font-bold text-lg border-2 border-slate-200 dark:border-slate-700">
                {currentFounderName.charAt(0)}
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-foreground">{currentFounderName}</div>
                <div className="text-[8px] font-medium text-muted-foreground uppercase">{t('founder.current_founder', 'المؤسس الحالي')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
        <button
          onClick={() => setCurrentStep('warning')}
          className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-muted-foreground hover:bg-background transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">
            {direction === 'rtl' ? 'arrow_forward' : 'arrow_back'}
          </span>
          {t('founder.back', 'رجوع')}
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-sm font-bold text-muted-foreground hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            {t('founder.cancel', 'إلغاء')}
          </button>
          <button
            onClick={() => setCurrentStep('confirmation')}
            disabled={!canProceedToConfirmation}
            className={cn(
              'px-10 py-3 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2',
              canProceedToConfirmation ? 'bg-primary hover:bg-primary/90' : 'bg-primary/50 cursor-not-allowed'
            )}
          >
            {t('founder.continue', 'متابعة')}
            <span className="material-symbols-outlined text-sm">
              {direction === 'rtl' ? 'arrow_back' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>
    </>
  );

  // ===== STEP 3: CONFIRMATION =====
  const renderConfirmationStep = () => (
    <div className="px-8 pb-8 space-y-6">
      {/* Final Warning Card */}
      <div className="p-6 border-2 border-red-100 dark:border-red-900/30 rounded-3xl bg-red-50/30 dark:bg-red-950/10">
        <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
          <span className="material-symbols-outlined">warning</span>
          <h3 className="font-bold">{t('founder.step_confirmation', 'التأكيد النهائي')}</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm py-2 border-b border-red-100 dark:border-red-900/20">
            <span className="text-muted-foreground">{t('founder.current_founder', 'المؤسس الحالي')}</span>
            <span className="font-bold text-foreground text-end">{currentFounderName}</span>
          </div>
          <div className="flex justify-between items-center text-sm py-2 border-b border-red-100 dark:border-red-900/20">
            <span className="text-muted-foreground">{t('founder.new_father_founder', 'المؤسس الجديد (الأب)')}</span>
            <span className="font-bold text-foreground text-end">{fatherFirstName}</span>
          </div>
          <div className="flex justify-between items-center text-sm py-2">
            <span className="text-muted-foreground">{t('founder.new_mother_wife', 'الأم (زوجة المؤسس)')}</span>
            <span className="font-bold text-foreground text-end">{motherFirstName} {motherLastName}</span>
          </div>
        </div>
      </div>

      {/* Confirmation Controls */}
      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <Checkbox
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(!!checked)}
              className="w-5 h-5"
            />
          </div>
          <span className="text-sm text-muted-foreground leading-tight">
            {t('founder.confirm_understanding', 'أفهم أن هذه العملية لا يمكن التراجع عنها وستؤدي إلى تغيير هيكل الشجرة بالكامل.')}
          </span>
        </label>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {t('founder.type_family_name', 'اكتب اسم العائلة للتأكيد')}: <span className="text-red-500">"{familyName}"</span>
          </label>
          <Input
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={familyName}
            className="rounded-xl py-3 focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => setCurrentStep('data')}
          disabled={isLoading}
          className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 text-muted-foreground rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          {t('founder.back', 'رجوع')}
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || isLoading}
          className={cn(
            'flex-[2] px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20',
            canConfirm && !isLoading
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-primary/40 text-white/70 cursor-not-allowed'
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
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl p-0 rounded-[2rem] overflow-hidden flex flex-col max-h-[95vh] border-0 gap-0">
        <DialogTitle className="sr-only">{t('founder.add_parents_to_founder', 'إضافة والدين للمؤسس')}</DialogTitle>
        {/* Header with Steps */}
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800 relative">
          {currentStep !== 'warning' && (
            <button
              onClick={handleClose}
              className="absolute end-6 top-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
          <h2 className="text-2xl font-extrabold text-foreground mb-6">
            {t('founder.add_parents_to_founder', 'إضافة والدين للمؤسس')}
          </h2>
          {renderStepIndicator()}
        </div>

        {/* Step Content */}
        {currentStep === 'warning' && renderWarningStep()}
        {currentStep === 'data' && renderDataStep()}
        {currentStep === 'confirmation' && renderConfirmationStep()}
      </DialogContent>
    </Dialog>
  );
};
