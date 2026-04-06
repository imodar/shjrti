import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const TreeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-primary">
    <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 1.54.77 2.9 1.94 3.72C7.55 11.18 6 13.13 6 15.5 6 18.54 8.46 21 11.5 21H12v-2h-.5C9.57 19 8 17.43 8 15.5c0-1.93 1.57-3.5 3.5-3.5H12v-2h-.5a2.5 2.5 0 0 1 0-5H12V3h.5a2.5 2.5 0 0 1 0 5H12v2h.5c1.93 0 3.5 1.57 3.5 3.5 0 1.93-1.57 3.5-3.5 3.5H12v2h.5c2.76 0 5-2.24 5-5 0-2.37-1.55-4.32-3.44-5.28A4.48 4.48 0 0 0 16.5 6.5C16.5 4 14.5 2 12 2z"/>
  </svg>
);

interface LoadingStep {
  id: string;
  labelAr: string;
  labelEn: string;
  completed: boolean;
}

interface DashboardLoaderProps {
  steps: LoadingStep[];
  onComplete?: () => void;
}

const DashboardLoader: React.FC<DashboardLoaderProps> = ({ steps, onComplete }) => {
  const { currentLanguage } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  // Find current active step (first incomplete)
  const currentStepIndex = steps.findIndex(s => !s.completed);
  const allDone = currentStepIndex === -1;
  const completedCount = steps.filter(s => s.completed).length;

  // Animate progress bar based on completed steps
  useEffect(() => {
    if (allDone) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 400);
      return () => clearTimeout(timer);
    } else {
      // Each step has equal weight, animate within current step
      const baseProgress = (completedCount / steps.length) * 100;
      setProgress(baseProgress);

      // Slowly creep within current step (simulates waiting)
      const stepWeight = 100 / steps.length;
      let creep = 0;
      const interval = setInterval(() => {
        creep = Math.min(creep + 0.5, stepWeight * 0.85); // max 85% of step
        setProgress(baseProgress + creep);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [completedCount, allDone, steps.length]);

  if (!visible) return null;

  const currentStep = allDone ? steps[steps.length - 1] : steps[currentStepIndex];
  const currentLabel = currentLanguage === 'ar' ? currentStep.labelAr : currentStep.labelEn;

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center transition-opacity duration-500 ${allDone ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full max-w-md px-6">
        {/* Logo / Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <TreeIcon />
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step.completed
                  ? 'w-8 bg-primary'
                  : i === currentStepIndex
                  ? 'w-8 bg-primary/40'
                  : 'w-4 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Current step label */}
        <p className="text-center text-sm font-medium text-muted-foreground mb-4 h-5 transition-all duration-300">
          {currentLabel}
        </p>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              boxShadow: '0 0 8px hsl(var(--primary) / 0.4)',
            }}
          />
        </div>

        {/* Percentage */}
        <p className="text-center text-[10px] font-bold text-muted-foreground mt-3 tabular-nums tracking-widest uppercase">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
};

export default DashboardLoader;
