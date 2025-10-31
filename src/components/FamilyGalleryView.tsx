import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image, Calendar, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

        {/* Gallery Grid */}
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
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.caption || "صورة عائلية"}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="p-4 bg-white dark:bg-gray-800">
                {selectedImage.caption && (
                  <p className="text-gray-900 dark:text-gray-100 font-medium mb-2">
                    {selectedImage.caption}
                  </p>
                )}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {selectedImage.photo_date 
                      ? new Date(selectedImage.photo_date).toLocaleDateString('ar-SA')
                      : 'تاريخ الصورة غير معروف'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
