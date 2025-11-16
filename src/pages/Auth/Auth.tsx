import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  const [isLoading, setIsLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
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
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(245,158,11,0.1),transparent_50%)]"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-lg animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-white/15 rounded-full blur-md animate-pulse delay-2000"></div>
            
            {/* Floating Tree Icons */}
            <div className="absolute top-1/6 right-1/6 text-white/10 animate-bounce">
              <TreePine className="h-8 w-8" />
            </div>
            <div className="absolute bottom-1/6 left-1/6 text-white/10 animate-bounce delay-500">
              <TreePine className="h-6 w-6" />
            </div>
            <div className="absolute top-2/3 right-1/3 text-white/10 animate-bounce delay-1000">
              <TreePine className="h-4 w-4" />
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex items-center justify-center min-h-full p-8 w-full mx-auto">
            <div className="text-center text-white space-y-8 max-w-lg font-arabic">
              {/* Luxury Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-amber-300/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-2 border-2 border-white/30 inline-block shadow-2xl">
                  <img 
                    src={familyTreeLogo} 
                    alt={t('mytree', 'شجرتي')}
                    className="h-24 w-24 rounded-full group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-80 animate-pulse">
                  <Crown className="h-4 w-4 text-white m-2" />
                </div>
              </div>

              {/* Luxury Title */}
              <div className="space-y-4">
                <h1 className="text-6xl font-bold leading-tight">
                  <span className="block bg-gradient-to-r from-white via-amber-200 to-white bg-clip-text text-transparent">
                    {t('welcome_to', 'مرحباً بك في')}
                  </span>
                  <span className="block text-white font-black text-7xl">
                    {t('mytree', 'شجرتي')}
                  </span>
                </h1>
                <div className="w-20 h-1 bg-gradient-to-r from-amber-400 to-white mx-auto rounded-full"></div>
              </div>

              {/* Luxury Description */}
              <p className="text-xl opacity-95 leading-relaxed font-light">
                {t('exceptional_journey', 'ابدأ رحلتك الاستثنائية في اكتشاف جذورك وبناء إرث رقمي فاخر')}
                <br />
                <span className="text-amber-200 font-medium">
                  {t('best_arabic_platform', 'مع أفضل منصة عربية لإنشاء أشجار العائلة')}
                </span>
              </p>

              {/* Luxury Statistics */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div className="text-3xl font-bold group-hover:text-amber-200 transition-colors">+1000</div>
                    <div className="text-sm opacity-80 mt-1">{t('distinguished_family', 'عائلة مميزة')}</div>
                  </div>
                </div>
                <div className="group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div className="text-3xl font-bold group-hover:text-emerald-200 transition-colors">+50k</div>
                    <div className="text-sm opacity-80 mt-1">{t('preserved_member', 'فرد محفوظ')}</div>
                  </div>
                </div>
                <div className="group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div className="text-3xl font-bold group-hover:text-blue-200 transition-colors">100%</div>
                    <div className="text-sm opacity-80 mt-1">{t('high_security', 'آمان عالي')}</div>
                  </div>
                </div>
              </div>

              {/* Luxury Features */}
              <div className={`space-y-4 ${direction === 'rtl' ? 'pt-4' : 'pt-4'}`}>
                <div className={`flex items-center justify-center gap-4 ${direction === 'rtl' ? 'space-x-4 space-x-reverse' : 'space-x-4'}`}>
                  <div className={`flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg ${direction === 'rtl' ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                    <Gem className="w-4 h-4 text-emerald-300" />
                    <span className="text-sm font-medium">{t('luxury_design', 'تصميم فاخر')}</span>
                  </div>
                  <div className={`flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg ${direction === 'rtl' ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span className="text-sm font-medium">{t('high_quality', 'جودة عالية')}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className={`flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg ${direction === 'rtl' ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">{t('distinctive_experience', 'تجربة مميزة')}</span>
                  </div>
                </div>
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
                  <>
                    <Tabs defaultValue="login" dir={direction}>
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="login">{t('login', 'تسجيل الدخول')}</TabsTrigger>
                        <TabsTrigger value="signup">{t('create_account', 'إنشاء حساب')}</TabsTrigger>
                      </TabsList>

                      <TabsContent value="login">
                        <LoginForm 
                          onSwitchToReset={() => setShowPasswordReset(true)}
                          onSwitchToMagicLink={() => setShowMagicLink(true)}
                        />
                      </TabsContent>

                      <TabsContent value="signup">
                        <SignupForm onOTPRequired={handleOTPRequired} />
                      </TabsContent>
                    </Tabs>

                    {/* Google Sign In */}
                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">{t('or', 'أو')}</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleGoogleSignIn}
                        variant="outline"
                        className="w-full mt-4 border-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        disabled={isLoading}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        {t('continue_with_google', 'متابعة مع Google')}
                      </Button>
                    </div>
                  </>
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

                <div className="mt-6 text-center">
                  <Link to="/">
                    <Button variant="outline" className="w-full sm:w-auto gap-2">
                      <ArrowRight className="h-4 w-4" />
                      {t('back_to_home', 'العودة للرئيسية')}
                    </Button>
                  </Link>
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
