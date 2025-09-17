import React from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface TreeSettingsButtonProps {
  onShowSettings: () => void;
}

export const TreeSettingsButton: React.FC<TreeSettingsButtonProps> = ({ 
  onShowSettings 
}) => {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="ml-2" 
      onClick={onShowSettings}
    >
      <Settings className="h-4 w-4 ml-2" />
      إعدادات الشجرة
    </Button>
  );
};