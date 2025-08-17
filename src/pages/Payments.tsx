import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CreditCard, 
  Plus, 
  Wallet, 
  Shield, 
  Crown, 
  Star,
  Check,
  Clock,
  AlertTriangle,
  X
} from "lucide-react";
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
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
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

  // Load packages
  const loadPackages = async () => {
    try {
      const { data: packagesData, error } = await supabase
        .from('packages')
        .select('*')
        .order('price');

      if (error) throw error;
      
      setPackages(packagesData || []);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user subscription
  const loadUserSubscription = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/user-subscription', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      
      if (response.ok) {
        const subscription = await response.json();
        setCurrentPlan(subscription?.package_id || null);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  // Load invoices
  const loadInvoices = async () => {
    if (!user) return;
    
    try {
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
    loadUserSubscription();
    loadInvoices();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white">مدفوع</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">في الانتظار</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">فشل</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500 text-white">ملغى</Badge>;
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
                      <div className="relative w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-xl">
                        <CreditCard className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">المدفوعات والاشتراكات</h1>
                      <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <p className="text-lg">إدارة اشتراكاتك وطرق الدفع</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">
                      الخطة الحالية
                    </div>
                    <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                      {currentPlanData ? getLocalizedPackageField(currentPlanData, 'name') || currentPlanData.name : 'لا يوجد اشتراك'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Subscription Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Invoices History Card */}
              <div className="lg:col-span-2">
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      سجل الفواتير
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {invoicesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : invoices.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">لا توجد فواتير</h3>
                        <p className="text-gray-600 dark:text-gray-400">لم يتم إنشاء أي فواتير بعد</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {invoices.slice(0, 5).map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-emerald-100 dark:border-emerald-800">
                            <div>
                              <p className="font-semibold">#{invoice.invoice_number}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getLocalizedPackageField(invoice.packages, 'name') || invoice.packages?.name || 'خطة غير محددة'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(invoice.created_at).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(invoice.status)}
                              <p className="text-lg font-bold mt-1">
                                {`${invoice.amount} ${invoice.currency}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods Card */}
              <div>
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 dark:text-emerald-200">طرق الدفع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-4">لا توجد طرق دفع</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        أضف طريقة دفع لسهولة الاشتراك في الخطط
                      </p>
                      <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                        <Plus className="h-5 w-5 mr-2" />
                        إضافة طريقة دفع جديدة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Available Plans Section */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
              <CardHeader>
                <div className="relative">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-tr from-teal-400/30 to-cyan-400/30 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
                <CardTitle className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 text-center relative">
                  الخطط المتاحة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    Array.from({length: 3}).map((_, index) => (
                      <Card key={index} className="relative h-full animate-pulse">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="h-6 bg-gray-300 rounded"></div>
                            <div className="h-8 bg-gray-300 rounded"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded"></div>
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
                        {isFeatured && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-30 hover:opacity-50 transition-all duration-500"></div>
                              <Star className="h-4 w-4 relative z-10" />
                              <span className="relative z-10">الأكثر شعبية</span>
                            </div>
                          </div>
                        )}
                        
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="text-center mb-6">
                            <h3 className="text-xl font-bold mb-2 text-emerald-800 dark:text-emerald-200">
                              {getLocalizedPackageField(plan, 'name') || plan.name}
                            </h3>
                            <div className="mb-4">
                              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                {typeof plan.price === 'string' ? plan.price : `${plan.price} ${currentLanguage === 'ar' ? 'ريال' : 'USD'}`}
                              </span>
                              {typeof plan.price !== 'string' && (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  /{currentLanguage === 'ar' ? 'شهر' : 'month'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-3 mb-6">
                            {(getLocalizedPackageField(plan, 'features') || plan.features || []).map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                              </div>
                            ))}
                          </div>
                          
                          <Button 
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all duration-300 ${
                              currentPlanActive 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' 
                                : isFeatured 
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white' 
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                            }`}
                            disabled={currentPlanActive}
                          >
                            {currentPlanActive ? (
                              <>
                                <Crown className="h-4 w-4 mr-2" />
                                الخطة الحالية
                              </>
                            ) : (
                              <>
                                <Star className="h-4 w-4 mr-2" />
                                اختيار هذه الخطة
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
        
        <GlobalFooter />
      </div>
      
      <Toaster />
    </div>
  );
}