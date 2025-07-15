import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Lock, ArrowRight, Star, Crown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import familyTreeLogo from "@/assets/family-tree-logo.png";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = {
    premium: {
      id: "premium",
      name: "بريميوم",
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
      color: "bg-emerald-500"
    },
    enterprise: {
      id: "enterprise",
      name: "المؤسسات",
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
  };

  useEffect(() => {
    const planId = location.state?.planId;
    if (planId && plans[planId]) {
      setSelectedPlan(plans[planId]);
    } else {
      // If no valid plan selected, redirect back to plan selection
      navigate("/plan-selection");
    }
  }, [location.state, navigate]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Simulate successful payment
      navigate("/dashboard");
    }, 3000);
  };

  if (!selectedPlan) {
    return null; // Loading or redirecting
  }

  return (
    <div className="min-h-screen hero-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <img 
            src={familyTreeLogo} 
            alt="شجرتي" 
            className="h-16 w-16 rounded-full mx-auto mb-4 border-4 border-white/20"
          />
          <h1 className="text-3xl font-bold mb-2">إتمام عملية الدفع</h1>
          <p className="text-white/80">آمن ومحمي بالكامل</p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                معلومات الدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-6">

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">رقم البطاقة</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">تاريخ الانتهاء</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">اسم حامل البطاقة</Label>
                  <Input
                    id="name"
                    placeholder="الاسم كما يظهر على البطاقة"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                  <Lock className="h-4 w-4" />
                  <span>معلوماتك محمية ومشفرة بالكامل</span>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate("/plan-selection")}
                  >
                    العودة للخطط
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 hero-gradient border-0 py-3 text-lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      "جاري معالجة الدفع..."
                    ) : (
                      <>
                        دفع {selectedPlan.price} ريال
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 ${selectedPlan.color} rounded-full flex items-center justify-center`}>
                    <selectedPlan.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedPlan.name}</h3>
                    <p className="text-muted-foreground">خطة {selectedPlan.period}</p>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-4">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span>الإجمالي الفرعي:</span>
                  <span>{selectedPlan.price} ريال</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span>{selectedPlan.price} ريال</span>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg text-center">
                <Badge className="bg-emerald-600 text-white mb-2">ضمان استرداد المال</Badge>
                <p className="text-sm text-emerald-700">
                  يمكنك إلغاء اشتراكك في أي وقت خلال أول 30 يوم واسترداد أموالك بالكامل
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;