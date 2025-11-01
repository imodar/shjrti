import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/themes/modern/index.css'
import './styles/themes/professional/index.css'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { DatePreferenceProvider } from './contexts/DatePreferenceContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { PaymentGatewayProvider } from './contexts/PaymentGatewayContext'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <DatePreferenceProvider>
          <SubscriptionProvider>
            <PaymentGatewayProvider>
              <App />
            </PaymentGatewayProvider>
          </SubscriptionProvider>
        </DatePreferenceProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
