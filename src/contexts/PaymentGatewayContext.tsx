import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentGatewaySettings {
  gateway: string;
  environment: 'sandbox' | 'live';
  isActive: boolean;
  loading: boolean;
}

interface PaymentGatewayContextType extends PaymentGatewaySettings {
  refreshSettings: () => Promise<void>;
}

const PaymentGatewayContext = createContext<PaymentGatewayContextType | undefined>(undefined);

export function PaymentGatewayProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PaymentGatewaySettings>({
    gateway: 'paypal',
    environment: 'sandbox',
    isActive: true,
    loading: true,
  });

  const fetchSettings = async () => {
    try {
      setSettings(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase
        .from('payment_gateway_settings')
        .select('*')
        .eq('gateway_name', 'paypal')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching payment gateway settings:', error);
        return;
      }

      if (data) {
        setSettings({
          gateway: data.gateway_name,
          environment: data.environment as 'sandbox' | 'live',
          isActive: data.is_active,
          loading: false,
        });
        
        // Cache in localStorage
        localStorage.setItem('paymentGatewaySettings', JSON.stringify({
          gateway: data.gateway_name,
          environment: data.environment,
          isActive: data.is_active,
        }));
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      setSettings(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    // Try to load from cache first
    const cached = localStorage.getItem('paymentGatewaySettings');
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        if (parsedCache.gateway && parsedCache.environment && typeof parsedCache.isActive === 'boolean') {
          setSettings({
            gateway: parsedCache.gateway,
            environment: parsedCache.environment,
            isActive: parsedCache.isActive,
            loading: true,
          });
        }
      } catch (e) {
        localStorage.removeItem('paymentGatewaySettings');
      }
    }

    fetchSettings();
  }, []);

  const value: PaymentGatewayContextType = {
    ...settings,
    refreshSettings: fetchSettings,
  };

  return (
    <PaymentGatewayContext.Provider value={value}>
      {children}
    </PaymentGatewayContext.Provider>
  );
}

export function usePaymentGateway() {
  const context = useContext(PaymentGatewayContext);
  if (context === undefined) {
    throw new Error('usePaymentGateway must be used within a PaymentGatewayProvider');
  }
  return context;
}
