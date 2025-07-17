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
import { TreePine, ArrowRight, ArrowLeft, User, Users, Heart, UserPlus, CheckCircle, Plus, CalendarIcon, Upload, Camera, Baby, Skull, Bell, Settings, LogOut, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SharedFooter } from "@/components/SharedFooter";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";
import { Switch } from "@/components/ui/switch";

interface Wife {
  id: string;
  name: string;
  birthDate: Date | null;
  isAlive: boolean;
  deathDate: Date | null;
  image: File | null;
  croppedImage: string | null;
}

const FamilyCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [currentWifeIndex, setCurrentWifeIndex] = useState<number | null>(null);
  const [isFounderImage, setIsFounderImage] = useState(false);
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
    croppedImage: null as string | null,
    isMarried: false,
    hasMultipleWives: false
  });

  const [wives, setWives] = useState<Wife[]>([]);

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
      
      if (founderData.isMarried && founderData.gender === "male" && wives.length === 0) {
        toast({
          title: "خطأ",
          description: "يرجى إضافة بيانات الزوجة/الزوجات",
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

      // إضافة الزوجات إذا كانت موجودة
      if (founderData.isMarried && founderData.gender === "male" && wives.length > 0) {
        for (const wife of wives) {
          // إضافة الزوجة لشجرة العائلة
          const { data: wifeData, error: wifeError } = await supabase
            .from('family_tree_members')
            .insert({
              family_id: family.id,
              name: wife.name,
              gender: 'female',
              birth_date: wife.birthDate ? new Date(wife.birthDate).toISOString().split('T')[0] : null,
              death_date: wife.deathDate ? new Date(wife.deathDate).toISOString().split('T')[0] : null,
              is_alive: wife.isAlive,
              image_url: wife.croppedImage,
              created_by: user.id
            })
            .select()
            .single();

          if (wifeError) throw wifeError;

          // إنشاء علاقة زواج
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
      }

      // إنشاء البيانات للحفظ المحلي
      const familyData = {
        tree: treeData,
        founder: founderData,
        wives: wives,
        id: family.id,
        createdAt: family.created_at,
        membersCount: 1 + wives.length,
        generations: 1
      };

      const existingTrees = JSON.parse(localStorage.getItem('familyTrees') || '[]');
      const newTreeForList = {
        id: family.id,
        name: treeData.name,
        description: treeData.description,
        members: 1 + wives.length,
        generations: 1,
        lastUpdated: family.updated_at,
        createdAt: family.created_at,
        status: "نشط",
        privacy: "خاص",
        founderName: founderData.name,
        founderImage: founderData.croppedImage,
        wivesCount: wives.length
      };

      existingTrees.push(newTreeForList);
      localStorage.setItem('familyTrees', JSON.stringify(existingTrees));
      localStorage.setItem('newFamilyData', JSON.stringify(familyData));
      
      setShowSuccessModal(true);
      
      toast({
        title: "تم إنشاء العائلة بنجاح",
        description: `تم حفظ بيانات العائلة مع ${wives.length} زوجة/زوجات`
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

  const addWife = () => {
    const newWife: Wife = {
      id: Date.now().toString(),
      name: "",
      birthDate: null,
      isAlive: true,
      deathDate: null,
      image: null,
      croppedImage: null
    };
    setWives([...wives, newWife]);
  };

  const removeWife = (wifeId: string) => {
    setWives(wives.filter(wife => wife.id !== wifeId));
  };

  const updateWife = (wifeId: string, field: keyof Wife, value: any) => {
    setWives(wives.map(wife => 
      wife.id === wifeId ? { ...wife, [field]: value } : wife
    ));
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> => 
    new Promise((resolve, reject) => {
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, wifeIndex?: number) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentWifeIndex(typeof wifeIndex === 'number' ? wifeIndex : null);
      setIsFounderImage(typeof wifeIndex !== 'number');
      
      if (typeof wifeIndex === 'number') {
        updateWife(wives[wifeIndex].id, 'image', file);
      } else {
        setFounderData({ ...founderData, image: file });
      }
      
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
        
        if (isFounderImage) {
          setFounderData(prev => ({ ...prev, croppedImage }));
        } else if (currentWifeIndex !== null) {
          updateWife(wives[currentWifeIndex].id, 'croppedImage', croppedImage);
        }
        
        setShowCropModal(false);
        setCropImage(null);
        setCurrentWifeIndex(null);
        setIsFounderImage(false);
        
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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 backdrop-blur-xl border-b border-gradient-to-r from-primary/30 to-secondary/30 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
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
            
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-primary/20" onClick={() => navigate("/dashboard")}>
                العودة للرئيسية
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="pt-16 relative z-10 min-h-screen">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto px-4 mb-16">
          <div className="text-center relative">
            <div className="relative inline-block mb-8">
              <h2 className="text-6xl font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4 tracking-tight">
                بناء شجرة العائلة
              </h2>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 blur-2xl rounded-full"></div>
            </div>
            
            {/* Steps Indicator */}
            <div className="flex items-center justify-center gap-8 mb-12">
              <div className={`relative flex items-center gap-4 ${currentStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 ${currentStep >= 1 ? 'bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30 scale-110' : 'bg-muted'}`}>
                  <TreePine className="h-8 w-8 text-primary-foreground" />
                  {currentStep >= 1 && <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent animate-ping opacity-20"></div>}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">معلومات الشجرة</h3>
                  <p className="text-sm text-muted-foreground">الخطوة الأولى</p>
                </div>
              </div>
              
              <div className={`w-20 h-1 rounded-full transition-all duration-700 ${currentStep >= 2 ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted'}`}></div>
              
              <div className={`relative flex items-center gap-4 ${currentStep >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 ${currentStep >= 2 ? 'bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30 scale-110' : 'bg-muted'}`}>
                  <Users className="h-8 w-8 text-primary-foreground" />
                  {currentStep >= 2 && <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent animate-ping opacity-20"></div>}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">بيانات المؤسس</h3>
                  <p className="text-sm text-muted-foreground">الخطوة الثانية</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 pb-32">
          {currentStep === 1 && (
            <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">معلومات شجرة العائلة</CardTitle>
                <CardDescription className="text-center">
                  قم بإدخال المعلومات الأساسية لشجرة عائلتك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="family-name">اسم العائلة *</Label>
                  <Input
                    id="family-name"
                    value={treeData.name}
                    onChange={(e) => setTreeData({...treeData, name: e.target.value})}
                    placeholder="مثال: عائلة المحمد"
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="family-description">وصف العائلة</Label>
                  <Textarea
                    id="family-description"
                    value={treeData.description}
                    onChange={(e) => setTreeData({...treeData, description: e.target.value})}
                    placeholder="اكتب وصفاً موجزاً عن عائلتك..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
              {/* Founder Data */}
              <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">بيانات مؤسس الشجرة</CardTitle>
                  <CardDescription className="text-center">
                    قم بإدخال بيانات مؤسس شجرة العائلة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="founder-name">اسم المؤسس *</Label>
                      <Input
                        id="founder-name"
                        value={founderData.name}
                        onChange={(e) => setFounderData({...founderData, name: e.target.value})}
                        placeholder="اسم المؤسس"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="founder-gender">الجنس *</Label>
                      <Select value={founderData.gender} onValueChange={(value) => setFounderData({...founderData, gender: value})}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="اختر الجنس" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>تاريخ الميلاد</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full mt-2 justify-start text-left font-normal", !founderData.birthDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {founderData.birthDate ? format(founderData.birthDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={founderData.birthDate || undefined}
                            onSelect={(date) => setFounderData({...founderData, birthDate: date || null})}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Life Status */}
                    <div>
                      <Label className="flex items-center gap-2">
                        على قيد الحياة
                        <Switch
                          checked={founderData.isAlive}
                          onCheckedChange={(checked) => setFounderData({...founderData, isAlive: checked, deathDate: checked ? null : founderData.deathDate})}
                        />
                      </Label>
                    </div>
                  </div>

                  {/* Death Date */}
                  {!founderData.isAlive && (
                    <div>
                      <Label>تاريخ الوفاة</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full mt-2 justify-start text-left font-normal", !founderData.deathDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {founderData.deathDate ? format(founderData.deathDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={founderData.deathDate || undefined}
                            onSelect={(date) => setFounderData({...founderData, deathDate: date || null})}
                            disabled={(date) => date > new Date() || (founderData.birthDate && date < founderData.birthDate)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {/* Biography */}
                  <div>
                    <Label htmlFor="founder-bio">نبذة تعريفية</Label>
                    <Textarea
                      id="founder-bio"
                      value={founderData.bio}
                      onChange={(e) => setFounderData({...founderData, bio: e.target.value})}
                      placeholder="اكتب نبذة مختصرة عن المؤسس..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label>صورة المؤسس</Label>
                    <div className="mt-2 flex items-center gap-4">
                      {founderData.croppedImage && (
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={founderData.croppedImage} />
                          <AvatarFallback>{founderData.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('founder-image')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {founderData.croppedImage ? 'تغيير الصورة' : 'رفع صورة'}
                      </Button>
                      <input
                        id="founder-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Marriage Status */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label>هل المؤسس متزوج؟</Label>
                      <Switch
                        checked={founderData.isMarried}
                        onCheckedChange={(checked) => {
                          setFounderData({...founderData, isMarried: checked, hasMultipleWives: false});
                          if (!checked) setWives([]);
                        }}
                      />
                    </div>

                    {founderData.isMarried && founderData.gender === "male" && (
                      <div className="flex items-center gap-2">
                        <Label>هل لديه أكثر من زوجة؟</Label>
                        <Switch
                          checked={founderData.hasMultipleWives}
                          onCheckedChange={(checked) => {
                            setFounderData({...founderData, hasMultipleWives: checked});
                            if (!checked && wives.length > 1) {
                              setWives(wives.slice(0, 1));
                            } else if (checked && wives.length === 0) {
                              addWife();
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Wives Data */}
              {founderData.isMarried && founderData.gender === "male" && (
                <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-0 shadow-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold">بيانات الزوجات</CardTitle>
                        <CardDescription>قم بإدخال بيانات زوجات المؤسس</CardDescription>
                      </div>
                      <Button onClick={addWife} className="gap-2">
                        <Plus className="h-4 w-4" />
                        إضافة زوجة
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {wives.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">لم يتم إضافة أي زوجة بعد</p>
                        <Button onClick={addWife} className="mt-4 gap-2">
                          <Plus className="h-4 w-4" />
                          إضافة الزوجة الأولى
                        </Button>
                      </div>
                    )}

                    {wives.map((wife, index) => (
                      <div key={wife.id} className="p-6 border rounded-lg bg-white/20 dark:bg-gray-800/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">الزوجة {index + 1}</h4>
                          {wives.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeWife(wife.id)}
                              className="gap-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`wife-name-${wife.id}`}>اسم الزوجة *</Label>
                            <Input
                              id={`wife-name-${wife.id}`}
                              value={wife.name}
                              onChange={(e) => updateWife(wife.id, 'name', e.target.value)}
                              placeholder="اسم الزوجة"
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label>تاريخ الميلاد</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full mt-2 justify-start text-left font-normal", !wife.birthDate && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {wife.birthDate ? format(wife.birthDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={wife.birthDate || undefined}
                                  onSelect={(date) => updateWife(wife.id, 'birthDate', date || null)}
                                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="flex items-center gap-2">
                              على قيد الحياة
                              <Switch
                                checked={wife.isAlive}
                                onCheckedChange={(checked) => updateWife(wife.id, 'isAlive', checked)}
                              />
                            </Label>
                          </div>

                          {!wife.isAlive && (
                            <div>
                              <Label>تاريخ الوفاة</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className={cn("w-full mt-2 justify-start text-left font-normal", !wife.deathDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {wife.deathDate ? format(wife.deathDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={wife.deathDate || undefined}
                                    onSelect={(date) => updateWife(wife.id, 'deathDate', date || null)}
                                    disabled={(date) => date > new Date() || (wife.birthDate && date < wife.birthDate)}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </div>

                        {/* Wife Image */}
                        <div>
                          <Label>صورة الزوجة</Label>
                          <div className="mt-2 flex items-center gap-4">
                            {wife.croppedImage && (
                              <Avatar className="w-20 h-20">
                                <AvatarImage src={wife.croppedImage} />
                                <AvatarFallback>{wife.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById(`wife-image-${wife.id}`)?.click()}
                              className="gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              {wife.croppedImage ? 'تغيير الصورة' : 'رفع صورة'}
                            </Button>
                            <input
                              id={`wife-image-${wife.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, index)}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              السابق
            </Button>
            
            <Button
              onClick={handleNextStep}
              className="gap-2"
            >
              {currentStep === 2 ? 'إنشاء الشجرة' : 'التالي'}
              {currentStep !== 2 && <ArrowRight className="h-4 w-4" />}
              {currentStep === 2 && <CheckCircle className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>قص الصورة</DialogTitle>
            <DialogDescription>
              قم بتحديد الجزء المطلوب من الصورة
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-64">
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

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
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

      <SharedFooter />
    </div>
  );
};

export default FamilyCreator;