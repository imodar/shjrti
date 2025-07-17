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
    <div className="min-h-screen bg-background">
      
      {/* Top Progress Bar */}
      <div className="w-full bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-8">
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                currentStep >= 1 
                  ? 'bg-gradient-to-br from-primary to-accent shadow-lg' 
                  : 'bg-muted'
              }`}>
                <TreePine className={`h-6 w-6 ${currentStep >= 1 ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">الخطوة الأولى</p>
                <h3 className="text-sm font-medium">معلومات الشجرة</h3>
              </div>
            </div>
            
            {/* Progress Line */}
            <div className={`w-24 h-1 rounded-full transition-all duration-500 ${
              currentStep >= 2 ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted'
            }`}></div>
            
            {/* Step 2 */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                currentStep >= 2 
                  ? 'bg-gradient-to-br from-primary to-accent shadow-lg' 
                  : 'bg-muted'
              }`}>
                <Users className={`h-6 w-6 ${currentStep >= 2 ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">الخطوة الثانية</p>
                <h3 className="text-sm font-medium">بيانات المؤسس</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Left Side - Form */}
            <div className="order-2 lg:order-1 space-y-8">
              
              {/* Title */}
              <div className="text-center lg:text-right">
                <h1 className="text-4xl font-bold text-foreground mb-4">إنشاء شجرة العائلة</h1>
                <p className="text-lg text-muted-foreground">ابدأ رحلتك في بناء تاريخ عائلتك</p>
              </div>

              {currentStep === 1 && (
                <div className="space-y-8">
                  
                  {/* Family Name */}
                  <div className="space-y-3">
                    <Label htmlFor="family-name" className="text-lg font-medium text-foreground flex items-center gap-2">
                      <TreePine className="h-5 w-5 text-primary" />
                      اسم العائلة
                    </Label>
                    <Input
                      id="family-name"
                      value={treeData.name}
                      onChange={(e) => setTreeData({...treeData, name: e.target.value})}
                      placeholder="مثال: عائلة الأحمد"
                      className="h-16 text-lg bg-muted/50 border-border rounded-2xl font-arabic"
                    />
                  </div>
                  
                  {/* Family Description */}
                  <div className="space-y-3">
                    <Label htmlFor="family-description" className="text-lg font-medium text-foreground flex items-center gap-2">
                      <Heart className="h-5 w-5 text-destructive" />
                      وصف العائلة (اختياري)
                    </Label>
                    <Textarea
                      id="family-description"
                      value={treeData.description}
                      onChange={(e) => setTreeData({...treeData, description: e.target.value})}
                      placeholder="اكتب وصفاً موجزاً عن تاريخ عائلتك..."
                      className="min-h-[140px] text-base bg-muted/50 border-border rounded-2xl resize-none font-arabic"
                      rows={5}
                    />
                  </div>

                  {/* Next Button */}
                  <Button 
                    onClick={handleNextStep}
                    className="w-full h-16 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span>المتابعة للخطوة التالية</span>
                      <ArrowRight className="h-6 w-6" />
                    </div>
                  </Button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  
                  {/* Founder Form */}
                  <Card className="bg-card border-border rounded-3xl shadow-lg">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-2xl font-bold text-center">بيانات مؤسس الشجرة</CardTitle>
                      <CardDescription className="text-center text-base">
                        قم بإدخال بيانات مؤسس شجرة العائلة
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="founder-name" className="text-base font-medium">اسم المؤسس *</Label>
                          <Input
                            id="founder-name"
                            value={founderData.name}
                            onChange={(e) => setFounderData({...founderData, name: e.target.value})}
                            placeholder="اسم المؤسس"
                            className="mt-2 h-12 rounded-xl bg-muted/50 font-arabic"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="founder-gender" className="text-base font-medium">الجنس *</Label>
                          <Select value={founderData.gender} onValueChange={(value) => setFounderData({...founderData, gender: value})}>
                            <SelectTrigger className="mt-2 h-12 rounded-xl bg-muted/50">
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
                      className="flex-1 h-14 rounded-xl border-border"
                    >
                      <ArrowLeft className="h-5 w-5 ml-2" />
                      السابق
                    </Button>
                    
                    <Button
                      onClick={handleNextStep}
                      className="flex-1 h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-xl font-medium"
                    >
                      <span>إنشاء الشجرة</span>
                      <CheckCircle className="h-5 w-5 mr-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Welcome Section */}
            <div className="order-1 lg:order-2 text-center">
              <div className="relative">
                {/* Large Tree Icon Circle - matching the image exactly */}
                <div className="w-72 h-72 mx-auto mb-12 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary rounded-full blur-2xl opacity-30"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-2xl">
                    <TreePine className="h-32 w-32 text-white" />
                  </div>
                </div>

                {/* Welcome Text */}
                <div className="space-y-8">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-2xl">🌟</span>
                    </div>
                    <h2 className="text-3xl font-bold text-foreground">ابدأ رحلتك</h2>
                  </div>
                  
                  <p className="text-xl text-muted-foreground leading-relaxed max-w-md mx-auto">
                    ستكون هذه بداية شجرة عائلتك الرقمية التي ستحتفظ بذكريات أجيال عديدة
                  </p>
                  
                  {/* Avatar Circles */}
                  <div className="flex items-center justify-center gap-6 pt-8">
                    <div className="flex -space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full border-4 border-white shadow-lg"></div>
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full border-4 border-white shadow-lg"></div>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full border-4 border-white shadow-lg"></div>
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <span className="text-base text-muted-foreground font-medium">أضف أفراد عائلتك</span>
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
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
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