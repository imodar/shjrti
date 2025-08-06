import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReCAPTCHA from 'react-google-recaptcha';
import { Mail, Phone, MapPin, Send, Heart, Users, Shield } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      <GlobalHeader />
      
      {/* Hero Section */}
      <div className="relative pt-24 pb-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-2xl">
                <Mail className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6">
              تواصل معنا
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              نحن هنا لمساعدتك في رحلتك لبناء شجرة عائلتك وحفظ تاريخكم العائلي
            </p>
          </div>
        </div>
      </div>

      {/* Support Information */}
      <div className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-primary/20">
            <CardContent className="pt-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">دعم متخصص</h3>
              <p className="text-muted-foreground">
                فريق متخصص لمساعدتك في كل خطوة من رحلة بناء شجرة عائلتك
              </p>
            </CardContent>
          </Card>

          <Card className="text-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-primary/20">
            <CardContent className="pt-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">مجتمع داعم</h3>
              <p className="text-muted-foreground">
                انضم إلى مجتمع من الأشخاص الذين يشاركونك نفس الاهتمام بالتاريخ العائلي
              </p>
            </CardContent>
          </Card>

          <Card className="text-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-primary/20">
            <CardContent className="pt-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">أمان وخصوصية</h3>
              <p className="text-muted-foreground">
                نحافظ على خصوصية وأمان بياناتك العائلية بأعلى معايير الحماية
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-6">معلومات التواصل</h2>
              <p className="text-lg text-muted-foreground mb-8">
                نحن متاحون دائماً لمساعدتك. لا تتردد في التواصل معنا بأي طريقة تناسبك.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-primary/20">
                <div className="p-3 bg-gradient-to-r from-primary to-accent rounded-xl">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">البريد الإلكتروني</h3>
                  <p className="text-muted-foreground">للدعم الفني والاستفسارات العامة</p>
                  <a 
                    href="mailto:support@shjrti.com" 
                    className="text-primary hover:text-accent transition-colors font-medium"
                  >
                    support@shjrti.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-primary/20">
                <div className="p-3 bg-gradient-to-r from-primary to-accent rounded-xl">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">أوقات الدعم</h3>
                  <p className="text-muted-foreground">السبت - الخميس</p>
                  <p className="text-primary font-medium">9:00 ص - 6:00 م (بتوقيت الرياض)</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-primary/20">
                <div className="p-3 bg-gradient-to-r from-primary to-accent rounded-xl">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">الموقع</h3>
                  <p className="text-muted-foreground">نخدم عملاءنا من جميع أنحاء</p>
                  <p className="text-primary font-medium">المملكة العربية السعودية</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">أرسل لنا رسالة</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الكامل</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="أدخل اسمك الكامل" 
                            {...field} 
                            className="bg-white/70 dark:bg-gray-800/70"
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
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="أدخل بريدك الإلكتروني" 
                            {...field} 
                            className="bg-white/70 dark:bg-gray-800/70"
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
                        <FormLabel>الرسالة</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="اكتب رسالتك هنا..." 
                            className="min-h-[120px] bg-white/70 dark:bg-gray-800/70" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-center">
                    <ReCAPTCHA
                      sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key - replace with actual
                      onChange={setCaptchaValue}
                      theme="light"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !captchaValue}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-3 rounded-xl transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="ml-2 h-4 w-4" />
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

      <GlobalFooter />
    </div>
  );
};

export default ContactUs;