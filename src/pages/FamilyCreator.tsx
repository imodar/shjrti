import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TreePine, ArrowRight, ArrowLeft, User, Users, Heart, UserPlus, CheckCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FamilyCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [treeData, setTreeData] = useState({
    name: "",
    description: ""
  });
  const [firstMember, setFirstMember] = useState({
    name: "",
    gender: "",
    relation: "founder"
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
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleCreateFamily = () => {
    if (!firstMember.name.trim() || !firstMember.gender) {
      toast({
        title: "خطأ",
        description: "يرجى إكمال جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    // Save family data to localStorage or state management
    const familyData = {
      tree: treeData,
      firstMember: firstMember,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('newFamilyData', JSON.stringify(familyData));
    setShowSuccessModal(true);
  };

  const handleAddMoreMembers = () => {
    setShowSuccessModal(false);
    navigate("/family-builder?new=true");
  };

  const handleSkipTodashboard = () => {
    setShowSuccessModal(false);
    navigate("/dashboard2");
    toast({
      title: "تم إنشاء الشجرة بنجاح",
      description: "تم إنشاء شجرة العائلة بنجاح، يمكنك إضافة أفراد آخرين لاحقاً"
    });
  };

  const getRelationshipLabel = (gender: string) => {
    return "أول فرد الذي ستبدأ منه العائلة";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-teal-400/15 to-cyan-400/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 rounded-full blur-2xl animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-l from-emerald-400/15 to-teal-400/15 rounded-full blur-xl animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
      <Header />
      
      <div className="pt-20 relative z-10">
        {/* Enhanced Steps Indicator */}
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-6">
          <div className="relative flex items-center justify-center space-x-8 rtl:space-x-reverse">
            {/* Connecting Line */}
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200"></div>
            
            {/* Step 1 */}
            <div className="relative flex flex-col items-center group">
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 ${
                currentStep >= 1 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-110' 
                  : 'bg-white border-4 border-gray-200 text-gray-400'
              }`}>
                {currentStep >= 1 && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 animate-ping opacity-75"></div>
                )}
                <span className="relative z-10">1</span>
              </div>
              <span className={`mt-3 text-base font-medium transition-all duration-300 ${
                currentStep >= 1 ? 'text-emerald-700 font-bold' : 'text-gray-500'
              }`}>
                بيانات الشجرة
              </span>
              <TreePine className={`mt-1 h-5 w-5 transition-all duration-300 ${
                currentStep >= 1 ? 'text-emerald-500' : 'text-gray-300'
              }`} />
            </div>
            
            {/* Step 2 */}
            <div className="relative flex flex-col items-center group">
              <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 ${
                currentStep >= 2 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-110' 
                  : 'bg-white border-4 border-gray-200 text-gray-400'
              }`}>
                {currentStep >= 2 && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 animate-ping opacity-75"></div>
                )}
                <span className="relative z-10">2</span>
              </div>
              <span className={`mt-3 text-base font-medium transition-all duration-300 ${
                currentStep >= 2 ? 'text-emerald-700 font-bold' : 'text-gray-500'
              }`}>
                إضافة الفرد الأول
              </span>
              <Users className={`mt-1 h-5 w-5 transition-all duration-300 ${
                currentStep >= 2 ? 'text-emerald-500' : 'text-gray-300'
              }`} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {/* Step 1: Tree Data */}
          {currentStep === 1 && (
            <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-emerald-200 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
              <CardHeader className="text-center relative">
                <TreePine className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
                <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-200">
                  إنشاء شجرة العائلة
                </CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-400">
                  ابدأ بإدخال المعلومات الأساسية لشجرة عائلتك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <div className="space-y-2">
                  <Label htmlFor="familyName" className="text-right flex flex-row-reverse items-center gap-2">
                    <TreePine className="h-4 w-4 text-emerald-600" />
                    اسم العائلة
                  </Label>
                  <Input
                    id="familyName"
                    value={treeData.name}
                    onChange={(e) => setTreeData({...treeData, name: e.target.value})}
                    placeholder="مثال: عائلة الأحمد"
                    className="text-right text-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-right flex flex-row-reverse items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-600" />
                    وصف العائلة (اختياري)
                  </Label>
                  <Textarea
                    id="description"
                    value={treeData.description}
                    onChange={(e) => setTreeData({...treeData, description: e.target.value})}
                    placeholder="اكتب وصفاً موجزاً عن تاريخ العائلة أو أي معلومات مهمة..."
                    className="text-right min-h-[100px] resize-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNextStep}
                    disabled={!treeData.name.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3 h-auto"
                  >
                    التالي
                    <ArrowLeft className="mr-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: First Member */}
          {currentStep === 2 && (
            <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-emerald-200 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
              <CardHeader className="text-center relative">
                <Users className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
                <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-200">
                  إضافة الفرد الأول
                </CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-400">
                  أدخل معلومات الفرد الأول الذي ستبدأ منه شجرة العائلة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="memberName" className="text-right flex flex-row-reverse items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      الاسم الكامل
                    </Label>
                    <Input
                      id="memberName"
                      value={firstMember.name}
                      onChange={(e) => setFirstMember({...firstMember, name: e.target.value})}
                      placeholder="أدخل الاسم الكامل"
                      className="text-right text-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-right flex flex-row-reverse items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-600" />
                      الجنس
                    </Label>
                    <Select value={firstMember.gender} onValueChange={(value) => setFirstMember({...firstMember, gender: value})}>
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

                {firstMember.gender && (
                  <div className="space-y-2">
                    <Label className="text-right flex flex-row-reverse items-center gap-2">
                      <Heart className="h-4 w-4 text-emerald-600" />
                      صلة القرابة
                    </Label>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <p className="text-emerald-700 dark:text-emerald-300 text-center font-medium">
                        {getRelationshipLabel(firstMember.gender)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    className="text-lg px-6 py-3 h-auto"
                  >
                    <ArrowRight className="mr-2 h-5 w-5" />
                    السابق
                  </Button>
                  
                  <Button
                    onClick={handleCreateFamily}
                    disabled={!firstMember.name.trim() || !firstMember.gender}
                    className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-3 h-auto"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    إنشاء العائلة
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <DialogHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-emerald-800">
              تم إنشاء الشجرة بنجاح!
            </DialogTitle>
            <DialogDescription className="text-center text-emerald-600">
              تم إنشاء شجرة العائلة وإضافة الفرد الأول بنجاح. هل تريد إضافة أفراد آخرين الآن؟
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleSkipTodashboard}
              className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              تخطي الآن
            </Button>
            <Button
              onClick={handleAddMoreMembers}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              إضافة أفراد آخرين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FamilyCreator;