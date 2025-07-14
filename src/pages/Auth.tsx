import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TreePine, Mail, Lock, User, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import familyTreeLogo from "@/assets/family-tree-logo.png";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/dashboard";
    }, 2000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate registration
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/dashboard";
    }, 2000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-8">
        <div className="text-center text-white space-y-6 max-w-lg">
          <img 
            src={familyTreeLogo} 
            alt="شجرتي" 
            className="h-20 w-20 rounded-full mx-auto border-4 border-white/20"
          />
          <h1 className="text-4xl font-bold">مرحباً بك في شجرتي</h1>
          <p className="text-xl opacity-90 leading-relaxed">
            ابدأ رحلتك في اكتشاف جذورك وبناء تاريخ عائلتك 
            مع أسهل منصة عربية لإنشاء أشجار العائلة
          </p>
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">+1000</div>
              <div className="text-sm opacity-80">عائلة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">+50k</div>
              <div className="text-sm opacity-80">فرد</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm opacity-80">آمن</div>
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