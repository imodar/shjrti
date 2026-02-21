import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Header is handled by StitchLayout
import DashboardLoader from '@/components/stitch/DashboardLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getLocalizedText } from '@/lib/packageUtils';
import { supabase } from '@/integrations/supabase/client';
import { profilesApi, familyInvitationsApi } from '@/lib/api';

interface FamilyWithCount {
  id: string;
  name: string;
  updated_at: string;
  memberCount: number;
  lastActivityAt?: string;
}

interface PackageData {
  max_family_trees: number | null;
  max_family_members: number | null;
  name: Record<string, string>;
  price_sar: number | null;
}

const StitchDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { direction, currentLanguage, t } = useLanguage();
  const { subscription, hasActiveSubscription } = useSubscription();
  
  const [families, setFamilies] = useState<FamilyWithCount[]>([]);
  const [sharedFamilies, setSharedFamilies] = useState<FamilyWithCount[]>([]);
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaderDone, setLoaderDone] = useState(false);

  // Loading steps tracking
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [familiesLoaded, setFamiliesLoaded] = useState(false);
  const [packageLoaded, setPackageLoaded] = useState(false);

  const loadingSteps = [
    { id: 'profile', labelAr: t('loading.verifying_account', 'جاري التحقق من بيانات الحساب...'), labelEn: t('loading.verifying_account', 'Verifying account data...'), completed: profileLoaded },
    { id: 'families', labelAr: t('loading.loading_trees', 'جاري تحميل أشجار العائلة...'), labelEn: t('loading.loading_trees', 'Loading family trees...'), completed: familiesLoaded },
    { id: 'package', labelAr: t('loading.checking_subscription', 'جاري التحقق من الاشتراك...'), labelEn: t('loading.checking_subscription', 'Checking subscription...'), completed: packageLoaded },
  ];

  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || 'User');
  const totalMembers = families.reduce((acc, f) => acc + (f.memberCount || 0), 0);
  const maxTrees = packageData?.max_family_trees || 3;
  const maxMembers = packageData?.max_family_members || 500;
  const treesUsed = families.length;
  const packageName = packageData?.name || subscription?.package_name;
  const localizedPackageName = getLocalizedText(packageName, currentLanguage, '');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        // Step 1: Profile
        try {
          const profile = await profilesApi.get();
          setDisplayName(profile.first_name || user?.email?.split('@')[0] || 'User');
        } catch (e) { console.error('Profile error:', e); }
        setProfileLoaded(true);

        // Step 2: Families
        try {
          const { data: familiesData, error } = await supabase
            .from('families')
            .select(`id, name, updated_at, family_tree_members(count)`)
            .eq('creator_id', user.id)
            .eq('is_archived', false)
            .order('updated_at', { ascending: false });

          if (!error && familiesData) {
            const familyIds = familiesData.map(f => f.id);
            // Fetch last activity date for each family
            let activityMap: Record<string, string> = {};
            if (familyIds.length > 0) {
              const { data: activityData } = await supabase
                .from('activity_log')
                .select('family_id, created_at')
                .in('family_id', familyIds)
                .order('created_at', { ascending: false });
              if (activityData) {
                for (const log of activityData) {
                  if (!activityMap[log.family_id]) {
                    activityMap[log.family_id] = log.created_at;
                  }
                }
              }
            }
            setFamilies(
              familiesData.map(family => ({
                id: family.id,
                name: family.name,
                updated_at: family.updated_at,
                memberCount: (family as any).family_tree_members?.[0]?.count || 0,
                lastActivityAt: activityMap[family.id] || family.updated_at
              }))
            );
          }
        } catch (e) { console.error('Families error:', e); }
        setFamiliesLoaded(true);

        // Step 2b: Shared Families (collaborator)
        try {
          const { data: collabs } = await supabase
            .from('family_collaborators')
            .select('family_id')
            .eq('user_id', user.id);

          if (collabs && collabs.length > 0) {
            const sharedIds = collabs.map(c => (c as any).family_id);
            const { data: sharedData } = await supabase
              .from('families')
              .select('id, name, updated_at, family_tree_members(count)')
              .in('id', sharedIds)
              .eq('is_archived', false);

            if (sharedData) {
              setSharedFamilies(
                sharedData.map(family => ({
                  id: family.id,
                  name: family.name,
                  updated_at: family.updated_at,
                  memberCount: (family as any).family_tree_members?.[0]?.count || 0
                }))
              );
            }
          }
        } catch (e) { console.error('Shared families error:', e); }

        // Step 3: Package/Subscription
        try {
          const { data: subData } = await supabase
            .from('user_subscriptions')
            .select('package_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

          if (subData?.package_id) {
            const { data: pkgData } = await supabase
              .from('packages')
              .select('name, max_family_trees, max_family_members, price_sar')
              .eq('id', subData.package_id)
              .single();
            if (pkgData) setPackageData(pkgData as PackageData);
          }
        } catch (e) { console.error('Package error:', e); }
        setPackageLoaded(true);

      } catch (error) {
        console.error('Error fetching data:', error);
        setProfileLoaded(true);
        setFamiliesLoaded(true);
        setPackageLoaded(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const getTimeAgo = (dateStr: string): string => {
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
  };

  const handleCreateTree = () => {
    navigate('/stitch-family-creator');
  };

  const handleManageTree = (familyId: string) => {
    navigate(`/stitch-family-builder?family=${familyId}`);
  };

  if (loading || !loaderDone) {
    return (
      <DashboardLoader
        steps={loadingSteps}
        onComplete={() => setLoaderDone(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background animate-in fade-in duration-500 relative overflow-hidden">
      {/* Floating background icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Left side icons */}
        <span className="material-symbols-outlined absolute top-[8%] left-[5%] text-[8rem] text-primary/[0.04] rotate-[-15deg] animate-[pulse_6s_ease-in-out_infinite]">park</span>
        <span className="material-symbols-outlined absolute top-[40%] left-[3%] text-[5rem] text-primary/[0.04] rotate-[20deg] animate-[pulse_7s_ease-in-out_infinite]">diversity_3</span>
        <span className="material-symbols-outlined absolute top-[75%] left-[10%] text-[5rem] text-primary/[0.05] rotate-[8deg] animate-[pulse_5s_ease-in-out_infinite]">nature</span>
        <span className="material-symbols-outlined absolute bottom-[10%] left-[25%] text-[4rem] text-primary/[0.03] rotate-[-8deg] animate-[pulse_6s_ease-in-out_infinite]">history_edu</span>
        <span className="material-symbols-outlined absolute top-[22%] left-[12%] text-[4rem] text-primary/[0.03] rotate-[30deg] animate-[pulse_9s_ease-in-out_infinite]">groups</span>
        <span className="material-symbols-outlined absolute top-[50%] left-[8%] text-[6rem] text-primary/[0.04] rotate-[-5deg] animate-[pulse_8s_ease-in-out_infinite]">forest</span>
        <span className="material-symbols-outlined absolute top-[65%] left-[2%] text-[4rem] text-primary/[0.03] rotate-[18deg] animate-[pulse_10s_ease-in-out_infinite]">bookmark</span>
        <span className="material-symbols-outlined absolute bottom-[30%] left-[18%] text-[5rem] text-primary/[0.04] rotate-[-20deg] animate-[pulse_7s_ease-in-out_infinite]">emoji_people</span>

        {/* Right side icons */}
        <span className="material-symbols-outlined absolute top-[15%] right-[8%] text-[6rem] text-primary/[0.05] rotate-[12deg] animate-[pulse_8s_ease-in-out_infinite]">family_restroom</span>
        <span className="material-symbols-outlined absolute top-[55%] right-[4%] text-[7rem] text-primary/[0.04] rotate-[-10deg] animate-[pulse_9s_ease-in-out_infinite]">account_tree</span>
        <span className="material-symbols-outlined absolute top-[30%] right-[15%] text-[4rem] text-primary/[0.03] rotate-[-25deg] animate-[pulse_10s_ease-in-out_infinite]">favorite</span>
        <span className="material-symbols-outlined absolute bottom-[20%] right-[12%] text-[6rem] text-primary/[0.04] rotate-[15deg] animate-[pulse_7s_ease-in-out_infinite]">photo_library</span>
        <span className="material-symbols-outlined absolute top-[5%] right-[20%] text-[5rem] text-primary/[0.03] rotate-[22deg] animate-[pulse_7s_ease-in-out_infinite]">eco</span>
        <span className="material-symbols-outlined absolute top-[45%] right-[6%] text-[4rem] text-primary/[0.04] rotate-[-18deg] animate-[pulse_6s_ease-in-out_infinite]">home</span>
        <span className="material-symbols-outlined absolute top-[70%] right-[10%] text-[5rem] text-primary/[0.03] rotate-[10deg] animate-[pulse_8s_ease-in-out_infinite]">psychology</span>
        <span className="material-symbols-outlined absolute bottom-[5%] right-[22%] text-[4rem] text-primary/[0.04] rotate-[-12deg] animate-[pulse_9s_ease-in-out_infinite]">spa</span>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-5">
        {/* Hero Section */}
        <section className="hero-glass rounded-[2rem] p-6 mb-10 shadow-xl shadow-slate-200/50 relative overflow-hidden border border-white dark:border-border">
          <div className="absolute inset-0 flex items-center justify-center tree-silhouette">
            <span className="material-symbols-outlined text-[50rem]" style={{ color: 'rgb(63 176 135 / 10%)' }}>park</span>
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold mb-3">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                {t('dashboard.personal_workspace', 'Personal Workspace')}
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3 tracking-tight">
                {t('dashboard.welcome_back', 'Welcome back')}, <span className="text-primary">{displayName}</span>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-lg">
                {t('dashboard.legacy_description', 'Your family legacy continues to grow. You have documented')} <span className="text-foreground font-bold">{totalMembers} {t('dashboard.relatives', 'relatives')}</span> {t('dashboard.across_trees', 'across your family trees.')}
              </p>
              
              <div className="space-y-3 max-w-md">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>{t('dashboard.family_trees_section', 'Tree Slots')}</span>
                    <span className="text-foreground">{treesUsed} / {maxTrees} {t('dashboard.family_trees_section', 'Trees')}</span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.3)]" 
                      style={{ width: `${Math.min((treesUsed / maxTrees) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>{t('total_members', 'Member Limit')}</span>
                    <span className="text-foreground">{totalMembers} / {maxMembers} {t('total_members', 'Members')}</span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${Math.min((totalMembers / maxMembers) * 100, 100)}%`,
                        background: 'linear-gradient(135deg, hsl(37 60% 60%), hsl(37 50% 50%))',
                        boxShadow: '0 0 10px hsla(37, 60%, 60%, 0.3)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {!packageData && (
              <div className="w-full lg:w-64 flex-shrink-0">
                {/* Free Plan - Gold Upgrade CTA */}
                <div className="rounded-2xl p-5 shadow-xl border-2 border-yellow-400/50 relative overflow-hidden group"
                  style={{ background: 'linear-gradient(135deg, hsl(45 100% 96%), hsl(40 80% 90%))' }}>
                  <div className="absolute top-0 right-0 w-28 h-28 rounded-full -mr-14 -mt-14 transition-transform group-hover:scale-110"
                    style={{ background: 'hsla(37, 60%, 60%, 0.15)' }} />
                  <div className="relative z-10 text-center">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: 'hsla(37, 60%, 60%, 0.2)' }}>
                      <span className="material-symbols-outlined text-3xl" style={{ color: 'hsl(37 60% 45%)' }}>workspace_premium</span>
                    </div>
                    <h3 className="text-base font-bold mb-1" style={{ color: 'hsl(37 50% 35%)' }}>
                      {t('dashboard.free_plan', 'Free Plan')}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                      {t('dashboard.upgrade_text', 'Upgrade for unlimited features')}
                    </p>
                    <button
                      onClick={() => navigate('/stitch-account')}
                      className="w-full text-white font-bold py-3 rounded-xl text-sm shadow-lg hover:brightness-110 hover:-translate-y-0.5 transition-all"
                      style={{ background: 'linear-gradient(135deg, hsl(37 70% 55%), hsl(30 70% 45%))' }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-lg">rocket_launch</span>
                        {t('dashboard.upgrade_now', 'Upgrade Now')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Family Trees Section */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground">{t('dashboard.my_family_trees', 'My Family Trees')}</h3>
              <p className="text-muted-foreground mt-1">{t('dashboard.family_trees_subtitle', 'Curate and maintain your family lineages')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Family Trees first */}
            {families.map((family) => (
              <div 
                key={family.id}
                className="bg-card border border-border rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">park</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-muted border border-border rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{t('dashboard.active_tree', 'Active Tree')}</span>
                  </div>
                </div>
                <h4 className="text-2xl font-bold text-foreground mb-1">{family.name}</h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-6">
                  ID: {family.id.substring(0, 8).toUpperCase()}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{t('dashboard.members', 'Members')}</p>
                    <p className="text-lg font-bold text-foreground">{family.memberCount || 0}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{t('dashboard.updated', 'Updated')}</p>
                    <p className="text-lg font-bold text-primary">
                      {(family.lastActivityAt || family.updated_at) ? new Date(family.lastActivityAt || family.updated_at).toLocaleDateString() : t('dashboard.not_available', 'N/A')}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => handleManageTree(family.id)}
                    className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-all"
                  >
                     {t('dashboard.manage', 'Manage')}
                  </button>
                  <button 
                    onClick={() => navigate(`/stitch-family-builder?family=${family.id}&tab=settings`)}
                    className="px-3 border border-border text-muted-foreground rounded-xl hover:bg-muted flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Create New Tree / Upgrade Card */}
            {treesUsed < maxTrees ? (
              <button 
                onClick={handleCreateTree}
                className="dashed-card bg-card rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-6 min-h-[340px] group"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-all duration-300">
                  <span className="material-symbols-outlined text-5xl">add</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground mb-2">
                    {t('dashboard.create_new_tree', 'Create New Tree')}
                  </h4>
                  <p className="text-muted-foreground text-sm max-w-[200px] leading-relaxed">
                    {t('dashboard.create_tree_description', 'Start a new lineage and begin documenting your heritage.')}
                  </p>
                </div>
              </button>
            ) : (
              <button 
                onClick={() => navigate('/plan-selection')}
                className="rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-6 min-h-[340px] group border-2 border-dashed border-border relative overflow-hidden bg-muted/40"
              >
                <div className="absolute inset-0 opacity-10"
                  style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--muted-foreground)), transparent 70%)' }} />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform bg-muted">
                    <span className="material-symbols-outlined text-5xl text-muted-foreground">lock</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-foreground">
                      {t('dashboard.upgrade_required', 'Tree Limit Reached')}
                    </h4>
                    <p className="text-sm max-w-[220px] leading-relaxed mb-4 text-muted-foreground">
                      {t('dashboard.reached_tree_limit', `You've reached your limit of ${maxTrees} trees. Upgrade to add more.`)}
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Shared Families Section */}
        {sharedFamilies.length > 0 && (
          <div className="mb-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground">{t('dashboard.shared_trees', 'Trees I Manage')}</h3>
                <p className="text-muted-foreground mt-1">{t('dashboard.shared_trees_subtitle', 'Family trees shared with you as a collaborator')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sharedFamilies.map((family) => (
                <div 
                  key={family.id}
                  className="bg-card border border-border rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-blue-500/5 text-blue-500 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl">group</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full">
                      <span className="material-symbols-outlined text-blue-500 text-sm">edit</span>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t('dashboard.editor_role', 'Editor')}</span>
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold text-foreground mb-1">{family.name}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-6">
                    ID: {family.id.substring(0, 8).toUpperCase()}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{t('dashboard.members', 'Members')}</p>
                      <p className="text-lg font-bold text-foreground">{family.memberCount || 0}</p>
                    </div>
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{t('dashboard.updated', 'Updated')}</p>
                      <p className="text-lg font-bold text-primary">
                        {family.updated_at ? new Date(family.updated_at).toLocaleDateString() : t('dashboard.not_available', 'N/A')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <button 
                      onClick={() => handleManageTree(family.id)}
                      className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-all"
                    >
                      {t('dashboard.manage', 'Manage')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-20 pt-12 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex gap-5">
            <div className="w-12 h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-blue-500">verified_user</span>
            </div>
            <div>
               <h5 className="font-bold text-foreground mb-2">{t('dashboard.secure_private', 'Secure & Private')}</h5>
               <p className="text-muted-foreground text-sm leading-relaxed">{t('dashboard.secure_private_desc', 'Your family data is encrypted and only visible to you and your invited members.')}</p>
            </div>
          </div>
          <div className="flex gap-5">
            <div className="w-12 h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-accent-gold">lightbulb</span>
            </div>
            <div>
               <h5 className="font-bold text-foreground mb-2">{t('dashboard.build_together', 'Build Together')}</h5>
               <p className="text-muted-foreground text-sm leading-relaxed">{t('dashboard.build_together_desc', 'Invite siblings and cousins to contribute photos and stories to your shared tree.')}</p>
            </div>
          </div>
          <div className="flex gap-5">
            <div className="w-12 h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">support_agent</span>
            </div>
            <div>
               <h5 className="font-bold text-foreground mb-2">{t('dashboard.expert_support', 'Expert Support')}</h5>
               <p className="text-muted-foreground text-sm leading-relaxed">{t('dashboard.expert_support_desc', 'Need help tracing your roots? Our genealogy experts are here to assist you.')}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-border mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-muted-foreground text-lg">park</span>
            </div>
             <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[2px]">{t('dashboard.copyright', '© 2024 Shjrti Platform')}</p>
           </div>
           <nav className="flex gap-8">
             <a className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" href="/privacy-policy">{t('dashboard.privacy', 'Privacy')}</a>
             <a className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" href="/terms-conditions">{t('dashboard.terms', 'Terms')}</a>
             <a className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" href="/api-docs">{t('dashboard.api_docs', 'API docs')}</a>
             <a className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" href="/contact">{t('dashboard.support', 'Support')}</a>
          </nav>
        </div>
      </footer>

      {/* Mobile FAB */}
      <button 
        onClick={handleCreateTree}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center z-50"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
};

export default StitchDashboard;
