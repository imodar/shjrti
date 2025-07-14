import { Button } from "@/components/ui/button";
import { TreePine, Users, Heart, Star } from "lucide-react";
import heroFamily from "@/assets/hero-family.png";

const Hero = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 hero-gradient opacity-5"></div>
      <div className="absolute top-20 right-10 text-tree-primary/10 text-8xl">
        <TreePine />
      </div>
      <div className="absolute bottom-20 left-10 text-tree-secondary/20 text-6xl">
        <Heart />
      </div>

      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 fade-in">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-accent font-medium">
                <Star className="h-5 w-5 fill-current" />
                منصة بناء شجرة العائلة الأولى باللغة العربية
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                اكتشف{" "}
                <span className="text-transparent bg-clip-text hero-gradient">
                  جذورك
                </span>
                <br />
                وابن تاريخ عائلتك
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                احفظ ذكريات عائلتك وشارك تاريخكم مع الأجيال القادمة. 
                ابن شجرة عائلة تفاعلية وجميلة بطريقة سهلة ومبسطة.
              </p>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">سهل الاستخدام</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TreePine className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">شجرة تفاعلية</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">حفظ الذكريات</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">مشاركة آمنة</span>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="hero-gradient border-0 text-lg px-8 py-6 tree-shadow"
              >
                ابدأ رحلتك المجانية
                <TreePine className="mr-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
              >
                شاهد كيف يعمل
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">+1000</div>
                <div className="text-sm text-muted-foreground">عائلة سعيدة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">+50k</div>
                <div className="text-sm text-muted-foreground">فرد مُسجل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">آمن ومحمي</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative lg:order-first">
            <div className="relative">
              <img
                src={heroFamily}
                alt="عائلة عربية سعيدة"
                className="w-full h-auto rounded-2xl tree-shadow"
              />
              <div className="absolute inset-0 hero-gradient opacity-10 rounded-2xl"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl tree-shadow">
              <div className="flex items-center gap-2">
                <TreePine className="h-6 w-6 text-primary" />
                <span className="font-bold text-primary">شجرة العائلة</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-accent p-4 rounded-xl tree-shadow">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-accent-foreground" />
                <span className="font-bold text-accent-foreground">تواصل الأجيال</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;