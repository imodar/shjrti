import { useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StripeCardFormProps {
  invoiceId: string;
  packageId: string;
  amount: number;
  currency: string;
  locale?: 'ar' | 'en' | string;
  onSuccess?: (orderId: string) => void;
  onError?: (msg: string) => void;
}

function InnerForm({ isArabic, onSuccess, onError, invoiceId, paymentIntentId }: {
  isArabic: boolean;
  invoiceId: string;
  paymentIntentId: string;
  onSuccess?: (orderId: string) => void;
  onError?: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw new Error(submitError.message);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) throw new Error(error.message);
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error(isArabic ? 'لم يتم تأكيد الدفع' : 'Payment was not confirmed');
      }

      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-stripe-payment', {
        body: { paymentIntentId: paymentIntent.id, invoiceId },
      });
      if (verifyError || verifyData?.error) throw new Error(verifyError?.message || verifyData?.error);
      if (!verifyData?.success) throw new Error(isArabic ? 'فشل التحقق من الدفع' : 'Payment verification failed');

      toast({ title: isArabic ? 'تم الدفع بنجاح' : 'Payment successful' });
      onSuccess?.(paymentIntent.id);
    } catch (err: any) {
      const msg = err?.message || (isArabic ? 'فشل الدفع بالبطاقة' : 'Card payment failed');
      console.error('Stripe inline payment error:', err);
      toast({ variant: 'destructive', title: isArabic ? 'خطأ في الدفع' : 'Payment Error', description: msg });
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg"
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="h-5 w-5 me-2" />
            {isArabic ? 'ادفع الآن' : 'Pay now'}
          </>
        )}
      </Button>
      <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3" />
        {isArabic ? 'دفع آمن عبر Stripe' : 'Secure payment via Stripe'}
      </p>
    </form>
  );
}

export function StripeCardForm({ invoiceId, packageId, amount, currency, locale = 'ar', onSuccess, onError }: StripeCardFormProps) {
  const isArabic = locale === 'ar';
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: keyData, error: keyError } = await supabase.functions.invoke('get-stripe-publishable-key');
        if (keyError || keyData?.error) throw new Error(keyError?.message || keyData?.error);
        const publishableKey = keyData?.publishableKey;
        if (!publishableKey) throw new Error(isArabic ? 'مفتاح Stripe غير مهيّأ' : 'Stripe publishable key missing');

        const { data: piData, error: piError } = await supabase.functions.invoke('create-stripe-payment-intent', {
          body: { invoiceId, packageId, amount, currency },
        });
        if (piError || piData?.error) {
          let msg = piError?.message || piData?.error || 'Failed to initialize payment';
          try {
            const body = await (piError as any)?.context?.json?.();
            if (body?.error) msg = body.error;
          } catch {}
          throw new Error(msg);
        }
        if (!piData?.clientSecret) throw new Error(isArabic ? 'لم يتم إنشاء جلسة دفع' : 'No client secret returned');

        if (cancelled) return;
        setStripePromise(loadStripe(publishableKey));
        setClientSecret(piData.clientSecret);
        setPaymentIntentId(piData.paymentIntentId);
      } catch (err: any) {
        if (cancelled) return;
        const msg = err?.message || (isArabic ? 'فشل تحميل نموذج البطاقة' : 'Failed to load card form');
        setError(msg);
        onError?.(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, amount, currency]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {isArabic ? 'جاري تحميل نموذج البطاقة...' : 'Loading card form...'}
      </div>
    );
  }

  if (error || !clientSecret || !stripePromise || !paymentIntentId) {
    return (
      <div className="text-center text-sm text-destructive py-4">
        {error || (isArabic ? 'تعذّر تحميل نموذج البطاقة' : 'Could not load card form')}
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: isArabic ? 'ar' : 'en',
        appearance: { theme: 'stripe', variables: { colorPrimary: '#6366f1' } },
      }}
    >
      <InnerForm
        isArabic={isArabic}
        invoiceId={invoiceId}
        paymentIntentId={paymentIntentId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}