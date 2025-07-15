import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home2 from "./pages/Home2";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Dashboard2 from "./pages/Dashboard2";
import FamilyBuilder from "./pages/FamilyBuilder";
import FamilyBuilder2 from "./pages/FamilyBuilder2";
import Profile from "./pages/Profile";
import Payments from "./pages/Payments";
import Payments2 from "./pages/Payments2";
import PlanSelection from "./pages/PlanSelection";
import Payment from "./pages/Payment";
import ChangePassword from "./pages/ChangePassword";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home2" element={<Home2 />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard2" element={<Dashboard2 />} />
          <Route path="/family-builder" element={<FamilyBuilder />} />
          <Route path="/family-builder2" element={<FamilyBuilder2 />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/payments2" element={<Payments2 />} />
          <Route path="/plan-selection" element={<PlanSelection />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/terms" element={<Terms />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
