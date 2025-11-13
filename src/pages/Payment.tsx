
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Receipt, Clock, CheckCircle, Sparkles, Heart, Users, Star, Shield, Crown, Gem } from 'lucide-react';
import familyTreeLogo from '@/assets/family-tree-logo.png';
import { PayPalButton } from '@/components/PayPalButton';

interface Package {
  id: string;
  name: string | object;
  price_usd: number;
  price_sar: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  payment_status: string;
  due_date: string;
  package_id: string;
}

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage, formatPrice } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [package_, setPackage] = useState<Package | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const { planId, invoiceId, amount, currency } = location.state || {};

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!planId || !invoiceId) {
      navigate('/plan-selection');
      return;
    }

    fetchPackageAndInvoice();
  }, [user, planId, invoiceId]);

  const fetchPackageAndInvoice = async () => {
    try {
      setLoading(true);

      // Fetch package details
      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', planId)
        .single();

      if (packageError) {
        console.error('Error fetching package:', packageError);
        toast({
          title: currentLanguage === 'ar' ? "خطأ" : "Error",
          description: currentLanguage === 'ar' ? "خطأ في جلب بيانات الخطة" : "Error fetching package data",
          variant: "destructive",
        });
        return;
      }

      // Fetch invoice details
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single();

      if (invoiceError) {
        console.error('Error fetching invoice:', invoiceError);
        toast({
          title: currentLanguage === 'ar' ? "خطأ" : "Error",
          description: currentLanguage === 'ar' ? "خطأ في جلب بيانات الفاتورة" : "Error fetching invoice data",
          variant: "destructive",
        });
        return;
      }

      // @ts-ignore - Temporary fix for JSONB type mismatch after migration
      setPackage(packageData);
      setInvoice(invoiceData);

    } catch (error) {
      console.error('Error in fetchPackageAndInvoice:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handlePaymentSuccess = (orderId: string) => {
    navigate(`/payment-success?invoice_id=${invoice?.id}&order_id=${orderId}`);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: currentLanguage === 'ar' ? "خطأ في الدفع" : "Payment Error",
      description: error,
      variant: "destructive",
    });
  };

  const handlePaymentCancel = () => {
    toast({
      title: currentLanguage === 'ar' ? "تم إلغاء الدفع" : "Payment Cancelled",
      description: currentLanguage === 'ar' 
        ? "يمكنك المحاولة مرة أخرى في أي وقت" 
        : "You can try again anytime",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-gray-600 dark:text-gray-300">
            {currentLanguage === 'ar' ? "جاري تحميل بيانات الدفع..." : "Loading payment details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!package_ || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-300">
              {currentLanguage === 'ar' ? "لم يتم العثور على بيانات الدفع" : "Payment details not found"}
            </p>
            <Button onClick={() => navigate('/plan-selection')} className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              {currentLanguage === 'ar' ? "العودة لاختيار الخطة" : "Back to Plan Selection"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
      {/* Background decorations matching plan-selection */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>
      
      {/* Floating animated icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-20 animate-float">
          <Heart className="h-10 w-10 text-pink-400 opacity-60" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float-delayed">
          <Users className="h-12 w-12 text-emerald-400 opacity-40" />
        </div>
        <div className="absolute top-1/2 left-10 animate-float-slow">
          <Star className="h-8 w-8 text-yellow-400 opacity-60" />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-2 max-w-4xl relative z-10">
        {/* Header section matching plan-selection style */}
        <div className="text-center mb-12 fade-in">
          <div className="flex flex-col items-center gap-6">
            {/* Logo with plan-selection-style glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/30 to-amber-500/20 rounded-3xl blur-2xl"></div>
              <img 
                src={familyTreeLogo} 
                alt="شجرتي" 
                className="h-16 w-16 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 relative z-10 ring-2 ring-white/20 dark:ring-gray-600/20"
              />
            </div>
            
            {/* Title with plan-selection gradient */}
            <div className="space-y-3">
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 shadow-lg">
                <CreditCard className="h-4 w-4 ml-2" />
                {currentLanguage === 'ar' ? 'إتمام عملية الدفع' : 'Complete Your Payment'}
              </Badge>
              
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                  {currentLanguage === 'ar' ? 'خطوة أخيرة لتفعيل خطتك' : 'One Final Step to Activate Your Plan'}
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
                {currentLanguage === 'ar' 
                  ? 'مراجعة تفاصيل الخطة والفاتورة قبل إتمام الدفع'
                  : 'Review your plan details and invoice before completing payment'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Payment card with plan-selection styling */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl transition-all duration-500 hover:shadow-2xl">
            <CardHeader className="text-center pb-4">
              {/* Icon with plan-selection-style gradient */}
              <div className="relative mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-30"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                {currentLanguage === 'ar' ? 'تأكيد عملية الدفع' : 'Payment Confirmation'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Main payment layout - split into left (summary) and right (payment methods) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Side - Compact Invoice Summary */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-50/50 via-white/50 to-teal-50/50 dark:from-emerald-950/20 dark:via-gray-800/50 dark:to-teal-950/20 rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {currentLanguage === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">{currentLanguage === 'ar' ? 'الخطة' : 'Plan'}</span>
                        <span className="font-semibold">{getLocalizedValue(package_.name)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">{currentLanguage === 'ar' ? 'الفاتورة' : 'Invoice'}</span>
                        <span className="font-mono text-xs">{invoice.invoice_number}</span>
                      </div>
                      
                      <div className="border-t border-emerald-200/30 dark:border-emerald-700/30 pt-2 mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{currentLanguage === 'ar' ? 'المجموع' : 'Total'}</span>
                          <div className="text-right">
                            <div className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                              ${invoice.amount}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              (تقريباً {Math.round(invoice.amount * 3.75)} ريال)
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-500 dark:text-gray-500 mt-1 text-center">
                          *المبلغ النهائي يحسب من PayPal
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-orange-600">
                        <Clock className="h-3 w-3" />
                        <span>{currentLanguage === 'ar' ? 'في انتظار الدفع' : 'Pending Payment'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Note */}
                  <div className="bg-gradient-to-br from-blue-50/70 via-white/50 to-indigo-50/70 dark:from-blue-950/20 dark:via-gray-800/50 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-700/30 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
                        {currentLanguage === 'ar' 
                          ? 'سيتم تفعيل اشتراكك فور إتمام الدفع بنجاح'
                          : 'Your subscription will be activated immediately after successful payment'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side - PayPal Payment */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50/50 via-white/50 to-indigo-50/50 dark:from-blue-950/20 dark:via-gray-800/50 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200/30 dark:border-blue-700/30">
                    <h3 className="font-semibold text-base mb-4 flex items-center gap-2 text-center justify-center">
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">PP</span>
                      </div>
                      {currentLanguage === 'ar' ? 'الدفع عبر PayPal' : 'Pay with PayPal'}
                    </h3>
                    
                    {invoice && (
                      <PayPalButton
                        invoiceId={invoice.id}
                        packageId={invoice.package_id}
                        amount={invoice.amount}
                        currency={invoice.currency}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        onCancel={handlePaymentCancel}
                      />
                    )}
                    
                    <div className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                      {currentLanguage === 'ar' 
                        ? 'الدفع آمن ومحمي عبر PayPal'
                        : 'Secure payment powered by PayPal'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <Button 
                variant="outline" 
                onClick={() => navigate('/plan-selection')}
                className="w-full border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300"
                disabled={processing}
              >
                {currentLanguage === 'ar' ? 'العودة للباقات' : 'Back to Packages'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;
