import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReCAPTCHA from 'react-google-recaptcha';
import { Mail, Phone, MapPin, Send, Heart, Users, Shield, Sparkles, Star, TreePine, MessageCircle, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeFormData } from '@/lib/security';
import { GlobalHeader } from '@/components/GlobalHeader';
import { GlobalFooter } from '@/components/GlobalFooter';

const contactSchema = z.object({
  fullName: z.string().min(2, 'الاسم الكامل مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactUs: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      description: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    if (!captchaValue) {
      toast({
        title: "خطأ",
        description: "يرجى التحقق من أنك لست روبوت",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedData = sanitizeFormData(data);
      
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          full_name: sanitizedData.fullName,
          email: sanitizedData.email,
          description: sanitizedData.description,
        });

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح",
        description: "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.",
      });

      form.reset();
      setCaptchaValue(null);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.",
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
      {/* Innovative Contact Hero */}
      <section className="relative overflow-hidden pt-32 pb-8 bg-gradient-to-r from-emerald-50 via-white to-teal-50 dark:from-emerald-950/50 dark:via-gray-900 dark:to-teal-950/50">
        {/* Geometric Background Pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute top-10 left-1/4 w-32 h-32 border-2 border-emerald-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-1/4 w-24 h-24 border-2 border-teal-400 rounded-lg rotate-45 animate-pulse delay-500"></div>
          <div className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/3 w-20 h-20 border-2 border-amber-400 rounded-full animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            {/* Left Side - Content */}
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">نحن هنا لمساعدتك</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                  تواصل معنا
                </span>
                <br />
                <span className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 font-normal">
                  في أي وقت
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
                فريقنا جاهز لمساعدتك في رحلة بناء شجرة عائلتك وحفظ تاريخكم العائلي
              </p>
            </div>

            {/* Right Side - Interactive Contact Cards */}
            <div className="hidden lg:flex flex-col space-y-3 ml-8">
              <div className="group flex items-center gap-3 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">البريد الإلكتروني</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">support@shjrti.com</p>
                </div>
              </div>
              
              <div className="group flex items-center gap-3 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ml-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">ساعات العمل</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">9:00 ص - 6:00 م</p>
                </div>
              </div>
              
              <div className="group flex items-center gap-3 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">نخدم جميع أنحاء</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">المملكة العربية السعودية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Support Cards */}
      <section className="py-8 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                لماذا تختارنا؟
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              نقدم تجربة استثنائية في حفظ التراث العائلي بأحدث التقنيات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              { icon: Heart, title: "دعم متخصص", desc: "فريق متخصص لمساعدتك في كل خطوة من رحلة بناء شجرة عائلتك", color: "from-pink-500 to-rose-500" },
              { icon: Users, title: "مجتمع داعم", desc: "انضم إلى مجتمع من الأشخاص الذين يشاركونك نفس الاهتمام بالتاريخ العائلي", color: "from-emerald-500 to-teal-500" },
              { icon: Shield, title: "أمان وخصوصية", desc: "نحافظ على خصوصية وأمان بياناتك العائلية بأعلى معايير الحماية", color: "from-blue-500 to-indigo-500" }
            ].map((item, index) => (
              <Card key={index} className="group relative overflow-hidden bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{backgroundImage: `linear-gradient(135deg, ${item.color.split(' ')[1]}, ${item.color.split(' ')[3]})`}}></div>
                <CardContent className="pt-8 pb-8 text-center relative z-10">
                  <div className={`mx-auto w-20 h-20 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-emerald-600 transition-colors duration-300">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Creative Contact Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/5 via-transparent to-amber-900/5"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-12 max-w-7xl mx-auto">
            
            {/* Enhanced Contact Information */}
            <div className="xl:col-span-2 space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    تواصل معنا
                  </span>
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  نحن متاحون دائماً لمساعدتك. لا تتردد في التواصل معنا بأي طريقة تناسبك.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { icon: Mail, title: "البريد الإلكتروني", subtitle: "للدعم الفني والاستفسارات العامة", contact: "support@shjrti.com", href: "mailto:support@shjrti.com", color: "from-blue-500 to-cyan-500" },
                  { icon: Clock, title: "أوقات الدعم", subtitle: "السبت - الخميس", contact: "9:00 ص - 6:00 م (بتوقيت الرياض)", color: "from-purple-500 to-indigo-500" },
                  { icon: MapPin, title: "الموقع", subtitle: "نخدم عملاءنا من جميع أنحاء", contact: "المملكة العربية السعودية", color: "from-emerald-500 to-teal-500" }
                ].map((item, index) => (
                  <div key={index} className="group relative overflow-hidden">
                    <div className="flex items-start gap-6 p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/20 hover:bg-white/60 dark:hover:bg-gray-900/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                      <div className={`p-4 bg-gradient-to-r ${item.color} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-600 transition-colors duration-300">{item.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{item.subtitle}</p>
                        {item.href ? (
                          <a href={item.href} className="text-emerald-600 dark:text-emerald-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-semibold text-lg">
                            {item.contact}
                          </a>
                        ) : (
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">{item.contact}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Contact Form */}
            <div className="xl:col-span-3">
              <Card className="relative overflow-hidden bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-0 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-amber-500/5"></div>
                <CardHeader className="relative z-10 pb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        أرسل لنا رسالة
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">سنرد عليك في أقرب وقت ممكن</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-300">الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="أدخل اسمك الكامل" 
                                {...field} 
                                className="h-14 text-lg bg-white/80 dark:bg-gray-800/80 border-2 border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl transition-all duration-300 hover:bg-white dark:hover:bg-gray-800"
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
                            <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-300">البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="أدخل بريدك الإلكتروني" 
                                {...field} 
                                className="h-14 text-lg bg-white/80 dark:bg-gray-800/80 border-2 border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl transition-all duration-300 hover:bg-white dark:hover:bg-gray-800"
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
                            <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-300">الرسالة</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="اكتب رسالتك هنا..." 
                                className="min-h-[150px] text-lg bg-white/80 dark:bg-gray-800/80 border-2 border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-center py-4">
                        <div className="transform hover:scale-105 transition-transform duration-300">
                          <ReCAPTCHA
                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                            onChange={setCaptchaValue}
                            theme="light"
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isSubmitting || !captchaValue}
                        className="w-full h-16 text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white ml-2" />
                            جاري الإرسال...
                          </>
                        ) : (
                          <>
                            <Send className="ml-2 h-6 w-6" />
                            إرسال الرسالة
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