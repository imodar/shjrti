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
import { CreditCard, Plus, Settings, Trash2, Star, Crown, Zap, Shield, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
export default function Payments() {
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
    name: "أساسية",
    price: "0",
    period: "شهرياً",
    features: ["إنشاء شجرة عائلة واحدة", "حتى 50 فرد", "التصدير الأساسي", "دعم المجتمع"],
    icon: Shield,
    color: "bg-gray-500"
  }, {
    id: "premium",
    name: "بريميوم",
    price: "29",
    period: "شهرياً",
    features: ["أشجار عائلة غير محدودة", "أفراد غير محدودين", "التصدير المتقدم", "رفع الصور والمستندات", "الدعم المباشر"],
    icon: Star,
    color: "bg-emerald-500",
    popular: true
  }, {
    id: "enterprise",
    name: "المؤسسات",
    price: "99",
    period: "شهرياً",
    features: ["جميع مميزات البريميوم", "التعاون الجماعي", "النسخ الاحتياطي التلقائي", "API للمطورين", "الدعم ذو الأولوية", "تخصيص العلامة التجارية"],
    icon: Crown,
    color: "bg-purple-500"
  }];
  const handleDeletePaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };
  return <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950" dir="rtl">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  طرق الدفع والاشتراكات
                </h1>
                <p className="text-emerald-600 dark:text-emerald-400">
                  إدارة اشتراكك وطرق الدفع
                </p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button variant="outline">
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">خطتك الحالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                    الخطة المجانية
                  </h3>
                  <p className="text-3xl font-bold text-emerald-600">0 ريال</p>
                  <p className="text-muted-foreground">شهرياً</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الأشجار المستخدمة</span>
                    <span>2 من 1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الأفراد المضافين</span>
                    <span>20 من 50</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{
                    width: '40%'
                  }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-emerald-800 dark:text-emerald-200">طرق الدفع</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] z-50 bg-white dark:bg-gray-900" dir="rtl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">إضافة طريقة دفع جديدة</DialogTitle>
                        <DialogDescription className="text-lg">
                          اختر طريقة الدفع المناسبة لك وأضف تفاصيلها
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="credit-card" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                          <TabsTrigger value="credit-card" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            بطاقة ائتمانية
                          </TabsTrigger>
                          <TabsTrigger value="paypal" className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            PayPal
                          </TabsTrigger>
                          <TabsTrigger value="bank" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            تحويل بنكي
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="credit-card" className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="card-type">نوع البطاقة</Label>
                              <Select>
                                <SelectTrigger className="bg-white dark:bg-gray-800">
                                  <SelectValue placeholder="اختر نوع البطاقة" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 z-50">
                                  <SelectItem value="visa">Visa</SelectItem>
                                  <SelectItem value="mastercard">Mastercard</SelectItem>
                                  <SelectItem value="amex">American Express</SelectItem>
                                  <SelectItem value="discover">Discover</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="card-number">رقم البطاقة</Label>
                              <Input id="card-number" placeholder="1234 5678 9012 3456" className="bg-white dark:bg-gray-800" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="expiry-month">الشهر</Label>
                              <Select>
                                <SelectTrigger className="bg-white dark:bg-gray-800">
                                  <SelectValue placeholder="MM" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 z-50">
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                      {String(i + 1).padStart(2, '0')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="expiry-year">السنة</Label>
                              <Select>
                                <SelectTrigger className="bg-white dark:bg-gray-800">
                                  <SelectValue placeholder="YYYY" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 z-50">
                                  {Array.from({ length: 10 }, (_, i) => (
                                    <SelectItem key={i} value={String(new Date().getFullYear() + i)}>
                                      {new Date().getFullYear() + i}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="cvc">CVC</Label>
                              <Input id="cvc" placeholder="123" maxLength={4} className="bg-white dark:bg-gray-800" />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="cardholder-name">اسم حامل البطاقة</Label>
                            <Input id="cardholder-name" placeholder="الاسم كما يظهر على البطاقة" className="bg-white dark:bg-gray-800" />
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="make-default-card" />
                            <Label htmlFor="make-default-card" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              جعل هذه البطاقة الافتراضية
                            </Label>
                          </div>
                          
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CreditCard className="h-4 w-4 ml-2" />
                            إضافة البطاقة
                          </Button>
                        </TabsContent>

                        <TabsContent value="paypal" className="space-y-6">
                          <div className="text-center py-8">
                            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Wallet className="h-10 w-10 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-4">ربط حساب PayPal</h3>
                          </div>
                          
                          <div>
                            <Label htmlFor="paypal-email">البريد الإلكتروني لـ PayPal</Label>
                            <Input id="paypal-email" type="email" placeholder="example@paypal.com" className="bg-white dark:bg-gray-800" />
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="make-default-paypal" />
                            <Label htmlFor="make-default-paypal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              جعل PayPal طريقة الدفع الافتراضية
                            </Label>
                          </div>
                          
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <Wallet className="h-4 w-4 ml-2" />
                            ربط حساب PayPal
                          </Button>
                        </TabsContent>

                        <TabsContent value="bank" className="space-y-6">
                          <div className="text-center py-8">
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Shield className="h-10 w-10 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-4">معلومات التحويل البنكي</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="bank-name">اسم البنك</Label>
                              <Input id="bank-name" placeholder="البنك الأهلي السعودي" className="bg-white dark:bg-gray-800" />
                            </div>
                            <div>
                              <Label htmlFor="account-holder">اسم صاحب الحساب</Label>
                              <Input id="account-holder" placeholder="أحمد محمد" className="bg-white dark:bg-gray-800" />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="account-number">رقم الحساب / IBAN</Label>
                            <Input id="account-number" placeholder="SA03 8000 0000 6080 1016 7519" className="bg-white dark:bg-gray-800" />
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox id="make-default-bank" />
                            <Label htmlFor="make-default-bank" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              جعل هذا الحساب البنكي الافتراضي
                            </Label>
                          </div>
                          
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Shield className="h-4 w-4 ml-2" />
                            إضافة الحساب البنكي
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CreditCard className="h-12 w-12 text-emerald-600" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-3">
                      لا توجد طرق دفع محفوظة
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
                      أضف طريقة دفع جديدة لإدارة اشتراكاتك بسهولة واستمتع بتجربة دفع سلسة وآمنة
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                          <Plus className="h-5 w-5 mr-2" />
                          إضافة طريقة دفع جديدة
                        </Button>
                      </DialogTrigger>
                      <DialogContent dir="rtl">
                        <DialogHeader>
                          <DialogTitle>إضافة طريقة دفع جديدة</DialogTitle>
                          <DialogDescription>
                            أضف بطاقة ائتمانية أو طريقة دفع جديدة
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="card-number">رقم البطاقة</Label>
                            <Input id="card-number" placeholder="1234 5678 9012 3456" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry">تاريخ الانتهاء</Label>
                              <Input id="expiry" placeholder="MM/YY" />
                            </div>
                            <div>
                              <Label htmlFor="cvc">CVC</Label>
                              <Input id="cvc" placeholder="123" />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="name">اسم حامل البطاقة</Label>
                            <Input id="name" placeholder="الاسم كما يظهر على البطاقة" />
                          </div>
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                            إضافة البطاقة
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {paymentMethods.map(method => (
                      <div key={method.id} className="group relative p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-850">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {method.type === "paypal" ? (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white text-lg flex items-center justify-center font-bold shadow-lg">
                                P
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-700 rounded-xl flex items-center justify-center shadow-lg">
                                <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                              </div>
                            )}
                            <div>
                              {method.type === "paypal" ? (
                                <>
                                  <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">PayPal</p>
                                  <p className="text-sm text-muted-foreground">{method.email}</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                    •••• •••• •••• {method.last4}
                                  </p>
                                  <p className="text-sm text-muted-foreground">انتهاء {method.expiry}</p>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {method.isDefault && (
                              <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                افتراضي
                              </Badge>
                            )}
                            
                            {!(currentPlan !== "free" && paymentMethods.length === 1) && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeletePaymentMethod(method.id)} 
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Available Plans */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">اختر خطتك</CardTitle>
                <CardDescription>
                  اختر الخطة التي تناسب احتياجاتك لحفظ تاريخ عائلتك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map(plan => <Card key={plan.id} className={`relative transition-all hover:shadow-lg ${currentPlan === plan.id ? 'ring-2 ring-emerald-500' : ''} ${plan.popular ? 'border-emerald-300' : ''}`}>
                      {plan.popular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-emerald-600 text-white">الأكثر شعبية</Badge>
                        </div>}
                      <CardHeader className="text-center">
                        <div className={`w-12 h-12 ${plan.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                          <plan.icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <div className="mt-4">
                          <span className="text-3xl font-bold">{plan.price}</span>
                          <span className="text-muted-foreground"> ريال/{plan.period}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, index) => <li key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                              {feature}
                            </li>)}
                        </ul>
                        <Button className={`w-full ${currentPlan === plan.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`} disabled={currentPlan === plan.id}>
                          {currentPlan === plan.id ? 'الخطة الحالية' : 'اختيار الخطة'}
                        </Button>
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">سجل الفواتير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد فواتير بعد</p>
                  <p className="text-sm">ستظهر فواتيرك هنا بعد الترقية لخطة مدفوعة</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>;
}