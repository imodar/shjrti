import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface Collaborator {
  id: string;
  initial: string;
  color?: string;
}

interface RootOption {
  id: string;
  label: string;
}

interface StitchFamilyBarProps {
  familyName?: string;
  onSwitchTree?: () => void;
  collaborators?: Collaborator[];
  additionalCount?: number;
  lastUpdated?: string;
  // Tree root selection (only shown when provided)
  showRootSelector?: boolean;
  rootOptions?: RootOption[];
  selectedRoot?: string;
  onRootChange?: (rootId: string) => void;
}

export const StitchFamilyBar: React.FC<StitchFamilyBarProps> = ({
  familyName = 'Al-Saeed',
  onSwitchTree,
  collaborators = [],
  additionalCount = 0,
  lastUpdated = '2h ago',
  showRootSelector = false,
  rootOptions = [],
  selectedRoot = 'all',
  onRootChange
}) => {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Get selected option label
  const getSelectedLabel = () => {
    if (selectedRoot === 'all') {
      return t('tree_view.all_branches', 'All Branches');
    }
    const option = rootOptions.find(o => o.id === selectedRoot);
    return option?.label || t('tree_view.select_root', 'Select Root');
  };

  // Default collaborators if none provided
  const displayCollaborators = collaborators.length > 0 ? collaborators : [
    { id: '1', initial: 'S' },
    { id: '2', initial: 'M', color: 'text-primary' },
    { id: '3', initial: 'A', color: 'text-secondary' }
  ];

  const displayAdditionalCount = additionalCount > 0 ? additionalCount : 5;

  return (
    <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-40 relative">
      <div className="flex items-center gap-4">
        

        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">account_tree</span>
          <h2 className="family-title text-xl font-semibold text-slate-800 dark:text-slate-100 italic" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('stitch.family_of', 'Family of')} {familyName}
          </h2>
        </div>

        {/* Root Selector - Only shown on tree view */}
        {showRootSelector && rootOptions.length > 0 && (
          <>
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <div className="flex items-center gap-0">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
                    <span className="material-icons-round text-lg text-slate-400">family_restroom</span>
                    <span className="text-xs font-semibold uppercase tracking-wider">{getSelectedLabel()}</span>
                    <span className="material-icons-round text-lg">expand_more</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg z-[100]" align="start">
                  <Command>
                    <CommandInput placeholder={t('tree_view.search_branch', 'Search branch...')} className="h-9" />
                    <CommandList>
                      <CommandEmpty>{t('tree_view.no_results', 'No results found')}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            onRootChange?.('all');
                            setOpen(false);
                          }}
                          className="text-xs cursor-pointer"
                        >
                          <span className="material-icons-round text-sm text-primary me-2">account_tree</span>
                          {t('tree_view.all_branches', 'All Branches')}
                        </CommandItem>
                        {rootOptions.map(option => (
                          <CommandItem
                            key={option.id}
                            value={option.label}
                            onSelect={() => {
                              onRootChange?.(option.id);
                              setOpen(false);
                            }}
                            className="text-xs cursor-pointer"
                          >
                            <span className="material-icons-round text-sm text-pink-500 me-2">favorite</span>
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Collaborators */}
        <div className="flex -space-x-2">
          {displayCollaborators.map((collab) => (
            <div 
              key={collab.id}
              className={`w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold ${collab.color || ''}`}
            >
              {collab.initial}
            </div>
          ))}
          {displayAdditionalCount > 0 && (
            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
              +{displayAdditionalCount}
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-400 font-medium">{t('stitch.last_updated', 'Last updated')}: {lastUpdated}</p>
      </div>
    </div>
  );
};

export default StitchFamilyBar;
