import { useEffect, useState } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Users, Shield, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedText } from "@/lib/packageUtils";
import DOMPurify from 'dompurify';

interface PageData {
  id: string;
  slug: string;
  title: any;
  content: any;
  meta_description: any;
  meta_keywords: any;
  quick_info: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function TermsConditions() {
  const { currentLanguage } = useLanguage();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', 'terms-conditions')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error loading page data:', error);
        return;
      }

      setPageData(data);
    } catch (error) {
      console.error('Error loading page data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Quick Info Skeleton */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-8">
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Content Skeleton */}
            <div className="lg:col-span-3">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="h-8 bg-muted animate-pulse rounded w-1/3"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  const title = pageData ? getLocalizedText(pageData.title, currentLanguage, 'Terms and Conditions') : 'Terms and Conditions';
  const content = pageData ? getLocalizedText(pageData.content, currentLanguage, '') : '';
  
  // Get quick info texts
  const quickInfo = pageData?.quick_info || {};
  const quickInfoTitle = getLocalizedText(quickInfo.quick_info_title, currentLanguage, 'Quick Information');
  const lastUpdatedLabel = getLocalizedText(quickInfo.last_updated_label, currentLanguage, 'Last Updated');
  const appliesToLabel = getLocalizedText(quickInfo.applies_to_label, currentLanguage, 'Applies To');
  const appliesToValue = getLocalizedText(quickInfo.applies_to_value, currentLanguage, 'All Users');
  const privacyLabel = getLocalizedText(quickInfo.privacy_label, currentLanguage, 'Privacy');
  const privacyValue = getLocalizedText(quickInfo.privacy_value, currentLanguage, 'Fully Protected');
  const contactLabel = getLocalizedText(quickInfo.contact_label, currentLanguage, 'For Inquiries');
  const contactValue = getLocalizedText(quickInfo.contact_value, currentLanguage, 'support@familytree.com');
  const introText = getLocalizedText(quickInfo.intro_text, currentLanguage, 'Welcome to the Family Tree platform. Please read these terms and conditions carefully before using our services.');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-amber-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10">
        <GlobalHeader />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Quick Info */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-8">
                <CardHeader>
                  <CardTitle className="text-primary">{quickInfoTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{lastUpdatedLabel}</p>
                      <p className="text-muted-foreground">
                        {pageData ? new Date(pageData.updated_at).toLocaleDateString() : 'January 15, 2024'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{appliesToLabel}</p>
                      <p className="text-muted-foreground">{appliesToValue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{privacyLabel}</p>
                      <p className="text-muted-foreground">{privacyValue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{contactLabel}</p>
                      <p className="text-muted-foreground">{contactValue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Terms Content */}
            <div className="lg:col-span-3">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary text-2xl">
                    {title}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {introText}
                  </p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[800px] pr-4">
                    <div 
                      className="prose prose-lg max-w-none dark:prose-invert"
                      dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <GlobalFooter />
      </div>
    </div>
  );
}