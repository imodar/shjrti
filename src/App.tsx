import * as React from "react";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DirectionWrapper } from "@/components/DirectionWrapper";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedFamilyRoute } from "@/components/ProtectedFamilyRoute";
import { MaintenanceModeGuard } from "@/components/MaintenanceModeGuard";
import { SkeletonLayoutForBuilder } from "@/components/SkeletonLayoutForBuilder";
import ScrollToTop from "@/components/ScrollToTop";
import PageViewTracker from "@/components/PageViewTracker";
import PageTitle from "@/components/PageTitle";
import ConsentAwareScriptInjector from "@/components/ConsentAwareScriptInjector";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import DashboardBackup from "./pages/DashboardBackup";
import FamilyCreator from "./pages/FamilyCreator";
import FamilyBuilder from "./pages/FamilyBuilder";
import FamilyBuilderNewWithContext from "./pages/FamilyBuilderNew/FamilyBuilderNewWithContext";

import FamilyTreeView from "./pages/FamilyTreeView/FamilyTreeViewWithContext";
import FamilyStatistics from "./pages/FamilyStatistics";
import FamilyGallery from "./pages/FamilyGallery";
import Profile from "./pages/Profile";
import Payments from "./pages/Payments";
import PlanSelection from "./pages/PlanSelection";
import PaymentSuccess from "./pages/PaymentSuccess";
import Payment from "./pages/Payment";
import ChangePassword from "./pages/ChangePassword";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";
import Store from "./pages/Store";
import EnhancedAdminPanel from "./pages/EnhancedAdminPanel";
import AdminBilling from "./pages/AdminBilling";
import AdminAPISettings from "./pages/AdminAPISettings";
import RenewSubscription from "./pages/RenewSubscription";
import CustomDomainRedirect from "./pages/CustomDomainRedirect";
import PublicTreeViewWithContext from "./pages/PublicTreeView/PublicTreeViewWithContext";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

// Disable browser's scroll restoration globally
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const App = () => {
  const [gaId, setGaId] = useState<string>('');

  useEffect(() => {
    // Fetch Google Analytics ID from admin settings with a small delay
    // to ensure Supabase client is fully initialized
    const fetchGAId = async () => {
      try {
        // Small delay to ensure client is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'google_analytics_id')
          .maybeSingle();

        if (!error && data?.setting_value) {
          setGaId(String(data.setting_value));
        } else {
          // Fallback to env var if DB setting is not found
          const envId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
          if (envId) setGaId(envId);
        }
      } catch (error) {
        // Silently fail - GA is optional
        console.debug('GA ID not loaded:', error);
        // Final fallback to env var
        const envId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
        if (envId) setGaId(envId);
      }
    };

    fetchGAId();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <DirectionWrapper>
          <AuthProvider>
            <AdminProvider>
              <SubscriptionProvider>
                <MaintenanceModeGuard>
                <Toaster />
                <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <PageViewTracker />
            <PageTitle />
            <ConsentAwareScriptInjector />
                  {gaId && <GoogleAnalytics measurementId={gaId} />}
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard-backup" element={
                    <ProtectedRoute>
                      <DashboardBackup />
                    </ProtectedRoute>
                  } />
                  <Route path="/family-creator" element={
                    <ProtectedRoute requireActiveSubscription={true}>
                      <FamilyCreator />
                    </ProtectedRoute>
                  } />
          <Route path="/family-builder" element={
            <ProtectedRoute requireActiveSubscription={true}>
              <ProtectedFamilyRoute>
                <FamilyBuilder />
              </ProtectedFamilyRoute>
            </ProtectedRoute>
          } />
          <Route path="/family-builder-new" element={
            <ProtectedRoute>
              <ProtectedFamilyRoute loadingFallback={<SkeletonLayoutForBuilder />}>
                <FamilyBuilderNewWithContext />
              </ProtectedFamilyRoute>
            </ProtectedRoute>
          } />
                  <Route path="/family-tree-view" element={
                    <ProtectedRoute>
                      <FamilyTreeView />
                    </ProtectedRoute>
                  } />
                  <Route path="/family-statistics" element={
                    <ProtectedRoute>
                      <FamilyStatistics />
                    </ProtectedRoute>
                  } />
                  <Route path="/family-gallery" element={
                    <ProtectedRoute>
                      <FamilyGallery />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/payments" element={
                    <ProtectedRoute>
                      <Payments />
                    </ProtectedRoute>
                  } />
                  <Route path="/plan-selection" element={
                    <ProtectedRoute>
                      <PlanSelection />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment-success" element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment" element={
                    <ProtectedRoute>
                      <Payment />
                    </ProtectedRoute>
                  } />
                  <Route path="/change-password" element={
                    <ProtectedRoute>
                      <ChangePassword />
                    </ProtectedRoute>
                  } />
                  <Route path="/store" element={
                    <ProtectedRoute>
                      <Store />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute requireAdmin={true}>
                      <EnhancedAdminPanel />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/billing" element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminBilling />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin-api-settings" element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminAPISettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/renew-subscription" element={
                    <ProtectedRoute>
                      <RenewSubscription />
                    </ProtectedRoute>
                  } />
                  <Route path="/terms-conditions" element={<TermsConditions />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/tree" element={<PublicTreeViewWithContext />} />
                  {/* Redirect old terms route to new one */}
                  <Route path="/terms" element={<TermsConditions />} />
                  {/* Custom domain route */}
                  <Route path="/:customDomain" element={<CustomDomainRedirect />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                  <CookieConsentBanner />
                </BrowserRouter>
                </MaintenanceModeGuard>
              </SubscriptionProvider>
            </AdminProvider>
          </AuthProvider>
        </DirectionWrapper>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;
