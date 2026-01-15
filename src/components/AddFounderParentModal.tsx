import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, Crown, ArrowDown, Heart, Check, ChevronRight, ChevronLeft, Loader2, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { cn } from '@/lib/utils';
import { Member } from '@/types/family.types';

interface ParentData {
  first_name: string;
  last_name?: string;
  birth_date?: string;
  death_date?: string;
  is_alive: boolean;
}

interface AddFounderParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFounder: Member | null;
  familyName: string;
  onConfirm: (data: {
    father: ParentData;
    mother: ParentData;
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
  
  // Father form data
  const [fatherFirstName, setFatherFirstName] = useState('');
  const [fatherLastName, setFatherLastName] = useState(currentFounder?.last_name || '');
  const [fatherBirthDate, setFatherBirthDate] = useState<Date | undefined>();
  const [fatherDeathDate, setFatherDeathDate] = useState<Date | undefined>();
  const [fatherIsAlive, setFatherIsAlive] = useState(true);
  
  // Mother form data
  const [motherFirstName, setMotherFirstName] = useState('');
  const [motherLastName, setMotherLastName] = useState('');
  const [motherBirthDate, setMotherBirthDate] = useState<Date | undefined>();
  const [motherDeathDate, setMotherDeathDate] = useState<Date | undefined>();
  const [motherIsAlive, setMotherIsAlive] = useState(true);
  
  // Confirmation
  const [understood, setUnderstood] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

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

  const canProceedToData = true;
  const canProceedToConfirmation = fatherFirstName.trim().length > 0 && motherFirstName.trim().length > 0;
  const canConfirm = understood && confirmationText.trim().toLowerCase() === familyName.trim().toLowerCase();

  const currentFounderName = currentFounder?.first_name || currentFounder?.name || 'المؤسس الحالي';
  const newFatherName = fatherFirstName || t('founder.new_father_name', 'الأب الجديد');
  const newMotherName = motherFirstName || t('founder.new_mother_name', 'الأم الجديدة');
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
            <div key={step} className="flex items-center gap-2">
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
            </div>
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
          {t('founder.add_parents_warning_description', 'أنت على وشك إضافة والدين (أب وأم) للمؤسس الحالي. هذا الإجراء سيغير هيكل الشجرة بالكامل.')}
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
            <span>{t('founder.new_father_founder', 'سيصبح الأب الجديد هو المؤسس')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-1">•</span>
            <span>{t('founder.mother_as_wife', 'ستكون الأم زوجة المؤسس الجديد')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-1">•</span>
            <span>{t('founder.marriage_created', 'سيتم إنشاء علاقة زوجية بين الأب والأم')}</span>
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
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Father Section */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          {t('founder.father_info', 'بيانات الأب (المؤسس الجديد)')}
        </h4>
        
        {/* Father Name Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="fatherFirstName">{t('common.first_name', 'الاسم الأول')} *</Label>
            <Input
              id="fatherFirstName"
              value={fatherFirstName}
              onChange={(e) => setFatherFirstName(e.target.value)}
              placeholder="مثال: أحمد"
              className="text-base bg-white dark:bg-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatherLastName">{t('common.last_name', 'اسم العائلة')}</Label>
            <Input
              id="fatherLastName"
              value={fatherLastName}
              onChange={(e) => setFatherLastName(e.target.value)}
              placeholder={familyName}
              className="text-base bg-white dark:bg-gray-900"
            />
          </div>
        </div>

        {/* Father Date Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>{t('common.birth_date', 'تاريخ الميلاد')}</Label>
            <EnhancedDatePicker
              value={fatherBirthDate}
              onChange={setFatherBirthDate}
              placeholder={t('common.select_date', 'اختر التاريخ')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('common.death_date', 'تاريخ الوفاة')}</Label>
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

        {/* Father Is Alive Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="fatherIsAlive"
            checked={fatherIsAlive}
            onCheckedChange={(checked) => {
              setFatherIsAlive(!!checked);
              if (checked) setFatherDeathDate(undefined);
            }}
          />
          <Label htmlFor="fatherIsAlive" className="cursor-pointer">
            {t('common.is_alive', 'على قيد الحياة')}
          </Label>
        </div>
      </div>

      {/* Marriage Link */}
      <div className="flex items-center justify-center gap-2 text-pink-500">
        <Heart className="h-5 w-5 fill-current" />
        <span className="text-sm font-medium">{t('founder.marriage_link', 'علاقة زوجية')}</span>
        <Heart className="h-5 w-5 fill-current" />
      </div>

      {/* Mother Section */}
      <div className="bg-pink-50 dark:bg-pink-950/20 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
        <h4 className="font-semibold text-pink-800 dark:text-pink-200 mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('founder.mother_info', 'بيانات الأم (زوجة المؤسس الجديد)')}
        </h4>
        
        {/* Mother Name Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="motherFirstName">{t('common.first_name', 'الاسم الأول')} *</Label>
            <Input
              id="motherFirstName"
              value={motherFirstName}
              onChange={(e) => setMotherFirstName(e.target.value)}
              placeholder="مثال: فاطمة"
              className="text-base bg-white dark:bg-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motherLastName">{t('common.last_name', 'اسم العائلة')}</Label>
            <Input
              id="motherLastName"
              value={motherLastName}
              onChange={(e) => setMotherLastName(e.target.value)}
              placeholder={t('common.optional', 'اختياري')}
              className="text-base bg-white dark:bg-gray-900"
            />
          </div>
        </div>

        {/* Mother Date Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>{t('common.birth_date', 'تاريخ الميلاد')}</Label>
            <EnhancedDatePicker
              value={motherBirthDate}
              onChange={setMotherBirthDate}
              placeholder={t('common.select_date', 'اختر التاريخ')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('common.death_date', 'تاريخ الوفاة')}</Label>
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

        {/* Mother Is Alive Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="motherIsAlive"
            checked={motherIsAlive}
            onCheckedChange={(checked) => {
              setMotherIsAlive(!!checked);
              if (checked) setMotherDeathDate(undefined);
            }}
          />
          <Label htmlFor="motherIsAlive" className="cursor-pointer">
            {t('common.is_alive', 'على قيد الحياة')}
          </Label>
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-4 flex items-center gap-2">
          <Crown className="h-4 w-4" />
          {t('founder.new_structure_preview', 'معاينة الهيكل الجديد')}
        </h4>
        <div className="flex flex-col items-center gap-3">
          {/* Parents Row */}
          <div className="flex items-center gap-4 w-full justify-center">
            {/* Father Card */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <Avatar className="h-10 w-10 ring-2 ring-blue-500">
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {fatherFirstName ? fatherFirstName.charAt(0) : '؟'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground text-sm">{newFatherName}</p>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Crown className="h-3 w-3" />
                  <span className="text-xs">{t('member.founder', 'المؤسس')}</span>
                </div>
              </div>
            </div>
            
            <Heart className="h-5 w-5 text-pink-500 fill-current" />
            
            {/* Mother Card */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <Avatar className="h-10 w-10 ring-2 ring-pink-500">
                <AvatarFallback className="bg-pink-100 text-pink-700">
                  {motherFirstName ? motherFirstName.charAt(0) : '؟'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground text-sm">{newMotherName}</p>
                <span className="text-xs text-muted-foreground">{t('profile.wife', 'الزوجة')}</span>
              </div>
            </div>
          </div>
          
          <ArrowDown className="h-5 w-5 text-amber-500" />
          
          {/* Current Founder (becomes child) */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm opacity-75">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-muted">
                {currentFounderName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{currentFounderName}</p>
              <p className="text-xs text-muted-foreground">{childRelation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 sticky bottom-0 bg-background">
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
            <span className="text-muted-foreground">{t('founder.new_father_founder', 'المؤسس الجديد (الأب)')}</span>
            <span className="font-medium text-blue-600">{newFatherName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-muted">
            <span className="text-muted-foreground">{t('founder.new_mother_wife', 'الأم (زوجة المؤسس)')}</span>
            <span className="font-medium text-pink-600">{newMotherName}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">{t('founder.marriage_status', 'العلاقة الزوجية')}</span>
            <span className="font-medium flex items-center gap-1">
              <Heart className="h-3 w-3 text-pink-500 fill-current" />
              {t('member.married', 'متزوجان')}
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
          <Label htmlFor="understood" className="cursor-pointer text-red-700 dark:text-red-300">
            {t('founder.confirm_understanding', 'أفهم أن هذه العملية لا يمكن التراجع عنها وستؤدي إلى تغيير هيكل الشجرة بالكامل.')}
          </Label>
        </div>

        {/* Confirmation Text Input */}
        <div className="space-y-2">
          <Label htmlFor="confirmationText" className="text-red-700 dark:text-red-300">
            {t('founder.type_family_name', 'اكتب اسم العائلة للتأكيد')}: <strong>"{familyName}"</strong>
          </Label>
          <Input
            id="confirmationText"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={familyName}
            className="border-red-300 dark:border-red-700 focus:border-red-500"
          />
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
              {t('founder.confirm_add_parents', 'تأكيد إضافة الوالدين')}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {t('founder.add_parents_to_founder', 'إضافة والدين للمؤسس')}
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
