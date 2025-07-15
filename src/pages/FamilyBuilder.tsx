import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for existing family members
const mockFamilyMembers = [
  { id: 1, name: "أحمد محمد الأحمد", relation: "father", gender: "male", birthDate: "1950-03-15", isAlive: false, deathDate: "2020-12-01", image: null },
  { id: 2, name: "فاطمة سالم", relation: "mother", gender: "female", birthDate: "1955-08-20", isAlive: true, deathDate: null, image: null },
  { id: 3, name: "محمد أحمد", relation: "son", gender: "male", birthDate: "1975-12-10", isAlive: true, deathDate: null, image: null },
  { id: 4, name: "سارة علي", relation: "daughter", gender: "female", birthDate: "1978-05-22", isAlive: true, deathDate: null, image: null }
];

const getRelationshipOptions = (gender: string) => {
  const commonOptions = [
    { value: "founder", label: "الفرد الذي ستبدأ منه العائلة" }
  ];
  
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
    image: null as File | null
  });

  const [familyInfo, setFamilyInfo] = useState({
    familyName: "",
    familyDescription: "",
    founderName: ""
  });

  const [relatedPersonSearch, setRelatedPersonSearch] = useState("");

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
        image: null
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
      image: null
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
      image: null
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
      image: null
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
        image: null
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
        image: null
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
        image: null
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
      image: null
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
        image: null
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
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                  {familyInfo.familyName}
                </h2>
                {familyInfo.familyDescription && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    {familyInfo.familyDescription}
                  </p>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {familyMembers.length} عضو
              </div>
            </div>
          </div>
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
              <CardContent className="space-y-6 pb-20">
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
                    <Label className="text-right flex items-center justify-end gap-2">
                      <Baby className="h-4 w-4 text-emerald-600" />
                      الجنس
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
                        {getRelationshipOptions(formData.gender).map((relation) => (
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
                        if (file) setFormData({...formData, image: file});
                      }}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {formData.image ? (
                        <div className="space-y-2">
                          <img 
                            src={URL.createObjectURL(formData.image)} 
                            alt="Preview" 
                            className="mx-auto h-24 w-24 rounded-full object-cover"
                          />
                          <p className="text-sm text-emerald-600">{formData.image.name}</p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              setFormData({...formData, image: null});
                            }}
                          >
                            إزالة الصورة
                          </Button>
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
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t p-4 z-20">
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
                                   <AlertDialogContent dir="rtl" className="text-right">
                                     <AlertDialogHeader className="text-right">
                                       <AlertDialogTitle className="text-right">تأكيد الحذف</AlertDialogTitle>
                                       <AlertDialogDescription className="text-right">
                                         هل أنت متأكد من حذف "{member.name}" من شجرة العائلة؟ 
                                         <br />
                                         هذا الإجراء لا يمكن التراجع عنه.
                                       </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter className="flex gap-2 flex-row-reverse">
                                       <AlertDialogAction
                                         onClick={() => handleDeleteMember(member.id)}
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
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>تمت الإضافة بنجاح! ✅</DialogTitle>
              <DialogDescription>
                هل تريد إضافة أولاد أو أقارب لهذا الشخص؟
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddChildren(false)}
                className="flex-1"
              >
                تخطي
              </Button>
              <Button 
                onClick={handleContinueAdding}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                إضافة المزيد
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FamilyBuilder;