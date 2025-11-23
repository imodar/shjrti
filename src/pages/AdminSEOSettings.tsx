import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Globe, FileCode, Search, Settings } from 'lucide-react';
import { GlobalHeader } from '@/components/GlobalHeader';
import { GlobalFooter } from '@/components/GlobalFooter';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOSettings {
  id: string;
  homepage_title: { ar: string; en: string };
  homepage_description: { ar: string; en: string };
  homepage_keywords: { ar: string; en: string };
  organization_name: { ar: string; en: string };
  organization_logo_url: string | null;
  organization_social_links: string[];
  enable_search_action: boolean;
  theme_color: string;
}

interface RobotsTxtSettings {
  id: string;
  content: string;
  is_active: boolean;
}

interface StructuredDataSchema {
  id: string;
  schema_type: string;
  schema_data: any;
  is_active: boolean;
  page_slug: string | null;
}

export default function AdminSEOSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [seoSettings, setSeoSettings] = useState<SEOSettings | null>(null);
  const [robotsTxt, setRobotsTxt] = useState<RobotsTxtSettings | null>(null);
  const [schemas, setSchemas] = useState<StructuredDataSchema[]>([]);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      // Load SEO settings
      const { data: seoData, error: seoError } = await supabase
        .from('seo_settings')
        .select('*')
        .single();

      if (seoError) throw seoError;
      setSeoSettings({
        ...seoData,
        homepage_title: seoData.homepage_title as { ar: string; en: string },
        homepage_description: seoData.homepage_description as { ar: string; en: string },
        homepage_keywords: seoData.homepage_keywords as { ar: string; en: string },
        organization_name: seoData.organization_name as { ar: string; en: string },
        organization_social_links: (seoData.organization_social_links as any) || [],
      });

      // Load robots.txt
      const { data: robotsData, error: robotsError } = await supabase
        .from('robots_txt_settings')
        .select('*')
        .single();

      if (robotsError) throw robotsError;
      setRobotsTxt(robotsData);

      // Load structured data schemas
      const { data: schemasData, error: schemasError } = await supabase
        .from('structured_data')
        .select('*')
        .order('schema_type');

      if (schemasError) throw schemasError;
      setSchemas(schemasData || []);

    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: t('common.error'),
        description: t('common.error_loading_data'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSEOSettings = async () => {
    if (!seoSettings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('seo_settings')
        .update({
          homepage_title: seoSettings.homepage_title,
          homepage_description: seoSettings.homepage_description,
          homepage_keywords: seoSettings.homepage_keywords,
          organization_name: seoSettings.organization_name,
          organization_logo_url: seoSettings.organization_logo_url,
          organization_social_links: seoSettings.organization_social_links,
          enable_search_action: seoSettings.enable_search_action,
          theme_color: seoSettings.theme_color,
        })
        .eq('id', seoSettings.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('common.changes_saved'),
      });
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast({
        title: t('common.error'),
        description: t('common.error_saving'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveRobotsTxt = async () => {
    if (!robotsTxt) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('robots_txt_settings')
        .update({
          content: robotsTxt.content,
          is_active: robotsTxt.is_active,
        })
        .eq('id', robotsTxt.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('common.changes_saved'),
      });
    } catch (error) {
      console.error('Error saving robots.txt:', error);
      toast({
        title: t('common.error'),
        description: t('common.error_saving'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSchema = async (schema: StructuredDataSchema) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('structured_data')
        .update({
          schema_data: schema.schema_data,
          is_active: schema.is_active,
        })
        .eq('id', schema.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('common.changes_saved'),
      });
      
      await loadAllSettings();
    } catch (error) {
      console.error('Error saving schema:', error);
      toast({
        title: t('common.error'),
        description: t('common.error_saving'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('admin.seo_settings')}</h1>
          <p className="text-muted-foreground">
            {t('admin.seo_settings_description')}
          </p>
        </div>

        <Tabs defaultValue="homepage" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="homepage">
              <Globe className="h-4 w-4 me-2" />
              {t('admin.homepage_seo')}
            </TabsTrigger>
            <TabsTrigger value="robots">
              <FileCode className="h-4 w-4 me-2" />
              Robots.txt
            </TabsTrigger>
            <TabsTrigger value="structured">
              <Search className="h-4 w-4 me-2" />
              {t('admin.structured_data')}
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings className="h-4 w-4 me-2" />
              {t('admin.advanced')}
            </TabsTrigger>
          </TabsList>

          {/* Homepage SEO */}
          <TabsContent value="homepage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.homepage_meta_tags')}</CardTitle>
                <CardDescription>
                  {t('admin.homepage_meta_description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {seoSettings && (
                  <>
                    {/* Title */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title-ar">{t('admin.title_ar')}</Label>
                        <Input
                          id="title-ar"
                          value={seoSettings.homepage_title.ar}
                          onChange={(e) => setSeoSettings({
                            ...seoSettings,
                            homepage_title: {
                              ...seoSettings.homepage_title,
                              ar: e.target.value
                            }
                          })}
                          placeholder="منصة شجرتي - ابني شجرة عائلتك"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title-en">{t('admin.title_en')}</Label>
                        <Input
                          id="title-en"
                          value={seoSettings.homepage_title.en}
                          onChange={(e) => setSeoSettings({
                            ...seoSettings,
                            homepage_title: {
                              ...seoSettings.homepage_title,
                              en: e.target.value
                            }
                          })}
                          placeholder="Shejrati Platform - Build Your Family Tree"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="desc-ar">{t('admin.description_ar')}</Label>
                        <Textarea
                          id="desc-ar"
                          value={seoSettings.homepage_description.ar}
                          onChange={(e) => setSeoSettings({
                            ...seoSettings,
                            homepage_description: {
                              ...seoSettings.homepage_description,
                              ar: e.target.value
                            }
                          })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="desc-en">{t('admin.description_en')}</Label>
                        <Textarea
                          id="desc-en"
                          value={seoSettings.homepage_description.en}
                          onChange={(e) => setSeoSettings({
                            ...seoSettings,
                            homepage_description: {
                              ...seoSettings.homepage_description,
                              en: e.target.value
                            }
                          })}
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="keywords-ar">{t('admin.keywords_ar')}</Label>
                        <Input
                          id="keywords-ar"
                          value={seoSettings.homepage_keywords.ar}
                          onChange={(e) => setSeoSettings({
                            ...seoSettings,
                            homepage_keywords: {
                              ...seoSettings.homepage_keywords,
                              ar: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="keywords-en">{t('admin.keywords_en')}</Label>
                        <Input
                          id="keywords-en"
                          value={seoSettings.homepage_keywords.en}
                          onChange={(e) => setSeoSettings({
                            ...seoSettings,
                            homepage_keywords: {
                              ...seoSettings.homepage_keywords,
                              en: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>

                    {/* Theme Color */}
                    <div className="space-y-2">
                      <Label htmlFor="theme-color">{t('admin.theme_color')}</Label>
                      <Input
                        id="theme-color"
                        type="color"
                        value={seoSettings.theme_color}
                        onChange={(e) => setSeoSettings({
                          ...seoSettings,
                          theme_color: e.target.value
                        })}
                        className="w-32 h-12"
                      />
                    </div>

                    <Button onClick={saveSEOSettings} disabled={saving}>
                      {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                      <Save className="me-2 h-4 w-4" />
                      {t('common.save_changes')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Robots.txt */}
          <TabsContent value="robots" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Robots.txt {t('admin.management')}</CardTitle>
                <CardDescription>
                  {t('admin.robots_description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {robotsTxt && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="robots-content">{t('admin.robots_content')}</Label>
                      <Textarea
                        id="robots-content"
                        value={robotsTxt.content}
                        onChange={(e) => setRobotsTxt({
                          ...robotsTxt,
                          content: e.target.value
                        })}
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="robots-active"
                          checked={robotsTxt.is_active}
                          onCheckedChange={(checked) => setRobotsTxt({
                            ...robotsTxt,
                            is_active: checked
                          })}
                        />
                        <Label htmlFor="robots-active">{t('admin.enable_robots')}</Label>
                      </div>

                      <Button onClick={saveRobotsTxt} disabled={saving}>
                        {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                        <Save className="me-2 h-4 w-4" />
                        {t('common.save_changes')}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Structured Data */}
          <TabsContent value="structured" className="space-y-6">
            {schemas.map((schema) => (
              <Card key={schema.id}>
                <CardHeader>
                  <CardTitle>{schema.schema_type} Schema</CardTitle>
                  <CardDescription>
                    {t('admin.schema_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('admin.schema_data')}</Label>
                    <Textarea
                      value={JSON.stringify(schema.schema_data, null, 2)}
                      onChange={(e) => {
                        try {
                          const newData = JSON.parse(e.target.value);
                          const updatedSchemas = schemas.map(s =>
                            s.id === schema.id ? { ...s, schema_data: newData } : s
                          );
                          setSchemas(updatedSchemas);
                        } catch (err) {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`schema-active-${schema.id}`}
                        checked={schema.is_active}
                        onCheckedChange={(checked) => {
                          const updatedSchemas = schemas.map(s =>
                            s.id === schema.id ? { ...s, is_active: checked } : s
                          );
                          setSchemas(updatedSchemas);
                        }}
                      />
                      <Label htmlFor={`schema-active-${schema.id}`}>
                        {t('admin.enable_schema')}
                      </Label>
                    </div>

                    <Button onClick={() => saveSchema(schema)} disabled={saving}>
                      {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                      <Save className="me-2 h-4 w-4" />
                      {t('common.save_changes')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.advanced_seo')}</CardTitle>
                <CardDescription>
                  {t('admin.advanced_seo_description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold">{t('admin.sitemap')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.sitemap_description')}
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                      {t('admin.view_sitemap')}
                    </a>
                  </Button>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold">{t('admin.canonical_urls')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.canonical_description')}
                  </p>
                  <p className="text-sm text-green-600">
                    ✓ {t('admin.canonical_enabled')}
                  </p>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold">{t('admin.hreflang_tags')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.hreflang_description')}
                  </p>
                  <p className="text-sm text-green-600">
                    ✓ {t('admin.hreflang_enabled')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <GlobalFooter />
    </div>
  );
}
