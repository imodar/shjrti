import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { DatePreferenceProvider } from "@/contexts/DatePreferenceContext";
import { PaymentGatewayProvider } from "@/contexts/PaymentGatewayContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import { DirectionWrapper } from "@/components/DirectionWrapper";
import { MaintenanceModeGuard } from "@/components/MaintenanceModeGuard";

const queryClient = new QueryClient();

/**
 * AppProviders centralizes all global context providers.
 * Order matters: outer providers wrap inner ones.
 */
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <DirectionWrapper>
          <AuthProvider>
            <CookieConsentProvider>
              <DatePreferenceProvider>
                <AdminProvider>
                  <SubscriptionProvider>
                    <PaymentGatewayProvider>
                      <MaintenanceModeGuard>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>{children}</BrowserRouter>
                      </MaintenanceModeGuard>
                    </PaymentGatewayProvider>
                  </SubscriptionProvider>
                </AdminProvider>
              </DatePreferenceProvider>
            </CookieConsentProvider>
          </AuthProvider>
        </DirectionWrapper>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);