
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Receipt, Clock } from 'lucide-react';

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

  const simulatePayment = async () => {
    if (!invoice) return;

    try {
      setProcessing(true);

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Complete payment and upgrade subscription
      const { data: success, error } = await supabase.rpc('complete_payment_and_upgrade', {
        p_invoice_id: invoice.id,
        p_stripe_payment_intent_id: `sim_${Date.now()}` // Simulated payment intent ID
      });

      if (error) {
        console.error('Error completing payment:', error);
        toast({
          title: currentLanguage === 'ar' ? "خطأ في الدفع" : "Payment Error",
          description: currentLanguage === 'ar' 
            ? "حدث خطأ في معالجة الدفع" 
            : "Error processing payment",
          variant: "destructive",
        });
        return;
      }

      if (success) {
        toast({
          title: currentLanguage === 'ar' ? "تم الدفع بنجاح" : "Payment Successful",
          description: currentLanguage === 'ar' 
            ? "تم تفعيل اشتراكك بنجاح" 
            : "Your subscription has been activated successfully",
        });

        // Redirect to dashboard after successful payment
        navigate('/dashboard');
      } else {
        toast({
          title: currentLanguage === 'ar' ? "خطأ في تأكيد الدفع" : "Payment Confirmation Error",
          description: currentLanguage === 'ar' 
            ? "لم يتم تأكيد الدفع" 
            : "Payment could not be confirmed",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error in simulatePayment:', error);
      toast({
        title: currentLanguage === 'ar' ? "خطأ" : "Error",
        description: currentLanguage === 'ar' 
          ? "حدث خطأ في معالجة طلبك" 
          : "Error processing your request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {currentLanguage === 'ar' ? "جاري تحميل بيانات الدفع..." : "Loading payment details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!package_ || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {currentLanguage === 'ar' ? "لم يتم العثور على بيانات الدفع" : "Payment details not found"}
            </p>
            <Button onClick={() => navigate('/plan-selection')} className="w-full mt-4">
              {currentLanguage === 'ar' ? "العودة لاختيار الخطة" : "Back to Plan Selection"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {currentLanguage === 'ar' ? 'إتمام الدفع' : 'Complete Payment'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Invoice Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {currentLanguage === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{currentLanguage === 'ar' ? 'رقم الفاتورة:' : 'Invoice Number:'}</span>
                  <span className="font-mono">{invoice.invoice_number}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>{currentLanguage === 'ar' ? 'الخطة:' : 'Plan:'}</span>
                  <span>{getLocalizedValue(package_.name)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>{currentLanguage === 'ar' ? 'المبلغ:' : 'Amount:'}</span>
                  <span className="font-bold text-lg">{formatPrice(invoice.amount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>{currentLanguage === 'ar' ? 'تاريخ الاستحقاق:' : 'Due Date:'}</span>
                  <span>{new Date(invoice.due_date).toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>{currentLanguage === 'ar' ? 'الحالة:' : 'Status:'}</span>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-600 font-medium">
                      {currentLanguage === 'ar' ? 'في انتظار الدفع' : 'Pending Payment'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                {currentLanguage === 'ar' 
                  ? 'سيتم تفعيل اشتراكك فور إتمام الدفع بنجاح. لن يتم خصم أي رسوم حتى تأكيد الدفع.'
                  : 'Your subscription will be activated immediately after successful payment. No charges will be made until payment is confirmed.'
                }
              </p>
            </div>

            {/* Payment Button */}
            <Button 
              onClick={simulatePayment}
              disabled={processing}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {processing ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>
                    {currentLanguage === 'ar' ? 'جاري معالجة الدفع...' : 'Processing Payment...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <CreditCard className="h-5 w-5" />
                  <span>
                    {currentLanguage === 'ar' ? `ادفع ${formatPrice(invoice.amount)}` : `Pay ${formatPrice(invoice.amount)}`}
                  </span>
                </div>
              )}
            </Button>

            {/* Cancel Button */}
            <Button 
              variant="outline" 
              onClick={() => navigate('/plan-selection')}
              className="w-full"
              disabled={processing}
            >
              {currentLanguage === 'ar' ? 'إلغاء والعودة' : 'Cancel & Go Back'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
