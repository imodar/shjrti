import * as React from "react";
import { Suspense } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import { FamilyDataProvider } from "@/contexts/FamilyDataContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedFamilyRoute } from "@/components/ProtectedFamilyRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import DashboardBackup from "./pages/DashboardBackup";
import StitchDashboard from "./pages/StitchDashboard";
import FamilyBuilderStitch from "./pages/FamilyBuilderStitch";
import StitchTreeView from "./pages/StitchTreeView";
import StitchAccount from "./pages/StitchAccount";
import StitchPublicTree from "./pages/StitchPublicTree";
import StitchFamilyCreator from "./pages/StitchFamilyCreator";
import StitchLoadingFallback from "./components/stitch/StitchLoadingFallback";
import StitchLayout from "./components/stitch/StitchLayout";
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
import NotFound from "./pages/NotFound";
import AcceptInvitation from "./pages/AcceptInvitation";

// Lazy-loaded admin pages (code splitting)
const EnhancedAdminPanel = React.lazy(() => import('./pages/EnhancedAdminPanel'));
const AdminBilling = React.lazy(() => import('./pages/AdminBilling'));
const AdminAPISettings = React.lazy(() => import('./pages/AdminAPISettings'));
const AdminSocialMedia = React.lazy(() => import('./pages/AdminSocialMedia'));
const AdminSEOSettings = React.lazy(() => import('./pages/AdminSEOSettings'));
const AdminNewsletterSubscriptions = React.lazy(() => import('./pages/AdminNewsletterSubscriptions'));
const AdminRefunds = React.lazy(() => import('./pages/AdminRefunds'));
const ApiDocs = React.lazy(() => import('./pages/ApiDocs'));

const LazySpinner = (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const FamilyBuilderStitchWithProvider: React.FC = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');
  return (
    <FamilyDataProvider familyId={familyId}>
      <FamilyBuilderStitch />
    </FamilyDataProvider>
  );
};

const StitchTreeViewWithProvider: React.FC = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');
  return (
    <FamilyDataProvider familyId={familyId}>
      <StitchTreeView />
    </FamilyDataProvider>
  );
};

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/dashboard-backup" element={<ProtectedRoute><DashboardBackup /></ProtectedRoute>} />

    <Route element={<ProtectedRoute><StitchLayout /></ProtectedRoute>}>
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

    <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
    <Route path="/plan-selection" element={<ProtectedRoute><PlanSelection /></ProtectedRoute>} />
    <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
    <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
    <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
    <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />

    <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><Suspense fallback={LazySpinner}><EnhancedAdminPanel /></Suspense></ProtectedRoute>} />
    <Route path="/admin/billing" element={<ProtectedRoute requireAdmin={true}><Suspense fallback={LazySpinner}><AdminBilling /></Suspense></ProtectedRoute>} />
    <Route path="/admin-api-settings" element={<ProtectedRoute requireAdmin={true}><Suspense fallback={LazySpinner}><AdminAPISettings /></Suspense></ProtectedRoute>} />
    <Route path="/admin/social-media" element={<ProtectedRoute requireAdmin={true}><Suspense fallback={LazySpinner}><AdminSocialMedia /></Suspense></ProtectedRoute>} />
    <Route path="/admin/seo" element={<ProtectedRoute requireAdmin={true}><Suspense fallback={LazySpinner}><AdminSEOSettings /></Suspense></ProtectedRoute>} />
    <Route path="/admin/newsletter" element={<ProtectedRoute requireAdmin={true}><Suspense fallback={LazySpinner}><AdminNewsletterSubscriptions /></Suspense></ProtectedRoute>} />
    <Route path="/admin/refunds" element={<ProtectedRoute requireAdmin={true}><Suspense fallback={LazySpinner}><AdminRefunds /></Suspense></ProtectedRoute>} />

    <Route path="/renew-subscription" element={<ProtectedRoute><RenewSubscription /></ProtectedRoute>} />
    <Route path="/terms-conditions" element={<TermsConditions />} />
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/contact" element={<ContactUs />} />
    <Route path="/api-docs" element={<Suspense fallback={LazySpinner}><ApiDocs /></Suspense>} />
    <Route path="/accept-invitation" element={<AcceptInvitation />} />
    <Route path="/tree" element={<StitchPublicTree />} />
    <Route path="/share" element={<StitchPublicTree />} />
    <Route path="/stitch-tree" element={<StitchPublicTree />} />
    <Route path="/terms" element={<TermsConditions />} />
    <Route path="/404" element={<NotFound />} />
    <Route path="/:customDomain" element={<CustomDomainRedirect />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);