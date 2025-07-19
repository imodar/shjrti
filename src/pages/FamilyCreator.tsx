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
import { TreePine, ArrowRight, ArrowLeft, Users, Heart, UserPlus, CheckCircle, Plus, CalendarIcon, Upload, X, MoreVertical, Edit, Trash2 } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 relative overflow-hidden">
        {/* Luxury Background Elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-primary/10 via-secondary/8 to-accent/5 rounded-full blur-3xl animate-pulse opacity-60"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-tr from-accent/8 via-secondary/10 to-primary/5 rounded-full blur-2xl animate-pulse opacity-40"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-secondary/5 via-primary/8 to-accent/3 rounded-full blur-3xl animate-pulse opacity-30"></div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                  <TreePine className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">
              إنشاء شجرة العائلة
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              ابدأ رحلتك في بناء تاريخ عائلتك وحفظ ذكرياتك للأجيال القادمة
            </p>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                currentStep >= 1 
                  ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg' 
                  : 'bg-muted text-muted-foreground border border-border'
              }`}>
                1
              </div>
              <div className={`w-12 h-1 rounded-full transition-all ${currentStep >= 2 ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-border'}`}></div>
              <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                currentStep >= 2 
                  ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg' 
                  : 'bg-muted text-muted-foreground border border-border'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="max-w-4xl mx-auto">
            {currentStep === 1 && (
              <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
                <CardHeader className="text-center pb-8 border-b border-border/50">
                  <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    معلومات العائلة
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    أدخل المعلومات الأساسية لشجرة العائلة الجديدة
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="familyName" className="text-base font-semibold">اسم العائلة *</Label>
                    <Input
                      id="familyName"
                      placeholder="مثال: عائلة الأحمد"
                      value={treeData.name}
                      onChange={(e) => setTreeData({...treeData, name: e.target.value})}
                      className="h-12 text-base border-2 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="familyDescription" className="text-base font-semibold">وصف العائلة (اختياري)</Label>
                    <Textarea
                      id="familyDescription"
                      placeholder="وصف مختصر عن تاريخ العائلة أو أي معلومات إضافية..."
                      value={treeData.description}
                      onChange={(e) => setTreeData({...treeData, description: e.target.value})}
                      className="min-h-[120px] text-base border-2 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                {/* Founder Information */}
                <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
                  <CardHeader className="text-center pb-6 border-b border-border/50">
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
                      <UserPlus className="h-6 w-6 text-primary" />
                      معلومات مؤسس العائلة
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      أدخل معلومات الشخص الذي ستبدأ منه شجرة العائلة
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="founderName" className="text-base font-semibold">الاسم الكامل *</Label>
                        <Input
                          id="founderName"
                          placeholder="الاسم الكامل للمؤسس"
                          value={founderData.name}
                          onChange={(e) => setFounderData({...founderData, name: e.target.value})}
                          className="h-12 text-base border-2 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">الجنس *</Label>
                        <Select value={founderData.gender} onValueChange={(value) => setFounderData({...founderData, gender: value})}>
                          <SelectTrigger className="h-12 text-base border-2">
                            <SelectValue placeholder="اختر الجنس" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">ذكر</SelectItem>
                            <SelectItem value="female">أنثى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Birth Date */}
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">تاريخ الميلاد</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-12 text-base border-2 justify-start text-left font-normal w-full",
                                !founderData.birthDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
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
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">الحالة</Label>
                        <Select value={founderData.isAlive ? "alive" : "deceased"} onValueChange={(value) => setFounderData({...founderData, isAlive: value === "alive"})}>
                          <SelectTrigger className="h-12 text-base border-2">
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
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-base font-semibold">تاريخ الوفاة</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-12 text-base border-2 justify-start text-left font-normal w-full",
                                  !founderData.deathDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
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
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="founderBio" className="text-base font-semibold">السيرة الذاتية (اختياري)</Label>
                        <Textarea
                          id="founderBio"
                          placeholder="معلومات عن المؤسس، إنجازاته، مهنته، أو أي معلومات مهمة..."
                          value={founderData.bio}
                          onChange={(e) => setFounderData({...founderData, bio: e.target.value})}
                          className="min-h-[120px] text-base border-2 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-base font-semibold">صورة المؤسس (اختياري)</Label>
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
                          <Label htmlFor="founder-image" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-lg hover:bg-accent/50 transition-colors">
                              <Upload className="h-4 w-4" />
                              <span>اختر صورة</span>
                            </div>
                          </Label>
                          {founderData.croppedImage && (
                            <div className="relative">
                              <img src={founderData.croppedImage} alt="صورة المؤسس" className="w-16 h-16 rounded-lg object-cover border-2 border-border" />
                              <button
                                onClick={() => setFounderData({...founderData, croppedImage: null, image: null})}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Wives Section */}
                <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
                  <CardHeader className="text-center pb-6 border-b border-border/50">
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
                      <Heart className="h-6 w-6 text-primary" />
                      الزوجات (اختياري)
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      أضف معلومات الزوجات إذا كان لدى المؤسس أكثر من زوجة
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    {wives.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {wives.map((wife, index) => (
                          <div key={wife.id} className="p-4 bg-accent/50 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-foreground">{wife.name}</h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
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
                            <p className="text-sm text-muted-foreground">
                              {wife.isAlive ? "على قيد الحياة" : "متوفاة"}
                            </p>
                            {wife.birthDate && (
                              <p className="text-sm text-muted-foreground">
                                مولودة: {format(wife.birthDate, "dd/MM/yyyy", { locale: ar })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Button
                      onClick={() => setIsAddingWife(true)}
                      variant="outline"
                      className="w-full h-12 border-2 border-dashed hover:bg-accent/50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة زوجة
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-12">
              <Button
                onClick={handlePrevStep}
                variant="outline"
                disabled={currentStep === 1}
                className="h-12 px-8 text-base"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                السابق
              </Button>
              
              <Button
                onClick={handleNextStep}
                className="h-12 px-8 text-base bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {currentStep === 1 ? "التالي" : "إنشاء العائلة"}
                {currentStep === 1 && <ArrowLeft className="h-4 w-4 ml-2" />}
                {currentStep === 2 && <CheckCircle className="h-4 w-4 ml-2" />}
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