import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, TreePine } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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
    <header className="stitch-header">
      {/* Logo & Brand */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <TreePine className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">{familyName}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Genealogy Platform</p>
        </div>
        <div className="ml-6 stitch-badge beta">Beta Launch</div>
      </div>

      {/* Navigation Tabs */}
      <nav className="hidden lg:flex items-center gap-1 bg-muted p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={cn("nav-pill relative", activeTab === tab.id && "active")}
          >
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
            )}
          </button>
        ))}
      </nav>

      {/* User Section */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{packageName || "Free Plan"}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary border-2 border-background shadow-md flex items-center justify-center text-primary-foreground font-bold">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default StitchHeader;
