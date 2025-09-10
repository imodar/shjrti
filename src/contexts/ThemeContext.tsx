import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeVariant = 'modern' | 'professional' | 'tamara';

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
  const [currentTheme, setCurrentTheme] = useState<ThemeVariant>('tamara');
  const [currentStyleElement, setCurrentStyleElement] = useState<HTMLLinkElement | null>(null);

  const themes: Record<ThemeVariant, string> = {
    modern: 'theme-modern',
    professional: 'theme-professional',
    tamara: 'theme-tamara'
  };

  const loadThemeCSS = async (theme: ThemeVariant) => {
    // Remove existing theme classes
    document.documentElement.classList.remove('theme-modern', 'theme-professional', 'theme-tamara');
    
    // Remove existing theme CSS
    if (currentStyleElement) {
      currentStyleElement.remove();
      setCurrentStyleElement(null);
    }
    
    // Load the theme-specific CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `/src/styles/themes/${theme}/index.css`;
    link.setAttribute('data-theme', theme);
    
    document.head.appendChild(link);
    setCurrentStyleElement(link);
    
    // Apply theme class
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