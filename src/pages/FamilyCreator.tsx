import { useState, useCallback } from "react";
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
import { TreePine, ArrowRight, ArrowLeft, User, Users, Heart, UserPlus, CheckCircle, Plus, CalendarIcon, Upload, Camera, Baby, Skull, Bell, Settings, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Footer from "@/components/Footer";
import Cropper from "react-easy-crop";
const FamilyCreator = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({
    x: 0,
    y: 0
  });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [treeData, setTreeData] = useState({
    name: "",
    description: ""
  });
  const [firstMember, setFirstMember] = useState({
    name: "",
    gender: "",
    relation: "founder",
    birthDate: null as Date | null,
    isAlive: true,
    deathDate: null as Date | null,
    bio: "",
    image: null as File | null,
    croppedImage: null as string | null
  });
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
    }
  };
  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };
  const handleCreateFamily = () => {
    if (!firstMember.name.trim() || !firstMember.gender) {
      toast({
        title: "خطأ",
        description: "يرجى إكمال جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    // Save family data and add to existing trees list
    const familyData = {
      tree: treeData,
      firstMember: firstMember,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      membersCount: 1,
      generations: 1
    };

    // Get existing trees from localStorage
    const existingTrees = JSON.parse(localStorage.getItem('familyTrees') || '[]');

    // Add new tree to the list
    const newTreeForList = {
      id: familyData.id,
      name: treeData.name,
      description: treeData.description,
      membersCount: 1,
      generations: 1,
      lastUpdated: new Date().toISOString(),
      createdAt: familyData.createdAt,
      status: "نشط",
      privacy: "خاص",
      founderName: firstMember.name,
      founderImage: firstMember.croppedImage
    };
    existingTrees.push(newTreeForList);
    localStorage.setItem('familyTrees', JSON.stringify(existingTrees));
    localStorage.setItem('newFamilyData', JSON.stringify(familyData));
    setShowSuccessModal(true);
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
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);
  const createImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise(resolve => {
      canvas.toBlob(blob => {
        if (blob) {
          const reader = new FileReader();
          reader.addEventListener('load', () => resolve(reader.result as string));
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg');
    });
  };
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFirstMember({
        ...firstMember,
        image: file
      });
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          setCropImage(e.target.result as string);
          setShowCropModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleCropSave = async () => {
    if (cropImage && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(cropImage, croppedAreaPixels);
        setFirstMember(prev => ({
          ...prev,
          croppedImage
        }));
        setShowCropModal(false);
        setCropImage(null);
        toast({
          title: "تم حفظ الصورة",
          description: "تم قص الصورة وحفظها بنجاح"
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء قص الصورة",
          variant: "destructive"
        });
      }
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-r from-accent/15 to-primary/15 rounded-full blur-2xl animate-bounce" style={{
        animationDelay: '1s'
      }}></div>
      </div>
      
      {/* Header matching Dashboard2 exactly */}
      <header className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 backdrop-blur-xl border-b border-gradient-to-r from-primary/30 to-secondary/30 sticky top-0 z-50">
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 left-10 w-6 h-6 bg-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute top-6 left-32 w-4 h-4 bg-accent/30 rotate-45 animate-pulse" style={{
          animationDelay: '1s'
        }}></div>
          <div className="absolute top-4 left-64 w-3 h-3 bg-secondary/25 rounded-full animate-pulse" style={{
          animationDelay: '2s'
        }}></div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-primary via-accent to-secondary rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                  <Users className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  كينلاك - العائلة الرقمية
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <p className="text-muted-foreground font-medium">إنشاء شجرة عائلية جديدة</p>
                </div>
              </div>
            </div>
            
            {/* Right side - Actions and Profile */}
            <div className="flex items-center gap-6">
              {/* Navigation Pills */}
              <div className="hidden md:flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-full p-1 border border-primary/50 dark:border-primary/50">
                <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-primary/20" onClick={() => navigate("/dashboard")}>
                  الرئيسية
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full px-4 bg-primary/20 text-primary dark:text-primary hover:bg-primary/30">
                  إنشاء شجرة
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-primary/20">
                  التقارير
                </Button>
              </div>

              {/* Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-primary/30">
                    <Bell className="h-5 w-5 text-primary dark:text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-primary/50 dark:border-primary/50 shadow-2xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">الإشعارات</p>
                      <p className="text-xs leading-none text-muted-foreground">لا توجد إشعارات جديدة</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-primary/30">
                    <User className="h-5 w-5 text-primary dark:text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-primary/50 dark:border-primary/50 shadow-2xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">المستخدم</p>
                      <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>لوحة التحكم</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>الإعدادات</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      <div className="pt-16 relative z-10 min-h-screen">
        {/* Modern Header Section */}
        <div className="max-w-7xl mx-auto px-4 mb-16">
          <div className="text-center relative">
            {/* Animated Title */}
            <div className="relative inline-block mb-8">
              <h2 className="text-6xl font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4 tracking-tight">بناء شجرة العائلة</h2>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 blur-2xl rounded-full"></div>
            </div>
            
            {/* Modern Steps Indicator */}
            <div className="flex items-center justify-center gap-8 mb-12">
              <div className={`relative flex items-center gap-4 ${currentStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 ${currentStep >= 1 ? 'bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30 scale-110' : 'bg-muted dark:bg-muted'}`}>
                  <TreePine className="h-8 w-8 text-primary-foreground" />
                  {currentStep >= 1 && <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent animate-ping opacity-20"></div>}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">معلومات الشجرة</h3>
                  <p className="text-sm text-muted-foreground">الخطوة الأولى</p>
                </div>
              </div>
              
              <div className="w-20 h-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-r from-primary to-accent transition-transform duration-1000 ${currentStep >= 2 ? 'translate-x-0' : '-translate-x-full'}`}></div>
              </div>
              
              <div className={`relative flex items-center gap-4 ${currentStep >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 ${currentStep >= 2 ? 'bg-gradient-to-br from-accent to-secondary shadow-xl shadow-accent/30 scale-110' : 'bg-muted dark:bg-muted'}`}>
                  <UserPlus className="h-8 w-8 text-primary-foreground" />
                  {currentStep >= 2 && <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent to-secondary animate-ping opacity-20"></div>}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">الفرد الأول</h3>
                  <p className="text-sm text-muted-foreground">الخطوة الثانية</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Modern Layout */}
        <div className="max-w-6xl mx-auto px-4">
          {/* Step 1: Tree Information */}
          {currentStep === 1 && <div className="relative">
              {/* Background Art */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-tr from-secondary/15 to-primary/15 rounded-full blur-3xl animate-pulse" style={{
              animationDelay: '2s'
            }}></div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Side - Form */}
                <div className="relative">
                  <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-2xl shadow-primary/10 rounded-3xl overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-secondary"></div>
                    
                    <CardContent className="p-10">
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <TreePine className="h-10 w-10 text-primary-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">إنشاء شجرة العائلة</h3>
                        <p className="text-muted-foreground">ابدأ رحلتك في بناء تاريخ عائلتك</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <Label className="text-sm font-medium text-card-foreground mb-3 block">
                            🌳 اسم العائلة
                          </Label>
                          <Input value={treeData.name} onChange={e => setTreeData({
                        ...treeData,
                        name: e.target.value
                      })} placeholder="مثال: عائلة الأحمد" className="h-14 text-lg border-0 bg-input rounded-xl shadow-inner focus:shadow-lg transition-all" />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-card-foreground mb-3 block">
                            📝 وصف العائلة (اختياري)
                          </Label>
                          <Textarea value={treeData.description} onChange={e => setTreeData({
                        ...treeData,
                        description: e.target.value
                      })} placeholder="اكتب وصفاً موجزاً عن تاريخ العائلة..." className="min-h-[120px] border-0 bg-input rounded-xl shadow-inner resize-none text-lg" />
                        </div>

                        <Button onClick={handleNextStep} disabled={!treeData.name.trim()} className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                          🚀 المتابعة للخطوة التالية
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Side - Visual */}
                <div className="relative">
                  <div className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 dark:from-primary/20 dark:via-accent/10 dark:to-secondary/20 rounded-3xl p-8 h-[500px] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-40"></div>
                    
                    <div className="relative text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <TreePine className="h-16 w-16 text-primary-foreground" />
                      </div>
                      <h4 className="text-2xl font-bold text-primary mb-4">🌟 ابدأ رحلتك</h4>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        ستكون هذه بداية شجرة عائلتك الرقمية التي ستحفظ ذكريات أجيال عديدة
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>}

          {/* Step 2: First Member */}
          {currentStep === 2 && <div className="relative">
              {/* Background Art */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 right-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-tr from-secondary/15 to-primary/15 rounded-full blur-3xl animate-pulse" style={{
              animationDelay: '1s'
            }}></div>
              </div>

              <Card className="bg-card/90 backdrop-blur-xl border-0 shadow-2xl shadow-primary/10 rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-secondary"></div>
                
                <CardContent className="p-12">
                  {/* Header */}
                  <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <UserPlus className="h-12 w-12 text-primary-foreground" />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground mb-3">👑 إضافة الفرد الأول</h3>
                    <p className="text-xl text-muted-foreground">الشخص الذي ستبدأ منه رحلة بناء شجرة العائلة</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Photo Section */}
                    <div className="lg:col-span-1">
                      <div className="text-center">
                        <Label className="text-sm font-medium text-card-foreground mb-6 block">📸 الصورة الشخصية</Label>
                        
                        <div className="relative inline-block mb-6">
                          <div className="absolute -inset-4 bg-gradient-to-r from-primary via-accent to-secondary rounded-full blur-lg opacity-30 animate-pulse"></div>
                          <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 p-2 shadow-2xl">
                            <Avatar className="w-full h-full border-4 border-card dark:border-card">
                              <AvatarImage src={firstMember.croppedImage || undefined} className="object-cover" />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 text-primary dark:text-primary text-4xl font-bold">
                                {firstMember.name ? firstMember.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '👤'}
                              </AvatarFallback>
                            </Avatar>
                            
                            <label htmlFor="image-upload" className="absolute bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 cursor-pointer">
                              <Camera className="h-6 w-6" />
                            </label>
                          </div>
                        </div>
                        
                        <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <p className="text-sm text-muted-foreground">انقر على الكاميرا لإضافة صورة</p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-card-foreground mb-3 block">
                            👤 الاسم الكامل
                          </Label>
                          <Input value={firstMember.name} onChange={e => setFirstMember({
                        ...firstMember,
                        name: e.target.value
                      })} placeholder="أدخل الاسم الكامل" className="h-14 text-lg border-0 bg-input rounded-xl shadow-inner focus:shadow-lg transition-all" />
                        </div>

                        {/* Gender */}
                        <div>
                          <Label className="text-sm font-medium text-card-foreground mb-3 block">
                            🚻 الجنس
                          </Label>
                          <Select value={firstMember.gender} onValueChange={value => setFirstMember({
                        ...firstMember,
                        gender: value
                      })}>
                            <SelectTrigger className="h-14 text-lg border-0 bg-input rounded-xl shadow-inner">
                              <SelectValue placeholder="اختر الجنس" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                              <SelectItem value="male" className="text-lg py-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30">
                                👨 ذكر
                              </SelectItem>
                              <SelectItem value="female" className="text-lg py-4 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/30">
                                👩 أنثى
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Birth Date */}
                        <div>
                          <Label className="text-sm font-medium text-card-foreground mb-3 block">
                            🎂 تاريخ الميلاد
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full h-14 justify-start text-lg border-0 bg-input rounded-xl shadow-inner hover:shadow-lg", !firstMember.birthDate && "text-muted-foreground")}>
                                <CalendarIcon className="ml-2 h-5 w-5" />
                                {firstMember.birthDate ? format(firstMember.birthDate, "PPP", {
                              locale: ar
                            }) : "اختر التاريخ"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                              <Calendar mode="single" selected={firstMember.birthDate} onSelect={date => setFirstMember({
                            ...firstMember,
                            birthDate: date
                          })} initialFocus className="pointer-events-auto" disabled={date => date > new Date()} />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Status */}
                        <div>
                          <Label className="text-sm font-medium text-card-foreground mb-3 block">
                            💗 الحالة
                          </Label>
                          <Select value={firstMember.isAlive ? "alive" : "deceased"} onValueChange={value => setFirstMember({
                        ...firstMember,
                        isAlive: value === "alive"
                      })}>
                            <SelectTrigger className="h-14 text-lg border-0 bg-input rounded-xl shadow-inner">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                              <SelectItem value="alive" className="text-lg py-4 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30">
                                💚 على قيد الحياة
                              </SelectItem>
                              <SelectItem value="deceased" className="text-lg py-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-950/30">
                                🕊️ متوفى
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Death Date */}
                        {!firstMember.isAlive && <div>
                            <Label className="text-sm font-medium text-card-foreground mb-3 block">
                              🕊️ تاريخ الوفاة
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full h-14 justify-start text-lg border-0 bg-input rounded-xl shadow-inner", !firstMember.deathDate && "text-muted-foreground")}>
                                  <CalendarIcon className="ml-2 h-5 w-5" />
                                  {firstMember.deathDate ? format(firstMember.deathDate, "PPP", {
                              locale: ar
                            }) : "اختر التاريخ"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                                <Calendar mode="single" selected={firstMember.deathDate} onSelect={date => setFirstMember({
                            ...firstMember,
                            deathDate: date
                          })} initialFocus className="pointer-events-auto" disabled={date => date > new Date() || firstMember.birthDate && date < firstMember.birthDate} />
                              </PopoverContent>
                            </Popover>
                          </div>}

                        {/* Bio */}
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-card-foreground mb-3 block">
                            📝 نبذة عن الشخص (اختياري)
                          </Label>
                          <Textarea value={firstMember.bio} onChange={e => setFirstMember({
                        ...firstMember,
                        bio: e.target.value
                      })} placeholder="اكتب نبذة مختصرة عن هذا الشخص..." className="min-h-[100px] border-0 bg-input rounded-xl shadow-inner resize-none text-lg" />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between mt-12">
                        <Button onClick={handlePrevStep} variant="outline" className="h-14 px-8 text-lg border-2 border-border hover:border-border/80 rounded-xl transition-all">
                          ← العودة للخلف
                        </Button>

                        <Button onClick={handleCreateFamily} disabled={!firstMember.name.trim() || !firstMember.gender} className="h-14 px-12 text-lg font-semibold bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50">
                          🎉 إنشاء الشجرة
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>}
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <DialogHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-bold text-primary text-center">
              تم إنشاء الشجرة بنجاح!
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              تم إنشاء شجرة العائلة وإضافة الفرد الأول بنجاح. هل تريد إضافة أفراد آخرين الآن؟
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex gap-3 mt-6">
            <Button variant="outline" onClick={handleSkipTodashboard} className="flex-1 text-primary border-primary/20 hover:bg-primary/5">
              تخطي الآن
            </Button>
            <Button onClick={handleAddMoreMembers} className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              إضافة أفراد آخرين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>قص الصورة</DialogTitle>
            <DialogDescription>
              اضبط الصورة كما تريد وانقر على حفظ
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative h-96 w-full">
            {cropImage && <Cropper image={cropImage} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} cropShape="round" showGrid={false} />}
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zoom">تكبير</Label>
              <input id="zoom" type="range" min="1" max="3" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full" />
            </div>
          </div>
          
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => {
            setShowCropModal(false);
            setCropImage(null);
          }}>
              إلغاء
            </Button>
            <Button onClick={handleCropSave} className="bg-primary hover:bg-primary/90">
              حفظ الصورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>;
};
export default FamilyCreator;