import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TreePine, Mail, Lock, User, Phone, Heart, Users, Star, Sparkles, Crown, Gem, ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import familyTreeLogo from "@/assets/family-tree-logo.png";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if email is not confirmed
        if (error.message.includes("Email not confirmed") || error.message.includes("not confirmed")) {
          toast({
            title: t('email_not_confirmed', 'البريد الإلكتروني غير مؤكد'),
            description: t('will_send_verification_code', 'سنرسل لك رمز تحقق جديد'),
          });
          
          // Send OTP code via email
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
              shouldCreateUser: false,
            }
          });

          if (otpError) {
            toast({
              title: t('sending_error', 'خطأ في الإرسال'),
              description: otpError.message,
              variant: "destructive",
            });
          } else {
            // Store user data and show OTP screen
            setPendingUserData({ email, password, fullName: "", phone: "" });
            setShowOTP(true);
            toast({
              title: t('verification_code_sent', 'تم إرسال رمز التحقق'),
              description: t('enter_code_instruction', 'يرجى إدخال الرمز المرسل إلى بريدك الإلكتروني'),
            });
          }
        } else {
          toast({
            title: t('login_error', 'خطأ في تسجيل الدخول'),
            description: error.message,
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      toast({
        title: t('welcome', 'مرحباً بك'),
        description: t('login_successful', 'تم تسجيل الدخول بنجاح'),
      });

      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تسجيل الدخول",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
          }
        }
      });

      if (error) {
        toast({
          title: "خطأ في إنشاء الحساب",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Store user data for later verification
      setPendingUserData({ email, password, fullName, phone });
      
      toast({
        title: "تم إرسال رمز التحقق",
        description: "يرجى التحقق من بريدك الإلكتروني وإدخال رمز التحقق",
      });

      // Show OTP screen
      setShowOTP(true);
      setIsLoading(false);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingUserData.email,
        token: otpCode,
        type: 'signup'
      });

      if (error) {
        toast({
          title: "خطأ في التحقق",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "تم التحقق بنجاح",
        description: "مرحباً بك في شجرتي",
      });

      // Clear form and redirect
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
      setOtpCode("");
      setShowOTP(false);
      setPendingUserData(null);
      
      // For new registration, redirect to plan selection
      window.location.href = "/plan-selection";
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء التحقق",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!pendingUserData) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingUserData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "خطأ في إعادة الإرسال",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "تم إعادة الإرسال",
        description: "تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إعادة الإرسال",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRegister = () => {
    setShowOTP(false);
    setOtpCode("");
    setPendingUserData(null);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      cleanupAuthState();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تسجيل الدخول بـ Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950">
      <div className="min-h-screen flex relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 animate-float">
            <Heart className="h-12 w-12 text-pink-400 opacity-60" />
          </div>
          <div className="absolute bottom-32 left-16 animate-float-delayed">
            <Users className="h-16 w-16 text-emerald-400 opacity-40" />
          </div>
          <div className="absolute top-40 left-32 animate-float-slow">
            <Star className="h-8 w-8 text-yellow-400 opacity-60" />
          </div>
          <div className="absolute top-1/2 right-1/4 animate-float">
            <Sparkles className="h-10 w-10 text-emerald-500 opacity-50" />
          </div>
        </div>

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
                    alt="شجرتي" 
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
                    {t('my_tree', 'شجرتي')}
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
                    <div className="text-sm opacity-80 mt-1">عائلة مميزة</div>
                  </div>
                </div>
                <div className="group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div className="text-3xl font-bold group-hover:text-emerald-200 transition-colors">+50k</div>
                    <div className="text-sm opacity-80 mt-1">فرد محفوظ</div>
                  </div>
                </div>
                <div className="group">
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div className="text-3xl font-bold group-hover:text-blue-200 transition-colors">100%</div>
                    <div className="text-sm opacity-80 mt-1">آمان عالي</div>
                  </div>
                </div>
              </div>

              {/* Luxury Features */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-center space-x-4 space-x-reverse">
                  <div className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg">
                    <Gem className="w-4 h-4 text-emerald-300" />
                    <span className="text-sm font-medium">تصميم فاخر</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg">
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span className="text-sm font-medium">جودة عالية</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">تجربة مميزة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Luxury Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="relative group mx-auto w-fit">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-30"></div>
                <img 
                  src={familyTreeLogo} 
                  alt="شجرتي" 
                  className="relative h-16 w-16 rounded-full mx-auto mb-4 border-2 border-emerald-200"
                />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">شجرتي</h1>
              <p className="text-muted-foreground">اكتشف جذورك مع أفضل منصة</p>
            </div>

            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl relative overflow-hidden">
              {/* Luxury Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
              
              <CardHeader className="text-center relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="h-6 w-6 text-amber-500" />
                  <CardTitle className="text-3xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    انضم إلى شجرتي
                  </CardTitle>
                  <Crown className="h-6 w-6 text-amber-500" />
                </div>
                <CardDescription className="text-lg text-gray-600">
                  ابدأ رحلتك الاستثنائية في بناء إرث عائلتك الرقمي
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {showOTP ? (
                  /* OTP Verification Screen */
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                          <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">تأكيد الحساب</h3>
                      <p className="text-gray-600">
                        أدخل رمز التحقق المرسل إلى
                        <br />
                        <span className="font-medium text-emerald-600">{pendingUserData?.email}</span>
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otpCode">رمز التحقق</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="otpCode"
                            type="text"
                            placeholder="أدخل الرمز المكون من 6 أرقام"
                            className="pr-10 text-center text-lg tracking-wider"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            maxLength={6}
                            required
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        disabled={isLoading || otpCode.length !== 6}
                      >
                        {isLoading ? "جاري التحقق..." : "تأكيد الحساب"}
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      </Button>
                    </form>

                    <div className="space-y-3">
                      <Button
                        onClick={handleResendOTP}
                        variant="outline"
                        className="w-full border-emerald-200 hover:bg-emerald-50"
                        disabled={isLoading}
                      >
                        إعادة إرسال الرمز
                        <Mail className="mr-2 h-4 w-4" />
                      </Button>

                      <Button
                        onClick={handleBackToRegister}
                        variant="ghost"
                        className="w-full"
                        disabled={isLoading}
                      >
                        <ArrowLeft className="ml-2 h-4 w-4" />
                        العودة إلى إنشاء الحساب
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Regular Auth Tabs */
                  <>
                    <Tabs defaultValue="login" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1 gap-1">
                        <TabsTrigger 
                          value="register" 
                          className="rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-200 data-[state=active]:hover:bg-emerald-600"
                        >
                          إنشاء حساب
                        </TabsTrigger>
                        <TabsTrigger 
                          value="login" 
                          className="rounded-lg font-medium transition-all duration-300 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-200 data-[state=active]:hover:bg-emerald-600"
                        >
                          تسجيل الدخول
                        </TabsTrigger>
                      </TabsList>

                      {/* Register Tab */}
                      <TabsContent value="register" className="space-y-4">
                        <form onSubmit={handleRegister} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">الاسم الكامل</Label>
                            <div className="relative">
                              <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="fullName"
                                placeholder="أدخل اسمك الكامل"
                                className="pr-10"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <div className="relative">
                              <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="email"
                                type="email"
                                placeholder="example@domain.com"
                                className="pr-10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">رقم الهاتف</Label>
                            <div className="relative">
                              <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="+966 50 123 4567"
                                className="pr-10"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password">كلمة المرور</Label>
                            <div className="relative">
                              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="password"
                                type="password"
                                placeholder="أدخل كلمة مرور قوية"
                                className="pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                            disabled={isLoading}
                          >
                            {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب جديد"}
                            <TreePine className="mr-2 h-4 w-4" />
                          </Button>
                        </form>
                      </TabsContent>

                      {/* Login Tab */}
                      <TabsContent value="login" className="space-y-4">
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="loginEmail">البريد الإلكتروني</Label>
                            <div className="relative">
                              <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="loginEmail"
                                type="email"
                                placeholder="example@domain.com"
                                className="pr-10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="loginPassword">كلمة المرور</Label>
                            <div className="relative">
                              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="loginPassword"
                                type="password"
                                placeholder="أدخل كلمة المرور"
                                className="pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <a href="#" className="text-primary hover:underline">
                              نسيت كلمة المرور؟
                            </a>
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                            disabled={isLoading}
                          >
                            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                            <Sparkles className="mr-2 h-4 w-4" />
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>

                    {/* Google Sign In */}
                    <div className="mt-6">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">أو</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleGoogleSignIn}
                        variant="outline"
                        className="w-full mt-4 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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
                        متابعة مع Google
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Luxury Back to Home Link */}
            <div className="text-center">
              <Link
                to="/"
                className="group inline-flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-all duration-300 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 border border-emerald-200 hover:border-emerald-300 hover:shadow-lg"
              >
                <TreePine className="h-4 w-4 group-hover:text-emerald-500 transition-colors" />
                العودة إلى الصفحة الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Auth;