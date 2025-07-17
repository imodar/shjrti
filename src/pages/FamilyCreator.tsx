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
import { TreePine, ArrowRight, ArrowLeft, Users, Heart, UserPlus, CheckCircle, Plus, CalendarIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SharedFooter } from "@/components/SharedFooter";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";

const FamilyCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
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
    } else if (currentStep === 2) {
      if (!founderData.name.trim() || !founderData.gender) {
        toast({
          title: "خطأ",
          description: "يرجى إكمال جميع البيانات المطلوبة للمؤسس",
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

      setShowSuccessModal(true);
      
      toast({
        title: "تم إنشاء العائلة بنجاح",
        description: "تم حفظ بيانات العائلة في قاعدة البيانات"
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

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Simple Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <TreePine className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">كينلاك - العائلة الرقمية</h1>
            </div>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Form */}
            <div className="order-2 lg:order-1">
              {currentStep === 1 && (
                <div className="space-y-8">
                  {/* Progress Indicator */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
                        <TreePine className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">الخطوة الأولى</p>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">معلومات الشجرة</h2>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-green-200 to-transparent"></div>
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center opacity-50">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center lg:text-right mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">إنشاء شجرة العائلة</h1>
                    <p className="text-gray-600 dark:text-gray-400">ابدأ رحلتك في بناء تاريخ عائلتك</p>
                  </div>

                  {/* Form */}
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="family-name" className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <TreePine className="h-4 w-4 text-green-500" />
                        اسم العائلة
                      </Label>
                      <Input
                        id="family-name"
                        value={treeData.name}
                        onChange={(e) => setTreeData({...treeData, name: e.target.value})}
                        placeholder="مثال: عائلة الأحمد"
                        className="mt-3 h-14 text-base bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="family-description" className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        وصف العائلة (اختياري)
                      </Label>
                      <Textarea
                        id="family-description"
                        value={treeData.description}
                        onChange={(e) => setTreeData({...treeData, description: e.target.value})}
                        placeholder="اكتب وصفاً موجزاً عن تاريخ عائلتك..."
                        className="mt-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl min-h-[120px] resize-none"
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={handleNextStep}
                      className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-base"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <span>المتابعة للخطوة التالية</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  {/* Progress Indicator */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600">مكتملة</p>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">معلومات الشجرة</h3>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-green-200"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600">الخطوة الثانية</p>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">بيانات المؤسس</h3>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center lg:text-right mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">بيانات مؤسس الشجرة</h1>
                    <p className="text-gray-600 dark:text-gray-400">قم بإدخال بيانات مؤسس شجرة العائلة</p>
                  </div>

                  {/* Founder Form */}
                  <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-xl">
                    <CardContent className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="founder-name" className="text-base font-medium">اسم المؤسس *</Label>
                          <Input
                            id="founder-name"
                            value={founderData.name}
                            onChange={(e) => setFounderData({...founderData, name: e.target.value})}
                            placeholder="اسم المؤسس"
                            className="mt-2 h-12 rounded-xl"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="founder-gender" className="text-base font-medium">الجنس *</Label>
                          <Select value={founderData.gender} onValueChange={(value) => setFounderData({...founderData, gender: value})}>
                            <SelectTrigger className="mt-2 h-12 rounded-xl">
                              <SelectValue placeholder="اختر الجنس" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">ذكر</SelectItem>
                              <SelectItem value="female">أنثى</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navigation */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      className="flex-1 h-12 rounded-xl border-gray-300 dark:border-gray-600"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      السابق
                    </Button>
                    
                    <Button
                      onClick={handleNextStep}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
                    >
                      إنشاء الشجرة
                      <CheckCircle className="h-4 w-4 mr-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Welcome Section */}
            <div className="order-1 lg:order-2 text-center lg:text-right">
              <div className="relative">
                {/* Large Tree Icon */}
                <div className="w-48 h-48 mx-auto lg:mx-0 mb-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-yellow-400 rounded-full blur-3xl opacity-20"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-green-400 to-yellow-400 rounded-full flex items-center justify-center shadow-2xl">
                    <TreePine className="h-24 w-24 text-white" />
                  </div>
                </div>

                {/* Welcome Text */}
                <div className="space-y-6">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-lg">🌟</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ابدأ رحلتك</h2>
                  </div>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                    ستكون هذه بداية شجرة عائلتك الرقمية التي ستحتفظ بذكريات أجيال عديدة
                  </p>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-4 pt-6">
                    <div className="flex -space-x-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full border-2 border-white shadow-md"></div>
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full border-2 border-white shadow-md"></div>
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full border-2 border-white shadow-md"></div>
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">أضف أفراد عائلتك</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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