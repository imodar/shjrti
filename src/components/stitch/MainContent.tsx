import React, { useMemo, useState, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { AddMemberForm } from './AddMemberForm';
import { StitchMemberProfile } from './MemberProfile';
import { StitchSuggestionsView } from './SuggestionsView';
import { StitchStatisticsView } from './StatisticsView';
import { StitchGalleryView } from './GalleryView';
import { Member, Marriage } from '@/types/family.types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getParentageInfo } from '@/lib/memberDisplayUtils';
import { StitchWelcomeCard } from './WelcomeVariants';

interface Activity {
  id: string;
  type: 'edit' | 'add' | 'photo' | 'delete';
  title: string;
  highlight: string;
  timestamp: string;
  actorName?: string;
}

interface Milestone {
  id: string;
  title: string;
  date: string;
  daysUntil: number;
  image?: string;
  initials?: string;
}

interface StitchMainContentProps {
  userName?: string;
  activities?: Activity[];
  milestones?: Milestone[];
  onExportTree?: () => void;
  onImportGedcom?: () => void;
  onFamilyStory?: () => void;
  onPrintPoster?: () => void;
  // Add Member Form props
  showAddMemberForm?: boolean;
  onCloseForm?: () => void;
  familyMembers?: Member[];
  marriages?: Marriage[];
  familyId?: string;
  familyData?: any;
  editingMember?: any;
  formMode?: 'add' | 'edit';
  onMemberSaved?: () => void;
  initialFormData?: any;
  // Member Profile props
  selectedMember?: any;
  onEditMember?: () => void;
  onDeleteMember?: () => void;
  onBackFromProfile?: () => void;
  onMemberClick?: (member: any) => void;
  onAddChild?: (parentMember: any, spouseId?: string) => void;
  // Suggestions view
  showSuggestions?: boolean;
  // Statistics view
  showStatistics?: boolean;
  // Gallery view
  showGallery?: boolean;
  // Read-only mode (for external spouses or public view)
  readOnly?: boolean;
  // Suggest edit handler (for public view)
  onSuggestEdit?: (memberId: string, memberName: string) => void;
}

export const StitchMainContent: React.FC<StitchMainContentProps> = ({
  userName = 'User',
  activities = [],
  milestones = [],
  onExportTree,
  onImportGedcom,
  onFamilyStory,
  onPrintPoster,
  showAddMemberForm = false,
  onCloseForm,
  familyMembers = [],
  marriages = [],
  familyId,
  familyData,
  editingMember,
  formMode = 'add',
  onMemberSaved,
  initialFormData,
  selectedMember,
  onEditMember,
  onDeleteMember,
  onBackFromProfile,
  onMemberClick,
  onAddChild,
  showSuggestions = false,
  showStatistics = false,
  showGallery = false,
  readOnly = false,
  onSuggestEdit,
}) => {
  const { t } = useLanguage();
  const [expandedCard, setExpandedCard] = useState<'activities' | 'birthdays' | null>(null);
  const [visibleActivities, setVisibleActivities] = useState(10);
  const [visibleBirthdays, setVisibleBirthdays] = useState(10);
  const activitiesScrollRef = useRef<HTMLDivElement>(null);
  const birthdaysScrollRef = useRef<HTMLDivElement>(null);

  const INITIAL_COUNT = 3;
  const LOAD_MORE_COUNT = 10;

  const handleActivitiesScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setVisibleActivities(prev => Math.min(prev + LOAD_MORE_COUNT, activities.length));
    }
  }, [activities.length]);

  const handleBirthdaysScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setVisibleBirthdays(prev => Math.min(prev + LOAD_MORE_COUNT, milestones.length));
    }
  }, [milestones.length]);

  const handleExpand = (card: 'activities' | 'birthdays') => {
    setExpandedCard(card);
    if (card === 'activities') setVisibleActivities(10);
    if (card === 'birthdays') setVisibleBirthdays(10);
  };

  const handleCollapse = () => {
    setExpandedCard(null);
    setVisibleActivities(10);
    setVisibleBirthdays(10);
  };
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'edit':
        return { icon: 'edit', className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' };
      case 'add':
        return { icon: 'person_add', className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' };
      case 'photo':
        return { icon: 'photo_library', className: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' };
      case 'delete':
        return { icon: 'delete', className: 'bg-red-50 dark:bg-red-900/20 text-red-500' };
      default:
        return { icon: 'history', className: 'bg-slate-50 dark:bg-slate-800/20 text-slate-500' };
    }
  };

  const quickActions = [
    { 
      id: 'export', 
      label: t('stitch.export_tree', 'Export Tree'), 
      icon: 'account_tree',
      iconBg: 'bg-primary/10 text-primary',
      onClick: onExportTree 
    },
    { 
      id: 'import', 
      label: t('stitch.import_gedcom', 'Import GEDCOM'), 
      icon: 'upload_file',
      iconBg: 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30',
      onClick: onImportGedcom 
    },
    { 
      id: 'story', 
      label: t('stitch.family_story', 'Family Story'), 
      icon: 'auto_stories',
      iconBg: 'bg-amber-100/50 text-amber-600 dark:bg-amber-900/30',
      onClick: onFamilyStory 
    },
    { 
      id: 'print', 
      label: t('stitch.print_poster', 'Print Poster'), 
      icon: 'print',
      iconBg: 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/30',
      onClick: onPrintPoster 
    }
  ];

  // Show Add Member Form (takes priority over other views)
  if (showAddMemberForm && familyId && onCloseForm && onMemberSaved) {
    return (
      <AddMemberForm
        familyId={familyId}
        familyMembers={familyMembers}
        marriages={marriages}
        familyData={familyData}
        editingMember={editingMember}
        formMode={formMode}
        onClose={onCloseForm}
        onMemberSaved={onMemberSaved}
        initialFormData={initialFormData}
      />
    );
  }

  // Show Suggestions View
  if (showSuggestions && familyId) {
    return (
      <StitchSuggestionsView
        familyId={familyId}
        familyMembers={familyMembers}
      />
    );
  }

  // Show Gallery View
  if (showGallery && familyId) {
    return (
      <StitchGalleryView
        familyId={familyId}
        familyMembers={familyMembers}
        readOnly={readOnly}
      />
    );
  }

  // Show Statistics View
  if (showStatistics) {
    return (
      <StitchStatisticsView
        familyMembers={familyMembers}
        marriages={marriages}
      />
    );
  }

  // Show Member Profile if a member is selected
  if (selectedMember) {
    return (
      <StitchMemberProfile
        member={selectedMember}
        familyMembers={familyMembers as any[]}
        marriages={marriages as any[]}
        onEdit={readOnly ? undefined : onEditMember}
        onDelete={readOnly ? undefined : onDeleteMember}
        onBack={onBackFromProfile}
        onMemberClick={onMemberClick}
        onAddChild={onAddChild}
        readOnly={readOnly}
        onSuggestEdit={readOnly && onSuggestEdit ? onSuggestEdit : undefined}
      />
    );
  }

  return (
    <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark p-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Card */}
        <StitchWelcomeCard
          userName={userName}
          familyMembers={familyMembers}
          marriages={marriages}
        />

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Family Description */}
          {familyData?.description && (
            <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">info</span>
                <h3 className="font-bold">{t('stitch.about_family', 'About the Family')}</h3>
              </div>
              <div 
                className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(familyData.description) }}
              />
            </div>
          )}

          {/* Recent Activities */}
          <div className={`relative transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            expandedCard === 'activities' 
              ? 'md:col-span-2 z-10 scale-100 opacity-100 order-1' 
              : expandedCard === 'birthdays' 
                ? 'md:col-span-1 scale-95 opacity-0 pointer-events-none max-h-0 overflow-hidden order-2' 
                : 'scale-100 opacity-100 order-1'
          }`}>
            <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 transition-shadow duration-500 ${
              expandedCard === 'activities' ? 'shadow-lg ring-1 ring-primary/10' : 'shadow-sm hover:shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  {t('stitch.recent_activities', 'Recent Activities')}
                </h3>
                <div className="flex items-center gap-2">
                  {!readOnly && expandedCard !== 'activities' && activities.length > INITIAL_COUNT && (
                    <button 
                      onClick={() => handleExpand('activities')}
                      className="text-xs text-primary font-bold hover:underline transition-colors"
                    >
                      {t('stitch.view_all', 'View All')}
                    </button>
                  )}
                  {expandedCard === 'activities' && (
                    <button 
                      onClick={handleCollapse}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 hover:rotate-90 hover:scale-110"
                    >
                      <span className="material-symbols-outlined text-sm text-muted-foreground">close</span>
                    </button>
                  )}
                </div>
              </div>
              <div 
                ref={activitiesScrollRef}
                onScroll={expandedCard === 'activities' ? handleActivitiesScroll : undefined}
                className={`space-y-5 transition-[max-height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] custom-scrollbar ${
                  expandedCard === 'activities' ? 'max-h-[60vh] overflow-y-auto pr-2' : 'max-h-[300px] overflow-hidden'
                }`}
              >
                {activities.length > 0 ? (
                  expandedCard === 'activities' ? activities.slice(0, visibleActivities) : activities.slice(0, INITIAL_COUNT)
                ).map((activity, index) => {
                  const { icon, className } = getActivityIcon(activity.type);
                  return (
                    <div 
                      key={activity.id} 
                      className={`p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between transition-all duration-500 ease-out ${
                        expandedCard === 'activities' && index >= INITIAL_COUNT ? 'animate-fade-in' : ''
                      }`}
                      style={{ animationDelay: expandedCard === 'activities' && index >= INITIAL_COUNT ? `${(index - INITIAL_COUNT) * 60}ms` : '0ms' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${className} flex items-center justify-center flex-shrink-0`}>
                          <span className="material-icons-round text-base">{icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold">
                            {activity.title} <span className="font-bold">{activity.highlight}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {activity.timestamp}
                            {activity.actorName && (
                              <span className="text-muted-foreground"> • {t('activity.by', 'بواسطة')} {activity.actorName}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className={`material-symbols-outlined text-sm ${className.split(' ').pop()}`}>{icon}</span>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('stitch.no_recent_activities', 'No recent activities')}
                  </p>
                )}
                {expandedCard === 'activities' && visibleActivities < activities.length && (
                  <div className="flex justify-center py-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Birthdays */}
          <div className={`relative transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            expandedCard === 'birthdays' 
              ? 'md:col-span-2 z-10 scale-100 opacity-100 order-1' 
              : expandedCard === 'activities' 
                ? 'md:col-span-1 scale-95 opacity-0 pointer-events-none max-h-0 overflow-hidden order-2' 
                : 'scale-100 opacity-100 order-2'
          }`}>
            <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 transition-shadow duration-500 ${
              expandedCard === 'birthdays' ? 'shadow-lg ring-1 ring-primary/10' : 'shadow-sm hover:shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">cake</span>
                  {t('stitch.upcoming_birthdays', 'Upcoming Birthdays')}
                </h3>
                <div className="flex items-center gap-2">
                  {expandedCard !== 'birthdays' && milestones.length >= INITIAL_COUNT && (
                    <button 
                      onClick={() => handleExpand('birthdays')}
                      className="text-xs text-primary font-bold hover:underline transition-colors"
                    >
                      {t('stitch.view_all', 'View All')}
                    </button>
                  )}
                  {expandedCard === 'birthdays' && (
                    <button 
                      onClick={handleCollapse}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 hover:rotate-90 hover:scale-110"
                    >
                      <span className="material-symbols-outlined text-sm text-muted-foreground">close</span>
                    </button>
                  )}
                </div>
              </div>
              <div 
                ref={birthdaysScrollRef}
                onScroll={expandedCard === 'birthdays' ? handleBirthdaysScroll : undefined}
                className={`space-y-5 transition-[max-height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] custom-scrollbar ${
                  expandedCard === 'birthdays' ? 'max-h-[60vh] overflow-y-auto pr-2' : 'max-h-[300px] overflow-hidden'
                }`}
              >
                {milestones.length > 0 ? (
                  expandedCard === 'birthdays' ? milestones.slice(0, visibleBirthdays) : milestones.slice(0, INITIAL_COUNT)
                ).map((milestone, index) => (
                  <div 
                    key={milestone.id} 
                    className={`p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between transition-all duration-500 ease-out ${
                      expandedCard === 'birthdays' && index >= INITIAL_COUNT ? 'animate-fade-in' : ''
                    }`}
                    style={{ animationDelay: expandedCard === 'birthdays' && index >= INITIAL_COUNT ? `${(index - INITIAL_COUNT) * 60}ms` : '0ms' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                        {milestone.image ? (
                          <img 
                            src={milestone.image} 
                            alt={milestone.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs font-bold">
                            {milestone.initials}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{milestone.title}</p>
                        {(() => {
                          const member = familyMembers.find((m: any) => m.id === milestone.id);
                          if (member) {
                            const parentageInfo = getParentageInfo(member, familyMembers);
                            if (parentageInfo) {
                              return (
                                <p className="text-[11px] text-muted-foreground">
                                  {parentageInfo.genderTerm} {parentageInfo.lineage}
                                </p>
                              );
                            }
                          }
                          return null;
                        })()}
                        <p className="text-[11px] text-muted-foreground">
                          {milestone.daysUntil === 0 
                            ? `🎉 ${t('stitch.birthday_today', 'Today!')}` 
                            : `${t('stitch.in_days', 'In')} ${milestone.daysUntil} ${t('stitch.days', 'days')} • ${milestone.date}`
                          }
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-amber-400">cake</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('stitch.no_birthdays', 'No upcoming birthdays')}
                  </p>
                )}
                {expandedCard === 'birthdays' && visibleBirthdays < milestones.length && (
                  <div className="flex justify-center py-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StitchMainContent;
