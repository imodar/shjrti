
import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import IndexBackup from "./pages/IndexBackup";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardBackup from "./pages/DashboardBackup";
import FamilyCreator from "./pages/FamilyCreator";
import FamilyBuilder from "./pages/FamilyBuilder";
import FamilyBuilder2 from "./pages/FamilyBuilder2";
import Profile from "./pages/Profile";
import Payments from "./pages/Payments";
import Payments2 from "./pages/Payments2";
import PlanSelection from "./pages/PlanSelection";
import Payment from "./pages/Payment";
import ChangePassword from "./pages/ChangePassword";
import Terms from "./pages/Terms";
import ViewTree from "./pages/ViewTree";
import Store from "./pages/Store";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <ProtectedRoute>
              <FamilyCreator />
            </ProtectedRoute>
          } />
          <Route path="/family-builder" element={
            <ProtectedRoute>
              <FamilyBuilder />
            </ProtectedRoute>
          } />
          <Route path="/family-builder2" element={
            <ProtectedRoute>
              <FamilyBuilder2 />
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
          <Route path="/payments2" element={
            <ProtectedRoute>
              <Payments2 />
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
          <Route path="/view-tree" element={
            <ProtectedRoute>
              <ViewTree />
            </ProtectedRoute>
          } />
          <Route path="/store" element={
            <ProtectedRoute>
              <Store />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="/terms" element={<Terms />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
