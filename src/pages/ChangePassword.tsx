import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, Check, X, Shield } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950" dir="rtl">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  تغيير كلمة المرور
                </h1>
                <p className="text-emerald-600 dark:text-emerald-400">
                  حافظ على أمان حسابك بكلمة مرور قوية
                </p>
              </div>
            </div>
            <Link to="/profile">
              <Button variant="outline">
                العودة للملف الشخصي
              </Button>
            </Link>
          </div>
        </div>
      </div>

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
    </div>
  );
}