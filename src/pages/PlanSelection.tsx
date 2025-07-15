import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import familyTreeLogo from "@/assets/family-tree-logo.png";

const PlanSelection = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: "free",
      name: "مجانية",
      price: "0",
      period: "شهرياً",
      features: [
        "إنشاء شجرة عائلة واحدة",
        "حتى 50 فرد",
        "التصدير الأساسي",
        "دعم المجتمع"
      ],
      icon: Shield,
      color: "bg-gray-500"
    },
    {
      id: "premium",
      name: "أساسية",
      price: "29",
      period: "شهرياً",
      features: [
        "أشجار عائلة غير محدودة",
        "أفراد غير محدودين",
        "التصدير المتقدم",
        "رفع الصور والمستندات",
        "الدعم المباشر"
      ],
      icon: Star,
      color: "bg-emerald-500",
      popular: true
    },
    {
      id: "enterprise",
      name: "احترافية",
      price: "99",
      period: "شهرياً",
      features: [
        "جميع مميزات البريميوم",
        "التعاون الجماعي",
        "النسخ الاحتياطي التلقائي",
        "API للمطورين",
        "الدعم ذو الأولوية",
        "تخصيص العلامة التجارية"
      ],
      icon: Crown,
      color: "bg-purple-500"
    }
  ];

  const handlePlanSelect = (planId: string) => {
    if (planId === "free") {
      // Free plan - go directly to dashboard
      navigate("/dashboard");
    } else {
      // Paid plan - go to payment page
      navigate("/payment", { state: { planId } });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center text-white mb-12">
          <img 
            src={familyTreeLogo} 
            alt="شجرتي" 
            className="h-20 w-20 rounded-full mx-auto mb-6 border-4 border-white/20"
          />
          <h1 className="text-4xl font-bold mb-4">اختر خطتك المثالية</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            ابدأ رحلتك مع الخطة التي تناسب احتياجاتك في بناء شجرة عائلتك
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all hover:shadow-2xl hover:scale-105 bg-white/95 backdrop-blur-sm flex flex-col h-full ${
                selectedPlan === plan.id ? 'ring-4 ring-white scale-105' : ''
              } ${plan.popular ? 'border-emerald-300 shadow-2xl' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-emerald-600 text-white px-6 py-2 text-sm">الأكثر شعبية</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pt-8">
                <div className={`w-16 h-16 ${plan.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <plan.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-primary mb-2">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground"> ريال/{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="px-6 pb-8 flex flex-col flex-grow">
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full py-3 text-lg font-medium transition-all mt-auto ${
                    plan.popular 
                      ? 'hero-gradient border-0 text-white hover:shadow-lg' 
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.id === "free" ? "ابدأ مجاناً" : "اختيار الخطة"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-white/80 mt-12">
          <p className="text-sm">
            يمكنك تغيير خطتك أو إلغائها في أي وقت من إعدادات الحساب
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;