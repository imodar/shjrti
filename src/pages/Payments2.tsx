import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Plus, Settings, Trash2, Star, Crown, Zap, Shield, Wallet, ArrowLeft, CheckCircle, Sparkles, Diamond, Gift } from "lucide-react";
import { Link } from "react-router-dom";

export default function Payments2() {
  const [paymentMethods, setPaymentMethods] = useState([{
    id: 1,
    type: "visa",
    last4: "4242",
    expiry: "12/26",
    isDefault: true
  }, {
    id: 2,
    type: "mastercard", 
    last4: "5555",
    expiry: "08/25",
    isDefault: false
  }, {
    id: 3,
    type: "paypal",
    email: "user@example.com",
    isDefault: false
  }]);
  
  const [currentPlan, setCurrentPlan] = useState("premium");

  const plans = [{
    id: "free",
    name: "مجانية",
    price: "0",
    period: "شهرياً",
    features: ["إنشاء شجرة عائلة واحدة", "حتى 50 فرد", "التصدير الأساسي", "دعم المجتمع"],
    icon: Shield,
    gradient: "from-gray-400 to-gray-600",
    bgGradient: "from-gray-50 to-gray-100",
    textColor: "text-gray-700"
  }, {
    id: "premium",
    name: "أساسية",
    price: "29",
    period: "شهرياً",
    features: ["أشجار عائلة غير محدودة", "أفراد غير محدودين", "التصدير المتقدم", "رفع الصور والمستندات", "الدعم المباشر"],
    icon: Sparkles,
    gradient: "from-emerald-400 to-teal-600",
    bgGradient: "from-emerald-50 to-teal-50",
    textColor: "text-emerald-700",
    popular: true
  }, {
    id: "enterprise",
    name: "احترافية",
    price: "99",
    period: "شهرياً",
    features: ["جميع مميزات الأساسية", "التعاون الجماعي", "النسخ الاحتياطي التلقائي", "API للمطورين", "الدعم ذو الأولوية", "تخصيص العلامة التجارية"],
    icon: Crown,
    gradient: "from-purple-400 to-pink-600",
    bgGradient: "from-purple-50 to-pink-50",
    textColor: "text-purple-700"
  }];

  const handleDeletePaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950" dir="rtl">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-r from-emerald-400/20 to-blue-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-75"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-pink-400/20 to-orange-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-150"></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-white/20 bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Diamond className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  إدارة الدفع والاشتراكات
                </h1>
                <p className="text-lg text-blue-600/80 dark:text-blue-400/80 font-medium">
                  اختر الخطة المثالية لحفظ تاريخ عائلتك
                </p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-gray-700 dark:text-gray-300">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Current Plan & Payment Methods */}
          <div className="xl:col-span-1 space-y-8">
            
            {/* Current Plan Card */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10"></div>
              <CardHeader className="relative">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-emerald-500" />
                  خطتك الحالية
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                      الخطة المجانية
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">0</span>
                      <span className="text-lg text-gray-600 dark:text-gray-400">ريال</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">شهرياً</p>
                  </div>
                  
                  <div className="space-y-3 p-4 bg-white/40 dark:bg-gray-700/40 rounded-2xl backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">الأشجار المستخدمة</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">2 من 1</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">الأفراد المضافين</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">20 من 50</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">الاستخدام</span>
                        <span className="text-emerald-600 font-medium">40%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full shadow-sm" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Card */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-500" />
                    طرق الدفع
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl" dir="rtl">
                      <DialogHeader>
                        <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          إضافة طريقة دفع جديدة
                        </DialogTitle>
                        <DialogDescription className="text-lg text-gray-600 dark:text-gray-400">
                          اختر طريقة الدفع المناسبة لك وأضف تفاصيلها بأمان تام
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="credit-card" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                          <TabsTrigger value="credit-card" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">
                            <CreditCard className="h-4 w-4" />
                            بطاقة ائتمانية
                          </TabsTrigger>
                          <TabsTrigger value="paypal" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">
                            <Wallet className="h-4 w-4" />
                            PayPal
                          </TabsTrigger>
                          <TabsTrigger value="bank" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">
                            <Shield className="h-4 w-4" />
                            تحويل بنكي
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="credit-card" className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="card-type" className="text-gray-700 dark:text-gray-300 font-medium">نوع البطاقة</Label>
                              <Select>
                                <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl">
                                  <SelectValue placeholder="اختر نوع البطاقة" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 z-50 rounded-xl shadow-2xl">
                                  <SelectItem value="visa">Visa</SelectItem>
                                  <SelectItem value="mastercard">Mastercard</SelectItem>
                                  <SelectItem value="amex">American Express</SelectItem>
                                  <SelectItem value="discover">Discover</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="card-number" className="text-gray-700 dark:text-gray-300 font-medium">رقم البطاقة</Label>
                              <Input 
                                id="card-number" 
                                placeholder="1234 5678 9012 3456" 
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl" 
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-gray-700 dark:text-gray-300 font-medium">الشهر</Label>
                              <Select>
                                <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl">
                                  <SelectValue placeholder="MM" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 z-50 rounded-xl shadow-2xl">
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                      {String(i + 1).padStart(2, '0')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-gray-700 dark:text-gray-300 font-medium">السنة</Label>
                              <Select>
                                <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl">
                                  <SelectValue placeholder="YYYY" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 z-50 rounded-xl shadow-2xl">
                                  {Array.from({ length: 10 }, (_, i) => (
                                    <SelectItem key={i} value={String(new Date().getFullYear() + i)}>
                                      {new Date().getFullYear() + i}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-gray-700 dark:text-gray-300 font-medium">CVC</Label>
                              <Input 
                                placeholder="123" 
                                maxLength={4} 
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl" 
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300 font-medium">اسم حامل البطاقة</Label>
                            <Input 
                              placeholder="الاسم كما يظهر على البطاقة" 
                              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl" 
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="make-default-card" />
                            <Label htmlFor="make-default-card" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              جعل هذه البطاقة الافتراضية
                            </Label>
                          </div>
                          
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl shadow-lg">
                            <CreditCard className="h-5 w-5 ml-2" />
                            إضافة البطاقة
                          </Button>
                        </TabsContent>

                        <TabsContent value="paypal" className="space-y-6">
                          <div className="text-center py-8">
                            <div className="relative mx-auto mb-6">
                              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                                <Wallet className="h-12 w-12 text-white" />
                              </div>
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">ربط حساب PayPal</h3>
                            <p className="text-gray-600 dark:text-gray-400">دفع آمن وسريع عبر PayPal</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300 font-medium">البريد الإلكتروني لـ PayPal</Label>
                            <Input 
                              type="email" 
                              placeholder="example@paypal.com" 
                              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl" 
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="make-default-paypal" />
                            <Label htmlFor="make-default-paypal" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              جعل PayPal طريقة الدفع الافتراضية
                            </Label>
                          </div>
                          
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl shadow-lg">
                            <Wallet className="h-5 w-5 ml-2" />
                            ربط حساب PayPal
                          </Button>
                        </TabsContent>

                        <TabsContent value="bank" className="space-y-6">
                          <div className="text-center py-8">
                            <div className="relative mx-auto mb-6">
                              <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                                <Shield className="h-12 w-12 text-white" />
                              </div>
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">معلومات التحويل البنكي</h3>
                            <p className="text-gray-600 dark:text-gray-400">تحويل مباشر آمن</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-gray-700 dark:text-gray-300 font-medium">اسم البنك</Label>
                              <Input 
                                placeholder="البنك الأهلي السعودي" 
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-gray-700 dark:text-gray-300 font-medium">اسم صاحب الحساب</Label>
                              <Input 
                                placeholder="أحمد محمد" 
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl" 
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300 font-medium">رقم الحساب / IBAN</Label>
                            <Input 
                              placeholder="SA03 8000 0000 6080 1016 7519" 
                              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-xl" 
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="make-default-bank" />
                            <Label htmlFor="make-default-bank" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              جعل هذا الحساب البنكي الافتراضي
                            </Label>
                          </div>
                          
                          <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl shadow-lg">
                            <Shield className="h-5 w-5 ml-2" />
                            إضافة الحساب البنكي
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="relative p-6">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative mb-8">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-800/30 rounded-full flex items-center justify-center mx-auto shadow-xl">
                        <CreditCard className="h-16 w-16 text-blue-500" />
                        <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                          <Plus className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                      لا توجد طرق دفع محفوظة
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
                      أضف طريقة دفع جديدة لإدارة اشتراكاتك بسهولة واستمتع بتجربة دفع سلسة وآمنة
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                          <Plus className="h-5 w-5 mr-2" />
                          إضافة طريقة دفع جديدة
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map(method => (
                      <div key={method.id} className="group relative p-6 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-xl bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-850/80 backdrop-blur-sm hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            {method.type === "paypal" ? (
                              <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white text-2xl flex items-center justify-center font-bold shadow-xl">
                                  P
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center shadow-xl">
                                  <CreditCard className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                            <div>
                              {method.type === "paypal" ? (
                                <>
                                  <p className="font-bold text-xl text-gray-900 dark:text-gray-100">PayPal</p>
                                  <p className="text-gray-600 dark:text-gray-400">{method.email}</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-bold text-xl text-gray-900 dark:text-gray-100">
                                    •••• •••• •••• {method.last4}
                                  </p>
                                  <p className="text-gray-600 dark:text-gray-400">انتهاء {method.expiry}</p>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {method.isDefault && (
                              <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg">
                                <Star className="h-4 w-4 mr-1 fill-current" />
                                افتراضي
                              </Badge>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeletePaymentMethod(method.id)} 
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl p-3"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Plans Section */}
          <div className="xl:col-span-3">
            <Card className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
              <CardHeader className="relative">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  اختر خطتك المثالية
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
                  خطط مصممة خصيصاً لحفظ وتنظيم تاريخ عائلتك الثمين
                </CardDescription>
              </CardHeader>
              <CardContent className="relative p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {plans.map(plan => (
                    <Card 
                      key={plan.id} 
                      className={`relative group transition-all duration-500 hover:scale-105 cursor-pointer overflow-hidden border-0 shadow-xl hover:shadow-2xl ${
                        currentPlan === plan.id 
                          ? 'ring-4 ring-emerald-400 shadow-2xl scale-105' 
                          : ''
                      } ${plan.popular ? 'lg:scale-110 lg:z-10' : ''}`}
                      style={{
                        background: plan.popular 
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br opacity-10" style={{
                        backgroundImage: `linear-gradient(135deg, ${plan.gradient.split(' ')[1]}, ${plan.gradient.split(' ')[3]})`
                      }}></div>
                      
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-full shadow-lg text-sm font-bold">
                            <Sparkles className="h-4 w-4 mr-1" />
                            الأكثر شعبية
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="relative text-center pb-4">
                        <div className={`w-20 h-20 bg-gradient-to-r ${plan.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                          <plan.icon className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className={`text-2xl font-bold ${plan.textColor} mb-4`}>
                          {plan.name}
                        </CardTitle>
                        <div className="mb-6">
                          <div className="flex items-baseline justify-center gap-1">
                            <span className={`text-5xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                              {plan.price}
                            </span>
                            <span className="text-lg text-gray-600 dark:text-gray-400">ريال</span>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400">{plan.period}</p>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="relative">
                        <ul className="space-y-4 mb-8">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                              <div className={`w-6 h-6 bg-gradient-to-r ${plan.gradient} rounded-full flex items-center justify-center flex-shrink-0`}>
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm font-medium">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <Button 
                          className={`w-full py-4 rounded-2xl shadow-lg transition-all duration-300 font-bold text-lg ${
                            currentPlan === plan.id 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : `bg-gradient-to-r ${plan.gradient} hover:shadow-xl hover:scale-105 text-white`
                          }`}
                          disabled={currentPlan === plan.id}
                        >
                          {currentPlan === plan.id ? (
                            <>
                              <CheckCircle className="h-5 w-5 mr-2" />
                              الخطة الحالية
                            </>
                          ) : (
                            <>
                              <Zap className="h-5 w-5 mr-2" />
                              اختيار الخطة
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card className="mt-8 relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10"></div>
              <CardHeader className="relative">
                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-green-500" />
                  سجل الفواتير
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  تاريخ جميع مدفوعاتك وفواتيرك
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-center py-16">
                  <div className="relative mb-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto shadow-xl">
                      <CreditCard className="h-16 w-16 text-green-500 opacity-50" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">لا توجد فواتير بعد</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                    ستظهر جميع فواتيرك وتاريخ الدفع هنا بعد الترقية لخطة مدفوعة. ستحصل على فواتير مفصلة وسجل كامل لجميع المدفوعات.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}