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
...
        </div>

        {/* Add Payment Method Modal for Upgrade */}
        <Dialog open={showAddPaymentModal} onOpenChange={setShowAddPaymentModal}>
...
        </Dialog>
      </div>
          </div>
        </div>
      </div>
      
      <GlobalFooter />
      <Toaster />
    </div>
  );
}
