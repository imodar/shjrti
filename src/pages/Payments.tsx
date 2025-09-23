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
import { DateDisplay } from "@/components/DateDisplay";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { usePackageTransition } from "@/hooks/usePackageTransition";

export default function Payments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentLanguage, formatPrice } = useLanguage();
  const { refreshSubscription, subscription } = useSubscription();
  const { processPackageTransition, loading: transitionLoading } = usePackageTransition();
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
  const [packageWarning, setPackageWarning] = useState<string>("");
  const [scheduledDowngrade, setScheduledDowngrade] = useState<any>(null);
  const [cancellingDowngrade, setCancellingDowngrade] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<any>(null);

  // Function to get localized value
  const getLocalizedValue = (value: string | object): string => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed[currentLanguage] || parsed['en'] || value;
      } catch {
        return value;
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      return (value as any)[currentLanguage] || (value as any)['en'] || '';
    }
    
    return String(value || '');
  };

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
        .select(`
          *,
          name,
          description,
          features,
          price_usd,
          price_sar,
          max_family_members,
          max_family_trees,
          ai_features_enabled,
          image_upload_enabled
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Transform database data to match UI format while preserving original pricing data
      const transformedPackages = data.map(pkg => {
        // Select price based on current language for display
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
          // Preserve original pricing data
          price_sar: pkg.price_sar,
          price_usd: pkg.price_usd,
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

  // Cancel old invoices with improved logic and retry mechanism
  const cancelOldPendingInvoices = async (retryCount = 0) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-old-invoices');
      
      if (error) {
        console.error('Error cleaning up old invoices:', error);
      } else if (data?.cancelledCount > 0) {
        toast({
          title: "تم إلغاء الفواتير القديمة",
          description: data.message,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error cleaning up old invoices:', error);
      // Retry once on network errors
      if (retryCount === 0 && error.message?.includes('Failed to fetch')) {
        setTimeout(() => cancelOldPendingInvoices(1), 2000);
      }
    }
  };

  // Load user's invoices
  const loadInvoices = async () => {
    if (!user) return;
    
    try {
      setInvoicesLoading(true);
      
      // إلغاء الفواتير المعلقة القديمة أولاً
      await cancelOldPendingInvoices();
      
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

  // Load user's current family and subscription with retry mechanism
  const loadUserSubscription = async (retryCount = 0) => {
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
      
      // Retry once on network errors
      if (retryCount === 0 && (error.message?.includes('Failed to fetch') || error.message?.includes('CONNECTION_RESET'))) {
        console.log('🔄 Retrying user subscription load in 2 seconds...');
        setTimeout(() => loadUserSubscription(1), 2000);
        return;
      }
      
      // Default to free plan on error
      setCurrentPlan(null);
    }
  };

  // Function to load scheduled downgrades with retry mechanism
  const loadScheduledDowngrade = async (retryCount = 0) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_package_changes')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) {
        console.error('Error loading scheduled downgrade:', error);
        
        // Retry once on network errors
        if (retryCount === 0 && (error.message?.includes('Failed to fetch') || error.message?.includes('CONNECTION_RESET'))) {
          console.log('🔄 Retrying scheduled downgrade load in 2 seconds...');
          setTimeout(() => loadScheduledDowngrade(1), 2000);
          return;
        }
        return;
      }

      if (data) {
        // Get package details separately
        const [currentPackageData, targetPackageData] = await Promise.all([
          supabase.from('packages').select('name').eq('id', data.current_package_id).maybeSingle(),
          supabase.from('packages').select('name').eq('id', data.target_package_id).maybeSingle()
        ]);

        const scheduleData = {
          ...data,
          current_package: currentPackageData.data,
          target_package: targetPackageData.data
        };

        setScheduledDowngrade(scheduleData);
        
        console.log('✅ Scheduled downgrade loaded:', scheduleData);
      } else {
        console.log('❌ No scheduled downgrade found');
        setScheduledDowngrade(null);
      }
    } catch (error) {
      console.error('Error in loadScheduledDowngrade:', error);
      
      // Retry once on network errors
      if (retryCount === 0 && (error.message?.includes('Failed to fetch') || error.message?.includes('CONNECTION_RESET'))) {
        console.log('🔄 Retrying scheduled downgrade load in 2 seconds...');
        setTimeout(() => loadScheduledDowngrade(1), 2000);
        return;
      }
    }
  };

  // Function to cancel scheduled downgrade
  const cancelScheduledDowngrade = async () => {
    if (!user || !scheduledDowngrade || cancellingDowngrade) return;

    setCancellingDowngrade(true);
    
    try {
      console.log('🔄 Cancelling scheduled downgrade...');
      
      const { error } = await supabase
        .from('scheduled_package_changes')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error cancelling scheduled downgrade:', error);
        toast({
          title: currentLanguage === 'ar' ? "خطأ" : "Error",
          description: currentLanguage === 'ar' 
            ? "فشل في إلغاء التغيير المجدول" 
            : "Failed to cancel scheduled change",
          variant: "destructive",
        });
        return;
      }

      setScheduledDowngrade(null);
      
      console.log('✅ Scheduled downgrade cancelled successfully');
      
      toast({
        title: currentLanguage === 'ar' ? "تم الإلغاء" : "Cancelled",
        description: currentLanguage === 'ar' 
          ? "تم إلغاء التغيير المجدول بنجاح. ستبقى على باقتك الحالية." 
          : "Scheduled change has been cancelled successfully. You will stay on your current plan.",
      });
    } catch (error) {
      console.error('Error in cancelScheduledDowngrade:', error);
      toast({
        title: currentLanguage === 'ar' ? "خطأ" : "Error",
        description: currentLanguage === 'ar' 
          ? "حدث خطأ أثناء إلغاء التغيير المجدول" 
          : "An error occurred while cancelling the scheduled change",
        variant: "destructive",
      });
    } finally {
      setCancellingDowngrade(false);
    }
  };

  useEffect(() => {
    loadPackages();
    loadUserSubscription();
    loadInvoices();
    if (user) {
      loadScheduledDowngrade();
    }
  }, [user, currentLanguage]);

  const handleDeletePaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };

  const getPlanIndex = (planId: string | null) => {
    if (!planId) return -1; // Free plan has lowest index
    return packages.findIndex(p => p.id === planId);
  };

  // وظيفة للتحقق من إمكانية التراجع وإظهار modal المقارنة
  const checkDowngradeAndShowModal = (planId: string) => {
    if (!user) {
      toast({
        title: currentLanguage === 'ar' ? "تسجيل الدخول مطلوب" : "Login Required",
        description: currentLanguage === 'ar' 
          ? "يجب تسجيل الدخول أولاً لاختيار باقة" 
          : "Please login first to select a plan",
        variant: "destructive",
      });
      return;
    }

    const selectedPackage = packages.find(pkg => pkg.id === planId);
    if (!selectedPackage) {
      toast({
        title: currentLanguage === 'ar' ? "خطأ" : "Error",
        description: currentLanguage === 'ar' 
          ? "الباقة المحددة غير موجودة" 
          : "Selected package not found",
        variant: "destructive",
      });
      return;
    }

    // التحقق من أن هذا تراجع (downgrade)
    const currentPlanIndex = getPlanIndex(currentPlan);
    const selectedPlanIndex = getPlanIndex(planId);
    
    if (currentPlan && selectedPlanIndex < currentPlanIndex) {
      // هذا downgrade - إظهار modal
      setSelectedDowngradePlan(selectedPackage);
      setShowDowngradeModal(true);
    } else {
      // ليس downgrade - التنفيذ المباشر
      handlePlanSelect(planId);
    }
  };

  // النسخة الجديدة المحدثة من handlePlanSelect مع usePackageTransition
  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      toast({
        title: currentLanguage === 'ar' ? "تسجيل الدخول مطلوب" : "Login Required",
        description: currentLanguage === 'ar' 
          ? "يجب تسجيل الدخول أولاً لاختيار باقة" 
          : "Please login first to select a plan",
        variant: "destructive",
      });
      return;
    }

    const selectedPackage = packages.find(pkg => pkg.id === planId);
    if (!selectedPackage) {
      toast({
        title: currentLanguage === 'ar' ? "خطأ" : "Error",
        description: currentLanguage === 'ar' 
          ? "الباقة المحددة غير موجودة" 
          : "Selected package not found",
        variant: "destructive",
      });
      return;
    }

    // Convert current plan to subscription format for transition analysis
    const currentSubscription = currentPlan ? {
      id: 'current',
      package_id: currentPlan,
      status: 'active',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // افتراض سنة من الآن
    } : null;

    console.log('🔍 Plan transition analysis:', {
      selectedPackage: selectedPackage.name,
      currentPlan,
      currentSubscription,
      packageId: planId
    });

    // تحليل عملية التنقل بين الباقات
    const transitionResult = await processPackageTransition(selectedPackage, currentSubscription, packages);
    
    console.log('🔍 Transition result:', transitionResult);
    
    if (!transitionResult.canProceed) {
      if (transitionResult.action === 'block_downgrade') {
        setPackageWarning(transitionResult.message);
        toast({
          title: currentLanguage === 'ar' ? "تنبيه" : "Warning",
          description: transitionResult.message + (transitionResult.requirements ? '\n' + transitionResult.requirements.join('\n') : ''),
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: currentLanguage === 'ar' ? "تنبيه" : "Notice",
        description: transitionResult.message,
        variant: "default",
      });
      return;
    }

    // عرض رسالة التنبيه للمستخدم
    if (transitionResult.message) {
      toast({
        title: currentLanguage === 'ar' ? "تنبيه مهم" : "Important Notice",
        description: transitionResult.message,
        variant: "default",
      });
    }

    // التعامل مع التنزيل المجدول
    if (transitionResult.action === 'schedule_downgrade') {
      console.log('✅ Scheduling downgrade, refreshing data...');
      
      // تحديث فوري أولاً
      await loadScheduledDowngrade();
      
      // تحديث إضافي بعد ثانية للتأكد
      setTimeout(async () => {
        await loadScheduledDowngrade();
        console.log('✅ Scheduled downgrade data refreshed (delayed)');
      }, 1000);
      
      toast({
        title: currentLanguage === 'ar' ? "تم الجدولة" : "Scheduled",
        description: currentLanguage === 'ar' 
          ? "تم جدولة تغيير الباقة بنجاح. ستبقى على باقتك الحالية حتى التاريخ المحدد." 
          : "Package change has been scheduled successfully. You will stay on your current plan until the scheduled date.",
      });
      return;
    }

    // Continue with payment process for upgrades
    setSelectedPlan(planId);
    setProcessingInvoice(true);

    try {
      // Log the package data for debugging
      console.log('🔍 Selected package data:', {
        id: selectedPackage.id,
        name: selectedPackage.name,
        price_sar: selectedPackage.price_sar,
        price_usd: selectedPackage.price_usd,
        currentLanguage: currentLanguage
      });

      // Calculate amount based on language - use the same logic as PlanSelection
      const amount = currentLanguage === 'ar' ? (selectedPackage.price_sar || 0) : (selectedPackage.price_usd || 0);
      const currency = currentLanguage === 'ar' ? 'SAR' : 'USD';

      console.log('🔍 Package details for payment:', {
        packageId: planId,
        amount: amount,
        currency: currency,
        packageName: selectedPackage.name
      });

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

      console.log('✅ Invoice created successfully:', invoiceId);

      // For free plans, complete immediately
      if (amount === 0) {
        const { data: success, error: upgradeError } = await supabase.rpc('complete_payment_and_upgrade', {
          p_invoice_id: invoiceId
        });

        if (upgradeError) {
          console.error('Error completing free upgrade:', upgradeError);
          throw new Error('Failed to complete free upgrade');
        }

        toast({
          title: "تم تفعيل الخطة المجانية",
          description: "تم تفعيل الخطة المجانية بنجاح",
        });

        // Reload data
        loadUserSubscription();
        loadInvoices();
        return;
      }

      // Create payment session for paid plans
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          packageId: planId,
          amount: amount,
          currency: currency,
          invoiceId: invoiceId
        }
      });

      if (paymentError) {
        console.error('Payment session error:', paymentError);
        throw new Error(`Payment session failed: ${paymentError.message}`);
      }

      if (!paymentData?.url) {
        throw new Error('No payment URL received');
      }

      console.log('✅ Payment session created:', paymentData.url);

      // Open payment in new tab
      window.open(paymentData.url, '_blank');

      toast({
        title: "تم إنشاء جلسة الدفع",
        description: "تم توجيهك لصفحة الدفع في نافذة جديدة",
      });

      // Reload invoices
      loadInvoices();

    } catch (error: any) {
      console.error('Error in handlePlanSelect:', error);
      
      let errorMessage = "فشل في إنشاء جلسة الدفع";
      
      if (error?.message?.includes('STRIPE_SECRET_KEY')) {
        errorMessage = "خطأ في إعداد نظام الدفع";
      } else if (error?.message?.includes('Invoice')) {
        errorMessage = "فشل في إنشاء الفاتورة";
      } else if (error?.message?.includes('Payment')) {
        errorMessage = "فشل في إنشاء جلسة الدفع";
      }

      toast({
        title: "خطأ في الدفع",
        description: `${errorMessage}. تفاصيل الخطأ: ${error?.message || 'Unknown error'}`,
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
                            (currentPlanData?.price && currentPlanData.price !== '0' && parseFloat(currentPlanData.price) > 0 ? `${currentPlanData.price} ريال` : 'مجاني للأبد') : 
                            'مجاني للأبد'
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ التجديد</span>
                        <span className="font-medium">
                          {(() => {
                            // إذا كان هناك اشتراك مجدول للتنزيل، استخدم تاريخه
                            if (scheduledDowngrade) {
                              const scheduledDate = new Date(scheduledDowngrade.scheduled_date);
                              return scheduledDate.toLocaleDateString('en-GB');
                            }
                            
                            // إذا كان هناك اشتراك حالي، جلب تاريخ الانتهاء من قاعدة البيانات
                            if (currentPlan) {
                              // استخدام أحدث فاتورة مدفوعة لتحديد تاريخ الانتهاء
                              const currentInvoice = invoices.find(inv => 
                                inv.package_id === currentPlan && inv.payment_status === 'paid'
                              );
                              if (currentInvoice) {
                                // حساب تاريخ الانتهاء: تاريخ إنشاء الفاتورة + سنة واحدة
                                const startDate = new Date(currentInvoice.created_at);
                                const endDate = new Date(startDate);
                                endDate.setFullYear(endDate.getFullYear() + 1);
                                return endDate.toLocaleDateString('en-GB');
                              }
                              return 'غير محدد';
                            } else {
                              return <span className="text-emerald-600 font-bold">مجاناً للأبد</span>;
                            }
                          })()}
                        </span>
                      </div>
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
                {/* شريط التحذير للتغيير المجدول */}
                {scheduledDowngrade && (
                  <div className="relative z-50 mb-8 mx-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg shadow-lg">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                          {currentLanguage === 'ar' ? 'تغيير مجدول للباقة' : 'Scheduled Package Change'}
                        </h4>
                        <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed mb-3">
                          {currentLanguage === 'ar' 
                            ? `قمت بجدولة تنزيل باقتك من "${getLocalizedValue(scheduledDowngrade.current_package?.name)}" إلى "${getLocalizedValue(scheduledDowngrade.target_package?.name)}". سيتم تطبيق هذا التغيير في تاريخ ${new Date(scheduledDowngrade.scheduled_date).toLocaleDateString('en-GB')} وسيتم إرسال فاتورة إليك عند الاستحقاق.`
                            : `You have scheduled a downgrade from "${getLocalizedValue(scheduledDowngrade.current_package?.name)}" to "${getLocalizedValue(scheduledDowngrade.target_package?.name)}". This change will be applied on ${new Date(scheduledDowngrade.scheduled_date).toLocaleDateString('en-US')} and you will be billed accordingly.`
                          }
                        </p>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                              {currentLanguage === 'ar' ? 'ستستمر في الاستفادة من باقتك الحالية حتى التاريخ المحدد' : 'You will continue to enjoy your current plan until the scheduled date'}
                            </span>
                          </div>
                          <button
                            onClick={cancelScheduledDowngrade}
                            disabled={cancellingDowngrade}
                            className="relative z-50 self-start px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
                          >
                            {cancellingDowngrade 
                              ? (currentLanguage === 'ar' ? "جاري الإلغاء..." : "Cancelling...")
                              : (currentLanguage === 'ar' ? "إلغاء التغيير المجدول" : "Cancel Scheduled Change")
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
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
                    
                    // إذا كان هناك تغيير مجدول، فقط الباقة الحالية تظهر كنشطة حتى التاريخ المحدد
                    const shouldShowAsActive = currentPlanActive && (!scheduledDowngrade || scheduledDowngrade.current_package_id === plan.id);
                    
                    return (
                      <Card 
                        key={plan.id} 
                        className={`
                          relative h-full transition-all duration-500 hover:scale-105 hover:shadow-xl
                          ${isFeatured ? 'ring-4 ring-gradient-to-r ring-orange-400 border-orange-300 dark:border-orange-600 scale-105 shadow-orange-200/50 dark:shadow-orange-800/50' : ''}
                          ${shouldShowAsActive ? 'ring-2 ring-amber-200 dark:ring-amber-700' : ''}
                          ${isFeatured ? 'bg-gradient-to-br from-orange-50/80 via-white/70 to-amber-50/80 dark:from-orange-950/20 dark:via-gray-800/70 dark:to-amber-950/20' : 'bg-white/70 dark:bg-gray-800/70'}
                          backdrop-blur-xl border shadow-xl
                          ${!isFeatured ? 'border-emerald-200/30 dark:border-emerald-700/30' : ''}
                        `}
                      >
                        <div className="absolute -top-3 inset-x-0 z-10">
                          {/* إذا كانت الباقة نشطة ومميزة معاً، نعرض بادج واحد مدمج */}
                          {isFeatured && shouldShowAsActive ? (
                            <div className="flex justify-center">
                              <Badge className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-4 py-1.5 text-xs font-semibold shadow-lg animate-pulse">
                                <Crown className="h-3 w-3 mr-1" />
                                باقتك المميزة
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start px-4">
                              {/* Featured badge - الأكثر شعبية */}
                              {isFeatured && (
                                <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 text-xs font-semibold shadow-lg animate-bounce">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  الأكثر شعبية
                                </Badge>
                              )}

                              {/* Current plan badge - نشطة */}
                              {shouldShowAsActive && (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 text-xs shadow-lg">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  نشطة
                                </Badge>
                              )}
                              
                              {/* Scheduled downgrade badge للباقة المستهدفة */}
                              {scheduledDowngrade && scheduledDowngrade.target_package_id === plan.id && (
                                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 text-xs shadow-lg">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  مجدولة
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
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
                                  {plan.price !== "مجاني للأبد" && (
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      ريال/سنة
                                    </span>
                                  )}
                                </div>
                                {plan.price !== "مجاني للأبد" && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {Math.round(parseFloat(plan.price) / 12)} ريال شهرياً
                                  </p>
                                )}
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
                                  shouldShowAsActive,
                                  scheduledDowngrade
                                });
                                
                                // فقط إذا لم تكن الباقة نشطة حالياً أو إذا كانت هناك جدولة معلقة
                                if (!shouldShowAsActive) {
                                  checkDowngradeAndShowModal(plan.id);
                                }
                              }}
                              disabled={shouldShowAsActive || (processingInvoice && selectedPlan === plan.id) || processingPayment === plan.id}
                              className={`
                                w-full h-10 text-sm font-medium rounded-lg transition-all duration-300
                                ${shouldShowAsActive || (processingInvoice && selectedPlan === plan.id) || processingPayment === plan.id
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
                                  اشترك الآن
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
                      <div 
                        key={invoice.id} 
                        className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors ${
                          invoice.payment_status === 'pending' 
                            ? 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20 cursor-pointer border-yellow-200 dark:border-yellow-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                        onClick={async () => {
                          if (invoice.payment_status === 'pending') {
                            // إذا كانت الفاتورة في انتظار الدفع، توجيه للدفع
                            try {
                              const { data, error } = await supabase.functions.invoke('create-payment', {
                                body: { 
                                  packageId: invoice.package_id,
                                  amount: invoice.amount,
                                  currency: invoice.currency,
                                  invoiceId: invoice.id
                                }
                              });

                              if (error) throw error;

                              if (data.url) {
                                // فتح صفحة الدفع في تبويب جديد
                                window.open(data.url, '_blank');
                              }
                            } catch (error) {
                              console.error('Error redirecting to payment:', error);
                              toast({
                                title: "خطأ في عملية الدفع",
                                description: "حدث خطأ أثناء توجيهك لصفحة الدفع. يرجى المحاولة مرة أخرى.",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-lg">
                                {invoice.invoice_number}
                              </span>
                              {getInvoiceStatusBadge(invoice.payment_status)}
                              {invoice.payment_status === 'pending' && (
                                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                  اضغط للدفع
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>الخطة: {getLocalizedPackageField(invoice.packages, 'name') || 'غير محدد'}</p>
                              <p className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                تاريخ الفاتورة: {new Date(invoice.created_at).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600">
                              {formatPrice(invoice.amount)}
                            </p>
                            <p className="text-sm text-muted-foreground">{invoice.currency}</p>
                            <div className="flex gap-2 mt-2">
                              {invoice.amount > 0 && (
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-1" />
                                  تحميل
                                </Button>
                              )}
                              {invoice.payment_status === 'pending' && (
                                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  ادفع الآن
                                </Button>
                              )}
                            </div>
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
                  <span className="font-bold">{selectedPlanData?.price} ريال/سنوياً</span>
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
      
          </div>
        </div>
      </div>
      
      <GlobalFooter />
      
      {/* Modal مقارنة الباقات والتحذير من الـ Downgrade */}
      <Dialog open={showDowngradeModal} onOpenChange={setShowDowngradeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              {currentLanguage === 'ar' ? 'تأكيد تغيير الباقة' : 'Confirm Plan Change'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {currentLanguage === 'ar' 
                ? 'أنت على وشك تخفيض باقتك. يرجى مراجعة المقارنة أدناه.'
                : 'You are about to downgrade your plan. Please review the comparison below.'}
            </DialogDescription>
          </DialogHeader>

          {selectedDowngradePlan && (
            <div className="space-y-6">
              {/* تحذير مهم */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      {currentLanguage === 'ar' ? 'تحذير مهم' : 'Important Warning'}
                    </h4>
                    <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                      {currentLanguage === 'ar'
                        ? 'في حال كانت الباقة الجديدة غير مستوفية لمتطلباتك الحالية (عدد العائلات، الأعضاء، إلخ)، سيتم الاحتفاظ بباقتك الحالية تلقائياً حتى تقوم بحل المشكلة.'
                        : 'If the new plan does not meet your current requirements (number of families, members, etc.), your current plan will be automatically maintained until you resolve the issue.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* مقارنة الباقات */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* الباقة الحالية */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center text-blue-600 dark:text-blue-400">
                    {currentLanguage === 'ar' ? 'باقتك الحالية' : 'Your Current Plan'}
                  </h3>
                  {packages.find(p => p.id === currentPlan) && (
                    <Card className="border-2 border-blue-200 dark:border-blue-800">
                      <CardHeader>
                        <CardTitle className="text-center">
                          {getLocalizedValue(packages.find(p => p.id === currentPlan)?.name)}
                        </CardTitle>
                        <div className="text-center">
                          <span className="text-2xl font-bold">
                            {formatPrice(packages.find(p => p.id === currentPlan)?.price)}
                          </span>
                          <span className="text-muted-foreground">
                            /{currentLanguage === 'ar' ? 'سنة' : 'year'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {getLocalizedFeatures(packages.find(p => p.id === currentPlan), currentLanguage).map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          )) || (
                            <>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">
                                  {currentLanguage === 'ar' ? 'عدد العائلات: ' : 'Families: '}
                                  {packages.find(p => p.id === currentPlan)?.family_limit || '∞'}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">
                                  {currentLanguage === 'ar' ? 'عدد الأعضاء: ' : 'Members: '}
                                  {packages.find(p => p.id === currentPlan)?.member_limit || '∞'}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">
                                  {currentLanguage === 'ar' ? 'مساحة تخزين: ' : 'Storage: '}
                                  {packages.find(p => p.id === currentPlan)?.storage_limit || '∞'} GB
                                </span>
                              </li>
                            </>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* الباقة الجديدة */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center text-orange-600 dark:text-orange-400">
                    {currentLanguage === 'ar' ? 'الباقة الجديدة' : 'New Plan'}
                  </h3>
                  <Card className="border-2 border-orange-200 dark:border-orange-800">
                    <CardHeader>
                      <CardTitle className="text-center">
                        {getLocalizedValue(selectedDowngradePlan?.name)}
                      </CardTitle>
                      <div className="text-center">
                        <span className="text-2xl font-bold">
                          {formatPrice(selectedDowngradePlan?.price)}
                        </span>
                        <span className="text-muted-foreground">
                          /{currentLanguage === 'ar' ? 'سنة' : 'year'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {getLocalizedFeatures(selectedDowngradePlan, currentLanguage).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        )) || (
                          <>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                {currentLanguage === 'ar' ? 'عدد العائلات: ' : 'Families: '}
                                {selectedDowngradePlan?.family_limit || '∞'}
                              </span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                {currentLanguage === 'ar' ? 'عدد الأعضاء: ' : 'Members: '}
                                {selectedDowngradePlan?.member_limit || '∞'}
                              </span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                {currentLanguage === 'ar' ? 'مساحة تخزين: ' : 'Storage: '}
                                {selectedDowngradePlan?.storage_limit || '∞'} GB
                              </span>
                            </li>
                          </>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDowngradeModal(false)}
                  className="flex-1"
                >
                  {currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => {
                    setShowDowngradeModal(false);
                    if (selectedDowngradePlan) {
                      handlePlanSelect(selectedDowngradePlan.id);
                    }
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={transitionLoading}
                >
                  {transitionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {currentLanguage === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      {currentLanguage === 'ar' ? 'تأكيد التغيير' : 'Confirm Change'}
                      {currentLanguage === 'ar' ? (
                        <ChevronLeft className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 ml-2" />
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Toaster />
    </div>
  );
}
