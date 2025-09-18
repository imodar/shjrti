import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, TreePine, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Family } from "../../types/family.types";

interface FamilyBuilderHeaderProps {
  familyData: Family | null;
  memberCount: number;
  generationCount: number;
  onTreeSettingsClick: () => void;
  loading?: boolean;
}

export const FamilyBuilderHeader: React.FC<FamilyBuilderHeaderProps> = ({
  familyData,
  memberCount,
  generationCount,
  onTreeSettingsClick,
  loading
}) => {
  const navigate = useNavigate();

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Back Button and Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للوحة التحكم
            </Button>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">
                {loading ? "جاري التحميل..." : familyData?.name || "بناء شجرة العائلة"}
              </h1>
              {familyData?.description && (
                <p className="text-sm text-muted-foreground">
                  {familyData.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats and Actions */}
          <div className="flex items-center gap-4">
            {/* Family Stats */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {memberCount} عضو
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TreePine className="h-3 w-3" />
                {generationCount} جيل
              </Badge>
            </div>

            {/* Tree Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onTreeSettingsClick}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              إعدادات الشجرة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};