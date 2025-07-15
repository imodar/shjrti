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
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for existing family members
const mockFamilyMembers = [
  { id: 1, name: "أحمد محمد الأحمد", relation: "الجد", gender: "male", birthDate: "1950-03-15" },
  { id: 2, name: "فاطمة سالم", relation: "الجدة", gender: "female", birthDate: "1955-08-20" },
  { id: 3, name: "محمد أحمد", relation: "الوالد", gender: "male", birthDate: "1975-12-10" },
  { id: 4, name: "سارة علي", relation: "الوالدة", gender: "female", birthDate: "1978-05-22" }
];

const relationshipOptions = [
  { value: "father", label: "الوالد" },
  { value: "mother", label: "الوالدة" },
  { value: "grandfather", label: "الجد" },
  { value: "grandmother", label: "الجدة" },
  { value: "brother", label: "الأخ" },
  { value: "sister", label: "الأخت" },
  { value: "son", label: "الابن" },
  { value: "daughter", label: "الابنة" },
  { value: "uncle", label: "العم" },
  { value: "aunt", label: "العمة" },
  { value: "cousin", label: "ابن العم/الخال" }
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
    parentId: null as number | null,
    gender: "",
    birthDate: null as Date | null,
    bio: "",
    profession: ""
  });

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
        profession: formData.profession,
        parentId: formData.parentId
      };
      
      setFamilyMembers([...familyMembers, newMember]);
      
      // Reset form
      setFormData({
        name: "",
        relation: "",
        parentId: null,
        gender: "",
        birthDate: null,
        bio: "",
        profession: ""
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
                لبناء شجرة عائلتك، من تفضل أن تبدأ به؟
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Button 
                  className="h-20 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleStartNewTree}
                >
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <div>ابدأ بنفسك</div>
                    <div className="text-sm opacity-90">أضف معلوماتك أولاً</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20"
                  onClick={handleStartNewTree}
                >
                  <div className="text-center">
                    <TreePine className="h-8 w-8 mx-auto mb-2" />
                    <div>ابدأ بأقرب شخص</div>
                    <div className="text-sm opacity-70">جد، والد، أو أي قريب</div>
                  </div>
                </Button>
              </div>
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
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input 
                    id="name" 
                    placeholder="أحمد محمد الأحمد"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
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
              </div>

              {/* Parent Selection (if applicable) */}
              {!isNewTree && familyMembers.length > 0 && ['son', 'daughter'].includes(formData.relation) && (
                <div className="space-y-2">
                  <Label>اختر الوالد/الوالدة</Label>
                  <Select value={formData.parentId?.toString() || ""} onValueChange={(value) => setFormData({...formData, parentId: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر من القائمة" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.filter(m => ['father', 'mother'].includes(m.relation)).map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name} ({relationshipOptions.find(r => r.value === member.relation)?.label})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>الجنس</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">المهنة (اختياري)</Label>
                <Input 
                  id="profession" 
                  placeholder="مهندس، طبيب، معلم..."
                  value={formData.profession}
                  onChange={(e) => setFormData({...formData, profession: e.target.value})}
                />
              </div>

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
              <CardTitle className="text-emerald-800 dark:text-emerald-200">
                أفراد العائلة ({familyMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyMembers.map((member) => (
                  <div key={member.id} className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{member.name}</h4>
                      <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded">
                        {relationshipOptions.find(r => r.value === member.relation)?.label || member.relation}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.gender === 'male' ? 'ذكر' : 'أنثى'} • {member.birthDate}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FamilyBuilder;