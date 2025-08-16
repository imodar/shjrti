import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeVariant = 'modern' | 'professional';

interface ThemeContextType {
  currentTheme: ThemeVariant;
  setCurrentTheme: (theme: ThemeVariant) => void;
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
  const [currentStyleElement, setCurrentStyleElement] = useState<HTMLLinkElement | null>(null);

  const themes: Record<ThemeVariant, string> = {
    modern: 'theme-modern',
    professional: 'theme-professional'
  };

  const loadThemeCSS = (theme: ThemeVariant) => {
    // Remove existing theme classes
    document.documentElement.classList.remove('theme-modern', 'theme-professional');
    // Apply new theme class
    document.documentElement.classList.add(themes[theme]);
  };

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('selected-theme') as ThemeVariant;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Load the appropriate theme CSS
    loadThemeCSS(currentTheme);
    // Save to localStorage
    localStorage.setItem('selected-theme', currentTheme);
  }, [currentTheme]);

  const handleSetTheme = (theme: ThemeVariant) => {
    setCurrentTheme(theme);
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setCurrentTheme: handleSetTheme,
      themes
    }}>
      {children}
    </ThemeContext.Provider>
  );
};