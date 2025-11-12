import { supabase } from "@/integrations/supabase/client";

export type PaymentEventType = 
  | 'view_packages'
  | 'click_upgrade'
  | 'select_package'
  | 'initiate_payment'
  | 'payment_success'
  | 'payment_failed';

interface LogPaymentEventParams {
  eventType: PaymentEventType;
  packageId?: string;
  amount?: number;
  currency?: string;
  paymentGateway?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export const usePaymentTracking = () => {
  const logEvent = async ({
    eventType,
    packageId,
    amount,
    currency,
    paymentGateway,
    failureReason,
    metadata = {}
  }: LogPaymentEventParams) => {
    try {
      const { data, error } = await supabase.rpc('log_payment_event', {
        p_event_type: eventType,
        p_package_id: packageId || null,
        p_amount: amount || null,
        p_currency: currency || null,
        p_payment_gateway: paymentGateway || null,
        p_failure_reason: failureReason || null,
        p_metadata: metadata
      });

      if (error) {
        console.error('Error logging payment event:', error);
      }

      return { data, error };
    } catch (error) {
      console.error('Error logging payment event:', error);
      return { data: null, error };
    }
  };

  return {
    logViewPackages: () => logEvent({ eventType: 'view_packages' }),
    logUpgradeClick: () => logEvent({ eventType: 'click_upgrade' }),
    logPackageSelection: (packageId: string, amount?: number, currency?: string) =>
      logEvent({ eventType: 'select_package', packageId, amount, currency }),
    logPaymentInitiation: (packageId: string, amount: number, currency: string, paymentGateway: string) =>
      logEvent({ eventType: 'initiate_payment', packageId, amount, currency, paymentGateway }),
    logPaymentSuccess: (packageId: string, amount: number, currency: string, paymentGateway: string, metadata?: Record<string, any>) =>
      logEvent({ eventType: 'payment_success', packageId, amount, currency, paymentGateway, metadata }),
    logPaymentFailure: (packageId: string, amount: number, currency: string, paymentGateway: string, failureReason: string) =>
      logEvent({ eventType: 'payment_failed', packageId, amount, currency, paymentGateway, failureReason })
  };
};
