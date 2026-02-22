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
          <h3 className="font-bold">{t('stats.growth_statistics', 'إحصائيات النمو')}</h3>
          <span className="material-symbols-outlined text-slate-400 text-sm">trending_up</span>
        </div>
        <div className="space-y-4">
          {/* Completeness */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
            <div className="flex justify-between items-end mb-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('stats.data_completeness', 'اكتمال البيانات')}</p>
              <p className="text-sm font-bold text-primary">{completenessPercentage}%</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full" 
                style={{ width: `${completenessPercentage}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-1.5">{t('stats.completeness_desc', 'نسبة اكتمال البيانات من صور واسم وتاريخ ميلاد ووصف')}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center">
              <p className="text-lg font-bold">{generationsCount}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">{t('stats.generations', 'الأجيال')}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center">
              <p className="text-lg font-bold">{documentsCount}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">{t('stats.uploaded_photos', 'الصور المرفوعة')}</p>
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

      {/* Alternative Suggestions Design - More Dynamic */}
      {latestSuggestions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">lightbulb</span>
            </div>
            <h3 className="font-bold text-sm">{t('suggestions.pending_alt', 'آخر الاقتراحات')}</h3>
            {pendingSuggestions > 0 && (
              <span className="ml-auto relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[9px] font-bold items-center justify-center">
                  {pendingSuggestions}
                </span>
              </span>
            )}
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-0 bottom-0 left-3 rtl:left-auto rtl:right-3 w-0.5 bg-gradient-to-b from-primary/40 via-amber-400/40 to-transparent" />

            <div className="space-y-4">
              {latestSuggestions.map((suggestion, i) => (
                <div key={`alt-${suggestion.id}`} className="relative pl-8 rtl:pl-0 rtl:pr-8 group">
                  {/* Timeline dot */}
                  <div 
                    className="absolute left-1.5 rtl:left-auto rtl:right-1.5 top-2 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-125 transition-transform"
                    style={{ 
                      background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 
                                  i === 1 ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 
                                  'linear-gradient(135deg, #8b5cf6, #6366f1)' 
                    }}
                  />
                  
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                    {/* Header with member name */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold",
                        i === 0 ? "bg-gradient-to-br from-amber-400 to-red-500" :
                        i === 1 ? "bg-gradient-to-br from-emerald-400 to-cyan-500" :
                        "bg-gradient-to-br from-violet-400 to-indigo-500"
                      )}>
                        {suggestion.submitter_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate flex-1">
                        {suggestion.submitter_name}
                      </span>
                      <span className="text-[9px] text-slate-400 whitespace-nowrap">
                        {new Date(suggestion.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Member badge */}
                    {suggestion.member_name && (
                      <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-1.5">
                        <span className="material-symbols-outlined text-[10px]">person</span>
                        <span className="text-[9px] font-bold">{suggestion.member_name}</span>
                      </div>
                    )}

                    {/* Suggestion text */}
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {suggestion.suggestion_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {pendingSuggestions > 0 && (
            <button
              onClick={onReviewSuggestions}
              className="w-full mt-4 py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-white text-xs font-bold rounded-xl hover:opacity-90 hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">reviews</span>
              {t('suggestions.review_all', 'مراجعة الاقتراحات')}
            </button>
          )}
        </div>
      )}

      {/* ===== Option 3: Stacked Cards with Glow Effect ===== */}
      {latestSuggestions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse opacity-50 blur-sm" />
              <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm">magic_button</span>
              </div>
            </div>
            <h3 className="font-bold text-sm">{t('suggestions.option3', 'الخيار 3: بطاقات متوهجة')}</h3>
          </div>

          <div className="space-y-3">
            {latestSuggestions.map((suggestion, i) => {
              const colors = [
                { border: 'border-amber-300/50', glow: 'shadow-amber-200/30', bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20', accent: 'text-amber-600', dot: 'bg-amber-400' },
                { border: 'border-emerald-300/50', glow: 'shadow-emerald-200/30', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20', accent: 'text-emerald-600', dot: 'bg-emerald-400' },
                { border: 'border-violet-300/50', glow: 'shadow-violet-200/30', bg: 'from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/20', accent: 'text-violet-600', dot: 'bg-violet-400' },
              ];
              const c = colors[i % 3];
              return (
                <div
                  key={`v3-${suggestion.id}`}
                  className={cn(
                    "relative rounded-2xl p-3.5 border bg-gradient-to-br transition-all duration-500 hover:scale-[1.02] hover:shadow-lg cursor-default group",
                    c.border, c.glow, c.bg
                  )}
                >
                  {/* Animated corner accent */}
                  <div className={cn("absolute top-2 right-2 rtl:right-auto rtl:left-2 w-2 h-2 rounded-full group-hover:scale-150 transition-transform", c.dot)} 
                    style={{ animation: `pulse 2s ease-in-out infinite ${i * 0.5}s` }} 
                  />

                  {/* Submitter row */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-[10px] font-black", c.accent)}>
                      {suggestion.submitter_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{suggestion.submitter_name}</p>
                      <p className="text-[9px] text-slate-400">{new Date(suggestion.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={cn("material-symbols-outlined text-base", c.accent)} style={{ animation: 'spin 4s linear infinite' }}>autorenew</span>
                  </div>

                  {/* Member tag */}
                  {suggestion.member_name && (
                    <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/60 dark:bg-slate-800/60 mb-1.5 text-[9px] font-bold", c.accent)}>
                      <span className="material-symbols-outlined text-[10px]">person_pin</span>
                      {suggestion.member_name}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {suggestion.suggestion_text}
                  </p>
                </div>
              );
            })}
          </div>

          {pendingSuggestions > 0 && (
            <button
              onClick={onReviewSuggestions}
              className="w-full mt-3 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-violet-300/30 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm animate-bounce">arrow_forward</span>
              {t('suggestions.review_all', 'مراجعة الاقتراحات')}
            </button>
          )}
        </div>
      )}

      {/* ===== Option 4: Chat Bubble Style ===== */}
      {latestSuggestions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center relative">
              <span className="material-symbols-outlined text-white text-sm">forum</span>
              {pendingSuggestions > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {pendingSuggestions}
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm">{t('suggestions.option4', 'الخيار 4: فقاعات محادثة')}</h3>
          </div>

          <div className="space-y-3">
            {latestSuggestions.map((suggestion, i) => (
              <div key={`v4-${suggestion.id}`} className="group">
                {/* Sender info */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                    style={{
                      background: i === 0 ? 'linear-gradient(135deg, #f97316, #ef4444)' :
                                  i === 1 ? 'linear-gradient(135deg, #22c55e, #14b8a6)' :
                                  'linear-gradient(135deg, #a855f7, #6366f1)'
                    }}
                  >
                    {suggestion.submitter_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{suggestion.submitter_name}</span>
                  <span className="text-[8px] text-slate-300 mx-0.5">•</span>
                  <span className="text-[9px] text-slate-400">{new Date(suggestion.created_at).toLocaleDateString()}</span>
                </div>
                
                {/* Chat bubble */}
                <div className="relative bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20 rounded-2xl rounded-tr-sm rtl:rounded-tr-2xl rtl:rounded-tl-sm p-3 border border-sky-200/40 dark:border-sky-800/30 hover:shadow-md hover:shadow-sky-100/50 transition-all duration-300">
                  {/* Triangle pointer */}
                  <div className="absolute top-0 right-3 rtl:right-auto rtl:left-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-sky-50 dark:border-b-sky-950/30 -translate-y-[5px]" />
                  
                  {/* Member tag */}
                  {suggestion.member_name && (
                    <div className="flex items-center gap-1 mb-1.5">
                      <span className="material-symbols-outlined text-sky-500 text-xs">account_circle</span>
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">{suggestion.member_name}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {suggestion.suggestion_text}
                  </p>
                  
                  {/* Typing indicator style dots */}
                  <div className="flex gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-1 rounded-full bg-sky-400" style={{ animation: 'pulse 1s infinite 0s' }} />
                    <div className="w-1 h-1 rounded-full bg-sky-400" style={{ animation: 'pulse 1s infinite 0.2s' }} />
                    <div className="w-1 h-1 rounded-full bg-sky-400" style={{ animation: 'pulse 1s infinite 0.4s' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pendingSuggestions > 0 && (
            <button
              onClick={onReviewSuggestions}
              className="w-full mt-3 py-2.5 bg-gradient-to-r from-sky-400 to-blue-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-sky-200/40 transition-all flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">chat</span>
              {t('suggestions.review_all', 'مراجعة الاقتراحات')}
            </button>
          )}
        </div>
      )}

    </aside>
  );
};

export default StitchRightPanel;
