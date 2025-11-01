import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Image, Calendar, X, Upload, FileText, LayoutGrid, List, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

type ViewMode = 'grid' | 'list' | 'timeline';

interface FamilyGalleryViewProps {
  familyId: string;
  readOnly?: boolean;
  onUploadClick?: () => void;
}

export const FamilyGalleryView: React.FC<FamilyGalleryViewProps> = ({
  familyId,
  readOnly = false,
  onUploadClick,
}) => {
  const { toast } = useToast();
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    loadGalleryMemories();
  }, [familyId]);

  const loadGalleryMemories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_memories')
        .select('*')
        .eq('family_id', familyId)
        .order('photo_date', { ascending: false });

      if (error) throw error;

      const memoriesWithUrls = await Promise.all(
        (data || []).map(async (memory) => {
          const url = await getImageUrl(memory.file_path);
          return { ...memory, imageUrl: url };
        })
      );

      setMemories(memoriesWithUrls);
    } catch (error) {
      console.error('Error loading gallery:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الصور",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = async (filePath: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from('family-memories')
        .createSignedUrl(filePath, 3600); // URL valid for 1 hour
      
      if (error) {
        console.error('Error creating signed URL:', error);
        return '';
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30">
        <CardContent className="p-12 text-center">
          <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            لا توجد صور
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {readOnly ? "لم يتم إضافة صور لهذه العائلة بعد" : "ابدأ بإضافة ذكريات عائلتك الآن"}
          </p>
          {!readOnly && onUploadClick && (
            <Button
              onClick={onUploadClick}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Upload className="h-5 w-5 ml-2" />
              رفع صور
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Image className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ألبوم الصور
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {memories.length} صورة
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-lg p-1 border border-gray-200/30 dark:border-gray-700/30">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className={viewMode === 'timeline' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>
            
            {!readOnly && onUploadClick && (
              <Button
                onClick={onUploadClick}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Upload className="h-5 w-5 ml-2" />
                رفع صور
              </Button>
            )}
          </div>
        </div>


        {/* Gallery Views */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <Card
                key={memory.id}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => setSelectedImage(memory)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={memory.imageUrl}
                      alt={memory.caption || "صورة عائلية"}
                      className="w-full h-full object-cover"
                    />
                    {memory.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <p className="text-white text-sm font-medium">
                          {memory.caption}
                        </p>
                      </div>
                    )}
                  </div>
                  {memory.photo_date && (
                    <div className="p-3 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">
                        {new Date(memory.photo_date).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {memories.map((memory) => (
              <Card
                key={memory.id}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => setSelectedImage(memory)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 h-48 md:h-auto relative flex-shrink-0">
                      <img
                        src={memory.imageUrl}
                        alt={memory.caption || "صورة عائلية"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4 space-y-2">
                      {memory.caption && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {memory.caption}
                        </h3>
                      )}
                      {memory.photo_date && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(memory.photo_date).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="space-y-8 relative">
            {/* Timeline Line */}
            <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-purple-500" />
            
            {memories.map((memory, index) => (
              <div key={memory.id} className="relative pr-12">
                {/* Timeline Dot */}
                <div className="absolute right-3.5 top-0 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white dark:border-gray-900 shadow-lg" />
                
                <Card
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => setSelectedImage(memory)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-64 h-48 md:h-auto relative flex-shrink-0">
                        <img
                          src={memory.imageUrl}
                          alt={memory.caption || "صورة عائلية"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-4 space-y-2">
                        {memory.photo_date && (
                          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                            <Calendar className="h-5 w-5" />
                            <span className="text-base">
                              {new Date(memory.photo_date).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        {memory.caption && (
                          <p className="text-gray-800 dark:text-gray-200">
                            {memory.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-gradient-to-br from-white via-gray-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950 border-2 border-emerald-200/30 dark:border-emerald-800/30">
          <VisuallyHidden>
            <DialogTitle>عارض الصور</DialogTitle>
          </VisuallyHidden>
          {selectedImage && (
            <div className="relative animate-fade-in">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 z-10 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Image Container */}
              <div className="relative bg-black/5 dark:bg-black/20 p-6">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 dark:ring-white/10">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.caption || "صورة عائلية"}
                    className="w-full h-auto max-h-[70vh] object-contain bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
                  />
                </div>
              </div>
              
              {/* Info Section */}
              <div className="relative p-4 bg-gradient-to-br from-white/80 via-emerald-50/50 to-amber-50/30 dark:from-gray-900/80 dark:via-emerald-950/50 dark:to-amber-950/30 backdrop-blur-xl border-t border-emerald-200/30 dark:border-emerald-800/30">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Caption Section */}
                  {selectedImage.caption && (
                    <div className="flex-1 space-y-2 p-3 rounded-lg bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/50 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                          الوصف
                        </h3>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed pr-8">
                        {selectedImage.caption}
                      </p>
                    </div>
                  )}
                  
                  {/* Date Section */}
                  <div className={`space-y-2 p-3 rounded-lg bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/50 dark:border-amber-800/30 shadow-sm hover:shadow-md transition-all duration-300 ${selectedImage.caption ? 'sm:w-80' : 'flex-1'}`}>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                        <Calendar className="h-3 w-3 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                        تاريخ الصورة
                      </h3>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium pr-8">
                      {selectedImage.photo_date 
                        ? new Date(selectedImage.photo_date).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'تاريخ الصورة غير معروف'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
