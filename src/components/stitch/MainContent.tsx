import React, { useMemo } from 'react';
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
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                {t('stitch.recent_activities', 'Recent Activities')}
              </h3>
              {!readOnly && (
              <button className="text-xs text-primary font-bold hover:underline">
                {t('stitch.view_all', 'View All')}
              </button>
              )}
            </div>
            <div className="space-y-6">
              {activities.length > 0 ? activities.map((activity) => {
                const { icon, className } = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full ${className} flex items-center justify-center flex-shrink-0`}>
                      <span className="material-icons-round text-sm">{icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.title} <span className="font-bold">{activity.highlight}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {activity.timestamp}
                        {activity.actorName && (
                          <span className="text-slate-500"> • {t('activity.by', 'بواسطة')} {activity.actorName}</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  {t('stitch.no_recent_activities', 'No recent activities')}
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Birthdays */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">cake</span>
                {t('stitch.upcoming_birthdays', 'Upcoming Birthdays')}
              </h3>
            </div>
            <div className="space-y-5">
              {milestones.length > 0 ? milestones.map((milestone) => (
                <div key={milestone.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                      {milestone.image ? (
                        <img 
                          src={milestone.image} 
                          alt={milestone.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-500 text-xs font-bold">
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
                              <p className="text-[11px] text-slate-400">
                                {parentageInfo.genderTerm} {parentageInfo.lineage}
                              </p>
                            );
                          }
                        }
                        return null;
                      })()}
                      <p className="text-[11px] text-slate-500">
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
                <p className="text-sm text-slate-500 text-center py-4">
                  {t('stitch.no_birthdays', 'No upcoming birthdays')}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default StitchMainContent;
