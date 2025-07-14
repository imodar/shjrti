import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Baby, TreePine, ArrowLeft } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      icon: UserPlus,
      title: "ابدأ بنفسك",
      description: "أدخل معلوماتك الشخصية الأساسية وصورتك لتكون نقطة البداية في شجرة العائلة"
    },
    {
      step: "02", 
      icon: Users,
      title: "أضف والديك",
      description: "أدخل معلومات والديك مع التواريخ المهمة لتكوين الأساس القوي لشجرتك"
    },
    {
      step: "03",
      icon: Baby,
      title: "أكمل العائلة",
      description: "أضف إخوتك وأولادك وباقي أفراد العائلة لتكتمل الصورة الجميلة"
    },
    {
      step: "04",
      icon: TreePine,
      title: "استمتع بشجرتك",
      description: "اعرض شجرة عائلتك الجميلة وشاركها مع الأحباب واحفظ الذكريات"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold">
            كيف تبني شجرة عائلتك؟
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            في أربع خطوات بسيطة، ستحصل على شجرة عائلة رائعة
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 relative">
          {/* Connection Lines - Hidden on mobile */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
          
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="text-center border-0 tree-shadow hover:shadow-lg transition-all duration-300 relative z-10">
                <CardHeader>
                  {/* Step Number */}
                  <div className="mx-auto -mt-8 h-16 w-16 rounded-full hero-gradient flex items-center justify-center mb-4 tree-shadow">
                    <span className="text-2xl font-bold text-white">{step.step}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Arrow for larger screens */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-24 -right-4 z-20 h-8 w-8 items-center justify-center bg-white rounded-full border-2 border-primary/20">
                  <ArrowLeft className="h-4 w-4 text-primary rotate-180" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button size="lg" className="hero-gradient border-0 text-lg px-8 py-6 tree-shadow">
            ابدأ رحلتك الآن مجاناً
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            لا حاجة لبطاقة ائتمان • ابدأ في ثوانٍ
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;