import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Heart, HeartCrack } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DropdownOption {
  value: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  // New structured layout fields
  familyMember?: string;
  spouse?: string;
  heartIcon?: 'heart' | 'heart-crack';
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onValueChange,
  placeholder = "اختر عنصر",
  disabled = false,
  className,
  searchPlaceholder = "ابحث...",
  emptyMessage = "لا توجد نتائج"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = options.filter(option => {
    const searchLower = searchQuery.toLowerCase();
    // Search in label (backward compatibility) or in structured fields
    if (option.label) {
      return option.label.toLowerCase().includes(searchLower);
    }
    // Search in structured data
    const familyMatch = option.familyMember?.toLowerCase().includes(searchLower);
    const spouseMatch = option.spouse?.toLowerCase().includes(searchLower);
    return familyMatch || spouseMatch;
  });

  // Find selected option
  const selectedOption = options.find(option => option.value === value);

  // Close dropdown when clicking outside
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "w-full justify-between h-11 rounded-lg border-2 border-border hover:border-primary/50",
          "focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm",
          "text-right font-arabic",
          isOpen && "border-primary ring-2 ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={cn(
          "truncate text-right flex-1",
          !selectedOption && "text-muted-foreground"
        )}>
          {selectedOption ? (
            selectedOption.familyMember ? (
              <div className="flex items-center justify-between w-full text-sm">
                <span className="text-right">{selectedOption.spouse || 'غير محدد'}</span>
                <span className="mx-2">
                  {selectedOption.heartIcon === 'heart-crack' ? (
                    <HeartCrack className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Heart className="h-3 w-3 text-pink-500" />
                  )}
                </span>
                <span className="text-right">{selectedOption.familyMember}</span>
              </div>
            ) : (
              selectedOption.label
            )
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 ml-2 transition-transform duration-200",
          isOpen && "transform rotate-180"
        )} />
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 bg-background border-2 border-border shadow-lg">
          <CardContent className="p-0">
            {/* Search Bar */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pr-10 pl-8 h-9 rounded-md border-border font-arabic text-right"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <div className="py-1">
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={cn(
                        "w-full px-3 py-2 text-right hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground outline-none transition-colors",
                        "flex items-center justify-between font-arabic",
                        option.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                        value === option.value && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      {option.familyMember ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-right truncate">{option.spouse || 'غير محدد'}</span>
                          <span className="mx-2 flex-shrink-0">
                            {option.heartIcon === 'heart-crack' ? (
                              <HeartCrack className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Heart className="h-4 w-4 text-pink-500" />
                            )}
                          </span>
                          <span className="text-right truncate">{option.familyMember}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 w-full">
                          <span className="truncate">{option.label}</span>
                          {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground font-arabic">
                  {emptyMessage}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};