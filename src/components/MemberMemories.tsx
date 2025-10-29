import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Lock, 
  Crown,
  X,
  ZoomIn,
  Calendar,
  User
} from "lucide-react";

interface Memory {
  id: string;
  member_id: string;
  file_path: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  uploaded_by: string;
  uploaded_at: string;
  caption?: string;
  url?: string;
}

interface MemberMemoriesProps {
  memberId: string;
  memberName: string;
}

export const MemberMemories: React.FC<MemberMemoriesProps> = ({ 
  memberId, 
  memberName 
}) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const { isImageUploadEnabled, loading: permissionLoading } = useImageUploadPermission();
  const navigate = useNavigate();

  // Load memories for this member
  const loadMemories = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get memories metadata
      const { data: memoriesData, error: memoriesError } = await supabase
        .from('member_memories')
        .select('*')
        .eq('member_id', memberId)
        .order('uploaded_at', { ascending: false });

      if (memoriesError) {
        console.error('Error fetching memories:', memoriesError);
        return;
      }

      // Get public URLs for each memory
      const memoriesWithUrls = await Promise.all(
        (memoriesData || []).map(async (memory) => {
           const { data: signedData, error: signedError } = await supabase.storage
             .from('member-memories')
             .createSignedUrl(memory.file_path, 60 * 60); // 1 hour

           if (signedError) {
             console.warn('Failed to create signed URL, falling back to public URL:', signedError);
             const { data: urlData } = supabase.storage
               .from('member-memories')
               .getPublicUrl(memory.file_path);
             return {
               ...memory,
               url: urlData.publicUrl
             };
           }
           
           return {
             ...memory,
             url: signedData?.signedUrl || ''
           };
        })
      );

      setMemories(memoriesWithUrls);
    } catch (error) {
      console.error('Error loading memories:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الذكريات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [memberId, toast]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!isImageUploadEnabled) {
      toast({
        title: "ميزة غير متاحة",
        description: "تحتاج إلى ترقية باقتك لرفع الصور",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        // Check file size (1MB limit)
        if (file.size > 1048576) {
          toast({
            title: "حجم الملف كبير جداً",
            description: `الحد الأقصى لحجم الملف هو 1 ميجابايت. ${file.name} حجمه ${(file.size / 1048576).toFixed(2)} ميجابايت`,
            variant: "destructive"
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${memberId}/${fileName}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('member-memories')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Save memory metadata
        const { error: metadataError } = await supabase
          .from('member_memories')
          .insert({
            member_id: memberId,
            file_path: filePath,
            original_filename: file.name,
            file_size: file.size,
            content_type: file.type
          });

        if (metadataError) {
          throw metadataError;
        }
      }

      toast({
        title: "تم رفع الصور بنجاح",
        description: `تم رفع ${acceptedFiles.length} صورة جديدة`
      });

      // Reload memories
      loadMemories();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ في الرفع",
        description: "حدث خطأ أثناء رفع الصور",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [memberId, isImageUploadEnabled, toast, loadMemories]);

  // Delete memory
  const deleteMemory = async (memory: Memory) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('member-memories')
        .remove([memory.file_path]);

      if (storageError) {
        throw storageError;
      }

      // Delete metadata
      const { error: dbError } = await supabase
        .from('member_memories')
        .delete()
        .eq('id', memory.id);

      if (dbError) {
        throw dbError;
      }

      toast({
        title: "تم حذف الصورة",
        description: "تم حذف الصورة بنجاح"
      });

      loadMemories();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الصورة",
        variant: "destructive"
      });
    }
  };

  // Simple drag and drop implementation without react-dropzone
  const [isDragActive, setIsDragActive] = useState(false);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      await onDrop(files);
    }
  }, [onDrop]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onDrop(files);
    }
  }, [onDrop]);

  if (permissionLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <ImageIcon className="h-5 w-5" />
        ذكريات الأفراد - {memberName}
      </h3>

      {/* Upload Area */}
      {isImageUploadEnabled ? (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            type="file"
            id="memory-upload"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <label htmlFor="memory-upload" className="cursor-pointer">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">
              {uploading ? 'جاري الرفع...' : 'اسحب الصور هنا أو انقر للاختيار'}
            </p>
            <p className="text-xs text-muted-foreground">
              الحد الأقصى: 1 ميجابايت لكل صورة
            </p>
          </label>
        </div>
      ) : (
        <div className="relative border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/30">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">رفع الصور غير متاح</p>
          <p className="text-xs text-muted-foreground mb-3">
            يتطلب هذه الميزة ترقية باقتك
          </p>
          <Button 
            variant="default" 
            size="sm" 
            className="gap-2"
            onClick={() => navigate('/plan-selection')}
          >
            <Crown className="h-4 w-4" />
            ترقية الباقة
          </Button>
        </div>
      )}

      {/* Memories Grid */}
      {loading ? (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : memories.length > 0 ? (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {memories.length} صورة
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {memories.map((memory) => (
              <div key={memory.id} className="group relative aspect-square">
                <img
                  src={memory.url}
                  alt={`${memberName} - ${memory.original_filename}`}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform group-hover:scale-105"
                  onError={() => {
                    console.warn('Image failed to load, refreshing signed URL');
                    loadMemories();
                  }}
                  onClick={() => {
                    setSelectedMemory(memory);
                    setShowModal(true);
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMemory(memory);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        setSelectedMemory(memory);
                        setShowModal(true);
                      }}
                    >
                      <ZoomIn className="h-3 w-3 ml-1" />
                      عرض
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center py-12">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">لا توجد صور مرفقة حالياً</p>
          {isImageUploadEnabled && (
            <p className="text-sm text-muted-foreground mt-2">
              ابدأ برفع أول صورة لذكريات {memberName}
            </p>
          )}
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl w-full p-0">
          {selectedMemory && (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {selectedMemory.original_filename}
                </DialogTitle>
              </DialogHeader>
              <div className="p-6">
                <div className="relative mb-4">
                  <img
                    src={selectedMemory.url}
                    alt={selectedMemory.original_filename}
                    className="w-full max-h-[60vh] object-contain rounded-lg"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setShowModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Memory Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    تاريخ الرفع: {new Date(selectedMemory.uploaded_at).toLocaleDateString('ar')}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    الحجم: {(selectedMemory.file_size / 1024).toFixed(0)} كيلوبايت
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    إغلاق
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteMemory(selectedMemory);
                      setShowModal(false);
                    }}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};