import React, { useState, useEffect } from 'react';
import { TreePine } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
            <TreePine className="w-9 h-9 text-primary" />
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
