import React from "react";
import { TreePine } from "lucide-react";
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
        <div className="text-center space-y-8">
          {/* Logo Section */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30 dark:border-gray-700/30 mx-auto">
              <TreePine className="h-12 w-12 text-white" />
            </div>
          </div>
          
          {/* Title Section */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                عائلة {familyData?.name || 'شجرة العائلة'}
              </span>
            </h1>
            
            {/* Description */}
            {familyData?.description && (
              <div 
                className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(familyData.description) }}
              />
            )}
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
