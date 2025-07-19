
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CircleUserRound, CreditCard, Users, Package, Router, MessageSquare, Scale, ShieldCheck, Trees, Languages, Globe, Plus, Edit, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface PackageType {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  price_usd: number | null;
  price_sar: number | null;
  max_family_members: number | null;
  max_family_trees: number | null;
  display_order: number | null;
  currency?: string;
  created_at?: string;
  updated_at?: string;
  features?: any;
  is_active: boolean;
  is_featured: boolean;
}

interface TranslationType {
  id: string;
  key: string;
  value: string;
  language_code: string;
  category: string;
}

interface RelationshipTerm {
  key: string;
  label: string;
}

interface LanguageType {
  id: string;
  code: string;
  name: string;
  direction: string;
  currency: string;
  is_active: boolean;
  is_default: boolean;
}

interface NewTranslation {
  key: string;
  value: string;
  language_code: string;
  category: string;
}

export default function EnhancedAdminPanel() {
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [newPackage, setNewPackage] = useState<Omit<PackageType, 'id'>>({
    name: '',
    description: '',
    price: 0,
    price_usd: 0,
    price_sar: 0,
    max_family_members: 0,
    max_family_trees: 0,
    display_order: 0,
    is_active: true,
    is_featured: false
  });
  const [loading, setLoading] = useState(true);
  const [relationshipTerms, setRelationshipTerms] = useState<RelationshipTerm[]>([
    { key: 'father', label: 'Father' },
    { key: 'mother', label: 'Mother' },
    { key: 'son', label: 'Son' },
    { key: 'daughter', label: 'Daughter' },
    { key: 'brother', label: 'Brother' },
    { key: 'sister', label: 'Sister' },
    { key: 'grandfather', label: 'Grandfather' },
    { key: 'grandmother', label: 'Grandmother' },
    { key: 'uncle', label: 'Uncle' },
    { key: 'aunt', label: 'Aunt' },
    { key: 'cousin', label: 'Cousin' },
    { key: 'husband', label: 'Husband' },
    { key: 'wife', label: 'Wife' },
    { key: 'friend', label: 'Friend' },
    { key: 'other', label: 'Other' },
  ]);
  const [translations, setTranslations] = useState<TranslationType[]>([]);
  const [languages, setLanguages] = useState<LanguageType[]>([]);
  const [newLanguage, setNewLanguage] = useState<Omit<LanguageType, 'id'>>({
    code: '',
    name: '',
    direction: 'ltr',
    currency: 'USD',
    is_active: true,
    is_default: false
  });
  const [newTranslation, setNewTranslation] = useState<NewTranslation>({
    key: '',
    value: '',
    language_code: '',
    category: 'general'
  });

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('display_order');

      if (error) throw error;
      
      // Transform data to include computed price and currency
      const transformedPackages = (data || []).map(pkg => ({
        ...pkg,
        price: (pkg as any).price || pkg.price_usd || pkg.price_sar || 0,
        currency: currentLanguage === 'ar' ? 'SAR' : 'USD'
      }));
      
      setPackages(transformedPackages);
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const loadTranslations = async () => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('*');

      if (error) throw error;
      setTranslations(data || []);
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  useEffect(() => {
    loadPackages();
    loadTranslations();
    loadLanguages();
  }, []);

  const handleInputChange = (id: string, field: string, value: string | number | boolean) => {
    setPackages(prevPackages =>
      prevPackages.map(pkg =>
        pkg.id === id ? { ...pkg, [field]: value } : pkg
      )
    );
  };

  const handleNewPackageInputChange = (field: string, value: string | number | boolean) => {
    setNewPackage({ ...newPackage, [field]: value });
  };

  const handleAddPackage = async () => {
    try {
      const { error } = await supabase
        .from('packages')
        .insert([newPackage]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "New package added successfully"
      });

      loadPackages();
      setNewPackage({
        name: '',
        description: '',
        price: 0,
        price_usd: 0,
        price_sar: 0,
        max_family_members: 0,
        max_family_trees: 0,
        display_order: 0,
        is_active: true,
        is_featured: false
      });
    } catch (error) {
      console.error('Error adding package:', error);
      toast({
        title: "Error",
        description: "Failed to add package",
        variant: "destructive"
      });
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package deleted successfully"
      });

      loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive"
      });
    }
  };

  const handleBulkUpdate = async () => {
    try {
      for (const pkg of packages) {
        const { error } = await supabase
          .from('packages')
          .update({
            name: pkg.name || 'Package',
            price: pkg.price || 0,
            price_usd: pkg.price_usd || 0,
            price_sar: pkg.price_sar || 0,
            max_family_members: pkg.max_family_members || 0,
            max_family_trees: pkg.max_family_trees || 0,
            display_order: pkg.display_order || 0,
            is_active: pkg.is_active,
            is_featured: pkg.is_featured
          })
          .eq('id', pkg.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "All packages updated successfully"
      });
    } catch (error) {
      console.error('Error updating packages:', error);
      toast({
        title: "Error",
        description: "Failed to update packages",
        variant: "destructive"
      });
    }
  };

  const getPackageTranslation = (packageId: string, field: 'name' | 'description') => {
    const translation = translations.find(t => 
      t.key === `package.${packageId}.${field}` && 
      t.language_code === currentLanguage
    );
    return translation?.value || 'No translation available';
  };

  // Language management functions
  const handleAddLanguage = async () => {
    try {
      const { error } = await supabase
        .from('languages')
        .insert([newLanguage]);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم إضافة اللغة بنجاح"
      });

      loadLanguages();
      setNewLanguage({
        code: '',
        name: '',
        direction: 'ltr',
        currency: 'USD',
        is_active: true,
        is_default: false
      });
    } catch (error) {
      console.error('Error adding language:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة اللغة",
        variant: "destructive"
      });
    }
  };

  const handleToggleLanguage = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('languages')
        .update({ is_active: !is_active })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم تحديث حالة اللغة"
      });

      loadLanguages();
    } catch (error) {
      console.error('Error updating language:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث اللغة",
        variant: "destructive"
      });
    }
  };

  // Translation management functions
  const handleAddTranslation = async () => {
    try {
      const { error } = await supabase
        .from('translations')
        .insert([newTranslation]);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم إضافة الترجمة بنجاح"
      });

      loadTranslations();
      setNewTranslation({
        key: '',
        value: '',
        language_code: '',
        category: 'general'
      });
    } catch (error) {
      console.error('Error adding translation:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الترجمة",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTranslation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم حذف الترجمة بنجاح"
      });

      loadTranslations();
    } catch (error) {
      console.error('Error deleting translation:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الترجمة",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Enhanced Admin Panel</h1>

        <Tabs defaultValue="packages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="packages">
              <Package className="mr-2 h-4 w-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="relationships">
              <Users className="mr-2 h-4 w-4" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="translations">
              <MessageSquare className="mr-2 h-4 w-4" />
              Translations
            </TabsTrigger>
            <TabsTrigger value="languages">
              <Languages className="mr-2 h-4 w-4" />
              Languages
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Scale className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Existing Packages</CardTitle>
                <CardDescription>
                  Manage existing subscription packages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{getPackageTranslation(pkg.id, 'name')}</p>
                        <p className="text-sm text-muted-foreground">
                          {getPackageTranslation(pkg.id, 'description')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="Price USD"
                          value={pkg.price_usd || 0}
                          onChange={(e) => handleInputChange(pkg.id, 'price_usd', Number(e.target.value))}
                          className="w-24"
                        />
                        <Input
                          type="number"
                          placeholder="Price SAR"
                          value={pkg.price_sar || 0}
                          onChange={(e) => handleInputChange(pkg.id, 'price_sar', Number(e.target.value))}
                          className="w-24"
                        />
                        <Input
                          type="number"
                          placeholder="Max Members"
                          value={pkg.max_family_members || 0}
                          onChange={(e) => handleInputChange(pkg.id, 'max_family_members', Number(e.target.value))}
                          className="w-24"
                        />
                        <Switch
                          checked={pkg.is_active}
                          onCheckedChange={(checked) => handleInputChange(pkg.id, 'is_active', checked)}
                        />
                        <Button variant="outline" size="sm" onClick={() => handleDeletePackage(pkg.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4" onClick={handleBulkUpdate}>
                  Update All
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Package</CardTitle>
                <CardDescription>Add a new subscription package</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Input
                    type="text"
                    placeholder="Package Name"
                    value={newPackage.name || ''}
                    onChange={(e) => handleNewPackageInputChange('name', e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Description"
                    value={newPackage.description || ''}
                    onChange={(e) => handleNewPackageInputChange('description', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Price USD"
                    value={newPackage.price_usd || 0}
                    onChange={(e) => handleNewPackageInputChange('price_usd', Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    placeholder="Price SAR"
                    value={newPackage.price_sar || 0}
                    onChange={(e) => handleNewPackageInputChange('price_sar', Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    placeholder="Max Family Members"
                    value={newPackage.max_family_members || 0}
                    onChange={(e) => handleNewPackageInputChange('max_family_members', Number(e.target.value))}
                  />
                  <Button onClick={handleAddPackage}>Add Package</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
          <TabsContent value="relationships" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Family Relationship Terms</CardTitle>
                <CardDescription>
                  Manage relationship terms in different languages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {relationshipTerms.map((term) => {
                    const translation = translations.find(t => 
                      t.key === `relationship.${term.key}` && 
                      t.language_code === currentLanguage
                    );
                    
                    return (
                      <div key={term.key} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{term.key}</p>
                          <p className="text-sm text-muted-foreground">
                            {translation?.value || 'No translation available'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Languages Management Tab */}
          <TabsContent value="languages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة اللغات</CardTitle>
                <CardDescription>إضافة وإدارة اللغات المتاحة في الموقع</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add New Language Form */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-3">إضافة لغة جديدة</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="language-code">كود اللغة</Label>
                        <Input
                          id="language-code"
                          placeholder="ar, en, fr..."
                          value={newLanguage.code}
                          onChange={(e) => setNewLanguage({...newLanguage, code: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="language-name">اسم اللغة</Label>
                        <Input
                          id="language-name"
                          placeholder="العربية, English..."
                          value={newLanguage.name}
                          onChange={(e) => setNewLanguage({...newLanguage, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="language-direction">اتجاه النص</Label>
                        <Select
                          value={newLanguage.direction}
                          onValueChange={(value) => setNewLanguage({...newLanguage, direction: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ltr">من اليسار لليمين (LTR)</SelectItem>
                            <SelectItem value="rtl">من اليمين لليسار (RTL)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="language-currency">العملة</Label>
                        <Select
                          value={newLanguage.currency}
                          onValueChange={(value) => setNewLanguage({...newLanguage, currency: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">Dollar ($)</SelectItem>
                            <SelectItem value="SAR">Riyal (ر.س)</SelectItem>
                            <SelectItem value="EUR">Euro (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newLanguage.is_active}
                          onCheckedChange={(checked) => setNewLanguage({...newLanguage, is_active: checked})}
                        />
                        <Label>مفعلة</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newLanguage.is_default}
                          onCheckedChange={(checked) => setNewLanguage({...newLanguage, is_default: checked})}
                        />
                        <Label>افتراضية</Label>
                      </div>
                    </div>
                    <Button onClick={handleAddLanguage} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة اللغة
                    </Button>
                  </div>

                  {/* Existing Languages List */}
                  <div className="space-y-3">
                    <h4 className="font-medium">اللغات الموجودة</h4>
                    {languages.map((language) => (
                      <div key={language.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                              {language.code.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{language.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {language.code} | {language.direction.toUpperCase()} | {language.currency}
                                {language.is_default && <span className=" ml-2 text-green-600 font-medium">افتراضية</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={language.is_active}
                            onCheckedChange={() => handleToggleLanguage(language.id, language.is_active)}
                          />
                          <span className="text-sm">{language.is_active ? 'مفعلة' : 'معطلة'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Translations Management Tab */}
          <TabsContent value="translations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة الترجمات</CardTitle>
                <CardDescription>إضافة وإدارة ترجمات النصوص</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add New Translation Form */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-3">إضافة ترجمة جديدة</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="translation-key">مفتاح الترجمة</Label>
                        <Input
                          id="translation-key"
                          placeholder="home.welcome, button.save..."
                          value={newTranslation.key}
                          onChange={(e) => setNewTranslation({...newTranslation, key: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="translation-language">اللغة</Label>
                        <Select
                          value={newTranslation.language_code}
                          onValueChange={(value) => setNewTranslation({...newTranslation, language_code: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر اللغة" />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.id} value={lang.code}>
                                {lang.name} ({lang.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="translation-category">الفئة</Label>
                        <Select
                          value={newTranslation.category}
                          onValueChange={(value) => setNewTranslation({...newTranslation, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">عام</SelectItem>
                            <SelectItem value="navigation">التنقل</SelectItem>
                            <SelectItem value="buttons">الأزرار</SelectItem>
                            <SelectItem value="forms">النماذج</SelectItem>
                            <SelectItem value="messages">الرسائل</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="translation-value">النص المترجم</Label>
                        <Textarea
                          id="translation-value"
                          placeholder="أدخل النص المترجم..."
                          value={newTranslation.value}
                          onChange={(e) => setNewTranslation({...newTranslation, value: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddTranslation} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة الترجمة
                    </Button>
                  </div>

                  {/* Existing Translations List */}
                  <div className="space-y-3">
                    <h4 className="font-medium">الترجمات الموجودة</h4>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {translations.map((translation) => (
                        <div key={translation.id} className="flex items-start justify-between p-3 border rounded-lg text-sm">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                {translation.key}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {translation.language_code}
                              </span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {translation.category}
                              </span>
                            </div>
                            <p className="text-gray-600">{translation.value}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTranslation(translation.id)}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Placeholder */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الموقع</CardTitle>
                <CardDescription>إدارة إعدادات الموقع العامة</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">قريباً...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
