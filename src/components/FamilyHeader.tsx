import React from "react";
import { useNavigate } from "react-router-dom";
import { TreePine, Star, Settings, Users, UserIcon, UserRoundIcon, Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FamilyHeaderProps {
  familyData?: {
    name?: string;
    id?: string;
  };
  familyId?: string;
  familyMembers: Array<{
    gender?: string;
  }>;
  generationCount: number;
  onSettingsClick?: () => void;
}

export const FamilyHeader: React.FC<FamilyHeaderProps> = ({
  familyData,
  familyId,
  familyMembers,
  generationCount,
  onSettingsClick
}) => {
  const navigate = useNavigate();

  return (
    <section className="py-2 relative">
      <div className="mb-2 relative">
        {/* Main Content Container - Horizontal Rectangle */}
        <div className="relative w-full mx-auto">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
          
          <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-1 px-3 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
            <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
              {/* Left: Avatar & Welcome */}
              <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
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
                  <h1 className="text-sm sm:text-base md:text-lg font-bold">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      {familyData?.name || 'شجرة العائلة'}
                    </span>
                  </h1>
                </div>
              </div>

              {/* Center: Compact Creative Stats */}
              <div className="flex-1 px-2">

                {/* Compact Actions */}
                 <div className="flex items-center justify-center gap-2">
                   <button 
                     onClick={() => navigate(`/family-tree-view?family=${familyId}`)}
                     className="group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     <TreePine className="h-4 w-4 relative z-10" />
                     <span className="hidden sm:inline relative z-10">الشجرة</span>
                     <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300"></div>
                   </button>
                   
                   <button 
                     onClick={() => navigate(`/family-statistics?family=${familyId}`)}
                     className="group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                   >
                     <Star className="h-4 w-4 text-amber-500 group-hover:text-amber-600 transition-colors duration-300" />
                     <span className="hidden sm:inline">الإحصائيات</span>
                     <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
                   </button>
                   
                   <button 
                     onClick={onSettingsClick}
                     className="group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                   >
                     <Settings className="h-4 w-4 text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 group-hover:rotate-90 transition-all duration-300" />
                     <span className="hidden sm:inline">الإعدادات</span>
                     <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-slate-600/10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
                   </button>
                 </div>
              </div>

               {/* Right: Generation Stats */}
               <TooltipProvider>
                 <div className="flex flex-col items-center gap-1 sm:gap-2 md:gap-3">
                   <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                     <div className="flex items-center justify-center gap-1">
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs cursor-help">
                           <Users className="h-3 w-3 text-primary" />
                           <span className="font-medium">{familyMembers.length}</span>
                         </div>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>إجمالي أعضاء العائلة</p>
                       </TooltipContent>
                     </Tooltip>
                     <div className="w-1 h-1 bg-border rounded-full"></div>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-full text-xs cursor-help">
                           <UserIcon className="h-3 w-3 text-blue-600" />
                           <span className="font-medium text-blue-600">{familyMembers.filter(m => m.gender === 'male').length}</span>
                         </div>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>عدد الذكور في العائلة</p>
                       </TooltipContent>
                     </Tooltip>
                     <div className="w-1 h-1 bg-border rounded-full"></div>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 rounded-full text-xs cursor-help">
                           <UserRoundIcon className="h-3 w-3 text-rose-600" />
                           <span className="font-medium text-rose-600">{familyMembers.filter(m => m.gender === 'female').length}</span>
                         </div>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>عدد الإناث في العائلة</p>
                       </TooltipContent>
                     </Tooltip>
                     <div className="w-1 h-1 bg-border rounded-full"></div>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded-full text-xs cursor-help">
                           <Crown className="h-3 w-3 text-amber-600" />
                           <span className="font-medium text-amber-600">{generationCount}</span>
                         </div>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>عدد الأجيال في العائلة</p>
                       </TooltipContent>
                      </Tooltip>
                    </div>
                 </div>
                 </div>
               </TooltipProvider>
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