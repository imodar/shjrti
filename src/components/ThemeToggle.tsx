import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { currentMode, toggleMode } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleMode}
      className="relative p-2 h-9 w-9"
      title={currentMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <Sun className={`h-4 w-4 transition-all ${currentMode === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
      <Moon className={`absolute h-4 w-4 transition-all ${currentMode === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle;