import React from 'react';
import { AddMemberForm } from './AddMemberForm';
import { StitchMemberProfile } from './MemberProfile';
import { Member, Marriage } from '@/types/family.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface Activity {
  id: string;
  type: 'edit' | 'add' | 'photo';
  title: string;
  highlight: string;
  timestamp: string;
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
  // Member Profile props
  selectedMember?: any;
  onEditMember?: () => void;
  onDeleteMember?: () => void;
  onBackFromProfile?: () => void;
  onMemberClick?: (member: any) => void;
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
  selectedMember,
  onEditMember,
  onDeleteMember,
  onBackFromProfile,
  onMemberClick,
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

  // Show Member Profile if a member is selected
  if (selectedMember && !showAddMemberForm) {
    return (
      <StitchMemberProfile
        member={selectedMember}
        familyMembers={familyMembers as any[]}
        marriages={marriages as any[]}
        onEdit={onEditMember}
        onDelete={onDeleteMember}
        onBack={onBackFromProfile}
        onMemberClick={onMemberClick}
      />
    );
  }


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
      />
    );
  }

  return (
    <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark p-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {t('stitch.welcome_back', 'Welcome back')}, {userName}!
          </h2>
          <p className="text-slate-500">
            {t('stitch.whats_happening', "Here's what's happening in your family tree today.")}
          </p>
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Recent Activities
              </h3>
              <button className="text-xs text-primary font-bold hover:underline">
                View All
              </button>
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
                      <p className="text-[11px] text-slate-400 mt-0.5">{activity.timestamp}</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No recent activities
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

          {/* Quick Actions - Full Width */}
          <div className="md:col-span-2">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:shadow-lg transition-all text-center group"
                >
                  <div className={`w-12 h-12 ${action.iconBg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined">{action.icon}</span>
                  </div>
                  <span className="text-xs font-bold">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StitchMainContent;
