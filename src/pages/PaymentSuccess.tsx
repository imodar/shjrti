import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle, ArrowRight, Home } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const invoiceId = searchParams.get('invoice_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!invoiceId) {
      navigate('/payments');
      return;
    }

    verifyPayment();
  }, [invoiceId]);

  const verifyPayment = async () => {
    try {
      if (sessionId) {
        // Verify with Stripe session
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: {
            session_id: sessionId,
            invoice_id: invoiceId
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.success && data.payment_status === 'paid') {
          setPaymentStatus('success');
          setPaymentDetails(data);
          
          toast({
            title: "تم الدفع بنجاح! 🎉",
            description: "تم تفعيل اشتراكك وترقية حسابك بنجاح",
            duration: 5000,
          });
        } else {
          setPaymentStatus('failed');
        }
      } else {
        // Just check invoice status in database
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select('*, packages(name)')
          .eq('id', invoiceId)
          .single();

        if (error) {
          throw new Error('فشل في العثور على الفاتورة');
        }

        if (invoice.payment_status === 'paid') {
          setPaymentStatus('success');
          setPaymentDetails({ invoice });
        } else {
          setPaymentStatus('pending');
        }
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
      toast({
        title: "خطأ في التحقق من الدفع",
        description: "فشل في التحقق من حالة الدفع",
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
                <h2 className="text-xl font-semibold mb-2">جاري التحقق من الدفع...</h2>
                <p className="text-muted-foreground">يرجى الانتظار بينما نتحقق من حالة دفعتك</p>
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
                  <span className="text-green-600">تم الدفع بنجاح! 🎉</span>
                ) : (
                  <span className="text-red-600">فشل في الدفع</span>
                )}
              </CardTitle>
              
              <CardDescription className="text-lg">
                {paymentStatus === 'success' ? (
                  'تم تفعيل اشتراكك وترقية حسابك بنجاح'
                ) : (
                  'لم يتم إتمام عملية الدفع. يرجى المحاولة مرة أخرى.'
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {paymentStatus === 'success' && paymentDetails && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
                  <p><strong>الفاتورة:</strong> {invoiceId}</p>
                  {paymentDetails.invoice?.packages && (
                    <p><strong>الباقة:</strong> {getLocalizedPackageName(paymentDetails.invoice.packages.name)}</p>
                  )}
                  <p><strong>حالة الدفع:</strong> مدفوع ✓</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Link to="/dashboard">
                    الذهاب للوحة التحكم
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </Link>
                </Button>
                
                <Button variant="outline" asChild>
                  <Link to="/payments">
                    عرض الفواتير
                  </Link>
                </Button>
                
                <Button variant="ghost" asChild>
                  <Link to="/">
                    <Home className="h-4 w-4 ml-2" />
                    الصفحة الرئيسية
                  </Link>
                </Button>
              </div>
              
              {paymentStatus === 'failed' && (
                <div className="text-center">
                  <Button 
                    onClick={() => navigate('/payments')}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    المحاولة مرة أخرى
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