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
import { CreditCard, Plus, Settings, Trash2, Star, Crown, Zap, Shield, Wallet, Bell, LogOut, User, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
export default function Payments() {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState([
    // Comment out all payment methods to test the case where user has no payment methods
    // {
    //   id: 1,
    //   type: "visa",
    //   last4: "4242",
    //   expiry: "12/26",
    //   isDefault: true
    // }, {
    //   id: 2,
    //   type: "mastercard",
    //   last4: "5555",
    //   expiry: "08/25",
    //   isDefault: false
    // }, {
    //   id: 3,
    //   type: "paypal",
    //   email: "user@example.com",
    //   isDefault: false
    // }
  ]);
  const [currentPlan, setCurrentPlan] = useState("premium");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const plans = [{
    id: "free",
    name: "مجانية",
    price: "0",
    period: "شهرياً",
    features: ["إنشاء شجرة عائلة واحدة", "حتى 50 فرد", "التصدير الأساسي", "دعم المجتمع"],
    icon: Shield,
    color: "bg-gray-500"
  }, {
    id: "premium",
    name: "أساسية",
    price: "29",
    period: "شهرياً",
    features: ["أشجار عائلة غير محدودة", "أفراد غير محدودين", "التصدير المتقدم", "رفع الصور والمستندات", "الدعم المباشر"],
    icon: Star,
    color: "bg-emerald-500",
    popular: true
  }, {
    id: "enterprise",
    name: "احترافية",
    price: "99",
    period: "شهرياً",
    features: ["جميع مميزات البريميوم", "التعاون الجماعي", "النسخ الاحتياطي التلقائي", "API للمطورين", "الدعم ذو الأولوية", "تخصيص العلامة التجارية"],
    icon: Crown,
    color: "bg-purple-500"
  }];
  const handleDeletePaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };

  const getPlanIndex = (planId: string) => {
    return plans.findIndex(p => p.id === planId);
  };

  const handlePlanSelect = (planId: string) => {
    if (planId === currentPlan) return;
    setSelectedPlan(planId);
    setShowPlanModal(true);
  };

  const confirmPlanChange = () => {
    if (!selectedPlan) return;
    
    // If it's a downgrade, just change the plan
    if (isDowngrade) {
      setCurrentPlan(selectedPlan);
      setShowPlanModal(false);
      setSelectedPlan(null);
      return;
    }
    
    // For upgrades, check if user has payment methods
    if (paymentMethods.length > 0) {
      // Show payment method selection modal
      setShowPlanModal(false);
      setShowPaymentModal(true);
    } else {
      // No payment methods, show add payment method modal
      setShowPlanModal(false);
      setShowAddPaymentModal(true);
    }
  };

  const processPayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      setCurrentPlan(selectedPlan!);
      setShowPlanModal(false);
      setShowPaymentModal(false);
      setSelectedPlan(null);
      setSelectedPaymentMethod(null);
      
      // Show success toast
      toast({
        title: "🎉 مبروك! تمت عملية الترقية",
        description: `تم ترقية اشتراكك إلى ${selectedPlanData?.name} بنجاح. استمتع بالميزات الجديدة!`,
        duration: 5000,
      });
    }, 1500);
  };

  const handlePaymentMethodSelect = (methodId: number) => {
    setSelectedPaymentMethod(methodId);
    processPayment();
  };

  const handleAddPaymentAndPay = () => {
    // Add a new payment method (simulated)
    const newPaymentMethod = {
      id: paymentMethods.length + 1,
      type: "visa",
      last4: "1234",
      expiry: "12/28",
      isDefault: false
    };
    setPaymentMethods([...paymentMethods, newPaymentMethod]);
    
    // Process payment with the new method
    setSelectedPaymentMethod(newPaymentMethod.id);
    processPayment();
    setShowAddPaymentModal(false);
  };

  const handlePaymentMethodChoice = (type: 'credit-card' | 'paypal') => {
    if (type === 'credit-card') {
      setShowAddPaymentModal(false);
      setShowCreditCardForm(true);
    } else {
      // PayPal - add directly and process payment
      const newPaymentMethod = {
        id: paymentMethods.length + 1,
        type: "paypal",
        email: "user@paypal.com",
        isDefault: false
      };
      setPaymentMethods([...paymentMethods, newPaymentMethod]);
      setSelectedPaymentMethod(newPaymentMethod.id);
      processPayment();
      setShowAddPaymentModal(false);
    }
  };

  const handleCreditCardSubmit = () => {
    // Add credit card (simulated)
    const newPaymentMethod = {
      id: paymentMethods.length + 1,
      type: "visa",
      last4: "1234",
      expiry: "12/28",
      isDefault: false
    };
    setPaymentMethods([...paymentMethods, newPaymentMethod]);
    setSelectedPaymentMethod(newPaymentMethod.id);
    processPayment();
    setShowCreditCardForm(false);
  };

  const isDowngrade = selectedPlan ? getPlanIndex(selectedPlan) < getPlanIndex(currentPlan) : false;
  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const currentPlanData = plans.find(p => p.id === currentPlan);
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
                    <CreditCard className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    طرق الدفع والاشتراكات
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-muted-foreground font-medium">إدارة اشتراكك وطرق الدفع</p>
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
                  <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-emerald-500/20">
                    الأشجار
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full px-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30">
                    المدفوعات
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
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                      <Crown className="mr-3 h-4 w-4 text-yellow-500" />
                      <span className="text-emerald-800 dark:text-emerald-200">إدارة الاشتراك</span>
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
                        <DialogTitle className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 text-right">إضافة طريقة دفع جديدة</DialogTitle>
                        <DialogDescription className="text-lg text-right">
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

                        <TabsContent value="credit-card" className="space-y-8 p-6 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900/50 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
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
                                  {Array.from({
                                  length: 12
                                }, (_, i) => <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                      {String(i + 1).padStart(2, '0')}
                                    </SelectItem>)}
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
                                  {Array.from({
                                  length: 10
                                }, (_, i) => <SelectItem key={i} value={String(new Date().getFullYear() + i)}>
                                      {new Date().getFullYear() + i}
                                    </SelectItem>)}
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
                {paymentMethods.length === 0 ? <div className="text-center py-12">
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
                  </div> : <div className="grid gap-4">
                    {paymentMethods.map(method => <div key={method.id} className="group relative p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-850">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {method.type === "paypal" ? <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white text-lg flex items-center justify-center font-bold shadow-lg">
                                P
                              </div> : <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-700 rounded-xl flex items-center justify-center shadow-lg">
                                <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                              </div>}
                            <div>
                              {method.type === "paypal" ? <>
                                  <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">PayPal</p>
                                  <p className="text-sm text-muted-foreground">{method.email}</p>
                                </> : <>
                                  <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                    •••• •••• •••• {method.last4}
                                  </p>
                                  <p className="text-sm text-muted-foreground">انتهاء {method.expiry}</p>
                                </>}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {method.isDefault && <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                افتراضي
                              </Badge>}
                            
                            {!(currentPlan !== "free" && paymentMethods.length === 1) && <Button size="sm" variant="ghost" onClick={() => handleDeletePaymentMethod(method.id)} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg">
                                <Trash2 className="h-4 w-4" />
                              </Button>}
                          </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
                      </div>)}
                  </div>}
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
              <CardContent className="relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-tr from-teal-400/30 to-cyan-400/30 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  {plans.map((plan, index) => 
                    <Card 
                      key={plan.id} 
                      className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 flex flex-col h-full transform hover:-translate-y-2 ${
                        currentPlan === plan.id 
                          ? 'ring-4 ring-emerald-500/50 shadow-2xl bg-gradient-to-br from-emerald-50/90 to-white dark:from-emerald-950/50 dark:to-gray-900' 
                          : 'bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-900/90 dark:to-gray-800/90 hover:bg-gradient-to-br hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-950/30 dark:hover:to-teal-950/30'
                      } ${
                        plan.popular 
                          ? 'border-2 border-emerald-400 shadow-lg shadow-emerald-500/25' 
                          : 'border border-gray-200 dark:border-gray-700'
                      }`}
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      {/* Floating decorative elements */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce"></div>
                        <div className="absolute top-8 right-8 w-1 h-4 bg-teal-400/30 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                        <div className="absolute bottom-8 left-4 w-3 h-3 bg-cyan-400/40 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
                      </div>

                      {/* Popular badge with enhanced styling */}
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full blur-sm animate-pulse"></div>
                            <Badge className="relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-1 text-sm font-bold shadow-lg animate-bounce">
                              <Star className="h-3 w-3 mr-1 animate-spin" style={{animationDuration: '3s'}} />
                              الأكثر شعبية
                            </Badge>
                          </div>
                        </div>
                      )}
                      
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      
                      <CardHeader className="text-center flex-shrink-0 relative z-10 pb-6">
                        {/* Enhanced icon with multiple layers */}
                        <div className="relative mx-auto mb-4">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>
                          <div className={`relative w-16 h-16 ${plan.color} rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-500`}>
                            <div className="absolute inset-2 bg-white/20 rounded-xl"></div>
                            <plan.icon className="relative h-8 w-8 text-white z-10" />
                          </div>
                        </div>
                        
                        {/* Enhanced title */}
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent group-hover:from-emerald-700 group-hover:to-teal-600 transition-all duration-500">
                          {plan.name}
                        </CardTitle>
                        
                        {/* Enhanced pricing */}
                        <div className="mt-6 relative">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                              {plan.price}
                            </span>
                            <div className="text-right">
                              <span className="text-sm text-muted-foreground block">ريال</span>
                              <span className="text-xs text-muted-foreground">{plan.period}</span>
                            </div>
                          </div>
                          {plan.id === 'premium' && (
                            <div className="absolute -top-2 -right-2">
                              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex flex-col flex-grow relative z-10 px-6">
                        {/* Enhanced features list */}
                        <ul className="space-y-3 mb-8 flex-grow">
                          {plan.features.map((feature, featureIndex) => (
                            <li 
                              key={featureIndex} 
                              className="flex items-start gap-3 text-sm group-hover:translate-x-1 transition-transform duration-300"
                              style={{transitionDelay: `${featureIndex * 0.05}s`}}
                            >
                              <div className="flex-shrink-0 mt-1">
                                <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-sm">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {/* Enhanced button */}
                        <Button 
                          onClick={() => handlePlanSelect(plan.id)}
                          className={`w-full mt-auto h-12 text-lg font-semibold transition-all duration-500 transform group-hover:scale-105 ${
                            currentPlan === plan.id 
                              ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed text-white shadow-lg' 
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl'
                          }`} 
                          disabled={currentPlan === plan.id}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {currentPlan === plan.id ? (
                              <>
                                <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                                <span>الخطة الحالية</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-5 w-5 animate-pulse" />
                                <span>اختيار الخطة</span>
                              </>
                            )}
                          </div>
                        </Button>
                      </CardContent>
                      
                      {/* Bottom glow effect */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </Card>
                  )}
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

        {/* Add Payment Method Modal for Upgrade */}
        <Dialog open={showAddPaymentModal} onOpenChange={setShowAddPaymentModal}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl border-2 border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl" dir="rtl">
            <DialogHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                إضافة طريقة دفع للترقية
              </DialogTitle>
              
              <DialogDescription className="text-center text-lg">
                تحتاج إلى إضافة طريقة دفع لترقية اشتراكك إلى خطة {selectedPlanData?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-6">
              <div 
                onClick={() => handlePaymentMethodChoice('credit-card')}
                className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">بطاقة ائتمانية جديدة</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">أدخل تفاصيل بطاقتك الائتمانية</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => handlePaymentMethodChoice('paypal')}
                className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-200">PayPal</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">ادفع بأمان باستخدام PayPal</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddPaymentModal(false)}
                className="flex-1 h-12"
              >
                إلغاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Credit Card Form Modal */}
        <Dialog open={showCreditCardForm} onOpenChange={setShowCreditCardForm}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl border-2 border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl" dir="rtl">
            <DialogHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                إضافة بطاقة ائتمانية
              </DialogTitle>
              
              <DialogDescription className="text-center text-lg">
                أدخل تفاصيل بطاقتك الائتمانية لإتمام الترقية إلى خطة {selectedPlanData?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card-number">رقم البطاقة</Label>
                  <Input 
                    id="card-number" 
                    placeholder="1234 5678 9012 3456" 
                    className="bg-white dark:bg-gray-800 text-right" 
                  />
                </div>
                <div>
                  <Label htmlFor="card-name">اسم حامل البطاقة</Label>
                  <Input 
                    id="card-name" 
                    placeholder="أحمد محمد" 
                    className="bg-white dark:bg-gray-800 text-right" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">تاريخ الانتهاء</Label>
                  <Input 
                    id="expiry" 
                    placeholder="MM/YY" 
                    className="bg-white dark:bg-gray-800 text-center" 
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input 
                    id="cvv" 
                    placeholder="123" 
                    className="bg-white dark:bg-gray-800 text-center" 
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>خطة {selectedPlanData?.name}</span>
                  <span className="font-bold">{selectedPlanData?.price} ريال/شهرياً</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreditCardForm(false)}
                className="flex-1 h-12"
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleCreditCardSubmit}
                className="flex-1 h-12 font-bold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                إضافة والدفع
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Method Selection Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl border-2 border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl" dir="rtl">
            <DialogHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                اختر طريقة الدفع
              </DialogTitle>
              
              <DialogDescription className="text-center text-lg">
                اختر طريقة الدفع لترقية اشتراكك إلى خطة {selectedPlanData?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-6">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 hover:border-emerald-300 hover:shadow-lg ${
                    selectedPaymentMethod === method.id 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
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
                    <div className="flex-1">
                      {method.type === "paypal" ? (
                        <>
                          <p className="font-semibold text-lg">PayPal</p>
                          <p className="text-sm text-muted-foreground">{method.email}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-lg">•••• •••• •••• {method.last4}</p>
                          <p className="text-sm text-muted-foreground">انتهاء {method.expiry}</p>
                        </>
                      )}
                    </div>
                    {method.isDefault && (
                      <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                        افتراضي
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 h-12"
              >
                إلغاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Plan Change Confirmation Modal */}
        <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl border-2 border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl" dir="rtl">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-tr from-teal-400/30 to-cyan-400/30 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>

            <DialogHeader className="relative z-10 text-center space-y-4">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                {isDowngrade ? (
                  <Shield className="h-8 w-8 text-white" />
                ) : (
                  <Crown className="h-8 w-8 text-white" />
                )}
              </div>
              
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                {isDowngrade ? 'تأكيد تغيير الخطة' : 'ترقية الخطة'}
              </DialogTitle>
              
              <DialogDescription className="text-center text-lg">
                {isDowngrade ? (
                  <div className="space-y-3">
                    <p className="text-orange-600 dark:text-orange-400 font-medium">
                      ⚠️ تحذير: ستفقد بعض الميزات عند التراجع إلى خطة {selectedPlanData?.name}
                    </p>
                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-2">
                        الميزات التي ستفقدها:
                      </p>
                      <ul className="text-sm text-orange-600 dark:text-orange-400 space-y-1">
                        {currentPlanData?.features
                          .filter(feature => !selectedPlanData?.features.includes(feature))
                          .map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              {feature}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                      🎉 رائع! ستحصل على ميزات متقدمة مع خطة {selectedPlanData?.name}
                    </p>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mb-2">
                        الميزات الجديدة التي ستحصل عليها:
                      </p>
                      <ul className="text-sm text-emerald-600 dark:text-emerald-400 space-y-1">
                        {selectedPlanData?.features
                          .filter(feature => !currentPlanData?.features.includes(feature))
                          .map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                              {feature}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex gap-3 pt-6 relative z-10">
              <Button 
                variant="outline" 
                onClick={() => setShowPlanModal(false)}
                className="flex-1 h-12 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300"
              >
                إلغاء
              </Button>
              <Button 
                onClick={confirmPlanChange}
                className={`flex-1 h-12 font-bold shadow-lg hover:shadow-xl transition-all duration-300 ${
                  isDowngrade 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                } text-white`}
              >
                {isDowngrade ? 'تأكيد التراجع' : 'ترقية الآن'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Footer />
      <Toaster />
      </div>
    </div>
  );
}