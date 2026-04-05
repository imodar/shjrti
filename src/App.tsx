import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { FamilyDataProvider } from "@/contexts/FamilyDataContext";
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
import { DynamicMetaTags } from "@/components/DynamicMetaTags";
import StructuredData from "@/components/StructuredData";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import DashboardBackup from "./pages/DashboardBackup";
import StitchDashboard from "./pages/StitchDashboard";
import FamilyCreator from "./pages/FamilyCreator";
import FamilyBuilder from "./pages/FamilyBuilder";
import FamilyBuilderNewWithContext from "./pages/FamilyBuilderNew/FamilyBuilderNewWithContext";
import FamilyBuilderStitch from "./pages/FamilyBuilderStitch";
import StitchTreeView from "./pages/StitchTreeView";
import StitchAccount from "./pages/StitchAccount";
import StitchPublicTree from "./pages/StitchPublicTree";
import StitchFamilyCreator from "./pages/StitchFamilyCreator";
import StitchLoadingFallback from "./components/stitch/StitchLoadingFallback";
import StitchLayout from "./components/stitch/StitchLayout";

import FamilyTreeView from "./pages/FamilyTreeView/FamilyTreeViewWithContext";
import FamilyStatistics from "./pages/FamilyStatistics";
import FamilySuggestions from "./pages/FamilySuggestions";
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
import RenewSubscription from "./pages/RenewSubscription";
import CustomDomainRedirect from "./pages/CustomDomainRedirect";
import PublicTreeViewWithContext from "./pages/PublicTreeView/PublicTreeViewWithContext";
import NotFound from "./pages/NotFound";
import AcceptInvitation from "./pages/AcceptInvitation";
import { supabase } from "@/integrations/supabase/client";

// Lazy-loaded admin pages (code splitting)
const EnhancedAdminPanel = React.lazy(() => import('./pages/EnhancedAdminPanel'));
const AdminBilling = React.lazy(() => import('./pages/AdminBilling'));
const AdminAPISettings = React.lazy(() => import('./pages/AdminAPISettings'));
const AdminSocialMedia = React.lazy(() => import('./pages/AdminSocialMedia'));
const AdminSEOSettings = React.lazy(() => import('./pages/AdminSEOSettings'));
const AdminNewsletterSubscriptions = React.lazy(() => import('./pages/AdminNewsletterSubscriptions'));
const AdminRefunds = React.lazy(() => import('./pages/AdminRefunds'));
const ApiDocs = React.lazy(() => import('./pages/ApiDocs'));

const queryClient = new QueryClient();

// Disable browser's scroll restoration globally
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

// Wrapper component for FamilyBuilderStitch with FamilyDataProvider
const FamilyBuilderStitchWithProvider: React.FC = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');

  return (
    <FamilyDataProvider familyId={familyId}>
      <FamilyBuilderStitch />
    </FamilyDataProvider>
  );
};

// Wrapper component for StitchTreeView with FamilyDataProvider
const StitchTreeViewWithProvider: React.FC = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');

  return (
    <FamilyDataProvider familyId={familyId}>
      <StitchTreeView />
    </FamilyDataProvider>
  );
};

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
            <DynamicMetaTags />
            <StructuredData />
            <ConsentAwareScriptInjector />
                  {gaId && <GoogleAnalytics measurementId={gaId} />}
                  
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/dashboard-backup" element={
                    <ProtectedRoute>
                      <DashboardBackup />
                    </ProtectedRoute>
                  } />
                  {/* Stitch Theme Routes - shared layout (primary + aliases) */}
                  <Route element={
                    <ProtectedRoute>
                      <StitchLayout />
                    </ProtectedRoute>
                  }>
                    {/* Primary routes */}
                    <Route path="/dashboard" element={<StitchDashboard />} />
                    <Route path="/profile" element={<StitchAccount />} />
                    <Route path="/family-creator" element={<StitchFamilyCreator />} />
                    <Route path="/family-builder" element={
                      <ProtectedFamilyRoute loadingFallback={<StitchLoadingFallback />}>
                        <FamilyBuilderStitchWithProvider />
                      </ProtectedFamilyRoute>
                    } />
                    <Route path="/family-tree-view" element={
                      <ProtectedFamilyRoute loadingFallback={<StitchLoadingFallback />}>
                        <StitchTreeViewWithProvider />
                      </ProtectedFamilyRoute>
                    } />
                    {/* Backward-compatible aliases */}
                    <Route path="/stitch-dashboard" element={<StitchDashboard />} />
                    <Route path="/stitch-account" element={<StitchAccount />} />
                    <Route path="/stitch-family-creator" element={<StitchFamilyCreator />} />
                    <Route path="/stitch-family-builder" element={
                      <ProtectedFamilyRoute loadingFallback={<StitchLoadingFallback />}>
                        <FamilyBuilderStitchWithProvider />
                      </ProtectedFamilyRoute>
                    } />
                    <Route path="/stitch-tree-view" element={
                      <ProtectedFamilyRoute loadingFallback={<StitchLoadingFallback />}>
                        <StitchTreeViewWithProvider />
                      </ProtectedFamilyRoute>
                    } />
                  </Route>
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
                      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                        <EnhancedAdminPanel />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/billing" element={
                    <ProtectedRoute requireAdmin={true}>
                      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                        <AdminBilling />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin-api-settings" element={
                    <ProtectedRoute requireAdmin={true}>
                      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                        <AdminAPISettings />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/social-media" element={
                    <ProtectedRoute requireAdmin={true}>
                      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                        <AdminSocialMedia />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/seo" element={
                    <ProtectedRoute requireAdmin={true}>
                      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                        <AdminSEOSettings />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/newsletter" element={
                    <ProtectedRoute requireAdmin={true}>
                      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                        <AdminNewsletterSubscriptions />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/refunds" element={
                    <ProtectedRoute requireAdmin={true}>
                      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                        <AdminRefunds />
                      </Suspense>
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
                  <Route path="/api-docs" element={
                    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                      <ApiDocs />
                    </Suspense>
                  } />
                  <Route path="/accept-invitation" element={<AcceptInvitation />} />
                  <Route path="/tree" element={<StitchPublicTree />} />
                  <Route path="/share" element={<StitchPublicTree />} />
                  <Route path="/stitch-tree" element={<StitchPublicTree />} />
                  {/* Redirect old terms route to new one */}
                  <Route path="/terms" element={<TermsConditions />} />
                  {/* 404 error page - must be before custom domain route */}
                  <Route path="/404" element={<NotFound />} />
                  {/* Custom domain route */}
                  <Route path="/:customDomain" element={<CustomDomainRedirect />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
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
