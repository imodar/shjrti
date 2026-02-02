import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface StitchHeaderProps {
  familyName?: string;
  userName?: string;
  packageName?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  suggestionsCount?: number;
}

export const StitchHeader: React.FC<StitchHeaderProps> = ({
  familyName = "Shjrti",
  userName,
  packageName,
  activeTab = "dashboard",
  onTabChange,
  suggestionsCount = 0,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const displayName = userName || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  const tabs = [
    { id: "dashboard", label: "Dashboard", path: "/family-builder-new" },
    { id: "tree", label: "Tree View", path: "/family-tree-view" },
    { id: "gallery", label: "Gallery", path: "/family-gallery" },
    { id: "statistics", label: "Statistics", path: "/family-statistics" },
    { id: "suggestions", label: "Suggestions", path: "/family-suggestions", badge: suggestionsCount },
  ];

  const handleTabClick = (tab: (typeof tabs)[0]) => {
    if (onTabChange) {
      onTabChange(tab.id);
    }
    navigate(tab.path);
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <span className="material-icons-round">park</span>
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">{familyName}</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Genealogy Platform</p>
        </div>
        <div className="ml-6 px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-bold border border-red-500/20">
          Beta Launch
        </div>
      </div>

      {/* Navigation */}
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

      {/* User Section */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-icons-round">notifications</span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">{displayName}</p>
            <p className="text-[10px] text-slate-500">{packageName || "Free Plan"}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-400 border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center text-white font-bold">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default StitchHeader;
