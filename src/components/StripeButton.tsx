import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StripeButtonProps {
  invoiceId: string;
  packageId: string;
  amount: number;
  currency: string;
  locale?: 'ar' | 'en' | string;
  onError?: (msg: string) => void;
}

export function StripeButton({ invoiceId, packageId, amount, currency, locale = 'ar', onError }: StripeButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isArabic = locale === 'ar';

  const getStripeErrorMessage = async (err: any, data?: any) => {
    const response = err?.context;
    if (response && typeof response.json === 'function') {
      try {
        const body = await response.json();
        if (body?.error) return body.error;
      } catch {
        // Ignore malformed error payloads and fall back below.
      }
    }

    return data?.error || err?.message || (isArabic ? 'فشل بدء الدفع بالبطاقة' : 'Failed to initiate card payment');
  };

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-payment', {
        body: { invoiceId, packageId, amount, currency },
      });
      if (error || data?.error) throw error || new Error(data.error);
      if (!data?.url) throw new Error(isArabic ? 'لم يتم إنشاء رابط الدفع' : 'No checkout URL returned');
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Stripe checkout error:', err);
      const msg = await getStripeErrorMessage(err);
      toast({ variant: 'destructive', title: isArabic ? 'خطأ في الدفع' : 'Payment Error', description: msg });
      onError?.(msg);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-base shadow-lg"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <CreditCard className="h-5 w-5 me-2" />
          {isArabic ? 'الدفع ببطاقة بنكية' : 'Pay by bank card'}
        </>
      )}
    </Button>
  );
}