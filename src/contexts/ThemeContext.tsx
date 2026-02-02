import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeVariant = 'modern' | 'professional' | 'stitch';

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

  const themes: Record<ThemeVariant, string> = {
    modern: 'theme-modern',
    professional: 'theme-professional',
    stitch: 'theme-stitch'
  };

  const applyTheme = (theme: ThemeVariant) => {
    // Remove existing theme classes
    document.documentElement.classList.remove('theme-modern', 'theme-professional', 'theme-stitch');
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
    // Apply the appropriate theme class
    applyTheme(currentTheme);
    // Save to localStorage
    localStorage.setItem('selected-theme', currentTheme);
    // Expose theme context globally for Profile page
    (window as any).__themeContext = { currentTheme, setCurrentTheme: handleSetTheme };
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