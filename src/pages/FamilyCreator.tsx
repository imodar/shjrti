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
    navigate("/dashboard2");
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
  const getRelationshipLabel = (gender: string) => {
    return "أول فرد الذي ستبدأ منه العائلة";
  };
  return <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-teal-400/15 to-cyan-400/15 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 rounded-full blur-2xl animate-bounce" style={{
        animationDelay: '1s'
      }}></div>
      </div>
      
      {/* Header matching Dashboard2 exactly */}
      <header className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border-b border-gradient-to-r from-emerald-200/30 to-cyan-200/30 sticky top-0 z-50">
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 left-10 w-6 h-6 bg-emerald-400/20 rounded-full animate-pulse"></div>
          <div className="absolute top-6 left-32 w-4 h-4 bg-teal-400/30 rotate-45 animate-pulse" style={{
          animationDelay: '1s'
        }}></div>
          <div className="absolute top-4 left-64 w-3 h-3 bg-cyan-400/25 rounded-full animate-pulse" style={{
          animationDelay: '2s'
        }}></div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                  <TreePine className="h-7 w-7 text-white" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  كينلاك - العائلة الرقمية
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-muted-foreground font-medium">إنشاء شجرة عائلية جديدة</p>
                </div>
              </div>
            </div>
            
            {/* Right side - Actions and Profile */}
            <div className="flex items-center gap-6">
              {/* Navigation Pills */}
              <div className="hidden md:flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-full p-1 border border-emerald-200/50 dark:border-emerald-700/50">
                <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-emerald-500/20" onClick={() => navigate("/dashboard2")}>
                  الرئيسية
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full px-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30">
                  إنشاء شجرة
                </Button>
              </div>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-emerald-200/30">
                    <User className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">المستخدم</p>
                      <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard2")}>
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
      
      <div className="pt-8 relative z-10">
        {/* Enhanced Steps Indicator */}
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-6">
          <div className="relative flex items-center justify-center space-x-8 rtl:space-x-reverse">
            {/* Connecting Line */}
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200"></div>
            
            {/* Step 1 */}
            <div className="relative flex flex-col items-center group">
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 ${currentStep >= 1 ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-110' : 'bg-white border-4 border-gray-200 text-gray-400'}`}>
                {currentStep >= 1 && <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 animate-ping opacity-75"></div>}
                <span className="relative z-10">1</span>
              </div>
              <span className={`mt-3 text-base font-medium transition-all duration-300 ${currentStep >= 1 ? 'text-emerald-700 font-bold' : 'text-gray-500'}`}>
                بيانات الشجرة
              </span>
              <TreePine className={`mt-1 h-5 w-5 transition-all duration-300 ${currentStep >= 1 ? 'text-emerald-500' : 'text-gray-300'}`} />
            </div>
            
            {/* Step 2 */}
            <div className="relative flex flex-col items-center group">
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 ${currentStep >= 2 ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-110' : 'bg-white border-4 border-gray-200 text-gray-400'}`}>
                {currentStep >= 2 && <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 animate-ping opacity-75"></div>}
                <span className="relative z-10">2</span>
              </div>
              <span className={`mt-3 text-base font-medium transition-all duration-300 ${currentStep >= 2 ? 'text-emerald-700 font-bold' : 'text-gray-500'}`}>
                إضافة الفرد الأول
              </span>
              <Users className={`mt-1 h-5 w-5 transition-all duration-300 ${currentStep >= 2 ? 'text-emerald-500' : 'text-gray-300'}`} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {/* Step 1: Tree Data */}
          {currentStep === 1 && <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-emerald-200 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
              <CardHeader className="text-center relative">
                <TreePine className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
                <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-200">
                  إنشاء شجرة العائلة
                </CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-400">
                  ابدأ بإدخال المعلومات الأساسية لشجرة عائلتك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <div className="space-y-2">
                  <Label htmlFor="familyName" className="text-right flex flex-row-reverse items-center gap-2">
                    <TreePine className="h-4 w-4 text-emerald-600" />
                    اسم العائلة
                  </Label>
                  <Input id="familyName" value={treeData.name} onChange={e => setTreeData({
                ...treeData,
                name: e.target.value
              })} placeholder="مثال: عائلة الأحمد" className="text-right text-lg" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-right flex flex-row-reverse items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-600" />
                    وصف العائلة (اختياري)
                  </Label>
                  <Textarea id="description" value={treeData.description} onChange={e => setTreeData({
                ...treeData,
                description: e.target.value
              })} placeholder="اكتب وصفاً موجزاً عن تاريخ العائلة أو أي معلومات مهمة..." className="text-right min-h-[100px] resize-none" />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleNextStep} disabled={!treeData.name.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3 h-auto">
                    التالي
                    <ArrowLeft className="mr-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>}

          {/* Step 2: First Member with Full Details */}
          {currentStep === 2 && <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-emerald-200 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
              <CardHeader className="text-center relative">
                <Users className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
                <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-200">
                  إضافة الفرد الأول
                </CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-400">
                  أدخل معلومات الفرد الأول الذي ستبدأ منه شجرة العائلة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                {/* Profile Image */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-emerald-200">
                      <AvatarImage src={firstMember.croppedImage || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-600 text-2xl font-bold">
                        {firstMember.name ? firstMember.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'صورة'}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="image-upload" className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all">
                      <Camera className="h-4 w-4" />
                    </label>
                  </div>
                  <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Label className="text-sm text-emerald-600">اضغط على الكاميرا لإضافة صورة</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="memberName" className="text-right flex flex-row-reverse items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      الاسم الكامل
                    </Label>
                    <Input id="memberName" value={firstMember.name} onChange={e => setFirstMember({
                  ...firstMember,
                  name: e.target.value
                })} placeholder="أدخل الاسم الكامل" className="text-right text-lg" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-right flex flex-row-reverse items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-600" />
                      الجنس
                    </Label>
                    <Select value={firstMember.gender} onValueChange={value => setFirstMember({
                  ...firstMember,
                  gender: value
                })}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                      <SelectContent className="text-right">
                        <SelectItem value="male" className="text-right justify-end">ذكر</SelectItem>
                        <SelectItem value="female" className="text-right justify-end">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Birth Date and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-right flex flex-row-reverse items-center gap-2">
                      <Baby className="h-4 w-4 text-emerald-600" />
                      تاريخ الميلاد
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-right font-normal", !firstMember.birthDate && "text-muted-foreground")}>
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {firstMember.birthDate ? format(firstMember.birthDate, "PPP", {
                        locale: ar
                      }) : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={firstMember.birthDate} onSelect={date => setFirstMember({
                      ...firstMember,
                      birthDate: date
                    })} initialFocus className="pointer-events-auto" disabled={date => date > new Date()} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-right flex flex-row-reverse items-center gap-2">
                      <Heart className="h-4 w-4 text-emerald-600" />
                      الحالة
                    </Label>
                    <Select value={firstMember.isAlive ? "alive" : "deceased"} onValueChange={value => setFirstMember({
                  ...firstMember,
                  isAlive: value === "alive"
                })}>
                      <SelectTrigger className="text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-right">
                        <SelectItem value="alive" className="text-right justify-end">على قيد الحياة</SelectItem>
                        <SelectItem value="deceased" className="text-right justify-end">متوفى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Death Date if deceased */}
                {!firstMember.isAlive && <div className="space-y-2">
                    <Label className="text-right flex flex-row-reverse items-center gap-2">
                      <Skull className="h-4 w-4 text-gray-600" />
                      تاريخ الوفاة
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-right font-normal", !firstMember.deathDate && "text-muted-foreground")}>
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {firstMember.deathDate ? format(firstMember.deathDate, "PPP", {
                      locale: ar
                    }) : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={firstMember.deathDate} onSelect={date => setFirstMember({
                    ...firstMember,
                    deathDate: date
                  })} initialFocus className="pointer-events-auto" disabled={date => date > new Date() || firstMember.birthDate && date < firstMember.birthDate} />
                      </PopoverContent>
                    </Popover>
                  </div>}

                {/* Bio */}
                <div className="space-y-2">
                  <Label className="text-right flex flex-row-reverse items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-600" />
                    نبذة عن الشخص (اختياري)
                  </Label>
                  <Textarea value={firstMember.bio} onChange={e => setFirstMember({
                ...firstMember,
                bio: e.target.value
              })} placeholder="اكتب نبذة مختصرة عن هذا الشخص..." className="text-right min-h-[80px] resize-none" />
                </div>

                {firstMember.gender && <div className="space-y-2">
                    <Label className="text-right flex flex-row-reverse items-center gap-2">
                      <Heart className="h-4 w-4 text-emerald-600" />
                      صلة القرابة
                    </Label>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <p className="text-emerald-700 dark:text-emerald-300 text-center font-medium">
                        {getRelationshipLabel(firstMember.gender)}
                      </p>
                    </div>
                  </div>}

                <div className="flex justify-between pt-4">
                  <Button onClick={handlePrevStep} variant="outline" className="text-lg px-6 py-3 h-auto">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    السابق
                  </Button>
                  
                  <Button onClick={handleCreateFamily} disabled={!firstMember.name.trim() || !firstMember.gender} className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3 h-auto">
                    <UserPlus className="mr-2 h-5 w-5" />
                    إنشاء العائلة
                  </Button>
                </div>
              </CardContent>
            </Card>}
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <DialogHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-emerald-800 text-center">
              تم إنشاء الشجرة بنجاح!
            </DialogTitle>
            <DialogDescription className="text-center text-emerald-600">
              تم إنشاء شجرة العائلة وإضافة الفرد الأول بنجاح. هل تريد إضافة أفراد آخرين الآن؟
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex gap-3 mt-6">
            <Button variant="outline" onClick={handleSkipTodashboard} className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              تخطي الآن
            </Button>
            <Button onClick={handleAddMoreMembers} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
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
            <Button onClick={handleCropSave} className="bg-emerald-600 hover:bg-emerald-700">
              حفظ الصورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>;
};
export default FamilyCreator;