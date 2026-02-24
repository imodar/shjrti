import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useFamilyData } from '@/contexts/FamilyDataContext';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { subscriptionsApi, suggestionsApi, familiesApi, profilesApi } from '@/lib/api';
import { StitchFamilyBar, StitchSidebar, StitchRightPanel, StitchMainContent, StitchSettingsView } from '@/components/stitch';
import { useStitchLayout } from '@/components/stitch/StitchLayout';
import DashboardLoader from '@/components/stitch/DashboardLoader';
import { MemberDeleteModal } from '@/components/stitch/MemberDeleteModal';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { GlobalFooterSimplified } from '@/components/GlobalFooterSimplified';

/**
 * FamilyBuilderStitch - Stitch theme variant of FamilyBuilderNew
 * This component wraps the Stitch UI layout around the same family data
 */
const FamilyBuilderStitch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentTheme, setCurrentTheme } = useTheme();
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  const { subscription } = useSubscription();

  // Save the previous theme on mount
  const previousThemeRef = useRef(currentTheme);

  // Apply stitch theme when entering this page
  useEffect(() => {
    console.log('[FamilyBuilderStitch] Applying stitch theme, current:', currentTheme);
    // Only save the previous theme on initial mount
    if (currentTheme !== 'stitch') {
      previousThemeRef.current = currentTheme;
    }
    // Set theme in context (used elsewhere in the app)
    setCurrentTheme('stitch');

    // Force DOM theme class immediately to ensure Stitch CSS selectors apply
    // (This page relies heavily on `.theme-stitch .stitch-*` selectors.)
    const html = document.documentElement;
    html.classList.remove('theme-modern', 'theme-professional');
    html.classList.add('theme-stitch');
    
    // Verify theme was applied
    setTimeout(() => {
      console.log('[FamilyBuilderStitch] HTML classes:', document.documentElement.classList.toString());
    }, 100);
    
    return () => {
      // Restore previous theme when leaving
      console.log('[FamilyBuilderStitch] Restoring theme to:', previousThemeRef.current);
      if (previousThemeRef.current !== 'stitch') {
        setCurrentTheme(previousThemeRef.current);
      }

      // Best-effort restore DOM classes to match the previous theme
      const html = document.documentElement;
      html.classList.remove('theme-stitch');
      if (previousThemeRef.current === 'professional') html.classList.add('theme-professional');
      else html.classList.add('theme-modern');
    };
  }, [setCurrentTheme]);
  
  // Family data from context
  const { 
    familyData, 
    familyMembers, 
    marriages,
    loading,
    refetch 
  } = useFamilyData();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [initialFormData, setInitialFormData] = useState<any>(undefined);
  const [maxFamilyMembers, setMaxFamilyMembers] = useState<number | null>(null);
  const familyId = searchParams.get('family') || '';
  const { isOwner, isCollaborator, canEditMembers, canDelete, canInvite, loading: roleLoading } = useFamilyRole(familyId);
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showSuggestions, setShowSuggestions] = useState(initialTab === 'suggestions');
  const [showStatistics, setShowStatistics] = useState(initialTab === 'statistics');
  const [showGallery, setShowGallery] = useState(initialTab === 'gallery');
  const [showSettings, setShowSettings] = useState(initialTab === 'settings');
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const [latestSuggestions, setLatestSuggestions] = useState<Array<{ id: string; submitter_name: string; suggestion_text: string; created_at: string; member_name?: string }>>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSpouseEditWarning, setShowSpouseEditWarning] = useState(false);
  const [spouseWarningData, setSpouseWarningData] = useState<{ spouseName: string; partnerName: string; partnerMember: any } | null>(null);
  // Default to true so loader is skipped when data is cached; useEffects set false only when fetching
  const [packageLoaded, setPackageLoaded] = useState(true);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(true);
  const loaderDoneRef = useRef(false);

  // Package name from REST API (more reliable than SubscriptionContext RPC)
  const [restPackageName, setRestPackageName] = useState<Record<string, string> | string | undefined>(undefined);

  // Profile name from REST API
  const [profileFirstName, setProfileFirstName] = useState<string | null>(null);

  // Fetch profile name + package limits from REST API
  useEffect(() => {
    if (!user) return;
    setPackageLoaded(false);
    const fetchData = async () => {
      try {
        const [sub, profile] = await Promise.all([
          subscriptionsApi.get(),
          profilesApi.get(),
        ]);
        const pkg = sub?.packages;
        if (pkg?.max_family_members) {
          setMaxFamilyMembers(pkg.max_family_members);
        }
        if (pkg?.name) {
          setRestPackageName(pkg.name as Record<string, string> | string);
        }
        if (profile?.first_name) {
          setProfileFirstName(profile.first_name);
        }
      } catch (error) {
        console.error('Error fetching package/profile:', error);
      } finally {
        setPackageLoaded(true);
      }
    };
    fetchData();
  }, [user?.id]);

  // Fetch pending suggestions count from API
  useEffect(() => {
    if (!familyId) return;
    setSuggestionsLoaded(false);
    const fetchPendingSuggestions = async () => {
      try {
        const suggestions = await suggestionsApi.listByFamily(familyId);
        const pending = suggestions.filter(s => s.status === 'pending');
        setPendingSuggestionsCount(pending.length);
        // Keep last 2 pending suggestions sorted by newest first
        const sorted = [...pending].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setLatestSuggestions(sorted.slice(0, 2).map(s => ({
          id: s.id,
          submitter_name: s.submitter_name,
          suggestion_text: s.suggestion_text,
          created_at: s.created_at,
          member_name: s.family_tree_members?.name || undefined,
        })));
      } catch (error) {
        console.error('Error fetching suggestions count:', error);
      } finally {
        setSuggestionsLoaded(true);
      }
    };
    fetchPendingSuggestions();
  }, [familyId]);


  const canAddMember = maxFamilyMembers === null || familyMembers.length < maxFamilyMembers;

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return familyMembers;
    
    const term = searchTerm.toLowerCase();
    return familyMembers.filter(member => {
      const fullName = `${member.first_name || ''} ${member.last_name || ''} ${member.name || ''}`.toLowerCase();
      return fullName.includes(term);
    });
  }, [familyMembers, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    // Calculate generations by finding max depth from founders
    const getDepth = (memberId: string, visited = new Set<string>()): number => {
      if (visited.has(memberId)) return 0;
      visited.add(memberId);
      const children = familyMembers.filter(m => m.father_id === memberId || m.mother_id === memberId);
      if (children.length === 0) return 1;
      return 1 + Math.max(...children.map(c => getDepth(c.id, visited)));
    };

    const founders = familyMembers.filter(m => m.is_founder);
    const maxGen = founders.length > 0
      ? Math.max(...founders.map(f => getDepth(f.id)))
      : (familyMembers.length > 0 ? 1 : 0);

    // Calculate data completeness: % of members with birth_date, image_url, and biography
    const completenessScore = familyMembers.length > 0
      ? Math.round(
          familyMembers.reduce((sum, m) => {
            let fields = 0;
            if (m.birth_date) fields++;
            if (m.image_url) fields++;
            if (m.biography) fields++;
            return sum + (fields / 3);
          }, 0) / familyMembers.length * 100
        )
      : 0;

    return {
      totalMembers: familyMembers.length,
      generations: maxGen,
      completeness: completenessScore,
      documents: 0
    };
  }, [familyMembers]);

  // Calculate upcoming birthdays (nearest 3)
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return familyMembers
      .filter(m => m.birth_date && m.is_alive !== false)
      .map(m => {
        const [year, month, day] = m.birth_date!.split('-').map(Number);
        const nextBirthday = new Date(today.getFullYear(), month - 1, day);
        // If birthday already passed this year, use next year
        if (nextBirthday < today && !(nextBirthday.getMonth() === todayMonth && nextBirthday.getDate() === todayDate)) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        const diffTime = nextBirthday.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const age = nextBirthday.getFullYear() - year;
        const initials = (m.first_name?.[0] || m.name?.[0] || '?').toUpperCase();
        return {
          id: m.id,
          title: m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim(),
          date: `${day}/${month}`,
          daysUntil: daysUntil === 0 ? 0 : daysUntil,
          image: m.image_url || undefined,
          initials,
          age,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }, [familyMembers]);

  // Real activities from activity_log
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: 'edit' | 'add' | 'photo' | 'delete';
    title: string;
    highlight: string;
    timestamp: string;
    actorName?: string;
  }>>([]);

  useEffect(() => {
    if (!familyId) return;
    familiesApi.getActivityLog(familyId).then((logs) => {
      const actionTypeMap: Record<string, { type: 'edit' | 'add' | 'photo' | 'delete'; title: string }> = {
        member_added: { type: 'add', title: t('activity.member_added', 'تمت إضافة') },
        member_updated: { type: 'edit', title: t('activity.member_updated', 'تم تعديل') },
        member_deleted: { type: 'delete', title: t('activity.member_deleted', 'تم حذف') },
        photo_uploaded: { type: 'photo', title: t('activity.photo_uploaded', 'تم رفع صورة') },
        marriage_added: { type: 'add', title: t('activity.marriage_added', 'تمت إضافة زواج') },
        marriage_deleted: { type: 'delete', title: t('activity.marriage_deleted', 'تم حذف زواج') },
        settings_changed: { type: 'edit', title: t('activity.settings_changed', 'تم تغيير الإعدادات') },
        collaborator_invited: { type: 'add', title: t('activity.collaborator_invited', 'تمت دعوة متعاون') },
      };

      const mapped = logs.slice(0, 10).map((log) => {
        const info = actionTypeMap[log.action_type] || { type: 'edit' as const, title: log.action_type };
        const timeAgo = getTimeAgo(log.created_at);
        return {
          id: log.id,
          type: info.type,
          title: info.title,
          highlight: log.target_name || '',
          timestamp: timeAgo,
          actorName: log.actor_name || undefined,
        };
      });
      setRecentActivities(mapped);
    }).catch(() => {
      // Silently fail - no activities to show
    });
  }, [familyId, t]);

  function getTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('time.just_now', 'الآن');
    if (diffMins < 60) return `${t('time.ago', 'منذ')} ${diffMins} ${t('time.minutes', 'دقيقة')}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${t('time.ago', 'منذ')} ${diffHours} ${t('time.hours', 'ساعة')}`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${t('time.ago', 'منذ')} ${diffDays} ${t('time.days', 'يوم')}`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffDays < 30) return `${t('time.ago', 'منذ')} ${diffWeeks} ${t('time.weeks', 'أسبوع')}`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${t('time.ago', 'منذ')} ${diffMonths} ${t('time.months', 'شهر')}`;
    return date.toLocaleDateString();
  }

  // Handlers
  // Helper: check if a member is an external spouse
  const isExternalSpouse = useCallback((member: any) => {
    const isFounder = member.is_founder || member.isFounder;
    const hasFamilyParent = (member.father_id || member.fatherId) &&
      familyMembers.find(m => m.id === (member.father_id || member.fatherId));
    const marriage = marriages.find((m: any) => m.husband_id === member.id || m.wife_id === member.id);
    return !!(marriage && !hasFamilyParent && !isFounder);
  }, [familyMembers, marriages]);

  const handleMemberClick = (member: any) => {
    setSelectedMemberId(member.id);
    setShowAddMemberForm(false);
    setIsSidebarOpen(false);
  };

  const handleEditMember = () => {
    if (!selectedMember) return;

    if (isExternalSpouse(selectedMember)) {
      // Find partner
      const marriage = marriages.find((m: any) => m.husband_id === selectedMember.id || m.wife_id === selectedMember.id);
      if (marriage) {
        const partnerId = marriage.husband_id === selectedMember.id ? marriage.wife_id : marriage.husband_id;
        const partner = familyMembers.find(m => m.id === partnerId);
        setSpouseWarningData({
          spouseName: selectedMember.first_name || selectedMember.name?.split(' ')[0] || '',
          partnerName: partner?.first_name || partner?.name?.split(' ')[0] || '',
          partnerMember: partner,
        });
        setShowSpouseEditWarning(true);
      }
      return;
    }

    setEditingMember(selectedMember);
    setFormMode('edit');
    setShowAddMemberForm(true);
  };

  const handleAddMember = () => {
    if (!canAddMember) {
      return;
    }
    setEditingMember(null);
    setFormMode('add');
    setInitialFormData(undefined);
    setShowAddMemberForm(true);
  };

  const handleAddChild = (parentMember: any, spouseId?: string) => {
    // Find the marriage record that links this parent with the specific spouse
    const selectedMarriage = spouseId
      ? marriages.find(m =>
          (m.husband_id === parentMember.id || m.wife_id === parentMember.id) &&
          (m.husband_id === spouseId || m.wife_id === spouseId)
        )
      : marriages.find(m =>
          m.husband_id === parentMember.id || m.wife_id === parentMember.id
        );

    setEditingMember(null);
    setFormMode('add');
    setSelectedMemberId(undefined);
    setInitialFormData({
      relation: 'child',
      relatedPersonId: selectedMarriage?.id || null,
      selectedParent: selectedMarriage?.id || null,
    });
    setShowAddMemberForm(true);
  };

  const handleCloseForm = () => {
    setShowAddMemberForm(false);
    setEditingMember(null);
    setInitialFormData(undefined);
  };

  const handleBackFromProfile = () => {
    setSelectedMemberId(undefined);
  };

  const handleMemberSaved = () => {
    refetch();
    setShowAddMemberForm(false);
    setEditingMember(null);
    setInitialFormData(undefined);
  };

  const handleTabChange = useCallback((tab: string) => {
    // Reset all views
    setShowSuggestions(false);
    setShowStatistics(false);
    setShowGallery(false);
    setShowSettings(false);
    setSelectedMemberId(undefined);
    setShowAddMemberForm(false);

    if (tab === 'suggestions') setShowSuggestions(true);
    else if (tab === 'statistics') setShowStatistics(true);
    else if (tab === 'gallery') setShowGallery(true);
    else if (tab === 'settings') setShowSettings(true);

    setActiveTab(tab);
  }, []);

  // Get selected member object
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return undefined;
    return familyMembers.find(m => m.id === selectedMemberId);
  }, [selectedMemberId, familyMembers]);

  // Get user display name - prefer REST API profile data
  const userName = profileFirstName || 
                   user?.user_metadata?.first_name || 
                   user?.email?.split('@')[0] || 
                   'User';

  // Get package name - prefer REST API data over SubscriptionContext RPC
  const packageName = restPackageName || subscription?.package_name;

  // Sync header overrides with layout
  const { setHeaderOverrides } = useStitchLayout();
  useEffect(() => {
    setHeaderOverrides({
      familyName: familyData?.name,
      suggestionsCount: pendingSuggestionsCount,
      onTabChange: handleTabChange,
      isOwner,
    });
  }, [familyData?.name, pendingSuggestionsCount, isOwner, handleTabChange, setHeaderOverrides]);

  // Only show loader on dashboard tab and only on FIRST load
  const isFullyLoaded = !loading && packageLoaded && suggestionsLoaded;

  if (isFullyLoaded) {
    loaderDoneRef.current = true;
  }

  if (!isFullyLoaded && activeTab === 'dashboard' && !loaderDoneRef.current) {
    return (
      <DashboardLoader
        steps={[
          { id: 'family', labelAr: 'جاري تحميل بيانات العائلة...', labelEn: 'Loading family data...', completed: !loading },
          { id: 'package', labelAr: 'جاري التحقق من الاشتراك...', labelEn: 'Checking subscription...', completed: packageLoaded },
          { id: 'suggestions', labelAr: 'جاري تحميل الاقتراحات...', labelEn: 'Loading suggestions...', completed: suggestionsLoaded },
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">

      {/* Family Bar - NEW */}
      <StitchFamilyBar
        familyName={familyData?.name || 'Al-Saeed'}
        onSwitchTree={() => navigate('/dashboard')}
        lastUpdated={recentActivities.length > 0 ? recentActivities[0].timestamp : undefined}
        collaborators={recentActivities.length > 0 && recentActivities[0].actorName ? [{
          id: 'last-editor',
          initial: recentActivities[0].actorName.charAt(0).toUpperCase(),
          color: 'text-primary'
        }] : undefined}
      />

      {/* Mobile/Tablet - Show Members List Bar (like old design) */}
      {!showGallery && !showSettings && !isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden flex items-center justify-center gap-2 w-full py-3 px-4 bg-card border-b border-border text-foreground hover:bg-muted transition-colors"
        >
          <span className="material-icons-round text-lg">menu</span>
          <span className="text-sm font-bold">
            {t('family_builder.show_members_list', 'عرض قائمة الأعضاء')} ({stats.totalMembers})
          </span>
        </button>
      )}

      {/* Main Layout */}
      <main className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar - Members List (hidden in gallery view which has its own sidebar) */}
        {!showGallery && !showSettings && (
          <StitchSidebar
            members={filteredMembers}
            totalCount={stats.totalMembers}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onMemberClick={handleMemberClick}
            onAddMember={handleAddMember}
            selectedMemberId={selectedMemberId}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            familyMembers={familyMembers}
            marriages={marriages}
            canAddMember={canAddMember}
            maxFamilyMembers={maxFamilyMembers}
          />
        )}

        {/* Main Content */}
        {showSettings ? (
          <StitchSettingsView
            familyId={familyId}
            familyData={familyData}
            onFamilyUpdated={refetch}
            isOwner={isOwner}
            onBack={() => handleTabChange('dashboard')}
          />
        ) : (
          <StitchMainContent
            userName={userName}
            activities={recentActivities}
            milestones={upcomingBirthdays}
            onExportTree={() => {/* TODO */}}
            onImportGedcom={() => {/* TODO */}}
            onFamilyStory={() => {/* TODO */}}
            onPrintPoster={() => {/* TODO */}}
            showAddMemberForm={showAddMemberForm}
            onCloseForm={handleCloseForm}
            familyMembers={familyMembers}
            marriages={marriages}
            familyId={searchParams.get('family') || ''}
            familyData={familyData}
            showSuggestions={showSuggestions}
            showStatistics={showStatistics}
            showGallery={showGallery}
            editingMember={editingMember}
            formMode={formMode}
            onMemberSaved={handleMemberSaved}
            selectedMember={selectedMember}
            onEditMember={handleEditMember}
            onDeleteMember={() => setShowDeleteModal(true)}
            onBackFromProfile={handleBackFromProfile}
            onMemberClick={handleMemberClick}
            onAddChild={handleAddChild}
            initialFormData={initialFormData}
          />
        )}

        {/* Right Panel - Stats (hidden when adding member, viewing profile, or suggestions/settings) */}
        {!showAddMemberForm && !selectedMember && !showSuggestions && !showStatistics && !showGallery && !showSettings && (
          <StitchRightPanel
            completenessPercentage={stats.completeness}
            generationsCount={stats.generations}
            documentsCount={stats.documents}
            pendingSuggestions={pendingSuggestionsCount}
            latestSuggestions={latestSuggestions}
            onReviewSuggestions={() => handleTabChange('suggestions')}
          />
        )}
      </main>

      {/* Member Delete Confirmation Modal */}
      <MemberDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => {
          setShowDeleteModal(false);
          setSelectedMemberId(undefined);
          refetch();
        }}
        member={selectedMember}
        familyMembers={familyMembers}
        marriages={marriages}
      />

      {/* Spouse Edit Protection Modal */}
      <AlertDialog open={showSpouseEditWarning} onOpenChange={setShowSpouseEditWarning}>
        <AlertDialogContent className="max-w-sm rounded-3xl border-0 shadow-2xl">
          <div className="p-2">
            <AlertDialogHeader className="pb-4">
              <div className="mx-auto w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-2xl text-amber-600 dark:text-amber-400">shield</span>
              </div>
              <AlertDialogTitle className="text-lg font-bold text-center">
                {t('family_builder.protected_edit', 'تعديل محمي')}
              </AlertDialogTitle>
            </AlertDialogHeader>

            <div className="text-center space-y-3 px-1">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {t('family_builder.cannot_edit_directly', 'لا يمكن تعديل بيانات')} {spouseWarningData?.spouseName} {t('family_builder.directly', 'مباشرة')}
                </p>
              </div>

              {spouseWarningData?.partnerName && (
                <div className="bg-card rounded-2xl p-4 border-2 border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">
                    {t('family_builder.go_to_edit', 'للتعديل، انتقل إلى:')}
                  </p>
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                    <span className="font-bold text-primary text-base">
                      {spouseWarningData.partnerName}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-3 border border-sky-200 dark:border-sky-800">
                <div className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm text-sky-600 dark:text-sky-400">info</span>
                  <p className="text-xs text-sky-700 dark:text-sky-300">
                    {t('family_builder.data_integrity_note', 'هذا الإجراء يحافظ على سلامة البيانات والعلاقات العائلية')}
                  </p>
                </div>
              </div>
            </div>

            <AlertDialogFooter className="pt-5 flex flex-col gap-2">
              <AlertDialogCancel className="w-full rounded-xl">
                {t('common.back', 'عودة')}
              </AlertDialogCancel>
              {spouseWarningData?.partnerMember && (
                <Button
                  className="w-full rounded-xl"
                  onClick={() => {
                    setShowSpouseEditWarning(false);
                    const partner = spouseWarningData.partnerMember;
                    if (partner) {
                      setSelectedMemberId(partner.id);
                      setShowAddMemberForm(false);
                      setIsSidebarOpen(false);
                    }
                    setSpouseWarningData(null);
                  }}
                >
                  <span className="material-symbols-outlined text-sm ltr:mr-2 rtl:ml-2">edit</span>
                  {t('family_builder.edit_member_data', 'تعديل بيانات')} {spouseWarningData.partnerName}
                </Button>
              )}
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <GlobalFooterSimplified />
    </div>
  );
};

export default FamilyBuilderStitch;
