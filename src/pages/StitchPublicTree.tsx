import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { StitchFamilyBar, StitchSidebar, StitchMainContent } from '@/components/stitch';
import { StitchTreeCanvas } from '@/components/stitch/TreeCanvas';
import { StitchHeader } from '@/components/stitch/Header';
import DashboardLoader from '@/components/stitch/DashboardLoader';
import StitchMemberProfileSkeleton from '@/components/stitch/MemberProfileSkeleton';
import PasswordModal from '@/components/PasswordModal';
import { SuggestEditDialog } from '@/components/SuggestEditDialog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GlobalFooterSimplified } from '@/components/GlobalFooterSimplified';
import { cn } from '@/lib/utils';
import { isMemberFromFamily } from '@/lib/memberDisplayUtils';
import type { Member, Marriage } from '@/types/family.types';

/**
 * StitchPublicTree - Public family tree view with Stitch theme
 * Accessible via /stitch-tree?token=xxx
 * Uses get-shared-family Edge Function for token-based access
 */
interface StitchPublicTreeProps {
  /** Pre-loaded data from CustomDomainRedirect (skips token-based fetch) */
  preloadedData?: {
    family: any;
    members: Member[];
    marriages: Marriage[];
    activities?: any[];
  };
}

const StitchPublicTree: React.FC<StitchPublicTreeProps> = ({ preloadedData }) => {
  const [searchParams] = useSearchParams();
  const { currentTheme, setCurrentTheme } = useTheme();
  const { t, direction } = useLanguage();
  const shareToken = searchParams.get('token');

  // Theme management
  const previousThemeRef = useRef(currentTheme);
  useEffect(() => {
    if (currentTheme !== 'stitch') {
      previousThemeRef.current = currentTheme;
    }
    setCurrentTheme('stitch');
    const html = document.documentElement;
    html.classList.remove('theme-modern', 'theme-professional');
    html.classList.add('theme-stitch');
    return () => {
      if (previousThemeRef.current !== 'stitch') {
        setCurrentTheme(previousThemeRef.current);
      }
      const html = document.documentElement;
      html.classList.remove('theme-stitch');
      if (previousThemeRef.current === 'professional') html.classList.add('theme-professional');
      else html.classList.add('theme-modern');
    };
  }, [setCurrentTheme]);

  // Data state
  const [familyData, setFamilyData] = useState<any>(preloadedData?.family || null);
  const [familyMembers, setFamilyMembers] = useState<Member[]>(preloadedData?.members || []);
  const [marriages, setMarriages] = useState<Marriage[]>(preloadedData?.marriages || []);
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: 'edit' | 'add' | 'photo' | 'delete';
    title: string;
    highlight: string;
    timestamp: string;
    actorName?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(!preloadedData);

  // UI state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');

  // Navigation state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const profileLoadingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (profileLoadingTimerRef.current) {
        window.clearTimeout(profileLoadingTimerRef.current);
      }
    };
  }, []);

  // Suggestions dialog
  const [suggestEditOpen, setSuggestEditOpen] = useState(false);
  const [suggestEditMemberId, setSuggestEditMemberId] = useState('');
  const [suggestEditMemberName, setSuggestEditMemberName] = useState('');

  // Tree view state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal' | 'radial'>('horizontal');
  const [selectedRootMarriage, setSelectedRootMarriage] = useState<string>('all');

  // Load data via Edge Function
  const loadFamilyData = useCallback(async (password?: string) => {
    if (!shareToken) {
      setTokenError('TOKEN_REQUIRED');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setTokenError(null);

      const { data, error } = await supabase.functions.invoke('get-shared-family', {
        body: {
          share_token: shareToken,
          password: password || enteredPassword || undefined,
        },
      });

      if (error) {
        console.error('[StitchPublicTree] Edge Function error:', error);
        setTokenError('NETWORK_ERROR');
        setIsLoading(false);
        return;
      }

      if (!data?.success) {
        const errorCode = data?.error;
        if (errorCode === 'PASSWORD_REQUIRED') {
          setShowPasswordModal(true);
          setIsLoading(false);
          return;
        }
        if (errorCode === 'PASSWORD_INCORRECT') {
          setPasswordError(true);
          setShowPasswordModal(true);
          setIsLoading(false);
          return;
        }
        setTokenError(errorCode || 'UNKNOWN_ERROR');
        setIsLoading(false);
        return;
      }

      // Success
      const { family, members, marriages: marriageData, activities } = data.data;
      setFamilyData(family);
      setFamilyMembers(members || []);
      setMarriages(marriageData || []);

      // Map activities
      const actionTypeMap: Record<string, { type: 'edit' | 'add' | 'photo' | 'delete'; title: string }> = {
        member_added: { type: 'add', title: t('activity.member_added', 'تمت إضافة') },
        member_updated: { type: 'edit', title: t('activity.member_updated', 'تم تعديل') },
        member_deleted: { type: 'delete', title: t('activity.member_deleted', 'تم حذف') },
        photo_uploaded: { type: 'photo', title: t('activity.photo_uploaded', 'تم رفع صورة') },
        marriage_added: { type: 'add', title: t('activity.marriage_added', 'تمت إضافة زواج') },
        marriage_deleted: { type: 'delete', title: t('activity.marriage_deleted', 'تم حذف زواج') },
        settings_changed: { type: 'edit', title: t('activity.settings_changed', 'تم تغيير الإعدادات') },
      };

      const mapped = (activities || []).map((log: any) => {
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

      setShowPasswordModal(false);
      setPasswordError(false);
      setIsLoading(false);
    } catch (err) {
      console.error('[StitchPublicTree] Unexpected error:', err);
      setTokenError('NETWORK_ERROR');
      setIsLoading(false);
    }
  }, [shareToken, enteredPassword]);

  // Helper: time ago
  function getTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return t('time.just_now', 'الآن');
    if (diff < 3600) return `${t('time.ago', 'منذ')} ${Math.floor(diff / 60)} ${t('time.minutes', 'دقيقة')}`;
    if (diff < 86400) return `${t('time.ago', 'منذ')} ${Math.floor(diff / 3600)} ${t('time.hours', 'ساعة')}`;
    if (diff < 2592000) return `${t('time.ago', 'منذ')} ${Math.floor(diff / 86400)} ${t('time.days', 'يوم')}`;
    return `${t('time.ago', 'منذ')} ${Math.floor(diff / 2592000)} ${t('time.months', 'شهر')}`;
  }

  useEffect(() => {
    if (preloadedData) {
      // Map preloaded activities (from custom domain redirect)
      if (preloadedData.activities && preloadedData.activities.length > 0) {
        const actionTypeMap: Record<string, { type: 'edit' | 'add' | 'photo' | 'delete'; title: string }> = {
          member_added: { type: 'add', title: t('activity.member_added', 'تمت إضافة') },
          member_updated: { type: 'edit', title: t('activity.member_updated', 'تم تعديل') },
          member_deleted: { type: 'delete', title: t('activity.member_deleted', 'تم حذف') },
          photo_uploaded: { type: 'photo', title: t('activity.photo_uploaded', 'تم رفع صورة') },
          marriage_added: { type: 'add', title: t('activity.marriage_added', 'تمت إضافة زواج') },
          marriage_deleted: { type: 'delete', title: t('activity.marriage_deleted', 'تم حذف زواج') },
          settings_changed: { type: 'edit', title: t('activity.settings_changed', 'تم تغيير الإعدادات') },
        };
        const mapped = preloadedData.activities.map((log: any) => {
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
      }
    } else {
      loadFamilyData();
    }
  }, [shareToken, preloadedData]);

  // Password handler
  const handlePasswordSubmit = async (password: string) => {
    setEnteredPassword(password);
    await loadFamilyData(password);
  };

  // Tab change
  const handleTabChange = useCallback((tab: string) => {
    setSelectedMemberId(undefined);
    setActiveTab(tab);
  }, []);

  // Member click
  const handleMemberClick = (member: any) => {
    setSelectedMemberId(member.id);
    setIsSidebarOpen(false);
    // Show a brief skeleton so the user feels the profile is opening,
    // even when data is already cached locally.
    if (profileLoadingTimerRef.current) {
      window.clearTimeout(profileLoadingTimerRef.current);
    }
    setIsProfileLoading(true);
    profileLoadingTimerRef.current = window.setTimeout(() => {
      setIsProfileLoading(false);
      profileLoadingTimerRef.current = null;
    }, 350);
  };

  const handleBackFromProfile = () => {
    setSelectedMemberId(undefined);
    if (profileLoadingTimerRef.current) {
      window.clearTimeout(profileLoadingTimerRef.current);
      profileLoadingTimerRef.current = null;
    }
    setIsProfileLoading(false);
  };

  // Suggest edit handler
  const handleSuggestEdit = (memberId: string, memberName: string) => {
    setSuggestEditMemberId(memberId);
    setSuggestEditMemberName(memberName);
    setSuggestEditOpen(true);
  };

  // Filter members
  const filteredMembers = useMemo(() => {
    const visibleMembers = familyMembers.filter(
      member => member.first_name !== 'unknown_mother'
    );
    if (!searchTerm.trim()) return visibleMembers;
    const term = searchTerm.toLowerCase();
    return visibleMembers.filter(member => {
      const fullName = `${member.first_name || ''} ${member.last_name || ''} ${(member as any).name || ''}`.toLowerCase();
      return fullName.includes(term);
    });
  }, [familyMembers, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const getDepth = (memberId: string, visited = new Set<string>()): number => {
      if (visited.has(memberId)) return 0;
      visited.add(memberId);
      const children = familyMembers.filter(m => m.father_id === memberId || m.mother_id === memberId);
      if (children.length === 0) return 1;
      return 1 + Math.max(...children.map(c => getDepth(c.id, visited)));
    };
    const founders = familyMembers.filter(m => m.is_founder);
    const maxGen = founders.length > 0 ? Math.max(...founders.map(f => getDepth(f.id))) : (familyMembers.length > 0 ? 1 : 0);
    return { totalMembers: familyMembers.length, generations: maxGen };
  }, [familyMembers]);

  // Upcoming birthdays
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    return familyMembers
      .filter(m => m.birth_date && m.is_alive !== false)
      .map(m => {
        const [year, month, day] = m.birth_date!.split('-').map(Number);
        const nextBirthday = new Date(today.getFullYear(), month - 1, day);
        if (nextBirthday < today && !(nextBirthday.getMonth() === todayMonth && nextBirthday.getDate() === todayDate)) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        const diffTime = nextBirthday.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const initials = (m.first_name?.[0] || (m as any).name?.[0] || '?').toUpperCase();
        return {
          id: m.id,
          title: (m as any).name || `${m.first_name || ''} ${m.last_name || ''}`.trim(),
          date: `${day}/${month}`,
          daysUntil: daysUntil === 0 ? 0 : daysUntil,
          image: m.image_url || undefined,
          initials,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3);
  }, [familyMembers]);

  // Selected member
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return undefined;
    return familyMembers.find(m => m.id === selectedMemberId);
  }, [selectedMemberId, familyMembers]);

  // Tree root options with lineage display (same as private tree view)
  const rootOptions = useMemo(() => {
    if (!marriages || marriages.length === 0) return [];

    const getLineageLabel = (member: Member | undefined): string => {
      if (!member) return t('tree_view.unknown', 'غير معروف');
      const firstName = member.first_name || member.name?.split(' ')[0] || member.name || '';
      const isFromFamily = isMemberFromFamily(member, familyMembers);

      if (isFromFamily) {
        // Family member: show "name ابن/بنت parent_name"
        const fatherId = member.father_id || (member as any).fatherId;
        const father = fatherId ? familyMembers.find(m => m.id === fatherId) : undefined;
        if (father && !member.is_founder) {
          const parentName = father.first_name || father.name?.split(' ')[0] || father.name || '';
          const term = member.gender === 'female' ? 'بنت' : 'ابن';
          return `${firstName} ${term} ${parentName}`;
        }
        return firstName;
      } else {
        // External spouse: show "name + last_name"
        if (member.last_name) {
          return `${firstName} ${member.last_name}`;
        }
        return firstName;
      }
    };

    return marriages.map(marriage => {
      const husband = familyMembers.find(m => m.id === marriage.husband_id);
      const wife = familyMembers.find(m => m.id === marriage.wife_id);
      const husbandLabel = getLineageLabel(husband);
      const wifeLabel = getLineageLabel(wife);
      const isActive = (marriage as any).is_active !== false && (marriage as any).marital_status !== 'divorced';
      const heartIcon = isActive ? '❤️' : '💔';
      return {
        id: marriage.id,
        label: `${husbandLabel} ${heartIcon} ${wifeLabel}`
      };
    });
  }, [marriages, familyMembers, t]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => setZoomLevel(prev => Math.min(prev + 0.1, 2)), []);
  const handleZoomOut = useCallback(() => setZoomLevel(prev => Math.max(prev - 0.1, 0.3)), []);
  const handleResetZoom = useCallback(() => setZoomLevel(1), []);

  // Get family name
  const familyName = useMemo(() => {
    if (!familyData?.name) return '';
    if (typeof familyData.name === 'string') return familyData.name;
    if (typeof familyData.name === 'object') return familyData.name.ar || familyData.name.en || '';
    return '';
  }, [familyData]);

  // --- Error States ---
  if (tokenError) {
    const errorMessages: Record<string, { title: string; desc: string; icon: string }> = {
      TOKEN_REQUIRED: {
        title: t('public_tree.token_required', 'رابط غير صالح'),
        desc: t('public_tree.token_required_desc', 'الرجاء استخدام رابط المشاركة الصحيح'),
        icon: 'link_off',
      },
      TOKEN_INVALID: {
        title: t('public_tree.token_invalid', 'رابط غير صالح'),
        desc: t('public_tree.token_invalid_desc', 'الرابط غير صحيح أو تم حذفه'),
        icon: 'error_outline',
      },
      TOKEN_EXPIRED: {
        title: t('public_tree.token_expired', 'انتهت صلاحية الرابط'),
        desc: t('public_tree.token_expired_desc', 'يرجى طلب رابط مشاركة جديد من صاحب الشجرة'),
        icon: 'schedule',
      },
      NETWORK_ERROR: {
        title: t('common.error', 'خطأ'),
        desc: t('common.network_error', 'حدث خطأ في الاتصال'),
        icon: 'wifi_off',
      },
    };
    const err = errorMessages[tokenError] || errorMessages.NETWORK_ERROR;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-destructive">{err.icon}</span>
          </div>
          <h1 className="text-2xl font-bold mb-3">{err.title}</h1>
          <p className="text-muted-foreground">{err.desc}</p>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (isLoading) {
    return (
      <DashboardLoader
        steps={[
          { id: 'token', labelAr: 'جاري التحقق من الرابط...', labelEn: 'Verifying link...', completed: false },
        ]}
      />
    );
  }

  // --- Password Modal ---
  if (showPasswordModal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PasswordModal
          isOpen={true}
          onClose={() => {
            setShowPasswordModal(false);
            setTokenError('TOKEN_REQUIRED');
          }}
          onSubmit={handlePasswordSubmit}
          familyName={familyName}
        />
        {passwordError && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-6 py-3 rounded-xl shadow-lg text-sm font-medium">
            {t('public_tree.wrong_password', 'كلمة المرور غير صحيحة')}
          </div>
        )}
      </div>
    );
  }

  // --- Public tabs ---
  const publicTabs = [
    { id: 'dashboard', label: t('stitch.tab.dashboard', 'لوحة التحكم'), icon: 'dashboard' },
    { id: 'tree', label: t('stitch.tab.tree_view', 'عرض الشجرة'), icon: 'account_tree' },
    { id: 'gallery', label: t('stitch.tab.gallery', 'المعرض'), icon: 'photo_library' },
    { id: 'statistics', label: t('stitch.tab.statistics', 'الإحصائيات'), icon: 'bar_chart' },
  ];

  const showSuggestions = activeTab === 'suggestions';
  const showStatistics = activeTab === 'statistics';
  const showGallery = activeTab === 'gallery';
  const showTree = activeTab === 'tree';

  return (
    <div className="min-h-screen theme-stitch">
      {/* Public Header */}
      <header className="h-14 md:h-16 lg:h-20 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-3 md:px-4 lg:px-6 sticky top-0 z-50">
        {/* Brand */}
        <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
          <div className="w-9 h-9 md:w-11 md:h-11 lg:w-14 lg:h-14 bg-primary rounded-lg lg:rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <span className="material-icons-round text-xl md:text-2xl lg:text-3xl">park</span>
          </div>
          <div>
            <h1 className="font-bold text-lg md:text-xl lg:text-2xl leading-tight">{t('site.name', 'شجرتي')}</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('stitch.genealogy_platform', 'منصة الأنساب')}</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-muted p-1 rounded-xl">
          {publicTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'font-bold bg-card text-primary rounded-lg shadow-sm'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right: Language + Mobile menu */}
        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitcher />
          {/* Mobile tab selector */}
          <div className="lg:hidden">
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="bg-muted border-none rounded-lg px-2 py-1.5 text-sm font-medium"
            >
              {publicTabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Family Bar - sticky below header */}
      <div className="sticky top-14 md:top-16 lg:top-20 z-40 bg-card">
        <StitchFamilyBar
          familyName={familyName}
          onSwitchTree={() => {}}
          lastUpdated={recentActivities.length > 0 ? recentActivities[0].timestamp : undefined}
          showRootSelector={showTree}
          rootOptions={rootOptions}
          selectedRoot={selectedRootMarriage}
          onRootChange={(id) => { setSelectedRootMarriage(id); setZoomLevel(1); }}
        />
      </div>

      {/* Tree View */}
      {showTree ? (
        <StitchTreeCanvas
          familyMembers={familyMembers}
          marriages={marriages}
           zoomLevel={zoomLevel}
           viewMode={viewMode}
           onZoomIn={handleZoomIn}
           onZoomOut={handleZoomOut}
           onResetZoom={handleResetZoom}
           onZoomSet={setZoomLevel}
          selectedRootMarriage={selectedRootMarriage}
        />
      ) : (
        <>
          {/* Mobile members bar */}
          {!showGallery && !showStatistics && !isSidebarOpen && (
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
            {/* Sidebar - readOnly: hide add buttons */}
            {!showGallery && !showStatistics && (
              <StitchSidebar
                members={filteredMembers}
                totalCount={stats.totalMembers}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onMemberClick={handleMemberClick}
                onAddMember={() => {}} // no-op in public
                selectedMemberId={selectedMemberId}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                familyMembers={familyMembers}
                marriages={marriages}
                canAddMember={false}
                maxFamilyMembers={0}
                readOnly={true}
              />
            )}

            {/* Main Content */}
            {isProfileLoading && selectedMemberId ? (
              <StitchMemberProfileSkeleton />
            ) : (
            <StitchMainContent
              userName={t('public_tree.visitor', 'زائر')}
              activities={recentActivities}
              milestones={upcomingBirthdays}
              familyMembers={familyMembers}
              marriages={marriages}
              familyId={familyData?.id || ''}
              familyData={familyData}
              showSuggestions={false}
              showStatistics={showStatistics}
              showGallery={showGallery}
              selectedMember={selectedMember}
              onBackFromProfile={handleBackFromProfile}
              onMemberClick={handleMemberClick}
              readOnly={true}
              onSuggestEdit={handleSuggestEdit}
            />
            )}
          </main>
        </>
      )}

      {/* Suggest Edit Dialog - available from suggestions tab or member profile */}
      <SuggestEditDialog
        isOpen={suggestEditOpen || showSuggestions}
        onClose={() => {
          setSuggestEditOpen(false);
          if (showSuggestions) handleTabChange('dashboard');
        }}
        familyId={familyData?.id || ''}
        memberId={suggestEditMemberId || undefined}
        memberName={suggestEditMemberName || undefined}
      />

      <GlobalFooterSimplified />
    </div>
  );
};

export default StitchPublicTree;
