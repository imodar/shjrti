import { useEffect, useState } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Users, Shield, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedText } from "@/lib/packageUtils";

interface PageData {
  id: string;
  slug: string;
  title: any;
  content: any;
  meta_description: any;
  meta_keywords: any;
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
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  const title = pageData ? getLocalizedText(pageData.title, currentLanguage, 'Terms and Conditions') : 'Terms and Conditions';
  const content = pageData ? getLocalizedText(pageData.content, currentLanguage, '') : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10">
        <GlobalHeader />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Quick Info */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-8">
                <CardHeader>
                  <CardTitle className="text-primary">Quick Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-muted-foreground">
                        {pageData ? new Date(pageData.updated_at).toLocaleDateString() : 'January 15, 2024'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">Applies To</p>
                      <p className="text-muted-foreground">All Users</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">Privacy</p>
                      <p className="text-muted-foreground">Fully Protected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">For Inquiries</p>
                      <p className="text-muted-foreground">support@familytree.com</p>
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
                    Welcome to the Family Tree platform. Please read these terms and conditions carefully before using our services.
                  </p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[800px] pr-4">
                    <div 
                      className="prose prose-lg max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: content }}
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