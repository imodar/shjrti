import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Edit2, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop, Star, Sparkles, Image, Store, MoreVertical, Menu, ChevronsUpDown, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";
import { useIsMobile } from "@/hooks/use-mobile";
import WifeForm from "@/components/WifeForm";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

// Image Upload Component - moved outside to prevent recreation on each render
const ImageUploadSection = ({
  isImageUploadEnabled,
  uploadLoading,
  croppedImage,
  selectedImage,
  showCropDialog,
  crop,
  zoom,
  fileInputRef,
  handleEditImage,
  handleDeleteImage,
  handleImageSelect,
  setShowCropDialog,
  setCrop,
  setZoom,
  onCropComplete,
  handleCropSave
}: any) => {
  const tooltipContent = isImageUploadEnabled 
    ? "انقر لرفع صورة شخصية للعضو" 
    : "رفع الصور متاح فقط للمشتركين في الخطط المدفوعة. قم بترقية اشتراكك لتفعيل هذه الميزة.";

  if (uploadLoading) {
    return (
      <div className="space-y-3">
        <Label htmlFor="picture" className="text-sm font-medium text-foreground">الصورة الشخصية</Label>
        <div className="relative border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-gradient-to-br from-background to-muted/30 transition-all duration-300">
          <div className="space-y-3">
            <div className="relative">
              <Upload className="h-16 w-16 mx-auto text-primary/60 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 rounded-full blur-xl opacity-50 animate-pulse"></div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">جاري التحقق من الصلاحيات...</p>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <Label htmlFor="picture" className="text-sm font-medium text-foreground">الصورة الشخصية</Label>
      
      {croppedImage ? (
        // Enhanced uploaded image display - centered and compact
        <div className="space-y-3">
          <div className="relative group flex justify-center">
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20 p-3 transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
              <div className="relative inline-block">
                <img 
                  src={croppedImage} 
                  alt="صورة العضو" 
                  className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* Success indicator */}
              <div className="absolute top-1 left-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-arabic">تم الرفع</span>
              </div>
            </div>
          </div>
          
          {/* Action buttons - centered and improved */}
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleEditImage}
              className="h-8 px-3 bg-white/90 hover:bg-white border border-gray-200 shadow-sm backdrop-blur-sm font-arabic"
            >
              <Edit2 className="h-3 w-3 ml-1" />
              تعديل
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleDeleteImage}
              className="h-8 px-3 bg-red-500/90 hover:bg-red-600 shadow-sm backdrop-blur-sm font-arabic"
            >
              <Trash2 className="h-3 w-3 ml-1" />
              حذف
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center font-arabic">انقر على الأزرار لتعديل أو حذف الصورة</p>
        </div>
      ) : (
        // Enhanced upload area
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-300 ${
                  isImageUploadEnabled 
                    ? 'border-primary/40 cursor-pointer hover:border-primary/60 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0' 
                    : 'border-gray-300 opacity-70 cursor-not-allowed bg-gradient-to-br from-gray-50 to-gray-100'
                }`}
                onClick={() => isImageUploadEnabled && fileInputRef.current?.click()}
              >
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-50"></div>
                
                {isImageUploadEnabled ? (
                  <div className="relative space-y-2">
                    <div className="relative">
                      <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl w-fit mx-auto">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 rounded-xl blur-xl opacity-30 animate-pulse"></div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground font-arabic">انقر لرفع الصورة</p>
                      <p className="text-xs text-muted-foreground font-arabic">PNG, JPG, GIF حتى 10MB</p>
                    </div>
                    
                    {/* Enhanced visual indicators */}
                    <div className="flex justify-center items-center space-x-2 pt-1">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Camera className="h-3 w-3 text-primary" />
                        <span className="font-arabic">عالية الجودة</span>
                      </div>
                      <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Crop className="h-3 w-3 text-primary" />
                        <span className="font-arabic">قص تلقائي</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative space-y-2">
                    <div className="relative">
                      <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl w-fit mx-auto">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 font-arabic">رفع الصور غير متاح</p>
                      <p className="text-xs text-gray-400 font-arabic">يتطلب اشتراك مدفوع</p>
                    </div>
                    
                    {/* Upgrade call-to-action */}
                    <div className="pt-1">
                      <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-primary to-primary/80 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        <Star className="h-3 w-3" />
                        <span className="font-arabic">ترقية الاشتراك</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className={`max-w-xs p-3 ${isImageUploadEnabled ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-r from-primary to-primary/80 text-white'} border-0 shadow-xl`}
            >
              <div className="space-y-1">
                <p className="font-medium">{tooltipContent}</p>
                {!isImageUploadEnabled && (
                  <p className="text-xs opacity-90">انقر لمعرفة المزيد عن الخطط المتاحة</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        disabled={!isImageUploadEnabled}
      />
      
      {/* Enhanced Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-md bg-gradient-to-br from-background to-muted/20 border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
              <Crop className="h-5 w-5 text-primary" />
              تعديل الصورة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {selectedImage && (
              <div className="relative h-64 bg-black rounded-xl overflow-hidden border-2 border-primary/20 shadow-xl">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      position: 'relative'
                    }
                  }}
                />
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">التكبير</Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCropDialog(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleCropSave}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Save className="h-4 w-4 mr-2" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FamilyBuilderNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasAIFeatures } = useSubscription();
  const isMobile = useIsMobile();

  const calculateGenerationCount = () => {
    if (familyMembers.length === 0) return 1;
    
    const generationMap = new Map();
    
    familyMembers.forEach(member => {
      if (member.isFounder || (!member.fatherId && !member.motherId)) {
        generationMap.set(member.id, 1);
      }
    });
    
    let changed = true;
    let maxIterations = 50;
    let iterations = 0;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (!generationMap.has(member.id)) {
          if (member.fatherId || member.motherId) {
            const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : undefined;
            const motherGeneration = member.motherId ? generationMap.get(member.motherId) : undefined;
            
            if (fatherGeneration !== undefined || motherGeneration !== undefined) {
              const parentGeneration = Math.max(
                fatherGeneration || 0, 
                motherGeneration || 0
              );
              generationMap.set(member.id, parentGeneration + 1);
              changed = true;
            }
          } else {
            generationMap.set(member.id, 1);
            changed = true;
          }
        }
      });
    }
    
    (familyMarriages || []).forEach(marriage => {
      const husbandGeneration = generationMap.get(marriage.husband?.id);
      const wifeGeneration = generationMap.get(marriage.wife?.id);
      
      if (husbandGeneration && !wifeGeneration) {
        generationMap.set(marriage.wife?.id, husbandGeneration);
      } else if (wifeGeneration && !husbandGeneration) {
        generationMap.set(marriage.husband?.id, wifeGeneration);
      }
    });
    
    const generations = Array.from(generationMap.values());
    return generations.length > 0 ? Math.max(...generations) : 1;
  };

  const getGenerationStats = () => {
    if (familyMembers.length === 0) return [];
    
    const generationMap = new Map();
    
    familyMembers.forEach(member => {
      if (member.isFounder || (!member.fatherId && !member.motherId)) {
        generationMap.set(member.id, 1);
      }
    });
    
    let changed = true;
    let maxIterations = 50;
    let iterations = 0;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (!generationMap.has(member.id)) {
          if (member.fatherId || member.motherId) {
            const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : undefined;
            const motherGeneration = member.motherId ? generationMap.get(member.motherId) : undefined;
            
            if (fatherGeneration !== undefined || motherGeneration !== undefined) {
              const parentGeneration = Math.max(
                fatherGeneration || 0, 
                motherGeneration || 0
              );
              generationMap.set(member.id, parentGeneration + 1);
              changed = true;
            }
          } else {
            generationMap.set(member.id, 1);
            changed = true;
          }
        }
      });
    }
    
    (familyMarriages || []).forEach(marriage => {
      const husbandGeneration = generationMap.get(marriage.husband?.id);
      const wifeGeneration = generationMap.get(marriage.wife?.id);
      
      if (husbandGeneration && !wifeGeneration) {
        generationMap.set(marriage.wife?.id, husbandGeneration);
      } else if (wifeGeneration && !husbandGeneration) {
        generationMap.set(marriage.husband?.id, wifeGeneration);
      }
    });
    
    const generationCounts = new Map();
    generationMap.forEach((generation) => {
      generationCounts.set(generation, (generationCounts.get(generation) || 0) + 1);
    });
    
    return Array.from(generationCounts.entries()).sort((a, b) => a[0] - b[0]);
  };

  // Image Upload and Crop Component (consolidated states)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = document.createElement('img');
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result as string));
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setShowCropDialog(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (selectedImage && croppedAreaPixels) {
      const croppedImg = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (croppedImg) {
        setCroppedImage(croppedImg);
        setShowCropDialog(false);
      }
    }
  };

  const handleDeleteImage = () => {
    setCroppedImage(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditImage = () => {
    if (selectedImage) {
      setShowCropDialog(true);
    }
  };

  // Get image upload permission state from top level
  const { isImageUploadEnabled, loading: uploadLoading } = useImageUploadPermission();

  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const { notifications, profile } = useDashboardData();
  
  // Package and subscription data
  const [packageData, setPackageData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const familyId = searchParams.get('family');
  const treeId = searchParams.get('treeId');
  const isNew = searchParams.get('new') === 'true';
  const isEditMode = searchParams.get('edit') === 'true';
  
  const [activeTab, setActiveTab] = useState("overview");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyMarriages, setFamilyMarriages] = useState([]);
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form panel states
  const [formMode, setFormMode] = useState<'view' | 'add' | 'edit'>('view');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [relationshipPopoverOpen, setRelationshipPopoverOpen] = useState(false);
  
  // Mobile drawer state
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
        
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Loading package data for user:', user.id);

      const { data: userSubscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          packages:package_id (
            id,
            name,
            max_family_members,
            max_family_trees,
            features
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('User subscription data:', userSubscription, 'Error:', subError);

      if (userSubscription && userSubscription.packages) {
        setPackageData(userSubscription.packages);
        setSubscriptionData(userSubscription);
      } else {
        console.log('No subscription found, using free package');
        const { data: freePackage } = await supabase
          .from('packages')
          .select('*')
          .ilike('name->en', 'Free')
          .single();
        console.log('Free package fallback:', freePackage);
        if (freePackage) setPackageData(freePackage);
      }
      
      if (!familyId) {
        throw new Error('No family ID provided');
      }

      console.log('🔍 Loading family with ID:', familyId);
      
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .eq('creator_id', user.id)
        .single();

      if (familyError) {
        console.error('Error fetching family:', familyError);
        throw familyError;
      }

      if (!family) {
        throw new Error('Family not found or access denied');
      }

      console.log('✅ Loaded family:', family);
      const familyToUse = family;
      setFamilyData(familyToUse);
      
      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', familyToUse.id);

      if (membersError) throw membersError;

      if (members) {
        const transformedMembers = members.map(member => ({
          id: member.id,
          name: member.name,
          fatherId: member.father_id,
          motherId: member.mother_id,
          spouseId: member.spouse_id,
          relatedPersonId: member.related_person_id,
          isFounder: member.is_founder,
          gender: member.gender || 'male',
          birthDate: member.birth_date || '',
          isAlive: member.is_alive,
          deathDate: member.death_date || null,
          image: member.image_url || null,
          bio: member.biography || '',
          relation: ""
        }));
        
        setFamilyMembers(transformedMembers);
      }

      const { data: marriages, error: marriagesError } = await supabase
        .from('marriages')
        .select(`
          id,
          husband:family_tree_members!marriages_husband_id_fkey(id, name),
          wife:family_tree_members!marriages_wife_id_fkey(id, name),
          is_active
        `)
        .eq('family_id', familyToUse.id)
        .eq('is_active', true);

      if (marriagesError) throw marriagesError;

      if (marriages) {
        setFamilyMarriages(marriages);
        console.log('Fetched marriages:', marriages);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
      toast({
        title: t('family_builder.error_loading_data', 'خطأ في تحميل البيانات'),
        description: t('family_builder.error_loading_desc', 'حدث خطأ أثناء تحميل بيانات العائلة'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshFamilyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      console.log('Refreshing family data...');

      const familyId = new URLSearchParams(window.location.search).get('family');
      if (!familyId) throw new Error('Family ID not found in URL');

      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (familyError) throw familyError;
      setFamilyData(family);

      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', family.id);

      if (membersError) throw membersError;

      const transformedMembers = members.map(member => ({
        id: member.id,
        name: member.name,
        fatherId: member.father_id,
        motherId: member.mother_id,
        spouseId: member.spouse_id,
        relatedPersonId: member.related_person_id,
        isFounder: member.is_founder,
        gender: member.gender,
        birthDate: member.birth_date || "",
        isAlive: member.is_alive,
        deathDate: member.death_date || null,
        image: member.image_url || null,
        bio: member.biography || "",
        relation: ""
      }));

      setFamilyMembers(transformedMembers);

      const { data: marriages, error: marriagesError } = await supabase
        .from('marriages')
        .select(`
          id,
          husband:family_tree_members!marriages_husband_id_fkey(id, name),
          wife:family_tree_members!marriages_wife_id_fkey(id, name),
          is_active
        `)
        .eq('family_id', family.id)
        .eq('is_active', true);

      if (marriagesError) throw marriagesError;

      if (marriages) {
        setFamilyMarriages(marriages);
      }

      console.log('Family data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing family data:', error);
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, [toast]);
  
  // Search and filter states
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Form data states
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    relatedPersonId: null as string | null,
    selectedParent: null as string | null,
    gender: "male",
    birthDate: null as Date | null,
    isAlive: true,
    deathDate: null as Date | null,
    bio: "",
    imageUrl: "",
    croppedImage: null as string | null,
    isFounder: false
  });

  const [wives, setWives] = useState<Array<{
    id: string;
    name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
    maritalStatus?: string;
    croppedImage?: string | null;
    isFamilyMember?: boolean;
    existingFamilyMemberId?: string;
    isExistingFamilyMember?: boolean;
  }>>([]);

  const [husband, setHusband] = useState<{
    id: string;
    name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
    maritalStatus?: string;
    croppedImage?: string | null;
    isFamilyMember?: boolean;
    existingFamilyMemberId?: string;
    isExistingFamilyMember?: boolean;
  } | null>(null);

  // Command states for search
  const [husbandCommandOpen, setHusbandCommandOpen] = useState(false);
  const [wivesCommandOpen, setWivesCommandOpen] = useState<{ [key: number]: boolean }>({});

  // Crop function helper
  const createCroppedImage = async (imageSrc: string, crop: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = crop.width;
        canvas.height = crop.height;

        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const croppedImageUrl = URL.createObjectURL(blob);
          resolve(croppedImageUrl);
        }, 'image/jpeg', 0.95);
      };
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = imageSrc;
    });
  };

  // Form states for member creation/editing
  
  // Delete modal states (keep existing delete modal functionality)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [deleteModalType, setDeleteModalType] = useState<'spouse' | 'bloodMember'>('spouse');
  const [deleteWarningMessage, setDeleteWarningMessage] = useState("");

  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
      (selectedFilter === "alive" && member.isAlive) ||
      (selectedFilter === "deceased" && !member.isAlive) ||
      (selectedFilter === "male" && member.gender === "male") ||
      (selectedFilter === "female" && member.gender === "female") ||
      (selectedFilter === "founders" && member.isFounder);
    
    return matchesSearch && matchesFilter;
  });

  // Form panel actions
  const handleAddMember = () => {
    setFormMode('add');
    setEditingMember(null);
    setCurrentStep(1);
    resetFormData();
    if (isMobile) setIsMemberListOpen(false);
  };

  const handleEditMember = (member: any) => {
    setFormMode('edit');
    setEditingMember(member);
    setCurrentStep(1);
    populateFormData(member);
    if (isMobile) setIsMemberListOpen(false);
  };

  const handleCancelForm = () => {
    setFormMode('view');
    setEditingMember(null);
    setCurrentStep(1);
    resetFormData();
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      relation: "",
      relatedPersonId: null,
      selectedParent: null,
      gender: "male",
      birthDate: null,
      isAlive: true,
      deathDate: null,
      bio: "",
      imageUrl: "",
      croppedImage: null,
      isFounder: false
    });
    setWives([]);
    setHusband(null);
  };

  const populateFormData = (member: any) => {
    setFormData({
      name: member.name || "",
      relation: member.relation || "",
      relatedPersonId: member.relatedPersonId,
      selectedParent: member.relatedPersonId || null,
      gender: member.gender || "male",
      birthDate: member.birthDate ? new Date(member.birthDate) : null,
      isAlive: member.isAlive ?? true,
      deathDate: member.deathDate ? new Date(member.deathDate) : null,
      bio: member.bio || "",
      imageUrl: member.image || "",
      croppedImage: member.image || null,
      isFounder: member.isFounder || false
    });
    // TODO: Load existing spouses
  };

  const handleFormSubmit = async (submissionData: any) => {
    try {
      setIsSaving(true);
      
      // Determine marital status based on presence of spouses
      const hasSpouses = submissionData.gender === "male" && wives.length > 0 || 
                        submissionData.gender === "female" && husband;
      
      // Prepare final submission data matching modal structure
      const finalData = {
        ...submissionData,
        maritalStatus: hasSpouses ? "married" : "single",
        wives: submissionData.gender === "male" ? wives : [],
        husband: submissionData.gender === "female" && husband ? husband : null
      };
      
      // Call the existing submission logic (same as modal)
      console.log('🔥 Submitting form data:', finalData);
      
      // TODO: Implement actual submission to database
      // This should match the logic from ModernFamilyMemberModal.tsx
      
      await refreshFamilyData();
      setFormMode('view');
      setCurrentStep(1);
      resetFormData();
      setWives([]);
      setHusband(null);
      
      toast({
        title: "تم بنجاح",
        description: editingMember ? "تم تحديث البيانات بنجاح" : "تم إضافة العضو بنجاح",
      });
      
      toast({
        title: formMode === 'edit' ? "تم تحديث العضو" : "تم إضافة العضو",
        description: formMode === 'edit' ? "تم تحديث بيانات العضو بنجاح" : "تم إضافة العضو الجديد بنجاح",
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    // Validate required fields for step 1
    if (currentStep === 1) {
      if (!formData.name?.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى إدخال الاسم الكامل",
          variant: "destructive"
        });
        return;
      }
      if (!formData.gender) {
        toast({
          title: "خطأ في البيانات", 
          description: "يرجى اختيار الجنس",
          variant: "destructive"
        });
        return;
      }
      if (!formData.selectedParent) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى اختيار العلاقة العائلية",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getAdditionalInfo = (member: any) => {
    const parts = [];
    if (member.birthDate) parts.push(`مولود: ${member.birthDate}`);
    if (!member.isAlive && member.deathDate) parts.push(`متوفى: ${member.deathDate}`);
    if (member.isFounder) parts.push("مؤسس العائلة");
    return parts.join(" • ");
  };

  const getFullName = (member: any) => {
    if (!member.relatedPersonId || !familyMembers.length) return member.name;
    const relatedPerson = familyMembers.find(m => m.id === member.relatedPersonId);
    if (!relatedPerson) return member.name;
    return `${member.name} (${member.relation} ${relatedPerson.name})`;
  };

  const getGenderColor = (gender: string) => {
    return gender === "female" ? "text-pink-600" : "text-blue-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
        </div>

        {/* Floating Animated Icons */}
        <div className="absolute top-32 right-20 animate-float">
          <Heart className="h-10 w-10 text-pink-400 opacity-60" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float-delayed">
          <Users className="h-12 w-12 text-emerald-400 opacity-40" />
        </div>
        <div className="absolute top-1/2 left-10 animate-float-slow">
          <Star className="h-8 w-8 text-yellow-400 opacity-60" />
        </div>
        
        <GlobalHeader />
        <div className="flex items-center justify-center min-h-[80vh] relative z-10">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
              <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
            </div>
            <p className="text-lg font-medium bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
              {t('common.loading', 'جاري التحميل...')}
            </p>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir={direction}>
      <GlobalHeader />
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      {/* Floating Animated Icons */}
      <div className="absolute top-32 right-20 animate-float">
        <Heart className="h-10 w-10 text-pink-400 opacity-60" />
      </div>
      <div className="absolute bottom-40 left-20 animate-float-delayed">
        <Users className="h-12 w-12 text-emerald-400 opacity-40" />
      </div>
      <div className="absolute top-1/2 left-10 animate-float-slow">
        <Star className="h-8 w-8 text-yellow-400 opacity-60" />
      </div>
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-primary/5 via-primary/10 to-transparent blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-secondary/5 via-secondary/10 to-transparent blur-3xl"></div>
      </div>

      <div className="relative z-10 pt-20">
        {/* Header Box from FamilyBuilder */}
        <div className="container mx-auto px-4 py-4">
          <div className="mb-8">
            <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-4 sm:px-6 shadow-2xl ring-1 ring-white/20 dark:ring-gray-500/20">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
                {/* Right Side: Icon + Title + Description */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xl border-2 border-white/30 dark:border-gray-700/30">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
                    </div>
                    {/* Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        {t('family_builder.family', 'عائلة')} {familyData?.name || t('family_builder.unspecified', 'غير محدد')}
                      </span>
                    </h1>
                  </div>
                </div>

                {/* Sample Statistics Section - Responsive */}
                <div className="flex justify-center items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-2 lg:pb-0">
                  {/* Members Available */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-center">
                      <div className="text-sm sm:text-base lg:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {familyMembers.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('family_builder.members_count', 'أعضاء')}</div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="w-px h-6 sm:h-8 bg-white/20 dark:bg-gray-600/20"></div>

                  {/* Number of Generations */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                    <div className="text-center">
                      <div className="text-sm sm:text-base lg:text-lg font-bold text-amber-600 dark:text-amber-400">
                        {calculateGenerationCount()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('family_builder.generations', 'أجيال')}</div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="w-px h-6 sm:h-8 bg-white/20 dark:bg-gray-600/20"></div>

                  {/* Last Modified Date */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400" />
                    <div className="text-center">
                      <div className="text-sm sm:text-base lg:text-lg font-bold text-teal-600 dark:text-teal-400">
                        {familyData?.updated_at 
                          ? format(new Date(familyData.updated_at), 'd MMM', { locale: ar })
                          : t('family_builder.today', 'اليوم')
                        }
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('family_builder.last_modified', 'آخر تعديل')}</div>
                    </div>
                  </div>
                </div>

                {/* Navigation Icons */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white shadow-lg flex items-center justify-center group-hover:scale-105 transition-all">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.overview', 'نظرة عامة')}</span>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => navigate(`/family-tree-view?family=${familyId}`)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
                      <TreePine className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.tree_diagram', 'مخطط الشجرة')}</span>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => navigate('/store')}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
                      <Store className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.store', 'المتجر')}</span>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => navigate(`/family-statistics?family=${familyId}`)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
                      <Star className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.statistics', 'الإحصائات')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Section */}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className={cn(
            "grid gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-12"
          )}>
            {/* Form Panel - Right Side on Desktop */}
            <div className={cn(
              "space-y-6",
              isMobile ? "order-2" : "col-span-8 order-2"
            )}>
               <Card className="h-fit relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-white/30 dark:border-gray-600/30 shadow-xl">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-500/10 dark:to-gray-500/5 rounded-lg"></div>
                <CardHeader className="pb-4 relative">
                  <div className="flex items-center justify-end">
                    <CardTitle className="flex items-center gap-2 order-1">
                      {formMode === 'view' && <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                      {formMode === 'add' && <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                      {formMode === 'edit' && <Edit className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                       <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                         {formMode === 'view' && "معلومات العضو"}
                         {formMode === 'add' && "إضافة عضو جديد"}
                         {formMode === 'edit' && `تعديل معلومات ${editingMember?.name || 'العضو'}`}
                       </span>
                    </CardTitle>

                    {/* Step Indicator for add/edit modes - positioned at far left in RTL */}
                    {formMode !== 'view' && (
                      <div className="flex items-center gap-3 order-2 ms-auto">
                        {[1, 2].map((step, index) => (
                          <div key={step} className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-all duration-200",
                                currentStep >= step
                                  ? "bg-primary border-primary text-primary-foreground shadow-md"
                                  : "bg-background border-muted-foreground/30 text-muted-foreground"
                              )}
                            >
                              {currentStep > step ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                step
                              )}
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              currentStep >= step ? "text-primary" : "text-muted-foreground"
                            )}>
                              {step === 1 ? "المعلومات الأساسية" : "التفاصيل الإضافية"}
                            </span>
                            {index < 1 && (
                              <div className={cn(
                                "w-12 h-0.5 mx-2 transition-all duration-200",
                                currentStep > step ? "bg-primary" : "bg-muted-foreground/30"
                              )} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                     
                     {formMode === 'view' && (
                       <Button onClick={handleAddMember} className="flex items-center gap-2">
                         <Plus className="h-4 w-4" />
                         إضافة عضو
                       </Button>
                     )}
                   </div>
                 </CardHeader>
                <CardContent className="relative">
                  {formMode === 'view' ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>اختر عضواً من القائمة لعرض أو تعديل بياناته</p>
                      <p className="text-sm mt-2">أو اضغط "إضافة عضو" لإضافة عضو جديد</p>
                    </div>
                  ) : (
                    <div className="space-y-6">

                      {/* Step Content */}
                      {currentStep === 1 && (
                         <div className="space-y-4">
                           <h3 className="text-lg font-semibold font-arabic">المعلومات الأساسية</h3>
                           
                           {/* First row: Name (1/2), Gender (1/4), Birthdate (1/4) */}
                           <div className="grid grid-cols-12 gap-4">
                             <div className="col-span-12 md:col-span-6">
                                <Label htmlFor="name" className="font-arabic">الاسم الكامل *</Label>
                                 <Input
                                   id="name"
                                   value={formData.name}
                                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                                   placeholder="أدخل الاسم الكامل"
                                   className="font-arabic"
                                   required
                                 />
                             </div>
                             
                             <div className="col-span-6 md:col-span-3">
                                <Label htmlFor="gender" className="font-arabic">الجنس *</Label>
                                <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                                  <SelectTrigger className="font-arabic">
                                    <SelectValue placeholder="اختر الجنس" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male" className="font-arabic">ذكر</SelectItem>
                                    <SelectItem value="female" className="font-arabic">أنثى</SelectItem>
                                  </SelectContent>
                                </Select>
                             </div>
                              
                             <div className="col-span-6 md:col-span-3">
                                <Label className="font-arabic">تاريخ الميلاد</Label>
                                <EnhancedDatePicker
                                  value={formData.birthDate}
                                  onChange={(date) => setFormData({...formData, birthDate: date})}
                                  placeholder="اختر تاريخ الميلاد"
                                  className="font-arabic"
                                />
                             </div>
                           </div>
                            
                           {/* Second row: Family relation (1/2), Alive status (1/4), Death date (1/4) */}
                           <div className="grid grid-cols-12 gap-4">
                             <div className="col-span-12 md:col-span-6">
                               <Label htmlFor="parentRelation" className="font-arabic">العلاقة العائلية (الوالدين) *</Label>
                                <Select 
                                  value={formData.selectedParent || ""} 
                                  onValueChange={(value) => setFormData({...formData, selectedParent: value === "none" ? null : value})}
                                  disabled={loading || !familyMarriages || !familyMembers}
                                >
                                   <SelectTrigger className="font-arabic">
                                     <SelectValue placeholder={loading ? "جاري التحميل..." : "اختر الوالدين"} />
                                   </SelectTrigger>
                                  <SelectContent>
                                    {loading || !familyMarriages || !familyMembers ? (
                                      <SelectItem value="loading" disabled>جاري تحميل البيانات...</SelectItem>
                                    ) : familyMarriages.length > 0 ? (
                                      familyMarriages
                                        .filter(marriage => marriage && marriage.id && marriage.husband && marriage.wife)
                                        .map((marriage) => {
                                          // Get full member details for proper naming
                                          const husbandMember = familyMembers.find(member => member?.id === marriage.husband?.id);
                                          const wifeMember = familyMembers.find(member => member?.id === marriage.wife?.id);
                                          
                                          let displayName = '';
                                          
                                          // Helper function to get father's name
                                          const getFatherName = (member: any) => {
                                            const father = familyMembers.find(m => m?.id === member?.fatherId);
                                            return father?.name || '';
                                          };
                                          
                                          // Helper function to get grandfather's name
                                          const getGrandfatherName = (member: any) => {
                                            const father = familyMembers.find(m => m?.id === member?.fatherId);
                                            if (father) {
                                              const grandfather = familyMembers.find(m => m?.id === father?.fatherId);
                                              return grandfather?.name || '';
                                            }
                                            return '';
                                          };
                                          
                                          // Helper function to build full genealogical name
                                          const getFullGenealogicalName = (member: any, isFounder: boolean) => {
                                            if (isFounder) {
                                              return `${member.name} ${familyData?.name || ''}`;
                                            }
                                            
                                            const fatherName = getFatherName(member);
                                            const grandfatherName = getGrandfatherName(member);
                                            
                                            if (member.gender === 'male') {
                                              // Male: name + ابن + father + ابن + grandfather (if exists)
                                              let result = member.name;
                                              if (fatherName) {
                                                result += ` ابن ${fatherName}`;
                                                if (grandfatherName) {
                                                  result += ` ابن ${grandfatherName}`;
                                                }
                                              }
                                              return result;
                                            } else {
                                              // Female: name + بنت + father + ابن + grandfather (if exists)
                                              let result = member.name;
                                              if (fatherName) {
                                                result += ` بنت ${fatherName}`;
                                                if (grandfatherName) {
                                                  result += ` ابن ${grandfatherName}`;
                                                }
                                              }
                                              return result;
                                            }
                                          };
                                          
                                          if (husbandMember && wifeMember) {
                                            // Both are family members
                                            const husbandFullName = getFullGenealogicalName(husbandMember, husbandMember.isFounder);
                                            const wifeFullName = getFullGenealogicalName(wifeMember, wifeMember.isFounder);
                                            displayName = `${husbandFullName} ♥ ${wifeFullName}`;
                                          } else if (husbandMember) {
                                            // Only husband is family member
                                            const husbandFullName = getFullGenealogicalName(husbandMember, husbandMember.isFounder);
                                            displayName = `${husbandFullName} ♥ ${marriage.wife?.name || 'بدون اسم'}`;
                                          } else if (wifeMember) {
                                            // Only wife is family member
                                            const wifeFullName = getFullGenealogicalName(wifeMember, wifeMember.isFounder);
                                            displayName = `${wifeFullName} ♥ ${marriage.husband?.name || 'بدون اسم'}`;
                                          } else {
                                            // Neither is family member (fallback)
                                            displayName = `${marriage.husband?.name || 'بدون اسم'} ♥ ${marriage.wife?.name || 'بدون اسم'}`;
                                          }
                                          
                                          return (
                                            <SelectItem key={marriage.id} value={marriage.id}>
                                              <div className="flex items-center">
                                                <Heart className="h-3 w-3 text-red-500 mr-2" />
                                                <span className="truncate">{displayName}</span>
                                              </div>
                                            </SelectItem>
                                          );
                                        })
                                    ) : (
                                      <SelectItem value="no-data" disabled>لا توجد زيجات مسجلة في هذه العائلة</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                             </div>
                             
                             <div className="col-span-6 md:col-span-3">
                               <Label htmlFor="aliveStatus">الحالة الحيوية</Label>
                               <Select 
                                 value={formData.isAlive ? "alive" : "deceased"} 
                                 onValueChange={(value) => setFormData({...formData, isAlive: value === "alive"})}
                               >
                                 <SelectTrigger>
                                   <SelectValue placeholder="اختر الحالة الحيوية" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="alive">على قيد الحياة</SelectItem>
                                   <SelectItem value="deceased">متوفى</SelectItem>
                                 </SelectContent>
                               </Select>
                             </div>

                             <div className="col-span-6 md:col-span-3">
                               <Label>تاريخ الوفاة</Label>
                               <EnhancedDatePicker
                                 value={formData.deathDate}
                                 onChange={(date) => setFormData({...formData, deathDate: date})}
                                 placeholder="اختر تاريخ الوفاة"
                                 disabled={formData.isAlive}
                               />
                             </div>
                           </div>

                           <div>
                             <Label htmlFor="bio">السيرة الذاتية</Label>
                             <Textarea
                               id="bio"
                               value={formData.bio}
                               onChange={(e) => setFormData({...formData, bio: e.target.value})}
                               placeholder="أدخل معلومات إضافية عن العضو"
                               rows={3}
                             />
                           </div>

                            <ImageUploadSection
                              isImageUploadEnabled={isImageUploadEnabled}
                              uploadLoading={uploadLoading}
                              croppedImage={croppedImage}
                              selectedImage={selectedImage}
                              showCropDialog={showCropDialog}
                              crop={crop}
                              zoom={zoom}
                              fileInputRef={fileInputRef}
                              handleEditImage={handleEditImage}
                              handleDeleteImage={handleDeleteImage}
                              handleImageSelect={handleImageSelect}
                              setShowCropDialog={setShowCropDialog}
                              setCrop={setCrop}
                              setZoom={setZoom}
                              onCropComplete={onCropComplete}
                              handleCropSave={handleCropSave}
                            />
                         </div>
                      )}

                       {currentStep === 2 && (
                         <div className="space-y-4">
                           <h3 className="text-lg font-semibold">
                             {formData.gender === "male" ? "معلومات الزوجة/الزوجات" : "معلومات الزوج"}
                           </h3>
                           <p className="text-sm text-muted-foreground">
                             {formData.gender === "male" 
                               ? "أضف معلومات الزوجة أو الزوجات إذا كان متزوجاً"
                               : "أضف معلومات الزوج إذا كانت متزوجة"
                             }
                           </p>
                           
                            {formData.gender === "male" ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Panel - Wives List */}
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                      <Heart className="w-3 h-3 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300 font-arabic">قائمة الزوجات ({wives.length})</h4>
                                  </div>
                                  
                                  <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {wives.length === 0 ? (
                                      <div className="text-center py-8 text-muted-foreground">
                                        <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-arabic">لم يتم إضافة زوجات بعد</p>
                                      </div>
                                    ) : (
                                      wives.map((wife, index) => (
                                        <div key={index} className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-4 border-2 border-dashed border-pink-400/60 dark:border-pink-500/60">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {index + 1}
                                              </div>
                                              <div>
                                                <h5 className="font-medium text-gray-900 dark:text-gray-100 font-arabic">
                                                  {wife.name || `الزوجة ${index + 1}`}
                                                </h5>
                                                <p className="text-xs text-muted-foreground font-arabic">
                                                  {wife.isFamilyMember ? 'من نفس العائلة' : 'خارج العائلة'}
                                                </p>
                                              </div>
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                const newWives = wives.filter((_, i) => i !== index);
                                                setWives(newWives);
                                              }}
                                              className="gap-1 border-red-200/50 dark:border-red-700/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-300 h-8 px-2"
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Right Panel - Add Wife Form */}
                                <div className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-900/30 rounded-2xl p-6 border border-pink-200/50 dark:border-pink-800/30 shadow-lg">
                                  <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                      <UserPlus className="w-4 h-4 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300 font-arabic">إضافة زوجة جديدة</h4>
                                  </div>

                                  {/* Wife Form Content */}
                                  <div className="space-y-6">
                                    {wives.map((wife, index) => (
                                      <div key={index} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-pink-200/50 dark:border-pink-800/30 rounded-xl p-6 shadow-md mb-4">
                                        <div className="flex items-center justify-between mb-4">
                                          <h5 className="font-bold text-lg flex items-center gap-2 text-gray-700 dark:text-gray-300 font-arabic">
                                            <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg"></div>
                                            الزوجة {index + 1}
                                          </h5>
                                        </div>
                                        
                                        <div className="space-y-6">
                                          {/* Family Member Check */}
                                          <div>
                                            <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg"></div>
                                              هل الزوجة من نفس العائلة؟
                                            </Label>
                                            <div className="flex gap-3">
                                              <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                  type="radio" 
                                                  name={`wifeIsFamilyMember${index}`} 
                                                  checked={wife.isFamilyMember === true} 
                                                  onChange={() => {
                                                    const newWives = [...wives];
                                                    newWives[index] = {
                                                      ...wife,
                                                      isFamilyMember: true,
                                                      existingFamilyMemberId: ''
                                                    };
                                                    setWives(newWives);
                                                  }}
                                                  className="w-4 h-4 text-green-600"
                                                />
                                                <span className="text-sm text-green-600 font-arabic">نعم</span>
                                              </label>
                                              <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                  type="radio" 
                                                  name={`wifeIsFamilyMember${index}`} 
                                                  checked={wife.isFamilyMember === false} 
                                                  onChange={() => {
                                                    const newWives = [...wives];
                                                    newWives[index] = {
                                                      ...wife,
                                                      isFamilyMember: false,
                                                      existingFamilyMemberId: ''
                                                    };
                                                    setWives(newWives);
                                                  }}
                                                  className="w-4 h-4 text-red-600"
                                                />
                                                <span className="text-sm text-red-600 font-arabic">لا</span>
                                              </label>
                                            </div>
                                          </div>

                                          {/* Select Existing Family Member */}
                                          {wife.isFamilyMember && (
                                            <div className="space-y-3">
                                              <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 font-arabic">
                                                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg"></div>
                                                اختر الزوجة من قائمة أفراد العائلة
                                              </Label>
                                              <Popover open={wivesCommandOpen[index]} onOpenChange={(open) => {
                                                const newState = {...wivesCommandOpen};
                                                newState[index] = open;
                                                setWivesCommandOpen(newState);
                                              }}>
                                                <PopoverTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={wivesCommandOpen[index]} 
                                                    className="w-full justify-between h-11 text-sm border-2 border-blue-200/50 dark:border-blue-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl font-arabic"
                                                  >
                                                    {wife.existingFamilyMemberId ? 
                                                      familyMembers.find(m => m.id === wife.existingFamilyMemberId)?.name || "اختر فرد من العائلة..."
                                                      : "اختر فرد من العائلة..."
                                                    }
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0 bg-card/95 backdrop-blur-xl border-border/50">
                                                  <Command>
                                                    <CommandInput placeholder="ابحث عن فرد..." className="h-9 font-arabic" />
                                                    <CommandList>
                                                      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground font-arabic">
                                                        لم يتم العثور على نتائج.
                                                      </CommandEmpty>
                                                      <CommandGroup>
                                                        {familyMembers
                                                          .filter(member => member.gender === "female")
                                                          .map((member) => (
                                                            <CommandItem
                                                              key={member.id}
                                                              value={member.name}
                                                              onSelect={() => {
                                                                const newWives = [...wives];
                                                                newWives[index] = {
                                                                  ...wife,
                                                                  existingFamilyMemberId: member.id,
                                                                  name: member.name
                                                                };
                                                                setWives(newWives);
                                                                const newState = {...wivesCommandOpen};
                                                                newState[index] = false;
                                                                setWivesCommandOpen(newState);
                                                              }}
                                                              className="font-arabic"
                                                            >
                                                              <Check
                                                                className={cn(
                                                                  "mr-2 h-4 w-4",
                                                                  wife.existingFamilyMemberId === member.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                              />
                                                              {member.name}
                                                            </CommandItem>
                                                          ))}
                                                      </CommandGroup>
                                                    </CommandList>
                                                  </Command>
                                                </PopoverContent>
                                              </Popover>
                                            </div>
                                          )}

                                          {/* Name Input - only if not family member or family member not selected */}
                                          {(!wife.isFamilyMember || (wife.isFamilyMember && !wife.existingFamilyMemberId)) && (
                                            <div className="group">
                                              <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                                <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                                اسم الزوجة *
                                              </Label>
                                              <div className="relative">
                                                <Input
                                                  value={wife.name}
                                                  onChange={(e) => {
                                                    const newWives = [...wives];
                                                    newWives[index] = { ...wife, name: e.target.value };
                                                    setWives(newWives);
                                                  }}
                                                  placeholder="أدخل اسم الزوجة"
                                                  className="h-11 text-sm border-2 border-pink-200/50 dark:border-pink-700/50 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                                                  disabled={wife.isFamilyMember && !!wife.existingFamilyMemberId}
                                                />
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                                                  <User className="h-3 w-3 text-white" />
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Birth Date - only show if not family member */}
                                          {!wife.isFamilyMember && (
                                            <div className="group">
                                              <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                                <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                                تاريخ الميلاد
                                              </Label>
                                              <div className="relative">
                                              <EnhancedDatePicker
                                                value={wife.birthDate}
                                                onChange={(date) => {
                                                    const newWives = [...wives];
                                                    newWives[index] = { ...wife, birthDate: date };
                                                    setWives(newWives);
                                                  }}
                                                  placeholder="اختر التاريخ"
                                                  className="h-11 text-sm border-2 border-cyan-200/50 dark:border-cyan-700/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                                                  disabled={wife.isFamilyMember && !!wife.existingFamilyMemberId}
                                                />
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                                                  <CalendarIcon className="h-3 w-3 text-white" />
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Marital Status - always show */}
                                          <div className="group">
                                            <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                              الحالة الاجتماعية
                                            </Label>
                                            <div className="relative">
                                              <Select
                                                value={wife.maritalStatus || "married"}
                                                onValueChange={(value) => {
                                                  const newWives = [...wives];
                                                  newWives[index] = { ...wife, maritalStatus: value };
                                                  setWives(newWives);
                                                }}
                                              >
                                                <SelectTrigger className="h-11 text-sm border-2 border-purple-200/50 dark:border-purple-700/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic">
                                                  <SelectValue placeholder="اختر الحالة الاجتماعية" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                                  <SelectItem value="married" className="font-arabic text-sm">متزوجة</SelectItem>
                                                  <SelectItem value="divorced" className="font-arabic text-sm">مطلقة</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                                                <Heart className="h-3 w-3 text-white" />
                                              </div>
                                            </div>
                                          </div>

                                          {/* Life Status and Death Date - only show if not family member */}
                                          {!wife.isFamilyMember && (
                                            <div className="space-y-6">
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Life Status */}
                                                <div className="group">
                                                  <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                                    <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                                    الحالة الحيوية
                                                  </Label>
                                                  <div className="relative">
                                                    <Select
                                                      value={wife.isAlive ? "alive" : "deceased"}
                                                      onValueChange={(value) => {
                                                        const newWives = [...wives];
                                                        newWives[index] = { 
                                                          ...wife, 
                                                          isAlive: value === "alive",
                                                          deathDate: value === "alive" ? null : wife.deathDate
                                                        };
                                                        setWives(newWives);
                                                      }}
                                                    >
                                                      <SelectTrigger className="h-11 text-sm border-2 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic">
                                                        <SelectValue placeholder="اختر الحالة الحيوية" />
                                                      </SelectTrigger>
                                                      <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                                        <SelectItem value="alive" className="font-arabic text-sm">على قيد الحياة</SelectItem>
                                                        <SelectItem value="deceased" className="font-arabic text-sm">متوفاة</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                                                      <Heart className="h-3 w-3 text-white" />
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Death Date - only show if deceased */}
                                                {!wife.isAlive && (
                                                  <div className="group">
                                                    <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                                      <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                                      تاريخ الوفاة
                                                    </Label>
                                                    <div className="relative">
                                                      <EnhancedDatePicker
                                                        value={wife.deathDate}
                                                        onChange={(date) => {
                                                          const newWives = [...wives];
                                                          newWives[index] = { ...wife, deathDate: date };
                                                          setWives(newWives);
                                                        }}
                                                        placeholder="اختر تاريخ الوفاة"
                                                        className="h-11 text-sm border-2 border-red-200/50 dark:border-red-700/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                                                      />
                                                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                                                        <CalendarIcon className="h-3 w-3 text-white" />
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {/* Image Upload - only show if not family member and feature enabled */}
                                          {!wife.isFamilyMember && (
                                            <div className="space-y-3">
                                              {wife.croppedImage ? (
                                                <div className="text-center space-y-3">
                                                  <div className="relative inline-block">
                                                    <img 
                                                      src={wife.croppedImage} 
                                                      alt="صورة الزوجة" 
                                                      className="w-20 h-20 object-cover rounded-full mx-auto border-4 border-pink-200/50 shadow-lg"
                                                    />
                                                  </div>
                                                  <div className="flex justify-center gap-2">
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => {
                                                        // Handle image editing - remove for now
                                                        console.log('Edit wife image:', index);
                                                      }}
                                                      className="h-8 px-3 border-2 border-pink-200/50 dark:border-pink-700/50 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 font-arabic"
                                                    >
                                                      <Edit2 className="h-3 w-3 mr-1" />
                                                      تعديل
                                                    </Button>
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="destructive"
                                                      onClick={() => {
                                                        const newWives = [...wives];
                                                        newWives[index] = { ...wife, croppedImage: null };
                                                        setWives(newWives);
                                                      }}
                                                      className="h-8 px-3 font-arabic"
                                                    >
                                                      <Trash2 className="h-3 w-3 mr-1" />
                                                      حذف
                                                    </Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="text-center">
                                                  <div className="border-2 border-dashed border-pink-300 dark:border-pink-700 rounded-xl p-6 hover:border-pink-400 dark:hover:border-pink-600 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                    <Upload className="w-8 h-8 mx-auto text-pink-500 mb-2" />
                                                    <p className="text-sm text-pink-600 dark:text-pink-400 font-arabic">انقر لرفع صورة الزوجة</p>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setWives([...wives, {
                                          id: '',
                                          name: '',
                                          isAlive: true,
                                          birthDate: null,
                                          deathDate: null,
                                          maritalStatus: 'married',
                                          isFamilyMember: false,
                                          existingFamilyMemberId: '',
                                          croppedImage: null
                                        }]);
                                      }}
                                      className="w-full h-12 border-2 border-dashed border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all duration-300 rounded-xl"
                                    >
                                      <Plus className="h-5 w-5 mr-2" />
                                      إضافة زوجة
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Panel - Husband Display */}
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center">
                                      <User className="w-3 h-3 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 font-arabic">معلومات الزوج</h4>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    {!husband ? (
                                      <div className="text-center py-8 text-muted-foreground">
                                        <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-arabic">لم يتم إضافة زوج بعد</p>
                                      </div>
                                    ) : (
                                      <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-4 border-2 border-dashed border-blue-400/60 dark:border-blue-500/60">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                              <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <h5 className="font-medium text-gray-900 dark:text-gray-100 font-arabic">
                                                {husband.name || 'الزوج'}
                                              </h5>
                                              <p className="text-xs text-muted-foreground font-arabic">
                                                {husband.isFamilyMember ? 'من نفس العائلة' : 'خارج العائلة'}
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setHusband(null)}
                                            className="gap-1 border-red-200/50 dark:border-red-700/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-300 h-8 px-2"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right Panel - Add Husband Form */}
                                <div className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-950/30 dark:to-sky-900/30 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/30 shadow-lg">
                                  <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center">
                                      <UserPlus className="w-4 h-4 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 font-arabic">{husband ? 'تعديل الزوج' : 'إضافة زوج'}</h4>
                                  </div>

                                  {husband ? (
                                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-6 shadow-md">
                                      <div className="space-y-6">
                                        {/* Family Member Check */}
                                        <div>
                                          <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg"></div>
                                            هل الزوج من نفس العائلة؟
                                          </Label>
                                          <div className="flex gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input 
                                                type="radio" 
                                                name="husbandIsFamilyMember" 
                                                checked={husband.isFamilyMember === true} 
                                                onChange={() => setHusband({
                                                  ...husband,
                                                  isFamilyMember: true,
                                                  existingFamilyMemberId: ''
                                                })}
                                                className="w-4 h-4 text-green-600"
                                              />
                                              <span className="text-sm text-green-600 font-arabic">نعم</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input 
                                                type="radio" 
                                                name="husbandIsFamilyMember" 
                                                checked={husband.isFamilyMember === false} 
                                                onChange={() => setHusband({
                                                  ...husband,
                                                  isFamilyMember: false,
                                                  existingFamilyMemberId: ''
                                                })}
                                                className="w-4 h-4 text-red-600"
                                              />
                                              <span className="text-sm text-red-600 font-arabic">لا</span>
                                            </label>
                                          </div>
                                        </div>

                                        {/* Select Existing Family Member */}
                                        {husband.isFamilyMember && (
                                          <div className="space-y-3">
                                            <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 font-arabic">
                                              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg"></div>
                                              اختر الزوج من قائمة أفراد العائلة
                                            </Label>
                                            <Popover open={husbandCommandOpen} onOpenChange={setHusbandCommandOpen}>
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  role="combobox"
                                                  aria-expanded={husbandCommandOpen} 
                                                  className="w-full justify-between h-11 text-sm border-2 border-blue-200/50 dark:border-blue-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl font-arabic"
                                                >
                                                  {husband.existingFamilyMemberId ? 
                                                    familyMembers.find(m => m.id === husband.existingFamilyMemberId)?.name || "اختر فرد من العائلة..."
                                                    : "اختر فرد من العائلة..."
                                                  }
                                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-full p-0 bg-card/95 backdrop-blur-xl border-border/50">
                                                <Command>
                                                  <CommandInput placeholder="ابحث عن فرد..." className="h-9 font-arabic" />
                                                  <CommandList>
                                                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground font-arabic">
                                                      لم يتم العثور على نتائج.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                      {familyMembers
                                                        .filter(member => member.gender === "male")
                                                        .map((member) => (
                                                          <CommandItem
                                                            key={member.id}
                                                            value={member.name}
                                                            onSelect={() => {
                                                              setHusband({
                                                                ...husband,
                                                                existingFamilyMemberId: member.id,
                                                                name: member.name
                                                              });
                                                              setHusbandCommandOpen(false);
                                                            }}
                                                            className="font-arabic"
                                                          >
                                                            <Check
                                                              className={cn(
                                                                "mr-2 h-4 w-4",
                                                                husband.existingFamilyMemberId === member.id ? "opacity-100" : "opacity-0"
                                                              )}
                                                            />
                                                            {member.name}
                                                          </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                  </CommandList>
                                                </Command>
                                              </PopoverContent>
                                            </Popover>
                                          </div>
                                        )}

                                        {/* Name Input - only if not family member or family member not selected */}
                                        {(!husband.isFamilyMember || (husband.isFamilyMember && !husband.existingFamilyMemberId)) && (
                                          <div className="group">
                                            <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                              اسم الزوج *
                                            </Label>
                                            <div className="relative">
                                              <Input
                                                value={husband.name}
                                                onChange={(e) => setHusband({...husband, name: e.target.value})}
                                                placeholder="أدخل اسم الزوج"
                                                className="h-11 text-sm border-2 border-blue-200/50 dark:border-blue-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                                                disabled={husband.isFamilyMember && !!husband.existingFamilyMemberId}
                                              />
                                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-blue-500 to-sky-500 rounded-lg flex items-center justify-center">
                                                <User className="h-3 w-3 text-white" />
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Birth Date - only show if not family member */}
                                        {!husband.isFamilyMember && (
                                          <div className="group">
                                            <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                              <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                              تاريخ الميلاد
                                            </Label>
                                            <div className="relative">
                                              <EnhancedDatePicker
                                                value={husband.birthDate}
                                                onChange={(date) => setHusband({...husband, birthDate: date})}
                                                placeholder="اختر التاريخ"
                                                className="h-11 text-sm border-2 border-cyan-200/50 dark:border-cyan-700/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                                                disabled={husband.isFamilyMember && !!husband.existingFamilyMemberId}
                                              />
                                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                                                <CalendarIcon className="h-3 w-3 text-white" />
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Marital Status - always show */}
                                        <div className="group">
                                          <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                            الحالة الاجتماعية
                                          </Label>
                                          <div className="relative">
                                            <Select
                                              value={husband.maritalStatus || "married"}
                                              onValueChange={(value) => setHusband({...husband, maritalStatus: value})}
                                            >
                                              <SelectTrigger className="h-11 text-sm border-2 border-purple-200/50 dark:border-purple-700/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic">
                                                <SelectValue placeholder="اختر الحالة الاجتماعية" />
                                              </SelectTrigger>
                                              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                                <SelectItem value="married" className="font-arabic text-sm">متزوج</SelectItem>
                                                <SelectItem value="divorced" className="font-arabic text-sm">مطلق</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                                              <Heart className="h-3 w-3 text-white" />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Life Status and Death Date - only show if not family member */}
                                        {!husband.isFamilyMember && (
                                          <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              {/* Life Status */}
                                              <div className="group">
                                                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                                  <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                                  الحالة الحيوية
                                                </Label>
                                                <div className="relative">
                                                  <Select
                                                    value={husband.isAlive ? "alive" : "deceased"}
                                                    onValueChange={(value) => setHusband({
                                                      ...husband, 
                                                      isAlive: value === "alive",
                                                      deathDate: value === "alive" ? null : husband.deathDate
                                                    })}
                                                  >
                                                    <SelectTrigger className="h-11 text-sm border-2 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic">
                                                      <SelectValue placeholder="اختر الحالة الحيوية" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                                      <SelectItem value="alive" className="font-arabic text-sm">على قيد الحياة</SelectItem>
                                                      <SelectItem value="deceased" className="font-arabic text-sm">متوفى</SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                                                    <Heart className="h-3 w-3 text-white" />
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Death Date - only show if deceased */}
                                              {!husband.isAlive && (
                                                <div className="group">
                                                  <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                                    <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                                    تاريخ الوفاة
                                                  </Label>
                                                  <div className="relative">
                                                    <EnhancedDatePicker
                                                      value={husband.deathDate}
                                                      onChange={(date) => setHusband({...husband, deathDate: date})}
                                                      placeholder="اختر تاريخ الوفاة"
                                                      className="h-11 text-sm border-2 border-red-200/50 dark:border-red-700/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                                                    />
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                                                      <CalendarIcon className="h-3 w-3 text-white" />
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setHusband({
                                        id: '',
                                        name: '',
                                        isAlive: true,
                                        birthDate: null,
                                        deathDate: null,
                                        maritalStatus: 'married',
                                        isFamilyMember: false,
                                        existingFamilyMemberId: '',
                                        croppedImage: null
                                      })}
                                      className="w-full h-12 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-300 rounded-xl"
                                    >
                                      <Plus className="h-5 w-5 mr-2" />
                                      إضافة زوج
                                    </Button>
                                  )}
                                </div>
                              </div>
                             )}
                          </div>
                       )}

                      {/* Navigation Buttons */}
                      <div className="flex justify-between pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={currentStep === 1 ? handleCancelForm : prevStep}
                          className="flex items-center gap-2 font-arabic"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          {currentStep === 1 ? "إلغاء الإضافة" : "السابق"}
                        </Button>
                        
                        {currentStep < 2 ? (
                          <Button
                            type="button"
                            onClick={nextStep}
                            className="flex items-center gap-2"
                          >
                            التالي
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => handleFormSubmit(formData)}
                            disabled={isSaving}
                            className="flex items-center gap-2"
                          >
                            {isSaving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                جاري الحفظ...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                حفظ
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Member List - Left Side on Desktop */}
            <div className={cn(
              "space-y-4",
              isMobile ? "order-1" : "col-span-4 order-1"
            )}>
              {isMobile ? (
                <Drawer open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      <Menu className="h-4 w-4" />
                      عرض قائمة الأعضاء ({familyMembers.length})
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="h-[80vh]">
                    <div className="p-4">
                      <MemberList 
                        members={filteredMembers}
                        onEditMember={handleEditMember}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        selectedFilter={selectedFilter}
                        onFilterChange={setSelectedFilter}
                        getAdditionalInfo={getAdditionalInfo}
                        getGenderColor={getGenderColor}
                        familyMembers={familyMembers}
                        marriages={familyMarriages}
                      />
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-lg"></div>
                  <CardHeader className="pb-4 relative">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        أعضاء العائلة ({familyMembers.length})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <MemberList 
                      members={filteredMembers}
                      onEditMember={handleEditMember}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      selectedFilter={selectedFilter}
                      onFilterChange={setSelectedFilter}
                      getAdditionalInfo={getAdditionalInfo}
                      getGenderColor={getGenderColor}
                      familyMembers={familyMembers}
                      marriages={familyMarriages}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keep existing delete modals */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteWarningMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // TODO: Implement delete logic
                setShowDeleteModal(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GlobalFooter />
    </div>
  );
};

// Member List Component
const MemberList = ({ 
  members, 
  onEditMember, 
  searchTerm, 
  onSearchChange, 
  selectedFilter, 
  onFilterChange,
  getAdditionalInfo,
  getGenderColor,
  familyMembers,
  marriages 
}: any) => {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث عن عضو..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter */}
      <Select value={selectedFilter} onValueChange={onFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="تصفية حسب..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع الأعضاء</SelectItem>
          <SelectItem value="alive">الأحياء</SelectItem>
          <SelectItem value="deceased">المتوفين</SelectItem>
          <SelectItem value="male">الذكور</SelectItem>
          <SelectItem value="female">الإناث</SelectItem>
          <SelectItem value="founders">المؤسسون</SelectItem>
        </SelectContent>
      </Select>

      {/* Member List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hidden">
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد أعضاء</p>
          </div>
        ) : (
          members.map((member: any) => (
            <Card 
              key={member.id} 
              className="relative cursor-pointer bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 hover:bg-white/95 dark:hover:bg-gray-800/95 transition-all duration-300 hover:shadow-lg rounded-3xl overflow-hidden"
              onClick={() => onEditMember(member)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 min-h-[80px]">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={member.image} />
                      <AvatarFallback className={getGenderColor(member.gender)}>
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Name */}
                      <div className="flex items-center gap-2">
                        {member.gender === 'male' ? (
                          <User className="h-3 w-3 text-blue-500" />
                        ) : (
                          <UserIcon className="h-3 w-3 text-pink-500" />
                        )}
                        <h3 className="font-semibold text-base font-arabic leading-tight">
                          {member.name}
                        </h3>
                        {(() => {
                          // Only show ابن/ابنة for blood family members (not founders, only descendants with fathers in the family)
                          const memberHasFamilyFather = member.fatherId && familyMembers?.find(m => m?.id === member.fatherId);
                          const isDescendant = !member.isFounder && memberHasFamilyFather;
                          
                          if (isDescendant) {
                            return (
                              <span className="text-xs text-muted-foreground font-normal">
                                {member.gender === 'female' ? 'ابنة' : 'ابن'}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      
                      {/* Father + Grandfather names */}
                      {(() => {
                        const father = familyMembers?.find(m => m?.id === member.fatherId);
                        const grandfather = father ? familyMembers?.find(m => m?.id === father.fatherId) : null;
                        
                        if (father && grandfather) {
                          return (
                            <p className="text-sm text-muted-foreground truncate font-arabic">
                              {father.name} ابن {grandfather.name}
                            </p>
                          );
                        } else if (father) {
                          return (
                            <p className="text-sm text-muted-foreground truncate font-arabic">
                              {father.name}
                            </p>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Spouse information - show founder text for founders, spouse info for non-family members */}
                      {(() => {
                        // Show founder text for founders
                        if (member.isFounder) {
                          return (
                            <p className="text-xs text-blue-600 dark:text-blue-400 truncate font-arabic">
                              الجد الأكبر للعائلة
                            </p>
                          );
                        }

                        // Find marriage where this member is husband or wife
                        const marriage = marriages?.find(m => 
                          (m.husband?.id === member.id || m.wife?.id === member.id) ||
                          (m.husband_id === member.id || m.wife_id === member.id)
                        );
                        
                        if (marriage) {
                          // Determine if this member is the husband or wife
                          const isHusband = (marriage.husband?.id === member.id) || (marriage.husband_id === member.id);
                          
                          // Get spouse data - try both nested object and direct ID approaches
                          let spouse;
                          let spouseId;
                          
                          if (isHusband) {
                            spouse = marriage.wife;
                            spouseId = marriage.wife_id;
                          } else {
                            spouse = marriage.husband;
                            spouseId = marriage.husband_id;
                          }
                          
                          // If spouse is not in nested object, find by ID
                          if (!spouse && spouseId) {
                            spouse = familyMembers?.find(m => m?.id === spouseId);
                          }
                          
                          if (spouse) {
                            // Check if current member is a non-family member (married into the family)
                            // A non-family member would not have father/grandfather in the family tree
                            const memberHasFamilyFather = member.fatherId && familyMembers?.find(m => m?.id === member.fatherId);
                            
                            // Only show spouse info for non-family members (those without family fathers)
                            if (!memberHasFamilyFather) {
                              // Get spouse's father and grandfather from familyMembers
                              const spouseFullData = familyMembers?.find(m => m?.id === spouse.id);
                              const spouseFather = familyMembers?.find(m => m?.id === (spouseFullData?.fatherId || spouse.fatherId));
                              const spouseGrandfather = spouseFather ? familyMembers?.find(m => m?.id === spouseFather.fatherId) : null;
                              
                              // Build the lineage string
                              let spouseInfo = spouse.name || spouse.full_name;
                              
                              if (spouseFather) {
                                // Use ابن for male, ابنة for female
                                const spouseGender = spouseFullData?.gender || spouse.gender;
                                const childOf = spouseGender === 'male' ? 'ابن' : 'ابنة';
                                spouseInfo += ` ${childOf} ${spouseFather.name}`;
                                
                                if (spouseGrandfather) {
                                  spouseInfo += ` ابن ${spouseGrandfather.name}`;
                                }
                              }
                              
                              // Use زوج for husband, زوجة for wife (from member's perspective)
                              const relationLabel = member.gender === 'male' ? 'زوج' : 'زوجة';
                              
                              return (
                                <p className="text-xs text-blue-600 dark:text-blue-400 truncate font-arabic">
                                  {relationLabel} {spouseInfo}
                                </p>
                              );
                            }
                          }
                        }
                        return null;
                      })()}
                      
                      {/* Birth date and other icons */}
                      <div className="flex items-center gap-2">
                        {member.birthDate && (
                          <span className="text-xs text-muted-foreground font-arabic">
                            {new Date(member.birthDate).toLocaleDateString('ar-SA')}
                          </span>
                        )}
                        {member.isFounder && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                        {!member.isAlive && (
                          <Skull className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit & Remove buttons at the most left */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditMember(member);
                      }}
                      className="h-7 w-7 p-0 bg-white/80 hover:bg-white border border-gray-200 shadow-sm"
                    >
                      <Edit2 className="h-3 w-3 text-gray-600" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add remove member function here
                        console.log('Remove member:', member.id);
                      }}
                      className="h-7 w-7 p-0 bg-red-50/80 hover:bg-red-100 border border-red-200 shadow-sm"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FamilyBuilderNew;
