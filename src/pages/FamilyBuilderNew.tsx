import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Edit2, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop, Star, Sparkles, Image, Store, MoreVertical, Menu, ChevronsUpDown, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";
import { useIsMobile } from "@/hooks/use-mobile";
import WifeForm from "@/components/WifeForm";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

const FamilyBuilderNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { hasAIFeatures } = useSubscription();
  const isImageUploadEnabled = useImageUploadPermission();

  // State
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyMarriages, setFamilyMarriages] = useState([]);
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState('view');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    gender: '',
    birthDate: null,
    deathDate: null,
    isAlive: true,
    nickname: '',
    occupation: '',
    education: '',
    location: '',
    bio: '',
    maritalStatus: 'single',
    isFamilyMember: true,
    fatherId: '',
    motherId: '',
    relatedPersonId: '',
    isFounder: false,
    croppedImage: null
  });

  const [wives, setWives] = useState([]);
  const familyId = searchParams.get("family");

  // Get family data on load
  useEffect(() => {
    if (familyId) {
      fetchFamilyData();
    }
  }, [familyId]);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      
      // Fetch family data
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (familyError) throw familyError;
      setFamilyData(family);

      // Fetch family members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;
      setFamilyMembers(members || []);

      // Set empty marriages for now
      setFamilyMarriages([]);
    } catch (error) {
      console.error('Error fetching family data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات العائلة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    setFormMode('add');
    setCurrentStep(1);
    setFormData({
      id: '',
      name: '',
      gender: '',
      birthDate: null,
      deathDate: null,
      isAlive: true,
      nickname: '',
      occupation: '',
      education: '',
      location: '',
      bio: '',
      maritalStatus: 'single',
      isFamilyMember: true,
      fatherId: '',
      motherId: '',
      relatedPersonId: '',
      isFounder: false,
      croppedImage: null
    });
    setWives([]);
  };

  const handleCancelForm = () => {
    setFormMode('view');
    setCurrentStep(1);
    setSelectedMember(null);
    setFormData({
      id: '',
      name: '',
      gender: '',
      birthDate: null,
      deathDate: null,
      isAlive: true,
      nickname: '',
      occupation: '',
      education: '',
      location: '',
      bio: '',
      maritalStatus: 'single',
      isFamilyMember: true,
      fatherId: '',
      motherId: '',
      relatedPersonId: '',
      isFounder: false,
      croppedImage: null
    });
    setWives([]);
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      setIsSaving(true);
      
      // Insert the main member
      const memberData = {
        family_id: familyId,
        name: data.name,
        gender: data.gender,
        birth_date: data.birthDate,
        death_date: data.deathDate,
        is_alive: data.isAlive,
        nickname: data.nickname,
        occupation: data.occupation,
        education: data.education,
        location: data.location,
        bio: data.bio,
        
        is_founder: data.isFounder,
        father_id: data.fatherId || null,
        mother_id: data.motherId || null,
        related_person_id: data.relatedPersonId || null,
        profile_image: data.croppedImage
      };

      const { data: insertedMember, error: memberError } = await supabase
        .from('family_members')
        .insert(memberData)
        .select()
        .single();

      if (memberError) throw memberError;

      // Handle wives/marriages
      for (const wife of wives) {
        if (wife.name) {
          let wifeId;

          if (wife.isFamilyMember && wife.existingFamilyMemberId) {
            // Use existing family member
            wifeId = wife.existingFamilyMemberId;
          } else if (!wife.isFamilyMember) {
            // Create new wife
            const wifeData = {
              family_id: familyId,
              name: wife.name,
              gender: 'female',
              birth_date: wife.birthDate,
              death_date: wife.deathDate,
              is_alive: wife.isAlive,
              
              profile_image: wife.croppedImage
            };

            const { data: insertedWife, error: wifeError } = await supabase
              .from('family_members')
              .insert(wifeData)
              .select()
              .single();

            if (wifeError) throw wifeError;
            wifeId = insertedWife.id;
          }

          // Marriage relationship handled by parent/child relationships
        }
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم إضافة العضو والزوجات بنجاح",
      });

      // Refresh data and reset form
      await fetchFamilyData();
      handleCancelForm();

    } catch (error) {
      console.error('Error saving member:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "males") return matchesSearch && member.gender === "male";
    if (selectedFilter === "females") return matchesSearch && member.gender === "female";
    if (selectedFilter === "married") return matchesSearch;
    if (selectedFilter === "single") return matchesSearch;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">جاري تحميل بيانات العائلة...</p>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className={cn(
          "grid gap-6",
          isMobile ? "grid-cols-1" : "grid-cols-12"
        )}>
          
          {/* Main Form Area - Right Side on Desktop */}
          <div className={cn(
            "space-y-6",
            isMobile ? "order-2" : "col-span-8 order-2"
          )}>
            <Card className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-white/20 dark:border-gray-700/50 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-lg"></div>
              <CardHeader className="pb-4 relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formMode === 'view' ? 'إدارة أعضاء العائلة' : 'إضافة عضو جديد'}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {familyData?.name}
                      </p>
                    </div>
                  </CardTitle>
                  
                  {formMode === 'view' && (
                    <Button onClick={handleAddMember} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة عضو
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="relative">
                {formMode === 'view' ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>اختر عضواً من القائمة لعرض أو تعديل بياناته</p>
                    <p className="text-sm mt-2">أو اضغط "إضافة عضو" لإضافة عضو جديد</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Step Content */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold font-arabic">المعلومات الأساسية</h3>
                        
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-12 md:col-span-6">
                            <Label htmlFor="name" className="font-arabic">الاسم الكامل *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              placeholder="أدخل الاسم الكامل"
                              className="font-arabic"
                              required
                            />
                          </div>
                          
                          <div className="col-span-6 md:col-span-3">
                            <Label htmlFor="gender" className="font-arabic">الجنس *</Label>
                            <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                              <SelectTrigger className="font-arabic">
                                <SelectValue placeholder="اختر الجنس" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male" className="font-arabic">ذكر</SelectItem>
                                <SelectItem value="female" className="font-arabic">أنثى</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-6 md:col-span-3">
                            <Label className="font-arabic">تاريخ الميلاد</Label>
                            <EnhancedDatePicker
                              value={formData.birthDate}
                              onChange={(date) => setFormData({...formData, birthDate: date})}
                              placeholder="اختر التاريخ"
                              className="font-arabic"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="font-arabic">الحالة الاجتماعية</Label>
                            <Select value={formData.maritalStatus} onValueChange={(value) => setFormData({...formData, maritalStatus: value})}>
                              <SelectTrigger className="font-arabic">
                                <SelectValue placeholder="اختر الحالة الاجتماعية" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single" className="font-arabic">أعزب</SelectItem>
                                <SelectItem value="married" className="font-arabic">متزوج</SelectItem>
                                <SelectItem value="divorced" className="font-arabic">مطلق</SelectItem>
                                <SelectItem value="widowed" className="font-arabic">أرمل</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="font-arabic">المهنة</Label>
                            <Input
                              value={formData.occupation}
                              onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                              placeholder="أدخل المهنة"
                              className="font-arabic"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && formData.gender === 'male' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold font-arabic">معلومات الزوجات</h3>
                        
                        <div className="space-y-4">
                          {wives.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                              <p className="font-arabic">لم يتم إضافة زوجات بعد</p>
                              <Button
                                type="button"
                                onClick={() => setWives([{
                                  id: '',
                                  name: '',
                                  isAlive: true,
                                  birthDate: null,
                                  deathDate: null,
                                  maritalStatus: 'married',
                                  isFamilyMember: undefined,
                                  existingFamilyMemberId: '',
                                  croppedImage: null
                                }])}
                                className="mt-4"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                إضافة زوجة
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {wives.map((wife, index) => (
                                <div key={index} className="border rounded-lg p-4 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">الزوجة {index + 1}</h4>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const newWives = wives.filter((_, i) => i !== index);
                                        setWives(newWives);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {/* Wife Family Member Question */}
                                  {wife.isFamilyMember === undefined && (
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                      <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                                        هل الزوجة من أفراد عائلة {familyData?.name} وتمت إضافتها مسبقاً للشجرة؟
                                      </h5>
                                      <div className="flex gap-4">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => {
                                            const newWives = [...wives];
                                            newWives[index] = { ...wife, isFamilyMember: true };
                                            setWives(newWives);
                                          }}
                                          className="flex-1"
                                        >
                                          نعم، موجودة في الشجرة
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => {
                                            const newWives = [...wives];
                                            newWives[index] = { ...wife, isFamilyMember: false };
                                            setWives(newWives);
                                          }}
                                          className="flex-1"
                                        >
                                          لا، زوجة من خارج العائلة
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Show existing family member selection */}
                                  {wife.isFamilyMember === true && (
                                    <div>
                                      <Label className="font-arabic">اختر الزوجة من أفراد العائلة</Label>
                                      <Select 
                                        value={wife.existingFamilyMemberId} 
                                        onValueChange={(value) => {
                                          const newWives = [...wives];
                                          const selectedMember = familyMembers.find(m => m.id === value);
                                          newWives[index] = { 
                                            ...wife, 
                                            existingFamilyMemberId: value,
                                            name: selectedMember?.name || ''
                                          };
                                          setWives(newWives);
                                        }}
                                      >
                                        <SelectTrigger className="font-arabic">
                                          <SelectValue placeholder="اختر الزوجة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {familyMembers
                                            .filter(member => member.gender === 'female')
                                            .map(member => (
                                              <SelectItem key={member.id} value={member.id} className="font-arabic">
                                                {member.name}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  {/* Show new wife form */}
                                  {wife.isFamilyMember === false && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="font-arabic">اسم الزوجة *</Label>
                                        <Input
                                          value={wife.name}
                                          onChange={(e) => {
                                            const newWives = [...wives];
                                            newWives[index] = { ...wife, name: e.target.value };
                                            setWives(newWives);
                                          }}
                                          placeholder="أدخل اسم الزوجة"
                                          className="font-arabic"
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <Label className="font-arabic">تاريخ الميلاد</Label>
                                          <EnhancedDatePicker
                                            value={wife.birthDate}
                                            onChange={(date) => {
                                              const newWives = [...wives];
                                              newWives[index] = { ...wife, birthDate: date };
                                              setWives(newWives);
                                            }}
                                            placeholder="اختر التاريخ"
                                            className="font-arabic"
                                          />
                                        </div>

                                        <div>
                                          <Label className="font-arabic">الحالة الحيوية</Label>
                                          <Select
                                            value={wife.isAlive ? "alive" : "deceased"}
                                            onValueChange={(value) => {
                                              const newWives = [...wives];
                                              newWives[index] = { 
                                                ...wife, 
                                                isAlive: value === "alive",
                                                deathDate: value === "alive" ? null : wife.deathDate
                                              };
                                              setWives(newWives);
                                            }}
                                          >
                                            <SelectTrigger className="font-arabic">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="alive" className="font-arabic">على قيد الحياة</SelectItem>
                                              <SelectItem value="deceased" className="font-arabic">متوفاة</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      {!wife.isAlive && (
                                        <div>
                                          <Label className="font-arabic">تاريخ الوفاة</Label>
                                          <EnhancedDatePicker
                                            value={wife.deathDate}
                                            onChange={(date) => {
                                              const newWives = [...wives];
                                              newWives[index] = { ...wife, deathDate: date };
                                              setWives(newWives);
                                            }}
                                            placeholder="اختر تاريخ الوفاة"
                                            className="font-arabic"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setWives([...wives, {
                                  id: '',
                                  name: '',
                                  isAlive: true,
                                  birthDate: null,
                                  deathDate: null,
                                  maritalStatus: 'married',
                                  isFamilyMember: undefined,
                                  existingFamilyMemberId: '',
                                  croppedImage: null
                                }])}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                إضافة زوجة أخرى
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={currentStep === 1 ? handleCancelForm : prevStep}
                        className="flex items-center gap-2 font-arabic"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {currentStep === 1 ? "إلغاء الإضافة" : "السابق"}
                      </Button>
                      
                      {currentStep < 2 ? (
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="flex items-center gap-2"
                        >
                          التالي
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleFormSubmit(formData)}
                          disabled={isSaving}
                          className="flex items-center gap-2"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              جاري الحفظ...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              حفظ
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Member List - Left Side on Desktop */}
          <div className={cn(
            "space-y-4",
            isMobile ? "order-1" : "col-span-4 order-1"
          )}>
            <Card className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-white/20 dark:border-gray-700/50 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-lg"></div>
              <CardHeader className="pb-4 relative">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    أعضاء العائلة ({familyMembers.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                {/* Search and Filter */}
                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="البحث في أعضاء العائلة..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 font-arabic"
                    />
                  </div>
                  
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="font-arabic">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-arabic">جميع الأعضاء</SelectItem>
                      <SelectItem value="males" className="font-arabic">الذكور</SelectItem>
                      <SelectItem value="females" className="font-arabic">الإناث</SelectItem>
                      <SelectItem value="married" className="font-arabic">المتزوجون</SelectItem>
                      <SelectItem value="single" className="font-arabic">العازبون</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Members List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-arabic">لا توجد أعضاء تطابق البحث</p>
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <Card
                        key={member.id}
                        className="p-3 hover:shadow-md transition-all cursor-pointer bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50"
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.profile_image} alt={member.name} />
                            <AvatarFallback className={cn(
                              "text-white text-sm font-bold",
                              member.gender === 'male' ? "bg-blue-500" : "bg-pink-500"
                            )}>
                              {member.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{member.name}</h3>
                             <p className="text-xs text-muted-foreground">
                               {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                             </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
};

export default FamilyBuilderNew;