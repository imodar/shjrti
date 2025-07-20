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
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

const FamilyCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const wifeFormRef = useRef<WifeFormRef>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
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
    maritalStatus: string;
  }>>([]);

  const handleNextStep = async () => {
    console.log('handleNextStep called - currentStep:', currentStep);
    console.log('treeData:', treeData);
    console.log('founderData:', founderData);
    
    if (currentStep === 1) {
      if (!treeData.name.trim()) {
        console.log('Family name validation failed:', treeData.name);
        toast({
          title: "خطأ",
          description: "يرجى إدخال اسم العائلة",
          variant: "destructive"
        });
        return;
      }
      console.log('Moving to step 2');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!founderData.name.trim() || !founderData.gender) {
        console.log('Founder data validation failed:', founderData);
        toast({
          title: "خطأ",
          description: "يرجى إكمال جميع البيانات المطلوبة للمؤسس",
          variant: "destructive"
        });
        return;
      }
      
      // Check family creation limits before creating
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "خطأ في المصادقة",
          description: "يرجى تسجيل الدخول أولاً",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      // No limits check here - will be checked in handleCreateFamily
      console.log('Creating family');
      handleCreateFamily();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 1) {
      // Force immediate scroll to top
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Force navigation and scroll on destination
      window.location.href = '/dashboard';
    } else if (currentStep === 2) {
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

        // Use default package limits - only count non-archived families
        console.log('📊 Using default package, checking families for user:', userId);
        const { data: families, error: familiesError } = await supabase
          .from('families')
          .select('id, name, is_archived, archived_at')
          .eq('creator_id', userId)
          .eq('is_archived', false);

        // Also check all families to see what's happening
        const { data: allFamilies } = await supabase
          .from('families')
          .select('id, name, is_archived, archived_at')
          .eq('creator_id', userId);
        
        console.log('🔍 All families for user (default package):', allFamilies);
        console.log('✅ Non-archived families for user (default package):', families);

        if (familiesError) {
          console.error('❌ Error fetching families:', familiesError);
          toast({
            title: "خطأ",
            description: "حدث خطأ في التحقق من حدود الباقة",
            variant: "destructive"
          });
          return false;
        }

        const currentFamilyCount = families?.length || 0;
        const maxFamilyTrees = defaultPackage.max_family_trees || 1;
        
        console.log('📈 Family counts:', { 
          currentFamilyCount, 
          maxFamilyTrees, 
          familyIds: families?.map(f => f.id) 
        });

        if (currentFamilyCount >= maxFamilyTrees) {
          // Parse package name if it's JSON
          let packageDisplayName = 'الأساسية';
          try {
            // @ts-ignore - Handle JSONB format after migration
            const nameData = defaultPackage.name;
            const nameObj = typeof nameData === 'string' ? JSON.parse(nameData) : nameData;
            packageDisplayName = nameObj.ar || nameObj.en || 'الأساسية';
          } catch (e) {
            // @ts-ignore - Handle mixed types
            const nameData = defaultPackage.name;
            packageDisplayName = typeof nameData === 'string' ? nameData : 'الأساسية';
          }
          
          console.log('❌ Family limit exceeded:', { currentFamilyCount, maxFamilyTrees, packageDisplayName });
          toast({
            title: "تم الوصول للحد الأقصى",
            description: `لقد وصلت للحد الأقصى من أشجار العائلة (${maxFamilyTrees}) في باقة ${packageDisplayName}. يرجى ترقية باقتك لإنشاء المزيد من الأشجار.`,
            variant: "destructive"
          });
          return false;
        }

        return true;
      }

      // Get user's non-archived families count only
      console.log('📊 User has subscription, checking families for user:', userId);
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select('id, name, is_archived, archived_at')
        .eq('creator_id', userId)
        .eq('is_archived', false);

      // Also check all families to see what's happening
      const { data: allFamilies } = await supabase
        .from('families')
        .select('id, name, is_archived, archived_at')
        .eq('creator_id', userId);
      
      console.log('🔍 All families for user:', allFamilies);
      console.log('✅ Non-archived families for user:', families);

      if (familiesError) {
        console.error('❌ Error fetching families:', familiesError);
        toast({
          title: "خطأ",
          description: "حدث خطأ في التحقق من حدود الباقة",
          variant: "destructive"
        });
        return false;
      }

      const currentFamilyCount = families?.length || 0;
      const maxFamilyTrees = subscription.packages?.max_family_trees || 1;
      
      // Parse package name if it's JSON
      let packageDisplayName = 'الباقة الحالية';
      try {
        // @ts-ignore - Handle JSONB format after migration
        const nameData = subscription.packages?.name;
        const nameObj = typeof nameData === 'string' ? JSON.parse(nameData || '{}') : nameData || {};
        packageDisplayName = nameObj.ar || nameObj.en || 'الباقة الحالية';
      } catch (e) {
        // @ts-ignore - Handle mixed types
        const nameData = subscription.packages?.name;
        packageDisplayName = typeof nameData === 'string' ? nameData : 'الباقة الحالية';
      }

      console.log('📈 Family counts with subscription:', { 
        currentFamilyCount, 
        maxFamilyTrees, 
        packageDisplayName,
        familyIds: families?.map(f => f.id) 
      });

      if (currentFamilyCount >= maxFamilyTrees) {
        console.log('❌ Family limit exceeded with subscription:', { currentFamilyCount, maxFamilyTrees, packageDisplayName });
        toast({
          title: "تم الوصول للحد الأقصى",
          description: `لقد وصلت للحد الأقصى من أشجار العائلة (${maxFamilyTrees}) في ${packageDisplayName}. يرجى ترقية باقتك لإنشاء المزيد من الأشجار.`,
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
    setIsCreatingFamily(true);
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
      console.log('🔍 Checking family creation limits for user:', user.id);
      const canCreateFamily = await checkFamilyCreationLimits(user.id);
      if (!canCreateFamily) {
        console.log('❌ Cannot create family - limits exceeded');
        return; // Error message is shown in the function
      }
      console.log('✅ Can create family - proceeding with creation');

      // إنشاء العائلة
      console.log('📝 Creating new family with data:', { 
        name: treeData.name, 
        description: treeData.description,
        creator_id: user.id 
      });
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: treeData.name,
          description: treeData.description,
          creator_id: user.id
        })
        .select()
        .single();

      if (familyError) throw familyError;

      // إضافة المنشئ كعضو في العائلة
      console.log('Inserting family member for family:', family.id, 'user:', user.id);
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          role: 'creator'
        });

      if (memberError) {
        console.error('Error inserting family member:', memberError);
        throw memberError;
      }
      console.log('Family member inserted successfully');

      // إضافة المؤسس لشجرة العائلة
      console.log('Inserting founder for family:', family.id);
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

      if (founderError) {
        console.error('Error inserting founder:', founderError);
        throw founderError;
      }
      console.log('Founder inserted successfully:', founder);

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
    } finally {
      setIsCreatingFamily(false);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 dark:from-gray-950 dark:via-green-950 dark:to-emerald-950 relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
        </div>

        {/* Floating Animated Icons */}
        <div className="absolute top-32 right-20 animate-pulse">
          <Heart className="h-10 w-10 text-green-400 opacity-60" />
        </div>
        <div className="absolute bottom-40 left-20 animate-bounce">
          <Users className="h-12 w-12 text-emerald-400 opacity-40" />
        </div>
        <div className="absolute top-1/2 left-10 animate-pulse">
          <Star className="h-8 w-8 text-green-400 opacity-60" />
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 pt-24 relative z-10">
          {/* Hero Section with Dashboard Style */}
          {/* Header Section with Dashboard Style */}
          {/* Header section removed as requested */}
          
          {/* New Header Box */}
          <div className="mb-8">
            <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-6 shadow-2xl ring-1 ring-white/20 dark:ring-gray-500/20">
              <div className="flex items-center justify-between gap-8">
                {/* Right Side: Icon + Title + Description */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xl border-2 border-white/30 dark:border-gray-700/30">
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

                {/* Left Side: Step Progress */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      currentStep >= 1 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border border-gray-200/50'
                    }`}>
                      <span className="relative z-10">1</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">معلومات العائلة</span>
                  </div>
                  
                  <div className={`w-8 h-2 rounded-full transition-all duration-700 ${
                    currentStep >= 2 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-200/50 dark:bg-gray-700/50'
                  }`}></div>
                  
                  <div className="flex flex-col items-center">
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      currentStep >= 2 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105' 
                        : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border border-gray-200/50'
                    }`}>
                      <span className="relative z-10">2</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">بيانات المؤسس</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Step Content with Dashboard Style */}
          <div className="max-w-6xl mx-auto pb-8">
            {currentStep === 1 && (
              <div className="relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-amber-500/5 rounded-3xl blur-2xl"></div>
                
                <Card className="relative border-0 shadow-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl ring-1 ring-white/20 dark:ring-gray-500/20 overflow-hidden rounded-3xl">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500"></div>
                  
                  <CardContent className="p-0 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
                      {/* Left Side - Form with Creative Design */}
                      <div className="p-4 md:p-6 bg-gradient-to-br from-white/80 to-emerald-50/80 dark:from-gray-800/80 dark:to-emerald-900/20 relative overflow-hidden">
                        {/* Floating decoration elements */}
                        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-xl"></div>
                        <div className="absolute bottom-6 left-6 w-16 h-16 bg-gradient-to-tr from-amber-200/30 to-emerald-200/30 rounded-full blur-lg"></div>
                        
                        <div className="relative z-10 space-y-8">
                          <div className="text-center lg:text-right">
                            <div className="inline-flex items-center gap-3 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full mb-4">
                              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">الخطوة الأولى</span>
                            </div>
                            <h3 className="text-3xl font-bold mb-3">
                              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                                معلومات العائلة
                              </span>
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                              ابدأ رحلتك بتحديد هوية عائلتك الفريدة
                            </p>
                          </div>

                          <div className="space-y-6">
                            <div className="group">
                              <Label htmlFor="familyName" className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                                <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                اسم العائلة *
                              </Label>
                              <div className="relative">
                                <Input
                                  id="familyName"
                                  placeholder="مثال : السعيد"
                                  value={treeData.name}
                                  onChange={(e) => setTreeData({...treeData, name: e.target.value})}
                                  className="h-14 text-lg border-2 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12"
                                />
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">1</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="group">
                              <Label htmlFor="familyDescription" className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                                <div className="w-3 h-3 bg-gradient-to-r from-teal-500 to-amber-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                وصف العائلة (اختياري)
                              </Label>
                              <div className="relative">
                                <Textarea
                                  id="familyDescription"
                                  placeholder="شارك قصة عائلتك، تاريخها، أو أي تفاصيل مميزة تود الاحتفاظ بها..."
                                  value={treeData.description}
                                  onChange={(e) => setTreeData({...treeData, description: e.target.value})}
                                  className="min-h-[120px] text-lg border-2 border-teal-200/50 dark:border-teal-700/50 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12"
                                />
                                <div className="absolute right-4 top-4 w-6 h-6 bg-gradient-to-br from-teal-500 to-amber-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">2</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Motivational Content with Consistent Design */}
                      <div className="relative">
                        {/* Floating particles with consistent colors */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/80 rounded-full animate-float-up"></div>
                          <div className="absolute top-3/4 left-1/2 w-1 h-1 bg-emerald-300/60 rounded-full animate-float-up animation-delay-1000"></div>
                          <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-teal-300/60 rounded-full animate-float-up animation-delay-2000"></div>
                          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-amber-300/60 rounded-full animate-float-up animation-delay-3000"></div>
                          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-emerald-400/60 rounded-full animate-float-up animation-delay-4000"></div>
                        </div>

                        <div className="relative z-10 h-full flex flex-col justify-center">
                          {/* Elegant Light Design Container */}
                          <div className="relative max-w-4xl mx-auto">
                            {/* Soft Floating Elements */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              {/* Gentle Geometric Shapes */}
                              <div className="absolute top-16 left-12 w-24 h-24 border border-emerald-200/30 rounded-full animate-pulse"></div>
                              <div className="absolute top-32 right-20 w-16 h-16 border border-teal-200/40 rounded-lg transform rotate-45 animate-bounce"></div>
                              <div className="absolute bottom-24 left-16 w-20 h-20 border border-amber-200/35 rounded-full animate-pulse delay-1000"></div>
                              <div className="absolute bottom-40 right-16 w-12 h-12 bg-emerald-100/20 rounded-lg transform rotate-12 animate-float"></div>
                              
                              {/* Soft Gradient Orbs */}
                              <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-100/20 to-teal-100/20 rounded-full blur-xl animate-pulse"></div>
                              <div className="absolute bottom-1/3 left-1/3 w-28 h-28 bg-gradient-to-br from-teal-100/20 to-amber-100/20 rounded-full blur-xl animate-pulse delay-2000"></div>
                            </div>

                            {/* Pure Creative Design - No Background */}
                            <div className="relative max-w-xl mx-auto text-center space-y-8 py-8">
                              
                              {/* Creative Icon Section */}
                              <div className="relative group">
                                {/* Main Icon with Advanced Animation */}
                                <div className="relative mx-auto w-20 h-20">
                                  {/* Orbiting Rings */}
                                  <div className="absolute inset-0 border-2 border-emerald-300/20 rounded-full animate-spin-slow"></div>
                                  <div className="absolute inset-3 border border-teal-300/30 rounded-full animate-reverse-spin"></div>
                                  <div className="absolute inset-6 border border-amber-300/20 rounded-full animate-pulse"></div>
                                  
                                  {/* Central Icon */}
                                  <div className="absolute inset-7 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-700 group-hover:rotate-12">
                                    <TreePine className="h-6 w-6 text-white drop-shadow-xl" />
                                  </div>
                                  
                                  {/* Glowing Effect */}
                                  <div className="absolute inset-7 bg-gradient-to-br from-emerald-400/40 via-teal-400/40 to-amber-400/40 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-all duration-700"></div>
                                  
                                  {/* Floating Particles */}
                                  <div className="absolute top-0 left-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-bounce transform -translate-x-1/2 shadow-lg"></div>
                                  <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-500 transform -translate-x-1/2 shadow-lg"></div>
                                  <div className="absolute left-0 top-1/2 w-1 h-1 bg-amber-400 rounded-full animate-bounce delay-1000 transform -translate-y-1/2 shadow-lg"></div>
                                  <div className="absolute right-0 top-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-300 transform -translate-y-1/2 shadow-lg"></div>
                                </div>
                                
                                {/* Magical Sparkles */}
                                <div className="absolute -top-4 -right-4">
                                  <div className="w-4 h-4 text-amber-400 animate-pulse">✨</div>
                                </div>
                                <div className="absolute -bottom-4 -left-4">
                                  <div className="w-3 h-3 text-emerald-400 animate-pulse delay-700">✨</div>
                                </div>
                              </div>

                              {/* Elegant Typography Section */}
                              <div className="space-y-4">
                                <div className="space-y-6">
                                  {/* Main Title */}
                                  <h3 className="text-3xl md:text-4xl font-bold leading-none">
                                    <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                                      رحلة الذكريات
                                    </span>
                                  </h3>
                                  
                                  {/* Subtitle */}
                                  <div className="relative">
                                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 font-light leading-relaxed max-w-2xl mx-auto">
                                      ابدأ في كتابة تاريخ عائلتك وصنع إرث يدوم للأبد
                                    </p>
                                    
                                    {/* Decorative Line */}
                                    <div className="flex justify-center mt-6">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-px bg-emerald-400"></div>
                                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                                        <div className="w-12 h-px bg-gradient-to-r from-teal-400 to-amber-400"></div>
                                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                        <div className="w-8 h-px bg-amber-400"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Creative Feature Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-8">
                                {[
                                  { 
                                    icon: Heart, 
                                    title: "ذكريات خالدة", 
                                    desc: "احفظ قصص عائلتك",
                                    color: "emerald",
                                    delay: "0"
                                  },
                                  { 
                                    icon: Users, 
                                    title: "روابط قوية", 
                                    desc: "اربط بين الأجيال بحب",
                                    color: "teal",
                                    delay: "200"
                                  },
                                  { 
                                    icon: Star, 
                                    title: "إرث مضيء", 
                                    desc: "اترك بصمة جميلة دائمة",
                                    color: "amber",
                                    delay: "400"
                                  }
                                ].map((item, index) => (
                                  <div key={index} className="group relative" style={{ animationDelay: `${item.delay}ms` }}>
                                    {/* Floating Card */}
                                    <div className="relative transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
                                      {/* Card Container */}
                                      <div className={`relative bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 dark:from-${item.color}-900/20 dark:to-${item.color}-800/20 rounded-xl p-3 shadow-md group-hover:shadow-lg transition-all duration-500 border border-${item.color}-200/50 dark:border-${item.color}-300/20`}>
                                        
                                        {/* Icon with Glow */}
                                        <div className="relative mb-2">
                                          <div className={`mx-auto w-10 h-10 bg-gradient-to-br from-${item.color}-400 to-${item.color}-600 rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500`}>
                                            <item.icon className="h-5 w-5 text-white drop-shadow-lg" />
                                          </div>
                                          {/* Glow Effect */}
                                          <div className={`absolute inset-0 bg-${item.color}-400/30 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
                                        </div>
                                        
                                        {/* Text Content */}
                                        <div className="space-y-2">
                                          <h4 className={`font-bold text-${item.color}-700 dark:text-${item.color}-300 text-base leading-tight`}>
                                            {item.title}
                                          </h4>
                                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                                            {item.desc}
                                          </p>
                                        </div>
                                        
                                        {/* Decorative Corner */}
                                        <div className={`absolute top-4 right-4 w-3 h-3 bg-${item.color}-300 rounded-full opacity-50`}></div>
                                        
                                        {/* Bottom Accent */}
                                        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${item.color}-400 to-${item.color}-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
                                      </div>
                                      
                                      {/* Shadow */}
                                      <div className={`absolute inset-0 bg-${item.color}-200/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10 transform translate-y-4`}></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-12">
                {/* Combined Information and Wives Card */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-pink-500/5 rounded-3xl blur-2xl"></div>
                  
                  <Card className="relative border-0 shadow-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl ring-1 ring-white/20 dark:ring-gray-500/20 overflow-hidden rounded-3xl">
                    <div className="absolute top-0 left-0 w-1/2 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500"></div>
                    <div className="absolute top-0 right-0 w-1/2 h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500"></div>
                    
                    <CardHeader className="text-center pb-6 relative">
                      <CardTitle className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-4 relative z-10 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                          <UserPlus className="h-6 w-6 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-pink-600 bg-clip-text text-transparent">
                          معلومات المؤسس والزوجات
                        </span>
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Heart className="h-6 w-6 text-white" />
                        </div>
                      </CardTitle>
                      
                      <CardDescription className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                        أدخل معلومات مؤسس العائلة وأضف الزوجات إذا لزم الأمر
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-6 md:p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Right Side - Founder Information */}
                        <div className="order-2 lg:order-1">
                          <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/50 mb-4">
                            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mb-4 flex items-center gap-2">
                              <UserPlus className="h-5 w-5" />
                              معلومات المؤسس
                            </h3>
                          </div>
                          
                          <div className="space-y-6">
                            {/* Top Row - Essential Info */}
                            <div className="grid grid-cols-1 gap-4">
                              {/* Name */}
                              <div className="group">
                                <Label htmlFor="founderName" className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                  الاسم الأول * 
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    (عائلة: {treeData.name})
                                  </span>
                                </Label>
                                <div className="relative">
                                  <Input
                                    id="founderName"
                                    placeholder={`الاسم الأول فقط`}
                                    value={founderData.name}
                                    onChange={(e) => {
                                      setFounderData({...founderData, name: e.target.value});
                                    }}
                                    className="h-12 border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl pl-4"
                                  />
                                  {founderData.name && (
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                                      {treeData.name}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Compact Row - Birth Date, Status, Death Date */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Birth Date */}
                                <div className="group">
                                  <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                    تاريخ الميلاد
                                  </Label>
                                  <EnhancedDatePicker
                                    value={founderData.birthDate}
                                    onChange={(date) => setFounderData({...founderData, birthDate: date})}
                                    placeholder="تاريخ الميلاد"
                                  />
                                </div>

                                {/* Status */}
                                <div className="group">
                                  <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    الحالة
                                  </Label>
                                  <Select value={founderData.isAlive ? "alive" : "deceased"} onValueChange={(value) => setFounderData({...founderData, isAlive: value === "alive"})}>
                                    <SelectTrigger className="h-12 border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="alive">على قيد الحياة</SelectItem>
                                      <SelectItem value="deceased">متوفى</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Death Date (conditional) */}
                                {!founderData.isAlive && (
                                  <div className="group">
                                    <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                      تاريخ الوفاة
                                    </Label>
                                    <EnhancedDatePicker
                                      value={founderData.deathDate}
                                      onChange={(date) => setFounderData({...founderData, deathDate: date})}
                                      placeholder="تاريخ الوفاة"
                                      className="hover:border-red-500 focus:ring-red-500/20"
                                      disableFuture={true}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Image Upload - Compact Card */}
                            <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-700/50">
                              <Label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-3">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                صورة المؤسس (اختياري)
                              </Label>
                              <div className="flex items-center gap-4">
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
                                <Label htmlFor="founder-image" className="cursor-pointer flex-1">
                                  <div className="group flex items-center gap-3 px-4 py-3 border-2 border-dashed border-amber-300/50 rounded-xl hover:bg-amber-100/50 dark:hover:bg-amber-900/30 hover:border-amber-500 transition-all duration-300">
                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                      <Upload className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">اختر صورة</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG أو GIF</p>
                                    </div>
                                  </div>
                                </Label>
                                {founderData.croppedImage && (
                                  <div className="relative group">
                                    <img 
                                      src={founderData.croppedImage} 
                                      alt="صورة المؤسس" 
                                      className="w-16 h-16 rounded-lg object-cover border-2 border-amber-300 dark:border-amber-600 group-hover:scale-105 transition-transform" 
                                    />
                                    <button
                                      onClick={() => setFounderData({...founderData, croppedImage: null, image: null})}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform text-xs"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Biography - Compact Card */}
                            <div className="bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-teal-200/50 dark:border-teal-700/50">
                              <Label htmlFor="founderBio" className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-3">
                                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                                السيرة الذاتية (اختياري)
                              </Label>
                              <Textarea
                                id="founderBio"
                                placeholder="معلومات عن المؤسس، إنجازاته، مهنته، قصص مميزة..."
                                value={founderData.bio}
                                onChange={(e) => setFounderData({...founderData, bio: e.target.value})}
                                className="min-h-[120px] border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Left Side - Wives Section */}
                        <div className="order-2 lg:order-2">
                          <div className="bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-4 border border-pink-200/50 dark:border-pink-700/50 mb-4">
                            <h3 className="text-lg font-bold text-pink-700 dark:text-pink-300 mb-2 flex items-center gap-2">
                              <Heart className="h-5 w-5" />
                              الزوجات (اختياري)
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                              لا يمكنك اضافة أولاد لهذه العائلة اذا لم يتم إضافة زوجة للفرد الأول في الأسرة
                            </p>
                          </div>
                          
                          <div className="space-y-4">
                            {wives.length > 0 && (
                              <div className="space-y-4 mb-6">
                                {wives.map((wife, index) => (
                                  <div key={wife.id} className="group p-4 bg-gradient-to-br from-rose-50/80 to-pink-50/80 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200/50 dark:border-rose-700/50 hover:border-rose-400/50 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{wife.name}</h4>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl">
                                            <MoreVertical className="h-4 w-4" />
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
                                     <div className="space-y-2">
                                       <div className="flex flex-wrap gap-2">
                                         <p className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${wife.isAlive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'}`}>
                                           {wife.isAlive ? "على قيد الحياة" : "متوفاة"}
                                         </p>
                                         <p className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
                                            wife.maritalStatus === 'married' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            wife.maritalStatus === 'divorced' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                         }`}>
                                           {wife.maritalStatus === 'married' ? 'متزوجة' : 
                                            wife.maritalStatus === 'divorced' ? 'مطلقة' : 'أرملة'}
                                         </p>
                                       </div>
                                       {wife.birthDate && (
                                         <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                           <div className="w-1.5 h-1.5 bg-rose-400 rounded-full"></div>
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
                              className="w-full h-16 border-2 border-dashed border-rose-300/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-500 transition-all duration-300 group rounded-xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                  <Plus className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">إضافة زوجة جديدة</span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Enhanced Navigation Buttons */}
            <div className="flex justify-between items-center mt-6 sm:mt-8 gap-3 sm:gap-4 md:gap-6">
              <Button
                onClick={handlePrevStep}
                variant="outline"
                className="h-10 sm:h-12 md:h-16 px-4 sm:px-6 md:px-10 text-sm sm:text-base md:text-lg border-2 border-gray-200/50 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              >
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 sm:mr-3" />
                {currentStep === 1 ? "العودة للوحة التحكم" : "السابق"}
              </Button>
              
              <Button
                onClick={(e) => {
                  console.log('Button clicked!', e);
                  handleNextStep();
                }}
                disabled={isCreatingFamily}
                className="h-10 sm:h-12 md:h-16 px-6 sm:px-10 md:px-16 text-sm sm:text-base md:text-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-2xl rounded-xl sm:rounded-2xl text-white font-bold relative z-50 pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ pointerEvents: 'auto' }}
              >
                {currentStep === 1 ? "التالي" : (isCreatingFamily ? "جاري إنشاء العائلة..." : "إنشاء العائلة")}
                {currentStep === 1 && <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ml-2 sm:ml-3" />}
                {currentStep === 2 && !isCreatingFamily && <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ml-2 sm:ml-3" />}
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

      {/* Creative Add Wife Modal */}
      <Dialog open={isAddingWife} onOpenChange={setIsAddingWife}>
        <DialogContent className="max-w-xl border-0 bg-gradient-to-br from-green-50/90 via-emerald-50/90 to-teal-50/90 dark:from-green-950/90 dark:via-emerald-950/90 dark:to-teal-950/90 backdrop-blur-xl shadow-2xl">
          {/* Decorative Header */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
          
          <DialogHeader className="text-center pb-4 relative flex flex-col items-center justify-center">
            {/* Floating Hearts Animation */}
            <div className="absolute -top-2 -right-2 w-8 h-8 animate-pulse">
              <Heart className="h-full w-full text-pink-400 opacity-60" />
            </div>
            <div className="absolute -top-1 -left-3 w-6 h-6 animate-bounce">
              <Heart className="h-full w-full text-rose-400 opacity-40" />
            </div>
            
            {/* Elegant Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white/20 dark:border-gray-700/20">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              إضافة زوجة جديدة
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
              أضف معلومات الزوجة لإدراجها في سجل العائلة
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 bg-white/40 dark:bg-gray-800/40 rounded-xl backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
            <WifeForm
              ref={wifeFormRef}
              onAddWife={(wifeData) => {
                const newWife = {
                  id: crypto.randomUUID(),
                  name: wifeData.name,
                  isAlive: wifeData.isAlive,
                  birthDate: wifeData.birthDate,
                  deathDate: wifeData.deathDate,
                  maritalStatus: wifeData.maritalStatus
                };
                setWives([...wives, newWife]);
                setIsAddingWife(false);
                toast({
                  title: "تم إضافة الزوجة بنجاح",
                  description: `تم إضافة ${wifeData.name} إلى قائمة الزوجات`,
                  duration: 3000
                });
              }}
            />
          </div>
          
          <DialogFooter className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsAddingWife(false)}
              className="flex-1 border-2 border-gray-300/50 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-300"
            >
              إلغاء
            </Button>
            <Button 
              onClick={() => {
                if (wifeFormRef.current?.isValid()) {
                  wifeFormRef.current?.handleSubmit();
                }
              }}
              className="flex-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <Heart className="h-4 w-4 mr-2" />
              إضافة الزوجة
            </Button>
          </DialogFooter>
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
        <DialogContent className="max-w-lg border-0 bg-gradient-to-br from-emerald-50/90 via-green-50/90 to-teal-50/90 dark:from-emerald-950/90 dark:via-green-950/90 dark:to-teal-950/90 backdrop-blur-xl shadow-2xl">
          {/* Decorative Header */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
          
          <DialogHeader className="text-center pb-6 relative">
            {/* Floating Success Animation */}
            <div className="absolute -top-2 -right-2 w-6 h-6 animate-bounce">
              <CheckCircle className="h-full w-full text-emerald-400 opacity-60" />
            </div>
            <div className="absolute -top-1 -left-3 w-4 h-4 animate-pulse">
              <CheckCircle className="h-full w-full text-green-400 opacity-40" />
            </div>
            
            {/* Success Icon with Animation */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20 dark:border-gray-700/20 animate-scale-in">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                {/* Ripple Effect */}
                <div className="absolute inset-0 w-20 h-20 bg-emerald-400/30 rounded-full animate-ping"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full border-3 border-white dark:border-gray-800 flex items-center justify-center animate-bounce">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              </div>
            </div>
            
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent animate-fade-in text-center">
              🎉 تم إنشاء العائلة بنجاح!
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-4 text-lg animate-fade-in">
              تم حفظ بيانات شجرة العائلة بنجاح في قاعدة البيانات
            </DialogDescription>
          </DialogHeader>
          
          {/* Main Question Section */}
          <div className="p-6 bg-white/40 dark:bg-gray-800/40 rounded-xl backdrop-blur-sm border border-white/30 dark:border-gray-600/30 mb-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-foreground">
                هل ترغب بإضافة أفراد للأسرة الآن ام تخطي هذه الخطوة؟
              </h3>
              
              <p className="text-sm text-muted-foreground bg-green-50/50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200/30 dark:border-green-700/30">
                علماً أنه يمكنك إضافتهم لاحقاً من خلال لوحة التحكم
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <DialogFooter className="flex gap-4 pt-4">
            <Button
              onClick={handleSkipTodashboard}
              variant="outline"
              className="flex-1 h-12 border-2 border-gray-300/50 hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-300 text-lg"
            >
              تخطي الآن
            </Button>
            <Button
              onClick={handleAddMoreMembers}
              className="flex-1 h-12 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg text-lg font-semibold"
            >
              <Users className="h-5 w-5 mr-2" />
              إضافة أفراد الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
      <LuxuryFooter />
    </>
  );
};

export default FamilyCreator;