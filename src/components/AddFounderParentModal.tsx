import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Crown, ArrowDown, UserPlus, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { cn } from '@/lib/utils';
import { Member } from '@/types/family.types';

interface AddFounderParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFounder: Member | null;
  familyName: string;
  onConfirm: (parentData: {
    parent_type: 'father' | 'mother';
    first_name: string;
    last_name?: string;
    birth_date?: string;
    death_date?: string;
    is_alive: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

type Step = 'warning' | 'data' | 'confirmation';

export const AddFounderParentModal: React.FC<AddFounderParentModalProps> = ({
  isOpen,
  onClose,
  currentFounder,
  familyName,
  onConfirm,
  isLoading = false,
}) => {
  const { t, direction } = useLanguage();
  const [currentStep, setCurrentStep] = useState<Step>('warning');
  
  // Form data
  const [parentType, setParentType] = useState<'father' | 'mother'>('father');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState(currentFounder?.last_name || '');
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [deathDate, setDeathDate] = useState<Date | undefined>();
  const [isAlive, setIsAlive] = useState(true);
  
  // Confirmation
  const [understood, setUnderstood] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const resetForm = () => {
    setCurrentStep('warning');
    setParentType('father');
    setFirstName('');
    setLastName(currentFounder?.last_name || '');
    setBirthDate(undefined);
    setDeathDate(undefined);
    setIsAlive(true);
    setUnderstood(false);
    setConfirmationText('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleConfirm = async () => {
    await onConfirm({
      parent_type: parentType,
      first_name: firstName,
      last_name: lastName || undefined,
      birth_date: birthDate?.toISOString().split('T')[0],
      death_date: deathDate?.toISOString().split('T')[0],
      is_alive: isAlive,
    });
    handleClose();
  };

  const canProceedToData = true;
  const canProceedToConfirmation = firstName.trim().length > 0;
  const canConfirm = understood && confirmationText.trim().toLowerCase() === familyName.trim().toLowerCase();

  const currentFounderName = currentFounder?.first_name || currentFounder?.name || 'المؤسس الحالي';
  const newFounderName = firstName || t('founder.new_parent_name', 'الوالد الجديد');
  const childRelation = currentFounder?.gender === 'female' 
    ? t('founder.daughter_of_new_founder', 'ابنة المؤسس الجديد')
    : t('founder.son_of_new_founder', 'ابن المؤسس الجديد');

  const NavigationIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;
  const BackIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;

  const renderProgressBar = () => {
    const steps: Step[] = ['warning', 'data', 'confirmation'];
    const stepLabels = {
      warning: t('founder.step_warning', 'تحذير'),
      data: t('founder.step_data_entry', 'إدخال البيانات'),
      confirmation: t('founder.step_confirmation', 'التأكيد النهائي'),
    };

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((step, index) => {
          const isActive = step === currentStep;
          const isPast = steps.indexOf(currentStep) > index;
          
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    isActive && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                    isPast && 'bg-green-500 text-white',
                    !isActive && !isPast && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isPast ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={cn(
                  'text-xs font-medium hidden sm:block',
                  isActive && 'text-primary',
                  isPast && 'text-green-500',
                  !isActive && !isPast && 'text-muted-foreground'
                )}>
                  {stepLabels[step]}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-12 h-0.5 transition-all',
                  isPast ? 'bg-green-500' : 'bg-muted'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderWarningStep = () => (
    <div className="space-y-6">
      {/* Warning Header */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600 rounded-xl p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-amber-800 dark:text-amber-200 mb-2">
          {t('founder.add_parent_warning_title', 'تغيير مؤسس شجرة العائلة')}
        </h3>
        <p className="text-amber-700 dark:text-amber-300">
          {t('founder.add_parent_warning_description', 'أنت على وشك إضافة والد للمؤسس الحالي. هذا الإجراء سيغير هيكل الشجرة بالكامل.')}
        </p>
      </div>

      {/* Changes Summary */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          {t('founder.changes_summary', 'التغييرات التي ستحدث')}
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-1">•</span>
            <span>{t('founder.new_founder_will_be', 'سيصبح الوالد الجديد هو المؤسس')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-1">•</span>
            <span>{t('founder.current_founder_will_become', 'سيصبح المؤسس الحالي')} "{currentFounderName}" {childRelation}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-1">•</span>
            <span>{t('founder.generations_reorder', 'سيتم إعادة ترتيب جميع الأجيال في الشجرة')}</span>
          </li>
        </ul>
      </div>

      {/* Critical Warning */}
      <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700 rounded-lg p-4 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <p className="text-red-700 dark:text-red-300 font-medium text-sm">
          ⛔ {t('founder.irreversible_action', 'هذه العملية لا يمكن التراجع عنها!')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handleClose}
          className="flex-1"
        >
          {t('founder.cancel', 'إلغاء')}
        </Button>
        <Button
          onClick={() => setCurrentStep('data')}
          className="flex-1 bg-amber-600 hover:bg-amber-700"
        >
          {t('founder.continue', 'متابعة')}
          <NavigationIcon className="h-4 w-4 ms-2" />
        </Button>
      </div>
    </div>
  );

  const renderDataStep = () => (
    <div className="space-y-6">
      {/* Parent Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">{t('founder.parent_type', 'نوع الوالد')}</Label>
        <RadioGroup
          value={parentType}
          onValueChange={(value) => setParentType(value as 'father' | 'mother')}
          className="grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="father"
            className={cn(
              'flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
              parentType === 'father'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'border-muted hover:border-blue-300'
            )}
          >
            <RadioGroupItem value="father" id="father" className="sr-only" />
            <UserPlus className={cn(
              'h-5 w-5',
              parentType === 'father' ? 'text-blue-600' : 'text-muted-foreground'
            )} />
            <span className={cn(
              'font-medium',
              parentType === 'father' ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'
            )}>
              {t('founder.add_father', 'إضافة أب')}
            </span>
          </Label>
          <Label
            htmlFor="mother"
            className={cn(
              'flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
              parentType === 'mother'
                ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30'
                : 'border-muted hover:border-pink-300'
            )}
          >
            <RadioGroupItem value="mother" id="mother" className="sr-only" />
            <UserPlus className={cn(
              'h-5 w-5',
              parentType === 'mother' ? 'text-pink-600' : 'text-muted-foreground'
            )} />
            <span className={cn(
              'font-medium',
              parentType === 'mother' ? 'text-pink-700 dark:text-pink-300' : 'text-muted-foreground'
            )}>
              {t('founder.add_mother', 'إضافة أم')}
            </span>
          </Label>
        </RadioGroup>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('common.first_name', 'الاسم الأول')} *</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={parentType === 'father' ? 'مثال: أحمد' : 'مثال: فاطمة'}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t('common.last_name', 'اسم العائلة')}</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={familyName}
            className="text-base"
          />
        </div>
      </div>

      {/* Date Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('common.birth_date', 'تاريخ الميلاد')}</Label>
          <EnhancedDatePicker
            value={birthDate}
            onChange={setBirthDate}
            placeholder={t('common.select_date', 'اختر التاريخ')}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('common.death_date', 'تاريخ الوفاة')}</Label>
          <EnhancedDatePicker
            value={deathDate}
            onChange={(date) => {
              setDeathDate(date);
              if (date) setIsAlive(false);
            }}
            placeholder={t('common.select_date', 'اختر التاريخ')}
            disabled={isAlive}
          />
        </div>
      </div>

      {/* Is Alive Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="isAlive"
          checked={isAlive}
          onCheckedChange={(checked) => {
            setIsAlive(!!checked);
            if (checked) setDeathDate(undefined);
          }}
        />
        <Label htmlFor="isAlive" className="cursor-pointer">
          {t('common.is_alive', 'على قيد الحياة')}
        </Label>
      </div>

      {/* Preview Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-4 flex items-center gap-2">
          <Crown className="h-4 w-4" />
          {t('founder.new_founder_preview', 'معاينة المؤسس الجديد')}
        </h4>
        <div className="flex flex-col items-center gap-3">
          {/* New Founder */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm w-full">
            <Avatar className={cn(
              'h-12 w-12 ring-2',
              parentType === 'father' ? 'ring-blue-500' : 'ring-pink-500'
            )}>
              <AvatarFallback className={cn(
                parentType === 'father' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
              )}>
                {firstName ? firstName.charAt(0) : '؟'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{newFounderName}</p>
              <div className="flex items-center gap-1 text-yellow-600">
                <Crown className="h-3 w-3" />
                <span className="text-xs">{t('member.founder', 'المؤسس الجديد')}</span>
              </div>
            </div>
          </div>
          
          <ArrowDown className="h-5 w-5 text-amber-500" />
          
          {/* Current Founder (becomes child) */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm w-full opacity-75">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-muted">
                {currentFounderName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-foreground">{currentFounderName}</p>
              <p className="text-xs text-muted-foreground">{childRelation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('warning')}
          className="flex-1"
        >
          <BackIcon className="h-4 w-4 me-2" />
          {t('founder.back', 'رجوع')}
        </Button>
        <Button
          onClick={() => setCurrentStep('confirmation')}
          disabled={!canProceedToConfirmation}
          className="flex-1"
        >
          {t('founder.continue', 'متابعة')}
          <NavigationIcon className="h-4 w-4 ms-2" />
        </Button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      {/* Final Warning */}
      <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-400 dark:border-red-600 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-red-800 dark:text-red-200">
            {t('founder.step_confirmation', 'التأكيد النهائي')}
          </h3>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between items-center py-1 border-b border-muted">
            <span className="text-muted-foreground">{t('founder.current_founder', 'المؤسس الحالي')}</span>
            <span className="font-medium">{currentFounderName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-muted">
            <span className="text-muted-foreground">{t('founder.new_founder_will_be', 'المؤسس الجديد')}</span>
            <span className="font-medium">{newFounderName}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">{t('founder.parent_type', 'نوع الوالد')}</span>
            <span className="font-medium">
              {parentType === 'father' ? t('founder.add_father', 'أب') : t('founder.add_mother', 'أم')}
            </span>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div className="flex items-start gap-3 mb-4">
          <Checkbox
            id="understood"
            checked={understood}
            onCheckedChange={(checked) => setUnderstood(!!checked)}
            className="mt-1"
          />
          <Label htmlFor="understood" className="text-red-700 dark:text-red-300 cursor-pointer">
            {t('founder.confirm_understanding', 'أفهم أن هذا الإجراء لا يمكن التراجع عنه')}
          </Label>
        </div>

        {/* Type Family Name */}
        <div className="space-y-2">
          <Label className="text-red-700 dark:text-red-300">
            {t('founder.type_family_name_confirm', 'اكتب اسم العائلة للتأكيد')}
          </Label>
          <Input
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={familyName}
            className="border-red-300 dark:border-red-700 focus:ring-red-500"
          />
          <p className="text-xs text-red-600 dark:text-red-400">
            {t('common.type', 'اكتب')} "{familyName}" {t('common.to_confirm', 'للتأكيد')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('data')}
          className="flex-1"
          disabled={isLoading}
        >
          <BackIcon className="h-4 w-4 me-2" />
          {t('founder.back', 'رجوع')}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm || isLoading}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {t('common.processing', 'جاري المعالجة...')}
            </>
          ) : (
            <>
              <Check className="h-4 w-4 me-2" />
              {t('founder.confirm_change', 'تأكيد التغيير')}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-primary" />
            {t('founder.add_parent', 'إضافة والد للمؤسس')}
          </DialogTitle>
        </DialogHeader>

        {renderProgressBar()}

        {currentStep === 'warning' && renderWarningStep()}
        {currentStep === 'data' && renderDataStep()}
        {currentStep === 'confirmation' && renderConfirmationStep()}
      </DialogContent>
    </Dialog>
  );
};
