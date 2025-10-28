import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PayPalButtonProps {
  invoiceId: string;
  amount: number;
  currency: string;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export function PayPalButton({
  invoiceId,
  amount,
  currency,
  onSuccess,
  onError,
  onCancel,
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();

  // Load PayPal SDK
  useEffect(() => {
    if (window.paypal) {
      setScriptLoaded(true);
      setLoading(false);
      return;
    }

    // Get PayPal client ID from backend
    const loadPayPalScript = async () => {
      try {
        console.log('Fetching PayPal client ID...');
        
        // Get the client ID from our edge function
        const { data, error } = await supabase.functions.invoke('get-paypal-client-id');

        if (error) {
          console.error('Error fetching client ID:', error);
          throw new Error('Failed to get PayPal configuration');
        }

        if (!data.clientId) {
          throw new Error('PayPal client ID not available');
        }

        console.log('Loading PayPal SDK with environment:', data.environment);
        
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${data.clientId}&currency=${currency}&intent=capture`;
        script.async = true;
        script.onload = () => {
          console.log('PayPal SDK loaded successfully');
          setScriptLoaded(true);
          setLoading(false);
        };
        script.onerror = () => {
          console.error('Failed to load PayPal SDK script');
          setLoading(false);
          onError('Failed to load PayPal SDK');
        };
        
        document.body.appendChild(script);
      } catch (error) {
        console.error('Error loading PayPal script:', error);
        setLoading(false);
        onError('Failed to initialize PayPal');
      }
    };

    loadPayPalScript();
  }, [currency, onError]);

  // Render PayPal button
  useEffect(() => {
    if (!scriptLoaded || !paypalRef.current || !window.paypal) {
      return;
    }

    // Clear any existing buttons
    if (paypalRef.current) {
      paypalRef.current.innerHTML = '';
    }

    const paypalButtonsComponent = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 55,
      },

      createOrder: async () => {
        try {
          setLoading(true);
          
          // Call edge function to create PayPal order
          const { data, error } = await supabase.functions.invoke('create-paypal-payment', {
            body: {
              invoiceId,
              amount,
              currency,
            },
          });

          if (error) {
            throw error;
          }

          if (!data.orderId) {
            throw new Error('Failed to create PayPal order');
          }

          return data.orderId;
        } catch (error: any) {
          console.error('Error creating PayPal order:', error);
          toast({
            variant: 'destructive',
            title: 'خطأ في الدفع',
            description: error.message || 'فشل إنشاء طلب الدفع',
          });
          throw error;
        } finally {
          setLoading(false);
        }
      },

      onApprove: async (data: any) => {
        try {
          setLoading(true);
          
          // Call edge function to capture payment
          const { data: verifyData, error } = await supabase.functions.invoke('verify-paypal-payment', {
            body: {
              orderId: data.orderID,
              invoiceId,
            },
          });

          if (error || !verifyData.success) {
            throw new Error(verifyData?.error || 'Payment verification failed');
          }

          toast({
            title: 'تم الدفع بنجاح',
            description: 'تم تفعيل اشتراكك بنجاح',
          });

          onSuccess(data.orderID);
        } catch (error: any) {
          console.error('Error capturing PayPal payment:', error);
          toast({
            variant: 'destructive',
            title: 'خطأ في تأكيد الدفع',
            description: error.message || 'فشل تأكيد الدفع',
          });
          onError(error.message || 'Payment capture failed');
        } finally {
          setLoading(false);
        }
      },

      onCancel: () => {
        toast({
          title: 'تم إلغاء الدفع',
          description: 'يمكنك المحاولة مرة أخرى في أي وقت',
        });
        onCancel?.();
      },

      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast({
          variant: 'destructive',
          title: 'خطأ في PayPal',
          description: 'حدث خطأ أثناء معالجة الدفع',
        });
        onError(err.message || 'PayPal error occurred');
      },
    });

    if (paypalButtonsComponent.isEligible()) {
      paypalButtonsComponent.render(paypalRef.current);
    } else {
      onError('PayPal is not available in your region');
    }
  }, [scriptLoaded, invoiceId, amount, currency, onSuccess, onError, onCancel, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <div ref={paypalRef} className="w-full max-w-md mx-auto" />;
}
