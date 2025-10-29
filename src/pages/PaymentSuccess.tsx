import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle, ArrowRight, Home } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage, t } = useLanguage();
  const { clearSubscriptionCache, refreshSubscription } = useSubscription();
  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const invoiceId = searchParams.get('invoice_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!invoiceId && !orderId) {
      navigate('/payments');
      return;
    }

    verifyPayment();
  }, [invoiceId, orderId]);

  const verifyPayment = async () => {
    try {
      if (orderId) {
        // If orderId starts with "I-", it's a PayPal Subscription ID
        if (orderId.startsWith('I-')) {
          const { data, error } = await supabase.functions.invoke('verify-paypal-subscription', {
            body: {
              subscriptionId: orderId,
              invoiceId,
            },
          });

          if (error) {
            throw new Error(error.message);
          }

          if (data?.success && data.status === 'ACTIVE') {
            setPaymentStatus('success');
            // Try to load invoice details for UI
            if (invoiceId) {
              const { data: invoice } = await supabase
                .from('invoices')
                .select('*, packages(name)')
                .eq('id', invoiceId)
                .single();
              if (invoice) setPaymentDetails({ invoice });
            }

            // Clear subscription cache and refresh after successful payment
            clearSubscriptionCache();
            await refreshSubscription();

            toast({
              title: currentLanguage === 'ar' ? "تم الدفع بنجاح! 🎉" : "Payment Successful! 🎉",
              description: currentLanguage === 'ar'
                ? "تم تفعيل اشتراكك وترقية حسابك بنجاح"
                : "Your subscription has been activated successfully",
              duration: 5000,
            });
          } else {
            setPaymentStatus('failed');
          }
        } else {
          // One-time PayPal order capture flow
          const { data, error } = await supabase.functions.invoke('verify-paypal-payment', {
            body: {
              orderId,
              invoiceId,
            },
          });

          if (error) {
            throw new Error(error.message);
          }

          if (data.success && data.status === 'COMPLETED') {
            setPaymentStatus('success');
            setPaymentDetails(data);

            // Clear subscription cache and refresh after successful payment
            clearSubscriptionCache();
            await refreshSubscription();

            toast({
              title: currentLanguage === 'ar' ? "تم الدفع بنجاح! 🎉" : "Payment Successful! 🎉",
              description: currentLanguage === 'ar'
                ? "تم تفعيل اشتراكك وترقية حسابك بنجاح"
                : "Your subscription has been activated successfully",
              duration: 5000,
            });
          } else {
            setPaymentStatus('failed');
          }
        }
      } else if (invoiceId) {
        // Just check invoice status in database
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select('*, packages(name)')
          .eq('id', invoiceId)
          .single();

        if (error) {
          throw new Error(currentLanguage === 'ar' ? 'فشل في العثور على الفاتورة' : 'Failed to find invoice');
        }

        if (invoice.payment_status === 'paid') {
          // Check if subscription package matches invoice package
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('package_id')
            .eq('user_id', invoice.user_id)
            .eq('status', 'active')
            .single();

          // If packages don't match, try to fix the subscription
          if (subscription && subscription.package_id !== invoice.package_id) {
            console.log('Package mismatch detected. Attempting to fix subscription...');
            const { data: fixResult, error: fixError } = await supabase.functions.invoke('fix-paid-subscription', {
              body: { invoiceId: invoice.id },
            });

            if (fixError) {
              console.error('Failed to fix subscription:', fixError);
            } else {
              console.log('Subscription fixed successfully:', fixResult);
            }
          }

          setPaymentStatus('success');
          setPaymentDetails({ invoice });

          // Clear subscription cache and refresh after successful payment
          clearSubscriptionCache();
          await refreshSubscription();
        } else {
          setPaymentStatus('pending');
        }
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
      toast({
        title: currentLanguage === 'ar' ? "خطأ في التحقق من الدفع" : "Payment Verification Error",
        description: currentLanguage === 'ar'
          ? "فشل في التحقق من حالة الدفع"
          : "Failed to verify payment status",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const getLocalizedPackageName = (packageName: any) => {
    if (typeof packageName === 'object' && packageName !== null) {
      return packageName.ar || packageName.en || 'باقة غير محددة';
    }
    return packageName || 'باقة غير محددة';
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir="rtl">
        <GlobalHeader />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-600" />
                <h2 className="text-xl font-semibold mb-2">{t('payment_success.verifying')}</h2>
                <p className="text-muted-foreground">{t('payment_success.please_wait')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir="rtl">
      <GlobalHeader />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {paymentStatus === 'success' ? (
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                )}
              </div>
              
              <CardTitle className="text-2xl">
                {paymentStatus === 'success' ? (
                  <span className="text-green-600">{t('payment_success.success_title')}</span>
                ) : (
                  <span className="text-red-600">{t('payment_success.failed_title')}</span>
                )}
              </CardTitle>
              
              <CardDescription className="text-lg">
                {paymentStatus === 'success' ? (
                  t('payment_success.success_description')
                ) : (
                  t('payment_success.failed_description')
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {paymentStatus === 'success' && paymentDetails && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
                  <p><strong>{t('payment_success.invoice')}:</strong> {invoiceId}</p>
                  {paymentDetails.invoice?.packages && (
                    <p><strong>{t('payment_success.package')}:</strong> {getLocalizedPackageName(paymentDetails.invoice.packages.name)}</p>
                  )}
                  <p><strong>{t('payment_success.payment_status')}:</strong> {t('payment_success.paid')}</p>
                </div>
              )}
              
              <div className="flex justify-center">
                <Button 
                  asChild 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Link to="/dashboard">
                    {t('payment_success.go_to_dashboard')}
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </Link>
                </Button>
              </div>
              
              {paymentStatus === 'failed' && (
                <div className="text-center">
                  <Button 
                    onClick={() => navigate('/payments')}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    {t('payment_success.try_again')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}