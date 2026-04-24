import * as React from "react";
import { useState, useEffect } from "react";
import ScrollToTop from "@/components/ScrollToTop";
import PageViewTracker from "@/components/PageViewTracker";
import PageTitle from "@/components/PageTitle";
import ConsentAwareScriptInjector from "@/components/ConsentAwareScriptInjector";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { DynamicMetaTags } from "@/components/DynamicMetaTags";
import StructuredData from "@/components/StructuredData";
import { supabase } from "@/integrations/supabase/client";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";

// Disable browser's scroll restoration globally
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const App = () => {
  const [gaId, setGaId] = useState<string>('');

  useEffect(() => {
    const fetchGAId = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'google_analytics_id')
          .maybeSingle();

        if (!error && data?.setting_value) {
          setGaId(String(data.setting_value));
        } else {
          const envId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
          if (envId) setGaId(envId);
        }
      } catch (error) {
        console.debug('GA ID not loaded:', error);
        const envId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
        if (envId) setGaId(envId);
      }
    };

    fetchGAId();
  }, []);

  return (
    <AppProviders>
      <ScrollToTop />
      <PageViewTracker />
      <PageTitle />
      <DynamicMetaTags />
      <StructuredData />
      <ConsentAwareScriptInjector />
      {gaId && <GoogleAnalytics measurementId={gaId} />}
      <AppRoutes />
      <CookieConsentBanner />
    </AppProviders>
  );
};

export default App;
