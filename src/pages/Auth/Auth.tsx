import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TreePine, Heart, Users, Star, Sparkles, Crown, Gem } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import familyTreeLogo from "@/assets/family-tree-logo.png";
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { OTPForm } from "./OTPForm";
import { PasswordResetForm } from "./PasswordResetForm";
import { MagicLinkForm } from "./MagicLinkForm";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

const Auth = () => {
  const [showOTP, setShowOTP] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const navigate = useNavigate();
  const { t, direction } = useLanguage();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleOTPRequired = (userData: any) => {
    setPendingUserData(userData);
    setShowOTP(true);
  };

  const handleBackToAuth = () => {
    setShowOTP(false);
    setShowPasswordReset(false);
    setShowMagicLink(false);
    setPendingUserData(null);
  };

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Enhanced Floating Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 animate-float">
            <Heart className="h-16 w-16 text-pink-400/30 dark:text-pink-500/20" />
          </div>
          <div className="absolute bottom-32 right-20 animate-float-delayed">
            <Users className="h-20 w-20 text-emerald-400/20 dark:text-emerald-500/15" />
          </div>
          <div className="absolute top-1/3 right-1/3 animate-float-slow">
            <Star className="h-12 w-12 text-amber-400/25 dark:text-amber-500/15" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 animate-float">
            <Sparkles className="h-14 w-14 text-teal-400/20 dark:text-teal-500/15" />
          </div>
          <div className="absolute top-1/2 left-20 animate-float-delayed">
            <Crown className="h-10 w-10 text-amber-500/20 dark:text-amber-600/15" />
          </div>
          <div className="absolute bottom-40 right-1/4 animate-float-slow">
            <Gem className="h-12 w-12 text-purple-400/20 dark:text-purple-500/15" />
          </div>
        </div>

        <div className="min-h-screen flex">
          {/* Left Side - Luxury Branding */}
          <div className="hidden lg:flex lg:w-1/2 relative">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800"></div>
            
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white w-full">
              <div className="max-w-md space-y-8 text-center">
                {/* Logo with Glow Effect */}
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-white/30 blur-3xl rounded-full animate-pulse-slow"></div>
                  <img
                    src={familyTreeLogo}
                    alt="Family Tree Logo"
                    className="relative w-48 h-48 mx-auto drop-shadow-2xl animate-float"
                  />
                </div>

                <div className="space-y-4">
                  <h1 className="text-6xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-white via-emerald-50 to-white bg-clip-text text-transparent drop-shadow-lg">
                      {t('appName', 'شجرتي')}
                    </span>
                  </h1>
                  
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                    <Crown className="h-6 w-6 text-amber-300" />
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                  </div>
                </div>

                {/* Tagline */}
                <p className="text-2xl font-light text-emerald-50/90 leading-relaxed max-w-sm mx-auto">
                  {t('authTagline', 'احفظ تاريخ عائلتك للأجيال القادمة')}
                </p>

                {/* Feature Icons */}
                <div className="grid grid-cols-3 gap-6 pt-8">
                  <div className="flex flex-col items-center gap-3 group">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                      <TreePine className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-sm font-medium text-emerald-50">{t('familyTree', 'شجرة العائلة')}</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3 group">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                      <Heart className="h-8 w-8 text-pink-200" />
                    </div>
                    <span className="text-sm font-medium text-emerald-50">{t('memories', 'الذكريات')}</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3 group">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-sm font-medium text-emerald-50">{t('family', 'العائلة')}</span>
                  </div>
                </div>

                {/* Luxury Badge */}
                <div className="pt-6 flex items-center justify-center gap-2">
                  <Gem className="h-5 w-5 text-amber-300" />
                  <span className="text-emerald-100/80 text-sm font-light tracking-wide">{t('premiumPlatform', 'منصة متميزة لعائلات مميزة')}</span>
                  <Sparkles className="h-5 w-5 text-amber-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Authentication */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
            <Card className="w-full max-w-md backdrop-blur-xl bg-card/95 shadow-2xl border-0 ring-1 ring-border/50">
              <CardHeader className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-2xl opacity-30 rounded-full"></div>
                    <TreePine className="relative h-16 w-16 text-emerald-600" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {t('mytree', 'شجرتي')}
                </CardTitle>
                <CardDescription className="text-base">
                  {showPasswordReset
                    ? t('reset_your_password', 'إعادة تعيين كلمة المرور')
                    : showMagicLink
                    ? t('login_without_password', 'تسجيل دخول بدون كلمة مرور')
                    : showOTP
                    ? t('verify_your_account', 'تحقق من حسابك')
                    : t('login_or_create_account', 'سجل دخول أو أنشئ حساباً جديداً')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showPasswordReset ? (
                  <PasswordResetForm onBack={handleBackToAuth} />
                ) : showMagicLink ? (
                  <MagicLinkForm onBack={handleBackToAuth} />
                ) : showOTP ? (
                  <OTPForm
                    email={pendingUserData?.email || ''}
                    purpose="signup"
                    userData={pendingUserData}
                    password={pendingUserData?.password}
                    onBack={handleBackToAuth}
                  />
                ) : (
                  <Tabs defaultValue="login" dir={direction}>
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login">{t('login', 'تسجيل الدخول')}</TabsTrigger>
                      <TabsTrigger value="signup">{t('create_account', 'إنشاء حساب')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <LoginForm onSwitchToReset={() => setShowPasswordReset(true)} />
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setShowMagicLink(true)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          {t('login_without_password', 'تسجيل دخول بدون كلمة مرور')}
                        </button>
                      </div>
                    </TabsContent>

                    <TabsContent value="signup">
                      <SignupForm onOTPRequired={handleOTPRequired} />
                    </TabsContent>
                  </Tabs>
                )}

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  {!showPasswordReset && !showMagicLink && !showOTP && (
                    <>
                      {t('by_continuing', 'بالمتابعة، أنت توافق على')}{" "}
                      <Link to="/terms" className="text-emerald-600 hover:underline">
                        {t('terms', 'الشروط والأحكام')}
                      </Link>
                      {" "}{t('and')}{" "}
                      <Link to="/privacy" className="text-emerald-600 hover:underline">
                        {t('privacy_policy', 'سياسة الخصوصية')}
                      </Link>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </GoogleReCaptchaProvider>
  );
};

export default Auth;
