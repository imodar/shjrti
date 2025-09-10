import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TreePine, Heart, Users, Star, Shield, ArrowRight, Sparkles, Crown, CheckCircle, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { GlobalFooter } from "@/components/GlobalFooter";
import { GlobalHeader } from "@/components/GlobalHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import home2Hero from "@/assets/home2-hero.jpg";

const IndexTamara = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <TreePine className="h-6 w-6" />,
      title: t('tamara_feature_1_title', "إنشاء شجرة العائلة"),
      description: t('tamara_feature_1_desc', "أنشئ شجرة عائلتك بسهولة")
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: t('tamara_feature_2_title', "حفظ الذكريات"),
      description: t('tamara_feature_2_desc', "احفظ الصور والقصص العائلية")
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: t('tamara_feature_3_title', "الحماية والأمان"),
      description: t('tamara_feature_3_desc', "بياناتك محمية بأعلى المعايير")
    }
  ];

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
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert([{ email: email.toLowerCase() }])
        .select();

      if (error) {
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
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      {/* Hero Section - Tamara Style */}
      <section className="hero-container hero-section">
        <div className="container">
          <div className="grid-2-cols">
            <div className="space-y-lg">
              {/* Badge */}
              <Badge className="badge-primary inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t('tamara_hero_badge', 'الأفضل في حفظ التراث العائلي')}
              </Badge>

              {/* Main Heading - Very Large like Tamara */}
              <h1 className="heading-xl text-gradient">
                {t('tamara_hero_title', 'احفظ تراث عائلتك')}
                <br />
                <span className="text-foreground">
                  {t('tamara_hero_title_2', 'للأبد')}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-muted-foreground max-w-xl">
                {t('tamara_hero_subtitle', 'مع تطبيقنا، أنت تتحكم في كيفية حفظ تاريخ عائلتك وتوثيق ذكرياتك الثمينة للأجيال القادمة.')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button 
                  className="btn-hero inline-flex items-center gap-2"
                  onClick={() => user ? navigate('/dashboard') : navigate('/auth')}
                >
                  {t('tamara_hero_cta', 'ابدأ الآن')}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button variant="outline" className="btn-outline-hero inline-flex items-center gap-2">
                  {t('tamara_hero_cta_secondary', 'تعرف أكثر')}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 pt-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{t('tamara_trust_1', 'مجاني للبدء')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{t('tamara_trust_2', 'آمن ومحمي')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{t('tamara_trust_3', 'سهل الاستخدام')}</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-elegant hover-lift">
                <img 
                  src={home2Hero} 
                  alt={t('tamara_hero_image_alt', 'شجرة العائلة')} 
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-floating animate-bounce">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{t('tamara_floating_badge', 'إرث عائلي مميز')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Clean and Simple */}
      <section className="section-spacing bg-muted/30">
        <div className="container">
          <div className="text-center space-y-md mb-20">
            <h2 className="heading-lg text-gradient">
              {t('tamara_features_title', 'لماذا اختيارنا؟')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('tamara_features_subtitle', 'نقدم أفضل الحلول لحفظ تراث عائلتك بطريقة عصرية وآمنة')}
            </p>
          </div>

          <div className="grid-auto-fit">
            {features.map((feature, index) => (
              <Card key={index} className="hover-lift border-0 shadow-soft hover:shadow-elegant">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Simple */}
      <section className="section-spacing-sm">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="heading-md text-gradient">{t('tamara_stat_1_number', '+1000')}</div>
              <p className="text-muted-foreground">{t('tamara_stat_1_label', 'عائلة سعيدة')}</p>
            </div>
            <div className="space-y-2">
              <div className="heading-md text-gradient">{t('tamara_stat_2_number', '+5000')}</div>
              <p className="text-muted-foreground">{t('tamara_stat_2_label', 'فرد محفوظ')}</p>
            </div>
            <div className="space-y-2">
              <div className="heading-md text-gradient">{t('tamara_stat_3_number', '99%')}</div>
              <p className="text-muted-foreground">{t('tamara_stat_3_label', 'رضا المستخدمين')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Clean */}
      <section className="section-spacing bg-gradient-hero">
        <div className="container text-center">
          <div className="max-w-xl mx-auto space-y-lg text-white">
            <h2 className="heading-lg">
              {t('tamara_newsletter_title', 'كن أول من يعرف')}
            </h2>
            <p className="text-lg opacity-90">
              {t('tamara_newsletter_subtitle', 'اشترك في نشرتنا الإخبارية للحصول على آخر التحديثات والميزات الجديدة')}
            </p>
            
            {!isSubscribed ? (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder={t('tamara_newsletter_placeholder', 'أدخل بريدك الإلكتروني')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-white text-primary hover:bg-white/90 whitespace-nowrap"
                >
                  <Mail className="h-4 w-4 ml-2" />
                  {isLoading ? t('tamara_newsletter_loading', 'جاري الإرسال...') : t('tamara_newsletter_submit', 'اشترك الآن')}
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 text-lg">
                <CheckCircle className="h-6 w-6" />
                <span>{t('tamara_newsletter_success_display', 'تم الاشتراك بنجاح!')}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <GlobalFooter />
    </div>
  );
};

export default IndexTamara;