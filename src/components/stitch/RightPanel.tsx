import React from 'react';
import { cn } from '@/lib/utils';

interface StitchRightPanelProps {
  completenessPercentage?: number;
  generationsCount?: number;
  documentsCount?: number;
  pendingSuggestions?: number;
  familyDistribution?: {
    label: string;
    percentage: number;
    color: string;
  }[];
}

export const StitchRightPanel: React.FC<StitchRightPanelProps> = ({
  completenessPercentage = 68,
  generationsCount = 14,
  documentsCount = 82,
  pendingSuggestions = 3,
  familyDistribution = [
    { label: 'Saudi Arabia', percentage: 65, color: 'bg-primary' },
    { label: 'United Arab Emirates', percentage: 20, color: 'bg-blue-400' },
    { label: 'Others', percentage: 15, color: 'bg-amber-400' }
  ]
}) => {
  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col p-6 overflow-y-auto hidden xl:flex custom-scrollbar">
      {/* Growth Statistics */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Growth Statistics</h3>
          <span className="material-symbols-outlined text-slate-400 text-sm">trending_up</span>
        </div>
        <div className="space-y-4">
          {/* Completeness */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
            <div className="flex justify-between items-end mb-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tree Completeness</p>
              <p className="text-sm font-bold text-primary">{completenessPercentage}%</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full" 
                style={{ width: `${completenessPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center">
              <p className="text-lg font-bold">{generationsCount}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Generations</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center">
              <p className="text-lg font-bold">{documentsCount}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Suggestions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Pending Suggestions</h3>
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">{pendingSuggestions} New</span>
        </div>
        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-br from-primary/5 to-emerald-500/10 rounded-2xl border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons-round text-primary text-sm">auto_awesome</span>
              <h4 className="font-bold text-xs text-primary">Potential Match</h4>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              We found a match for <span className="font-bold">Abdullah Al-Saeed</span> in the Al-Rahman Public Tree.
            </p>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-1.5 bg-white dark:bg-slate-800 border border-primary/30 text-primary text-[10px] font-bold rounded-lg hover:bg-primary hover:text-white transition-all">
                Compare
              </button>
              <button className="p-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg text-slate-400">
                <span className="material-icons-round text-sm">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Family Distribution */}
      <div>
        <h3 className="font-bold mb-4">Family Distribution</h3>
        <div className="space-y-4">
          {familyDistribution.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={cn('w-2 h-2 rounded-full', item.color)} />
              <div className="flex-1 text-xs font-medium">{item.label}</div>
              <div className="text-xs font-bold">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default StitchRightPanel;
