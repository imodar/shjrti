import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { sendOTP } from "@/services/otpAuthService";
import { OTPForm } from "./OTPForm";
import { z } from 'zod';

// Schema will be created dynamically with translations

interface MagicLinkFormProps {
  onBack: () => void;
}

export function MagicLinkForm({ onBack }: MagicLinkFormProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const { toast } = useToast();
  const { t } = useLanguage();

  // Create schema with translated messages
  const emailSchema = z.object({
    email: z.string().email(t('invalid_email_format', 'البريد الإلكتروني غير صحيح')),
  });

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

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validation = emailSchema.safeParse({ email: magicLinkEmail });
      if (!validation.success) {
        setErrors({ email: validation.error.errors[0].message });
        setIsLoading(false);
        return;
      }

      const result = await sendOTP({
        email: magicLinkEmail,
        purpose: 'login'
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
        description: t('check_email_for_code', 'تحقق من بريدك الإلكتروني لإدخال الرمز المؤقت'),
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

  if (step === 'otp') {
    return (
      <OTPForm
        email={magicLinkEmail}
        purpose="login"
        onBack={() => setStep('email')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-800">{t('magic_link', 'تسجيل دخول بدون كلمة مرور')}</h3>
        <p className="text-gray-600">{t('magic_link_description', 'سنرسل لك رمزاً مؤقتاً للدخول')}</p>
      </div>

      <form onSubmit={handleSendMagicLink} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="magicLinkEmail">{t('email', 'البريد الإلكتروني')}</Label>
          <div className="relative">
            <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="magicLinkEmail"
              type="email"
              placeholder={t('email_placeholder', 'example@domain.com')}
              className={`pr-10 ${errors.email ? 'border-red-500' : ''}`}
              value={magicLinkEmail}
              onChange={(e) => {
                setMagicLinkEmail(e.target.value);
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
              : t('send_magic_link', 'إرسال رمز الدخول')}
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
