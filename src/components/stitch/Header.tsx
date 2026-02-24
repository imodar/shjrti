import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalizedText } from "@/lib/packageUtils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TreePine, Settings, HelpCircle, LogOut, Menu, Shield } from "lucide-react";
import { profilesApi } from "@/lib/api/endpoints/profiles";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface StitchHeaderProps {
  familyName?: string;
  userName?: string;
  packageName?: Record<string, string> | string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  suggestionsCount?: number;
  hideNav?: boolean;
  isOwner?: boolean;
  variant?: 'builder' | 'account';
  isLoadingLayout?: boolean;
}

export const StitchHeader: React.FC<StitchHeaderProps> = ({
  familyName = "Shjrti",
  userName,
  packageName,
  activeTab = "dashboard",
  onTabChange,
  suggestionsCount = 0,
  hideNav = false,
  isOwner = true,
  variant = 'builder',
  isLoadingLayout = false,
}) => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      profilesApi.checkAdmin()
        .then(res => setIsAdmin(res.is_admin))
        .catch(() => setIsAdmin(false));
    }
  }, [user?.id]);

  const displayName = userName || user?.email?.split("@")[0] || t('common.user', 'User');
  const initials = displayName.charAt(0).toUpperCase();
  const localizedPackageName = getLocalizedText(packageName, currentLanguage, t('stitch.free_plan', 'باقة مجانية'));

  const builderTabs = [
    { id: "home", label: t('family_header.home', 'الرئيسية'), path: "/dashboard", icon: "home" },
    { id: "dashboard", label: t('stitch.tab.dashboard', 'لوحة التحكم'), path: "/family-builder", icon: "dashboard" },
    { id: "tree", label: t('stitch.tab.tree_view', 'عرض الشجرة'), path: "/family-tree-view", icon: "account_tree" },
    { id: "gallery", label: t('stitch.tab.gallery', 'المعرض'), path: "/family-builder", icon: "photo_library" },
    { id: "statistics", label: t('stitch.tab.statistics', 'الإحصائيات'), path: "/family-builder", icon: "bar_chart" },
    { id: "suggestions", label: t('stitch.tab.suggestions', 'الاقتراحات'), path: "/family-builder", badge: suggestionsCount, icon: "lightbulb" },
    { id: "settings", label: t('family_header.settings', 'الإعدادات'), path: "/family-builder", icon: "settings" },
  ];

  const accountTabs: { id: string; label: string; path: string; badge?: number; icon: string }[] = [
    { id: "home", label: t('family_header.home', 'الرئيسية'), path: "/dashboard", icon: "home" },
    { id: "account", label: t('nav.account', 'الحساب'), path: "/profile", icon: "person" },
  ];

  const tabs = variant === 'account' ? accountTabs : builderTabs;

  const handleTabClick = (tab: (typeof tabs)[0]) => {
    if (onTabChange) onTabChange(tab.id);
    if (tab.path) {
      const searchParams = new URLSearchParams(window.location.search);
      const familyId = searchParams.get('family');
      let targetPath = tab.path;
      const params = new URLSearchParams();
      if (familyId) params.set('family', familyId);
      if (tab.id !== 'home' && tab.id !== 'tree' && tab.path === '/family-builder') {
        params.set('tab', tab.id);
      }
      const qs = params.toString();
      navigate(qs ? `${targetPath}?${qs}` : targetPath);
    }
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <header className="h-14 md:h-16 lg:h-20 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-3 md:px-4 lg:px-6 sticky top-0 z-50">
        {/* Right side: Brand + site name + badge */}
        <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
          <div className="w-9 h-9 md:w-11 md:h-11 lg:w-14 lg:h-14 bg-primary rounded-lg lg:rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <span className="material-icons-round text-xl md:text-2xl lg:text-3xl">park</span>
          </div>
          <div>
            <h1 className="font-bold text-lg md:text-xl lg:text-2xl leading-tight">{t('site.name', 'شجرتي')}</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('stitch.genealogy_platform', 'منصة الأنساب')}</p>
          </div>
          <div className="ms-1 lg:ms-4 px-2 lg:px-3 py-0.5 lg:py-1 bg-destructive/10 text-destructive rounded-full text-[9px] lg:text-[10px] font-bold border border-destructive/20 hidden sm:block">
            {t('badge.beta', 'إطلاق تجريبي')}
          </div>
        </div>

        {/* Desktop Navigation */}
        {!hideNav && (
          <nav className="hidden lg:flex items-center gap-1 bg-muted p-1 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "font-bold bg-card text-primary rounded-lg shadow-sm"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-card">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        )}

        {/* Left side: Language + Notifications + Avatar + Burger */}
        <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <button className="p-1.5 md:p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors">
            <span className="material-icons-round text-xl">notifications</span>
          </button>

          {/* User Profile */}
          <HoverCard openDelay={0} closeDelay={150}>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                {isLoadingLayout ? (
                  <>
                    <div className="w-9 h-9 md:w-11 md:h-11 lg:w-14 lg:h-14 rounded-full bg-muted animate-pulse" />
                    <div className="text-start hidden lg:block space-y-1.5">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 md:w-11 md:h-11 lg:w-14 lg:h-14 rounded-full bg-gradient-to-tr from-primary to-emerald-400 border-2 border-card shadow-md flex items-center justify-center text-primary-foreground font-bold text-sm md:text-lg lg:text-xl group-hover:scale-105 transition-transform">
                      {initials}
                    </div>
                    <div className="text-start hidden lg:block">
                      <p className="text-sm lg:text-base font-bold group-hover:text-primary transition-colors truncate max-w-[100px] lg:max-w-none">{displayName}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground truncate max-w-[100px] lg:max-w-none">{localizedPackageName}</p>
                    </div>
                  </>
                )}
              </div>
            </HoverCardTrigger>

            <HoverCardContent
              className="w-64 p-2 bg-card border border-border shadow-xl rounded-xl"
              align="end"
              sideOffset={8}
            >
              <div className="p-3 pb-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-primary-foreground font-bold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="py-1">
                <Link to="/dashboard" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors group">
                  <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <TreePine className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('nav.dashboard', 'Dashboard')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('nav.dashboard.desc', 'Manage family trees')}</p>
                  </div>
                </Link>

                {isOwner && (
                  <Link to="/profile" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors group">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                      <Settings className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('nav.account_management', 'إدارة الحساب')}</p>
                      <p className="text-[10px] text-muted-foreground">{t('nav.account_management.desc', 'إدارة الملف والإشتراكات والفوترة')}</p>
                    </div>
                  </Link>
                )}

                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors group cursor-pointer">
                  <div className="p-1.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                    <HelpCircle className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('nav.help', 'Help')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('nav.help.desc', 'Support & guidance')}</p>
                  </div>
                </div>

                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors group">
                    <div className="p-1.5 bg-destructive/10 rounded-lg group-hover:bg-destructive/20 transition-colors">
                      <Shield className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('nav.admin_panel', 'لوحة الإدارة')}</p>
                      <p className="text-[10px] text-muted-foreground">{t('nav.admin_panel.desc', 'إدارة النظام والمستخدمين')}</p>
                    </div>
                  </Link>
                )}
              </div>

              <div className="pt-1 border-t border-border">
                <button onClick={handleSignOut} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-destructive/10 transition-colors group w-full text-start">
                  <div className="p-1.5 bg-destructive/10 rounded-lg group-hover:bg-destructive/20 transition-colors">
                    <LogOut className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-destructive">{t('nav.logout', 'Logout')}</p>
                    <p className="text-[10px] text-muted-foreground">{t('nav.logout.desc', 'End session')}</p>
                  </div>
                </button>
              </div>
            </HoverCardContent>
          </HoverCard>

          {/* Burger menu - leftmost item */}
          {!hideNav && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -me-1 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Mobile/Tablet Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
                  <span className="material-icons-round text-xl">park</span>
                </div>
                <div>
                  <p className="font-bold text-base">{t('site.name', 'شجرتي')}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('stitch.genealogy_platform', 'منصة الأنساب')}</p>
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* User info in mobile menu */}
          <div className="p-4 border-b border-border bg-muted/50">
            <div className="flex items-center gap-3">
              {isLoadingLayout ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-primary-foreground font-bold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{localizedPackageName}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Navigation items */}
          <nav className="p-2 flex-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                <span className={`material-icons-round text-xl ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`}>
                  {tab.icon}
                </span>
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="ms-auto min-w-5 h-5 px-1.5 bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Mobile-only actions */}
          <div className="p-3 border-t border-border space-y-1">
            <div className="sm:hidden pb-2">
              <LanguageSwitcher />
            </div>
            <button
              onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              {t('nav.logout', 'Logout')}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default StitchHeader;
