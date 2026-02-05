import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        {/* Back to Dashboard - First on the right in RTL */}
        <button 
          onClick={() => navigate('/dashboard?theme=stitch')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 group"
        >
          <span className={`material-icons-round text-lg ${direction === 'rtl' ? 'rotate-180' : ''}`}>arrow_back</span>
          <span className="text-xs font-semibold uppercase tracking-wider">{t('stitch.back_to_dashboard', 'عودة للحساب')}</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>

        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">account_tree</span>
          <h2 className="family-title text-xl font-semibold text-slate-800 dark:text-slate-100 italic" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('stitch.family_of', 'Family of')} {familyName}
          </h2>
        </div>
        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
        <button 
          onClick={onSwitchTree}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 group"
        >
          <span className="text-xs font-semibold uppercase tracking-wider">{t('stitch.switch_tree', 'Switch Tree')}</span>
          <span className="material-icons-round text-lg transition-transform group-hover:translate-y-0.5">expand_more</span>
        </button>

        {/* Root Selector - Only shown on tree view */}
        {showRootSelector && rootOptions.length > 0 && (
          <>
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <div className="flex items-center gap-0">
              <Select value={selectedRoot} onValueChange={onRootChange}>
                <SelectTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 border-0 bg-transparent h-auto w-auto shadow-none">
                  <span className="material-icons-round text-lg text-slate-400">family_restroom</span>
                  <SelectValue placeholder={t('tree_view.select_root', 'Select Root')} />
                  <span className="material-icons-round text-lg">expand_more</span>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg z-[100]">
                  <SelectItem value="all" className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-icons-round text-sm text-primary">account_tree</span>
                      {t('tree_view.all_branches', 'All Branches')}
                    </div>
                  </SelectItem>
                  {rootOptions.map(option => (
                    <SelectItem key={option.id} value={option.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="material-icons-round text-sm text-pink-500">favorite</span>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
