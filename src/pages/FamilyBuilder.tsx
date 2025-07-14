import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const FamilyBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [birthDate, setBirthDate] = useState<Date>();

  const steps = [
    { id: 1, title: "معلوماتك الشخصية", icon: Users },
    { id: 2, title: "معلومات الوالدين", icon: Users },
    { id: 3, title: "الإخوة والأخوات", icon: Users },
    { id: 4, title: "الأولاد", icon: Users }
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">بناء شجرة العائلة</h1>
              <p className="text-sm text-muted-foreground">
                الخطوة {currentStep} من {steps.length}: {steps[currentStep - 1].title}
              </p>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center border-2 mb-2",
                  currentStep >= step.id
                    ? "bg-primary border-primary text-white"
                    : "bg-white border-muted text-muted-foreground"
                )}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-sm font-medium text-center max-w-20",
                  currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
                
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className={cn(
                    "absolute top-6 right-12 h-0.5 w-24 lg:w-32",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card className="border-0 tree-shadow">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "ابدأ بإدخال معلوماتك الشخصية لتكون نقطة البداية في شجرتك"}
              {currentStep === 2 && "أضف معلومات والديك لبناء الأساس القوي لشجرة عائلتك"}
              {currentStep === 3 && "أدخل معلومات إخوتك وأخواتك لإكمال جيلك"}
              {currentStep === 4 && "أضف معلومات أولادك إن وجدوا"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">الاسم الأول</Label>
                    <Input id="firstName" placeholder="أحمد" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">اسم العائلة</Label>
                    <Input id="lastName" placeholder="محمد" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>تاريخ الميلاد</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !birthDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {birthDate ? format(birthDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={birthDate}
                          onSelect={setBirthDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">الجنس</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">نبذة شخصية (اختياري)</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="اكتب نبذة قصيرة عن نفسك..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الصورة الشخصية</Label>
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      اسحب وأفلت صورتك هنا، أو انقر للتصفح
                    </p>
                    <Button variant="outline" size="sm">
                      اختيار صورة
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Parents Info */}
            {currentStep === 2 && (
              <div className="space-y-8">
                {/* Father Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    معلومات الوالد
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الوالد</Label>
                      <Input placeholder="محمد أحمد" />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ الميلاد</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>المهنة (اختياري)</Label>
                    <Input placeholder="مهندس" />
                  </div>
                </div>

                {/* Mother Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    معلومات الوالدة
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الوالدة</Label>
                      <Input placeholder="فاطمة علي" />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ الميلاد</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>المهنة (اختياري)</Label>
                    <Input placeholder="معلمة" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Siblings */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    أضف معلومات إخوتك وأخواتك. يمكنك إضافة المزيد لاحقاً.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">الإخوة والأخوات</h3>
                    <Button variant="outline" size="sm">
                      إضافة شقيق/شقيقة
                    </Button>
                  </div>

                  <Card className="p-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>الاسم</Label>
                        <Input placeholder="عبدالله" />
                      </div>
                      <div className="space-y-2">
                        <Label>الجنس</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">ذكر</SelectItem>
                            <SelectItem value="female">أنثى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>العمر</Label>
                        <Input type="number" placeholder="25" />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 4: Children */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    أضف معلومات أولادك إن وجدوا. يمكنك تخطي هذه الخطوة إذا لم يكن لديك أطفال.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">الأولاد</h3>
                    <Button variant="outline" size="sm">
                      إضافة طفل
                    </Button>
                  </div>

                  <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      لم تتم إضافة أي أطفال بعد
                    </p>
                    <Button variant="outline" className="mt-4">
                      إضافة الطفل الأول
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                السابق
              </Button>

              <div className="flex gap-3">
                <Button variant="outline">
                  <Save className="ml-2 h-4 w-4" />
                  حفظ المسودة
                </Button>
                
                {currentStep < steps.length ? (
                  <Button onClick={nextStep} className="hero-gradient border-0">
                    التالي
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button className="hero-gradient border-0">
                    إنهاء وعرض الشجرة
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FamilyBuilder;