import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TreePine, Heart, Users, Star, Sparkles, Camera, Clock, Infinity, ArrowRight, ArrowLeft, Play, Quote, Shield, Crown, Gem } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { GlobalFooter } from "@/components/GlobalFooter";
import { GlobalHeader } from "@/components/GlobalHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import home2Hero from "@/assets/home2-hero.jpg";
import memoryPreservation from "@/assets/memory-preservation.jpg";
import futureFamily from "@/assets/future-family.jpg";

const Home2 = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const testimonials = [
    {
      name: t('testimonial_1_name', "أحمد السعد"),
      role: t('testimonial_1_role', "رب عائلة"),
      text: t('testimonial_1_text', "تطبيق رائع ساعدني في جمع تاريخ عائلتي وحفظه للأجيال القادمة. الآن أطفالي يعرفون قصص أجدادهم."),
      rating: 5
    },
    {
      name: t('testimonial_2_name', "فاطمة الأحمد"),
      role: t('testimonial_2_role', "أم لأربعة أطفال"),
      text: t('testimonial_2_text', "واجهة سهلة وجميلة، استطعت إنشاء شجرة عائلة كاملة بكل التفاصيل والصور. أنصح به بشدة."),
      rating: 5
    },
    {
      name: t('testimonial_3_name', "محمد العلي"),
      role: t('testimonial_3_role', "باحث في الأنساب"),
      text: t('testimonial_3_text', "أداة مثالية للباحثين في الأنساب. إمكانيات متقدمة وتنظيم رائع للمعلومات."),
      rating: 5
    }
  ];

  const features = [
    {
      icon: <Crown className="h-8 w-8" />,
      title: t('feature_1_title', "إرث عائلي فاخر"),
      description: t('feature_1_description', "احفظ تاريخ عائلتك بأسلوب راقي ومميز")
    },
    {
      icon: <Gem className="h-8 w-8" />,
      title: t('feature_2_title', "ذكريات ثمينة"),
      description: t('feature_2_description', "صور وقصص وتفاصيل تحافظ على ذكرياتك الغالية")
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: t('feature_3_title', "حماية متقدمة"),
      description: t('feature_3_description', "أمان عالي وحماية كاملة لبياناتك الشخصية")
    },
    {
      icon: <Infinity className="h-8 w-8" />,
      title: t('feature_4_title', "للأبد"),
      description: t('feature_4_description', "تاريخ عائلتك محفوظ إلى الأبد للأجيال القادمة")
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: t('newsletter_error_title', 'خطأ في البريد الإلكتروني'),
        description: t('newsletter_error_invalid', 'يرجى إدخال بريد إلكتروني صحيح'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .insert([{ email: email.toLowerCase() }])
        .select();

      if (error) {
        // Check if it's a duplicate email error
        if (error.code === '23505') {
          toast({
            title: t('newsletter_already_subscribed_title', 'مشترك بالفعل'),
            description: t('newsletter_already_subscribed', 'أنت مشترك بالفعل في النشرة الإخبارية'),
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast({
          title: t('newsletter_success_title', 'تم الاشتراك بنجاح'),
          description: t('newsletter_success', 'شكراً لك! تم إضافتك إلى النشرة الإخبارية'),
        });
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: t('newsletter_error_title', 'خطأ في العملية'),
        description: t('newsletter_error_general', 'حدث خطأ، يرجى المحاولة مرة أخرى'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 ${currentLanguage === 'en' ? 'font-poppins' : ''}`}>
      <GlobalHeader />

      {/* Main content that grows to fill space */}
      <main className="flex-1">
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
              <div className="space-y-6 pt-8 md:pt-0">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 text-sm">
                  <Sparkles className="h-4 w-4 ml-2" />
                  {t('hero_badge', 'الجيل الجديد من حفظ التراث')}
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent leading-tight">
                  {t('hero_title_1', 'اكتشف')}
                  <br />
                  <span className="text-gray-800 dark:text-gray-200">{t('hero_title_2', 'تاريخ عائلتك')}</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t('hero_description', 'رحلة استثنائية عبر الزمن لاستكشاف جذورك وبناء إرث رقمي يدوم للأبد. احفظ قصص أجدادك وشاركها مع الأجيال القادمة.')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-4 rounded-full shadow-xl hover-scale"
                  onClick={() => user ? navigate('/dashboard') : navigate('/auth')}
                >
                  <TreePine className="h-5 w-5 ml-2" />
                  {t('hero_cta_primary', 'ابدأ رحلتك الآن')}
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 text-lg px-8 py-4 rounded-full">
                  <Play className="h-5 w-5 ml-2" />
                  {t('hero_cta_secondary', 'شاهد العرض التوضيحي')}
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{t('stat_1_number', '+١٠٠٠')}</div>
                  <div className="text-sm text-gray-500">{t('stat_1_label', 'عائلة سعيدة')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{t('stat_2_number', '+٥٠٠٠')}</div>
                  <div className="text-sm text-gray-500">{t('stat_2_label', 'فرد محفوظ')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{t('stat_3_number', '٩٩٪')}</div>
                  <div className="text-sm text-gray-500">{t('stat_3_label', 'رضا المستخدمين')}</div>
                </div>
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={home2Hero} 
                  alt={t('hero_image_alt', 'شجرة العائلة المبتكرة')} 
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-bounce">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium">{t('floating_card_1', 'ذكريات محفوظة')}</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-pulse">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">{t('floating_card_2', 'تاريخ عريق')}</span>
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
              {t('features_badge', 'الأفضل في العالم العربي')}
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                {t('features_title_1', 'لماذا نحن')}
              </span>
              <br />
              <span className="text-gray-800 dark:text-gray-200">{t('features_title_2', 'مميزون؟')}</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('features_description', 'نجمع بين الأصالة والحداثة لنقدم لك تجربة فريدة في حفظ تراث عائلتك')}
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
              <span>{t('features_cta', 'تجربة استثنائية تنتظرك')}</span>
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
            alt={t('memory_section_image_alt', 'حفظ الذكريات')} 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80 backdrop-blur-sm"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-white">
              <h2 className="text-4xl md:text-5xl font-bold">
                {t('memory_section_title_1', 'ذكرياتك في أمان')}
                <br />
                <span className="text-amber-300">{t('memory_section_title_2', 'للأبد')}</span>
              </h2>
              <p className="text-xl leading-relaxed opacity-90">
                {t('memory_section_description', 'نحن نفهم أن كل صورة وكل قصة لها قيمة لا تقدر بثمن. لذلك نوفر أعلى مستويات الحماية والأمان لضمان بقاء ذكرياتك محفوظة إلى الأبد.')}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="text-lg">{t('memory_feature_1', 'تشفير متقدم على مستوى البنوك')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Infinity className="h-4 w-4" />
                  </div>
                  <span className="text-lg">{t('memory_feature_2', 'نسخ احتياطي تلقائي في السحابة')}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Gem className="h-4 w-4" />
                  </div>
                  <span className="text-lg">{t('memory_feature_3', 'وصول آمن لجميع أفراد العائلة')}</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src={futureFamily} 
                alt={t('future_family_image_alt', 'مستقبل العائلة')} 
                className="w-full h-[500px] object-cover rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Testimonials Section */}
      <section className="relative py-16 overflow-hidden">
        {/* Luxury Background with Patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-emerald-100 to-teal-100 dark:from-amber-900 dark:via-emerald-900 dark:to-teal-900"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(16,185,129,0.3),transparent_50%)]"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_75%_25%,rgba(245,158,11,0.3),transparent_50%)]"></div>
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_75%,rgba(20,184,166,0.3),transparent_50%)]"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-16 right-20 w-32 h-32 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-10 animate-pulse blur-xl"></div>
        <div className="absolute bottom-20 left-16 w-24 h-24 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-10 animate-bounce blur-xl"></div>
        <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-10 animate-pulse blur-xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Luxury Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg">
              <Heart className="h-4 w-4" />
              {t('testimonials_badge', 'شهادات حقيقية من عملائنا')}
              <Heart className="h-4 w-4" />
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                {t('testimonials_title_1', 'ماذا يقول')}
              </span>
              <br />
              <span className="text-gray-800 dark:text-gray-200">{t('testimonials_title_2', 'عملاؤنا؟')}</span>
            </h2>
          </div>

          {/* Luxury Testimonial Card */}
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Main Card with Luxury Design */}
              <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-3xl">
                {/* Luxury Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50 to-teal-50 dark:from-gray-800 dark:via-emerald-950 dark:to-teal-950"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/20 to-transparent dark:via-emerald-900/20"></div>
                
                {/* Luxury Border Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-3xl opacity-20 blur-lg"></div>
                <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-3xl"></div>

                <CardContent className="relative p-10 text-center">
                  {/* Luxury Quote Icon */}
                  <div className="relative mb-12">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-2xl opacity-30 scale-150"></div>
                    <Quote className="relative h-20 w-20 text-emerald-500 mx-auto opacity-80" />
                  </div>
                  
                  {/* Testimonial Content */}
                  <div className="space-y-8 animate-fade-in" key={currentTestimonial}>
                    {/* Main Quote */}
                    <div className="relative">
                      <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 leading-relaxed italic font-light max-w-4xl mx-auto">
                        "{testimonials[currentTestimonial].text}"
                      </p>
                      <div className="absolute -top-4 -left-4 text-6xl text-emerald-200 dark:text-emerald-800 opacity-50 font-serif">"</div>
                      <div className="absolute -bottom-4 -right-4 text-6xl text-emerald-200 dark:text-emerald-800 opacity-50 font-serif">"</div>
                    </div>
                    
                    {/* Stars Rating */}
                    <div className="flex justify-center gap-1 mb-8">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <div key={i} className="relative">
                          <Star className="h-8 w-8 text-amber-400 fill-current drop-shadow-lg" />
                          <div className="absolute inset-0 bg-amber-300 rounded-full blur-sm opacity-50 scale-75"></div>
                        </div>
                      ))}
                    </div>
                    
                    {/* User Info */}
                    <div className="space-y-3">
                      <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {testimonials[currentTestimonial].name}
                      </h4>
                      <p className="text-lg text-emerald-600 dark:text-emerald-400 font-medium">
                        {testimonials[currentTestimonial].role}
                      </p>
                    </div>
                  </div>

                  {/* Luxury Navigation Dots */}
                  <div className="flex justify-center gap-3 mt-12">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTestimonial(index)}
                        className={`relative w-4 h-4 rounded-full transition-all duration-300 ${
                          index === currentTestimonial 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 scale-125 shadow-lg' 
                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                        }`}
                      >
                        {index === currentTestimonial && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-md opacity-50 scale-150"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Floating Decoration Cards */}
              <div className="absolute -top-8 -right-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-xl transform rotate-12 opacity-90">
                <Star className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-2xl shadow-xl transform -rotate-12 opacity-90">
                <Heart className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-16">
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">{t('trust_indicator_1', 'موثوق من +١٠٠٠ عائلة')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">{t('trust_indicator_2', 'تقييم ٥ نجوم')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">{t('trust_indicator_3', 'الأفضل في المنطقة')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Newsletter Section */}
      <section className="relative py-12 overflow-hidden">
        {/* Luxury Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(245,158,11,0.2),transparent_70%)]"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-4 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 left-16 w-12 h-12 bg-amber-400/20 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Compact Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                {t('newsletter_badge', 'نيوزليتر حصري')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {t('newsletter_title', 'ابق على تواصل معنا')}
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                {t('newsletter_description', 'احصل على أحدث النصائح والميزات الجديدة لبناء شجرة عائلتك المثالية')}
              </p>
            </div>
            
            {/* Luxury Newsletter Form */}
            <div className="max-w-lg mx-auto">
              <div className="relative bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl">
                {!isSubscribed ? (
                  <form onSubmit={handleNewsletterSubmit}>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Input
                          type="email"
                          placeholder={t('newsletter_email_placeholder', 'البريد الإلكتروني')}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className="bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-xl h-12 text-right backdrop-blur-sm focus:bg-white/30 transition-all disabled:opacity-50"
                          required
                        />
                      </div>
                      <Button 
                        type="submit"
                        disabled={isLoading}
                        className="bg-white text-emerald-600 hover:bg-gray-100 font-medium px-6 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>{isLoading ? t('newsletter_loading', 'جاري الإرسال...') : t('newsletter_subscribe_button', 'اشتراك')}</span>
                        <ArrowRight className="h-4 w-4 ml-2 rtl:hidden" />
                        <ArrowLeft className="h-4 w-4 mr-2 ltr:hidden" />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-3 text-white text-lg font-medium">
                      <Heart className="h-6 w-6 text-pink-300" />
                      <span>{t('newsletter_thank_you', 'شكراً لك! تم تسجيلك بنجاح في النشرة الإخبارية')}</span>
                      <Heart className="h-6 w-6 text-pink-300" />
                    </div>
                  </div>
                )}
                
                {/* Trust Indicators */}
                {!isSubscribed && (
                  <div className="flex items-center justify-center gap-4 mt-4 text-white/80 text-sm">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>{t('newsletter_trust_1', 'آمن 100%')}</span>
                    </div>
                    <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{t('newsletter_trust_2', 'بدون إزعاج')}</span>
                     </div>
                     <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                     <div className="flex items-center gap-1">
                       <Star className="h-4 w-4" />
                       <span>{t('newsletter_trust_3', 'محتوى حصري')}</span>
                     </div>
                   </div>
                 )}
               </div>
             </div>
           </div>
         </div>
       </section>
       </main>
       
       <GlobalFooter />
     </div>
     </>
   );
};

export default Home2;