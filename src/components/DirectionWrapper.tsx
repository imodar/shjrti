import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DirectionWrapperProps {
  children: React.ReactNode;
}

export function DirectionWrapper({ children }: DirectionWrapperProps) {
  const { direction, currentLanguage } = useLanguage();

  useEffect(() => {
    // Only update if values actually changed to prevent unnecessary DOM manipulation
    const currentDir = document.documentElement.dir;
    const currentLang = document.documentElement.lang;
    
    if (currentDir !== direction || currentLang !== currentLanguage) {
      // Apply direction and language to document element
      document.documentElement.dir = direction;
      document.documentElement.lang = currentLanguage;
      
      // Apply font class for Arabic
      if (direction === 'rtl') {
        document.documentElement.classList.add('font-arabic');
        document.body.classList.add('rtl-layout');
      } else {
        document.documentElement.classList.remove('font-arabic');
        document.body.classList.remove('rtl-layout');
      }
    }
  }, [direction, currentLanguage]);

  return <>{children}</>;
}