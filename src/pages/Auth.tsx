import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TreePine, Mail, Lock, User, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import familyTreeLogo from "@/assets/family-tree-logo.png";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

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
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "مرحباً بك",
        description: "تم تسجيل الدخول بنجاح",
      });

      window.location.href = "/dashboard";
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تسجيل الدخول",
        variant: "destructive",
      });
    } finally {
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
      
      const { error } = await supabase.auth.signUp({
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
        return;
      }

      toast({
        title: "تم إنشاء الحساب",
        description: "يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب",
      });

      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-8 relative overflow-hidden">
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
        <div className="relative z-10 text-center text-white space-y-8 max-w-lg">
          {/* Logo with Enhanced Design */}
          <div className="relative group">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20 inline-block">
              <img 
                src={familyTreeLogo} 
                alt="شجرتي" 
                className="h-24 w-24 rounded-full border-4 border-white/30 shadow-2xl group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Enhanced Title */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight">
              مرحباً بك في 
              <span className="block text-transparent bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text">
                شجرتي
              </span>
            </h1>
            <div className="w-16 h-1 bg-white/60 mx-auto rounded-full"></div>
          </div>

          {/* Enhanced Description */}
          <p className="text-xl opacity-95 leading-relaxed font-light">
            ابدأ رحلتك في اكتشاف جذورك وبناء تاريخ عائلتك 
            <br />
            مع أسهل منصة عربية لإنشاء أشجار العائلة
          </p>

          {/* Enhanced Statistics */}
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold group-hover:text-yellow-200 transition-colors">+1000</div>
                <div className="text-sm opacity-80 mt-1">عائلة</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold group-hover:text-green-200 transition-colors">+50k</div>
                <div className="text-sm opacity-80 mt-1">فرد</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-3xl font-bold group-hover:text-blue-200 transition-colors">100%</div>
                <div className="text-sm opacity-80 mt-1">آمن</div>
              </div>
            </div>
          </div>

          {/* New Features Section */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">سهل الاستخدام</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                <span className="text-sm">حفظ آمن</span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 space-x-reverse bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-700"></div>
                <span className="text-sm">تصميم عربي</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src={familyTreeLogo} 
              alt="شجرتي" 
              className="h-16 w-16 rounded-full mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-primary">شجرتي</h1>
            <p className="text-muted-foreground">اكتشف جذورك</p>
          </div>

          <Card className="border-0 tree-shadow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">انضم إلى شجرتي</CardTitle>
              <CardDescription>
                ابدأ رحلتك في بناء شجرة عائلتك اليوم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="register" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
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
                      className="w-full hero-gradient border-0"
                      disabled={isLoading}
                    >
                      {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
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
                      className="w-full hero-gradient border-0"
                      disabled={isLoading}
                    >
                      {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                      <TreePine className="mr-2 h-4 w-4" />
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
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {isLoading ? "جاري التحميل..." : "تسجيل الدخول بـ Google"}
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground mt-4">
                بإنشاء حساب، أنت توافق على{" "}
                <a href="#" className="text-primary hover:underline">
                  شروط الاستخدام
                </a>
                {" "}و{" "}
                <a href="#" className="text-primary hover:underline">
                  سياسة الخصوصية
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;