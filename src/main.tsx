import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { PublicSettingsProvider } from './contexts/PublicSettingsContext'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PublicSettingsProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </PublicSettingsProvider>
  </React.StrictMode>
);
