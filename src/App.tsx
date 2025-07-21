
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
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import IndexBackup from "./pages/IndexBackup";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardBackup from "./pages/DashboardBackup";
import FamilyCreator from "./pages/FamilyCreator";
import FamilyBuilder from "./pages/FamilyBuilder";

import FamilyTreeView from "./pages/FamilyTreeView";
import FamilyStatistics from "./pages/FamilyStatistics";
import Profile from "./pages/Profile";
import Payments from "./pages/Payments";
import PlanSelection from "./pages/PlanSelection";
import Payment from "./pages/Payment";
import ChangePassword from "./pages/ChangePassword";
import Terms from "./pages/Terms";
import Store from "./pages/Store";
import EnhancedAdminPanel from "./pages/EnhancedAdminPanel";
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
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
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
                    <FamilyBuilder />
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
                <Route path="/renew-subscription" element={
                  <ProtectedRoute>
                    <RenewSubscription />
                  </ProtectedRoute>
                } />
                <Route path="/terms" element={<Terms />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SubscriptionProvider>
          </AuthProvider>
        </DirectionWrapper>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
