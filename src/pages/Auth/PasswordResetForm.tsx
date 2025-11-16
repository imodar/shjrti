import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { sendOTP } from "@/services/otpAuthService";
import { OTPForm } from "./OTPForm";
import { z } from 'zod';
import { checkPasswordStrength } from "@/lib/passwordStrength";

const resetEmailSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
});

const newPasswordSchema = z.object({
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

interface PasswordResetFormProps {
  onBack: () => void;
}

export function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [errors, setErrors] = useState<any>({});
  const { toast } = useToast();
  const { t } = useLanguage();

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validation = resetEmailSchema.safeParse({ email: resetEmail });
      if (!validation.success) {
        setErrors({ email: validation.error.errors[0].message });
        setIsLoading(false);
        return;
      }

      const result = await sendOTP({
        email: resetEmail,
        purpose: 'reset_password'
      });

      if (!result.success) {
        toast({
          title: t('error', 'خطأ'),
          description: result.error || t('failed_to_send_otp', 'فشل إرسال رمز التحقق'),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: t('code_sent', 'تم إرسال الرمز'),
        description: t('check_email_for_code', 'تحقق من بريدك الإلكتروني'),
      });

      startCooldown();
      setStep('otp');
      setIsLoading(false);
    } catch (error: any) {
      toast({
        title: t('error', 'خطأ'),
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleOTPVerified = () => {
    setStep('newPassword');
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validation = newPasswordSchema.safeParse({
        password: newPassword,
        confirmPassword
      });

      if (!validation.success) {
        const fieldErrors: any = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      const strength = checkPasswordStrength(newPassword);
      if (strength.score < 3) {
        toast({
          title: t('weak_password', 'كلمة مرور ضعيفة'),
          description: strength.feedback.join(', '),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: t('password_reset_successful', 'تم إعادة تعيين كلمة المرور'),
        description: t('you_can_now_login', 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة'),
      });

      onBack();
    } catch (error: any) {
      toast({
        title: t('error', 'خطأ'),
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <OTPForm
        email={resetEmail}
        purpose="reset_password"
        password={newPassword}
        onBack={() => setStep('email')}
        onSuccess={handleOTPVerified}
      />
    );
  }

  if (step === 'newPassword') {
    const passwordStrength = checkPasswordStrength(newPassword);

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-gray-800">{t('set_new_password', 'تعيين كلمة مرور جديدة')}</h3>
          <p className="text-gray-600">{t('enter_new_password', 'أدخل كلمة المرور الجديدة')}</p>
        </div>

        <form onSubmit={handleSetNewPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('new_password', 'كلمة المرور الجديدة')}</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                placeholder={t('password_placeholder', '••••••••')}
                className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors({ ...errors, password: undefined });
                }}
                required
              />
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

            {newPassword && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">قوة كلمة المرور:</span>
                  <span className={`font-medium ${passwordStrength.score >= 4 ? 'text-green-600' : passwordStrength.score >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirm_password', 'تأكيد كلمة المرور')}</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('password_placeholder', '••••••••')}
                className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors({ ...errors, confirmPassword: undefined });
                }}
                required
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            disabled={isLoading}
          >
            {isLoading ? t('saving', 'جاري الحفظ...') : t('save_password', 'حفظ كلمة المرور')}
            <Lock className="mr-2 h-4 w-4" />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-800">{t('forgot_password', 'نسيت كلمة المرور؟')}</h3>
        <p className="text-gray-600">{t('reset_password_instruction', 'أدخل بريدك الإلكتروني لإرسال رمز إعادة التعيين')}</p>
      </div>

      <form onSubmit={handleSendResetCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="resetEmail">{t('email', 'البريد الإلكتروني')}</Label>
          <div className="relative">
            <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="resetEmail"
              type="email"
              placeholder={t('email_placeholder', 'example@domain.com')}
              className={`pr-10 ${errors.email ? 'border-red-500' : ''}`}
              value={resetEmail}
              onChange={(e) => {
                setResetEmail(e.target.value);
                setErrors({ ...errors, email: undefined });
              }}
              required
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          disabled={isLoading || cooldown > 0}
        >
          {isLoading
            ? t('sending', 'جاري الإرسال...')
            : cooldown > 0
              ? `${t('retry_after', 'أعد المحاولة بعد')} ${cooldown}ث`
              : t('send_reset_code', 'إرسال رمز إعادة التعيين')}
          <Mail className="mr-2 h-4 w-4" />
        </Button>
      </form>

      <Button
        onClick={onBack}
        variant="ghost"
        className="w-full"
        disabled={isLoading}
      >
        <ArrowLeft className="ml-2 h-4 w-4" />
        {t('back_to_login', 'العودة إلى تسجيل الدخول')}
      </Button>
    </div>
  );
}
