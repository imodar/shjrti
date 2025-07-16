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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Cropper from "react-easy-crop";

// Mock data for existing family members
const mockFamilyMembers = [
  { id: 1, name: "أحمد محمد الأحمد", relation: "father", gender: "male", birthDate: "1950-03-15", isAlive: false, deathDate: "2020-12-01", image: null },
  { id: 2, name: "فاطمة سالم", relation: "mother", gender: "female", birthDate: "1955-08-20", isAlive: true, deathDate: null, image: null },
  { id: 3, name: "محمد أحمد", relation: "son", gender: "male", birthDate: "1975-12-10", isAlive: true, deathDate: null, image: null },
  { id: 4, name: "سارة علي", relation: "daughter", gender: "female", birthDate: "1978-05-22", isAlive: true, deathDate: null, image: null }
];

const getRelationshipOptions = (gender: string, familyMembers: any[] = []) => {
  // For subsequent members, show all relationship options except founder
  if (gender === "male") {
    return [
      { value: "father", label: "أب" },
      { value: "husband", label: "زوج" },
      { value: "brother", label: "أخ" },
      { value: "son", label: "ابن" }
    ];
  } else if (gender === "female") {
    return [
      { value: "mother", label: "أم" },
      { value: "wife", label: "زوجة" },
      { value: "sister", label: "أخت" },
      { value: "daughter", label: "ابنة" }
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
  
  const [currentMode, setCurrentMode] = useState<'tree-view' | 'add-member' | 'edit-member'>('tree-view');
  const [familyMembers, setFamilyMembers] = useState(() => {
    // Try to load from localStorage first (from FamilyCreator)
    const newFamilyData = localStorage.getItem('newFamilyData');
    if (newFamilyData) {
      const parsed = JSON.parse(newFamilyData);
      localStorage.removeItem('newFamilyData'); // Clean up
      return [{
        id: 1,
        name: parsed.firstMember.name,
        relation: parsed.firstMember.relation,
        gender: parsed.firstMember.gender,
        birthDate: "",
        isAlive: true,
        deathDate: null,
        image: null
      }];
    }
    return isNew ? [] : mockFamilyMembers;
  });
  
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [relatedPersonSearch, setRelatedPersonSearch] = useState("");
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

  // Filter family members for relationship selection
  const filteredRelatedPersons = familyMembers.filter(member =>
    member.name.toLowerCase().includes(relatedPersonSearch.toLowerCase()) ||
    member.relation.toLowerCase().includes(relatedPersonSearch.toLowerCase())
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

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setFormData({...formData, image: file});
        
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setImageSrc(reader.result as string);
          setShowImageCrop(true);
        });
        reader.readAsDataURL(file);
      }
    }
  }, [formData]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

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
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddNewMember = () => {
    setSelectedMember(null);
    setCurrentMode('add-member');
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
    setCurrentMode('edit-member');
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
      // Edit existing member
      setFamilyMembers(familyMembers.map(member => 
        member.id === selectedMember.id ? memberData : member
      ));
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات العضو بنجاح"
      });
    } else {
      // Add new member
      setFamilyMembers([...familyMembers, memberData]);
      toast({
        title: "تم الإضافة",
        description: "تم إضافة عضو جديد للعائلة"
      });
    }

    setCurrentMode('tree-view');
    setSelectedMember(null);
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

  const handleBackToDashboard = () => {
    navigate('/dashboard2');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950">
      <Header />
      
      <div className="pt-20">
        {/* Header with navigation */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                إدارة أفراد العائلة
              </h1>
              <p className="text-emerald-600 dark:text-emerald-400">
                أضف وعدل أفراد شجرة العائلة
              </p>
            </div>
            <Button
              onClick={handleBackToDashboard}
              variant="outline"
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              العودة للوحة التحكم
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100vh-200px)] gap-6 px-4 pb-6 max-w-7xl mx-auto">
          {/* Left Column - Form */}
          <div className={cn("flex-1", familyMembers.length > 0 ? "max-w-3xl" : "max-w-none")}>
            {/* Add/Edit Member Form */}
            {(currentMode === 'add-member' || currentMode === 'edit-member') && (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-emerald-200 h-full overflow-auto">
                <CardHeader className="sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 border-b">
                  <CardTitle className="text-emerald-800 dark:text-emerald-200">
                    {currentMode === 'edit-member' ? `تعديل بيانات: ${selectedMember?.name}` : 'إضافة فرد جديد للعائلة'}
                  </CardTitle>
                  <CardDescription>
                    {currentMode === 'edit-member' ? 'قم بتعديل معلومات العضو' : 'أدخل معلومات الفرد الجديد وحدد صلة القرابة'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pb-32 pt-6">
                  {/* Name and Gender */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="name" className="text-right flex flex-row-reverse items-center gap-2">
                        <User className="h-4 w-4 text-emerald-600" />
                        الاسم الكامل
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="أدخل الاسم الكامل"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-right flex flex-row-reverse items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-600" />
                        الجنس
                      </Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value, relation: ""})}>
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

                  {/* Relationship and Related Person */}
                  {formData.gender && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-right flex flex-row-reverse items-center gap-2">
                          <Heart className="h-4 w-4 text-emerald-600" />
                          صلة القرابة
                        </Label>
                        <Select value={formData.relation} onValueChange={(value) => setFormData({...formData, relation: value, relatedPersonId: null})}>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="اختر صلة القرابة" className="text-right" />
                          </SelectTrigger>
                          <SelectContent className="text-right">
                            {getRelationshipOptions(formData.gender, familyMembers).map((relation) => (
                              <SelectItem key={relation.value} value={relation.value} className="text-right justify-end">
                                {relation.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Related Person Selection */}
                      {formData.relation && familyMembers.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-right flex flex-row-reverse items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-600" />
                            ذو صلة بـ
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between text-right">
                                {formData.relatedPersonId ? 
                                  familyMembers.find(m => m.id === formData.relatedPersonId)?.name || "اختر شخص"
                                  : "اختر شخص"}
                                <Search className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <div className="p-2">
                                <Input
                                  placeholder="البحث عن شخص..."
                                  value={relatedPersonSearch}
                                  onChange={(e) => setRelatedPersonSearch(e.target.value)}
                                  className="text-right mb-2"
                                />
                                <div className="max-h-32 overflow-auto">
                                  {filteredRelatedPersons.map((person) => (
                                    <div
                                      key={person.id}
                                      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
                                      onClick={() => {
                                        setFormData({...formData, relatedPersonId: person.id});
                                        setRelatedPersonSearch("");
                                      }}
                                    >
                                      <Avatar className="h-8 w-8 ml-2">
                                        <AvatarImage src={person.image} />
                                        <AvatarFallback className="text-xs">
                                          {person.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="text-right">
                                        <p className="text-sm font-medium">{person.name}</p>
                                        <p className="text-xs text-gray-500">
                                          {person.relation === 'father' && 'أب'}
                                          {person.relation === 'mother' && 'أم'}
                                          {person.relation === 'son' && 'ابن'}
                                          {person.relation === 'daughter' && 'ابنة'}
                                          {person.relation === 'husband' && 'زوج'}
                                          {person.relation === 'wife' && 'زوجة'}
                                          {person.relation === 'brother' && 'أخ'}
                                          {person.relation === 'sister' && 'أخت'}
                                          {person.relation === 'founder' && 'المؤسس'}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Birth Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-right flex flex-row-reverse items-center gap-2">
                        <Baby className="h-4 w-4 text-emerald-600" />
                        تاريخ الميلاد
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-right font-normal", !formData.birthDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {formData.birthDate ? format(formData.birthDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.birthDate}
                            onSelect={(date) => setFormData({...formData, birthDate: date})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label className="text-right flex flex-row-reverse items-center gap-2">
                        <Heart className="h-4 w-4 text-emerald-600" />
                        الحالة
                      </Label>
                      <Select value={formData.isAlive ? "alive" : "deceased"} onValueChange={(value) => setFormData({...formData, isAlive: value === "alive"})}>
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
                  {!formData.isAlive && (
                    <div className="space-y-2">
                      <Label className="text-right flex flex-row-reverse items-center gap-2">
                        <Skull className="h-4 w-4 text-gray-600" />
                        تاريخ الوفاة
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-right font-normal", !formData.deathDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {formData.deathDate ? format(formData.deathDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.deathDate}
                            onSelect={(date) => setFormData({...formData, deathDate: date})}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {/* Profile Image Upload */}
                  <div className="space-y-2">
                    <Label className="text-right flex flex-row-reverse items-center gap-2">
                      <Camera className="h-4 w-4 text-emerald-600" />
                      الصورة الشخصية (اختياري)
                    </Label>
                    <div 
                      className="border-2 border-dashed border-emerald-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer"
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      {formData.croppedImage ? (
                        <div className="flex flex-col items-center space-y-2">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={formData.croppedImage} />
                            <AvatarFallback>صورة</AvatarFallback>
                          </Avatar>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({...formData, croppedImage: null, image: null});
                            }}
                          >
                            <X className="h-3 w-3 ml-1" />
                            إزالة الصورة
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <UploadCloud className="h-12 w-12 text-emerald-400 mx-auto" />
                          <p className="text-emerald-600">اسحب الصورة هنا أو انقر للاختيار</p>
                          <p className="text-sm text-emerald-500">PNG, JPG حتى 10MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </div>

                  {/* Biography */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-right flex flex-row-reverse items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      نبذة عن الشخص (اختياري)
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="اكتب نبذة مختصرة عن الشخص..."
                      className="text-right min-h-20"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      onClick={() => setCurrentMode('tree-view')}
                      variant="outline"
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleSaveMember}
                      disabled={!formData.name || !formData.gender || !formData.relation}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Save className="ml-2 h-4 w-4" />
                      {currentMode === 'edit-member' ? 'حفظ التعديلات' : 'إضافة العضو'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tree View */}
            {currentMode === 'tree-view' && (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-emerald-200 h-full flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-emerald-800 dark:text-emerald-200 text-2xl">
                      شجرة العائلة
                    </CardTitle>
                    <Button onClick={handleAddNewMember} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" />
                      إضافة عضو جديد
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {familyMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {familyMembers.map((member) => (
                        <Card key={member.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                          {!member.isAlive && (
                            <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                              <div className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none">
                                <div className="absolute top-0 right-0 w-full h-1 bg-black transform rotate-45 origin-top-right translate-y-8"></div>
                              </div>
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4 rtl:space-x-reverse mb-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={member.image} />
                                <AvatarFallback className="bg-emerald-100 text-emerald-600 font-bold">
                                  {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{member.name}</h3>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {member.relation === 'father' && 'أب'}
                                  {member.relation === 'mother' && 'أم'}
                                  {member.relation === 'son' && 'ابن'}
                                  {member.relation === 'daughter' && 'ابنة'}
                                  {member.relation === 'husband' && 'زوج'}
                                  {member.relation === 'wife' && 'زوجة'}
                                  {member.relation === 'brother' && 'أخ'}
                                  {member.relation === 'sister' && 'أخت'}
                                  {member.relation === 'founder' && 'المؤسس'}
                                </p>
                              </div>
                            </div>
                            
                            {member.birthDate && (
                              <p className="text-sm text-muted-foreground mb-2">
                                تاريخ الميلاد: {new Date(member.birthDate).toLocaleDateString('ar')}
                              </p>
                            )}
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditMember(member)}
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هل أنت متأكد من حذف {member.name} من شجرة العائلة؟ هذا الإجراء لا يمكن التراجع عنه.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteMember(member.id)} className="bg-red-600 hover:bg-red-700">
                                      حذف
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <TreePine className="h-24 w-24 text-emerald-300 mb-4" />
                      <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                        لا توجد أفراد في العائلة بعد
                      </h3>
                      <p className="text-emerald-600 mb-6">
                        ابدأ ببناء شجرة عائلتك عبر إضافة أول عضو
                      </p>
                      <Button onClick={handleAddNewMember} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="mr-2 h-4 w-4" />
                        إضافة أول عضو
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Members List */}
          {familyMembers.length > 0 && currentMode === 'tree-view' && (
            <div className="w-96 flex-shrink-0">
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-emerald-200 h-full flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-emerald-800 dark:text-emerald-200 text-lg">
                      أفراد العائلة ({filteredMembers.length})
                    </CardTitle>
                    <Button onClick={handleAddNewMember} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="البحث في أفراد العائلة..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-right pr-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  <div className="space-y-3">
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg border border-emerald-100 hover:bg-emerald-50 cursor-pointer transition-colors"
                        onClick={() => handleEditMember(member)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.image} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-600 text-sm font-bold">
                            {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.relation === 'father' && 'أب'}
                            {member.relation === 'mother' && 'أم'}
                            {member.relation === 'son' && 'ابن'}
                            {member.relation === 'daughter' && 'ابنة'}
                            {member.relation === 'husband' && 'زوج'}
                            {member.relation === 'wife' && 'زوجة'}
                            {member.relation === 'brother' && 'أخ'}
                            {member.relation === 'sister' && 'أخت'}
                            {member.relation === 'founder' && 'المؤسس'}
                          </p>
                        </div>
                        {!member.isAlive && (
                          <Badge variant="secondary" className="text-xs">
                            متوفى
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
      
      {/* Image Crop Modal */}
      <Dialog open={showImageCrop} onOpenChange={setShowImageCrop}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">قص الصورة</DialogTitle>
            <DialogDescription className="text-right">
              اضبط حجم وموضع الصورة كما تريد
            </DialogDescription>
          </DialogHeader>
          {imageSrc && (
            <div className="space-y-4">
              <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-right">التكبير</Label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowImageCrop(false)} 
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleCropSave}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Crop className="ml-2 h-4 w-4" />
                  حفظ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyBuilder;