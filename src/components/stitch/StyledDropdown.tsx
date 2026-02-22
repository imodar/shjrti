/**
 * StyledDropdown - Custom styled dropdown matching the Stitch design system
 * Features: search input, grouped options, Material Icons, animations
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
  group?: string;
}

interface StyledDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  accentColor?: 'primary' | 'pink' | 'blue';
}

export const StyledDropdown: React.FC<StyledDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchable = false,
  searchPlaceholder = 'Type to filter...',
  disabled = false,
  className,
  accentColor = 'pink'
}) => {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Color classes based on accent
  const accentClasses = accentColor === 'blue'
    ? {
        border: 'border-blue-500',
        ring: 'focus:ring-blue-500/20 focus:border-blue-500',
        hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600',
        selected: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-medium',
        text: 'text-blue-600'
      }
    : accentColor === 'pink' 
      ? {
          border: 'border-pink-500',
          ring: 'focus:ring-pink-500/20 focus:border-pink-500',
          hover: 'hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600',
          selected: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 font-medium',
          text: 'text-pink-600'
        }
      : {
          border: 'border-primary',
          ring: 'focus:ring-primary/20 focus:border-primary',
          hover: 'hover:bg-primary/10 hover:text-primary',
          selected: 'bg-primary/10 text-primary font-medium',
          text: 'text-primary'
        };

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group options
  const groupedOptions = filteredOptions.reduce((acc, option) => {
    const group = option.group || '';
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {} as Record<string, DropdownOption[]>);

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)} style={{ zIndex: isOpen ? 9999 : 'auto' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border text-sm flex items-center justify-between cursor-pointer transition-all",
          isOpen 
            ? cn(accentClasses.border, "rounded-t-xl") 
            : "border-slate-200 dark:border-slate-700 rounded-xl",
          disabled && "opacity-50 cursor-not-allowed",
          !isOpen && "hover:border-slate-300 dark:hover:border-slate-600"
        )}
      >
        <span className={cn(
          "truncate",
          selectedOption ? "text-slate-900 dark:text-slate-100" : "text-slate-400"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={cn(
          "material-symbols-outlined text-slate-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )}>
          expand_more
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={cn(
          "absolute min-w-[200px] top-full bg-white dark:bg-slate-800 border-x border-b rounded-b-xl shadow-2xl overflow-hidden",
          "animate-in fade-in slide-in-from-top-2 duration-200",
          accentClasses.border,
          isRTL ? "right-0" : "left-0"
        )}
        style={{ zIndex: 9999 }}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <span className={cn(
                  "material-symbols-outlined absolute top-1/2 -translate-y-1/2 text-slate-400 text-sm",
                  isRTL ? "right-2.5" : "left-2.5"
                )}>
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "w-full py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs focus:ring-1 focus:ring-primary/30",
                    isRTL ? "pr-8 pl-4" : "pl-8 pr-4"
                  )}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <React.Fragment key={group || 'default'}>
                {/* Group Header */}
                {group && (
                  <div className="px-4 py-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 first:border-t-0">
                    {group}
                  </div>
                )}
                {/* Group Options */}
                {groupOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm transition-colors flex items-center gap-3",
                      isRTL ? "text-right" : "text-left",
                      value === option.value
                        ? accentClasses.selected
                        : accentClasses.hover
                    )}
                  >
                    {option.icon && (
                      <span className={cn(
                        "material-symbols-outlined text-lg",
                        value === option.value ? "" : "opacity-60"
                      )}>
                        {option.icon}
                      </span>
                    )}
                    {option.label}
                  </button>
                ))}
              </React.Fragment>
            ))}

            {/* Empty State */}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
