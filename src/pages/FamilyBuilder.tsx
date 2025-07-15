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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for existing family members
const mockFamilyMembers = [
  { id: 1, name: "أحمد محمد الأحمد", relation: "father", gender: "male", birthDate: "1950-03-15", isAlive: false, deathDate: "2020-12-01", image: null },
  { id: 2, name: "فاطمة سالم", relation: "mother", gender: "female", birthDate: "1955-08-20", isAlive: true, deathDate: null, image: null },
  { id: 3, name: "محمد أحمد", relation: "son", gender: "male", birthDate: "1975-12-10", isAlive: true, deathDate: null, image: null },
  { id: 4, name: "سارة علي", relation: "daughter", gender: "female", birthDate: "1978-05-22", isAlive: true, deathDate: null, image: null }
];

const relationshipOptions = [
  { value: "father", label: "أب" },
  { value: "mother", label: "أم" },
  { value: "brother", label: "أخ" },
  { value: "sister", label: "أخت" },
  { value: "son", label: "ابن" },
  { value: "daughter", label: "ابنة" }
];

const FamilyBuilder = () => {
  const [searchParams] = useSearchParams();
  const treeId = searchParams.get('treeId');
  const [currentMode, setCurrentMode] = useState<'welcome' | 'add-member' | 'select-relation'>('welcome');
  const [familyMembers, setFamilyMembers] = useState(mockFamilyMembers);
  const [isNewTree, setIsNewTree] = useState(!treeId);
  const [selectedMember, setSelectedMember] = useState<any>(null);
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
    } else {
      setCurrentMode('add-member');
    }
  }, [isNewTree]);

  const handleStartNewTree = () => {
    setCurrentMode('add-member');
    setIsNewTree(false);
  };

  const handleAddMember = () => {
    if (formData.name && formData.relation) {
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
      
      // Show option to add children
      setShowAddChildren(true);
    }
  };

  const handleContinueAdding = () => {
    setShowAddChildren(false);
    setCurrentMode('add-member');
  };

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Screen for New Tree */}
        {currentMode === 'welcome' && isNewTree && (
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-emerald-200">
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
                  <Label htmlFor="familyName">اسم العائلة</Label>
                  <Input 
                    id="familyName" 
                    placeholder="عائلة الأحمد"
                    value={familyInfo.familyName}
                    onChange={(e) => setFamilyInfo({...familyInfo, familyName: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="familyDescription">وصف العائلة</Label>
                  <Textarea 
                    id="familyDescription" 
                    placeholder="نبذة مختصرة عن العائلة وتاريخها..."
                    className="min-h-[100px]"
                    value={familyInfo.familyDescription}
                    onChange={(e) => setFamilyInfo({...familyInfo, familyDescription: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="founderName">اسم الشخص الذي ستبدأ منه الشجرة</Label>
                  <Input 
                    id="founderName" 
                    placeholder="أحمد محمد الأحمد (الجد أو الأب)"
                    value={familyInfo.founderName}
                    onChange={(e) => setFamilyInfo({...familyInfo, founderName: e.target.value})}
                  />
                </div>
              </div>
              
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleStartNewTree}
                disabled={!familyInfo.familyName || !familyInfo.founderName}
              >
                <TreePine className="ml-2 h-4 w-4" />
                بدء إنشاء شجرة العائلة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Member Form */}
        {currentMode === 'add-member' && (
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-800 dark:text-emerald-200">
                إضافة فرد جديد للعائلة
              </CardTitle>
              <CardDescription>
                أدخل معلومات الفرد الجديد وحدد صلة القرابة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name and Gender on same line */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input 
                    id="name" 
                    placeholder="أحمد محمد الأحمد"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الجنس</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Relationship and Related Person on same line */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>صلة القرابة</Label>
                  <Select value={formData.relation} onValueChange={(value) => setFormData({...formData, relation: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر صلة القرابة" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((relation) => (
                        <SelectItem key={relation.value} value={relation.value}>
                          {relation.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Related Person Selection */}
                {!isNewTree && familyMembers.length > 0 && formData.relation && (
                  <div className="space-y-2">
                    <Label>اختر الشخص المرتبط بهذه القرابة</Label>
                    <Select 
                      value={formData.relatedPersonId?.toString() || ""} 
                      onValueChange={(value) => setFormData({...formData, relatedPersonId: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="ابحث واختر الشخص المرتبط" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
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
                          <SelectItem key={member.id} value={member.id.toString()}>
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
                  <Label>تاريخ الميلاد</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal",
                          !formData.birthDate && "text-muted-foreground"
                        )}
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
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>حالة الشخص</Label>
                  <Select value={formData.isAlive.toString()} onValueChange={(value) => setFormData({...formData, isAlive: value === 'true', deathDate: value === 'true' ? null : formData.deathDate})}>
                    <SelectTrigger>
                      <SelectValue placeholder="حالة الشخص" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">على قيد الحياة</SelectItem>
                      <SelectItem value="false">متوفى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Death Date (if deceased) */}
              {!formData.isAlive && (
                <div className="space-y-2">
                  <Label>تاريخ الوفاة (اختياري)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal",
                          !formData.deathDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {formData.deathDate ? format(formData.deathDate, "PPP", { locale: ar }) : "اختر تاريخ الوفاة"}
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
                <Label htmlFor="bio">نبذة شخصية (اختياري)</Label>
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
                <Label>صورة الشخص (اختياري)</Label>
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

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline">
                  <Save className="ml-2 h-4 w-4" />
                  حفظ المسودة
                </Button>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentMode('welcome')}>
                    إلغاء
                  </Button>
                  <Button 
                    onClick={handleAddMember}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={!formData.name || !formData.relation}
                  >
                    إضافة الفرد
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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

        {/* Family Members List */}
        {familyMembers.length > 0 && (
          <Card className="mt-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-emerald-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-emerald-800 dark:text-emerald-200">
                  أفراد العائلة ({filteredMembers.length} من {familyMembers.length})
                </CardTitle>
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative min-w-64">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>لا توجد نتائج للبحث عن "{searchTerm}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMembers.map((member, index) => (
                  <div key={member.id} className="relative flex items-center gap-4 p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                    {/* Deceased mourning ribbon */}
                    {!member.isAlive && (
                      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                        <div className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none">
                          <div className="absolute top-0 right-0 w-full h-1 bg-black transform rotate-45 origin-top-right translate-y-8"></div>
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
                            "h-16 w-16 rounded-full object-cover border-2 border-emerald-200",
                            !member.isAlive && "grayscale"
                          )}
                        />
                      ) : (
                        <div className={cn(
                          "h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center",
                          !member.isAlive && "bg-gray-200 dark:bg-gray-700"
                        )}>
                          {member.gender === 'female' ? (
                            <UserRoundIcon className="h-10 w-10 text-pink-500" />
                          ) : (
                            <UserIcon className="h-10 w-10 text-blue-500" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Member Info */}
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="flex items-center gap-2">
                        <h4 className={cn(
                          "font-medium text-lg text-emerald-800 dark:text-emerald-200",
                          !member.isAlive && "text-gray-600 dark:text-gray-400"
                        )}>
                          {member.name}
                        </h4>
                        {!member.isAlive && (
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                            متوفى
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                        </span>
                        {member.birthDate && (
                          <span className="text-sm text-muted-foreground">
                            • {member.birthDate}
                          </span>
                        )}
                        {!member.isAlive && member.deathDate && (
                          <span className="text-sm text-red-600">
                            • وفاة: {member.deathDate}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Edit Button */}
                    <div className="flex items-center gap-3 relative z-10">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {/* Tree Connection Lines */}
                      <div className="text-emerald-400">
                        <TreePine className="h-5 w-5" />
                      </div>
                    </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FamilyBuilder;