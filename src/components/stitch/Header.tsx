import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalizedText } from "@/lib/packageUtils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TreePine, Settings, CreditCard, HelpCircle, LogOut } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface StitchHeaderProps {
  familyName?: string;
  userName?: string;
  packageName?: Record<string, string> | string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  suggestionsCount?: number;
  hideNav?: boolean;
}

export const StitchHeader: React.FC<StitchHeaderProps> = ({
  familyName = "Shjrti",
  userName,
  packageName,
  activeTab = "dashboard",
  onTabChange,
  suggestionsCount = 0,
  hideNav = false,
}) => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const { user, signOut } = useAuth();

  const displayName = userName || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();
  const localizedPackageName = getLocalizedText(packageName, currentLanguage, t('stitch.free_plan', 'باقة مجانية'));

  const tabs = [
    { id: "dashboard", label: t('stitch.tab.dashboard', 'لوحة التحكم'), path: "/family-builder-stitch" },
    { id: "tree", label: t('stitch.tab.tree_view', 'عرض الشجرة'), path: "/stitch-tree-view" },
    { id: "gallery", label: t('stitch.tab.gallery', 'المعرض'), path: "/family-gallery" },
    { id: "statistics", label: t('stitch.tab.statistics', 'الإحصائيات'), path: "/family-statistics" },
    { id: "suggestions", label: t('stitch.tab.suggestions', 'الاقتراحات'), path: "/family-suggestions", badge: suggestionsCount },
  ];

  // Preserve family ID in navigation
  const handleTabClick = (tab: (typeof tabs)[0]) => {
    if (onTabChange) {
      onTabChange(tab.id);
    }
    // Append family query param if present in current URL
    const searchParams = new URLSearchParams(window.location.search);
    const familyId = searchParams.get('family');
    const targetPath = familyId ? `${tab.path}?family=${familyId}` : tab.path;
    navigate(targetPath);
  };


  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <span className="material-icons-round text-3xl">park</span>
        </div>
        <div>
          <h1 className="font-bold text-2xl leading-tight">{t('site.name', 'شجرتي')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{t('stitch.genealogy_platform', 'منصة الأنساب')}</p>
        </div>
        <div className="ml-6 px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-bold border border-red-500/20">
          {t('badge.beta', 'إطلاق تجريبي')}
        </div>
      </div>

      {/* Navigation */}
      {!hideNav && (
      <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={
              activeTab === tab.id
                ? "px-4 py-2 text-sm font-bold bg-white dark:bg-slate-700 text-primary rounded-lg shadow-sm"
                : "px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors relative"
            }
          >
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            )}
          </button>
        ))}
      </nav>
      )}

      {/* User Section */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-icons-round">notifications</span>
        </button>
        
        {/* User Profile with Hover Menu */}
        <HoverCard openDelay={0} closeDelay={150}>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-base font-bold group-hover:text-primary transition-colors">{displayName}</p>
                <p className="text-sm text-slate-500">{localizedPackageName}</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-emerald-400 border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">
                {initials}
              </div>
            </div>
          </HoverCardTrigger>
          
          <HoverCardContent 
            className="w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl" 
            align="end"
            sideOffset={8}
          >
            {/* User Info Header */}
            <div className="p-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-white font-bold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <div className="py-1">
              <Link 
                to="/stitch-dashboard" 
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <TreePine className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('nav.dashboard', 'Dashboard')}</p>
                  <p className="text-[10px] text-slate-500">{t('nav.dashboard.desc', 'Manage family trees')}</p>
                </div>
              </Link>
              
              <Link 
                to="/profile" 
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="p-1.5 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                  <Settings className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('nav.settings', 'Settings')}</p>
                  <p className="text-[10px] text-slate-500">{t('nav.settings.desc', 'Customize account')}</p>
                </div>
              </Link>
              
              <Link 
                to="/payments" 
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('nav.billing', 'Billing')}</p>
                  <p className="text-[10px] text-slate-500">{t('nav.billing.desc', 'Manage subscriptions')}</p>
                </div>
              </Link>
              
              <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer">
                <div className="p-1.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  <HelpCircle className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('nav.help', 'Help')}</p>
                  <p className="text-[10px] text-slate-500">{t('nav.help.desc', 'Support & guidance')}</p>
                </div>
              </div>
            </div>
            
            {/* Logout */}
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group w-full text-left"
              >
                <div className="p-1.5 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                  <LogOut className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-500">{t('nav.logout', 'Logout')}</p>
                  <p className="text-[10px] text-slate-500">{t('nav.logout.desc', 'End session')}</p>
                </div>
              </button>
            </div>
          </HoverCardContent>
        </HoverCard>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  );
};

export default StitchHeader;
