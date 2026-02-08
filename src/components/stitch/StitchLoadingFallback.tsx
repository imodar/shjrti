import React from 'react';
import DashboardLoader from '@/components/stitch/DashboardLoader';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * A loading fallback for stitch routes that uses the dynamic progress loader
 * instead of the old skeleton layout. Shows a single "verifying access" step.
 */
const StitchLoadingFallback: React.FC = () => {
  const { currentLanguage } = useLanguage();

  const steps = [
    {
      id: 'auth',
      labelAr: 'جاري التحقق من الصلاحيات...',
      labelEn: 'Verifying access...',
      completed: false,
    },
  ];

  return <DashboardLoader steps={steps} />;
};

export default StitchLoadingFallback;
