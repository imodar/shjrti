import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, Check, X, Shield, Bell, Settings, LogOut, Crown, User, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Footer from "@/components/Footer";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordRequirements = [
    { text: "8 أحرف على الأقل", met: formData.newPassword.length >= 8 },
    { text: "يحتوي على حرف كبير", met: /[A-Z]/.test(formData.newPassword) },
    { text: "يحتوي على حرف صغير", met: /[a-z]/.test(formData.newPassword) },
    { text: "يحتوي على رقم", met: /\d/.test(formData.newPassword) },
    { text: "يحتوي على رمز خاص", met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword) }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    // Validation
    const newErrors: {[key: string]: string} = {};
    if (!formData.currentPassword) {
      newErrors.currentPassword = "كلمة المرور الحالية مطلوبة";
    }
    if (!formData.newPassword) {
      newErrors.newPassword = "كلمة المرور الجديدة مطلوبة";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "كلمات المرور غير متطابقة";
    }
    if (!passwordRequirements.every(req => req.met)) {
      newErrors.newPassword = "كلمة المرور لا تلبي جميع المتطلبات";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }, 2000);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border-b border-gradient-to-r from-emerald-200/30 to-cyan-200/30 sticky top-0 z-50">
          {/* Floating geometric shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-2 right-10 w-6 h-6 bg-emerald-400/20 rounded-full animate-pulse"></div>
            <div className="absolute top-6 right-32 w-4 h-4 bg-teal-400/30 rotate-45 animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-4 right-64 w-3 h-3 bg-cyan-400/25 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>

          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* Left side - Logo and Title */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    تغيير كلمة المرور
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-muted-foreground font-medium">حافظ على أمان حسابك بكلمة مرور قوية</p>
                  </div>
                </div>
              </div>
              
              {/* Right side - Actions and Profile */}
              <div className="flex items-center gap-6">
                {/* Navigation Pills */}
                <div className="hidden md:flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-full p-1 border border-emerald-200/50 dark:border-emerald-700/50">
                  <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-emerald-500/20" asChild>
                    <Link to="/dashboard">الرئيسية</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-emerald-500/20" asChild>
                    <Link to="/profile">الملف الشخصي</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full px-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30">
                    كلمة المرور
                  </Button>
                </div>

                {/* Notification Bell */}
                <div className="relative">
                  <Button variant="ghost" size="icon" className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-emerald-200/30">
                    <Bell className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs flex items-center justify-center text-white font-bold shadow-lg animate-bounce">
                      3
                    </span>
                  </Button>
                </div>
                
                {/* User Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-auto p-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-emerald-200/30">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-transparent">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold">
                              أح
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="hidden lg:block text-right">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">أحمد محمد</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">الباقة المميزة</p>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 ring-2 ring-emerald-500/50">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                            أح
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-base font-semibold leading-none text-emerald-800 dark:text-emerald-200">أحمد محمد</p>
                          <p className="text-sm leading-none text-emerald-600 dark:text-emerald-400">
                            ahmed@example.com
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <Crown className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">عضو مميز</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-emerald-200/50 dark:bg-emerald-700/50" />
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50" asChild>
                      <Link to="/profile">
                        <User className="mr-3 h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-800 dark:text-emerald-200">الملف الشخصي</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                      <Settings className="mr-3 h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-800 dark:text-emerald-200">الإعدادات</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50" asChild>
                      <Link to="/payments">
                        <Crown className="mr-3 h-4 w-4 text-yellow-500" />
                        <span className="text-emerald-800 dark:text-emerald-200">إدارة الاشتراك</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-emerald-200/50 dark:bg-emerald-700/50" />
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/50">
                      <LogOut className="mr-3 h-4 w-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">تسجيل الخروج</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Bottom gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {success && (
            <Alert className="mb-6 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
              <Check className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                تم تغيير كلمة المرور بنجاح! يمكنك الآن استخدام كلمة المرور الجديدة لتسجيل الدخول.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Security Tips */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    نصائح الأمان
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                      كلمة مرور قوية
                    </h4>
                    <p className="text-emerald-600 dark:text-emerald-400">
                      استخدم مزيجاً من الأحرف والأرقام والرموز الخاصة
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      تجنب المعلومات الشخصية
                    </h4>
                    <p className="text-blue-600 dark:text-blue-400">
                      لا تستخدم اسمك أو تاريخ ميلادك في كلمة المرور
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                      غير كلمة المرور بانتظام
                    </h4>
                    <p className="text-purple-600 dark:text-purple-400">
                      قم بتغيير كلمة المرور كل 3-6 أشهر للحفاظ على الأمان
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Change Password Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-emerald-800 dark:text-emerald-200">تغيير كلمة المرور</CardTitle>
                  <CardDescription>
                    أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة قوية
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.currentPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.newPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                      )}
                    </div>

                    {/* Password Requirements */}
                    {formData.newPassword && (
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                        <h4 className="font-medium mb-3">متطلبات كلمة المرور:</h4>
                        <div className="space-y-2">
                          {passwordRequirements.map((requirement, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {requirement.met ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                              <span className={requirement.met ? "text-emerald-600" : "text-muted-foreground"}>
                                {requirement.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confirm Password */}
                    <div>
                      <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "جاري تغيير كلمة المرور..." : "تغيير كلمة المرور"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      </div>
    </div>
  );
}