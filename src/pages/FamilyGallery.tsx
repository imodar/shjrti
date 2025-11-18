import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon, 
  X,
  Loader2,
  Calendar,
  User,
  Grid,
  List,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { FamilyHeader } from "@/components/FamilyHeader";
import { supabase } from "@/integrations/supabase/client";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { TimelineView } from "./FamilyGallery/TimelineView";
import { FamilyGallerySkeleton } from "@/components/skeletons/FamilyGallerySkeleton";
import { LazyMemoryImage } from "@/components/LazyMemoryImage";

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

const FamilyGallery = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { direction } = useLanguage();
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
  
  // Upload Dialog States
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Upload Form Data
  const [uploadForm, setUploadForm] = useState({
    caption: "",
    photoDate: new Date()
  });

  // View Mode State
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');

  // Storage Usage State
  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    total: 100 * 1024 * 1024, // 100MB
    percentage: 0
  });

  // Family Members for linking - Load only when needed
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMembersLoaded, setFamilyMembersLoaded] = useState(false);

  // Image loading states
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Calculate storage usage
  const calculateStorageUsage = useCallback(async () => {
    if (!familyId) return;
    
    try {
      const { data: allMemories } = await supabase
        .from('family_memories')
        .select('file_size')
        .eq('family_id', familyId);
      
      const totalUsed = allMemories?.reduce((sum, m) => sum + (m.file_size || 0), 0) || 0;
      const percentage = Math.min((totalUsed / storageUsage.total) * 100, 100);
      
      setStorageUsage({
        ...storageUsage,
        used: totalUsed,
        percentage
      });
    } catch (error) {
      console.error('Error calculating storage:', error);
    }
  }, [familyId, storageUsage.total]);

  // Load family members ONLY when needed (lazy loading)
  const loadFamilyMembers = useCallback(async () => {
    if (!familyId || familyMembersLoaded) return;
    
    console.log('👥 Loading family members...');
    try {
      const { data, error } = await supabase
        .from('family_tree_members')
        .select('id, name, first_name, last_name')
        .eq('family_id', familyId)
        .order('name');
      
      if (error) throw error;
      setFamilyMembers(data || []);
      setFamilyMembersLoaded(true);
      console.log('✅ Loaded', data?.length || 0, 'family members');
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  }, [familyId, familyMembersLoaded]);

  // Load memories with PAGINATION (no signed URLs yet - lazy loading)
  const loadMemories = useCallback(async () => {
    if (!familyId) return;

    try {
      console.log('📸 Loading family memories (page', currentPage, ')...');
      
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data: memoriesData, error, count } = await supabase
        .from('family_memories')
        .select('*', { count: 'exact' })
        .eq('family_id', familyId)
        .order('uploaded_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Store memories WITHOUT signed URLs (will be loaded lazily on demand)
      setMemories(memoriesData || []);
      setTotalCount(count || 0);
      
      const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
      console.log(`✅ Loaded ${memoriesData?.length || 0} memories (page ${currentPage} of ${totalPages}, total: ${count})`);
    } catch (error) {
      console.error('Error loading memories:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الذكريات",
        variant: "destructive"
      });
    }
  }, [familyId, toast, currentPage]);

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
        // Load ONLY essential data - family members loaded on demand
        await Promise.all([
          loadMemories(),
          calculateStorageUsage()
        ]);

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
  }, [familyId, navigate, toast, loadMemories, calculateStorageUsage, currentPage]);


  // Handle file upload - Open dialog instead of direct upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Load family members when user wants to upload
    if (!familyMembersLoaded) {
      loadFamilyMembers();
    }

    const file = acceptedFiles[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // التحقق من الحجم
    if (file.size > maxSize) {
      toast({
        title: "خطأ",
        description: "حجم الملف يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    // التحقق من النوع
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يجب أن يكون الملف صورة",
        variant: "destructive"
      });
      return;
    }

    // إنشاء Preview وفتح الـ Dialog
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadDialogOpen(true);
    
    // Reset form
    setUploadForm({
      caption: "",
      photoDate: new Date()
    });
  }, [toast]);


  // Handle confirm upload
  const handleConfirmUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة أولاً",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // رفع الصورة مباشرة بدون قص
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${familyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('family-memories')
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // حفظ Metadata في قاعدة البيانات
      const { error: dbError } = await supabase
        .from('family_memories')
        .insert({
          family_id: familyId,
          file_path: fileName,
          original_filename: selectedFile.name,
          content_type: selectedFile.type,
          file_size: selectedFile.size,
          uploaded_by: user.id,
          caption: uploadForm.caption || null,
          photo_date: uploadForm.photoDate.toISOString()
        });

      if (dbError) throw dbError;

      toast({
        title: "نجاح",
        description: "تم رفع الصورة بنجاح",
      });

      // Reset & Close
      setUploadDialogOpen(false);
      setSelectedFile(null);
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      await loadMemories();
      await calculateStorageUsage();

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
  };

  const handleCancelUpload = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
  };

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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir={direction}>
        <GlobalHeader />
        
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
        </div>

        <main className="relative z-10 pt-20 py-8 flex-1">
          <FamilyGallerySkeleton />
        </main>
        <GlobalFooterSimplified />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir={direction}>
      <GlobalHeader />
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      <main className="relative z-10 pt-20 flex-1">
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

            {/* Unified Content - Upload & Gallery */}
            <div className="max-w-7xl mx-auto">
              <div className="bg-background/95 dark:bg-background/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-border/40 space-y-6">
              
              {/* Upload Section */}
              <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 backdrop-blur-xl border border-purple-200/40 dark:border-purple-700/40 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/30 backdrop-blur-sm"></div>
                
                <CardContent className="relative p-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-center">
                    
                    {/* Stats Section */}
                    <div className="flex items-center gap-3 lg:border-r border-purple-300/40 dark:border-purple-600/40 lg:pr-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <ImageIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">الصور</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {memories.length}
                        </p>
                      </div>
                    </div>

                    {/* Storage Usage */}
                    <div className="flex-1 lg:max-w-[200px] lg:border-r border-purple-300/40 dark:border-purple-600/40 lg:pr-4 w-full">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">التخزين</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {(storageUsage.used / 1024 / 1024).toFixed(1)} / {(storageUsage.total / 1024 / 1024).toFixed(0)} MB
                          </span>
                        </div>
                        <Progress value={storageUsage.percentage} className="h-1.5" />
                        {storageUsage.percentage > 80 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            المساحة على وشك الامتلاء
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Upload Dropzone */}
                    <div className="flex-1 w-full">
                      <div
                        {...getRootProps()}
                        className={`
                          relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 overflow-hidden
                          ${isDragActive || dragActive
                            ? 'border-purple-500 bg-purple-100/50 dark:bg-purple-900/30 scale-[1.02]'
                            : 'border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-900/20'
                          }
                          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <input {...getInputProps()} />
                        
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-pink-400/5 to-rose-400/5 animate-pulse"></div>
                        
                        <div className="relative">
                          {isUploading ? (
                            <div className="flex items-center justify-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 animate-ping absolute"></div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative">
                                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                                </div>
                              </div>
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                جاري رفع الصورة...
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                                <Upload className="h-5 w-5 text-white" />
                              </div>
                              <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                  اسحب الصور أو انقر للاختيار
                                </p>
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                                  PNG, JPG, GIF • حتى 5MB
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>

              {/* Gallery Section */}
              {memories.length > 0 ? (
                <div className="space-y-4">
                  {/* Gallery Header */}
                  <div className="flex items-center justify-between px-2 flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        معرض الصور
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {memories.length} صورة في المعرض
                      </p>
                    </div>
                    
                    {/* View Mode Selector */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="h-4 w-4 ml-2" />
                        شبكة
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4 ml-2" />
                        قائمة
                      </Button>
                      <Button
                        variant={viewMode === 'timeline' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('timeline')}
                      >
                        <Calendar className="h-4 w-4 ml-2" />
                        زمني
                      </Button>
                    </div>
                  </div>

                  {/* View-based rendering */}
                  {viewMode === 'grid' && (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                      {memories.map((memory) => (
                        <Card 
                          key={memory.id}
                          className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-purple-200/40 dark:border-purple-700/40 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer break-inside-avoid mb-4 hover:scale-[1.02]"
                          onClick={() => {
                            setSelectedMemory(memory);
                            setEditedCaption(memory.caption || "");
                            setIsModalOpen(true);
                          }}
                        >
                          {/* Image with Lazy Loading */}
                          <div className="relative overflow-hidden min-h-[200px]">
                            <LazyMemoryImage
                              filePath={memory.file_path}
                              alt={memory.original_filename}
                              className="w-full h-auto transition-transform duration-500 group-hover:scale-110"
                            />
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-white text-sm font-bold line-clamp-2 mb-1">
                                  {memory.caption || memory.original_filename}
                                </p>
                                <div className="flex items-center gap-2 text-white/80 text-xs">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {format(new Date(memory.photo_date || memory.uploaded_at), 'dd MMM yyyy', { locale: ar })}
                                  </span>
                                </div>
                                {memory.tags && memory.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {memory.tags.slice(0, 2).map((tag, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Corner Badge */}
                            <div className="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <ImageIcon className="h-4 w-4 text-white" />
                            </div>
                          </div>

                          {/* Caption Preview (when not hovering) */}
                          {memory.caption && (
                            <div className="p-3 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 group-hover:opacity-0 transition-opacity duration-300">
                              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                                {memory.caption}
                              </p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}

                  {viewMode === 'list' && (
                    <div className="space-y-3">
                      {memories.map((memory) => (
                        <Card 
                          key={memory.id}
                          className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-purple-200/40 dark:border-purple-700/40 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                          onClick={() => {
                            setSelectedMemory(memory);
                            setEditedCaption(memory.caption || "");
                            setIsModalOpen(true);
                          }}
                        >
                          <div className="flex gap-4 p-4">
                            {/* Image Thumbnail with Lazy Loading */}
                            <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden relative">
                              <LazyMemoryImage
                                filePath={memory.file_path}
                                alt={memory.caption || memory.original_filename}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                          </div>
                            
                            {/* Details */}
                            <div className="flex-1 space-y-2">
                              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                                {memory.caption || memory.original_filename}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(memory.photo_date || memory.uploaded_at), "PPP", { locale: ar })}
                                </span>
                                {memory.tags && memory.tags.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {memory.tags.map((tag, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {memory.linked_member_id && (
                                <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  مرتبطة بعضو من العائلة
                                </p>
                              )}
                              </div>
                            </div>
                          </Card>
                      ))}
                    </div>
                  )}

                  {viewMode === 'timeline' && (
                    <TimelineView 
                      memories={memories} 
                      onMemoryClick={(memory) => {
                        setSelectedMemory(memory);
                        setEditedCaption(memory.caption || "");
                        setIsModalOpen(true);
                      }} 
                    />
                  )}
                  
                  {/* Pagination Controls */}
                  {memories.length > 0 && totalCount > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-border/40">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        السابق
                      </Button>
                      
                      <span className="text-sm text-muted-foreground">
                        صفحة {currentPage} من {Math.ceil(totalCount / ITEMS_PER_PAGE)} 
                        ({totalCount} صورة)
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), prev + 1))}
                        disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
                        className="gap-2"
                      >
                        التالي
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-purple-200/30 dark:border-purple-700/30 shadow-xl">
                  <CardContent className="p-16 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-purple-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                        لا توجد صور بعد
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        ابدأ برفع صور العائلة لإنشاء أرشيف جميل من الذكريات
                      </p>
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium">
                        <Upload className="h-4 w-4" />
                        استخدم منطقة الرفع أعلاه
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              </div>
            </div>
          </div>
        </section>
      </main>
      
      <GlobalFooterSimplified />

      {/* Memory Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={direction}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Caption */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    وصف الصورة
                  </label>
                  <Textarea
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    placeholder="أضف وصفاً للصورة..."
                    className="min-h-[100px] resize-none"
                    dir={direction}
                  />
                </div>

                {/* Photo Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    تاريخ الصورة
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(selectedMemory.photo_date || selectedMemory.uploaded_at), 'dd MMMM yyyy', { locale: ar })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    تاريخ التحميل: {format(new Date(selectedMemory.uploaded_at), 'dd MMM yyyy', { locale: ar })}
                  </p>
                </div>
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

      {/* Upload Dialog - Simplified */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl" dir={direction}>
          <DialogHeader>
            <DialogTitle>رفع صورة جديدة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Image Preview */}
            {previewUrl && (
              <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={previewUrl}
                  alt="معاينة"
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
            )}
            
            {/* Form Fields Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">الوصف</Label>
                <Textarea 
                  id="caption"
                  placeholder="أضف وصفاً للصورة..."
                  value={uploadForm.caption}
                  onChange={(e) => setUploadForm({...uploadForm, caption: e.target.value})}
                  rows={3}
                  className="resize-none"
                />
              </div>
              
              {/* Date Picker */}
              <div className="space-y-2">
                <Label>تاريخ الصورة</Label>
                <EnhancedDatePicker
                  value={uploadForm.photoDate}
                  onChange={(date) => date && setUploadForm({...uploadForm, photoDate: date})}
                  placeholder="اختر تاريخ الصورة"
                  disableFuture={false}
                  fromYear={1900}
                  toYear={new Date().getFullYear() + 1}
                />
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleCancelUpload} 
                variant="outline"
                className="flex-1"
                disabled={isUploading}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Upload className="ml-2 h-4 w-4" />
                    رفع الصورة
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyGallery;
