import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Plus, Settings, Trash2, Star, Crown, Zap, Shield, Wallet, Calendar, Download, TreePine, Heart, Gem, CheckCircle, Sparkles, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Payments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentLanguage, formatPrice } = useLanguage();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentFamily, setCurrentFamily] = useState<any>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [processingInvoice, setProcessingInvoice] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  // Helper function to get localized package field
  const getLocalizedPackageField = (pkg: any, field: string, fallbackLang = 'en') => {
    if (!pkg || !pkg[field]) return '';
    
    if (typeof pkg[field] === 'string') {
      return pkg[field];
    }
    
    if (typeof pkg[field] === 'object') {
      return pkg[field][currentLanguage] || pkg[field][fallbackLang] || '';
    }
    
    return '';
  };

  // Helper function to get localized features
  const getLocalizedFeatures = (pkg: any, language = currentLanguage) => {
    if (!pkg || !pkg.features) return [];
    
    if (Array.isArray(pkg.features)) {
      return pkg.features;
    }
    
    if (typeof pkg.features === 'object') {
      return pkg.features[language] || pkg.features['en'] || [];
    }
    
    return [];
  };

  // Load packages from database
  const loadPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Transform database data to match UI format with language-based pricing
      const transformedPackages = data.map(pkg => {
        // Select price based on current language
        const price = currentLanguage === 'ar' ? (pkg.price_sar || 0) : (pkg.price_usd || 0);
        
        return {
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          price: price === 0 ? "مجاني للأبد" : price.toString(),
          period: price === 0 ? "" : "سنوياً",
          features: pkg.features || [],
          maxMembers: pkg.max_family_members,
          maxTrees: pkg.max_family_trees,
          icon: getLocalizedPackageField(pkg, 'name', 'en').includes('مجاني') || getLocalizedPackageField(pkg, 'name', 'en').includes('free') ? Shield :
                getLocalizedPackageField(pkg, 'name', 'en').includes('أساسي') || getLocalizedPackageField(pkg, 'name', 'en').includes('basic') ? Star : Crown,
          color: getLocalizedPackageField(pkg, 'name', 'en').includes('مجاني') || getLocalizedPackageField(pkg, 'name', 'en').includes('free') ? "bg-gray-500" :
                 getLocalizedPackageField(pkg, 'name', 'en').includes('أساسي') || getLocalizedPackageField(pkg, 'name', 'en').includes('basic') ? "bg-emerald-500" : "bg-purple-500",
          popular: pkg.is_featured || false
        };
      });

      setPackages(transformedPackages);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الباقات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load user's invoices
  const loadInvoices = async () => {
    if (!user) return;
    
    try {
      setInvoicesLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          packages (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الفواتير. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Load user's current family and subscription
  const loadUserSubscription = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Loading user subscription for user:', user.id);
      
      // Get user's subscription directly from user_subscriptions table
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('package_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subscriptionError) throw subscriptionError;

      console.log('📦 Subscription data:', subscriptionData);

      if (subscriptionData) {
        setCurrentPlan(subscriptionData.package_id);
        console.log('✅ Current plan set to:', subscriptionData.package_id);
      } else {
        // No active subscription found, user is on free plan
        setCurrentPlan(null);
        console.log('🆓 No active subscription found, setting to free plan (null)');
      }
    } catch (error) {
      console.error('❌ Error loading user subscription:', error);
      // Default to free plan on error
      setCurrentPlan(null);
    }
  };

  useEffect(() => {
    loadPackages();
    loadUserSubscription();
    loadInvoices();
  }, [user, currentLanguage]);

  const handleDeletePaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };

  const getPlanIndex = (planId: string | null) => {
    if (!planId) return -1; // Free plan has lowest index
    return packages.findIndex(p => p.id === planId);
  };

  const handlePlanSelect = async (planId: string) => {
    if (planId === currentPlan || !user) return;
    
    setSelectedPlan(planId);
    setProcessingInvoice(true);

    try {
      // Get the selected package details
      const selectedPackage = packages.find(p => p.id === planId);
      if (!selectedPackage) {
        throw new Error('Selected package not found');
      }

      // Calculate amount based on current language
      const amount = currentLanguage === 'ar' 
        ? selectedPackage.price === "مجاني للأبد" ? 0 : parseFloat(selectedPackage.price)
        : selectedPackage.price === "مجاني للأبد" ? 0 : parseFloat(selectedPackage.price);
      
      const currency = currentLanguage === 'ar' ? 'SAR' : 'USD';

      // Create invoice for user subscription (no family needed)
      const { data: invoiceId, error: invoiceError } = await supabase.rpc('create_invoice', {
        p_user_id: user.id,
        p_package_id: planId,
        p_amount: amount,
        p_currency: currency
        // p_family_id is optional and defaults to null
      });

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        throw new Error('Failed to create invoice');
      }

      // If it's a free plan, complete the upgrade immediately
      if (amount === 0) {
        const { data: success, error: upgradeError } = await supabase.rpc('complete_payment_and_upgrade', {
          p_invoice_id: invoiceId,
          p_stripe_payment_intent_id: null
        });

        if (upgradeError || !success) {
          throw new Error('Failed to complete free plan upgrade');
        }

        // Reload subscription data and invoices
        await loadUserSubscription();
        await loadInvoices();
        
        toast({
          title: "🎉 تم تفعيل الخطة المجانية",
          description: `تم ترقية اشتراكك إلى ${getLocalizedPackageField(selectedPackage, 'name') || selectedPackage.name} بنجاح.`,
          duration: 5000,
        });
      } else {
        // For paid plans, process Stripe payment
        setProcessingPayment(planId);
        
        try {
          const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
            body: {
              packageId: planId,
              amount: amount,
              currency: currency
            }
          });

          if (paymentError) {
            throw new Error(paymentError.message || 'Failed to create payment session');
          }

          if (paymentData?.url) {
            // Open Stripe checkout in a new tab
            window.open(paymentData.url, '_blank');
            
            toast({
              title: "تم توجيهك للدفع",
              description: "سيتم فتح صفحة الدفع في نافذة جديدة",
              duration: 3000,
            });
          } else {
            throw new Error('No payment URL received');
          }
        } catch (paymentError) {
          console.error('Payment error:', paymentError);
          toast({
            title: "خطأ في الدفع",
            description: "فشل في إنشاء جلسة الدفع. يرجى المحاولة مرة أخرى.",
            variant: "destructive",
          });
        } finally {
          setProcessingPayment(null);
        }
      }
    } catch (error) {
      console.error('Error processing plan selection:', error);
      toast({
        title: "خطأ",
        description: "فشل في معالجة اختيار الخطة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setProcessingInvoice(false);
      setSelectedPlan(null);
    }
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
      setShowAddPaymentModal(false);
    }
  };

  const handleCreditCardSubmit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
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
    setShowCreditCardForm(false);
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white">مدفوع</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">في انتظار الدفع</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 text-white">متأخر</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const selectedPlanData = packages.find(p => p.id === selectedPlan);
  const currentPlanData = packages.find(p => p.id === currentPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10">
        <GlobalHeader />

        <div className="container mx-auto px-6 pt-24 pb-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Header Section */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-emerald-500/20 to-teal-500/10 rounded-2xl blur-2xl"></div>
              
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-6 px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white/30 dark:border-gray-700/30">
                        <CreditCard className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                          الاشتراكات والمدفوعات
                        </span>
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        إدارة اشتراكك وطرق الدفع بسهولة
                      </p>
                    </div>
                  </div>
                  
                  {currentPlanData ? (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-emerald-500 text-white px-4 py-2 rounded-full shadow-lg">
                      <Crown className="h-4 w-4" />
                      <span className="text-sm font-bold">{getLocalizedPackageField(currentPlanData, 'name') || currentPlanData.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-slate-500 text-white px-4 py-2 rounded-full shadow-lg">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-bold">الباقة المجانية</span>
                    </div>
                  )}
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
                {loading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-muted-foreground mt-2">جاري التحميل...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        {currentPlan ? (
                          currentPlanData?.icon ? <currentPlanData.icon className="h-8 w-8 text-emerald-600" /> : <Crown className="h-8 w-8 text-emerald-600" />
                        ) : (
                          <Shield className="h-8 w-8 text-emerald-600" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                        {currentPlan ? getLocalizedPackageField(currentPlanData, 'name') || 'الباقة المدفوعة' : 'الباقة المجانية'}
                      </h3>
                       <p className="text-3xl font-bold text-emerald-600">
                         {currentPlan ? 
                           (currentPlanData?.price && currentPlanData.price !== '0' ? `${currentPlanData.price} ريال` : '0') : 
                           '0'
                         }
                       </p>
                      <p className="text-muted-foreground">شهرياً</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الحد الأقصى للأشجار</span>
                        <span>{currentPlan ? currentPlanData?.maxTrees || '∞' : '1'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الحد الأقصى للأفراد</span>
                        <span>{currentPlan ? currentPlanData?.maxMembers || '∞' : '50'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">حالة الاشتراك</span>
                        <span className={`${currentPlan ? 'text-green-600' : 'text-gray-600'}`}>
                          {currentFamily?.subscription_status === 'active' ? 'نشط' : 
                           currentFamily?.subscription_status === 'expired' ? 'منتهي الصلاحية' : 
                           currentPlan ? 'نشط' : 'مجاني'}
                        </span>
                      </div>
                      {currentFamily?.subscription_end_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">تاريخ الانتهاء</span>
                          <span>{new Date(currentFamily.subscription_end_date).toLocaleDateString('ar-SA')}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
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
                                  {Array.from({length: 12}, (_, i) => <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
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
                                  {Array.from({length: 10}, (_, i) => <SelectItem key={i} value={String(new Date().getFullYear() + i)}>
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
                          
                          <div className="flex items-center space-x-2 space-x-reverse checkbox-container">
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
                          
                          <div className="flex items-center space-x-2 space-x-reverse checkbox-container">
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
                          
                          <div className="flex items-center space-x-2 space-x-reverse checkbox-container">
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
              <CardContent className="relative overflow-hidden py-12">
                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-tr from-teal-400/30 to-cyan-400/30 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto py-8">
                  {loading ? (
                    Array(3).fill(0).map((_, index) => (
                      <Card key={index} className="h-96 animate-pulse backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border-emerald-200/30 dark:border-emerald-700/30">
                        <CardContent className="p-6">
                          <div className="h-full flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="h-6 bg-gray-300 rounded"></div>
                              <div className="h-8 bg-gray-300 rounded"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                            <div className="h-10 bg-gray-300 rounded"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : packages.map((plan, index) => {
                    const isFeatured = plan.popular;
                    const currentPlanActive = currentPlan === plan.id;
                    
                    return (
                      <Card 
                        key={plan.id} 
                        className={`
                          relative h-full transition-all duration-500 hover:scale-105 hover:shadow-xl
                          ${isFeatured ? 'ring-4 ring-gradient-to-r ring-orange-400 border-orange-300 dark:border-orange-600 scale-105 shadow-orange-200/50 dark:shadow-orange-800/50' : ''}
                          ${currentPlanActive ? 'ring-2 ring-amber-200 dark:ring-amber-700' : ''}
                          ${isFeatured ? 'bg-gradient-to-br from-orange-50/80 via-white/70 to-amber-50/80 dark:from-orange-950/20 dark:via-gray-800/70 dark:to-amber-950/20' : 'bg-white/70 dark:bg-gray-800/70'}
                          backdrop-blur-xl border shadow-xl
                          ${!isFeatured ? 'border-emerald-200/30 dark:border-emerald-700/30' : ''}
                        `}
                      >
                        {/* Featured badge */}
                        {isFeatured && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                            <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1.5 text-xs font-semibold shadow-lg animate-bounce">
                              <Sparkles className="h-3 w-3 mr-1" />
                              الأكثر شعبية
                            </Badge>
                          </div>
                        )}

                        {/* Current plan badge */}
                        {currentPlanActive && (
                          <div className="absolute -top-3 right-4 z-10">
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 text-xs shadow-lg">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              نشطة
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader className="text-center pb-4 pt-8">
                          {/* Icon with dashboard-style gradient */}
                          <div className="relative mb-4">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-30 hover:opacity-50 transition-all duration-500"></div>
                            <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl hover:scale-110 transition-all duration-300">
                              <plan.icon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          
                          <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent mb-3">
                            {getLocalizedPackageField(plan, 'name') || plan.name || 'Unnamed Package'}
                          </CardTitle>
                          
                          {/* Pricing */}
                          <div className="mb-4">
                            {plan.price.includes('مجاني') ? (
                              <div className="text-center">
                                <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                  مجاني
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  للأبد
                                </p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="flex items-baseline justify-center gap-1 mb-1">
                                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                                    {plan.price}
                                  </span>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    ريال/سنة
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {Math.round(parseFloat(plan.price) / 12)} ريال شهرياً
                                </p>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="px-6 pb-6">
                          {/* Features list */}
                          <div className="space-y-2 mb-6">
                            {getLocalizedFeatures(plan).slice(0, 4).map((feature, featureIndex) => (
                              <div 
                                key={featureIndex}
                                className="flex items-center gap-2 text-sm"
                              >
                                <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="h-2.5 w-2.5 text-white" />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300 text-sm">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          {/* CTA Button */}
                          <Button
                            onClick={() => {
                              console.log('🔍 Plan comparison:', {
                                planId: plan.id,
                                currentPlan: currentPlan,
                                isEqual: currentPlan === plan.id,
                                currentPlanType: typeof currentPlan,
                                planIdType: typeof plan.id
                              });
                              
                              if (currentPlan !== plan.id) {
                                handlePlanSelect(plan.id);
                              }
                            }}
                            disabled={currentPlanActive || (processingInvoice && selectedPlan === plan.id) || processingPayment === plan.id}
                            className={`
                              w-full h-10 text-sm font-medium rounded-lg transition-all duration-300
                              ${currentPlanActive || (processingInvoice && selectedPlan === plan.id) || processingPayment === plan.id
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg text-white hover:scale-105'
                              }
                            `}
                          >
                            <span className="flex items-center gap-2">
                              {currentPlanActive ? (
                                'خطتك الحالية النشطة'
                              ) : processingInvoice && selectedPlan === plan.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  جاري إنشاء الفاتورة...
                                </>
                              ) : processingPayment === plan.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  جاري تحضير الدفع...
                                </>
                              ) : (
                                <>
                                  ادفع واشترك الآن
                                  <CreditCard className="h-4 w-4" />
                                </>
                              )}
                            </span>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">سجل الفواتير</CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-muted-foreground mt-2">جاري تحميل الفواتير...</p>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد فواتير بعد</p>
                    <p className="text-sm">ستظهر فواتيرك هنا بعد الترقية لخطة مدفوعة</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice: any) => (
                      <div key={invoice.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-lg">
                                {invoice.invoice_number}
                              </span>
                              {getInvoiceStatusBadge(invoice.payment_status)}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>الخطة: {getLocalizedPackageField(invoice.packages, 'name') || 'غير محدد'}</p>
                              <p className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                تاريخ الإنشاء: {new Date(invoice.created_at).toLocaleDateString('ar-SA')}
                              </p>
                              {invoice.due_date && (
                                <p>تاريخ الاستحقاق: {new Date(invoice.due_date).toLocaleDateString('ar-SA')}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600">
                              {formatPrice(invoice.amount)}
                            </p>
                            <p className="text-sm text-muted-foreground">{invoice.currency}</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              <Download className="h-4 w-4 mr-1" />
                              تحميل
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Payment Method Modal for Upgrade */}
        <Dialog open={showAddPaymentModal} onOpenChange={setShowAddPaymentModal}>
          <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl border-2 border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl" dir="rtl">
            <DialogHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
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
                type="button"
                variant="outline" 
                onClick={() => setShowCreditCardForm(false)}
                className="flex-1 h-12"
              >
                إلغاء
              </Button>
              <Button 
                type="button"
                onClick={handleCreditCardSubmit}
                className="flex-1 h-12 font-bold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                إضافة والدفع
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <GlobalFooter />
      <Toaster />
          </div>
        </div>
      </div>
    </div>
  );
}
