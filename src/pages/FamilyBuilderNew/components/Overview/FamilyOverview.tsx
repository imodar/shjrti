import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  TreePine, 
  Users, 
  Crown, 
  UserIcon, 
  UserRoundIcon, 
  Clock, 
  Store, 
  Star, 
  UserPlus 
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TreeSettingsButton } from "../TreeSettings/TreeSettingsButton";

interface FamilyOverviewProps {
  familyData: any;
  familyMembers: any[];
  generationCount: number;
  familyId: string;
  onAddMember: () => void;
  onShowSettings: () => void;
}

export const FamilyOverview: React.FC<FamilyOverviewProps> = ({
  familyData,
  familyMembers,
  generationCount,
  familyId,
  onAddMember,
  onShowSettings
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="py-8 px-6">
      {/* Family Overview Header - Enhanced Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-card/50 to-accent/5 rounded-3xl p-8 sm:p-12 mb-8 border border-border/50 shadow-2xl backdrop-blur-sm animate-fade-in">
        {/* Dynamic Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-primary rounded-full"></div>
          <div className="absolute top-20 right-20 w-24 h-24 border border-secondary rounded-full"></div>
          <div className="absolute bottom-10 left-20 w-20 h-20 border-2 border-accent rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 border border-primary/50 rounded-full"></div>
        </div>
        
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/10 via-secondary/5 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Settings Button - Enhanced */}
        <div className="absolute top-6 left-6 z-20">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-secondary rounded-xl blur opacity-20 group-hover:opacity-40 transition-all duration-500 animate-pulse"></div>
            <div className="relative bg-card/80 backdrop-blur-md rounded-xl p-2 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <TreeSettingsButton onShowSettings={onShowSettings} />
            </div>
          </div>
        </div>
        
        <div className="relative z-10 pt-4">
          {/* Hero Content */}
          <div className="text-center space-y-8">
            {/* Logo Section with Enhanced Design */}
            <div className="relative inline-block">
              <div className="relative group">
                {/* Main Icon Container */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto">
                  {/* Animated background rings */}
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-spin" style={{animationDuration: '10s'}}></div>
                  <div className="absolute inset-2 rounded-full border-2 border-secondary/30 animate-spin" style={{animationDuration: '8s', animationDirection: 'reverse'}}></div>
                  
                  {/* Main icon */}
                  <div className="absolute inset-4 bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500 border-2 border-primary/20">
                    <TreePine className="h-12 w-12 sm:h-14 sm:w-14 text-primary-foreground drop-shadow-lg" />
                  </div>
                  
                  {/* Active Status Indicator */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-4 border-card shadow-xl flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Title Section with Enhanced Typography */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in">
                    عائلة {familyData?.name || 'غير محدد'}
                  </span>
                </h1>
                
                {/* Animated Decorative Line */}
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-1 w-8 bg-gradient-to-r from-transparent to-primary rounded-full animate-fade-in delay-200"></div>
                  <div className="h-2 w-20 bg-gradient-to-r from-primary via-accent to-secondary rounded-full animate-fade-in delay-100"></div>
                  <div className="h-1 w-8 bg-gradient-to-r from-secondary to-transparent rounded-full animate-fade-in delay-200"></div>
                </div>
              </div>
              
              {/* Family Description with Glass Morphism */}
              {familyData?.description && (
                <div className="max-w-2xl mx-auto animate-fade-in delay-300">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-card/20 to-secondary/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                    <div className="relative bg-card/60 backdrop-blur-md rounded-2xl p-6 border border-border/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                      <p className="text-muted-foreground text-base sm:text-lg leading-relaxed font-medium">
                        {familyData.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Interactive Elements */}
              <div className="flex items-center justify-center pt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce shadow-lg"></div>
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100 shadow-md"></div>
                  <div className="w-3 h-3 bg-secondary rounded-full animate-bounce delay-200 shadow-lg"></div>
                  <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce delay-300 shadow-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Members */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl p-4 text-center border border-emerald-200 dark:border-emerald-700">
          <Users className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {familyMembers.length}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">إجمالي الأعضاء</div>
        </div>

        {/* Generations */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl p-4 text-center border border-amber-200 dark:border-amber-700">
          <Crown className="h-6 w-6 text-amber-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {generationCount}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400">الأجيال</div>
        </div>

        {/* Males */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-700">
          <UserIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {familyMembers.filter(m => m.gender === 'male').length}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">الذكور</div>
        </div>

        {/* Females */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 rounded-xl p-4 text-center border border-pink-200 dark:border-pink-700">
          <UserRoundIcon className="h-6 w-6 text-pink-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">
            {familyMembers.filter(m => m.gender === 'female').length}
          </div>
          <div className="text-xs text-pink-600 dark:text-pink-400">الإناث</div>
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center cursor-pointer group">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white shadow-lg flex items-center justify-center group-hover:scale-105 transition-all">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.overview', 'نظرة عامة')}</span>
          </div>
          
          <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate(`/family-tree-view?family=${familyId}`)}>
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
              <TreePine className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.tree_diagram', 'مخطط الشجرة')}</span>
          </div>
          
          <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate('/store')}>
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.store', 'المتجر')}</span>
          </div>
          
          <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate(`/family-statistics?family=${familyId}`)}>
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
              <Star className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.statistics', 'الإحصائيات')}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-4">اختر إجراءً للبدء</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button variant="outline" className="flex items-center gap-2 h-12" onClick={onAddMember}>
            <UserPlus className="h-4 w-4" />
            إضافة عضو جديد
          </Button>
          <Button variant="outline" className="flex items-center gap-2 h-12" onClick={() => navigate(`/family-tree-view?family=${familyId}`)}>
            <TreePine className="h-4 w-4" />
            عرض شجرة العائلة
          </Button>
        </div>
      </div>

      {/* Last Updated Info */}
      {familyData?.updated_at && (
        <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
            <Clock className="h-3 w-3" />
            آخر تحديث: {format(new Date(familyData.updated_at), 'd MMMM yyyy', {
              locale: ar
            })}
          </div>
        </div>
      )}
    </div>
  );
};