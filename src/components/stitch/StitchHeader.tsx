import React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
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
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <TreeDeciduous className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Shjrti</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Genealogy Platform</p>
        </div>
        <div className="ml-6 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-[10px] font-bold border border-destructive/20">
          Beta Launch
        </div>
      </div>

      <nav className="hidden lg:flex items-center gap-1 bg-muted p-1 rounded-xl">
        <Button variant="navActive" size="sm">
          Dashboard
        </Button>
        <Button variant="nav" size="sm">
          Tree View
        </Button>
        <Button variant="nav" size="sm">
          Gallery
        </Button>
        <Button variant="nav" size="sm">
          Statistics
        </Button>
        <Button variant="nav" size="sm" className="relative">
          Suggestions
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
        </Button>
      </nav>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Bell className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">Mudar Al-Saeed</p>
            <p className="text-[10px] text-muted-foreground">Premium Plan</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent border-2 border-card shadow-md flex items-center justify-center text-primary-foreground font-bold">
            M
          </div>
        </div>
      </div>
    </header>
  );
};

export default StitchHeader;
