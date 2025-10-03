import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon, 
  X,
  Loader2,
  Calendar,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { FamilyHeader } from "@/components/FamilyHeader";
import { supabase } from "@/integrations/supabase/client";
import { useDropzone } from "react-dropzone";
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
}

const FamilyGallery = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');
  
  const [familyData, setFamilyData] = useState<any>(null);
  const [memories, setMemories] = useState<FamilyMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<FamilyMemory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editedCaption, setEditedCaption] = useState<string>("");
  const [isSavingCaption, setIsSavingCaption] = useState(false);

  // Load memories
  const loadMemories = useCallback(async () => {
    if (!familyId) return;

    try {
      console.log('📸 Loading family memories...');
      
      const { data: memoriesData, error } = await supabase
        .from('family_memories')
        .select('*')
        .eq('family_id', familyId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      if (memoriesData && memoriesData.length > 0) {
        const memoriesWithUrls = await Promise.all(
          memoriesData.map(async (memory) => {
            const { data: signedUrlData } = await supabase.storage
              .from('family-memories')
              .createSignedUrl(memory.file_path, 3600);

            return {
              ...memory,
              url: signedUrlData?.signedUrl || null
            };
          })
        );

        setMemories(memoriesWithUrls.filter(m => m.url) as FamilyMemory[]);
        console.log(`✅ Loaded ${memoriesWithUrls.length} family memories`);
      }
    } catch (error) {
      console.error('Error loading memories:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الذكريات",
        variant: "destructive"
      });
    }
  }, [familyId, toast]);

  // Fetch family data
  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }

        if (!familyId) {
          navigate('/dashboard');
          return;
        }

        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .select('*')
          .eq('id', familyId)
          .eq('creator_id', user.id)
          .single();

        if (familyError) {
          toast({
            title: "خطأ",
            description: "لم يتم العثور على العائلة",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }

        setFamilyData(familyData);
        await loadMemories();

      } catch (error) {
        console.error('Error fetching family data:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ في تحميل بيانات العائلة",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilyData();
  }, [familyId, navigate, toast, loadMemories]);

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      toast({
        title: "خطأ",
        description: "حجم الملف يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يجب أن يكون الملف صورة",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${familyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('family-memories')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('family_memories')
        .insert({
          family_id: familyId,
          file_path: fileName,
          original_filename: file.name,
          content_type: file.type,
          file_size: file.size,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      toast({
        title: "نجاح",
        description: "تم رفع الصورة بنجاح",
      });

      await loadMemories();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ",
        description: "فشل رفع الصورة",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [familyId, toast, loadMemories]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  // Delete memory
  const deleteMemory = async (memory: FamilyMemory) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('family-memories')
        .remove([memory.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('family_memories')
        .delete()
        .eq('id', memory.id);

      if (dbError) throw dbError;

      toast({
        title: "نجاح",
        description: "تم حذف الصورة بنجاح",
      });

      setIsModalOpen(false);
      await loadMemories();

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "خطأ",
        description: "فشل حذف الصورة",
        variant: "destructive"
      });
    }
  };

  // Save caption
  const saveCaption = async (memory: FamilyMemory) => {
    try {
      setIsSavingCaption(true);

      const { error } = await supabase
        .from('family_memories')
        .update({ caption: editedCaption })
        .eq('id', memory.id);

      if (error) throw error;

      toast({
        title: "نجاح",
        description: "تم حفظ الوصف بنجاح",
      });

      await loadMemories();
      
      // Update selected memory
      if (selectedMemory) {
        setSelectedMemory({
          ...selectedMemory,
          caption: editedCaption
        });
      }

    } catch (error) {
      console.error('Save caption error:', error);
      toast({
        title: "خطأ",
        description: "فشل حفظ الوصف",
        variant: "destructive"
      });
    } finally {
      setIsSavingCaption(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir="rtl">
        <GlobalHeader />
        <main className="relative z-10 pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </main>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir="rtl">
      <GlobalHeader />
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      <main className="relative z-10 pt-20">
        {/* Family Header */}
        <div className="container mx-auto px-4">
          <FamilyHeader 
            familyData={familyData}
            familyId={familyId}
            familyMembers={[]}
            generationCount={0}
            onSettingsClick={() => navigate(`/family-builder-new?family=${familyId}&settings=true`)}
          />
        </div>
        
        {/* Hero Section */}
        <section className="py-8 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            {/* Header Card */}
            <div className="relative max-w-5xl mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/20 to-rose-500/10 rounded-2xl blur-2xl"></div>
              
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-4 sm:py-6 sm:px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                      أرشيف العائلة
                    </h1>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    احفظ ذكريات وصور العائلة في مكان واحد
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div className="max-w-5xl mx-auto mb-8">
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-purple-200/30 dark:border-purple-700/30 shadow-xl">
                <CardContent className="p-6">
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                      ${isDragActive || dragActive
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                      }
                      ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input {...getInputProps()} />
                    
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          جاري رفع الصورة...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="h-12 w-12 text-purple-500" />
                        <div>
                          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            اسحب الصور هنا أو انقر للاختيار
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            PNG, JPG, GIF حتى 5MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Memories Grid */}
            {memories.length > 0 ? (
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {memories.map((memory) => (
                    <Card 
                      key={memory.id}
                      className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-purple-200/30 dark:border-purple-700/30 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedMemory(memory);
                        setEditedCaption(memory.caption || "");
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={memory.url}
                          alt={memory.original_filename}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white text-sm font-medium line-clamp-1">
                            {memory.original_filename}
                          </p>
                          <p className="text-white/70 text-xs mt-1">
                            {format(new Date(memory.uploaded_at), 'dd MMM yyyy', { locale: ar })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto">
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      لا توجد صور بعد
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ابدأ برفع أول صورة لأرشيف العائلة
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <GlobalFooter />

      {/* Memory Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedMemory?.original_filename}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedMemory && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden">
                <img
                  src={selectedMemory.url}
                  alt={selectedMemory.original_filename}
                  className="w-full h-auto"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(selectedMemory.uploaded_at), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  وصف الصورة
                </label>
                <Textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  placeholder="أضف وصفاً للصورة..."
                  className="min-h-[100px] resize-none"
                  dir="rtl"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1"
                >
                  إغلاق
                </Button>
                <Button
                  onClick={() => saveCaption(selectedMemory)}
                  disabled={isSavingCaption}
                  className="flex-1"
                >
                  {isSavingCaption ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ الوصف"
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMemory(selectedMemory)}
                  className="flex-1"
                >
                  حذف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyGallery;
