import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useFamilyData } from '@/contexts/FamilyDataContext';
import { profilesApi, subscriptionsApi } from '@/lib/api';
import { familiesApi } from '@/lib/api/endpoints/families';
import { StitchHeader, StitchFamilyBar } from '@/components/stitch';
import { useToast } from '@/hooks/use-toast';
import AccountDeleteModal from '@/components/AccountDeleteModal';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const StitchAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentTheme, setCurrentTheme } = useTheme();
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  const { subscription } = useSubscription();
  const { familyData } = useFamilyData();
  const { toast } = useToast();
  const previousThemeRef = useRef(currentTheme);

  // Apply stitch theme
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

  // Profile state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({ familiesCreated: 0, totalMembers: 0 });
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Subscription info
  const [packageInfo, setPackageInfo] = useState<{
    name: string;
    expiresAt?: string | null;
    maxMembers?: number | null;
  } | null>(null);

  // Fetch profile via API
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profile = await profilesApi.get();
        setProfileData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email || user.email || '',
          phone: profile.phone || '',
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Fetch subscription via API
  useEffect(() => {
    if (!user) return;
    const fetchSub = async () => {
      try {
        const sub = await subscriptionsApi.get();
        const pkg = sub?.packages;
        let name = 'Free Plan';
        if (pkg?.name) {
          try {
            const nameObj = typeof pkg.name === 'string' ? JSON.parse(pkg.name) : pkg.name;
            name = nameObj.ar || nameObj.en || 'Free Plan';
          } catch {
            name = typeof pkg.name === 'string' ? pkg.name : 'Free Plan';
          }
        }
        setPackageInfo({
          name,
          expiresAt: sub?.expires_at,
          maxMembers: pkg?.max_family_members,
        });
      } catch (err) {
        console.error('Error fetching subscription:', err);
      }
    };
    fetchSub();
  }, [user]);

  // Fetch stats via API
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const families = await familiesApi.list();
        const totalMembers = families.reduce((acc: number, f: any) => acc + (f.member_count || 0), 0);
        setStats({ familiesCreated: families.length, totalMembers });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, [user]);

  // Save profile via API
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await profilesApi.update({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
      });
      toast({ title: t('profile.save', 'Saved'), description: t('profile.profile_updated', 'Profile updated successfully') });
    } catch (err) {
      toast({ title: t('profile.error', 'Error'), description: t('profile.profile_update_error', 'Failed to update profile'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Change password (uses supabase.auth — this is auth SDK, not a direct DB query)
  const handleUpdatePassword = async () => {
    if (!passwordData.newPassword) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: t('profile.error', 'Error'), description: 'كلمات المرور غير متطابقة', variant: 'destructive' });
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) {
        toast({ title: t('profile.error', 'Error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'نجح', description: 'تم تغيير كلمة المرور بنجاح' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch {
      toast({ title: t('profile.error', 'Error'), description: 'حدث خطأ غير متوقع', variant: 'destructive' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
  const packageName = subscription?.package_name || { en: 'Free Plan', ar: 'باقة مجانية' };
  const familyId = searchParams.get('family') || '';

  if (loading) {
    return (
      <div className="theme-stitch min-h-screen flex items-center justify-center bg-[hsl(var(--stitch-bg))]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('theme-stitch min-h-screen overflow-hidden', direction === 'rtl' && 'rtl')}>
      {/* Header */}
      <StitchHeader
        familyName={familyData?.name || 'Shjrti'}
        userName={userName}
        packageName={packageName}
        activeTab="account"
        onTabChange={(tab) => {
          if (tab === 'dashboard') navigate(`/family-builder-stitch?family=${familyId}&tab=dashboard`);
          else if (tab === 'account') return;
          else navigate(`/family-builder-stitch?family=${familyId}&tab=${tab}`);
        }}
        suggestionsCount={0}
        isOwner={true}
      />

      {/* Family Bar */}
      <StitchFamilyBar
        familyName={familyData?.name || ''}
        onSwitchTree={() => navigate('/stitch-dashboard')}
        lastUpdated=""
      />

      {/* Main Content */}
      <main className="flex h-[calc(100vh-120px)]">
        {/* Content Area */}
        <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            {/* Page Header */}
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {t('profile.page_title', 'User Profile Settings')}
              </h2>
              <p className="text-muted-foreground">
                {t('profile.welcome_back', 'Manage your personal information and account security preferences.')}
              </p>
            </header>

            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">person</span>
                  </div>
                  <h3 className="font-bold text-lg">{t('profile.personal_information', 'Personal Information')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                      {t('profile.first_name', 'First Name')}
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                      {t('profile.last_name', 'Last Name')}
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                      {t('profile.email', 'Email Address')}
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                      {t('profile.phone', 'Phone Number')}
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('profile.saving', 'Saving...')}
                      </span>
                    ) : (
                      t('profile.save', 'Save Changes')
                    )}
                  </button>
                </div>
              </div>

              {/* Security & Password Card */}
              <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">shield</span>
                  </div>
                  <h3 className="font-bold text-lg">{t('profile.change_password', 'Security & Password')}</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                      {t('profile.current_password', 'Current Password')}
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                        {t('profile.new_password', 'New Password')}
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                        {t('profile.confirm_password', 'Confirm New Password')}
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleUpdatePassword}
                    disabled={passwordSaving || !passwordData.newPassword}
                    className="px-6 py-2.5 border-2 border-border text-muted-foreground rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {passwordSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ...
                      </span>
                    ) : (
                      t('profile.update_password', 'Update Password')
                    )}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 dark:bg-red-950/20 p-8 rounded-2xl shadow-sm border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">warning</span>
                  </div>
                  <h3 className="font-bold text-lg text-red-700 dark:text-red-400">
                    {t('profile.danger_zone', 'Danger Zone')}
                  </h3>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  حذف حسابك سيؤدي إلى إزالة جميع بياناتك نهائيًا.
                </p>
                <button
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
                >
                  {t('profile.delete_account', 'Delete Account')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel - Subscription Status */}
        <aside className="w-80 bg-card border-l border-border flex-col p-6 overflow-y-auto hidden xl:flex custom-scrollbar">
          {/* Subscription Status */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">{t('dashboard.active_subscription', 'Subscription Status')}</h3>
              <span className="material-symbols-outlined text-primary">verified_user</span>
            </div>
            <div className="p-5 bg-gradient-to-br from-primary to-emerald-600 rounded-2xl text-white shadow-lg shadow-primary/20 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                    {t('profile.current_plan', 'Current Plan')}
                  </p>
                  <h4 className="text-xl font-bold">{packageInfo?.name || 'Free'}</h4>
                </div>
              </div>
              {packageInfo?.expiresAt && (
                <p className="text-xs opacity-90 leading-relaxed mb-4">
                  {t('dashboard.valid_until', 'Renewing on')} {new Date(packageInfo.expiresAt).toLocaleDateString()}
                </p>
              )}
              <button
                onClick={() => navigate('/payments')}
                className="w-full py-2 bg-white text-primary text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                {t('profile.manage_subscription', 'Manage Subscription')}
              </button>
            </div>

            {/* Stats */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    {t('profile.total_members', 'Total Members')}
                  </p>
                  <p className="text-xs font-bold">
                    {stats.totalMembers}{packageInfo?.maxMembers ? ` / ${packageInfo.maxMembers}` : ''}
                  </p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${packageInfo?.maxMembers ? Math.min(100, (stats.totalMembers / packageInfo.maxMembers) * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    {t('profile.families_created', 'Families Created')}
                  </p>
                  <p className="text-xs font-bold">{stats.familiesCreated}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div>
            <h3 className="font-bold mb-4">Security Tips</h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-round text-amber-500 text-sm">lightbulb</span>
                  <h4 className="font-bold text-xs">Stronger Passwords</h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Use a mix of letters, numbers, and symbols for better security.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-round text-primary text-sm">history</span>
                  <h4 className="font-bold text-xs">Review Login Activity</h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Check for unrecognized devices in your active sessions periodically.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Overlay */}
      <div className="fixed inset-0 bg-card z-[100] lg:hidden flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <span className="material-icons-round text-4xl">desktop_windows</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Desktop Optimized</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Shjrti Settings is best experienced on a desktop or tablet.
        </p>
        <button
          onClick={() => {
            const overlay = document.querySelector('.lg\\:hidden.fixed.inset-0');
            if (overlay) overlay.classList.add('hidden');
          }}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl"
        >
          Continue Anyway
        </button>
      </div>

      {/* Account Delete Modal */}
      <AccountDeleteModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        userStats={stats}
      />
    </div>
  );
};

export default StitchAccount;
