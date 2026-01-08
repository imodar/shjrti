import React from "react";
import { TreePine, Star, Users, Image, BarChart3, UserIcon, UserRoundIcon, Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PublicFamilyHeaderProps {
  familyData?: {
    name?: string;
  };
  familyMembers: Array<{
    gender?: string;
  }>;
  generationCount: number;
  activeSection: string;
  onSectionChange: (section: string) => void;
  showGallery?: boolean;
}

export const PublicFamilyHeader: React.FC<PublicFamilyHeaderProps> = ({
  familyData,
  familyMembers,
  generationCount,
  activeSection,
  onSectionChange,
  showGallery = false
}) => {
  return (
    <section className="py-2 relative">
      <div className="mb-2 relative">
        {/* Main Content Container - Horizontal Rectangle */}
        <div className="relative w-full mx-auto">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
          
          <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-1 px-3 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between gap-4 lg:gap-8">
              {/* Left: Avatar & Welcome */}
              <div className="flex items-center gap-4 lg:gap-6">
                {/* Family Avatar */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-xl border-3 border-white/30 dark:border-gray-700/30">
                    <TreePine className="h-6 w-6 text-white" />
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  </div>
                </div>
                
                 {/* Family Name */}
                <div className="text-right">
                  <h1 className="text-base lg:text-lg font-bold">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      عائلة {familyData?.name || 'شجرة العائلة'}
                    </span>
                  </h1>
                </div>
              </div>

              {/* Center: Section Buttons */}
              <div className="flex-1 px-2">
                <div className="flex items-center justify-center gap-2">
                  <button 
                    onClick={() => onSectionChange('overview')} 
                    className={`group relative flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                      activeSection === 'overview' 
                        ? "text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 overflow-hidden" 
                        : "text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 backdrop-blur-sm"
                    }`}
                  >
                    {activeSection === 'overview' && <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>}
                    <TreePine className={`h-4 w-4 ${activeSection === 'overview' ? 'relative z-10' : 'text-emerald-500 group-hover:text-emerald-600 transition-colors duration-300'}`} />
                    <span className={activeSection === 'overview' ? 'relative z-10' : ''}>نبذة</span>
                  </button>
                  
                  <button 
                    onClick={() => onSectionChange('tree')} 
                    className={`group relative flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                      activeSection === 'tree' 
                        ? "text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 overflow-hidden" 
                        : "text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 backdrop-blur-sm"
                    }`}
                  >
                    <Users className={`h-4 w-4 ${activeSection === 'tree' ? 'relative z-10' : 'text-teal-500 group-hover:text-teal-600 transition-colors duration-300'}`} />
                    <span className={activeSection === 'tree' ? 'relative z-10' : ''}>الشجرة</span>
                  </button>
                  
                  <button 
                    onClick={() => onSectionChange('statistics')} 
                    className={`group relative flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                      activeSection === 'statistics' 
                        ? "text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 overflow-hidden" 
                        : "text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 backdrop-blur-sm"
                    }`}
                  >
                    <BarChart3 className={`h-4 w-4 ${activeSection === 'statistics' ? 'relative z-10' : 'text-amber-500 group-hover:text-amber-600 transition-colors duration-300'}`} />
                    <span className={activeSection === 'statistics' ? 'relative z-10' : ''}>الإحصائيات</span>
                  </button>
                  
                  {showGallery && (
                    <button 
                      onClick={() => onSectionChange('gallery')} 
                      className={`group relative flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                        activeSection === 'gallery' 
                          ? "text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 overflow-hidden" 
                          : "text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 backdrop-blur-sm"
                      }`}
                    >
                      <Image className={`h-4 w-4 ${activeSection === 'gallery' ? 'relative z-10' : 'text-purple-500 group-hover:text-purple-600 transition-colors duration-300'}`} />
                      <span className={activeSection === 'gallery' ? 'relative z-10' : ''}>الألبوم</span>
                    </button>
                  )}
                </div>
              </div>

               {/* Right: Generation Stats */}
               <TooltipProvider>
                 <div className="flex items-center gap-1 lg:gap-2">
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs cursor-help">
                         <Users className="h-3 w-3 text-primary" />
                         <span className="font-medium">{familyMembers.length}</span>
                       </div>
                     </TooltipTrigger>
                     <TooltipContent className="z-[9999]">
                       <p>إجمالي أعضاء العائلة</p>
                     </TooltipContent>
                   </Tooltip>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-full text-xs cursor-help">
                         <UserIcon className="h-3 w-3 text-blue-600" />
                         <span className="font-medium text-blue-600">{familyMembers.filter(m => m.gender === 'male').length}</span>
                       </div>
                     </TooltipTrigger>
                     <TooltipContent className="z-[9999]">
                       <p>عدد الذكور في العائلة</p>
                     </TooltipContent>
                   </Tooltip>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 rounded-full text-xs cursor-help">
                         <UserRoundIcon className="h-3 w-3 text-rose-600" />
                         <span className="font-medium text-rose-600">{familyMembers.filter(m => m.gender === 'female').length}</span>
                       </div>
                     </TooltipTrigger>
                     <TooltipContent className="z-[9999]">
                       <p>عدد الإناث في العائلة</p>
                     </TooltipContent>
                   </Tooltip>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded-full text-xs cursor-help">
                         <Crown className="h-3 w-3 text-amber-600" />
                         <span className="font-medium text-amber-600">{generationCount}</span>
                       </div>
                     </TooltipTrigger>
                     <TooltipContent className="z-[9999]">
                       <p>عدد الأجيال في العائلة</p>
                     </TooltipContent>
                    </Tooltip>
                 </div>
               </TooltipProvider>
            </div>

            {/* Mobile & Tablet Layout */}
            <div className="md:hidden">
              {/* Top Row: Avatar, Name & Stats */}
              <div className="flex items-center justify-between gap-2 mb-2">
                {/* Avatar & Name */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="relative w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
                      <TreePine className="h-5 w-5 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <h1 className="text-sm sm:text-base font-bold">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      عائلة {familyData?.name || 'شجرة العائلة'}
                    </span>
                  </h1>
                </div>

                {/* Stats - Compact */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 rounded-full text-[10px]">
                    <Users className="h-2.5 w-2.5 text-primary" />
                    <span className="font-medium">{familyMembers.length}</span>
                  </div>
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/10 rounded-full text-[10px]">
                    <UserIcon className="h-2.5 w-2.5 text-blue-600" />
                    <span className="font-medium text-blue-600">{familyMembers.filter(m => m.gender === 'male').length}</span>
                  </div>
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-500/10 rounded-full text-[10px]">
                    <UserRoundIcon className="h-2.5 w-2.5 text-rose-600" />
                    <span className="font-medium text-rose-600">{familyMembers.filter(m => m.gender === 'female').length}</span>
                  </div>
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/10 rounded-full text-[10px]">
                    <Crown className="h-2.5 w-2.5 text-amber-600" />
                    <span className="font-medium text-amber-600">{generationCount}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Navigation Buttons */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <button 
                  onClick={() => onSectionChange('overview')} 
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shadow transition-all ${
                    activeSection === 'overview' 
                      ? "text-white bg-gradient-to-r from-amber-500 to-orange-600" 
                      : "text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50"
                  }`}
                >
                  <TreePine className="h-3.5 w-3.5" />
                  <span>نبذة</span>
                </button>
                
                <button 
                  onClick={() => onSectionChange('tree')} 
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shadow transition-all ${
                    activeSection === 'tree' 
                      ? "text-white bg-gradient-to-r from-amber-500 to-orange-600" 
                      : "text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>الشجرة</span>
                </button>
                
                <button 
                  onClick={() => onSectionChange('statistics')} 
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shadow transition-all ${
                    activeSection === 'statistics' 
                      ? "text-white bg-gradient-to-r from-amber-500 to-orange-600" 
                      : "text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50"
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>إحصائيات</span>
                </button>
                
                {showGallery && (
                  <button 
                    onClick={() => onSectionChange('gallery')} 
                    className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shadow transition-all ${
                      activeSection === 'gallery' 
                        ? "text-white bg-gradient-to-r from-amber-500 to-orange-600" 
                        : "text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50"
                    }`}
                  >
                    <Image className="h-3.5 w-3.5" />
                    <span>الألبوم</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-2 right-2 w-6 h-6 border-r border-t border-emerald-300/40 dark:border-emerald-700/40"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 border-l border-b border-emerald-300/40 dark:border-emerald-700/40"></div>
           </div>
         </div>
       </div>
    </section>
  );
};
