import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

interface LoginFormProps {
  onSwitchToReset: () => void;
  onSwitchToMagicLink: () => void;
}

export function LoginForm({ onSwitchToReset, onSwitchToMagicLink }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // 1. Validate inputs
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        const fieldErrors: any = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      // 2. Get reCAPTCHA token (optional for now)
      let recaptchaToken = null;
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('login');
        } catch (error) {
          console.warn('reCAPTCHA execution failed:', error);
        }
      } else {
        console.warn('reCAPTCHA not ready - proceeding without verification');
      }

      // 3. Call secure-login edge function
      try {
        const { data, error } = await supabase.functions.invoke('secure-login', {
          body: {
            email: validation.data.email,
            password: validation.data.password,
            recaptchaToken
          }
        });

        if (error) {
          throw error;
        }

        if (!data?.success) {
          const errorMsg = data?.error || 'فشل تسجيل الدخول';
          
          // Handle rate limiting
          if (data?.rateLimitExceeded) {
            toast({
              title: t('rate_limit_exceeded', 'تم تجاوز عدد المحاولات'),
              description: errorMsg,
              variant: "destructive",
            });
          } else {
            toast({
              title: t('login_error', 'خطأ في تسجيل الدخول'),
              description: errorMsg,
              variant: "destructive",
            });
          }
          setIsLoading(false);
          return;
        }

        // 4. Set session
        if (data.session) {
          await supabase.auth.setSession(data.session);
        }

        toast({
          title: t('login_successful', 'تم تسجيل الدخول بنجاح'),
          description: t('welcome_back', 'مرحباً بعودتك'),
        });

        navigate("/dashboard");
      } catch (functionError: any) {
        // Don't spam console for expected errors like 401 invalid credentials
        let errorMsg = 'فشل تسجيل الدخول';
        let isRateLimitError = false;
        let isExpectedAuthError = false;

        if (functionError?.context && typeof functionError.context.json === 'function') {
          try {
            const errorBody = await functionError.context.json();
            errorMsg = errorBody.error || errorMsg;
            isRateLimitError = !!errorBody.rateLimitExceeded;
            isExpectedAuthError = typeof errorMsg === 'string' && (
              errorMsg.includes('البريد الإلكتروني') ||
              errorMsg.toLowerCase().includes('invalid login')
            );
          } catch {
            // ignore parse errors
          }
        } else if (functionError?.message) {
          isExpectedAuthError = functionError.message.includes('non-2xx');
        }

        if (!isExpectedAuthError && !isRateLimitError) {
          console.error('[LoginForm] Unexpected edge function error:', functionError);
        }

        const toastTitle = isRateLimitError
          ? t('rate_limit_exceeded', 'تم تجاوز عدد المحاولات')
          : t('login_error', 'خطأ في تسجيل الدخول');

        toast({
          title: toastTitle,
          description: errorMsg,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    } catch (error: any) {
      console.error('[LoginForm] Error:', error);
      toast({
        title: t('error', 'خطأ'),
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t('email', 'البريد الإلكتروني')}</Label>
        <div className="relative">
          <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
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
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('password', 'كلمة المرور')}</Label>
        <div className="relative">
          <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder={t('password_placeholder', '••••••••')}
            className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({ ...errors, password: undefined });
            }}
            required
          />
        </div>
        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
      </div>

      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="link"
          onClick={onSwitchToMagicLink}
          className="text-sm text-emerald-600 hover:text-emerald-700 p-0 h-auto"
        >
          {t('login_without_password', 'تسجيل دخول بدون كلمة مرور')}
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={onSwitchToReset}
          className="text-sm text-emerald-600 hover:text-emerald-700 p-0 h-auto"
        >
          {t('forgot_password', 'نسيت كلمة المرور؟')}
        </Button>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
        disabled={isLoading}
      >
        {isLoading ? t('logging_in', 'جاري تسجيل الدخول...') : t('login', 'تسجيل الدخول')}
        <Lock className="mr-2 h-4 w-4" />
      </Button>
    </form>
  );
}
