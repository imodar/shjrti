import React from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface FamilyMemory {
  id: string;
  file_path: string;
  original_filename: string;
  caption: string | null;
  uploaded_by: string;
  uploaded_at: string;
  url?: string;
  photo_date?: string;
  tags?: string[];
  linked_member_id?: string;
}

interface TimelineViewProps {
  memories: FamilyMemory[];
  onMemoryClick: (memory: FamilyMemory) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ memories, onMemoryClick }) => {
  // تجميع حسب السنة والشهر
  const groupedByDate = memories.reduce((acc, memory) => {
    const date = new Date(memory.photo_date || memory.uploaded_at);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = [];
    
    acc[year][month].push(memory);
    return acc;
  }, {} as Record<number, Record<number, FamilyMemory[]>>);
  
  return (
    <div className="space-y-8">
      {Object.entries(groupedByDate)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([year, months]) => (
        <div key={year} className="space-y-6">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 backdrop-blur-xl rounded-lg px-6 py-3 shadow-lg border border-purple-200/40 dark:border-purple-700/40">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {year}
            </h3>
          </div>
          
          {Object.entries(months)
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([month, photos]) => (
            <div key={month} className="mr-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {format(new Date(Number(year), Number(month)), 'MMMM', { locale: ar })}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {photos.length} {photos.length === 1 ? 'صورة' : 'صور'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mr-6">
                {photos.map(photo => (
                  <Card 
                    key={photo.id}
                    className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-purple-200/40 dark:border-purple-700/40 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => onMemoryClick(photo)}
                  >
                    <div className="aspect-square">
                      <img 
                        src={photo.url} 
                        alt={photo.caption || photo.original_filename}
                        className="w-full h-full object-cover"
                      />
                      {photo.caption && (
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                          <p className="text-white text-xs line-clamp-2">
                            {photo.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
