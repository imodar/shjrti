import React from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const ThemeSelector: React.FC = () => {
  const { currentTheme, currentMode, setCurrentTheme } = useTheme();

  const themeOptions = [
    { value: 'modern', label: 'Modern', description: 'Clean green design' },
    { value: 'professional', label: 'Professional', description: 'Facebook-like blue theme' }
  ];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themeOptions.map((theme) => (
            <DropdownMenuItem
              key={theme.value}
              onClick={() => setCurrentTheme(theme.value as 'modern' | 'professional')}
              className={`cursor-pointer ${currentTheme === theme.value ? 'bg-accent' : ''}`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{theme.label}</span>
                <span className="text-sm text-muted-foreground">{theme.description}</span>
              </div>
              {currentTheme === theme.value && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ThemeToggle />
    </div>
  );
};

export default ThemeSelector;