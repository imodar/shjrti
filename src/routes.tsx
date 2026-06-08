import * as React from "react";
import { Suspense } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import { FamilyDataProvider } from "@/contexts/FamilyDataContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedFamilyRoute } from "@/components/ProtectedFamilyRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import StitchDashboard from "./pages/StitchDashboard";
import StitchLoadingFallback from "./components/stitch/StitchLoadingFallback";
import StitchLayout from "./components/stitch/StitchLayout";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";
import CustomDomainRedirect from "./pages/CustomDomainRedirect";
import NotFound from "./pages/NotFound";
import AcceptInvitation from "./pages/AcceptInvitation";

// Lazy-loaded heavy pages (code splitting)
const DashboardBackup = React.lazy(() => import('./pages/DashboardBackup'));
const FamilyBuilderStitch = React.lazy(() => import('./pages/FamilyBuilderStitch'));
const StitchTreeView = React.lazy(() => import('./pages/StitchTreeView'));
const StitchAccount = React.lazy(() => import('./pages/StitchAccount'));
const StitchPublicTree = React.lazy(() => import('./pages/StitchPublicTree'));
const StitchFamilyCreator = React.lazy(() => import('./pages/StitchFamilyCreator'));
const Payments = React.lazy(() => import('./pages/Payments'));
const PlanSelection = React.lazy(() => import('./pages/PlanSelection'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'));
const Payment = React.lazy(() => import('./pages/Payment'));
const ChangePassword = React.lazy(() => import('./pages/ChangePassword'));
const Store = React.lazy(() => import('./pages/Store'));
const RenewSubscription = React.lazy(() => import('./pages/RenewSubscription'));

// Lazy-loaded admin pages
const EnhancedAdminPanel = React.lazy(() => import('./pages/EnhancedAdminPanel'));
const AdminBilling = React.lazy(() => import('./pages/AdminBilling'));
const AdminAPISettings = React.lazy(() => import('./pages/AdminAPISettings'));
const AdminSocialMedia = React.lazy(() => import('./pages/AdminSocialMedia'));
const AdminSEOSettings = React.lazy(() => import('./pages/AdminSEOSettings'));
const AdminNewsletterSubscriptions = React.lazy(() => import('./pages/AdminNewsletterSubscriptions'));
const AdminRefunds = React.lazy(() => import('./pages/AdminRefunds'));
const AdminStoreOrders = React.lazy(() => import('./pages/AdminStoreOrders'));
const ApiDocs = React.lazy(() => import('./pages/ApiDocs'));
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const AdminNotFound = React.lazy(() => import('./pages/admin/AdminNotFound'));
const AdminSkeleton = React.lazy(() => import('./components/admin/AdminSkeleton'));
const AdminPaymentAnalytics = React.lazy(() => import('./pages/AdminPaymentAnalytics'));
const AdminUserStatistics = React.lazy(() => import('./pages/AdminUserStatistics'));
const AdminEmailLogs = React.lazy(() => import('./pages/AdminEmailLogs'));
const AdminEmailTemplates = React.lazy(() => import('./pages/AdminEmailTemplates'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

const AdminIndex: React.FC = () => {
  const [searchParams] = useSearchParams();
  const hasTab = searchParams.has('tab');
  return hasTab ? <EnhancedAdminPanel /> : <AdminDashboard />;
};

const LazySpinner = (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const AdminFallback = (
  <Suspense fallback={null}>
    <AdminSkeleton />
  </Suspense>
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
  <Suspense fallback={<StitchLoadingFallback />}>
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

    <Route element={<ProtectedRoute requireAdmin={true}><Suspense fallback={LazySpinner}><AdminLayout /></Suspense></ProtectedRoute>}>
      <Route path="/admin" element={<Suspense fallback={AdminFallback}><AdminIndex /></Suspense>} />
      <Route path="/admin/billing" element={<Suspense fallback={AdminFallback}><AdminBilling /></Suspense>} />
      <Route path="/admin-api-settings" element={<Suspense fallback={AdminFallback}><AdminAPISettings /></Suspense>} />
      <Route path="/admin/social-media" element={<Suspense fallback={AdminFallback}><AdminSocialMedia /></Suspense>} />
      <Route path="/admin/seo" element={<Suspense fallback={AdminFallback}><AdminSEOSettings /></Suspense>} />
      <Route path="/admin/newsletter" element={<Suspense fallback={AdminFallback}><AdminNewsletterSubscriptions /></Suspense>} />
      <Route path="/admin/refunds" element={<Suspense fallback={AdminFallback}><AdminRefunds /></Suspense>} />
      <Route path="/admin/store-orders" element={<Suspense fallback={AdminFallback}><AdminStoreOrders /></Suspense>} />
      <Route path="/admin/analytics" element={<Suspense fallback={AdminFallback}><AdminPaymentAnalytics /></Suspense>} />
      <Route path="/admin/user-statistics" element={<Suspense fallback={AdminFallback}><AdminUserStatistics /></Suspense>} />
      <Route path="/admin/email-logs" element={<Suspense fallback={AdminFallback}><AdminEmailLogs /></Suspense>} />
      <Route path="/admin/email-templates" element={<Suspense fallback={AdminFallback}><AdminEmailTemplates /></Suspense>} />
      <Route path="/admin/*" element={<Suspense fallback={AdminFallback}><AdminNotFound /></Suspense>} />
    </Route>

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
  </Suspense>
);