import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { verifyOTP, resendOTP } from "@/services/otpAuthService";
import { useNavigate } from "react-router-dom";

interface OTPFormProps {
  email: string;
  purpose: 'signup' | 'login' | 'reset_password';
  userData?: any;
  password?: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export function OTPForm({ email, purpose, userData, password, onBack, onSuccess }: OTPFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await verifyOTP({
        email,
        otpCode,
        purpose,
        password,
        userData
      });

      if (!result.success) {
        let errorMsg;
        switch (result.error) {
          case 'OTP_INVALID_OR_EXPIRED':
            errorMsg = t('otp_invalid_or_expired', 'رمز التحقق غير صحيح أو منتهي الصلاحية');
            break;
          case 'OTP_ALREADY_USED':
            errorMsg = t('otp_already_used', 'تم استخدام هذا الرمز مسبقاً');
            break;
          default:
            errorMsg = t('otp_verification_failed', 'فشل التحقق من الرمز');
        }
        
        toast({
          title: t('verification_error', 'خطأ في التحقق'),
          description: errorMsg,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: t('verification_successful', 'تم التحقق بنجاح'),
        description: purpose === 'signup' ? t('welcome_to_my_tree', 'مرحباً بك في شجرتي') : t('welcome_back', 'مرحباً بعودتك'),
      });

      setOtpCode("");
      
      if (onSuccess) {
        onSuccess();
      } else {
        // توجيه المستخدمين الجدد لاختيار الباقة، والقدامى للداشبورد
        if (purpose === 'signup') {
          navigate("/plan-selection");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error('[OTPForm] Error:', error);
      toast({
        title: t('error', 'خطأ'),
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    
    setIsLoading(true);
    try {
      const result = await resendOTP({
        email,
        purpose,
        userData
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

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">{t('verify_code', 'تحقق من الرمز')}</h3>
        <p className="text-gray-600">
          {t('enter_code_sent_to', 'أدخل الرمز المرسل إلى')}
          <br />
          <span className="font-medium text-emerald-600">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otpCode">{t('verification_code', 'رمز التحقق')}</Label>
          <div className="relative">
            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="otpCode"
              type="text"
              placeholder={t('enter_6_digit_code', 'أدخل الرمز المكون من 6 أرقام')}
              className="pr-10 text-center text-lg tracking-wider"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          disabled={isLoading || otpCode.length !== 6}
        >
          {isLoading ? t('verifying', 'جاري التحقق...') : t('verify', 'تحقق')}
          <ShieldCheck className="mr-2 h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-2">
        <Button
          type="button"
          onClick={handleResendOTP}
          variant="outline"
          className="w-full"
          disabled={isLoading || cooldown > 0}
        >
          {cooldown > 0
            ? `${t('retry_after', 'أعد المحاولة بعد')} ${cooldown}ث`
            : t('resend_code', 'إعادة إرسال الرمز')}
        </Button>

        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full"
          disabled={isLoading}
        >
          <ArrowLeft className="ml-2 h-4 w-4" />
          {t('back', 'رجوع')}
        </Button>
      </div>
    </div>
  );
}
