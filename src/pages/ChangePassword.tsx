
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, Check, X, Shield, KeyRound, Fingerprint, AlertTriangle } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ChangePassword() {
  const { toast } = useToast();
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
    setSuccess(false);
    
    console.log('Starting password change process...');
    
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

    try {
      console.log('Attempting to update password...');
      
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        
        // Handle specific error cases
        if (error.message.includes('New password should be different')) {
          setErrors({ newPassword: "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية" });
        } else if (error.message.includes('Password should be at least')) {
          setErrors({ newPassword: "كلمة المرور قصيرة جداً" });
        } else {
          setErrors({ general: "حدث خطأ أثناء تغيير كلمة المرور. يرجى المحاولة مرة أخرى." });
        }
        
        toast({
          title: "خطأ",
          description: "فشل في تغيير كلمة المرور",
          variant: "destructive",
        });
      } else {
        console.log('Password updated successfully');
        setSuccess(true);
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        
        toast({
          title: "نجح",
          description: "تم تغيير كلمة المرور بنجاح",
        });
      }
    } catch (error) {
      console.error('Unexpected error during password update:', error);
      setErrors({ general: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى." });
      
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      {/* Floating Animated Icons */}
      <div className="absolute top-32 right-20 animate-float">
        <Shield className="h-10 w-10 text-emerald-400 opacity-60" />
      </div>
      <div className="absolute bottom-40 left-20 animate-float-delayed">
        <KeyRound className="h-12 w-12 text-amber-400 opacity-40" />
      </div>
      <div className="absolute top-1/2 left-10 animate-float-slow">
        <Lock className="h-8 w-8 text-teal-400 opacity-60" />
      </div>

      <div className="relative z-10">
        <GlobalHeader />

        <div className="container mx-auto px-6 pt-24 pb-12 relative z-10">
          <div className="max-w-5xl mx-auto">
            
            {/* Page Header Section */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-emerald-500/20 to-teal-500/10 rounded-2xl blur-2xl"></div>
              
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-6 px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Security Icon */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white/30 dark:border-gray-700/30">
                        <Lock className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-3 border-white dark:border-gray-800 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    {/* Page Title */}
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          تغيير كلمة المرور
                        </span>
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        حافظ على أمان حسابك بكلمة مرور قوية ومعقدة
                      </p>
                    </div>
                  </div>
                  
                  {/* Security Badge */}
                  <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full shadow-lg">
                    <Fingerprint className="h-4 w-4" />
                    <span className="text-sm font-bold">الحماية المتقدمة</span>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-2 right-2 w-6 h-6 border-r border-t border-emerald-300/40 dark:border-emerald-700/40"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-l border-b border-amber-300/40 dark:border-amber-700/40"></div>
              </div>
            </div>

            {/* Alerts Section */}
            {success && (
              <Alert className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-700/50 shadow-lg">
                <Check className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="text-emerald-700 dark:text-emerald-300 font-medium">
                  تم تغيير كلمة المرور بنجاح! يمكنك الآن استخدام كلمة المرور الجديدة لتسجيل الدخول.
                </AlertDescription>
              </Alert>
            )}

            {errors.general && (
              <Alert className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border border-red-200/50 dark:border-red-700/50 shadow-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300 font-medium">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Security Tips Section */}
              <div className="space-y-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        نصائح الأمان
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                            كلمة مرور قوية
                          </h4>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            استخدم مزيجاً من الأحرف الكبيرة والصغيرة والأرقام والرموز الخاصة
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                          <X className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                            تجنب المعلومات الشخصية
                          </h4>
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            لا تستخدم اسمك أو تاريخ ميلادك أو أرقام هاتفك في كلمة المرور
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-teal-50 dark:bg-teal-950/30 p-4 rounded-lg border border-teal-200/50 dark:border-teal-700/50">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mt-0.5">
                          <KeyRound className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-teal-800 dark:text-teal-200 mb-2">
                            غير كلمة المرور بانتظام
                          </h4>
                          <p className="text-sm text-teal-600 dark:text-teal-400">
                            قم بتغيير كلمة المرور كل 3-6 أشهر للحفاظ على أقصى مستوى من الأمان
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Change Password Form */}
              <div className="lg:col-span-2">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl bg-gradient-to-r from-amber-600 to-emerald-600 bg-clip-text text-transparent">
                          تغيير كلمة المرور
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                          أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة قوية
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Current Password */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium">كلمة المرور الحالية</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? "text" : "password"}
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                            className="bg-white/50 dark:bg-gray-900/50 border-amber-200/50 dark:border-amber-700/50 focus:border-amber-500 dark:focus:border-amber-400 pr-12"
                            placeholder="أدخل كلمة المرور الحالية"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                            onClick={() => togglePasswordVisibility('current')}
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4 text-amber-600" /> : <Eye className="h-4 w-4 text-amber-600" />}
                          </Button>
                        </div>
                        {errors.currentPassword && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.currentPassword}
                          </p>
                        )}
                      </div>

                      {/* New Password */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium">كلمة المرور الجديدة</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                            className="bg-white/50 dark:bg-gray-900/50 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 dark:focus:border-emerald-400 pr-12"
                            placeholder="أدخل كلمة المرور الجديدة"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                            onClick={() => togglePasswordVisibility('new')}
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4 text-emerald-600" /> : <Eye className="h-4 w-4 text-emerald-600" />}
                          </Button>
                        </div>
                        {errors.newPassword && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.newPassword}
                          </p>
                        )}
                      </div>

                      {/* Password Requirements */}
                      {formData.newPassword && (
                        <div className="bg-gradient-to-r from-gray-50 to-emerald-50 dark:from-gray-900/50 dark:to-emerald-900/30 p-4 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
                          <h4 className="font-medium mb-3 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            متطلبات كلمة المرور:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {passwordRequirements.map((requirement, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                {requirement.met ? (
                                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                    <X className="h-3 w-3 text-gray-500" />
                                  </div>
                                )}
                                <span className={requirement.met ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-500 dark:text-gray-400"}>
                                  {requirement.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium">تأكيد كلمة المرور الجديدة</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            className="bg-white/50 dark:bg-gray-900/50 border-teal-200/50 dark:border-teal-700/50 focus:border-teal-500 dark:focus:border-teal-400 pr-12"
                            placeholder="أعد إدخال كلمة المرور الجديدة"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-teal-100 dark:hover:bg-teal-900/50"
                            onClick={() => togglePasswordVisibility('confirm')}
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4 text-teal-600" /> : <Eye className="h-4 w-4 text-teal-600" />}
                          </Button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-emerald-200/50 dark:border-emerald-700/50">
                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 hover:from-amber-700 hover:via-emerald-700 hover:to-teal-700 text-white border-0 font-semibold text-base gap-2 shadow-lg"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              جاري تغيير كلمة المرور...
                            </>
                          ) : (
                            <>
                              <Lock className="h-5 w-5" />
                              تغيير كلمة المرور
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
