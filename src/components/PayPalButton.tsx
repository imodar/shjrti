import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PayPalButtonProps {
  invoiceId: string;
  packageId: string;
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
  packageId,
  amount,
  currency,
  onSuccess,
  onError,
  onCancel,
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const buttonRenderedRef = useRef(false);
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
        // Always use USD for PayPal subscriptions
        script.src = `https://www.paypal.com/sdk/js?client-id=${data.clientId}&currency=USD&intent=subscription&vault=true`;
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
    if (!scriptLoaded || !paypalRef.current || !window.paypal || buttonRenderedRef.current) {
      return;
    }

    let buttonsInstance: any = null;

    const renderButtons = async () => {
      try {
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

          createSubscription: async (data: any, actions: any) => {
            try {
              console.log('Creating PayPal subscription...');
              
              // Call edge function to create billing plan
              const { data: planData, error } = await supabase.functions.invoke('create-paypal-subscription', {
                body: {
                  packageId: packageId,
                  amount,
                  currency,
                },
              });

              if (error) {
                console.error('Edge function error:', error);
                throw new Error(error.message || 'Failed to create billing plan');
              }

              if (!planData?.planId) {
                console.error('No plan ID received:', planData);
                throw new Error('No plan ID received from server');
              }

              console.log('Plan created successfully:', planData.planId);

              // IMPORTANT: Use PayPal SDK to create the subscription with the plan ID
              return actions.subscription.create({ plan_id: String(planData.planId) });
            } catch (error: any) {
              console.error('Error creating subscription:', error);
              toast({
                variant: 'destructive',
                title: 'خطأ في الدفع',
                description: error.message || 'فشل إنشاء الاشتراك',
              });
              throw error;
            }
          },

          onApprove: async (data: any) => {
            try {
              setLoading(true);
              
              console.log('Subscription approved:', data.subscriptionID);
              
              // Call edge function to verify and activate subscription
              const { data: verifyData, error } = await supabase.functions.invoke('verify-paypal-subscription', {
                body: {
                  subscriptionId: data.subscriptionID,
                  invoiceId,
                },
              });

              if (error || !verifyData.success) {
                throw new Error(verifyData?.error || 'Subscription verification failed');
              }

              toast({
                title: 'تم الدفع بنجاح',
                description: 'تم تفعيل اشتراكك المتكرر بنجاح - سيتم التجديد تلقائياً كل سنة',
              });

              onSuccess(data.subscriptionID);
            } catch (error: any) {
              console.error('Error verifying subscription:', error);
              toast({
                variant: 'destructive',
                title: 'خطأ في تأكيد الاشتراك',
                description: error.message || 'فشل تأكيد الاشتراك',
              });
              onError(error.message || 'Subscription verification failed');
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
          buttonsInstance = paypalButtonsComponent;
          await paypalButtonsComponent.render(paypalRef.current);
          buttonRenderedRef.current = true;
        } else {
          onError('PayPal is not available in your region');
        }
      } catch (error) {
        console.error('Error rendering PayPal buttons:', error);
      }
    };

    renderButtons();

    // Cleanup function
    return () => {
      buttonRenderedRef.current = false;
      if (buttonsInstance && typeof buttonsInstance.close === 'function') {
        try {
          buttonsInstance.close();
        } catch (error) {
          console.error('Error closing PayPal buttons:', error);
        }
      }
    };
  }, [scriptLoaded, invoiceId, packageId, amount, currency, onSuccess, onError, onCancel, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <div ref={paypalRef} className="w-full max-w-md mx-auto" />;
}
