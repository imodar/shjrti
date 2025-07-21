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
    
    // Debug logging
    console.log('RTL Direction applied:', direction, 'Language:', currentLanguage);
    console.log('Document dir attribute:', document.documentElement.dir);
    
    // Apply font class for Arabic
    if (direction === 'rtl') {
      document.documentElement.classList.add('font-arabic');
      document.body.classList.add('rtl-layout');
    } else {
      document.documentElement.classList.remove('font-arabic');
      document.body.classList.remove('rtl-layout');
    }
    
    return () => {
      // Cleanup on unmount
      document.documentElement.classList.remove('font-arabic');
      document.body.classList.remove('rtl-layout');
    };
  }, [direction, currentLanguage]);

  return <>{children}</>;
}