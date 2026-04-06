
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Mail, Phone, MapPin, Send, Heart, Users, Shield, Sparkles, Star, TreePine, MessageCircle, Clock, Globe, Zap, Award, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { contactApi } from '@/lib/api';
import { sanitizeFormData } from '@/lib/security';
import { GlobalHeader } from '@/components/GlobalHeader';
import { GlobalFooter } from '@/components/GlobalFooter';
import { useLanguage } from '@/contexts/LanguageContext';

const ContactUs: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const { toast } = useToast();
  const { t } = useLanguage();

  const contactSchema = z.object({
    fullName: z.string().min(2, t('contact.form.name_required', 'الاسم الكامل مطلوب')),
    email: z.string().email(t('contact.form.email_invalid', 'البريد الإلكتروني غير صحيح')),
    description: z.string().min(10, t('contact.form.description_min', 'الوصف يجب أن يكون 10 أحرف على الأقل')),
  });

  type ContactFormData = z.infer<typeof contactSchema>;

  // Generate random math question for captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    setCaptchaQuestion({ num1, num2, answer });
    setCaptchaValue(null);
  };

  // Initialize captcha on component mount
  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      description: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    if (!captchaValue || parseInt(captchaValue) !== captchaQuestion.answer) {
      toast({
        title: t('contact.error', 'خطأ'),
        description: t('contact.captcha_error', 'يرجى حل المعادلة الرياضية بشكل صحيح'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedData = sanitizeFormData(data);
      
      await contactApi.submit({
        full_name: sanitizedData.fullName,
        email: sanitizedData.email,
        description: sanitizedData.description,
      });

      toast({
        title: t('contact.success', 'تم الإرسال بنجاح'),
        description: t('contact.success_message', 'شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.'),
      });

      form.reset();
      setCaptchaValue(null);
      generateCaptcha();
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: t('contact.error', 'خطأ'),
        description: t('contact.submit_error', 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
      {/* Floating Animated Elements */}
      <div className="absolute top-20 right-10 animate-pulse">
        <Heart className="h-12 w-12 text-pink-400 opacity-60 hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="absolute bottom-32 left-16 animate-bounce">
        <Users className="h-16 w-16 text-emerald-400 opacity-40 hover:opacity-80 transition-opacity duration-300" />
      </div>
      <div className="absolute top-40 left-32 animate-pulse">
        <Star className="h-8 w-8 text-yellow-400 opacity-60 hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="absolute bottom-60 right-32 animate-pulse delay-1000">
        <Sparkles className="h-10 w-10 text-teal-400 opacity-50 hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="absolute top-1/2 right-20 animate-pulse delay-2000">
        <MessageCircle className="h-14 w-14 text-indigo-400 opacity-30 hover:opacity-70 transition-opacity duration-300" />
      </div>
      <div className="absolute bottom-20 left-1/4 animate-bounce delay-500">
        <Globe className="h-12 w-12 text-cyan-400 opacity-40 hover:opacity-80 transition-opacity duration-300" />
      </div>
      
      <GlobalHeader />

      {/* Immersive Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-6 bg-gradient-to-br from-emerald-900/10 via-transparent to-teal-900/10">
        {/* Luxury Background Pattern */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <div className="absolute top-20 left-1/4 w-40 h-40 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-32 h-32 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Hero Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-full border border-white/20 dark:border-gray-700/20">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">{t('contact.hero.badge', 'نحن هنا من أجلك')}</span>
              <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                24/7
              </Badge>
            </div>

            {/* Main Hero Title */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                  {t('contact.hero.title', 'تواصل معنا')}
                </span>
                <br />
                <span className="text-3xl md:text-4xl text-gray-700 dark:text-gray-300 font-light">
                  {t('contact.hero.subtitle', 'وابني مستقبل عائلتك')}
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                {t('contact.hero.description', 'فريقنا من الخبراء جاهز لمساعدتك في رحلة حفظ التراث العائلي وبناء إرثك الرقمي')}
              </p>
            </div>

            {/* Interactive Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="group p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+1000</h3>
                <p className="text-gray-600 dark:text-gray-400">{t('contact.stats.families', 'عائلة راضية')}</p>
              </div>
              
              <div className="group p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{t('contact.stats.response_time', '2 دقيقة')}</h3>
                <p className="text-gray-600 dark:text-gray-400">{t('contact.stats.avg_response', 'متوسط الرد')}</p>
              </div>
              
              <div className="group p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">4.9/5</h3>
                <p className="text-gray-600 dark:text-gray-400">{t('contact.stats.rating', 'تقييم العملاء')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Contact Section */}
      <section className="py-20 relative">        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
            
            {/* Left Side - Contact Information */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t('contact.methods.title', 'طرق التواصل')}</span>
                </div>
                
                <h2 className="text-4xl font-bold">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {t('contact.methods.heading', 'لنبدأ المحادثة')}
                  </span>
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t('contact.methods.description', 'نحن هنا لمساعدتك في كل خطوة من رحلة بناء شجرة عائلتك')}
                </p>
              </div>

              {/* Contact Methods */}
              <div className="space-y-6">
                {[
                  { 
                    icon: Mail, 
                    title: t('contact.info.email_title', 'البريد الإلكتروني'), 
                    subtitle: t('contact.info.email_subtitle', 'للدعم الفني والاستفسارات'), 
                    contact: "support@shjrti.com", 
                    href: "mailto:support@shjrti.com",
                    color: "from-blue-500 to-cyan-500",
                    bgColor: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
                  },
                  { 
                    icon: Clock, 
                    title: t('contact.info.hours_title', 'أوقات العمل'), 
                    subtitle: t('contact.info.hours_subtitle', 'السبت - الخميس'), 
                    contact: t('contact.info.hours_time', '9:00 ص - 6:00 م (بتوقيت الرياض)'),
                    color: "from-purple-500 to-indigo-500",
                    bgColor: "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
                  },
                  { 
                    icon: MapPin, 
                    title: t('contact.info.location_title', 'الموقع'), 
                    subtitle: t('contact.info.location_subtitle', 'نخدم عملاءنا من جميع أنحاء'), 
                    contact: t('contact.info.location_country', 'المملكة العربية السعودية'),
                    color: "from-emerald-500 to-teal-500",
                    bgColor: "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20"
                  }
                ].map((item, index) => (
                  <div key={index} className="group relative overflow-hidden">
                    <div className={`flex items-start gap-4 p-6 bg-gradient-to-r ${item.bgColor} rounded-2xl border border-white/20 dark:border-gray-700/20 hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
                      <div className={`p-3 bg-gradient-to-r ${item.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1 group-hover:text-emerald-600 transition-colors duration-300">{item.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{item.subtitle}</p>
                        {item.href ? (
                          <a href={item.href} className="text-emerald-600 dark:text-emerald-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium">
                            {item.contact}
                          </a>
                        ) : (
                          <p className="text-emerald-600 dark:text-emerald-400 font-medium">{item.contact}</p>
                        )}
                      </div>
                      <CheckCircle className="h-5 w-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-700/30">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-6 w-6 text-amber-600" />
                  <h3 className="font-bold text-amber-700 dark:text-amber-300">{t('contact.quality.title', 'ضمانات الجودة')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-700 dark:text-gray-300">{t('contact.quality.data_protection', 'حماية البيانات')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-700 dark:text-gray-300">{t('contact.quality.free_support', 'دعم مجاني')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-700 dark:text-gray-300">{t('contact.quality.quick_response', 'رد سريع')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-700 dark:text-gray-300">{t('contact.quality.expert_support', 'خبراء متخصصون')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Enhanced Contact Form */}
            <div>
              <Card className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-0 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-amber-500/5"></div>
                <CardHeader className="relative z-10 pb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                      <Send className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {t('contact.form.title', 'أرسل لنا رسالة')}
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-400">{t('contact.form.response_time', 'سنرد عليك خلال دقائق')}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('contact.form.full_name', 'الاسم الكامل')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('contact.form.full_name_placeholder', 'أدخل اسمك الكامل')} 
                                {...field} 
                                className="h-12 text-base bg-white/90 dark:bg-gray-800/90 border-2 border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl transition-all duration-300"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('contact.form.email', 'البريد الإلكتروني')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder={t('contact.form.email_placeholder', 'أدخل بريدك الإلكتروني')} 
                                {...field} 
                                className="h-12 text-base bg-white/90 dark:bg-gray-800/90 border-2 border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl transition-all duration-300"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('contact.form.message_label', 'كيف يمكننا مساعدتك؟')}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t('contact.form.message_placeholder', 'اكتب رسالتك أو استفسارك هنا...')} 
                                className="min-h-[120px] text-base bg-white/90 dark:bg-gray-800/90 border-2 border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl transition-all duration-300 resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Math Captcha */}
                      <div className="space-y-4">
                          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30">
                          <div className="flex items-center gap-3 mb-3">
                            <Shield className="h-5 w-5 text-emerald-600" />
                            <span className="font-semibold text-emerald-700 dark:text-emerald-300">{t('contact.form.security_check', 'تحقق الأمان')}</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                {captchaQuestion.num1} + {captchaQuestion.num2} = ?
                              </span>
                              <Button
                                type="button"
                                onClick={generateCaptcha}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                🔄
                              </Button>
                            </div>
                            <Input
                              type="number"
                              placeholder={t('contact.form.answer_placeholder', 'أدخل الناتج')}
                              value={captchaValue || ''}
                              onChange={(e) => setCaptchaValue(e.target.value)}
                              className="w-32 h-10 text-center bg-white/90 dark:bg-gray-800/90 border-2 border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-lg"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t('contact.form.captcha_help', 'حل المعادلة البسيطة للتأكد من أنك لست روبوت')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isSubmitting || !captchaValue}
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2" />
                            {t('contact.form.sending', 'جاري الإرسال...')}
                          </>
                        ) : (
                          <>
                            <Send className="ml-2 h-5 w-5" />
                            {t('contact.form.submit', 'إرسال الرسالة')}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <GlobalFooter />
    </div>
  );
};

export default ContactUs;
