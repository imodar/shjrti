import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Plus, Settings, Trash2, Star, Crown, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Payments() {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: "visa",
      last4: "4242",
      expiry: "12/26",
      isDefault: true
    },
    {
      id: 2,
      type: "mastercard",
      last4: "5555",
      expiry: "08/25",
      isDefault: false
    }
  ]);

  const [currentPlan, setCurrentPlan] = useState("free");

  const plans = [
    {
      id: "free",
      name: "مجاني",
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
      color: "bg-emerald-500",
      popular: true
    },
    {
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
  ];

  const handleDeletePaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950" dir="rtl">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  طرق الدفع والاشتراكات
                </h1>
                <p className="text-emerald-600 dark:text-emerald-400">
                  إدارة اشتراكك وطرق الدفع
                </p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button variant="outline">
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">خطتك الحالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                    الخطة المجانية
                  </h3>
                  <p className="text-3xl font-bold text-emerald-600">0 ريال</p>
                  <p className="text-muted-foreground">شهرياً</p>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 mb-4">
                  ترقية الخطة
                </Button>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الأشجار المستخدمة</span>
                    <span>2 من 1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الأفراد المضافين</span>
                    <span>20 من 50</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-emerald-800 dark:text-emerald-200">طرق الدفع</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                      <DialogHeader>
                        <DialogTitle>إضافة طريقة دفع جديدة</DialogTitle>
                        <DialogDescription>
                          أضف بطاقة ائتمانية أو طريقة دفع جديدة
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="card-number">رقم البطاقة</Label>
                          <Input id="card-number" placeholder="1234 5678 9012 3456" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">تاريخ الانتهاء</Label>
                            <Input id="expiry" placeholder="MM/YY" />
                          </div>
                          <div>
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" placeholder="123" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="name">اسم حامل البطاقة</Label>
                          <Input id="name" placeholder="الاسم كما يظهر على البطاقة" />
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                          إضافة البطاقة
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">**** **** **** {method.last4}</p>
                        <p className="text-sm text-muted-foreground">انتهاء {method.expiry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          افتراضي
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Available Plans */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">اختر خطتك</CardTitle>
                <CardDescription>
                  اختر الخطة التي تناسب احتياجاتك لحفظ تاريخ عائلتك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <Card 
                      key={plan.id} 
                      className={`relative transition-all hover:shadow-lg ${
                        currentPlan === plan.id ? 'ring-2 ring-emerald-500' : ''
                      } ${plan.popular ? 'border-emerald-300' : ''}`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-emerald-600 text-white">الأكثر شعبية</Badge>
                        </div>
                      )}
                      <CardHeader className="text-center">
                        <div className={`w-12 h-12 ${plan.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                          <plan.icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <div className="mt-4">
                          <span className="text-3xl font-bold">{plan.price}</span>
                          <span className="text-muted-foreground"> ريال/{plan.period}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className={`w-full ${
                            currentPlan === plan.id 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                          disabled={currentPlan === plan.id}
                        >
                          {currentPlan === plan.id ? 'الخطة الحالية' : 'اختيار الخطة'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">سجل الفواتير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد فواتير بعد</p>
                  <p className="text-sm">ستظهر فواتيرك هنا بعد الترقية لخطة مدفوعة</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}