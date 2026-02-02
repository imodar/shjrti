import React from "react";
import { useNavigate } from "react-router-dom";
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
      <div className="stitch-header-brand">
        <div className="stitch-header-logo">
          <span className="material-icons-round">park</span>
        </div>
        <div className="stitch-header-title">
          <h1>{familyName}</h1>
          <p>Genealogy Platform</p>
        </div>
        <div className="stitch-badge beta">Beta Launch</div>
      </div>

      {/* Navigation Tabs */}
      <nav className="stitch-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={cn("nav-pill", activeTab === tab.id && "active")}
          >
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <span className="nav-pill-badge" />
            )}
          </button>
        ))}
      </nav>

      {/* User Section */}
      <div className="stitch-header-user">
        <button className="stitch-header-notification">
          <span className="material-icons-round">notifications</span>
        </button>
        <div className="stitch-header-profile">
          <div className="stitch-header-profile-info">
            <p className="stitch-header-profile-name">{displayName}</p>
            <p className="stitch-header-profile-plan">{packageName || "Free Plan"}</p>
          </div>
          <div className="stitch-avatar stitch-avatar-gradient">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default StitchHeader;
