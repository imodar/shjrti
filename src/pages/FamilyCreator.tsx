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
import { TreePine, ArrowRight, ArrowLeft, Users, Heart, UserPlus, CheckCircle, Plus, CalendarIcon, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SharedFooter } from "@/components/SharedFooter";
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

      setShowSuccessModal(true);
      
      toast({
        title: "تم إنشاء العائلة بنجاح",
        description: "تم حفظ بيانات العائلة في قاعدة البيانات"
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
    <div className="min-h-screen bg-background">
      
      {/* Header - matching FamilyBuilder */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                <TreePine className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">إنشاء شجرة العائلة</h1>
                <p className="text-sm text-muted-foreground">ابدأ رحلتك في بناء تاريخ عائلتك</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <div className={`w-6 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float-slow"></div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Page Title - Compact Header */}
            <div className="text-center mb-8 relative">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 backdrop-blur-lg border border-primary/20 rounded-full px-6 py-3 mb-6">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-primary font-medium text-sm">إنشاء شجرة العائلة</span>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 relative">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  ابدأ رحلة
                </span>
                <br />
                <span className="text-foreground">تاريخ عائلتك</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                اصنع ذكريات تدوم للأبد واحفظ تاريخ عائلتك للأجيال القادمة
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-start">
              
              {/* Left Side - Interactive Form */}
              <div className="order-2 lg:order-1 space-y-8">
                
                {currentStep === 1 && (
                  <div className="space-y-8">
                    
                    {/* Welcome Card */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                      <Card className="relative bg-card/80 backdrop-blur-xl border-border/50 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary"></div>
                        <CardHeader className="pb-8 pt-10">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                              <TreePine className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl font-bold text-foreground">معلومات العائلة</CardTitle>
                              <CardDescription className="text-muted-foreground mt-1">
                                الخطوة الأولى لبناء شجرة عائلتك
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-8 pb-10">
                          
                          {/* Family Name Input */}
                          <div className="space-y-4">
                            <Label htmlFor="family-name" className="text-lg font-medium text-foreground flex items-center gap-3">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              اسم العائلة
                            </Label>
                            <div className="relative group">
                              <Input
                                id="family-name"
                                value={treeData.name}
                                onChange={(e) => setTreeData({...treeData, name: e.target.value})}
                                placeholder="مثال: عائلة الأحمد"
                                className="h-14 text-lg bg-background border-2 border-input rounded-xl font-arabic transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                            </div>
                          </div>
                          
                          {/* Family Description */}
                          <div className="space-y-4">
                            <Label htmlFor="family-description" className="text-lg font-medium text-foreground flex items-center gap-3">
                              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                              وصف العائلة (اختياري)
                            </Label>
                            <div className="relative group">
                              <Textarea
                                id="family-description"
                                value={treeData.description}
                                onChange={(e) => setTreeData({...treeData, description: e.target.value})}
                                placeholder="اكتب وصفاً موجزاً عن تاريخ عائلتك..."
                                className="min-h-[120px] text-base bg-background border-2 border-input rounded-xl resize-none font-arabic transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
                                rows={4}
                              />
                              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                            </div>
                          </div>

                          {/* Next Button - Enhanced */}
                          <div className="pt-4">
                            <Button 
                              onClick={handleNextStep}
                              className="w-full h-16 bg-gradient-to-r from-primary via-accent to-primary bg-size-200 hover:bg-pos-100 text-white font-semibold rounded-2xl text-lg shadow-2xl hover:shadow-3xl transition-all duration-500 relative overflow-hidden group"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                              <div className="relative flex items-center justify-center gap-3">
                                <span>المتابعة للخطوة التالية</span>
                                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
                              </div>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                    
                    {/* Founder Form - Enhanced */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                      <Card className="relative bg-card/80 backdrop-blur-xl border-border/50 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary"></div>
                        <CardHeader className="pb-8 pt-10">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl font-bold text-foreground">بيانات مؤسس الشجرة</CardTitle>
                              <CardDescription className="text-muted-foreground mt-1">
                                أدخل معلومات الشخص الذي ستبدأ منه الشجرة
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pb-10">
                          
                          {/* Basic Info - Compressed */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Founder Name */}
                            <div className="space-y-3">
                              <Label htmlFor="founder-name" className="text-sm font-medium text-foreground flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                اسم المؤسس *
                              </Label>
                              <Input
                                id="founder-name"
                                value={founderData.name}
                                onChange={(e) => setFounderData({...founderData, name: e.target.value})}
                                placeholder="أدخل اسم المؤسس"
                                className="h-12 rounded-xl bg-background border-2 border-input font-arabic transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
                              />
                            </div>
                            
                            {/* Gender Selection */}
                            <div className="space-y-3">
                              <Label htmlFor="founder-gender" className="text-sm font-medium text-foreground flex items-center gap-2">
                                <div className="w-2 h-2 bg-accent rounded-full"></div>
                                الجنس *
                              </Label>
                              <Select value={founderData.gender} onValueChange={(value) => setFounderData({...founderData, gender: value})}>
                                <SelectTrigger className="h-12 rounded-xl bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300">
                                  <SelectValue placeholder="اختر الجنس" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/50 bg-card/95 backdrop-blur-xl">
                                  <SelectItem value="male" className="rounded-lg hover:bg-primary/10 focus:bg-primary/10">
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                      ذكر
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="female" className="rounded-lg hover:bg-accent/10 focus:bg-accent/10">
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                                      أنثى
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Birth Date & Living Status */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Birth Date */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-primary" />
                                تاريخ الميلاد
                              </Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full h-12 rounded-xl bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 justify-start text-right font-arabic",
                                      !founderData.birthDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="ml-auto h-4 w-4" />
                                    {founderData.birthDate ? (
                                      format(founderData.birthDate, "PPP", { locale: ar })
                                    ) : (
                                      <span>اختر تاريخ الميلاد</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border/50" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={founderData.birthDate}
                                    onSelect={(date) => setFounderData({...founderData, birthDate: date})}
                                    disabled={(date) => date > new Date() || date < new Date("1800-01-01")}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            {/* Death Date - Only show if not alive */}
                            {!founderData.isAlive ? (
                              <div className="space-y-3">
                                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                  تاريخ الوفاة
                                </Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full h-12 rounded-xl bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 justify-start text-right font-arabic",
                                        !founderData.deathDate && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="ml-auto h-4 w-4" />
                                      {founderData.deathDate ? (
                                        format(founderData.deathDate, "PPP", { locale: ar })
                                      ) : (
                                        <span>اختر تاريخ الوفاة</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border/50" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={founderData.deathDate}
                                      onSelect={(date) => setFounderData({...founderData, deathDate: date})}
                                      disabled={(date) => 
                                        date > new Date() || 
                                        (founderData.birthDate && date < founderData.birthDate)
                                      }
                                      initialFocus
                                      className="p-3 pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            ) : (
                              <div></div>
                            )}
                          </div>

                          {/* Living Status */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                              <div className="w-2 h-2 bg-secondary rounded-full"></div>
                              الحالة الحيوية
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                              <Button
                                type="button"
                                variant={founderData.isAlive ? "default" : "outline"}
                                onClick={() => setFounderData({...founderData, isAlive: true, deathDate: null})}
                                className={cn(
                                  "h-12 rounded-xl font-arabic transition-all duration-300",
                                  founderData.isAlive 
                                    ? "bg-primary text-white shadow-lg" 
                                    : "bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                )}
                              >
                                <Heart className="h-4 w-4 ml-2" />
                                على قيد الحياة
                              </Button>
                              <Button
                                type="button"
                                variant={!founderData.isAlive ? "default" : "outline"}
                                onClick={() => setFounderData({...founderData, isAlive: false})}
                                className={cn(
                                  "h-12 rounded-xl font-arabic transition-all duration-300",
                                  !founderData.isAlive 
                                    ? "bg-destructive text-destructive-foreground shadow-lg" 
                                    : "bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                )}
                              >
                                متوفى
                              </Button>
                            </div>
                          </div>

                          {/* Marriage Management */}
                          {founderData.gender === 'male' && (
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Heart className="h-4 w-4 text-accent" />
                                إدارة الزوجات
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowWivesModal(true)}
                                className="w-full h-12 rounded-xl bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 font-arabic transition-all duration-300 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                                    <Users className="h-4 w-4 text-accent" />
                                  </div>
                                  <span>
                                    {wives.length === 0 
                                      ? 'إضافة الزوجات' 
                                      : `الزوجات (${wives.length})`
                                    }
                                  </span>
                                </div>
                                <ArrowLeft className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          {/* Profile Image & Bio - Side by side */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Profile Image */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Upload className="h-4 w-4 text-accent" />
                                صورة شخصية
                              </Label>
                              <div className="flex flex-col items-center gap-3">
                                {founderData.croppedImage ? (
                                  <div className="relative group">
                                    <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                                      <img 
                                        src={founderData.croppedImage} 
                                        alt="معاينة الصورة" 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setFounderData({...founderData, croppedImage: null, image: null})}
                                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors duration-300">
                                    <Upload className="h-6 w-6" />
                                  </div>
                                )}
                                
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById('founder-image-input')?.click()}
                                  className="h-9 px-4 rounded-lg bg-muted/30 border-2 border-transparent hover:bg-background/60 font-arabic text-xs"
                                >
                                  <Upload className="h-3 w-3 ml-1" />
                                  {founderData.croppedImage ? 'تغيير' : 'رفع'}
                                </Button>
                                
                                <input
                                  id="founder-image-input"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const file = e.target.files[0];
                                      setFounderData({...founderData, image: file});
                                      
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        if (event.target?.result) {
                                          setCropImage(event.target.result as string);
                                          setShowCropModal(true);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </div>
                            </div>

                            {/* Biography */}
                            <div className="md:col-span-2 space-y-3">
                              <Label htmlFor="founder-bio" className="text-sm font-medium text-foreground flex items-center gap-2">
                                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                                نبذة عن المؤسس (اختياري)
                              </Label>
                              <Textarea
                                id="founder-bio"
                                value={founderData.bio}
                                onChange={(e) => setFounderData({...founderData, bio: e.target.value})}
                                placeholder="اكتب نبذة مختصرة عن حياة المؤسس..."
                                className="min-h-[120px] text-sm bg-muted/30 border-2 border-transparent rounded-xl resize-none font-arabic transition-all duration-300 focus:border-primary/50 focus:bg-background/80 hover:bg-background/60"
                                rows={4}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Navigation - Enhanced */}
                    <div className="flex gap-6">
                      <Button
                        variant="outline"
                        onClick={handlePrevStep}
                        className="flex-1 h-16 rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/50 hover:border-primary/30 transition-all duration-300"
                      >
                        <ArrowLeft className="h-5 w-5 ml-2" />
                        السابق
                      </Button>
                      
                      <Button
                        onClick={handleNextStep}
                        className="flex-1 h-16 bg-gradient-to-r from-primary via-accent to-primary bg-size-200 hover:bg-pos-100 text-white rounded-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-500 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <div className="relative flex items-center justify-center gap-3">
                          <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                          <span>إنشاء الشجرة</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Enhanced Welcome Section */}
              <div className="order-1 lg:order-2 text-center">
                <div className="relative perspective-1000">
                  
                  {/* 3D Tree Icon Circle with Animation */}
                  <div className="w-80 h-80 mx-auto mb-16 relative preserve-3d">
                    {/* Background Glow Effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute inset-4 bg-gradient-to-tr from-accent/40 via-primary/30 to-secondary/40 rounded-full blur-2xl animate-float"></div>
                    
                    {/* Main Circle */}
                    <div className="relative w-full h-full bg-gradient-to-br from-primary via-accent to-secondary rounded-full flex items-center justify-center shadow-2xl transform rotate-y-12 hover:rotate-y-0 transition-transform duration-700 group">
                      <div className="absolute inset-2 bg-gradient-to-tr from-white/10 to-white/5 rounded-full"></div>
                      <TreePine className="h-32 w-32 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
                      
                      {/* Floating Elements */}
                      <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg animate-float">
                        <span className="text-white text-sm">🌟</span>
                      </div>
                      <div className="absolute -bottom-6 -left-6 w-10 h-10 bg-secondary rounded-full flex items-center justify-center shadow-lg animate-float-delayed">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute top-1/2 -right-8 w-6 h-6 bg-primary rounded-full animate-float-slow opacity-80"></div>
                    </div>
                  </div>

                  {/* Enhanced Welcome Content */}
                  <div className="space-y-10">
                    
                    {/* Welcome Header */}
                    <div className="relative">
                      <div className="inline-flex items-center gap-4 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 backdrop-blur-lg border border-primary/20 rounded-full px-8 py-4 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center animate-spin-slow">
                          <span className="text-2xl">🌳</span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">ابدأ رحلتك</h2>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="relative">
                      <p className="text-xl text-muted-foreground leading-relaxed max-w-md mx-auto">
                        ستكون هذه بداية شجرة عائلتك الرقمية التي ستحتفظ بذكريات أجيال عديدة
                      </p>
                      
                      {/* Decorative Lines */}
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
                    </div>
                    
                    {/* Feature Icons */}
                    <div className="grid grid-cols-3 gap-8 pt-8">
                      <div className="text-center group">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">إضافة الأفراد</p>
                      </div>
                      
                      <div className="text-center group">
                        <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                          <Heart className="h-8 w-8 text-accent" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">حفظ الذكريات</p>
                      </div>
                      
                      <div className="text-center group">
                        <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                          <TreePine className="h-8 w-8 text-secondary" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">بناء الشجرة</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">تم إنشاء الشجرة بنجاح!</DialogTitle>
            <DialogDescription>
              تم حفظ شجرة العائلة بنجاح. يمكنك الآن إضافة المزيد من الأفراد أو العودة للوحة التحكم.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleSkipTodashboard}>
              العودة للوحة التحكم
            </Button>
            <Button onClick={handleAddMoreMembers} className="gap-2">
              <UserPlus className="h-4 w-4" />
              إضافة أفراد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">قص الصورة</DialogTitle>
            <DialogDescription className="text-center">
              اضبط الصورة كما تريد ثم اضغط حفظ
            </DialogDescription>
          </DialogHeader>
          
          {cropImage && (
            <div className="relative h-96 w-full">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            </div>
          )}
          
          <DialogFooter className="flex gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCropModal(false);
                setCropImage(null);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setCroppedAreaPixels(null);
              }}
            >
              إلغاء
            </Button>
            <Button onClick={handleCropSave}>
              حفظ الصورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wives Management Modal - Creative Redesign */}
      <Dialog open={showWivesModal} onOpenChange={setShowWivesModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-card/95 via-background/98 to-muted/95 backdrop-blur-2xl border-0 shadow-2xl">
          {/* Header with Gradient Background */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary),0.1),transparent_70%)]"></div>
            <DialogHeader className="relative p-8 pb-6">
              <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent flex items-center justify-center gap-4">
                <div className="relative">
                  <Heart className="h-8 w-8 text-accent animate-pulse" />
                  <div className="absolute inset-0 h-8 w-8 bg-accent/20 rounded-full blur-lg"></div>
                </div>
                إدارة الزوجات
              </DialogTitle>
              <DialogDescription className="text-center text-lg mt-3 text-muted-foreground/80">
                أضف وأدر معلومات زوجات المؤسس بطريقة أنيقة ومنظمة
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Main Content with Custom Scrollbar */}
          <div className="px-8 pb-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-8">
              {/* Existing Wives List with Enhanced Design */}
              {wives.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1"></div>
                    <h3 className="text-xl font-bold text-foreground bg-background/80 px-4 py-2 rounded-full border border-border/50">
                      الزوجات المضافة ({wives.length})
                    </h3>
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1"></div>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    {wives.map((wife, index) => (
                      <div key={wife.id} className="relative group animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        {/* Floating Glow Effect */}
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"></div>
                        
                        {/* Main Card */}
                        <Card className="relative bg-gradient-to-br from-card/90 to-muted/50 backdrop-blur-xl border border-border/30 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl">
                          {/* Card Header with Number Badge */}
                          <div className="absolute top-4 right-4 z-10">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary via-accent to-secondary rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-sm font-bold text-white">{index + 1}</span>
                            </div>
                          </div>
                          
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                {/* Wife Avatar */}
                                <div className="relative">
                                  <div className="w-16 h-16 bg-gradient-to-br from-accent/30 via-primary/20 to-secondary/30 rounded-2xl flex items-center justify-center border-2 border-primary/20 shadow-inner">
                                    <Heart className="h-6 w-6 text-primary/70" />
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-2 border-background flex items-center justify-center">
                                    {wife.isAlive ? (
                                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    ) : (
                                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Wife Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-lg text-foreground mb-1 truncate">{wife.name}</h4>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={cn(
                                      "px-3 py-1 rounded-full text-xs font-medium",
                                      wife.isAlive 
                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                                        : "bg-gray-100 text-gray-600 border border-gray-200"
                                    )}>
                                      {wife.isAlive ? 'على قيد الحياة' : 'متوفاة'}
                                    </div>
                                  </div>
                                  
                                  {wife.birthDate && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <CalendarIcon className="h-3 w-3" />
                                      <span>ولدت في {format(wife.birthDate, "yyyy", { locale: ar })}</span>
                                    </div>
                                  )}
                                  
                                  {wife.deathDate && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                      <CalendarIcon className="h-3 w-3" />
                                      <span>توفيت في {format(wife.deathDate, "yyyy", { locale: ar })}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setWives(wives.filter(w => w.id !== wife.id))}
                                className="relative group/delete h-10 w-10 rounded-xl hover:bg-destructive/10 hover:scale-110 transition-all duration-200"
                              >
                                <X className="h-4 w-4 text-muted-foreground group-hover/delete:text-destructive transition-colors" />
                                <div className="absolute inset-0 bg-destructive/20 rounded-xl scale-0 group-hover/delete:scale-100 transition-transform duration-200"></div>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Wife Form with Enhanced Design */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1"></div>
                  <h3 className="text-xl font-bold text-foreground bg-background/80 px-4 py-2 rounded-full border border-border/50 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-accent via-primary to-secondary rounded-full flex items-center justify-center">
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                    إضافة زوجة جديدة
                  </h3>
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1"></div>
                </div>
                
                {/* Enhanced Form Card */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-muted/30 to-accent/5 border-2 border-dashed border-primary/30 rounded-2xl hover:border-primary/50 transition-all duration-300">
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.3),transparent_70%)] animate-pulse"></div>
                  </div>
                  
                  <CardContent className="relative p-8">
                    <WifeForm 
                      ref={wifeFormRef}
                      onAddWife={(wifeData) => {
                        const newWife = {
                          id: Math.random().toString(36).substr(2, 9),
                          ...wifeData
                        };
                        setWives([...wives, newWife]);
                        toast({
                          title: "✨ تم إضافة الزوجة بنجاح",
                          description: "تم حفظ معلومات الزوجة الجديدة في شجرة العائلة",
                        });
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Enhanced Footer with Floating Design */}
          <div className="relative p-6 bg-gradient-to-r from-background/80 via-card/90 to-background/80 backdrop-blur-xl border-t border-border/30">
            <div className="flex justify-between items-center gap-4">
              <Button
                onClick={async () => {
                  if (isAddingWife) return;
                  setIsAddingWife(true);
                  try {
                    wifeFormRef.current?.handleSubmit();
                  } finally {
                    setTimeout(() => setIsAddingWife(false), 1000);
                  }
                }}
                disabled={isAddingWife}
                className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary text-white font-bold rounded-2xl px-8 py-3 h-auto shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    {isAddingWife ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </div>
                  {isAddingWife ? 'جاري الإضافة...' : 'إضافة الزوجة'}
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowWivesModal(false)}
                className="relative overflow-hidden border-2 border-border hover:border-primary/50 rounded-2xl px-8 py-3 h-auto font-semibold hover:bg-primary/5 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <X className="h-4 w-4" />
                  إغلاق
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SharedFooter />
    </div>
  );
};

export default FamilyCreator;