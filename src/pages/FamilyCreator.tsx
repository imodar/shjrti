import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TreePine, ArrowRight, ArrowLeft, Users, Heart, UserPlus, CheckCircle, Plus, CalendarIcon, Upload, X, MoreVertical, Edit, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/GlobalHeader";
import { LuxuryFooter } from "@/components/LuxuryFooter";
import { supabase } from "@/integrations/supabase/client";
import WifeForm, { WifeFormRef } from "@/components/WifeForm";
import Cropper from "react-easy-crop";

const FamilyCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const wifeFormRef = useRef<WifeFormRef>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showWivesModal, setShowWivesModal] = useState(false);
  const [editingWife, setEditingWife] = useState<{ id: string; name: string; isAlive: boolean; birthDate: Date | null; deathDate: Date | null } | null>(null);
  const [isAddingWife, setIsAddingWife] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  const [treeData, setTreeData] = useState({
    name: "",
    description: ""
  });
  
  const [founderData, setFounderData] = useState({
    name: "",
    gender: "male",
    birthDate: null as Date | null,
    isAlive: true,
    deathDate: null as Date | null,
    bio: "",
    image: null as File | null,
    croppedImage: null as string | null
  });

  const [wives, setWives] = useState<Array<{
    id: string;
    name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
  }>>([]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!treeData.name.trim()) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال اسم العائلة",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!founderData.name.trim() || !founderData.gender) {
        toast({
          title: "خطأ",
          description: "يرجى إكمال جميع البيانات المطلوبة للمؤسس",
          variant: "destructive"
        });
        return;
      }
      handleCreateFamily();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const checkFamilyCreationLimits = async (userId: string): Promise<boolean> => {
    try {
      // Get user's current active subscription with package details
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          packages (
            max_family_trees,
            name
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (subscriptionError || !subscription) {
        // If no subscription found, check if user has a default free package
        const { data: defaultPackage, error: packageError } = await supabase
          .from('packages')
          .select('id, max_family_trees, name')
          .eq('is_active', true)
          .order('price', { ascending: true })
          .limit(1)
          .single();

        if (packageError || !defaultPackage) {
          toast({
            title: "خطأ",
            description: "لم يتم العثور على باقة متاحة",
            variant: "destructive"
          });
          return false;
        }

        // Use default package limits
        const { data: families, error: familiesError } = await supabase
          .from('families')
          .select('id')
          .eq('creator_id', userId);

        if (familiesError) {
          toast({
            title: "خطأ",
            description: "حدث خطأ في التحقق من حدود الباقة",
            variant: "destructive"
          });
          return false;
        }

        const currentFamilyCount = families?.length || 0;
        const maxFamilyTrees = defaultPackage.max_family_trees || 1;

        if (currentFamilyCount >= maxFamilyTrees) {
          toast({
            title: "تم الوصول للحد الأقصى",
            description: `لقد وصلت للحد الأقصى من أشجار العائلة (${maxFamilyTrees}) في باقة ${defaultPackage.name}. يرجى ترقية باقتك لإنشاء المزيد من الأشجار.`,
            variant: "destructive"
          });
          return false;
        }

        return true;
      }

      // Get user's families count
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select('id')
        .eq('creator_id', userId);

      if (familiesError) {
        toast({
          title: "خطأ",
          description: "حدث خطأ في التحقق من حدود الباقة",
          variant: "destructive"
        });
        return false;
      }

      const currentFamilyCount = families?.length || 0;
      const maxFamilyTrees = subscription.packages?.max_family_trees || 1;
      const packageName = subscription.packages?.name || 'الباقة الحالية';

      if (currentFamilyCount >= maxFamilyTrees) {
        toast({
          title: "تم الوصول للحد الأقصى",
          description: `لقد وصلت للحد الأقصى من أشجار العائلة (${maxFamilyTrees}) في ${packageName}. يرجى ترقية باقتك لإنشاء المزيد من الأشجار.`,
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking family creation limits:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في التحقق من حدود الباقة",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleCreateFamily = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "خطأ في المصادقة",
          description: "يرجى تسجيل الدخول أولاً",
          variant: "destructive"
        });
        return;
      }

      // Check user's package limits before creating family
      const canCreateFamily = await checkFamilyCreationLimits(user.id);
      if (!canCreateFamily) {
        return; // Error message is shown in the function
      }

      // إنشاء العائلة
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: treeData.name,
          creator_id: user.id,
          subscription_status: 'active'
        })
        .select()
        .single();

      if (familyError) throw familyError;

      // إضافة المنشئ كعضو في العائلة
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          role: 'creator'
        });

      if (memberError) throw memberError;

      // إضافة المؤسس لشجرة العائلة
      const { data: founder, error: founderError } = await supabase
        .from('family_tree_members')
        .insert({
          family_id: family.id,
          name: founderData.name,
          gender: founderData.gender,
          birth_date: founderData.birthDate ? new Date(founderData.birthDate).toISOString().split('T')[0] : null,
          death_date: founderData.deathDate ? new Date(founderData.deathDate).toISOString().split('T')[0] : null,
          is_alive: founderData.isAlive,
          biography: founderData.bio,
          image_url: founderData.croppedImage,
          is_founder: true,
          created_by: user.id
        })
        .select()
        .single();

      if (founderError) throw founderError;

      // إضافة الزوجات إلى شجرة العائلة وإنشاء سجلات الزواج
      for (const wife of wives) {
        // إضافة الزوجة كعضو في شجرة العائلة
        const { data: wifeData, error: wifeError } = await supabase
          .from('family_tree_members')
          .insert({
            family_id: family.id,
            name: wife.name,
            gender: 'female',
            birth_date: wife.birthDate ? new Date(wife.birthDate).toISOString().split('T')[0] : null,
            death_date: wife.deathDate ? new Date(wife.deathDate).toISOString().split('T')[0] : null,
            is_alive: wife.isAlive,
            created_by: user.id
          })
          .select()
          .single();

        if (wifeError) throw wifeError;

        // إنشاء سجل الزواج
        const { error: marriageError } = await supabase
          .from('marriages')
          .insert({
            family_id: family.id,
            husband_id: founder.id,
            wife_id: wifeData.id,
            is_active: true
          });

        if (marriageError) throw marriageError;
      }

      setShowSuccessModal(true);
      
      toast({
        title: "تم إنشاء العائلة بنجاح",
        description: `تم حفظ بيانات العائلة مع ${wives.length} من الزوجات في قاعدة البيانات`
      });
      
    } catch (error) {
      console.error('Error creating family:', error);
      toast({
        title: "خطأ في إنشاء العائلة",
        description: "حدث خطأ أثناء حفظ بيانات العائلة، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = document.createElement('img') as HTMLImageElement;
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

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

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.addEventListener('load', () => resolve(reader.result as string));
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.8);
    });
  };

  const handleCropSave = async () => {
    if (cropImage && croppedAreaPixels) {
      try {
        const croppedImageUrl = await getCroppedImg(cropImage, croppedAreaPixels);
        setFounderData({...founderData, croppedImage: croppedImageUrl});
        setShowCropModal(false);
        setCropImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        toast({
          title: "تم حفظ الصورة",
          description: "تم قص الصورة وحفظها بنجاح"
        });
      } catch (e) {
        console.error(e);
        toast({
          title: "خطأ في معالجة الصورة",
          description: "حدث خطأ أثناء قص الصورة",
          variant: "destructive"
        });
      }
    }
  };

  const handleAddMoreMembers = () => {
    setShowSuccessModal(false);
    navigate("/family-builder?new=true");
  };

  const handleSkipTodashboard = () => {
    setShowSuccessModal(false);
    navigate("/dashboard");
    toast({
      title: "تم إنشاء الشجرة بنجاح",
      description: "تم إنشاء شجرة العائلة بنجاح، يمكنك إضافة أفراد آخرين لاحقاً"
    });
  };

  return (
    <>
      <GlobalHeader />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
        </div>

        {/* Floating Animated Icons */}
        <div className="absolute top-32 right-20 animate-pulse">
          <Heart className="h-10 w-10 text-pink-400 opacity-60" />
        </div>
        <div className="absolute bottom-40 left-20 animate-bounce">
          <Users className="h-12 w-12 text-emerald-400 opacity-40" />
        </div>
        <div className="absolute top-1/2 left-10 animate-pulse">
          <Star className="h-8 w-8 text-yellow-400 opacity-60" />
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 pt-24 relative z-10">
          {/* Hero Section with Dashboard Style */}
          {/* Header Section with Dashboard Style */}
          <div className="mb-8">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-3xl blur-3xl"></div>
            
            {/* Main Container */}
            <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-6 shadow-2xl ring-1 ring-white/10 dark:ring-gray-500/10">
              <div className="flex items-center justify-between gap-8">
                {/* Right: Icon and Status */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-50 group-hover:opacity-80 transition-all duration-500 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xl border-2 border-white/30 dark:border-gray-700/30 transform hover:scale-110 transition-all duration-300">
                      <TreePine className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                    {/* Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                  
                  {/* Text Content */}
                  <div className="text-right">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        إنشاء شجرة العائلة
                      </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                      ابدأ رحلتك في بناء تاريخ عائلتك وحفظ ذكرياتك للأجيال القادمة
                    </p>
                  </div>
                </div>

                {/* Left: Progress Steps */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      currentStep >= 1 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105' 
                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border border-gray-200/50'
                    }`}>
                      <span className="relative z-10">1</span>
                      {currentStep >= 1 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur opacity-40 animate-pulse"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">معلومات العائلة</span>
                  </div>
                  
                  <div className={`w-8 h-2 rounded-full transition-all duration-700 ${
                    currentStep >= 2 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-200/50 dark:bg-gray-700/50'
                  }`}>
                    {currentStep >= 2 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-60 animate-pulse"></div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      currentStep >= 2 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105' 
                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border border-gray-200/50'
                    }`}>
                      <span className="relative z-10">2</span>
                      {currentStep >= 2 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur opacity-40 animate-pulse"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">بيانات المؤسس</span>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-emerald-300/40 dark:border-emerald-700/40 rounded-tr"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l border-b border-emerald-300/40 dark:border-emerald-700/40 rounded-bl"></div>
            </div>
          </div>

          {/* Enhanced Step Content with Dashboard Style */}
          <div className="max-w-6xl mx-auto">
            {currentStep === 1 && (
              <div className="relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-amber-500/5 rounded-3xl blur-2xl"></div>
                
                <Card className="relative border-0 shadow-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl ring-1 ring-white/20 dark:ring-gray-500/20 overflow-hidden rounded-3xl">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500"></div>
                  
                  <CardHeader className="text-center pb-10 relative">
                    <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-xl opacity-60"></div>
                    
                    <CardTitle className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-6 relative z-10 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        معلومات العائلة
                      </span>
                    </CardTitle>
                    
                    <CardDescription className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                      أدخل المعلومات الأساسية لشجرة العائلة الجديدة وابدأ في توثيق تاريخك العائلي المميز
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-10 md:p-16 space-y-10">
                    <div className="space-y-4">
                      <Label htmlFor="familyName" className="text-xl font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg"></div>
                        اسم العائلة *
                      </Label>
                      <Input
                        id="familyName"
                        placeholder="مثال: عائلة الأحمد"
                        value={treeData.name}
                        onChange={(e) => setTreeData({...treeData, name: e.target.value})}
                        className="h-16 text-xl border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="familyDescription" className="text-xl font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <div className="w-3 h-3 bg-teal-500 rounded-full shadow-lg"></div>
                        وصف العائلة (اختياري)
                      </Label>
                      <Textarea
                        id="familyDescription"
                        placeholder="وصف مختصر عن تاريخ العائلة، قصص مميزة، أو أي معلومات إضافية تود توثيقها..."
                        value={treeData.description}
                        onChange={(e) => setTreeData({...treeData, description: e.target.value})}
                        className="min-h-[160px] text-lg border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-12">
                {/* Founder Information */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-amber-500/5 rounded-3xl blur-2xl"></div>
                  
                  <Card className="relative border-0 shadow-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl ring-1 ring-white/20 dark:ring-gray-500/20 overflow-hidden rounded-3xl">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500"></div>
                    
                    <CardHeader className="text-center pb-10 relative">
                      <div className="absolute top-6 left-6 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-amber-500/10 rounded-full blur-xl opacity-50"></div>
                      
                      <CardTitle className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-6 relative z-10 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl">
                          <UserPlus className="h-8 w-8 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                          معلومات مؤسس العائلة
                        </span>
                      </CardTitle>
                      
                      <CardDescription className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        أدخل معلومات الشخص الذي ستبدأ منه شجرة العائلة - الجذر الذي ستنمو منه فروع التاريخ
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-10 md:p-16">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Name */}
                        <div className="space-y-4">
                          <Label htmlFor="founderName" className="text-xl font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg"></div>
                            الاسم الكامل *
                          </Label>
                          <Input
                            id="founderName"
                            placeholder="الاسم الكامل للمؤسس"
                            value={founderData.name}
                            onChange={(e) => setFounderData({...founderData, name: e.target.value})}
                            className="h-16 text-xl border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl"
                          />
                        </div>

                        {/* Gender */}
                        <div className="space-y-4">
                          <Label className="text-xl font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="w-3 h-3 bg-teal-500 rounded-full shadow-lg"></div>
                            الجنس *
                          </Label>
                          <Select value={founderData.gender} onValueChange={(value) => setFounderData({...founderData, gender: value})}>
                            <SelectTrigger className="h-16 text-xl border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl">
                              <SelectValue placeholder="اختر الجنس" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">ذكر</SelectItem>
                              <SelectItem value="female">أنثى</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Birth Date */}
                        <div className="space-y-4">
                          <Label className="text-xl font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="w-3 h-3 bg-amber-500 rounded-full shadow-lg"></div>
                            تاريخ الميلاد
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-16 text-xl border-2 border-gray-200/50 dark:border-gray-700/50 justify-start text-left font-normal w-full hover:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl",
                                  !founderData.birthDate && "text-gray-500"
                                )}
                              >
                                <CalendarIcon className="mr-4 h-6 w-6" />
                                {founderData.birthDate ? format(founderData.birthDate, "dd/MM/yyyy", { locale: ar }) : "اختر تاريخ الميلاد"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={founderData.birthDate}
                                onSelect={(date) => setFounderData({...founderData, birthDate: date})}
                                locale={ar}
                                initialFocus
                                className="rounded-md border pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Status */}
                        <div className="space-y-4">
                          <Label className="text-xl font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg"></div>
                            الحالة
                          </Label>
                          <Select value={founderData.isAlive ? "alive" : "deceased"} onValueChange={(value) => setFounderData({...founderData, isAlive: value === "alive"})}>
                            <SelectTrigger className="h-16 text-xl border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alive">على قيد الحياة</SelectItem>
                              <SelectItem value="deceased">متوفى</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Death Date (if deceased) */}
                        {!founderData.isAlive && (
                          <div className="space-y-4 lg:col-span-2">
                            <Label className="text-xl font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300">
                              <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                              تاريخ الوفاة
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "h-16 text-xl border-2 border-gray-200/50 dark:border-gray-700/50 justify-start text-left font-normal w-full hover:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl",
                                    !founderData.deathDate && "text-gray-500"
                                  )}
                                >
                                  <CalendarIcon className="mr-4 h-6 w-6" />
                                  {founderData.deathDate ? format(founderData.deathDate, "dd/MM/yyyy", { locale: ar }) : "اختر تاريخ الوفاة"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={founderData.deathDate}
                                  onSelect={(date) => setFounderData({...founderData, deathDate: date})}
                                  locale={ar}
                                  initialFocus
                                  className="rounded-md border pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}

                        {/* Biography */}
                        <div className="space-y-4 lg:col-span-2">
                          <Label htmlFor="founderBio" className="text-xl font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="w-3 h-3 bg-teal-500 rounded-full shadow-lg"></div>
                            السيرة الذاتية (اختياري)
                          </Label>
                          <Textarea
                            id="founderBio"
                            placeholder="معلومات عن المؤسس، إنجازاته، مهنته، قصص مميزة، أو أي معلومات مهمة تود توثيقها..."
                            value={founderData.bio}
                            onChange={(e) => setFounderData({...founderData, bio: e.target.value})}
                            className="min-h-[160px] text-lg border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl"
                          />
                        </div>

                        {/* Enhanced Image Upload */}
                        <div className="space-y-4 lg:col-span-2">
                          <Label className="text-xl font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="w-3 h-3 bg-amber-500 rounded-full shadow-lg"></div>
                            صورة المؤسس (اختياري)
                          </Label>
                          <div className="flex items-center gap-8">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setFounderData({...founderData, image: file});
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setCropImage(e.target?.result as string);
                                    setShowCropModal(true);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                              id="founder-image"
                            />
                            <Label htmlFor="founder-image" className="cursor-pointer">
                              <div className="group flex items-center gap-4 px-8 py-6 border-2 border-dashed border-amber-300/50 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-500 transition-all duration-300 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                  <Upload className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">اختر صورة المؤسس</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">JPG, PNG أو GIF</p>
                                </div>
                              </div>
                            </Label>
                            {founderData.croppedImage && (
                              <div className="relative group">
                                <img 
                                  src={founderData.croppedImage} 
                                  alt="صورة المؤسس" 
                                  className="w-24 h-24 rounded-2xl object-cover border-4 border-amber-200 dark:border-amber-700 shadow-xl group-hover:scale-105 transition-transform" 
                                />
                                <button
                                  onClick={() => setFounderData({...founderData, croppedImage: null, image: null})}
                                  className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Wives Section */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-rose-500/10 to-amber-500/5 rounded-3xl blur-2xl"></div>
                  
                  <Card className="relative border-0 shadow-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl ring-1 ring-white/20 dark:ring-gray-500/20 overflow-hidden rounded-3xl">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500"></div>
                    
                    <CardHeader className="text-center pb-10 relative">
                      <div className="absolute top-6 right-6 w-28 h-28 bg-gradient-to-br from-pink-500/10 to-amber-500/10 rounded-full blur-xl opacity-40"></div>
                      
                      <CardTitle className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-6 relative z-10 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-xl">
                          <Heart className="h-8 w-8 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 bg-clip-text text-transparent">
                          الزوجات (اختياري)
                        </span>
                      </CardTitle>
                      
                      <CardDescription className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        أضف معلومات الزوجات إذا كان لدى المؤسس أكثر من زوجة لتوثيق كامل للعائلة
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-10 md:p-16">
                      {wives.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-10">
                          {wives.map((wife, index) => (
                            <div key={wife.id} className="group p-8 bg-gradient-to-br from-rose-50/80 to-pink-50/80 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl border border-rose-200/50 dark:border-rose-700/50 hover:border-rose-400/50 transition-all duration-300 hover:shadow-xl backdrop-blur-sm">
                              <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-xl text-gray-800 dark:text-gray-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{wife.name}</h4>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl">
                                      <MoreVertical className="h-5 w-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setEditingWife(wife)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      تعديل
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setWives(wives.filter(w => w.id !== wife.id))}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      حذف
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="space-y-3">
                                <p className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${wife.isAlive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'}`}>
                                  {wife.isAlive ? "على قيد الحياة" : "متوفاة"}
                                </p>
                                {wife.birthDate && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                                    مولودة: {format(wife.birthDate, "dd/MM/yyyy", { locale: ar })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Button
                        onClick={() => setIsAddingWife(true)}
                        variant="outline"
                        className="w-full h-20 border-2 border-dashed border-rose-300/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-500 transition-all duration-300 group rounded-2xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <Plus className="h-6 w-6 text-white" />
                          </div>
                          <span className="text-xl font-bold text-gray-700 dark:text-gray-300">إضافة زوجة جديدة</span>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Enhanced Navigation Buttons */}
            <div className="flex justify-between items-center mt-20 gap-6">
              <Button
                onClick={handlePrevStep}
                variant="outline"
                disabled={currentStep === 1}
                className="h-16 px-10 text-lg border-2 border-gray-200/50 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300 disabled:opacity-50 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              >
                <ArrowRight className="h-6 w-6 mr-3" />
                السابق
              </Button>
              
              <Button
                onClick={handleNextStep}
                className="h-16 px-16 text-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-2xl rounded-2xl text-white font-bold"
              >
                {currentStep === 1 ? "التالي" : "إنشاء العائلة"}
                {currentStep === 1 && <ArrowLeft className="h-6 w-6 ml-3" />}
                {currentStep === 2 && <CheckCircle className="h-6 w-6 ml-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>قص الصورة</DialogTitle>
            <DialogDescription>
              اسحب لتحريك الصورة أو استخدم عجلة الماوس للتكبير والتصغير
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCropModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCropSave}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Wife Modal */}
      <Dialog open={isAddingWife} onOpenChange={setIsAddingWife}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة زوجة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <p className="text-muted-foreground">يمكنك إضافة الزوجات لاحقاً من خلال لوحة التحكم</p>
            <Button onClick={() => setIsAddingWife(false)} className="w-full">
              موافق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Wife Modal */}
      <Dialog open={editingWife !== null} onOpenChange={() => setEditingWife(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الزوجة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <p className="text-muted-foreground">يمكنك تعديل البيانات لاحقاً من خلال لوحة التحكم</p>
            <Button onClick={() => setEditingWife(null)} className="w-full">
              موافق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl">تم إنشاء العائلة بنجاح!</DialogTitle>
            <DialogDescription className="text-base mt-2">
              تم حفظ بيانات شجرة العائلة بنجاح في قاعدة البيانات
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-6">
            <Button
              onClick={handleSkipTodashboard}
              variant="outline"
              className="flex-1"
            >
              إنهاء
            </Button>
            <Button
              onClick={handleAddMoreMembers}
              className="flex-1 bg-gradient-to-r from-primary to-secondary"
            >
              إضافة المزيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LuxuryFooter />
    </>
  );
};

export default FamilyCreator;