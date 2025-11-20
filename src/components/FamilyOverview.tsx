import React from "react";
import { TreePine, Crown, Gem } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import DOMPurify from 'dompurify';

interface FamilyOverviewProps {
  familyData?: {
    name?: string;
    description?: string;
    updated_at?: string;
  };
  familyMembers: any[];
  generationCount: number;
}

export const FamilyOverview: React.FC<FamilyOverviewProps> = ({
  familyData,
  familyMembers,
  generationCount
}) => {
  return (
    <div className="py-8 px-6 min-h-[500px]">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 pt-4">
        {/* Hero Content */}
        <div className="text-center space-y-10">
          {/* Logo Section with Luxury Design */}
          <div className="relative inline-block">
            <div className="relative group">
              {/* Outer Glow Effect */}
              <div className="absolute inset-0 blur-3xl opacity-60 bg-gradient-to-r from-emerald-400 via-teal-500 to-amber-500 rounded-full transform scale-150 group-hover:scale-175 transition-transform duration-700"></div>
              
              {/* Main Icon Container */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 mx-auto">
                {/* Rotating Decorative Rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-amber-500/30 animate-spin blur-sm" style={{animationDuration: '12s'}}></div>
                <div className="absolute inset-3 rounded-full bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 animate-spin" style={{animationDuration: '10s', animationDirection: 'reverse'}}></div>
                
                {/* Inner Shadow Ring */}
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-primary/30 shadow-inner"></div>
                
                {/* Main Gradient Icon Circle */}
                <div className="absolute inset-8 bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 group-hover:shadow-emerald-500/60 group-hover:scale-110 transition-all duration-500 border-4 border-white/20 backdrop-blur-sm">
                  <TreePine className="h-14 w-14 sm:h-16 sm:w-16 text-white drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
                </div>
                
                {/* Sparkle Effects */}
                <div className="absolute top-2 right-8 w-2 h-2 bg-amber-300 rounded-full shadow-lg shadow-amber-300/50 animate-pulse"></div>
                <div className="absolute bottom-6 left-4 w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-lg shadow-emerald-300/50 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute top-8 left-2 w-1 h-1 bg-teal-200 rounded-full shadow-lg shadow-teal-200/50 animate-pulse" style={{animationDelay: '1s'}}></div>
                
                {/* Premium Badge */}
                <div className="absolute -top-1 -right-1 w-10 h-10 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-full border-4 border-card shadow-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Title Section with Luxury Typography */}
          <div className="space-y-6">
            <div className="space-y-4 relative">
              {/* Background Text Effect */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 blur-sm">
                <span className="text-7xl sm:text-8xl font-black">{familyData?.name || ''}</span>
              </div>
              
              {/* Main Title */}
              <h1 className="relative text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.4] py-4 overflow-visible">
                <span className="inline-block bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent animate-fade-in hover:scale-105 transition-transform duration-300 pb-3">
                  عائلة {familyData?.name || 'شجرة العائلة'}
                </span>
              </h1>
              
              {/* Luxury Decorative Line with Gems */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-emerald-500 to-emerald-500 rounded-full"></div>
                  <Gem className="w-3 h-3 text-emerald-500 animate-pulse" />
                </div>
                <div className="h-3 w-3 rotate-45 bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50"></div>
                <div className="h-2.5 w-24 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full shadow-lg shadow-primary/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                </div>
                <div className="h-3 w-3 rotate-45 bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50"></div>
                <div className="flex items-center gap-2">
                  <Gem className="w-3 h-3 text-emerald-500 animate-pulse" style={{animationDelay: '0.5s'}} />
                  <div className="h-px w-12 bg-gradient-to-r from-emerald-500 to-transparent rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Family Description */}
            {familyData?.description && (
              <div className="max-w-2xl mx-auto animate-fade-in delay-300">
                <div 
                  className="text-foreground text-base sm:text-lg leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(familyData.description) }}
                />
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
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/40 dark:border-gray-600/40 shadow-xl">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {familyMembers.length}
              </div>
              <div className="text-sm text-muted-foreground mt-2">إجمالي الأعضاء</div>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/40 dark:border-gray-600/40 shadow-xl">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {familyMembers.filter(m => m.gender === 'male').length}
              </div>
              <div className="text-sm text-muted-foreground mt-2">الذكور</div>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/40 dark:border-gray-600/40 shadow-xl">
              <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {familyMembers.filter(m => m.gender === 'female').length}
              </div>
              <div className="text-sm text-muted-foreground mt-2">الإناث</div>
            </div>
          </div>
          
          {/* Additional Info Card */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/40 dark:border-gray-600/40 shadow-xl max-w-2xl mx-auto mt-8">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {generationCount}
                </div>
                <div className="text-sm text-muted-foreground mt-2">عدد الأجيال</div>
              </div>
              
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {familyMembers.filter(m => m.is_founder).length}
                </div>
                <div className="text-sm text-muted-foreground mt-2">المؤسسون</div>
              </div>
            </div>
          </div>
          
          {/* Last Updated */}
          {familyData?.updated_at && (
            <div className="text-sm text-muted-foreground mt-8">
              آخر تحديث: {format(new Date(familyData.updated_at), "PPP", { locale: ar })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
