import React from 'react';
import { Edit, UserPlus, Image, Clock, Cake, Bell, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export const StitchMainContent: React.FC<StitchMainContentProps> = ({
  userName = 'User',
  activities = [],
  milestones = [],
  onExportTree,
  onImportGedcom,
  onFamilyStory,
  onPrintPoster
}) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'edit':
        return { icon: Edit, className: 'activity-icon edit' };
      case 'add':
        return { icon: UserPlus, className: 'activity-icon add' };
      case 'photo':
        return { icon: Image, className: 'activity-icon photo' };
      default:
        return { icon: Clock, className: 'activity-icon' };
    }
  };

  const quickActions = [
    { 
      id: 'export', 
      label: 'Export Tree', 
      icon: 'account_tree',
      iconBg: 'bg-primary/10 text-primary',
      onClick: onExportTree 
    },
    { 
      id: 'import', 
      label: 'Import GEDCOM', 
      icon: 'upload_file',
      iconBg: 'bg-emerald-100/50 text-emerald-600',
      onClick: onImportGedcom 
    },
    { 
      id: 'story', 
      label: 'Family Story', 
      icon: 'auto_stories',
      iconBg: 'bg-amber-100/50 text-amber-600',
      onClick: onFamilyStory 
    },
    { 
      id: 'print', 
      label: 'Print Poster', 
      icon: 'print',
      iconBg: 'bg-blue-100/50 text-blue-600',
      onClick: onPrintPoster 
    }
  ];

  return (
    <section className="stitch-main custom-scrollbar">
      <div className="stitch-main-content">
        {/* Welcome Header */}
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userName}!
          </h2>
          <p className="text-stitch-muted">
            Here's what's happening in your family tree today.
          </p>
        </header>

        {/* Cards Grid */}
        <div className="stitch-grid-2">
          {/* Recent Activities */}
          <div className="stitch-card p-6">
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
                const { icon: Icon, className } = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex gap-4">
                    <div className={className}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.title} <span className="font-bold">{activity.highlight}</span>
                      </p>
                      <p className="text-caption mt-0.5">{activity.timestamp}</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-stitch-muted text-center py-4">
                  No recent activities
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="stitch-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">cake</span>
                Upcoming Milestones
              </h3>
            </div>
            <div className="space-y-5">
              {milestones.length > 0 ? milestones.map((milestone) => (
                <div key={milestone.id} className="stat-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="stitch-avatar bg-stitch-surface overflow-hidden">
                      {milestone.image ? (
                        <img 
                          src={milestone.image} 
                          alt={milestone.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-stitch-muted text-xs font-bold">
                          {milestone.initials}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{milestone.title}</p>
                      <p className="text-caption">
                        In {milestone.daysUntil} days • {milestone.date}
                      </p>
                    </div>
                  </div>
                  <Bell className="h-5 w-5 text-stitch-muted" />
                </div>
              )) : (
                <p className="text-sm text-stitch-muted text-center py-4">
                  No upcoming milestones
                </p>
              )}
            </div>
            <button className="w-full mt-4 py-2 border-2 border-dashed border-border rounded-xl text-xs font-semibold text-stitch-muted hover:text-primary hover:border-primary/50 transition-all">
              + Add Milestone Reminder
            </button>
          </div>

          {/* Quick Actions - Full Width */}
          <div className="md:col-span-2">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="stitch-grid-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="quick-action group"
                >
                  <div className={cn('quick-action-icon', action.iconBg)}>
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
