
import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DirectionWrapper } from "@/components/DirectionWrapper";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedFamilyRoute } from "@/components/ProtectedFamilyRoute";
import { MaintenanceModeGuard } from "@/components/MaintenanceModeGuard";
import ScrollToTop from "@/components/ScrollToTop";
import CustomScriptInjector from "@/components/CustomScriptInjector";
import Index from "./pages/Index";
import IndexBackup from "./pages/IndexBackup";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardBackup from "./pages/DashboardBackup";
import FamilyCreator from "./pages/FamilyCreator";
import FamilyBuilder from "./pages/FamilyBuilder";
import FamilyBuilderNew from "./pages/FamilyBuilderNew";
import TreeSettings from "./pages/TreeSettings";

import FamilyTreeView from "./pages/FamilyTreeView";
import FamilyStatistics from "./pages/FamilyStatistics";
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
import RenewSubscription from "./pages/RenewSubscription";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Disable browser's scroll restoration globally
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <DirectionWrapper>
          <AuthProvider>
            <SubscriptionProvider>
              <MaintenanceModeGuard>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <CustomScriptInjector />
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/home-backup" element={<IndexBackup />} />
                  <Route path="/auth" element={<Auth />} />
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
            <ProtectedRoute requireActiveSubscription={true}>
              <ProtectedFamilyRoute>
                <FamilyBuilderNew />
              </ProtectedFamilyRoute>
            </ProtectedRoute>
          } />
          <Route path="/tree-settings" element={
            <ProtectedRoute requireActiveSubscription={true}>
              <ProtectedFamilyRoute>
                <TreeSettings />
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
                  <Route path="/renew-subscription" element={
                    <ProtectedRoute>
                      <RenewSubscription />
                    </ProtectedRoute>
                  } />
                  <Route path="/terms-conditions" element={<TermsConditions />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/contact" element={<ContactUs />} />
                  {/* Redirect old terms route to new one */}
                  <Route path="/terms" element={<TermsConditions />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </MaintenanceModeGuard>
            </SubscriptionProvider>
          </AuthProvider>
        </DirectionWrapper>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
