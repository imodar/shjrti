import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type ThemeVariant = 'modern' | 'professional';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  currentTheme: ThemeVariant;
  currentMode: ThemeMode;
  setCurrentTheme: (theme: ThemeVariant) => void;
  setCurrentMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  themes: Record<ThemeVariant, string>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeVariant>('modern');
  const [currentMode, setCurrentMode] = useState<ThemeMode>('light');
  const [currentStyleElement, setCurrentStyleElement] = useState<HTMLLinkElement | null>(null);
  const { user } = useAuth();

  const themes: Record<ThemeVariant, string> = {
    modern: 'theme-modern',
    professional: 'theme-professional'
  };

  const loadThemeCSS = (theme: ThemeVariant) => {
    // Remove existing theme link if it exists
    if (currentStyleElement) {
      currentStyleElement.remove();
    }

    // Create new link element for the theme
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = `/src/styles/themes/${theme}/index.css`;
    document.head.appendChild(linkElement);
    setCurrentStyleElement(linkElement);

    // Remove existing theme classes
    document.documentElement.classList.remove('theme-modern', 'theme-professional', 'dark', 'light');
    // Apply new theme class
    document.documentElement.classList.add(themes[theme]);
  };

  const applyMode = (mode: ThemeMode) => {
    // Remove existing mode classes
    document.documentElement.classList.remove('dark', 'light');
    // Apply new mode class
    document.documentElement.classList.add(mode);
    // Also set data attribute for CSS selectors
    document.documentElement.setAttribute('data-theme', mode);
  };

  // Save theme preferences to backend
  const savePreferences = async (theme: ThemeVariant, mode: ThemeMode) => {
    if (user) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            theme_variant: theme,
            theme_mode: mode,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
      } catch (error) {
        console.error('Error saving theme preferences:', error);
      }
    }
    // Also save to localStorage as fallback
    localStorage.setItem('selected-theme', theme);
    localStorage.setItem('selected-mode', mode);
  };

  // Load theme preferences from backend
  const loadPreferences = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme_variant, theme_mode')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          if (data.theme_variant) setCurrentTheme(data.theme_variant as ThemeVariant);
          if (data.theme_mode) setCurrentMode(data.theme_mode as ThemeMode);
          return;
        }
      } catch (error) {
        console.error('Error loading theme preferences:', error);
      }
    }
    
    // Fallback to localStorage
    const savedTheme = localStorage.getItem('selected-theme') as ThemeVariant;
    const savedMode = localStorage.getItem('selected-mode') as ThemeMode;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    if (savedMode && ['light', 'dark'].includes(savedMode)) {
      setCurrentMode(savedMode);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user]);

  useEffect(() => {
    // Load the appropriate theme CSS and apply mode
    loadThemeCSS(currentTheme);
    applyMode(currentMode);
    // Save preferences
    savePreferences(currentTheme, currentMode);
  }, [currentTheme, currentMode]);

  const handleSetTheme = (theme: ThemeVariant) => {
    setCurrentTheme(theme);
  };

  const handleSetMode = (mode: ThemeMode) => {
    setCurrentMode(mode);
  };

  const toggleMode = () => {
    setCurrentMode(currentMode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      currentMode,
      setCurrentTheme: handleSetTheme,
      setCurrentMode: handleSetMode,
      toggleMode,
      themes
    }}>
      {children}
    </ThemeContext.Provider>
  );
};