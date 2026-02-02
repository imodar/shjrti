import React from 'react';
import { TrendingUp, Bell, Users } from 'lucide-react';
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
    <aside className="stitch-right-panel hidden xl:flex custom-scrollbar">
      {/* Growth Statistics */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Growth Statistics</h3>
          <TrendingUp className="h-4 w-4 text-stitch-muted" />
        </div>
        <div className="space-y-4">
          {/* Completeness */}
          <div className="stat-card p-4">
            <div className="flex justify-between items-end mb-2">
              <p className="text-subheading">Tree Completeness</p>
              <p className="text-sm font-bold text-primary">{completenessPercentage}%</p>
            </div>
            <div className="stitch-progress">
              <div 
                className="stitch-progress-bar" 
                style={{ width: `${completenessPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <p className="text-lg font-bold">{generationsCount}</p>
              <p className="text-subheading">Generations</p>
            </div>
            <div className="stat-card">
              <p className="text-lg font-bold">{documentsCount}</p>
              <p className="text-subheading">Documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Suggestions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Pending Suggestions</h3>
          <span className="stitch-badge new">{pendingSuggestions} New</span>
        </div>
        <div className="space-y-3">
          <div className="suggestion-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons-round text-primary text-sm">auto_awesome</span>
              <h4 className="font-bold text-xs text-primary">Potential Match</h4>
            </div>
            <p className="text-[11px] text-stitch-muted leading-relaxed">
              We found a match for <span className="font-bold">Abdullah Al-Saeed</span> in the Al-Rahman Public Tree.
            </p>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-1.5 bg-card border border-primary/30 text-primary text-[10px] font-bold rounded-lg hover:bg-primary hover:text-white transition-all">
                Compare
              </button>
              <button className="p-1.5 bg-stitch-surface rounded-lg text-stitch-muted">
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
