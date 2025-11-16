import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { z } from 'zod';
import { checkPasswordStrength, PasswordStrength } from "@/lib/passwordStrength";

const signupSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  firstName: z.string().min(2, 'الاسم الأول يجب أن يكون حرفين على الأقل'),
  lastName: z.string().min(2, 'الاسم الأخير يجب أن يكون حرفين على الأقل'),
  phone: z.string().optional(),
});

interface SignupFormProps {
  onOTPRequired: (userData: any) => void;
}

export function SignupForm({ onOTPRequired }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: 'bg-gray-300',
    label: 'لا يوجد',
    percentage: 0
  });
  const [errors, setErrors] = useState<any>({});
  const { toast } = useToast();
  const { t } = useLanguage();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
    setErrors({ ...errors, password: undefined });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // 1. Validate inputs
      const validation = signupSchema.safeParse({
        email,
        password,
        firstName,
        lastName,
        phone
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

      // 2. Check password strength
      if (passwordStrength.score < 3) {
        toast({
          title: t('weak_password', 'كلمة مرور ضعيفة'),
          description: passwordStrength.feedback.join(', '),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // 3. Get reCAPTCHA token (optional for now)
      let recaptchaToken = null;
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('signup');
        } catch (error) {
          console.warn('reCAPTCHA execution failed:', error);
        }
      } else {
        console.warn('reCAPTCHA not ready - proceeding without verification');
      }

      // 4. Call secure-signup edge function
      const { data, error } = await supabase.functions.invoke('secure-signup', {
        body: {
          email: validation.data.email,
          password: validation.data.password,
          firstName: validation.data.firstName,
          lastName: validation.data.lastName,
          phone: validation.data.phone || '',
          recaptchaToken
        }
      });

      if (error || !data?.success) {
        toast({
          title: t('register_error', 'خطأ في إنشاء الحساب'),
          description: data?.error || error?.message || 'فشل إنشاء الحساب',
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // 5. Success - trigger OTP verification
      onOTPRequired({
        email: validation.data.email,
        password: validation.data.password,
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        phone: validation.data.phone
      });

      toast({
        title: t('verification_code_sent', 'تم إرسال رمز التحقق'),
        description: data.message || 'يرجى التحقق من بريدك الإلكتروني',
      });

      setIsLoading(false);
    } catch (error: any) {
      console.error('[SignupForm] Error:', error);
      toast({
        title: t('error', 'خطأ'),
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('first_name', 'الاسم الأول')}</Label>
          <div className="relative">
            <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="firstName"
              type="text"
              placeholder={t('first_name_placeholder', 'أحمد')}
              className={`pr-10 ${errors.firstName ? 'border-red-500' : ''}`}
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrors({ ...errors, firstName: undefined });
              }}
              required
            />
          </div>
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">{t('last_name', 'الاسم الأخير')}</Label>
          <div className="relative">
            <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="lastName"
              type="text"
              placeholder={t('last_name_placeholder', 'محمد')}
              className={`pr-10 ${errors.lastName ? 'border-red-500' : ''}`}
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors({ ...errors, lastName: undefined });
              }}
              required
            />
          </div>
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signupEmail">{t('email', 'البريد الإلكتروني')}</Label>
        <div className="relative">
          <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signupEmail"
            type="email"
            placeholder={t('email_placeholder', 'example@domain.com')}
            className={`pr-10 ${errors.email ? 'border-red-500' : ''}`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({ ...errors, email: undefined });
            }}
            required
          />
        </div>
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t('phone', 'رقم الهاتف')} ({t('optional', 'اختياري')})</Label>
        <div className="relative">
          <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder={t('phone_placeholder', '+966 5XXXXXXXX')}
            className="pr-10"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signupPassword">{t('password', 'كلمة المرور')}</Label>
        <div className="relative">
          <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signupPassword"
            type="password"
            placeholder={t('password_placeholder', '••••••••')}
            className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
          />
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

        {/* Password Strength Indicator */}
        {password && (
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
            {passwordStrength.feedback.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {passwordStrength.feedback.map((tip, idx) => (
                  <li key={idx}>• {tip}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
        disabled={isLoading}
      >
        {isLoading ? t('creating_account', 'جاري إنشاء الحساب...') : t('create_account', 'إنشاء حساب')}
        <User className="mr-2 h-4 w-4" />
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {t('recaptcha_protected', 'هذا الموقع محمي بواسطة reCAPTCHA')}
      </p>
    </form>
  );
}
