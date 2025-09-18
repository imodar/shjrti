import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  isMobile?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  onTabChange,
  leftPanel,
  rightPanel,
  isMobile = false
}) => {
  if (isMobile) {
    return (
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3 shrink-0">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              الأعضاء
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="mt-0 h-full">
              <div className="h-full overflow-hidden">
                {leftPanel}
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-0 h-full">
              <div className="h-full overflow-auto p-4">
                {rightPanel}
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0 h-full">
              <div className="h-full overflow-auto p-4">
                <div className="text-center text-muted-foreground">
                  إعدادات إضافية قريباً...
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <Tabs value={activeTab} onValueChange={onTabChange} className="h-full">
        <div className="border-b">
          <TabsList className="h-12 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              الإحصائيات
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex h-[calc(100%-3rem)] overflow-hidden">
          <TabsContent value="overview" className="mt-0 h-full flex-1 overflow-hidden">
            <div className="flex h-full">
              {/* Left Panel - Member List */}
              <div className={cn(
                "w-1/2 border-r overflow-hidden",
                "flex flex-col"
              )}>
                {leftPanel}
              </div>

              {/* Right Panel - Form/Details */}
              <div className="w-1/2 overflow-hidden">
                {rightPanel}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-0 h-full flex-1 overflow-auto">
            <div className="p-6">
              {rightPanel}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};