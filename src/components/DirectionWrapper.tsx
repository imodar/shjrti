import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DirectionWrapperProps {
  children: React.ReactNode;
}

export function DirectionWrapper({ children }: DirectionWrapperProps) {
  const { direction, currentLanguage } = useLanguage();

  useEffect(() => {
    // Apply direction and language to document element
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage;
    
    // Apply font class for Arabic
    if (direction === 'rtl') {
      document.documentElement.classList.add('font-arabic');
    } else {
      document.documentElement.classList.remove('font-arabic');
    }
    
    return () => {
      // Cleanup on unmount
      document.documentElement.classList.remove('font-arabic');
    };
  }, [direction, currentLanguage]);

  return <>{children}</>;
}