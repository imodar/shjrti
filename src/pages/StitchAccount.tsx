import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePackageTransition } from '@/hooks/usePackageTransition';
import { profilesApi, subscriptionsApi, invoicesApi, packagesApi, scheduledChangesApi } from '@/lib/api';
import { familiesApi } from '@/lib/api/endpoints/families';
import { StitchHeader } from '@/components/stitch';
import DashboardLoader from '@/components/stitch/DashboardLoader';
import { useToast } from '@/hooks/use-toast';
import AccountDeleteModal from '@/components/AccountDeleteModal';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

type AccountTab = 'profile' | 'billing' | 'security';

const StitchAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentTheme, setCurrentTheme } = useTheme();
  const { user } = useAuth();
  const { t, direction, currentLanguage } = useLanguage();
  const { subscription, refreshSubscription } = useSubscription();
  const { processPackageTransition, loading: transitionLoading } = usePackageTransition();
  const { toast } = useToast();
  const previousThemeRef = useRef(currentTheme);

  const initialTab = (searchParams.get('tab') as AccountTab) || 'profile';
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

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

  // ==================== PROFILE STATE ====================
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [subLoaded, setSubLoaded] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const loaderDoneRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [stats, setStats] = useState({ familiesCreated: 0, totalMembers: 0 });
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [packageInfo, setPackageInfo] = useState<{
    name: string; expiresAt?: string | null; maxMembers?: number | null; maxTrees?: number | null;
  } | null>(null);

  // ==================== BILLING STATE ====================
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [processingInvoice, setProcessingInvoice] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [scheduledDowngrade, setScheduledDowngrade] = useState<any>(null);
  const [cancellingDowngrade, setCancellingDowngrade] = useState(false);

  // Query for scheduled package changes
  const { data: scheduledChanges, refetch: refetchScheduledChanges } = useQuery({
    queryKey: ['scheduled-package-changes', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return scheduledChangesApi.get();
    },
    enabled: !!user,
  });

  // ==================== HELPERS ====================
  const getLocalizedValue = (value: string | object): string => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed[currentLanguage] || parsed['en'] || value;
      } catch { return value; }
    }
    if (typeof value === 'object' && value !== null) {
      return (value as any)[currentLanguage] || (value as any)['en'] || '';
    }
    return String(value || '');
  };

  const getLocalizedPackageField = (pkg: any, field: string, fallbackLang = 'en') => {
    if (!pkg || !pkg[field]) return '';
    if (typeof pkg[field] === 'string') return pkg[field];
    if (typeof pkg[field] === 'object') return pkg[field][currentLanguage] || pkg[field][fallbackLang] || '';
    return '';
  };

  const getLocalizedFeatures = (pkg: any, language = currentLanguage) => {
    if (!pkg || !pkg.features) return [];
    if (Array.isArray(pkg.features)) return pkg.features;
    if (typeof pkg.features === 'object') return pkg.features[language] || pkg.features['en'] || [];
    return [];
  };

  // ==================== PROFILE API ====================
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const profile = await profilesApi.get();
        setProfileData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email || user.email || '',
          phone: profile.phone || '',
        });
      } catch (err) { console.error('Error fetching profile:', err); }
      finally { setProfileLoaded(true); }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchSub = async () => {
      try {
        const sub = await subscriptionsApi.get();
        const pkg = sub?.packages;
        let name = t('billing.free_plan', 'Free Plan');
        if (pkg?.name) {
          try {
            const nameObj = typeof pkg.name === 'string' ? JSON.parse(pkg.name) : pkg.name;
            name = nameObj[currentLanguage] || nameObj.en || name;
          } catch { name = typeof pkg.name === 'string' ? pkg.name : name; }
        }
        setPackageInfo({ name, expiresAt: sub?.expires_at, maxMembers: pkg?.max_family_members, maxTrees: pkg?.max_family_trees });
      } catch (err) { console.error('Error fetching subscription:', err); }
      finally { setSubLoaded(true); }
    };
    fetchSub();
  }, [user, currentLanguage]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const families = await familiesApi.list();
        // Fetch actual member counts per family
        const memberCounts = await Promise.all(
          families.map(async (f: any) => {
            try {
              const members = await familiesApi.getMembers(f.id);
              return members.length;
            } catch { return 0; }
          })
        );
        const totalMembers = memberCounts.reduce((acc, count) => acc + count, 0);
        setStats({ familiesCreated: families.length, totalMembers });
      } catch (err) { console.error('Error fetching stats:', err); }
      finally { setStatsLoaded(true); }
    };
    fetchStats();
  }, [user]);

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
    } catch {
      toast({ title: t('profile.error', 'Error'), description: t('profile.profile_update_error', 'Failed to update profile'), variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.newPassword) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: t('profile.error', 'Error'), description: t('profile.passwords_mismatch', 'Passwords do not match'), variant: 'destructive' });
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) {
        toast({ title: t('profile.error', 'Error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('profile.success', 'Success'), description: t('profile.password_changed', 'Password changed successfully') });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch {
      toast({ title: t('profile.error', 'Error'), description: t('profile.unexpected_error', 'An unexpected error occurred'), variant: 'destructive' });
    } finally { setPasswordSaving(false); }
  };

  // ==================== BILLING API ====================
  const loadPackages = async () => {
    try {
      setPackagesLoading(true);
      const data = await packagesApi.list();
      const transformed = data.map((pkg: any) => ({
        ...pkg,
        price_sar: pkg.price_sar || 0,
        price_usd: pkg.price_usd || 0,
      }));
      setPackages(transformed);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally { setPackagesLoading(false); }
  };

  const loadInvoices = async () => {
    if (!user) return;
    try {
      setInvoicesLoading(true);
      await invoicesApi.cleanupOldInvoices().catch(() => {});
      const data = await invoicesApi.list();
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally { setInvoicesLoading(false); }
  };

  const loadUserSubscription = async () => {
    if (!user) return;
    try {
      const subscriptionData = await subscriptionsApi.get();
      if (subscriptionData?.package_id) {
        setCurrentPlan(subscriptionData.package_id);
      } else {
        setCurrentPlan(null);
      }
    } catch { setCurrentPlan(null); }
  };

  const loadScheduledDowngrade = async () => {
    if (!user) return;
    try {
      const data = await scheduledChangesApi.get();
      setScheduledDowngrade(data || null);
    } catch { setScheduledDowngrade(null); }
  };

  const cancelScheduledDowngrade = async () => {
    if (!user || !scheduledDowngrade || cancellingDowngrade) return;
    setCancellingDowngrade(true);
    try {
      await scheduledChangesApi.cancel();
      setScheduledDowngrade(null);
      toast({
        title: t('billing.cancelled', 'Cancelled'),
        description: t('billing.scheduled_change_cancelled', 'Scheduled change has been cancelled. You will stay on your current plan.'),
      });
    } catch {
      toast({
        title: t('profile.error', 'Error'),
        description: t('billing.cancel_error', 'An error occurred while cancelling the scheduled change'),
        variant: 'destructive',
      });
    } finally { setCancellingDowngrade(false); }
  };

  useEffect(() => {
    if (activeTab === 'billing' && user) {
      loadPackages();
      loadUserSubscription();
      loadInvoices();
      loadScheduledDowngrade();
    }
  }, [activeTab, user, currentLanguage]);

  const getPlanIndex = (planId: string | null) => {
    if (!planId) return -1;
    return packages.findIndex((p: any) => p.id === planId);
  };

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      toast({ title: t('auth.login_required', 'Login Required'), description: t('billing.login_to_select', 'Please login first to select a plan'), variant: 'destructive' });
      return;
    }
    const selectedPackage = packages.find((pkg: any) => pkg.id === planId);
    if (!selectedPackage) return;

    const currentPlanIndex = getPlanIndex(currentPlan);
    const selectedPlanIndex = getPlanIndex(planId);

    // Check for downgrade
    if (currentPlan && selectedPlanIndex < currentPlanIndex) {
      // Proceed with downgrade analysis
    }

    const currentSubscription = currentPlan ? {
      id: 'current', package_id: currentPlan, status: 'active',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    } : null;

    const transitionResult = await processPackageTransition(selectedPackage, currentSubscription, packages);

    if (!transitionResult.canProceed) {
      toast({
        title: t('billing.warning', 'Warning'),
        description: transitionResult.message + (transitionResult.requirements ? '\n' + transitionResult.requirements.join('\n') : ''),
        variant: transitionResult.action === 'same' ? 'default' : 'destructive',
      });
      return;
    }

    if (transitionResult.message) {
      toast({ title: t('billing.important_notice', 'Important Notice'), description: transitionResult.message });
    }

    if (transitionResult.action === 'schedule_downgrade') {
      await loadScheduledDowngrade();
      setTimeout(() => loadScheduledDowngrade(), 1000);
      toast({
        title: t('billing.scheduled', 'Scheduled'),
        description: t('billing.change_scheduled', 'Package change has been scheduled successfully.'),
      });
      return;
    }

    // Continue with payment for upgrades
    setSelectedPlan(planId);
    setProcessingInvoice(true);
    try {
      const amount = selectedPackage.price_usd || 0;
      const currency = 'USD';

      const { invoice_id: invoiceId } = await invoicesApi.create({
        package_id: planId, amount, currency,
      });

      if (amount === 0) {
        const { success } = await invoicesApi.completeFreeUpgrade(invoiceId);
        if (!success) throw new Error('Failed to complete free upgrade');
        toast({ title: t('billing.free_activated', 'Free plan activated'), description: t('billing.free_activated_desc', 'Free plan activated successfully') });
        loadUserSubscription();
        loadInvoices();
        refreshSubscription();
        return;
      }

      navigate('/payment', { state: { planId, invoiceId, amount, currency } });
    } catch (error: any) {
      toast({ title: t('billing.payment_error', 'Payment Error'), description: error?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setProcessingInvoice(false);
      setSelectedPlan(null);
    }
  };

  const getInvoiceStatusInfo = (status: string) => {
    switch (status) {
      case 'paid': return { label: t('billing.paid', 'Paid'), bgClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600', borderClass: 'border-slate-100 dark:border-slate-800' };
      case 'pending': return { label: t('billing.pending', 'Pending Payment'), bgClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600', borderClass: 'border-amber-100 bg-amber-50/20 dark:border-amber-900/20' };
      case 'cancelled': return { label: t('billing.cancelled_status', 'Cancelled'), bgClass: 'bg-slate-100 dark:bg-slate-800 text-slate-500', borderClass: 'border-slate-100 dark:border-slate-800' };
      default: return { label: status, bgClass: 'bg-slate-100 dark:bg-slate-800 text-slate-500', borderClass: 'border-slate-100 dark:border-slate-800' };
    }
  };

  // ==================== DERIVED ====================
  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
  const packageName = subscription?.package_name || { en: 'Free Plan', ar: 'باقة مجانية' };
  const familyId = searchParams.get('family') || '';
  const currentPlanData = packages.find((p: any) => p.id === currentPlan);

  const sidebarItems: { key: AccountTab; icon: string; label: string }[] = [
    { key: 'profile', icon: 'person', label: t('account.profile_info', 'Profile Information') },
    { key: 'billing', icon: 'payments', label: t('account.subscriptions_billing', 'Subscriptions & Billing') },
    { key: 'security', icon: 'security', label: t('account.security_access', 'Security & Access') },
  ];

  const isFullyLoaded = profileLoaded && subLoaded && statsLoaded;
  if (isFullyLoaded) loaderDoneRef.current = true;

  if (!isFullyLoaded && !loaderDoneRef.current) {
    return (
      <DashboardLoader
        steps={[
          { id: 'profile', labelAr: 'جاري تحميل الملف الشخصي...', labelEn: 'Loading profile...', completed: profileLoaded },
          { id: 'subscription', labelAr: 'جاري التحقق من الاشتراك...', labelEn: 'Checking subscription...', completed: subLoaded },
          { id: 'stats', labelAr: 'جاري تحميل الإحصائيات...', labelEn: 'Loading statistics...', completed: statsLoaded },
        ]}
      />
    );
  }

  // ==================== RENDER TABS ====================
  const renderProfileTab = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('profile.page_title', 'User Profile Settings')}</h2>
        <p className="text-sm text-muted-foreground">{t('profile.welcome_back', 'Manage your personal information and account security preferences.')}</p>
      </div>

      {/* Personal Information */}
      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">person</span>
          </div>
          <h3 className="font-bold text-lg">{t('profile.personal_information', 'Personal Information')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t('profile.first_name', 'First Name')}</label>
            <input type="text" value={profileData.firstName} onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t('profile.last_name', 'Last Name')}</label>
            <input type="text" value={profileData.lastName} onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t('profile.email', 'Email Address')}</label>
            <input type="email" value={profileData.email} onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t('profile.phone', 'Phone Number')}</label>
            <input type="tel" value={profileData.phone} onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary" />
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button onClick={handleSaveProfile} disabled={saving}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('profile.saving', 'Saving...')}
              </span>
            ) : t('profile.save', 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('account.security_access', 'Security & Access')}</h2>
        <p className="text-sm text-muted-foreground">{t('account.security_desc', 'Manage your password and account security settings.')}</p>
      </div>

      {/* Password Card */}
      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">shield</span>
          </div>
          <h3 className="font-bold text-lg">{t('profile.change_password', 'Security & Password')}</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t('current_password', 'Current Password')}</label>
            <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t('new_password', 'New Password')}</label>
              <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t('confirm_new_password', 'Confirm New Password')}</label>
              <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary" />
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button onClick={handleUpdatePassword} disabled={passwordSaving || !passwordData.newPassword}
            className="px-6 py-2.5 border-2 border-border text-muted-foreground rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50">
            {passwordSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ...
              </span>
            ) : t('profile.update_password', 'Update Password')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Plans + Current Status side-by-side */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Plans Section */}
        <div className="flex-[1.5] space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('billing.choose_plan', 'Choose Your Plan')}</h2>
            <p className="text-sm text-muted-foreground">{t('billing.choose_plan_desc', 'Pick the plan that best fits your family history needs.')}</p>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packagesLoading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse h-80" />
              ))
            ) : packages.map((pkg: any) => {
              const isActive = currentPlan === pkg.id;
              const isFeatured = pkg.is_featured;
              const priceUsd = pkg.price_usd || 0;
              const isFree = priceUsd === 0;

              return (
                <div key={pkg.id}
                  className={cn(
                    'bg-card rounded-2xl p-6 flex flex-col relative overflow-hidden group transition-all',
                    isFeatured ? 'border-2 border-primary shadow-xl shadow-primary/10' : 'border border-border',
                  )}>
                  {/* Featured badge */}
                  {isFeatured && (
                    <div className="absolute -top-1 ltr:-right-1 rtl:-left-1 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 ltr:rounded-bl-xl rtl:rounded-br-xl uppercase tracking-widest">
                      {t('billing.most_popular', 'Most Popular')}
                    </div>
                  )}
                  {!isFeatured && (
                    <div className="absolute top-0 ltr:right-0 rtl:left-0 p-3">
                      <span className="material-symbols-outlined text-slate-200 group-hover:text-primary/20 transition-colors text-4xl">star_outline</span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-1">{getLocalizedPackageField(pkg, 'name')}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">${priceUsd}</span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {isFree ? t('billing.free_forever', 'Free for Life') : `/ ${t('billing.year', 'Year')}`}
                      </span>
                    </div>
                    {!isFree && pkg.price_sar > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">
                        {t('billing.approx', 'Approx.')} {pkg.price_sar} SAR
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8 flex-1">
                    {getLocalizedFeatures(pkg).map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                        {feature}
                      </li>
                    ))}
                    {/* Fallback limits */}
                    {getLocalizedFeatures(pkg).length === 0 && (
                      <>
                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                          {pkg.max_family_trees || 1} {t('billing.family_trees', 'Family Trees')}
                        </li>
                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                          {t('billing.up_to', 'Up to')} {pkg.max_family_members || 50} {t('billing.members', 'Members')}
                        </li>
                      </>
                    )}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => !isActive && handlePlanSelect(pkg.id)}
                    disabled={isActive || (processingInvoice && selectedPlan === pkg.id)}
                    className={cn(
                      'w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                      isActive
                        ? 'border-2 border-border text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90'
                    )}>
                    {isActive ? t('billing.active_plan', 'Active Plan') :
                      processingInvoice && selectedPlan === pkg.id ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t('billing.processing', 'Processing...')}
                        </span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-lg">rocket_launch</span>
                          {t('billing.subscribe_now', 'Subscribe Now')}
                        </>
                      )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Invoice History */}
      <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-muted-foreground">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">{t('billing.invoice_history', 'Invoice History')}</h3>
              <p className="text-sm text-muted-foreground">{t('billing.invoice_history_desc', 'View and download your billing history')}</p>
            </div>
          </div>
        </div>

        {invoicesLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-2">{t('billing.loading_invoices', 'Loading invoices...')}</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <span className="material-symbols-outlined text-4xl mb-3 block opacity-50">receipt_long</span>
            <p>{t('billing.no_invoices', 'No invoices yet')}</p>
            <p className="text-sm">{t('billing.invoices_appear', 'Your invoices will appear here after upgrading to a paid plan')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice: any) => {
              const statusInfo = getInvoiceStatusInfo(invoice.payment_status);
              return (
                <div key={invoice.id}
                  className={cn(
                    'group border rounded-2xl p-6 transition-all hover:shadow-md bg-card',
                    statusInfo.borderClass,
                    invoice.payment_status === 'pending' && 'cursor-pointer'
                  )}
                  onClick={() => {
                    if (invoice.payment_status === 'pending') {
                      navigate('/payment', {
                        state: { planId: invoice.package_id, invoiceId: invoice.id, amount: invoice.amount, currency: invoice.currency },
                      });
                    }
                  }}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center md:pr-6 md:border-r border-border">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">${invoice.amount}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{invoice.currency || 'USD'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">{invoice.invoice_number || 'N/A'}</h4>
                          <span className={cn('px-2 py-0.5 text-[10px] font-bold rounded uppercase', statusInfo.bgClass)}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('billing.plan', 'Plan')}: {getLocalizedPackageField(invoice.packages, 'name') || t('billing.unknown', 'Unknown')} • {new Date(invoice.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {invoice.payment_status === 'pending' && (
                        <>
                          <span className="text-xs text-amber-600 font-medium hidden md:block">{t('billing.click_to_pay', 'Click to pay')}</span>
                          <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">payment</span>
                            {t('billing.pay_now', 'Pay Now')}
                          </button>
                        </>
                      )}
                      {invoice.payment_status !== 'pending' && invoice.amount > 0 && (
                        <button className="px-4 py-2 border border-border text-muted-foreground rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">download</span>
                          {t('billing.download', 'Download')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('theme-stitch min-h-screen overflow-hidden', direction === 'rtl' && 'rtl')}>
      {/* Header */}
      <StitchHeader
        variant="account"
        familyName={'Shjrti'}
        userName={userName}
        packageName={packageName}
        activeTab="account"
        onTabChange={(tab) => {
          if (tab === 'dashboard') navigate(`/stitch-family-builder?family=${familyId}&tab=dashboard`);
          else if (tab === 'account') return;
          else navigate(`/stitch-family-builder?family=${familyId}&tab=${tab}`);
        }}
        suggestionsCount={0}
        isOwner={true}
      />

      {/* Main Content */}
      <main className="flex h-[calc(100vh-56px)]">
        {/* Left Sidebar */}
        <aside className="w-80 bg-card border-r border-border flex flex-col z-30 hidden lg:flex">
          <div className="p-6">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">
              {t('account.settings', 'Account Settings')}
            </h2>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all',
                    activeTab === item.key
                      ? 'font-bold text-primary bg-primary/5'
                      : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Danger Zone */}
          <div className="mt-auto p-6 border-t border-border">
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-lg">report</span>
                <span className="text-xs font-bold uppercase tracking-wider">{t('profile.danger_zone', 'Danger Zone')}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                {t('profile.danger_zone_desc', 'Permanent deletion of all your family data and trees.')}
              </p>
              <button onClick={() => setShowDeleteAccountModal(true)} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">
                {t('profile.delete_account', 'Delete Account')}
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background p-8 custom-scrollbar">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'billing' && renderBillingTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </section>

        {/* Right Panel - Account Stats */}
        <aside className="w-80 bg-card border-l border-border flex-col p-6 overflow-y-auto hidden xl:flex custom-scrollbar">
          {/* Current Plan Card */}
          <div className="mb-8">
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-border">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('billing.your_current_plan', 'Your Current Plan')}</p>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                  {currentPlan ? getLocalizedPackageField(currentPlanData, 'name') || t('billing.paid_plan', 'Paid Plan') : t('billing.free_plan', 'Free Plan')}
                </h4>
                <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {subscription?.status === 'active' ? t('billing.active', 'Active') :
                    subscription?.status === 'expired' ? t('billing.expired', 'Expired') : t('billing.active', 'Active')}
                </span>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t('billing.max_trees', 'Max Trees')}</span>
                  <span className="font-bold">{currentPlanData?.max_family_trees || 1}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t('billing.member_limit', 'Member Limit')}</span>
                  <span className="font-bold">{currentPlanData?.max_family_members || 50}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t('billing.renewal_date', 'Renewal Date')}</span>
                  <span className="font-bold">
                    {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('en-GB') :
                      currentPlan ? t('billing.not_specified', 'N/A') : t('billing.none', 'None')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Stats - only show on billing tab */}
          {activeTab === 'billing' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">{t('account.account_stats', 'Account Stats')}</h3>
                <span className="material-symbols-outlined text-primary">analytics</span>
              </div>

              {/* Plan Usage */}
              <div className="space-y-6">
                {/* Plan Usage - Green */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('billing.plan_usage', 'Plan Usage')}</p>
                    <p className="text-xs font-bold">
                      {stats.totalMembers}{packageInfo?.maxMembers ? ` / ${packageInfo.maxMembers} ${t('billing.members', 'Members')}` : ''}
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${packageInfo?.maxMembers ? Math.min(100, (stats.totalMembers / packageInfo.maxMembers) * 100) : 0}%` }}
                    />
                  </div>
                  {packageInfo?.maxMembers && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {Math.round((stats.totalMembers / packageInfo.maxMembers) * 100)}% {t('billing.of_limit_used', 'of your current plan limit used')}
                    </p>
                  )}
                </div>

                {/* Families Created - Yellow */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{t('profile.families_created', 'Families Created')}</p>
                    <p className="text-xs font-bold">
                      {stats.familiesCreated}{packageInfo?.maxTrees ? ` / ${packageInfo.maxTrees}` : ''}
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all"
                      style={{ width: `${packageInfo?.maxTrees ? Math.min(100, (stats.familiesCreated / packageInfo.maxTrees) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tips - only show on security tab */}
          {activeTab === 'security' && (
            <div className="mb-8">
              <h3 className="font-bold mb-4">{t('account.security_tips', 'Security Tips')}</h3>
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-icons-round text-amber-500 text-sm">lightbulb</span>
                    <h4 className="font-bold text-xs">{t('account.stronger_passwords', 'Stronger Passwords')}</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t('account.stronger_passwords_desc', 'Use a mix of letters, numbers, and symbols for better security.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Need Help */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white mt-auto">
            <h4 className="text-sm font-bold mb-2">{t('account.need_help', 'Need help?')}</h4>
            <p className="text-[10px] opacity-70 mb-4">{t('account.support_desc', 'Our support team is available 24/7 for account related inquiries.')}</p>
            <button onClick={() => navigate('/contact')} className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all border border-white/10">
              {t('account.contact_support', 'Contact Support')}
            </button>
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
          {t('account.desktop_message', 'Shjrti Settings is best experienced on a desktop or tablet.')}
        </p>
        <button
          onClick={() => {
            const overlay = document.querySelector('.lg\\:hidden.fixed.inset-0');
            if (overlay) overlay.classList.add('hidden');
          }}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl">
          {t('account.continue_anyway', 'Continue Anyway')}
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
