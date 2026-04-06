import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { CookieConsentProvider } from './contexts/CookieConsentContext'
import { PublicSettingsProvider } from './contexts/PublicSettingsContext'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PublicSettingsProvider>
      <ThemeProvider>
        <CookieConsentProvider>
          <App />
        </CookieConsentProvider>
      </ThemeProvider>
    </PublicSettingsProvider>
  </React.StrictMode>
);
