import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop, Star, Sparkles, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import Cropper from "react-easy-crop";

// Mock data for existing family members
const mockFamilyMembers = [
  { id: 1, name: "أحمد محمد الأحمد", relation: "father", gender: "male", birthDate: "1950-03-15", isAlive: false, deathDate: "2020-12-01", image: null, bio: "رب الأسرة وقدوة للجميع، عمل في التجارة وترك إرثاً طيباً" },
  { id: 2, name: "فاطمة سالم", relation: "mother", gender: "female", birthDate: "1955-08-20", isAlive: true, deathDate: null, image: null, bio: "ربة منزل مثالية ومعلمة للأجيال، تحب الطبخ والحياكة" },
  { id: 3, name: "محمد أحمد", relation: "son", gender: "male", birthDate: "1975-12-10", isAlive: true, deathDate: null, image: null, bio: "مهندس في شركة تقنية، متزوج وله ثلاثة أطفال" },
  { id: 4, name: "سارة علي", relation: "daughter", gender: "female", birthDate: "1978-05-22", isAlive: true, deathDate: null, image: null, bio: "طبيبة أطفال، تعمل في مستشفى الملك فيصل" }
];

const getRelationshipOptions = (gender: string, familyMembers: any[] = []) => {
  if (gender === "male") {
    return [
      { value: "father", label: "أب", icon: "👨‍🦳" },
      { value: "husband", label: "زوج", icon: "👨" },
      { value: "brother", label: "أخ", icon: "👨‍🦱" },
      { value: "son", label: "ابن", icon: "👶" }
    ];
  } else if (gender === "female") {
    return [
      { value: "mother", label: "أم", icon: "👩‍🦳" },
      { value: "wife", label: "زوجة", icon: "👩" },
      { value: "sister", label: "أخت", icon: "👩‍🦱" },
      { value: "daughter", label: "ابنة", icon: "👶" }
    ];
  }
  return [];
};

const FamilyBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const treeId = searchParams.get('treeId');
  const isNew = searchParams.get('new') === 'true';
  const isEditMode = searchParams.get('edit') === 'true';
  
  const [activeTab, setActiveTab] = useState("overview");
  const [familyMembers, setFamilyMembers] = useState(() => {
    const newFamilyData = localStorage.getItem('newFamilyData');
    if (newFamilyData) {
      const parsed = JSON.parse(newFamilyData);
      localStorage.removeItem('newFamilyData');
      return [{
        id: 1,
        name: parsed.firstMember.name,
        relation: parsed.firstMember.relation,
        gender: parsed.firstMember.gender,
        birthDate: "",
        isAlive: true,
        deathDate: null,
        image: null,
        bio: ""
      }];
    }
    return isNew ? [] : mockFamilyMembers;
  });
  
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    relatedPersonId: null as number | null,
    gender: "",
    birthDate: null as Date | null,
    isAlive: true,
    deathDate: null as Date | null,
    bio: "",
    image: null as File | null,
    croppedImage: null as string | null
  });

  // Filter members based on search term
  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.relation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Image handling functions
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData({...formData, image: file});
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setShowImageCrop(true);
      });
      reader.readAsDataURL(file);
    }
  }, [formData]);

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
    if (imageSrc && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        setFormData({...formData, croppedImage});
        setShowImageCrop(false);
        setImageSrc(null);
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

  const handleAddNewMember = () => {
    setSelectedMember(null);
    setCurrentStep(1);
    setShowAddMember(true);
    setFormData({
      name: "",
      relation: "",
      relatedPersonId: null,
      gender: "",
      birthDate: null,
      isAlive: true,
      deathDate: null,
      bio: "",
      image: null,
      croppedImage: null
    });
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setCurrentStep(1);
    setShowAddMember(true);
    setFormData({
      name: member.name,
      relation: member.relation,
      relatedPersonId: member.relatedPersonId || null,
      gender: member.gender,
      birthDate: member.birthDate ? new Date(member.birthDate) : null,
      isAlive: member.isAlive,
      deathDate: member.deathDate ? new Date(member.deathDate) : null,
      bio: member.bio || "",
      image: null,
      croppedImage: member.image
    });
  };

  const handleSaveMember = () => {
    if (!formData.name || !formData.gender || !formData.relation) {
      toast({
        title: "خطأ",
        description: "يرجى إكمال جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const memberData = {
      id: selectedMember ? selectedMember.id : Date.now(),
      name: formData.name,
      relation: formData.relation,
      relatedPersonId: formData.relatedPersonId,
      gender: formData.gender,
      birthDate: formData.birthDate?.toISOString().split('T')[0] || "",
      isAlive: formData.isAlive,
      deathDate: formData.deathDate?.toISOString().split('T')[0] || null,
      bio: formData.bio,
      image: formData.croppedImage
    };

    if (selectedMember) {
      setFamilyMembers(familyMembers.map(member => 
        member.id === selectedMember.id ? memberData : member
      ));
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات العضو بنجاح"
      });
    } else {
      setFamilyMembers([...familyMembers, memberData]);
      toast({
        title: "تم الإضافة",
        description: "تم إضافة عضو جديد للعائلة"
      });
    }

    setShowAddMember(false);
    setSelectedMember(null);
    setCurrentStep(1);
    setFormData({
      name: "",
      relation: "",
      relatedPersonId: null,
      gender: "",
      birthDate: null,
      isAlive: true,
      deathDate: null,
      bio: "",
      image: null,
      croppedImage: null
    });
  };

  const handleDeleteMember = (id: number) => {
    setFamilyMembers(familyMembers.filter(member => member.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف العضو من شجرة العائلة"
    });
  };

  const getRelationIcon = (relation: string) => {
    const icons: { [key: string]: string } = {
      father: "👨‍🦳", mother: "👩‍🦳", husband: "👨", wife: "👩",
      brother: "👨‍🦱", sister: "👩‍🦱", son: "👶", daughter: "👶",
      founder: "👑"
    };
    return icons[relation] || "👤";
  };

  const getGenderColor = (gender: string) => {
    return gender === "male" ? "bg-blue-500/20 text-blue-700 border-blue-200" : "bg-pink-500/20 text-pink-700 border-pink-200";
  };

  const nextStep = () => {
    if (currentStep === 1 && (!formData.name || !formData.gender)) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى إدخال الاسم واختيار الجنس",
        variant: "destructive"
      });
      return;
    }
    if (currentStep === 2 && !formData.relation) {
      toast({
        title: "معلومات ناقصة", 
        description: "يرجى اختيار صلة القرابة",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-r from-accent/15 to-primary/15 rounded-full blur-2xl animate-bounce" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 backdrop-blur-xl border-b border-gradient-to-r from-primary/30 to-secondary/30 sticky top-0 z-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 left-10 w-6 h-6 bg-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute top-6 left-32 w-4 h-4 bg-accent/30 rotate-45 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-4 left-64 w-3 h-3 bg-secondary/25 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

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
                  إدارة أفراد العائلة
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <p className="text-muted-foreground font-medium">أضف وعدل أفراد شجرة العائلة</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-primary/30">
                    <Bell className="h-5 w-5 text-primary dark:text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 bg-popover backdrop-blur-xl border border-primary/50 shadow-2xl" align="end">
                  <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>لا توجد إشعارات جديدة</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-primary/30">
                    <User className="h-5 w-5 text-primary dark:text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover backdrop-blur-xl border border-primary/50 shadow-2xl" align="end">
                  <DropdownMenuLabel>حساب المستخدم</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard2")}>
                    <User className="mr-2 h-4 w-4" />
                    لوحة التحكم
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    الإعدادات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => navigate("/dashboard2")}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl px-6"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                العودة للوحة التحكم
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-8 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            {/* Modern Tabs Navigation */}
            <div className="flex justify-center">
              <TabsList className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-1 shadow-lg">
                <TabsTrigger value="overview" className="rounded-xl px-6 py-3 transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg text-muted-foreground hover:text-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="tree-view" className="rounded-xl px-6 py-3 transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg text-muted-foreground hover:text-foreground">
                  <TreePine className="mr-2 h-4 w-4" />
                  عرض الشجرة
                </TabsTrigger>
                <TabsTrigger value="statistics" className="rounded-xl px-6 py-3 transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg text-muted-foreground hover:text-foreground">
                  <Star className="mr-2 h-4 w-4" />
                  الإحصائيات
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-0 shadow-xl rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">إجمالي الأفراد</p>
                        <p className="text-3xl font-bold text-primary">{familyMembers.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-accent/10 to-secondary/10 border-0 shadow-xl rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">الأجيال</p>
                        <p className="text-3xl font-bold text-accent">3</p>
                      </div>
                      <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TreePine className="h-6 w-6 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-secondary/10 to-primary/10 border-0 shadow-xl rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">آخر تحديث</p>
                        <p className="text-3xl font-bold text-secondary">اليوم</p>
                      </div>
                      <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock className="h-6 w-6 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Add Section */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في أفراد العائلة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 h-12 rounded-xl border-primary/20 focus:border-primary bg-card/50 backdrop-blur-sm"
                  />
                </div>
                
                <Button
                  onClick={handleAddNewMember}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 h-12"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  إضافة فرد جديد
                </Button>
              </div>

              {/* Family Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => (
                  <Card key={member.id} className="bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl overflow-hidden group hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary"></div>
                     <CardContent className="p-0 relative overflow-hidden">
                       {/* Simplified Background Pattern */}
                       <div className="absolute inset-0 opacity-3">
                         <div className="absolute top-2 right-2 w-8 h-8 border border-primary/20 rounded-full"></div>
                         <div className="absolute bottom-2 left-2 w-4 h-4 bg-accent/20 rounded-full"></div>
                       </div>

                       {/* Compact Header Section */}
                       <div className="relative bg-gradient-to-br from-primary/8 via-accent/8 to-secondary/8 p-4">
                         <div className="flex items-center justify-between">
                           {/* Actions Menu - على اليسار */}
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 transition-all">
                                 <div className="flex flex-col gap-0.5">
                                   <div className="w-1 h-1 bg-current rounded-full"></div>
                                   <div className="w-1 h-1 bg-current rounded-full"></div>
                                   <div className="w-1 h-1 bg-current rounded-full"></div>
                                 </div>
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="start" className="bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-xl">
                               <DropdownMenuItem onClick={() => handleEditMember(member)} className="rounded-lg flex-row-reverse">
                                 <Edit className="mr-2 h-4 w-4 text-primary" />
                                 تعديل البيانات
                               </DropdownMenuItem>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem 
                                 onClick={() => handleDeleteMember(member.id)}
                                 className="text-destructive focus:text-destructive rounded-lg flex-row-reverse"
                               >
                                 <Trash2 className="mr-2 h-4 w-4" />
                                 حذف من العائلة
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>

                           {/* الصورة والاسم - على اليمين */}
                           <div className="flex items-center gap-3">
                             <div>
                               <h3 className="font-bold text-foreground text-lg leading-tight text-right">{member.name}</h3>
                               <div className="flex justify-end mt-1">
                                 <Badge className={cn("text-xs font-medium px-2 py-0.5 rounded-md", getGenderColor(member.gender))}>
                                   {member.gender === "male" ? "ذكر" : "أنثى"}
                                 </Badge>
                               </div>
                             </div>
                             
                             <div className="relative">
                               <Avatar className="w-12 h-12 border-2 border-white/30 shadow-lg">
                                 <AvatarImage src={member.image || undefined} className="object-cover" />
                                 <AvatarFallback className="bg-gradient-to-br from-primary via-accent to-secondary text-white font-bold text-sm">
                                   {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                 </AvatarFallback>
                               </Avatar>
                             </div>
                           </div>
                         </div>
                       </div>

                       {/* Compact Info Section */}
                       <div className="p-4 space-y-3">

                         {/* Status - Compact */}
                         <div className="flex items-center gap-2 text-sm">
                           {member.isAlive ? (
                             <>
                               <Heart className="h-4 w-4 text-green-500" />
                               <span className="text-green-600 font-medium">على قيد الحياة</span>
                             </>
                           ) : (
                             <>
                               <Skull className="h-4 w-4 text-gray-500" />
                               <span className="text-gray-600 font-medium">متوفى</span>
                             </>
                           )}
                         </div>

                         {/* Bio Preview - Compact */}
                         {member.bio && (
                           <div className="text-sm text-muted-foreground">
                             <p className="line-clamp-1">{member.bio}</p>
                           </div>
                         )}
                       </div>
                     </CardContent>
                  </Card>
                ))}

                {/* Add New Member Card */}
                <Card 
                  className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer group hover:from-primary/10 hover:to-accent/10 hover:border-primary/50 transition-all duration-300"
                  onClick={handleAddNewMember}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-primary text-lg mb-2">إضافة فرد جديد</h3>
                    <p className="text-muted-foreground text-center text-sm">انقر هنا لإضافة عضو جديد إلى شجرة العائلة</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tree View Tab */}
            <TabsContent value="tree-view" className="space-y-8">
              <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
                  <CardTitle className="text-center text-2xl text-foreground">شجرة العائلة</CardTitle>
                  <CardDescription className="text-center text-muted-foreground">عرض تفاعلي لشجرة العائلة</CardDescription>
                </CardHeader>
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <TreePine className="h-16 w-16 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">عرض الشجرة قيد التطوير</h3>
                    <p className="text-muted-foreground text-lg">سيتم إضافة عرض تفاعلي للشجرة قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      إحصائيات الأجيال
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>الجيل الأول</span>
                        <Badge className="bg-primary/20 text-primary">2 أفراد</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>الجيل الثاني</span>
                        <Badge className="bg-accent/20 text-accent">2 أفراد</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      توزيع الجنس
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>الذكور</span>
                        <Badge className="bg-blue-500/20 text-blue-700">
                          {familyMembers.filter(m => m.gender === 'male').length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>الإناث</span>
                        <Badge className="bg-pink-500/20 text-pink-700">
                          {familyMembers.filter(m => m.gender === 'female').length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-card/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-secondary rounded-t-3xl"></div>
          
          <DialogHeader className="relative pt-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-foreground">
                  {selectedMember ? 'تعديل بيانات العضو' : 'إضافة فرد جديد'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-lg">
                  {selectedMember ? 'قم بتعديل معلومات العضو' : 'أدخل معلومات الفرد الجديد'}
                </DialogDescription>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                    currentStep >= step 
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={cn(
                      "w-16 h-1 rounded-full mx-2 transition-all duration-300",
                      currentStep > step ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"
                    )}></div>
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] px-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      الاسم الكامل
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="أدخل الاسم الكامل"
                      className="h-12 text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      الجنس
                    </Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value, relation: ""})}>
                      <SelectTrigger className="h-12 text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input">
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                        <SelectItem value="male" className="text-lg py-4 rounded-lg">👨 ذكر</SelectItem>
                        <SelectItem value="female" className="text-lg py-4 rounded-lg">👩 أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Profile Photo Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" />
                    الصورة الشخصية (اختياري)
                  </Label>
                  
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24 border-4 border-primary/20">
                      <AvatarImage src={formData.croppedImage || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-2xl">
                        {formData.name ? formData.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '👤'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl cursor-pointer hover:from-primary/20 hover:to-accent/20 transition-all"
                      >
                        <UploadCloud className="h-4 w-4" />
                        اختر صورة
                      </label>
                      <p className="text-sm text-muted-foreground mt-2">
                        يفضل استخدام صور بجودة عالية ونسبة 1:1
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Relationship */}
            {currentStep === 2 && formData.gender && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">تحديد صلة القرابة</h3>
                  <p className="text-muted-foreground">اختر العلاقة التي تربط هذا الشخص بالعائلة</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {getRelationshipOptions(formData.gender).map((relation) => (
                    <Card
                      key={relation.value}
                      className={cn(
                        "cursor-pointer transition-all duration-300 border-2 rounded-xl overflow-hidden group",
                        formData.relation === relation.value
                          ? "border-primary bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg"
                          : "border-border hover:border-primary/50 hover:shadow-md"
                      )}
                      onClick={() => setFormData({...formData, relation: relation.value})}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">{relation.icon}</div>
                        <h4 className="font-bold text-lg text-foreground">{relation.label}</h4>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Additional Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      تاريخ الميلاد
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 justify-start text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input",
                            !formData.birthDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.birthDate ? format(formData.birthDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                        <Calendar
                          mode="single"
                          selected={formData.birthDate}
                          onSelect={(date) => setFormData({...formData, birthDate: date})}
                          initialFocus
                          disabled={(date) => date > new Date()}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      الحالة
                    </Label>
                    <Select value={formData.isAlive ? "alive" : "deceased"} onValueChange={(value) => setFormData({...formData, isAlive: value === "alive"})}>
                      <SelectTrigger className="h-12 text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                        <SelectItem value="alive" className="text-lg py-4 rounded-lg">💚 على قيد الحياة</SelectItem>
                        <SelectItem value="deceased" className="text-lg py-4 rounded-lg">🕊️ متوفى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!formData.isAlive && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <Skull className="h-4 w-4 text-primary" />
                      تاريخ الوفاة
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 justify-start text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input",
                            !formData.deathDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.deathDate ? format(formData.deathDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                        <Calendar
                          mode="single"
                          selected={formData.deathDate}
                          onSelect={(date) => setFormData({...formData, deathDate: date})}
                          initialFocus
                          disabled={(date) => date > new Date() || (formData.birthDate && date < formData.birthDate)}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    نبذة عن الشخص (اختياري)
                  </Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="اكتب نبذة مختصرة عن هذا الشخص..."
                    className="min-h-[100px] border-2 border-primary/20 focus:border-primary rounded-xl bg-input resize-none text-lg"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center pt-6 border-t border-primary/20 gap-4">
            <div className="flex gap-3 order-2 sm:order-1">
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep} className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl px-6 py-2">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  السابق
                </Button>
              )}
            </div>

            <div className="flex gap-3 order-1 sm:order-2">
              <Button variant="outline" onClick={() => setShowAddMember(false)} className="border-border hover:bg-muted rounded-xl px-6 py-2">
                إلغاء
              </Button>
              
              {currentStep < 3 ? (
                <Button onClick={nextStep} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-xl px-6 py-2">
                  التالي
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSaveMember} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-xl px-6 py-2">
                  <Save className="ml-2 h-4 w-4" />
                  {selectedMember ? 'حفظ التغييرات' : 'إضافة العضو'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Crop Modal */}
      <Dialog open={showImageCrop} onOpenChange={setShowImageCrop}>
        <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">قص الصورة</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              اضبط الصورة كما تريد وانقر على حفظ
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative h-96 w-full rounded-xl overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zoom" className="text-sm font-medium">تكبير</Label>
              <input
                id="zoom"
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setShowImageCrop(false)} className="rounded-xl">
              إلغاء
            </Button>
            <Button onClick={handleCropSave} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-xl">
              <Save className="mr-2 h-4 w-4" />
              حفظ الصورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FamilyBuilder;