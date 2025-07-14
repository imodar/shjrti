import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TreePine, Users, Baby, Heart, Settings, LogOut, Plus } from "lucide-react";
import familyTreeLogo from "@/assets/family-tree-logo.png";

const Dashboard = () => {
  const [completionPercentage] = useState(25); // Example: 25% complete

  const stats = [
    {
      title: "أفراد العائلة",
      value: "12",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "الأجيال",
      value: "3",
      icon: TreePine,
      color: "text-green-600"
    },
    {
      title: "الصور",
      value: "48",
      icon: Heart,
      color: "text-pink-600"
    },
    {
      title: "الذكريات",
      value: "23",
      icon: Baby,
      color: "text-purple-600"
    }
  ];

  const quickActions = [
    {
      title: "إضافة والديك",
      description: "ابدأ ببناء أساس شجرتك",
      icon: Users,
      action: "add-parents",
      completed: false
    },
    {
      title: "إضافة إخوتك",
      description: "أضف أشقاءك وأخواتك",
      icon: Baby,
      action: "add-siblings", 
      completed: false
    },
    {
      title: "إضافة أولادك",
      description: "أكمل عائلتك بإضافة الأطفال",
      icon: Heart,
      action: "add-children",
      completed: false
    },
    {
      title: "عرض الشجرة",
      description: "شاهد شجرة عائلتك الجميلة",
      icon: TreePine,
      action: "view-tree",
      completed: true
    }
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={familyTreeLogo} 
                alt="شجرتي" 
                className="h-10 w-10 rounded-full"
              />
              <div>
                <h1 className="text-xl font-bold text-primary">لوحة التحكم</h1>
                <p className="text-sm text-muted-foreground">مرحباً أحمد محمد</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 ml-2" />
                الإعدادات
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="border-0 tree-shadow hero-gradient text-white">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="text-center lg:text-right">
                  <h2 className="text-3xl font-bold mb-2">
                    مرحباً بك في رحلة اكتشاف جذورك! 🌳
                  </h2>
                  <p className="text-lg opacity-90 mb-4">
                    لقد بدأت رحلتك في بناء شجرة عائلتك. دعنا نساعدك في إكمالها!
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>مستوى الإكمال</span>
                      <span>{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2 bg-white/20" />
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="h-32 w-32 rounded-full bg-white/10 flex items-center justify-center">
                    <TreePine className="h-16 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 tree-shadow">
              <CardContent className="p-6 text-center">
                <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6">إجراءات سريعة</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="border-0 tree-shadow hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <CardHeader className="text-center pb-3">
                  <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${
                    action.completed ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                  }`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <CardDescription className="mb-4">
                    {action.description}
                  </CardDescription>
                  <Button 
                    size="sm" 
                    variant={action.completed ? "secondary" : "default"}
                    className={!action.completed ? "hero-gradient border-0" : ""}
                  >
                    {action.completed ? "مكتمل ✓" : "ابدأ الآن"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Family Tree Preview */}
          <Card className="border-0 tree-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5 text-primary" />
                شجرة العائلة
              </CardTitle>
              <CardDescription>
                نظرة سريعة على شجرة عائلتك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white text-lg font-bold">
                    أ.م
                  </div>
                  <p className="text-sm font-medium mt-2">أحمد محمد (أنت)</p>
                </div>
                
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">ابدأ بإضافة والديك لرؤية شجرتك تنمو</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a href="/family-builder">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة أفراد العائلة
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card className="border-0 tree-shadow">
            <CardHeader>
              <CardTitle>التحديثات الأخيرة</CardTitle>
              <CardDescription>
                آخر الأنشطة في شجرة عائلتك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">تم إنشاء حسابك بنجاح</p>
                    <p className="text-xs text-muted-foreground">منذ 5 دقائق</p>
                  </div>
                </div>
                
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">ستظهر هنا أنشطتك وتحديثاتك</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;