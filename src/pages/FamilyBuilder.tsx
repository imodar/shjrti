import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Cropper from 'react-easy-crop';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Footer from "@/components/Footer";

// Mock data for existing family members
const mockFamilyMembers = [
  { id: 1, name: "أحمد محمد الأحمد", relation: "father", gender: "male", birthDate: "1950-03-15", isAlive: false, deathDate: "2020-12-01", image: null },
  { id: 2, name: "فاطمة سالم", relation: "mother", gender: "female", birthDate: "1955-08-20", isAlive: true, deathDate: null, image: null },
  { id: 3, name: "محمد أحمد", relation: "son", gender: "male", birthDate: "1975-12-10", isAlive: true, deathDate: null, image: null },
  { id: 4, name: "سارة علي", relation: "daughter", gender: "female", birthDate: "1978-05-22", isAlive: true, deathDate: null, image: null }
];

const getRelationshipOptions = (gender: string, familyMembers: any[] = []) => {
  const founderOption = [
    { value: "founder", label: "الفرد الذي ستبدأ منه العائلة" }
  ];
  
  // If this is the first member being added to the family tree, only show founder option
  if (familyMembers.length === 0) {
    return founderOption;
  }
  
  // For subsequent members, show all relationship options
  const commonOptions = [...founderOption];
  
  if (gender === "male") {
    return [
      ...commonOptions,
      { value: "father", label: "أب" },
      { value: "husband", label: "زوج" },
      { value: "brother", label: "أخ" },
      { value: "son", label: "ابن" }
    ];
  } else if (gender === "female") {
    return [
      ...commonOptions,
      { value: "mother", label: "أم" },
      { value: "wife", label: "زوجة" },
      { value: "sister", label: "أخت" },
      { value: "daughter", label: "ابنة" }
    ];
  }
  
  return commonOptions;
};

const FamilyBuilder = () => {
  const [searchParams] = useSearchParams();
  const treeId = searchParams.get('treeId');
  const isNew = searchParams.get('new') === 'true';
  const [currentMode, setCurrentMode] = useState<'welcome' | 'add-member' | 'edit-member'>('welcome');
  const [familyMembers, setFamilyMembers] = useState(isNew ? [] : mockFamilyMembers);
  const [draftMembers, setDraftMembers] = useState<any[]>([]);
  const [isNewTree, setIsNewTree] = useState(!treeId || isNew);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddChildren, setShowAddChildren] = useState(false);
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

  // Image cropping states
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [familyInfo, setFamilyInfo] = useState({
    familyName: "",
    familyDescription: "",
    founderName: ""
  });

  const [relatedPersonSearch, setRelatedPersonSearch] = useState("");

  // Image crop utility functions
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
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

    return canvas.toDataURL('image/jpeg');
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setFormData({ ...formData, croppedImage });
      setShowCropDialog(false);
      setImageToCrop(null);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setImageToCrop(null);
    setFormData({ ...formData, image: null });
  };

  useEffect(() => {
    if (isNewTree) {
      setCurrentMode('welcome');
    } else if (familyMembers.length === 0) {
      setCurrentMode(undefined);
    }
  }, [isNewTree]);

  const handleStartNewTree = () => {
    setCurrentMode('add-member');
    setIsNewTree(false);
  };

  const handleAddMember = () => {
    if (formData.name && formData.relation) {
      if (selectedMember) {
        // Update existing member
        setFamilyMembers(familyMembers.map(member => 
          member.id === selectedMember.id ? {
            ...member,
            name: formData.name,
            relation: formData.relation,
            gender: formData.gender,
            birthDate: formData.birthDate?.toISOString().split('T')[0] || "",
            bio: formData.bio,
            relatedPersonId: formData.relatedPersonId,
            isAlive: formData.isAlive,
            deathDate: formData.deathDate?.toISOString().split('T')[0] || null,
            image: formData.image ? URL.createObjectURL(formData.image) : member.image
          } : member
        ));
        setSelectedMember(null);
        setCurrentMode(familyMembers.length === 1 ? 'add-member' : undefined);
      } else {
        // Add new member
        const newMember = {
          id: Date.now(),
          name: formData.name,
          relation: formData.relation,
          gender: formData.gender,
          birthDate: formData.birthDate?.toISOString().split('T')[0] || "",
          bio: formData.bio,
          relatedPersonId: formData.relatedPersonId,
          isAlive: formData.isAlive,
          deathDate: formData.deathDate?.toISOString().split('T')[0] || null,
          image: formData.image ? URL.createObjectURL(formData.image) : null
        };
        
        setFamilyMembers([...familyMembers, newMember]);
        setShowAddChildren(true);
      }
      
      // Reset form
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
    }
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setCurrentMode('edit-member');
    setFormData({
      name: member.name,
      relation: member.relation,
      relatedPersonId: member.relatedPersonId,
      gender: member.gender,
      birthDate: member.birthDate ? new Date(member.birthDate) : null,
      isAlive: member.isAlive,
      deathDate: member.deathDate ? new Date(member.deathDate) : null,
      bio: member.bio || "",
      image: null,
      croppedImage: null
    });
  };

  const handleCancelEdit = () => {
    setSelectedMember(null);
    setCurrentMode(undefined);
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

  const handleContinueAdding = () => {
    setShowAddChildren(false);
    setCurrentMode('add-member');
  };

  const handleDeleteMember = (memberId: number) => {
    const updatedMembers = familyMembers.filter(member => member.id !== memberId);
    setFamilyMembers(updatedMembers);
    
    // If we're currently editing the deleted member, reset the form
    if (selectedMember?.id === memberId) {
      setSelectedMember(null);
      setCurrentMode(updatedMembers.length === 0 ? undefined : undefined);
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
    }
    
    // If this was the last member and we're in any editing mode, reset to default state
    if (updatedMembers.length === 0 && currentMode) {
      setCurrentMode(undefined);
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
    }
  };

  const handleSaveDraft = () => {
    if (formData.name) {
      if (selectedDraft) {
        // Update existing draft
        setDraftMembers(draftMembers.map(draft => 
          draft.id === selectedDraft.id ? {
            ...draft,
            ...formData,
            birthDate: formData.birthDate?.toISOString().split('T')[0] || "",
            deathDate: formData.deathDate?.toISOString().split('T')[0] || null,
            image: formData.image ? URL.createObjectURL(formData.image) : draft.image
          } : draft
        ));
        setSelectedDraft(null);
      } else {
        // Add new draft
        const newDraft = {
          id: Date.now(),
          ...formData,
          birthDate: formData.birthDate?.toISOString().split('T')[0] || "",
          deathDate: formData.deathDate?.toISOString().split('T')[0] || null,
          image: formData.image ? URL.createObjectURL(formData.image) : null,
          isDraft: true
        };
        setDraftMembers([...draftMembers, newDraft]);
      }
      
      // Reset form and go back to default state
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
      setCurrentMode(undefined);
    }
  };

  const handleEditDraft = (draft: any) => {
    setSelectedDraft(draft);
    setCurrentMode('add-member');
    setFormData({
      name: draft.name,
      relation: draft.relation,
      relatedPersonId: draft.relatedPersonId,
      gender: draft.gender,
      birthDate: draft.birthDate ? new Date(draft.birthDate) : null,
      isAlive: draft.isAlive,
      deathDate: draft.deathDate ? new Date(draft.deathDate) : null,
      bio: draft.bio || "",
      image: null,
      croppedImage: null
    });
  };

  const handleDeleteDraft = (draftId: number) => {
    setDraftMembers(draftMembers.filter(draft => draft.id !== draftId));
    if (selectedDraft?.id === draftId) {
      setSelectedDraft(null);
      setCurrentMode(undefined);
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
    }
  };

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrafts = draftMembers.filter(draft =>
    draft.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950" dir="rtl">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TreePine className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  بناء شجرة العائلة
                </h1>
                <p className="text-emerald-600 dark:text-emerald-400">
                  {isNewTree ? "إنشاء شجرة جديدة" : "إضافة أفراد العائلة"}
                </p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" className="flex items-center">
                العودة للوحة التحكم
                <ArrowLeft className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tree Information Section */}
      {!isNewTree && familyInfo.familyName && (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600/15 via-teal-500/15 to-blue-600/15 dark:from-emerald-800/25 dark:via-teal-700/25 dark:to-blue-800/25 backdrop-blur-xl border-b border-emerald-200/40 dark:border-emerald-700/40">
          {/* Creative animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating geometric shapes */}
            <div className="absolute top-2 left-8 w-3 h-3 bg-emerald-400/30 rotate-45 animate-spin" style={{animationDuration: '8s'}}></div>
            <div className="absolute top-4 right-16 w-2 h-6 bg-teal-400/25 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-1 left-1/4 w-4 h-1 bg-blue-400/30 rounded-full animate-pulse" style={{animationDelay: '1.2s'}}></div>
            <div className="absolute top-3 right-1/3 w-2 h-2 bg-emerald-500/25 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
            
            {/* Subtle wave pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                <path d="M0,30 Q100,10 200,30 T400,30 V60 H0 V30 Z" fill="url(#waveGradient)" className="animate-pulse"/>
                <defs>
                  <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.1"/>
                    <stop offset="50%" stopColor="rgb(20 184 166)" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          
          <div className="container mx-auto px-6 py-3 relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    عائلة {familyInfo.familyName}
                  </h2>
                </div>
                {familyInfo.familyDescription && (
                  <p className="text-emerald-700 dark:text-emerald-300 text-sm mt-1 pl-11">
                    {familyInfo.familyDescription}
                  </p>
                )}
              </div>
              
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-emerald-200/40 dark:border-emerald-700/40">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-2.99 4v7h8z"/>
                    </svg>
                  </div>
                  <span className="text-base font-semibold text-emerald-800 dark:text-emerald-200">
                    {familyMembers.length}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                    عضو
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Subtle bottom border glow */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
        </div>
      )}

      <div className="flex h-[calc(100vh-120px)] gap-6 px-4 py-6 max-w-7xl mx-auto">
        {/* Left Column - Form */}
        <div className={cn("flex-1", familyMembers.length > 0 ? "max-w-3xl" : "max-w-none")}>
          {/* Welcome Screen for New Tree */}
          {currentMode === 'welcome' && isNewTree && (
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-emerald-200 h-full">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-200">
                  مرحباً بك في إنشاء شجرة عائلة جديدة! 🌳
                </CardTitle>
                <CardDescription>
                  ابدأ بإدخال معلومات عائلتك الأساسية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="familyName" className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-emerald-600" />
                      اسم العائلة
                    </Label>
                    <Input 
                      id="familyName" 
                      placeholder="عائلة الأحمد"
                      value={familyInfo.familyName}
                      onChange={(e) => setFamilyInfo({...familyInfo, familyName: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="familyDescription" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      وصف العائلة
                    </Label>
                    <Textarea 
                      id="familyDescription" 
                      placeholder="نبذة مختصرة عن العائلة وتاريخها..."
                      className="min-h-[100px]"
                      value={familyInfo.familyDescription}
                      onChange={(e) => setFamilyInfo({...familyInfo, familyDescription: e.target.value})}
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center"
                  onClick={handleStartNewTree}
                  disabled={!familyInfo.familyName}
                >
                  بدء إنشاء شجرة العائلة
                  <TreePine className="mr-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* No Members State - Creative Welcome */}
          {!isNewTree && familyMembers.length === 0 && !currentMode && (
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 h-full flex items-center justify-center">
              <CardContent className="text-center space-y-6 py-16">
                <div className="space-y-4">
                  <TreePine className="mx-auto h-24 w-24 text-emerald-500" />
                  <h2 className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                    يلا نضيف أعضاء عائلتك
                  </h2>
                  <p className="text-emerald-600 dark:text-emerald-400 text-lg max-w-md mx-auto">
                    ابدأ ببناء شجرة عائلتك عبر إضافة الأعضاء واحد تلو الآخر
                  </p>
                </div>
                <Button 
                  onClick={handleAddNewMember}
                  className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3 h-auto"
                >
                  <Plus className="ml-2 h-5 w-5" />
                  إضافة أول عضو
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Default State - Add Member Prompt */}
          {!currentMode && !isNewTree && familyMembers.length > 0 && (
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 h-full flex items-center justify-center">
              <CardContent className="text-center space-y-6 py-16">
                <div className="space-y-4">
                  <Users className="mx-auto h-20 w-20 text-emerald-500" />
                  <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    انقر هنا لإضافة عضو جديد
                  </h2>
                  <p className="text-emerald-600 dark:text-emerald-400 max-w-md mx-auto">
                    اختر عضواً من القائمة لتعديل بياناته، أو أضف عضواً جديداً لشجرة العائلة
                  </p>
                </div>
                <Button 
                  onClick={handleAddNewMember}
                  className="bg-emerald-600 hover:bg-emerald-700 text-lg px-6 py-3 h-auto"
                >
                  <Plus className="ml-2 h-5 w-5" />
                  إضافة عضو جديد
                </Button>
              </CardContent>
            </Card>
          )}

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
                {/* Name and Gender on same line */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      الاسم الكامل
                    </Label>
                    <Input 
                      id="name" 
                      placeholder="أحمد محمد الأحمد"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right flex items-center justify-end gap-2 w-full">
                      الجنس
                      <Baby className="h-4 w-4 text-emerald-600" />
                    </Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value, relation: ""})}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="الجنس" className="text-right" />
                      </SelectTrigger>
                      <SelectContent className="text-right">
                        <SelectItem value="male" className="text-right justify-end">ذكر</SelectItem>
                        <SelectItem value="female" className="text-right justify-end">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Relationship and Related Person on same line */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-right flex items-center justify-end gap-2">
                      <Heart className="h-4 w-4 text-emerald-600" />
                      صلة القرابة
                    </Label>
                    <Select value={formData.relation} onValueChange={(value) => setFormData({...formData, relation: value})}>
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
                  {!isNewTree && familyMembers.length > 0 && formData.relation && formData.relation !== "founder" && (
                    <div className="space-y-2">
                      <Label className="text-right block">اختر الشخص المرتبط بهذه القرابة</Label>
                      <Select 
                        value={formData.relatedPersonId?.toString() || ""} 
                        onValueChange={(value) => setFormData({...formData, relatedPersonId: parseInt(value)})}
                      >
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="ابحث واختر الشخص المرتبط" className="text-right" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 text-right">
                          <div className="p-2">
                            <Input
                              placeholder="ابحث عن شخص..."
                              value={relatedPersonSearch}
                              onChange={(e) => setRelatedPersonSearch(e.target.value)}
                            />
                          </div>
                          {familyMembers
                            .filter(member => 
                              member.name.toLowerCase().includes(relatedPersonSearch.toLowerCase())
                            )
                            .map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()} className="text-right justify-end">
                              <span>{member.name}</span>
                            </SelectItem>
                          ))}
                          {familyMembers.filter(member => 
                            member.name.toLowerCase().includes(relatedPersonSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="p-2 text-center text-muted-foreground text-sm">
                              لا توجد نتائج للبحث
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Birth Date and Life Status */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-emerald-600" />
                      تاريخ الميلاد
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-end text-right font-normal flex-row-reverse",
                            !formData.birthDate && "text-muted-foreground"
                          )}
                        >
                          {formData.birthDate ? format(formData.birthDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                          <CalendarIcon className="mr-2 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.birthDate}
                          onSelect={(date) => setFormData({...formData, birthDate: date})}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-right flex items-center justify-end gap-2">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      حالة الشخص
                    </Label>
                    <Select value={formData.isAlive.toString()} onValueChange={(value) => setFormData({...formData, isAlive: value === 'true', deathDate: value === 'true' ? null : formData.deathDate})}>
                      <SelectTrigger className="text-right [&>span]:text-right">
                        <SelectValue placeholder="حالة الشخص" className="text-right" />
                      </SelectTrigger>
                      <SelectContent className="text-right">
                        <SelectItem value="true" className="text-right justify-end">على قيد الحياة</SelectItem>
                        <SelectItem value="false" className="text-right justify-end">متوفى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Death Date (if deceased) */}
                {!formData.isAlive && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Skull className="h-4 w-4 text-gray-600" />
                      تاريخ الوفاة (اختياري)
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-end text-right font-normal flex-row-reverse",
                            !formData.deathDate && "text-muted-foreground"
                          )}
                        >
                          {formData.deathDate ? format(formData.deathDate, "PPP", { locale: ar }) : "اختر تاريخ الوفاة"}
                          <CalendarIcon className="mr-2 h-4 w-4" />
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

                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    نبذة شخصية (اختياري)
                  </Label>
                  <Textarea 
                    id="bio" 
                    placeholder="اكتب نبذة قصيرة عن هذا الشخص..."
                    className="min-h-[100px]"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    صورة الشخص (اختياري)
                  </Label>
                  <div className="border-2 border-dashed border-emerald-200 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const imageUrl = URL.createObjectURL(file);
                          setFormData({...formData, image: file});
                          setImageToCrop(imageUrl);
                          setShowCropDialog(true);
                        }
                      }}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {formData.croppedImage ? (
                        <div className="space-y-2">
                          <img 
                            src={formData.croppedImage} 
                            alt="Preview" 
                            className="mx-auto h-24 w-24 rounded-full object-cover"
                          />
                          <p className="text-sm text-emerald-600">صورة محصولة جاهزة</p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({...formData, image: null, croppedImage: null});
                            }}
                          >
                            إزالة الصورة
                          </Button>
                        </div>
                      ) : formData.image ? (
                        <div className="space-y-2">
                          <img 
                            src={URL.createObjectURL(formData.image)} 
                            alt="Preview" 
                            className="mx-auto h-24 w-24 rounded-full object-cover"
                          />
                          <p className="text-sm text-emerald-600">{formData.image.name}</p>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                const imageUrl = URL.createObjectURL(formData.image!);
                                setImageToCrop(imageUrl);
                                setShowCropDialog(true);
                              }}
                            >
                              قص الصورة
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setFormData({...formData, image: null, croppedImage: null});
                              }}
                            >
                              إزالة الصورة
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-emerald-400" />
                          <p className="text-emerald-600">اسحب وأفلت الصورة أو انقر للاختيار</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (حتى 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t p-4">
                  <div className="max-w-3xl mx-auto flex justify-between">
                    <Button 
                      variant="outline" 
                      className="flex items-center" 
                      onClick={handleSaveDraft}
                      disabled={!formData.name}
                    >
                      حفظ المسودة
                      <Save className="mr-2 h-4 w-4" />
                    </Button>
                    
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleCancelEdit}>
                        إلغاء
                      </Button>
                      <Button 
                        onClick={handleAddMember}
                        className="bg-emerald-600 hover:bg-emerald-700 flex items-center"
                        disabled={!formData.name || !formData.relation}
                      >
                        {currentMode === 'edit-member' ? 'حفظ التعديل' : 'إضافة الفرد'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Members List */}
        {(familyMembers.length > 0 || draftMembers.length > 0) && (
          <div className="w-96 flex-shrink-0">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-emerald-200 h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-emerald-800 dark:text-emerald-200 text-lg">
                    أفراد العائلة ({filteredMembers.length + filteredDrafts.length})
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
                    className="pr-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0 space-y-3">
                {filteredMembers.length === 0 && filteredDrafts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground px-6">
                    <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>لا توجد نتائج للبحث عن "{searchTerm}"</p>
                  </div>
                ) : (
                  <div className="space-y-4 px-4 pb-4">
                    {/* Draft Members Section */}
                    {filteredDrafts.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-2">
                          <Save className="h-4 w-4 text-orange-500" />
                          <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            المسودات ({filteredDrafts.length})
                          </h3>
                        </div>
                        {filteredDrafts.map((draft) => (
                          <div 
                            key={`draft-${draft.id}`}
                            className={cn(
                              "relative flex items-center gap-3 p-3 border-2 border-dashed border-orange-200 rounded-lg cursor-pointer transition-all duration-200",
                              selectedDraft?.id === draft.id 
                                ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300" 
                                : "bg-orange-25 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            )}
                            onClick={() => handleEditDraft(draft)}
                          >
                            {/* Draft Icon */}
                            <div className="flex-shrink-0 relative z-10">
                              {draft.image ? (
                                <img 
                                  src={draft.image} 
                                  alt={draft.name}
                                  className="h-12 w-12 rounded-full object-cover border-2 border-orange-200 opacity-75"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center">
                                  {draft.gender === 'female' ? (
                                    <UserRoundIcon className="h-7 w-7 text-orange-500" />
                                  ) : (
                                    <UserIcon className="h-7 w-7 text-orange-500" />
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Draft Info */}
                            <div className="flex-1 min-w-0 relative z-10">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm text-orange-700 dark:text-orange-300 truncate">
                                  {draft.name}
                                </h4>
                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-600 border-orange-300 px-1">
                                  مسودة
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-orange-600/70">
                                  {draft.gender === 'male' ? 'ذكر' : 'أنثى'}
                                </span>
                                {draft.relation && (
                                  <span className="text-xs text-orange-600/70">
                                    • غير مكتمل
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Draft Action Buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-orange-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditDraft(draft);
                                }}
                              >
                                <Edit className="h-4 w-4 text-orange-600" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-200"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl" className="text-right">
                                  <AlertDialogHeader className="text-right">
                                    <AlertDialogTitle className="text-right">حذف المسودة</AlertDialogTitle>
                                    <AlertDialogDescription className="text-right">
                                      هل أنت متأكد من حذف مسودة "{draft.name}"؟
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex gap-2 flex-row-reverse">
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDraft(draft.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      حذف
                                    </AlertDialogAction>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Completed Members Section */}
                    {filteredMembers.length > 0 && (
                      <div className="space-y-2">
                        {filteredDrafts.length > 0 && (
                          <div className="flex items-center gap-2 px-2">
                            <Users className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              الأعضاء المكتملين ({filteredMembers.length})
                            </h3>
                          </div>
                        )}
                         <div className="space-y-2">
                           {filteredMembers.map((member) => (
                             <div 
                               key={member.id} 
                               className={cn(
                                 "relative flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200",
                                 selectedMember?.id === member.id 
                                   ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 shadow-md" 
                                   : "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-emerald-100"
                               )}
                               onClick={() => handleEditMember(member)}
                             >
                               {/* Deceased mourning ribbon */}
                               {!member.isAlive && (
                                 <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                                   <div className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none">
                                     <div className="absolute top-0 right-0 w-full h-1 bg-black transform rotate-45 origin-top-right translate-y-6"></div>
                                   </div>
                                 </div>
                               )}
                               
                               {/* Member Image/Icon */}
                               <div className="flex-shrink-0 relative z-10">
                                 {member.image ? (
                                   <img 
                                     src={member.image} 
                                     alt={member.name}
                                     className={cn(
                                       "h-12 w-12 rounded-full object-cover border-2 border-emerald-200",
                                       !member.isAlive && "grayscale"
                                     )}
                                   />
                                 ) : (
                                   <div className={cn(
                                     "h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center",
                                     !member.isAlive && "bg-gray-200 dark:bg-gray-700"
                                   )}>
                                     {member.gender === 'female' ? (
                                       <UserRoundIcon className="h-7 w-7 text-pink-500" />
                                     ) : (
                                       <UserIcon className="h-7 w-7 text-blue-500" />
                                     )}
                                   </div>
                                 )}
                               </div>
                               
                               {/* Member Info */}
                               <div className="flex-1 min-w-0 relative z-10">
                                 <div className="flex items-center gap-2">
                                   <h4 className={cn(
                                     "font-medium text-sm text-emerald-800 dark:text-emerald-200 truncate",
                                     !member.isAlive && "text-gray-600 dark:text-gray-400"
                                   )}>
                                     {member.name}
                                   </h4>
                                   {!member.isAlive && (
                                     <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 px-1">
                                       متوفى
                                     </Badge>
                                   )}
                                 </div>
                                 <div className="flex items-center gap-1 mt-1">
                                   <span className="text-xs text-muted-foreground">
                                     {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                                   </span>
                                   {member.birthDate && (
                                     <span className="text-xs text-muted-foreground">
                                       • {new Date(member.birthDate).getFullYear()}
                                     </span>
                                   )}
                                 </div>
                               </div>
                               
                               {/* Action Buttons */}
                               <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   className="h-8 w-8 p-0 hover:bg-emerald-200"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleEditMember(member);
                                   }}
                                 >
                                   <Edit className="h-4 w-4 text-emerald-600" />
                                 </Button>
                                 
                                 <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="h-8 w-8 p-0 hover:bg-red-200"
                                       onClick={(e) => e.stopPropagation()}
                                     >
                                       <Trash2 className="h-4 w-4 text-red-500" />
                                     </Button>
                                   </AlertDialogTrigger>
                                    <AlertDialogContent dir="rtl" className="text-right bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
                                      <AlertDialogHeader className="text-right">
                                        <div className="flex items-center justify-center mb-4">
                                          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                                            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
                                          </div>
                                        </div>
                                        <AlertDialogTitle className="text-right text-xl font-bold text-red-800 dark:text-red-200 text-center">
                                          ⚠️ تأكيد الحذف
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-right bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 mt-4 border border-red-200 dark:border-red-700">
                                          <div className="space-y-3">
                                            <p className="text-gray-800 dark:text-gray-200 font-medium">
                                              هل أنت متأكد من حذف <span className="font-bold text-red-600 dark:text-red-400">"{member.name}"</span> من شجرة العائلة؟
                                            </p>
                                            
                                            <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                                              <div className="flex items-start gap-2">
                                                <span className="text-orange-600 dark:text-orange-400 text-lg">⚡</span>
                                                <div>
                                                  <p className="font-semibold text-orange-800 dark:text-orange-300">ملاحظة مهمة:</p>
                                                  <p className="text-orange-700 dark:text-orange-400 text-sm">
                                                    إذا كان لديه أطفال تحته، فسيتم حذفه مع جميع أطفاله.
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
                                              <div className="flex items-center gap-2">
                                                <span className="text-red-600 dark:text-red-400 text-lg">🚫</span>
                                                <p className="text-red-800 dark:text-red-300 font-medium text-sm">
                                                  هذا الإجراء لا يمكن التراجع عنه نهائياً!
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex gap-3 flex-row-reverse mt-6">
                                        <AlertDialogAction
                                          onClick={() => handleDeleteMember(member.id)}
                                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                                        >
                                          <Trash2 className="h-4 w-4 ml-2" />
                                          حذف نهائي
                                        </AlertDialogAction>
                                        <AlertDialogCancel className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-medium px-6 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200">
                                          <X className="h-4 w-4 ml-2" />
                                          إلغاء
                                        </AlertDialogCancel>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                 </AlertDialog>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
         )}

        {/* Add Children Dialog */}
        <Dialog open={showAddChildren} onOpenChange={setShowAddChildren}>
          <DialogContent className="sm:max-w-lg overflow-hidden border-0 bg-gradient-to-br from-emerald-50/90 via-teal-50/90 to-cyan-50/90 backdrop-blur-xl shadow-2xl" dir="rtl">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-emerald-200/20 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-teal-200/20 rounded-full animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-emerald-400/30 rounded-full animate-bounce delay-500"></div>
              <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-teal-400/40 rounded-full animate-bounce delay-700"></div>
              <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-cyan-300/20 rounded-full animate-pulse delay-300"></div>
            </div>

            <DialogHeader className="relative z-10 text-center space-y-4 pb-2">
              {/* Success Icon with Animation */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl animate-bounce">✅</span>
                </div>
              </div>
              
              {/* Enhanced Title */}
              <DialogTitle className="text-right text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
                تمت الإضافة بنجاح!
              </DialogTitle>
              
              {/* Decorative Line */}
              <div className="flex justify-center">
                <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full shadow-sm"></div>
              </div>
              
              {/* Enhanced Description */}
              <DialogDescription className="text-right text-lg text-slate-600 font-medium leading-relaxed px-2">
                <span className="inline-flex items-center gap-2">
                  <span className="text-emerald-600">🌟</span>
                  هل تريد إضافة أولاد أو أقارب لهذا الشخص؟
                  <span className="text-teal-600">👨‍👩‍👧‍👦</span>
                </span>
              </DialogDescription>
            </DialogHeader>
            
            {/* Action Buttons with Enhanced Design */}
            <div className="flex gap-4 pt-6 relative z-10">
              <Button 
                variant="outline" 
                onClick={() => setShowAddChildren(false)}
                className="flex-1 h-12 border-2 border-slate-200/80 bg-white/80 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 text-slate-700 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <span>⏭️</span>
                  تخطي
                </span>
              </Button>
              
              <Button 
                onClick={handleContinueAdding}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 border-0 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">✨</span>
                  إضافة
                  <span>➕</span>
                </span>
              </Button>
            </div>
            
            {/* Subtle Bottom Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-60"></div>
          </DialogContent>
        </Dialog>

        {/* Image Crop Dialog */}
        <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">قص الصورة</DialogTitle>
              <DialogDescription className="text-right">
                اختر الجزء الذي تريد استخدامه من الصورة
              </DialogDescription>
            </DialogHeader>
            
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              {imageToCrop && (
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1} // Square crop for profile pictures
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={true}
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#f3f4f6'
                    }
                  }}
                />
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">التكبير:</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleCropCancel}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleCropSave}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  حفظ الصورة المقصوصة
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Footer />
    </div>
  );
};

export default FamilyBuilder;