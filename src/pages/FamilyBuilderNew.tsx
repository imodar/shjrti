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
import { Skeleton } from "@/components/ui/skeleton";
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
import FamilyBuilderNewSkeleton from "@/components/skeletons/FamilyBuilderNewSkeleton";

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
  const [memberListLoading, setMemberListLoading] = useState(false);

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
          husband_id,
          wife_id,
          is_active
        `)
        .eq('family_id', familyToUse.id)
        .eq('is_active', true);

      if (marriagesError) throw marriagesError;

      // Get detailed marriage data with member info
      let marriagesWithMembers = [];
      if (marriages) {
        marriagesWithMembers = await Promise.all(marriages.map(async (marriage) => {
          const [husbandResult, wifeResult] = await Promise.all([
            supabase.from('family_tree_members').select('id, name').eq('id', marriage.husband_id).single(),
            supabase.from('family_tree_members').select('id, name').eq('id', marriage.wife_id).single()
          ]);
          
          return {
            ...marriage,
            husband: husbandResult.data,
            wife: wifeResult.data
          };
        }));
      }

      if (marriagesError) throw marriagesError;

      if (marriagesWithMembers) {
        setFamilyMarriages(marriagesWithMembers);
        console.log('Fetched marriages with members:', marriagesWithMembers);
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
          husband_id,
          wife_id,
          is_active
        `)
        .eq('family_id', family.id)
        .eq('is_active', true);

      if (marriagesError) throw marriagesError;

      // Get detailed marriage data with member info
      let marriagesWithMembers = [];
      if (marriages) {
        marriagesWithMembers = await Promise.all(marriages.map(async (marriage) => {
          const [husbandResult, wifeResult] = await Promise.all([
            supabase.from('family_tree_members').select('id, name').eq('id', marriage.husband_id).single(),
            supabase.from('family_tree_members').select('id, name').eq('id', marriage.wife_id).single()
          ]);
          
          return {
            ...marriage,
            husband: husbandResult.data,
            wife: wifeResult.data
          };
        }));
      }

      if (marriagesWithMembers) {
        setFamilyMarriages(marriagesWithMembers);
      }

      console.log('Family data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing family data:', error);
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, [toast]);

  // Load spouses when data is updated and there's a member being edited
  useEffect(() => {
    if (editingMember && familyMarriages && familyMembers && familyMarriages.length > 0) {
      console.log('🔥 Reloading spouses for editing member:', editingMember);
      loadExistingSpouses(editingMember);
    }
  }, [familyMarriages, familyMembers, editingMember]);
  
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
    isSaved?: boolean;
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
    isSaved?: boolean;
  } | null>(null);

  // Command states for search
  const [husbandCommandOpen, setHusbandCommandOpen] = useState(false);
  const [wivesCommandOpen, setWivesCommandOpen] = useState<{ [key: number]: boolean }>({});
  const [wiveFamilyStatus, setWiveFamilyStatus] = useState<{ [key: number]: 'yes' | 'no' | null }>({});

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
  const [showSpouseEditWarning, setShowSpouseEditWarning] = useState(false);
  const [spousePartnerName, setSpousePartnerName] = useState("");

  // --- Spouse rules helpers & delete handlers ---
  const checkIfMemberIsSpouse = (member: any) => {
    // Spouse: no parents in this family and not a founder
    return !member?.fatherId && !member?.motherId && !member?.isFounder;
  };

  const getSpousePartnerName = (spouseMember: any) => {
    const marriage = familyMarriages.find((marriage: any) => 
      marriage.husband?.id === spouseMember.id || marriage.wife?.id === spouseMember.id
    );
    
    if (!marriage) return "";
    
    if (marriage.husband?.id === spouseMember.id) {
      return marriage.wife?.name || "";
    } else {
      return marriage.husband?.name || "";
    }
  };

  const handleSpouseEditAttempt = (spouseMember: any) => {
    const partnerName = getSpousePartnerName(spouseMember);
    setSpousePartnerName(partnerName);
    setShowSpouseEditWarning(true);
  };

  const getChildrenCount = (parentId: string) => {
    return familyMembers.filter(m => m.fatherId === parentId || m.motherId === parentId).length;
  };

  const getSpousesCount = (memberId: string) => {
    return familyMarriages.filter((marriage: any) => marriage.husband?.id === memberId || marriage.wife?.id === memberId).length;
  };

  const performCascadingDelete = async (member: any) => {
    const membersToDelete = new Set<string>();
    const marriagesToDelete = new Set<string>();

    membersToDelete.add(member.id);

    const memberMarriages = familyMarriages.filter((marriage: any) =>
      marriage.husband?.id === member.id || marriage.wife?.id === member.id
    );

    memberMarriages.forEach((marriage: any) => {
      marriagesToDelete.add(marriage.id);
      if (!checkIfMemberIsSpouse(member)) {
        const spouseId = marriage.husband?.id === member.id ? marriage.wife?.id : marriage.husband?.id;
        if (spouseId) {
          const spouse = familyMembers.find(m => m.id === spouseId);
          if (spouse && checkIfMemberIsSpouse(spouse)) {
            membersToDelete.add(spouseId);
          }
        }
      }
    });

    const findDescendants = (parentId: string) => {
      const children = familyMembers.filter(m => m.fatherId === parentId || m.motherId === parentId);
      children.forEach(child => {
        membersToDelete.add(child.id);
        const childMarriages = familyMarriages.filter((marriage: any) =>
          marriage.husband?.id === child.id || marriage.wife?.id === child.id
        );
        childMarriages.forEach((marriage: any) => {
          marriagesToDelete.add(marriage.id);
          const spouseId = marriage.husband?.id === child.id ? marriage.wife?.id : marriage.husband?.id;
          if (spouseId) {
            const spouse = familyMembers.find(m => m.id === spouseId);
            if (spouse && checkIfMemberIsSpouse(spouse)) {
              membersToDelete.add(spouseId);
            }
          }
        });
        findDescendants(child.id);
      });
    };

    findDescendants(member.id);

    if (marriagesToDelete.size > 0) {
      const { error: marriageError } = await supabase
        .from('marriages')
        .delete()
        .in('id', Array.from(marriagesToDelete));
      if (marriageError) throw marriageError;
    }

    if (membersToDelete.size > 0) {
      const { error: memberError } = await supabase
        .from('family_tree_members')
        .delete()
        .in('id', Array.from(membersToDelete));
      if (memberError) throw memberError;
    }

    setFamilyMembers(familyMembers.filter(m => !membersToDelete.has(m.id)));
    setFamilyMarriages(familyMarriages.filter((marriage: any) => !marriagesToDelete.has(marriage.id)));

    toast({
      title: t('family_builder.deleted', 'تم الحذف'),
      description: `${t('family_builder.deleted_desc', 'تم حذف')} ${membersToDelete.size} ${t('family_builder.member', 'عضو')} و ${marriagesToDelete.size} ${t('family_builder.marriage', 'زواج')} من شجرة العائلة`
    });
  };

  const handleDeleteMember = async (memberOrId: any) => {
    const id = typeof memberOrId === 'string' ? memberOrId : memberOrId?.id;
    const member = familyMembers.find(m => m.id === id);
    if (!member) {
      toast({ title: t('family_builder.error', 'خطأ'), description: t('family_builder.member_not_found', 'العضو غير موجود'), variant: 'destructive' });
      return;
    }

    if (member.isFounder) {
      toast({ title: t('family_builder.warning', 'تحذير'), description: t('family_builder.cannot_delete_founder', 'لا يمكن حذف مؤسس العائلة'), variant: 'destructive' });
      return;
    }

    setMemberToDelete(member);

    const isSpouse = checkIfMemberIsSpouse(member);
    if (isSpouse) {
      setDeleteModalType('spouse');
      setDeleteWarningMessage(
        t('family_builder.spouse_delete_warning_1', 'هذا الشخص زوج/زوجة لأحد أفراد العائلة.') + "\n" +
        t('family_builder.spouse_delete_warning_2', 'لحذف هذا الشخص، يجب تعديل بيانات الزوج/الزوجة وإزالة الزواج.')
      );
    } else {
      const childrenCount = getChildrenCount(member.id);
      const spousesCount = getSpousesCount(member.id);
      let warningMessage = `تحذير: حذف هذا العضو سيؤدي إلى حذف:\n`;
      if (spousesCount > 0) warningMessage += `- ${spousesCount} زوج/زوجة\n`;
      if (childrenCount > 0) warningMessage += `- ${childrenCount} طفل/أطفال وجميع أحفادهم\n`;
      warningMessage += `- جميع الزيجات المرتبطة بهذا الشخص`;
      setDeleteModalType('bloodMember');
      setDeleteWarningMessage(warningMessage);
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await performCascadingDelete(memberToDelete);
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({ title: t('family_builder.error', 'خطأ'), description: t('family_builder.delete_error', 'حدث خطأ أثناء حذف العضو'), variant: 'destructive' });
    }
  };

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
    
    // Load existing spouses
    loadExistingSpouses(member);
  };

  const loadExistingSpouses = (member: any) => {
    if (!familyMarriages || familyMarriages.length === 0) return;
    
    // Reset spouse states first
    setWives([]);
    setHusband(null);
    
    if (member.gender === "male") {
      // Load wives for male member
      const memberMarriages = familyMarriages.filter(marriage => 
        marriage.husband?.id === member.id
      );
      
      if (memberMarriages.length > 0) {
        const memberWives = memberMarriages.map(marriage => {
          const wifeMember = familyMembers.find(fm => fm.id === marriage.wife?.id);
          
          return {
            id: marriage.wife?.id || '',
            name: marriage.wife?.name || '',
            birthDate: wifeMember?.birth_date ? new Date(wifeMember.birth_date) : null,
            maritalStatus: 'married',
            isAlive: wifeMember?.is_alive ?? true,
            deathDate: wifeMember?.death_date ? new Date(wifeMember.death_date) : null,
            croppedImage: wifeMember?.image_url || null,
            isFamilyMember: !!wifeMember, // If found in family members, it's a family member
            existingFamilyMemberId: wifeMember ? wifeMember.id : '',
            isSaved: true // Mark existing wives as saved
          };
        }).filter(wife => wife.id); // Filter out wives without ID
        
        console.log('🔥 Loading wives for male member:', memberWives);
        setWives(memberWives);
      }
    } else if (member.gender === "female") {
      // Load husband for female member
      const memberMarriages = familyMarriages.filter(marriage => 
        marriage.wife?.id === member.id
      );
      
      if (memberMarriages.length > 0) {
        const marriage = memberMarriages[0]; // Take the first marriage
        const husbandMember = familyMembers.find(fm => fm.id === marriage.husband?.id);
        
        const husbandData = {
          id: marriage.husband?.id || '',
          name: marriage.husband?.name || '',
          birthDate: husbandMember?.birth_date ? new Date(husbandMember.birth_date) : null,
          maritalStatus: 'married',
          isAlive: husbandMember?.is_alive ?? true,
          deathDate: husbandMember?.death_date ? new Date(husbandMember.death_date) : null,
          croppedImage: husbandMember?.image_url || null,
          isFamilyMember: !!husbandMember, // If found in family members, it's a family member
          existingFamilyMemberId: husbandMember ? husbandMember.id : '',
          isSaved: true // Mark existing husband as saved
        };
        
        console.log('🔥 Loading husband for female member:', husbandData);
        setHusband(husbandData);
      }
    }
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
      
      // Determine family relationship info based on selectedParent
      let fatherId = null;
      let motherId = null;
      let relatedPersonId = null;
      
      if (submissionData.selectedParent && submissionData.selectedParent !== "none") {
        const selectedMarriage = familyMarriages.find(m => m.id === submissionData.selectedParent);
        console.log('🔥 Found selected marriage:', selectedMarriage);
        if (selectedMarriage) {
          fatherId = selectedMarriage.husband?.id || null;
          motherId = selectedMarriage.wife?.id || null;
          relatedPersonId = selectedMarriage.id;
          console.log('🔥 Setting parent IDs - Father:', fatherId, 'Mother:', motherId, 'RelatedPerson (Marriage):', relatedPersonId);
        }
      }

      let isEditMode = formMode === 'edit' && editingMember;
      let memberData;

      if (isEditMode) {
        // Update existing member
        const { data: updatedMember, error: updateError } = await supabase
          .from('family_tree_members')
          .update({
            name: submissionData.name,
            gender: submissionData.gender,
            birth_date: submissionData.birthDate?.toISOString().split('T')[0] || null,
            is_alive: submissionData.isAlive,
            death_date: !submissionData.isAlive && submissionData.deathDate ? submissionData.deathDate.toISOString().split('T')[0] : null,
            biography: submissionData.bio || null,
            image_url: submissionData.croppedImage || null,
            father_id: fatherId,
            mother_id: motherId,
            related_person_id: relatedPersonId,
            marital_status: finalData.maritalStatus || 'single',
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMember.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating family member:', updateError);
          throw updateError;
        }

        memberData = updatedMember;
        console.log('🔥 Successfully updated family member:', updatedMember);
      } else {
        // Insert new family member into database
        const { data: newMember, error: memberError } = await supabase
          .from('family_tree_members')
          .insert({
            name: submissionData.name,
            gender: submissionData.gender,
            birth_date: submissionData.birthDate?.toISOString().split('T')[0] || null,
            is_alive: submissionData.isAlive,
            death_date: !submissionData.isAlive && submissionData.deathDate ? submissionData.deathDate.toISOString().split('T')[0] : null,
            biography: submissionData.bio || null,
            image_url: submissionData.croppedImage || null,
            father_id: fatherId,
            mother_id: motherId,
            related_person_id: relatedPersonId,
            family_id: familyId,
            created_by: familyData?.creator_id,
            is_founder: submissionData.isFounder || false,
            marital_status: finalData.maritalStatus || 'single'
          })
          .select()
          .single();

        if (memberError) {
          console.error('Error adding family member:', memberError);
          throw memberError;
        }

        memberData = newMember;
        console.log('🔥 Successfully added family member:', newMember);
      }

      // Track successful marriages for toast message
      let marriageResults = {
        successful: 0,
        failed: 0,
        details: []
      };

      // Handle marriages if applicable
      if (finalData.maritalStatus === 'married') {
        // First, deactivate existing marriages for this member if editing
        if (isEditMode) {
          await supabase
            .from('marriages')
            .update({ is_active: false })
            .or(`husband_id.eq.${editingMember.id},wife_id.eq.${editingMember.id}`);
        }

        // Handle wives for male members - process all saved wives
        if (submissionData.gender === 'male' && wives.length > 0) {
          const savedWives = wives.filter(wife => wife.isSaved === true);
          for (const wife of savedWives) {
            try {
              let wifeId = wife.existingFamilyMemberId;
              
              // If wife is not from existing family members, create new family member first
              if (!wife.isFamilyMember || !wife.existingFamilyMemberId) {
                const { data: newWifeMember, error: wifeError } = await supabase
                  .from('family_tree_members')
                  .insert({
                    name: wife.name,
                    gender: 'female',
                    birth_date: wife.birthDate?.toISOString().split('T')[0] || null,
                    is_alive: wife.isAlive ?? true,
                    death_date: !wife.isAlive && wife.deathDate ? wife.deathDate.toISOString().split('T')[0] : null,
                    family_id: familyId,
                    created_by: familyData?.creator_id,
                    is_founder: false,
                    marital_status: 'married',
                    image_url: wife.croppedImage || null
                  })
                  .select()
                  .single();

                if (wifeError) {
                  console.error('Error creating wife member:', wife.name, wifeError);
                  marriageResults.failed++;
                  marriageResults.details.push(`فشل في إنشاء العضو ${wife.name}`);
                  continue;
                }
                
                wifeId = newWifeMember.id;
                console.log('🔥 Successfully created wife member:', newWifeMember);
              }

              // Create marriage record
              const { error: marriageError } = await supabase
                .from('marriages')
                .insert({
                  family_id: familyId,
                  husband_id: memberData.id,
                  wife_id: wifeId,
                  is_active: true,
                  marital_status: 'married'
                });

              if (marriageError) {
                console.error('Error creating marriage with wife:', wife.name, marriageError);
                marriageResults.failed++;
                marriageResults.details.push(`فشل ربط الزواج مع ${wife.name}`);
              } else {
                marriageResults.successful++;
                marriageResults.details.push(`تم ربط الزواج مع ${wife.name}`);
                console.log('🔥 Successfully created marriage with wife:', wife.name);
              }
            } catch (error) {
              console.error('Marriage creation error:', error);
              marriageResults.failed++;
              marriageResults.details.push(`خطأ في ربط الزواج مع ${wife.name}`);
            }
          }
        }

        // Handle husband for female members - process if saved
        if (submissionData.gender === 'female' && husband && husband.isSaved === true) {
          try {
            let husbandId = husband.existingFamilyMemberId;
            
            // If husband is not from existing family members, create new family member first
            if (!husband.isFamilyMember || !husband.existingFamilyMemberId) {
              const { data: newHusbandMember, error: husbandError } = await supabase
                .from('family_tree_members')
                .insert({
                  name: husband.name,
                  gender: 'male',
                  birth_date: husband.birthDate?.toISOString().split('T')[0] || null,
                  is_alive: husband.isAlive ?? true,
                  death_date: !husband.isAlive && husband.deathDate ? husband.deathDate.toISOString().split('T')[0] : null,
                  family_id: familyId,
                  created_by: familyData?.creator_id,
                  is_founder: false,
                  marital_status: 'married',
                  image_url: husband.croppedImage || null
                })
                .select()
                .single();

              if (husbandError) {
                console.error('Error creating husband member:', husband.name, husbandError);
                marriageResults.failed++;
                marriageResults.details.push(`فشل في إنشاء العضو ${husband.name}`);
              } else {
                husbandId = newHusbandMember.id;
                console.log('🔥 Successfully created husband member:', newHusbandMember);
              }
            }

            // Create marriage record if husband was created/found successfully
            if (husbandId) {
              const { error: marriageError } = await supabase
                .from('marriages')
                .insert({
                  family_id: familyId,
                  husband_id: husbandId,
                  wife_id: memberData.id,
                  is_active: true,
                  marital_status: 'married'
                });

              if (marriageError) {
                console.error('Error creating marriage with husband:', husband.name, marriageError);
                marriageResults.failed++;
                marriageResults.details.push(`فشل ربط الزواج مع ${husband.name}`);
              } else {
                marriageResults.successful++;
                marriageResults.details.push(`تم ربط الزواج مع ${husband.name}`);
                console.log('🔥 Successfully created marriage with husband:', husband.name);
              }
            }
          } catch (error) {
            console.error('Marriage creation error:', error);
            marriageResults.failed++;
            marriageResults.details.push(`خطأ في ربط الزواج مع ${husband.name}`);
          }
        }
      }
      
      // Refresh family data to show updated information
      await refreshFamilyData();
      
      // Reset form state
      setFormMode('view');
      setCurrentStep(1);
      resetFormData();
      setWives([]);
      setHusband(null);
      
      // Show success toast with detailed information
      const actionText = isEditMode ? "تحديث" : "إضافة";
      const actionedText = isEditMode ? "تم تحديث" : "تم إضافة";
      let toastDescription = `${actionedText} العضو "${submissionData.name}" بنجاح`;
      
      // Add marriage information to toast
      if (marriageResults.successful > 0) {
        toastDescription += `\n✅ تم ربط ${marriageResults.successful} زواج بنجاح`;
      }
      
      if (marriageResults.failed > 0) {
        toastDescription += `\n❌ فشل في ربط ${marriageResults.failed} زواج`;
      }
      
      toast({
        title: `تم ${actionText} العضو بنجاح`,
        description: toastDescription,
        variant: "default"
      });

      // Show additional detailed toast if there were marriage operations
      if (marriageResults.successful > 0 || marriageResults.failed > 0) {
        setTimeout(() => {
          toast({
            title: "تفاصيل عمليات الزواج",
            description: marriageResults.details.join('\n'),
            variant: marriageResults.failed > 0 ? "destructive" : "default"
          });
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      
      let errorMessage = "حدث خطأ أثناء حفظ البيانات";
      
      // Provide more specific error messages
      if (error.message?.includes('duplicate')) {
        errorMessage = "يوجد عضو بنفس هذه البيانات مسبقاً";
      } else if (error.message?.includes('foreign key')) {
        errorMessage = "خطأ في الربط مع بيانات العائلة";
      } else if (error.message?.includes('permission')) {
        errorMessage = "ليس لديك صلاحية لتنفيذ هذا الإجراء";
      }
      
      toast({
        title: formMode === 'edit' ? "خطأ في التحديث" : "خطأ في الإضافة",
        description: errorMessage,
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
        <GlobalHeader />
        <div className="container mx-auto px-4 py-6">
          <FamilyBuilderNewSkeleton />
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
                <div className="flex justify-center items-center gap-4 sm:gap-6 lg:gap-8 flex-wrap pb-2 lg:pb-0">
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
                                <Label htmlFor="parentRelation" className="font-arabic">
                                  العلاقة العائلية (الوالدين) *
                                  {formData.isFounder && (
                                    <span className="text-xs text-muted-foreground mr-2">(مؤسس العائلة - لا يحتاج لوالدين)</span>
                                  )}
                                </Label>
                                 <Select 
                                   value={formData.selectedParent || ""} 
                                   onValueChange={(value) => setFormData({...formData, selectedParent: value === "none" ? null : value})}
                                   disabled={loading || !familyMarriages || !familyMembers || formData.isFounder}
                                  >
                                   <SelectTrigger className="font-arabic">
                                      <SelectValue placeholder={
                                        loading ? "جاري التحميل..." : 
                                        formData.isFounder ? "مؤسس العائلة - لا يحتاج لوالدين" : 
                                        "اختر الوالدين"
                                      } />
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
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Right Panel - Add Wife Form */}
                                <div className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-900/30 rounded-2xl p-6 border border-pink-200/50 dark:border-pink-800/30 shadow-lg col-span-1 lg:col-span-2">
                                  <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                      <UserPlus className="w-4 h-4 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300 font-arabic">إضافة زوجة جديدة</h4>
                                  </div>

                                  {/* Wife Form Content */}
                                  <div className="space-y-6">
                                    {wives.filter((wife, index) => !wife.isSaved || index === wives.length - 1).map((wife, index) => {
                                      const actualIndex = wives.findIndex(w => w === wife);
                                      return (
                                      <div key={index} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-pink-200/50 dark:border-pink-800/30 rounded-xl p-6 shadow-md mb-4">
                                        <div className="flex items-center justify-between mb-4">
                                          <h5 className="font-bold text-lg flex items-center gap-2 text-gray-700 dark:text-gray-300 font-arabic">
                                            <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg"></div>
                                            الزوجة {wives.findIndex(w => w === wife) + 1}
                                          </h5>
                                        </div>
                                        
                                        <div className="space-y-6">
                                          {/* Family Member Selection - Only from same family */}
                                          <div>
                                            <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-3 font-arabic">
                                              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg"></div>
                                              هل الزوجة من أفراد العائلة ؟
                                            </Label>
                                            
                                            <div className="flex items-center gap-6 mb-3">
                                              <div className="flex items-center gap-2">
                                                <input
                                                  type="radio"
                                                  id={`wife-family-yes-${wives.findIndex(w => w === wife)}`}
                                                  name={`wife-family-${wives.findIndex(w => w === wife)}`}
                                                  value="yes"
                                                  checked={wiveFamilyStatus[wives.findIndex(w => w === wife)] === 'yes'}
                                                  onChange={(e) => {
                                                    const actualIndex = wives.findIndex(w => w === wife);
                                                    const newStatus = {...wiveFamilyStatus};
                                                    newStatus[actualIndex] = 'yes';
                                                    setWiveFamilyStatus(newStatus);
                                                    const updatedWives = [...wives];
                                                    updatedWives[actualIndex] = { ...wife, isFamilyMember: true };
                                                    setWives(updatedWives);
                                                  }}
                                                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <Label htmlFor={`wife-family-yes-${wives.findIndex(w => w === wife)}`} className="text-sm font-arabic">
                                                  نعم
                                                </Label>
                                              </div>
                                              
                                              <div className="flex items-center gap-2">
                                                <input
                                                  type="radio"
                                                  id={`wife-family-no-${wives.findIndex(w => w === wife)}`}
                                                  name={`wife-family-${wives.findIndex(w => w === wife)}`}
                                                  value="no"
                                                  checked={wiveFamilyStatus[wives.findIndex(w => w === wife)] === 'no'}
                                                  onChange={(e) => {
                                                    const actualIndex = wives.findIndex(w => w === wife);
                                                    const newStatus = {...wiveFamilyStatus};
                                                    newStatus[actualIndex] = 'no';
                                                    setWiveFamilyStatus(newStatus);
                                                    const updatedWives = [...wives];
                                                    updatedWives[actualIndex] = { ...wife, isFamilyMember: false, existingFamilyMemberId: '' };
                                                    setWives(updatedWives);
                                                  }}
                                                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <Label htmlFor={`wife-family-no-${wives.findIndex(w => w === wife)}`} className="text-sm font-arabic">
                                                  لا
                                                </Label>
                                              </div>
                                            </div>
                                            
                                            <p className="text-xs text-muted-foreground mb-3 font-arabic">
                                              يُسمح فقط باختيار الزوجة من أفراد العائلة المسجلين
                                            </p>
                                          </div>

                                          {/* Conditional rendering based on radio button selection */}
                                          {wiveFamilyStatus[wives.findIndex(w => w === wife)] === 'yes' && (
                                            <>
                                              {/* Select Existing Family Member */}
                                              <div className="space-y-3">
                                                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 font-arabic">
                                                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg"></div>
                                                  اختر الزوجة من القائمة
                                                </Label>
                                                <Popover open={wivesCommandOpen[wives.findIndex(w => w === wife)]} onOpenChange={(open) => {
                                                  const actualIndex = wives.findIndex(w => w === wife);
                                                  const newState = {...wivesCommandOpen};
                                                  newState[actualIndex] = open;
                                                  setWivesCommandOpen(newState);
                                                }}>
                                                  <PopoverTrigger asChild>
                                                    <Button
                                                      variant="outline"
                                                      role="combobox"
                                                      aria-expanded={wivesCommandOpen[wives.findIndex(w => w === wife)]} 
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
                                                           لا توجد إناث متاحات (لديهن أب في العائلة وعازبات/مطلقات).
                                                         </CommandEmpty>
                                                        <CommandGroup>
                                                           {familyMembers.filter(member => {
                                                             const hasValidGender = member.gender === "female";
                                                             const isNotSelf = member.id !== selectedMember?.id;
                                                             const isAvailableForMarriage = 
                                                               member.marital_status === "single" || 
                                                               member.marital_status === "divorced";
                                                             
                                                             return hasValidGender && isNotSelf && isAvailableForMarriage;
                                                           })
                                                            .map((member) => (
                                                              <CommandItem
                                                                key={member.id}
                                                                value={member.name}
                                                                onSelect={() => {
                                                                  const actualIndex = wives.findIndex(w => w === wife);
                                                                  const newWives = [...wives];
                                                                  newWives[actualIndex] = {
                                                                    ...wife,
                                                                    existingFamilyMemberId: member.id,
                                                                    name: member.name
                                                                  };
                                                                  setWives(newWives);
                                                                  const newState = {...wivesCommandOpen};
                                                                  newState[actualIndex] = false;
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

                                              {/* Marital Status */}
                                              <div className="group">
                                                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                                  الحالة الاجتماعية *
                                                </Label>
                                                <div className="relative">
                                                  <Select
                                                    value={wife.maritalStatus || "married"}
                                                    onValueChange={(value) => {
                                                      const actualIndex = wives.findIndex(w => w === wife);
                                                      const newWives = [...wives];
                                                      newWives[actualIndex] = { ...wife, maritalStatus: value };
                                                      setWives(newWives);
                                                    }}
                                                  >
                                                    <SelectTrigger className="h-11 text-sm border-2 border-purple-200/50 dark:border-purple-700/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic">
                                                      <SelectValue placeholder="اختر الحالة الاجتماعية" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                                      <SelectItem value="married" className="font-arabic text-sm">متزوجة</SelectItem>
                                                      <SelectItem value="divorced" className="font-arabic text-sm">مطلقة</SelectItem>
                                                      <SelectItem value="widowed" className="font-arabic text-sm">أرملة</SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                                                    <Heart className="h-3 w-3 text-white" />
                                                  </div>
                                                </div>
                                              </div>
                                            </>
                                          )}

                                          {wiveFamilyStatus[wives.findIndex(w => w === wife)] === 'no' && (
                                            <>
                                              {/* Name Input */}
                                              <div className="group">
                                                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                                  <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                                  اسم الزوجة *
                                                </Label>
                                                <div className="relative">
                                                  <Input
                                                    value={wife.name}
                                                    onChange={(e) => {
                                                      const actualIndex = wives.findIndex(w => w === wife);
                                                      const newWives = [...wives];
                                                      newWives[actualIndex] = { ...wife, name: e.target.value };
                                                      setWives(newWives);
                                                    }}
                                                    placeholder="أدخل اسم الزوجة"
                                                    className="h-11 text-sm border-2 border-pink-200/50 dark:border-pink-700/50 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                                                  />
                                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                                                    <User className="h-3 w-3 text-white" />
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Birth Date and Marital Status in grid */}
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Birth Date */}
                                                <div className="group">
                                                  <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                                    <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                                    تاريخ الميلاد
                                                  </Label>
                                                  <div className="relative">
                                                    <EnhancedDatePicker
                                                      value={wife.birthDate}
                                                      onChange={(date) => {
                                                        const actualIndex = wives.findIndex(w => w === wife);
                                                        const newWives = [...wives];
                                                        newWives[actualIndex] = { ...wife, birthDate: date };
                                                        setWives(newWives);
                                                      }}
                                                      placeholder="اختر تاريخ الميلاد"
                                                      className="h-11 text-sm border-2 border-cyan-200/50 dark:border-cyan-700/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                                                    />
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                                                      <CalendarIcon className="h-3 w-3 text-white" />
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Marital Status */}
                                                <div className="group">
                                                  <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                                    الحالة الاجتماعية *
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
                                                        <SelectItem value="widowed" className="font-arabic text-sm">أرملة</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                                                      <Heart className="h-3 w-3 text-white" />
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Life Status and Death Date */}
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
                                                        const actualIndex = wives.findIndex(w => w === wife);
                                                        const newWives = [...wives];
                                                        newWives[actualIndex] = { ...wife, deathDate: date };
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

                                              {/* Picture Upload with subscription check */}
                                              <ImageUploadSection
                                                isImageUploadEnabled={isImageUploadEnabled}
                                                uploadLoading={uploadLoading}
                                                croppedImage={wife.croppedImage}
                                                selectedImage={selectedImage}
                                                showCropDialog={showCropDialog}
                                                crop={crop}
                                                zoom={zoom}
                                                fileInputRef={fileInputRef}
                                                handleEditImage={handleEditImage}
                                                handleDeleteImage={() => {
                                                  const actualIndex = wives.findIndex(w => w === wife);
                                                  const newWives = [...wives];
                                                  newWives[actualIndex] = { ...wife, croppedImage: null };
                                                  setWives(newWives);
                                                }}
                                                handleImageSelect={handleImageSelect}
                                                setShowCropDialog={setShowCropDialog}
                                                setCrop={setCrop}
                                                setZoom={setZoom}
                                                onCropComplete={onCropComplete}
                                                handleCropSave={() => {
                                                  if (croppedImage) {
                                                    const actualIndex = wives.findIndex(w => w === wife);
                                                    const newWives = [...wives];
                                                    newWives[actualIndex] = { ...wife, croppedImage: croppedImage };
                                                    setWives(newWives);
                                                  }
                                                  setShowCropDialog(false);
                                                }}
                                              />
                                            </>
                                          )}

                                          {/* Save Wife Button */}
                                          <div className="pt-4 border-t border-pink-200/30 dark:border-pink-700/30">
                                            <Button
                                              type="button"
                                              onClick={() => {
                                                // Validate wife data
                                                const actualIndex = wives.findIndex(w => w === wife);
                                                const isValid = wife.name.trim() && (
                                                  (wiveFamilyStatus[actualIndex] === 'yes' && wife.existingFamilyMemberId) ||
                                                  wiveFamilyStatus[actualIndex] === 'no'
                                                );

                                                if (!isValid) {
                                                  toast({
                                                    title: "خطأ في البيانات",
                                                    description: "يرجى إكمال جميع البيانات المطلوبة للزوجة",
                                                    variant: "destructive"
                                                  });
                                                  return;
                                                }

                                                // Mark wife as saved
                                                const newWives = [...wives];
                                                newWives[actualIndex] = { ...wife, isSaved: true };
                                                setWives(newWives);

                                                toast({
                                                  title: "تم الحفظ بنجاح",
                                                  description: `تم حفظ بيانات الزوجة ${actualIndex + 1} بنجاح`,
                                                  variant: "default"
                                                });
                                              }}
                                              disabled={wife.isSaved}
                                              className={cn(
                                                "w-full h-12 font-arabic text-sm font-medium transition-all duration-300",
                                                wife.isSaved 
                                                  ? "bg-green-100 text-green-700 border-green-300 cursor-not-allowed" 
                                                  : "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl"
                                              )}
                                            >
                                              {wife.isSaved ? (
                                                <>
                                                  <Check className="h-4 w-4 mr-2" />
                                                  تم حفظ البيانات
                                                </>
                                              ) : (
                                                <>
                                                  <Save className="h-4 w-4 mr-2" />
                                                  حفظ بيانات الزوجة
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                        </div>
                                      );
                                    })}
                                    
                                    {/* Show Add Wife Button only if: no wives OR last wife is saved */}
                                    {(wives.length === 0 || wives[wives.length - 1]?.isSaved) && (
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
                                            isFamilyMember: true,
                                            existingFamilyMemberId: '',
                                            croppedImage: null,
                                            isSaved: false
                                          }]);
                                          
                                          // Initialize family status for new wife
                                          const newStatus = {...wiveFamilyStatus};
                                          newStatus[wives.length] = null;
                                          setWiveFamilyStatus(newStatus);
                                        }}
                                        className="w-full h-12 border-2 border-dashed border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all duration-300 rounded-xl"
                                      >
                                        <Plus className="h-5 w-5 mr-2" />
                                        {wives.length === 0 ? 'إضافة زوجة' : 'إضافة زوجة أخرى'}
                                      </Button>
                                    )}
                                    
                                    {/* Show message if last wife is not saved */}
                                    {wives.length > 0 && !wives[wives.length - 1]?.isSaved && (
                                      <div className="text-center py-4">
                                        <p className="text-sm text-amber-600 dark:text-amber-400 font-arabic">
                                          يرجى حفظ بيانات الزوجة الحالية قبل إضافة زوجة أخرى
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Left Panel - Wives List */}
                                <div className="space-y-4 col-span-1 lg:col-span-1">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                      <Heart className="w-3 h-3 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300 font-arabic">قائمة الزوجات ({wives.length})</h4>
                                  </div>
                                  
                                  <div className="space-y-3 max-h-[70vh] overflow-y-auto">
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
                                                <div 
                                                  className={cn(
                                                    wife.isSaved ? "cursor-pointer hover:bg-pink-50/50 dark:hover:bg-pink-950/20 rounded-lg p-2 -m-2 transition-colors" : ""
                                                  )}
                                                  onClick={() => {
                                                    if (wife.isSaved) {
                                                      // Edit mode: Load wife data for editing
                                                      const updatedWives = [...wives];
                                                      updatedWives[index] = { ...wife, isSaved: false };
                                                      setWives(updatedWives);
                                                      
                                                      toast({
                                                        title: "وضع التعديل",
                                                        description: `يمكنك الآن تعديل بيانات الزوجة ${index + 1}`,
                                                        variant: "default"
                                                      });
                                                    }
                                                  }}
                                                >
                                                  <h5 className="font-medium text-gray-900 dark:text-gray-100 font-arabic">
                                                    {wife.name || `الزوجة ${index + 1}`}
                                                  </h5>
                                                  <p className="text-xs text-muted-foreground font-arabic flex items-center gap-1">
                                                    {wife.isFamilyMember ? 'من نفس العائلة' : 'خارج العائلة'}
                                                    {wife.isSaved && (
                                                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                                                        <Check className="h-3 w-3" />
                                                        محفوظة
                                                      </span>
                                                    )}
                                                  </p>
                                                  {wife.isSaved && (
                                                    <p className="text-xs text-blue-600 font-arabic mt-1">
                                                      انقر للتعديل
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-2">
                                                {wife.isSaved && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                      const updatedWives = [...wives];
                                                      updatedWives[index] = { ...wife, isSaved: false };
                                                      setWives(updatedWives);
                                                      
                                                      toast({
                                                        title: "وضع التعديل",
                                                        description: `يمكنك الآن تعديل بيانات الزوجة ${index + 1}`,
                                                        variant: "default"
                                                      });
                                                    }}
                                                    className="gap-1 border-blue-200/50 dark:border-blue-700/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300 h-8 px-2"
                                                  >
                                                    <Edit className="h-3 w-3" />
                                                  </Button>
                                                )}
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
                                          </div>
                                        ))
                                    )}
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
                                          <div 
                                            className={cn(
                                              "flex items-center gap-3 flex-1",
                                              husband.isSaved ? "cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-lg p-2 -m-2 transition-colors" : ""
                                            )}
                                            onClick={() => {
                                              if (husband.isSaved) {
                                                // Edit mode: Load husband data for editing
                                                setHusband({ ...husband, isSaved: false });
                                                
                                                toast({
                                                  title: "وضع التعديل",
                                                  description: "يمكنك الآن تعديل بيانات الزوج",
                                                  variant: "default"
                                                });
                                              }
                                            }}
                                          >
                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                              <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <h5 className="font-medium text-gray-900 dark:text-gray-100 font-arabic">
                                                {husband.name || 'الزوج'}
                                              </h5>
                                              <p className="text-xs text-muted-foreground font-arabic flex items-center gap-1">
                                                {husband.isFamilyMember ? 'من نفس العائلة' : 'خارج العائلة'}
                                                {husband.isSaved && (
                                                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                                                    <Check className="h-3 w-3" />
                                                    محفوظ
                                                  </span>
                                                )}
                                              </p>
                                              {husband.isSaved && (
                                                <p className="text-xs text-blue-600 font-arabic mt-1">
                                                  انقر للتعديل
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            {husband.isSaved && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  setHusband({ ...husband, isSaved: false });
                                                  
                                                  toast({
                                                    title: "وضع التعديل",
                                                    description: "يمكنك الآن تعديل بيانات الزوج",
                                                    variant: "default"
                                                  });
                                                }}
                                                className="gap-1 border-blue-200/50 dark:border-blue-700/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300 h-8 px-2"
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                            )}
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
                                                         .filter(member => {
                                                           const hasValidGender = member.gender === "male";
                                                           const isNotSelf = member.id !== selectedMember?.id;
                                                           const hasFatherId = member.father_id; // غير فارغ
                                                           const isAvailableForMarriage = 
                                                             member.marital_status === "single" || 
                                                             member.marital_status === "divorced";
                                                           
                                                           console.log(`🔍 Male member "${member.name}":`, {
                                                             gender: member.gender,
                                                             hasValidGender,
                                                             selectedMemberId: selectedMember?.id,
                                                             memberId: member.id,
                                                             isNotSelf,
                                                             fatherId: member.father_id,
                                                             hasFatherId: !!member.father_id,
                                                             maritalStatus: `"${member.marital_status}"`,
                                                             isAvailableForMarriage,
                                                             finalResult: hasValidGender && isNotSelf && hasFatherId && isAvailableForMarriage
                                                           });
                                                           
                                                           return hasValidGender && isNotSelf && hasFatherId && isAvailableForMarriage;
                                                         })
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

                                         {/* Birth Date and Marital Status in grid */}
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                           {/* Birth Date - only show if not family member */}
                                           {!husband.isFamilyMember ? (
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
                                           ) : (
                                             <div></div>
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

                                         {/* Save Husband Button */}
                                         <div className="pt-4 border-t border-blue-200/30 dark:border-blue-700/30">
                                           <Button
                                             type="button"
                                             onClick={() => {
                                               // Validate husband data
                                               const isValid = husband.name.trim() && (
                                                 (husband.isFamilyMember && husband.existingFamilyMemberId) ||
                                                 !husband.isFamilyMember
                                               );

                                               if (!isValid) {
                                                 toast({
                                                   title: "خطأ في البيانات",
                                                   description: "يرجى إكمال جميع البيانات المطلوبة للزوج",
                                                   variant: "destructive"
                                                 });
                                                 return;
                                               }

                                               // Mark husband as saved
                                               setHusband({ ...husband, isSaved: true });

                                               toast({
                                                 title: "تم الحفظ بنجاح",
                                                 description: "تم حفظ بيانات الزوج بنجاح",
                                                 variant: "default"
                                               });
                                             }}
                                             disabled={husband.isSaved}
                                             className={cn(
                                               "w-full h-12 font-arabic text-sm font-medium transition-all duration-300",
                                               husband.isSaved 
                                                 ? "bg-green-100 text-green-700 border-green-300 cursor-not-allowed" 
                                                 : "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-lg hover:shadow-xl"
                                             )}
                                           >
                                             {husband.isSaved ? (
                                               <>
                                                 <Check className="h-4 w-4 mr-2" />
                                                 تم حفظ البيانات
                                               </>
                                             ) : (
                                               <>
                                                 <Save className="h-4 w-4 mr-2" />
                                                 حفظ بيانات الزوج
                                               </>
                                             )}
                                           </Button>
                                         </div>
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
                                        croppedImage: null,
                                        isSaved: false
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
                         onDeleteMember={handleDeleteMember}
                         onSpouseEditAttempt={handleSpouseEditAttempt}
                         checkIfMemberIsSpouse={checkIfMemberIsSpouse}
                         searchTerm={searchTerm}
                         onSearchChange={setSearchTerm}
                         selectedFilter={selectedFilter}
                         onFilterChange={setSelectedFilter}
                         getAdditionalInfo={getAdditionalInfo}
                        getGenderColor={getGenderColor}
                        familyMembers={familyMembers}
                        marriages={familyMarriages}
                        memberListLoading={memberListLoading}
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
                       onDeleteMember={handleDeleteMember}
                       onSpouseEditAttempt={handleSpouseEditAttempt}
                       checkIfMemberIsSpouse={checkIfMemberIsSpouse}
                       searchTerm={searchTerm}
                       onSearchChange={setSearchTerm}
                       selectedFilter={selectedFilter}
                       onFilterChange={setSelectedFilter}
                       getAdditionalInfo={getAdditionalInfo}
                      getGenderColor={getGenderColor}
                      familyMembers={familyMembers}
                      marriages={familyMarriages}
                      memberListLoading={memberListLoading}
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
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Spouse edit warning modal */}
      <AlertDialog open={showSpouseEditWarning} onOpenChange={setShowSpouseEditWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">لا يمكن تعديل البيانات مباشرة</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic text-center">
              <div className="space-y-2">
                <p>لا يمكن تعديل أو حذف بيانات الزوج/الزوجة مباشرة من هنا.</p>
                {spousePartnerName && (
                  <p className="font-semibold">
                    يرجى التعديل من خلال شاشة تحرير بيانات: <span className="text-primary">{spousePartnerName}</span>
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  هذا لضمان سلامة البيانات والحفاظ على العلاقات العائلية.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-arabic">فهمت</AlertDialogCancel>
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
  onDeleteMember,
  onSpouseEditAttempt,
  checkIfMemberIsSpouse,
  searchTerm, 
  onSearchChange, 
  selectedFilter, 
  onFilterChange,
  getAdditionalInfo,
  getGenderColor,
  familyMembers,
  marriages,
  memberListLoading 
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
      <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
        {memberListLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 rounded-3xl border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          ))
        ) : members.length === 0 ? (
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
                <div className="flex items-center justify-between gap-3 min-h-[80px]">
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
                     {/* Only show edit button for non-spouse members */}
                     {!checkIfMemberIsSpouse(member) ? (
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
                     ) : (
                       <Button
                         type="button"
                         size="sm"
                         variant="outline"
                         onClick={(e) => {
                           e.stopPropagation();
                           onSpouseEditAttempt(member);
                         }}
                         className="h-7 w-7 p-0 bg-yellow-50/80 hover:bg-yellow-100 border border-yellow-200 shadow-sm"
                       >
                         <Edit2 className="h-3 w-3 text-yellow-600" />
                       </Button>
                     )}
                    
                     <Button
                       type="button"
                       size="sm"
                       variant="outline"
                         onClick={(e) => {
                           e.stopPropagation();
                           if (checkIfMemberIsSpouse(member)) {
                             onSpouseEditAttempt(member);
                           } else {
                             onDeleteMember(member);
                           }
                         }}
                       className={`h-7 w-7 p-0 border shadow-sm ${
                         checkIfMemberIsSpouse(member) 
                           ? 'bg-yellow-50/80 hover:bg-yellow-100 border-yellow-200' 
                           : 'bg-red-50/80 hover:bg-red-100 border-red-200'
                       }`}
                     >
                       <Trash2 className={`h-3 w-3 ${
                         checkIfMemberIsSpouse(member) ? 'text-yellow-600' : 'text-red-500'
                       }`} />
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
