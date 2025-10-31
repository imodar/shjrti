import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TreePine, Users, Camera, Share2, Shield, Smartphone } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: TreePine,
      title: "شجرة تفاعلية جميلة",
      description: "اعرض شجرة عائلتك بشكل مرئي تفاعلي وجذاب مع إمكانية التنقل بسهولة بين الأجيال"
    },
    {
      icon: Users,
      title: "إدارة أفراد العائلة",
      description: "أضف معلومات مفصلة لكل فرد من العائلة مع الصور والتواريخ المهمة"
    },
    {
      icon: Camera,
      title: "ألبوم الذكريات",
      description: "احفظ الصور والذكريات الجميلة واربطها بأفراد العائلة والمناسبات"
    },
    {
      icon: Share2,
      title: "مشاركة آمنة",
      description: "شارك شجرة عائلتك مع الأقارب وتحكم في مستوى الوصول والخصوصية"
    },
    {
      icon: Shield,
      title: "حماية البيانات",
      description: "بياناتك محمية بأعلى معايير الأمان مع نسخ احتياطية آمنة"
    },
    {
      icon: Smartphone,
      title: "متوافق مع الجوال",
      description: "استخدم التطبيق على جميع الأجهزة - الكمبيوتر والجوال واللوحي"
    }
  ];

  return (
    <section id="features" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold">
            مميزات استثنائية لتجربة فريدة
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            كل ما تحتاجه لبناء وإدارة شجرة عائلتك في مكان واحد
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 border-0 tree-shadow hover:scale-105"
            >
              <CardHeader className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;