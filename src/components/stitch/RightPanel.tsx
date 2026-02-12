import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface SuggestionPreview {
  id: string;
  submitter_name: string;
  suggestion_text: string;
  created_at: string;
  member_name?: string;
}

interface StitchRightPanelProps {
  completenessPercentage?: number;
  generationsCount?: number;
  documentsCount?: number;
  pendingSuggestions?: number;
  latestSuggestions?: SuggestionPreview[];
  onReviewSuggestions?: () => void;
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
  pendingSuggestions = 0,
  latestSuggestions = [],
  onReviewSuggestions,
  familyDistribution = [
    { label: 'Saudi Arabia', percentage: 65, color: 'bg-primary' },
    { label: 'United Arab Emirates', percentage: 20, color: 'bg-blue-400' },
    { label: 'Others', percentage: 15, color: 'bg-amber-400' }
  ]
}) => {
  const { t } = useLanguage();

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('time.just_now', 'الآن');
    if (diffMins < 60) return `${t('time.ago', 'منذ')} ${diffMins} ${t('time.minutes', 'دقيقة')}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${t('time.ago', 'منذ')} ${diffHours} ${t('time.hours', 'ساعة')}`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${t('time.ago', 'منذ')} ${diffDays} ${t('time.days', 'يوم')}`;
    return new Date(dateStr).toLocaleDateString();
  };

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
              <p className="text-[10px] text-slate-500 uppercase font-semibold">الأجيال</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center">
              <p className="text-lg font-bold">{documentsCount}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">الصور المرفوعة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Suggestions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{t('suggestions.pending', 'Pending Suggestions')}</h3>
          {pendingSuggestions > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
              {pendingSuggestions} {t('suggestions.new', 'New')}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {latestSuggestions.length > 0 ? (
            latestSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="p-4 bg-gradient-to-br from-primary/5 to-emerald-500/10 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-round text-primary text-sm">edit_note</span>
                  <h4 className="font-bold text-xs text-primary truncate">
                    {suggestion.member_name ? <>{t('suggestions.about_member', 'حول العضو')}: {suggestion.member_name}</> : t('suggestions.general', 'اقتراح عام')}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {suggestion.suggestion_text}
                </p>
                <p className="text-[10px] text-slate-400 mt-2">
                  {t('suggestions.from_label', 'من')} {suggestion.submitter_name} · {t('suggestions.on_date', 'بتاريخ')} {new Date(suggestion.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center">
              <span className="material-icons-round text-slate-300 text-2xl mb-1">inbox</span>
              <p className="text-[11px] text-slate-400">{t('suggestions.no_pending', 'لا توجد اقتراحات بانتظار المراجعة')}</p>
            </div>
          )}
        </div>
        {pendingSuggestions > 0 && (
          <button
            onClick={onReviewSuggestions}
            className="w-full mt-3 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
          >
            {t('suggestions.review_all', 'مراجعة الاقتراحات')}
          </button>
        )}
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
