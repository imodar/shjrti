import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TreePine, Heart, Users, Star, Sparkles, Camera, Clock, Infinity, ArrowRight, Play, Quote, Shield, Crown, Gem } from "lucide-react";
import { Link } from "react-router-dom";
import home2Hero from "@/assets/home2-hero.jpg";
import memoryPreservation from "@/assets/memory-preservation.jpg";
import futureFamily from "@/assets/future-family.jpg";

const Home2 = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [email, setEmail] = useState("");

  const testimonials = [
    {
      name: "أحمد السعد",
      role: "رب عائلة",
      text: "تطبيق رائع ساعدني في جمع تاريخ عائلتي وحفظه للأجيال القادمة. الآن أطفالي يعرفون قصص أجدادهم.",
      rating: 5
    },
    {
      name: "فاطمة الأحمد",
      role: "أم لأربعة أطفال",
      text: "واجهة سهلة وجميلة، استطعت إنشاء شجرة عائلة كاملة بكل التفاصيل والصور. أنصح به بشدة.",
      rating: 5
    },
    {
      name: "محمد العلي",
      role: "باحث في الأنساب",
      text: "أداة مثالية للباحثين في الأنساب. إمكانيات متقدمة وتنظيم رائع للمعلومات.",
      rating: 5
    }
  ];

  const features = [
    {
      icon: <Crown className="h-8 w-8" />,
      title: "إرث عائلي فاخر",
      description: "احفظ تاريخ عائلتك بأسلوب راقي ومميز"
    },
    {
      icon: <Gem className="h-8 w-8" />,
      title: "ذكريات ثمينة",
      description: "صور وقصص وتفاصيل تحافظ على ذكرياتك الغالية"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "حماية متقدمة",
      description: "أمان عالي وحماية كاملة لبياناتك الشخصية"
    },
    {
      icon: <Infinity className="h-8 w-8" />,
      title: "للأبد",
      description: "تاريخ عائلتك محفوظ إلى الأبد للأجيال القادمة"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir="rtl">
      {/* Floating Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full px-6 py-3 shadow-xl border border-white/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <TreePine className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-emerald-800 dark:text-emerald-200">شجرة العائلة</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:text-emerald-600 transition-colors">الرئيسية الأولى</Link>
            <Link to="/auth" className="hover:text-emerald-600 transition-colors">تسجيل الدخول</Link>
            <Link to="/dashboard">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
                لوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Animated Elements */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-transparent to-amber-900/20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-10 animate-pulse">
          <Heart className="h-12 w-12 text-pink-400 opacity-60" />
        </div>
        <div className="absolute bottom-32 left-16 animate-bounce">
          <Users className="h-16 w-16 text-emerald-400 opacity-40" />
        </div>
        <div className="absolute top-40 left-32 animate-pulse">
          <Star className="h-8 w-8 text-yellow-400 opacity-60" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 text-sm">
                  <Sparkles className="h-4 w-4 ml-2" />
                  الجيل الجديد من حفظ التراث
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent leading-tight">
                  اكتشف
                  <br />
                  <span className="text-gray-800 dark:text-gray-200">تاريخ عائلتك</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  رحلة استثنائية عبر الزمن لاستكشاف جذورك وبناء إرث رقمي يدوم للأبد. 
                  احفظ قصص أجدادك وشاركها مع الأجيال القادمة.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/family-builder?new=true">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-4 rounded-full shadow-xl hover-scale">
                    <TreePine className="h-5 w-5 ml-2" />
                    ابدأ رحلتك الآن
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 text-lg px-8 py-4 rounded-full">
                  <Play className="h-5 w-5 ml-2" />
                  شاهد العرض التوضيحي
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">+١٠٠٠</div>
                  <div className="text-sm text-gray-500">عائلة سعيدة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">+٥٠٠٠</div>
                  <div className="text-sm text-gray-500">فرد محفوظ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">٩٩٪</div>
                  <div className="text-sm text-gray-500">رضا المستخدمين</div>
                </div>
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={home2Hero} 
                  alt="شجرة العائلة المبتكرة" 
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-bounce">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium">ذكريات محفوظة</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-pulse">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">تاريخ عريق</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Luxury Design */}
      <section className="relative py-32 overflow-hidden">
        {/* Luxury Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.3),transparent_50%)]"></div>
        
        {/* Floating Decorations */}
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Luxury Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg">
              <Sparkles className="h-4 w-4" />
              الأفضل في العالم العربي
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                لماذا نحن
              </span>
              <br />
              <span className="text-gray-800 dark:text-gray-200">مميزون؟</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              نجمع بين الأصالة والحداثة لنقدم لك تجربة فريدة في حفظ تراث عائلتك
            </p>
          </div>

          {/* Luxury Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-4 hover:rotate-1">
                {/* Luxury Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-emerald-50 dark:from-gray-800 dark:via-gray-900 dark:to-emerald-950 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-100/30 dark:to-emerald-900/30 group-hover:to-emerald-200/50 dark:group-hover:to-emerald-800/50 transition-all duration-700"></div>
                
                {/* Luxury Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-700"></div>
                <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                
                <CardContent className="relative p-10 text-center">
                  {/* Luxury Icon */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 scale-110"></div>
                    <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-full shadow-xl group-hover:shadow-2xl group-hover:scale-125 transition-all duration-500">
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce"></div>
                  </div>
                  
                  {/* Luxury Text */}
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  {/* Luxury Bottom Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Luxury Call to Action */}
          <div className="text-center mt-20">
            <div className="inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-lg font-medium">
              <Star className="h-5 w-5 text-amber-500" />
              <span>تجربة استثنائية تنتظرك</span>
              <Star className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Memory Preservation Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={memoryPreservation} 
            alt="حفظ الذكريات" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-amber-900/80"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-white">
              <h2 className="text-4xl md:text-5xl font-bold">
                ذكرياتك في أمان
                <br />
                <span className="text-amber-300">للأبد</span>
              </h2>
              <p className="text-xl leading-relaxed opacity-90">
                نحن نفهم أن كل صورة وكل قصة لها قيمة لا تقدر بثمن. 
                لذلك نوفر أعلى مستويات الحماية والأمان لضمان بقاء ذكرياتك محفوظة إلى الأبد.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="text-lg">تشفير متقدم على مستوى البنوك</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Infinity className="h-4 w-4" />
                  </div>
                  <span className="text-lg">نسخ احتياطي تلقائي في السحابة</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Gem className="h-4 w-4" />
                  </div>
                  <span className="text-lg">وصول آمن لجميع أفراد العائلة</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src={futureFamily} 
                alt="مستقبل العائلة" 
                className="w-full h-[500px] object-cover rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-20 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-6">
              ماذا يقول عملاؤنا؟
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-12 text-center">
                <Quote className="h-16 w-16 text-emerald-500 mx-auto mb-8 opacity-50" />
                
                <div className="space-y-6 animate-fade-in" key={currentTestimonial}>
                  <p className="text-2xl text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    "{testimonials[currentTestimonial].text}"
                  </p>
                  
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      {testimonials[currentTestimonial].name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {testimonials[currentTestimonial].role}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentTestimonial ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ابق على تواصل معنا
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            احصل على أحدث النصائح والميزات الجديدة لبناء شجرة عائلتك المثالية
          </p>
          
          <div className="max-w-md mx-auto flex gap-3">
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
            />
            <Button className="bg-white text-emerald-600 hover:bg-gray-100 whitespace-nowrap">
              اشتراك
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TreePine className="h-8 w-8 text-emerald-400" />
                <span className="text-xl font-bold">شجرة العائلة</span>
              </div>
              <p className="text-gray-400">
                نحفظ تراثك ونبني إرثك الرقمي للأجيال القادمة
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">روابط سريعة</h3>
              <div className="space-y-2">
                <Link to="/" className="block text-gray-400 hover:text-white transition-colors">الرئيسية الأولى</Link>
                <Link to="/dashboard" className="block text-gray-400 hover:text-white transition-colors">لوحة التحكم</Link>
                <Link to="/auth" className="block text-gray-400 hover:text-white transition-colors">تسجيل الدخول</Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">الدعم</h3>
              <div className="space-y-2">
                <Link to="/terms" className="block text-gray-400 hover:text-white transition-colors">الشروط والأحكام</Link>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">مركز المساعدة</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">تواصل معنا</a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">تابعنا</h3>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors">
                  <Heart className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors">
                  <Users className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors">
                  <Star className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; ٢٠٢٤ شجرة العائلة. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home2;