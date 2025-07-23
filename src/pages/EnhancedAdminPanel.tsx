
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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CircleUserRound, 
  CreditCard, 
  Users, 
  Package, 
  Router, 
  MessageSquare, 
  Scale, 
  ShieldCheck, 
  Trees, 
  Languages, 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  RefreshCw,
  Settings
} from "lucide-react";
import { PackageEditModal } from '@/components/PackageEditModal';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

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

interface EditingTranslation extends TranslationType {
  isEditing?: boolean;
}

export default function EnhancedAdminPanel() {
  const { toast } = useToast();
  const { currentLanguage, direction } = useLanguage();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [editingPackages, setEditingPackages] = useState<Set<string>>(new Set());
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
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
  const [editingLanguage, setEditingLanguage] = useState<LanguageType | null>(null);
  const [editingTranslation, setEditingTranslation] = useState<EditingTranslation | null>(null);

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
      
      // @ts-ignore - Temporary fix for JSONB type mismatch after migration
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
    setLoading(true);
    Promise.all([loadPackages(), loadTranslations(), loadLanguages()]).finally(() => {
      setLoading(false);
    });
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

  const handleEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async (packageId: string) => {
    try {
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) return;

      const { error } = await supabase
        .from('packages')
        .update({
          name: pkg.name || 'Package',
          description: pkg.description,
          price_usd: pkg.price_usd || 0,
          price_sar: pkg.price_sar || 0,
          max_family_members: pkg.max_family_members || 0,
          max_family_trees: pkg.max_family_trees || 0,
          display_order: pkg.display_order || 0,
          is_active: pkg.is_active,
          is_featured: pkg.is_featured
        })
        .eq('id', packageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Package updated successfully"
      });

      setEditingPackages(prev => {
        const newSet = new Set(prev);
        newSet.delete(packageId);
        return newSet;
      });
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "Failed to update package",
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

  const handleEditLanguage = (language: LanguageType) => {
    setEditingLanguage(language);
  };

  const handleUpdateLanguage = async () => {
    if (!editingLanguage) return;

    try {
      // إذا كانت اللغة ستصبح افتراضية، اجعل جميع اللغات الأخرى غير افتراضية
      if (editingLanguage.is_default) {
        await supabase
          .from('languages')
          .update({ is_default: false })
          .neq('id', editingLanguage.id);
      }

      const { error } = await supabase
        .from('languages')
        .update({
          code: editingLanguage.code,
          name: editingLanguage.name,
          direction: editingLanguage.direction,
          currency: editingLanguage.currency,
          is_active: editingLanguage.is_active,
          is_default: editingLanguage.is_default
        })
        .eq('id', editingLanguage.id);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم تحديث اللغة بنجاح"
      });

      loadLanguages();
      setEditingLanguage(null);
    } catch (error) {
      console.error('Error updating language:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث اللغة",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLanguage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم حذف اللغة بنجاح"
      });

      loadLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف اللغة",
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

  const handleEditTranslation = (translation: TranslationType) => {
    setEditingTranslation(translation);
  };

  const handleUpdateTranslation = async () => {
    if (!editingTranslation) return;

    try {
      const { error } = await supabase
        .from('translations')
        .update({
          key: editingTranslation.key,
          value: editingTranslation.value,
          language_code: editingTranslation.language_code,
          category: editingTranslation.category
        })
        .eq('id', editingTranslation.id);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم تحديث الترجمة بنجاح"
      });

      loadTranslations();
      setEditingTranslation(null);
    } catch (error) {
      console.error('Error updating translation:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الترجمة",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir="rtl">
        <GlobalHeader />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir="rtl">
      <GlobalHeader />
      <Toaster />
      
      <div className="container mx-auto px-6 pt-24 pb-12" dir="rtl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  لوحة الإدارة المتقدمة
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  إدارة شاملة للباقات واللغات والترجمات
                </p>
              </div>
            </div>
            
            <Button onClick={() => { loadPackages(); loadTranslations(); loadLanguages(); }} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-teal-500">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>
          </div>
        </div>

        <Tabs defaultValue="packages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 rounded-xl p-2">
            <TabsTrigger value="packages" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <Package className="ml-2 h-4 w-4" />
              الباقات
            </TabsTrigger>
            <TabsTrigger value="relationships" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <Users className="ml-2 h-4 w-4" />
              العلاقات
            </TabsTrigger>
            <TabsTrigger value="translations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <MessageSquare className="ml-2 h-4 w-4" />
              الترجمات
            </TabsTrigger>
            <TabsTrigger value="languages" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <Languages className="ml-2 h-4 w-4" />
              اللغات
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <CreditCard className="ml-2 h-4 w-4" />
              الفوترة
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <Scale className="ml-2 h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-emerald-600">الباقات الحالية</CardTitle>
                <CardDescription>
                  إدارة باقات الاشتراك الحالية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {packages.map((pkg) => {
                    const isEditing = editingPackages.has(pkg.id);
                    return (
                      <div key={pkg.id} className="flex items-center justify-between p-4 border border-emerald-200/30 dark:border-emerald-700/30 rounded-lg bg-white/50 dark:bg-gray-800/50">
                        <div className="flex-1">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <Input
                              type="text"
                              placeholder="اسم الباقة"
                              value={pkg.name || ''}
                              onChange={(e) => handleInputChange(pkg.id, 'name', e.target.value)}
                              disabled={!isEditing}
                              className="font-medium"
                            />
                            <Input
                              type="text"
                              placeholder="Description"
                              value={pkg.description || ''}
                              onChange={(e) => handleInputChange(pkg.id, 'description', e.target.value)}
                              disabled={!isEditing}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="Price USD"
                            value={pkg.price_usd || 0}
                            onChange={(e) => handleInputChange(pkg.id, 'price_usd', Number(e.target.value))}
                            disabled={!isEditing}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder="Price SAR"
                            value={pkg.price_sar || 0}
                            onChange={(e) => handleInputChange(pkg.id, 'price_sar', Number(e.target.value))}
                            disabled={!isEditing}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder="Max Members"
                            value={pkg.max_family_members || 0}
                            onChange={(e) => handleInputChange(pkg.id, 'max_family_members', Number(e.target.value))}
                            disabled={!isEditing}
                            className="w-24"
                          />
                          <Switch
                            checked={pkg.is_active}
                            onCheckedChange={(checked) => handleInputChange(pkg.id, 'is_active', checked)}
                            disabled={!isEditing}
                          />
                          {isEditing ? (
                            <Button variant="outline" size="sm" onClick={() => handleSavePackage(pkg.id)}>
                              <Save className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleEditPackage(pkg)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleDeletePackage(pkg.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
                    <Button onClick={handleAddLanguage} className={`mt-4 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <Plus className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLanguage(language)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLanguage(language.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            حذف
                          </Button>
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
                           <div className="flex gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleEditTranslation(translation)}
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleDeleteTranslation(translation.id)}
                               className="text-red-600 hover:text-red-700"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab - Quick Links */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة الفوترة والمدفوعات</CardTitle>
                <CardDescription>إدارة شاملة للاشتراكات والفواتير والمدفوعات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" 
                       onClick={() => window.open('/admin/billing', '_blank')}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">لوحة الفوترة الكاملة</h3>
                        <p className="text-sm text-gray-600">إدارة شاملة للمدفوعات</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      عرض وإدارة جميع الفواتير والاشتراكات وإحصائيات الإيرادات
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
                    <h4 className="font-medium mb-2">ملخص سريع</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>إجمالي الإيرادات</span>
                        <span className="font-semibold">جاري التحميل...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الاشتراكات النشطة</span>
                        <span className="font-semibold">جاري التحميل...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>فواتير معلقة</span>
                        <span className="font-semibold">جاري التحميل...</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                    <h4 className="font-medium mb-2">إجراءات سريعة</h4>
                    <div className="space-y-2">
                      <button className="w-full text-left text-sm p-2 hover:bg-white rounded transition-colors">
                        → عرض الفواتير المعلقة
                      </button>
                      <button className="w-full text-left text-sm p-2 hover:bg-white rounded transition-colors">
                        → تصدير تقرير مالي
                      </button>
                      <button className="w-full text-left text-sm p-2 hover:bg-white rounded transition-colors">
                        → إدارة الاشتراكات
                      </button>
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
        
        {/* Edit Language Dialog */}
        <Dialog open={editingLanguage !== null} onOpenChange={() => setEditingLanguage(null)}>
          <DialogContent className={`sm:max-w-[425px] ${direction === 'rtl' ? 'font-arabic' : ''}`} dir={direction}>
            <DialogHeader className={direction === 'rtl' ? 'text-right' : 'text-left'}>
              <DialogTitle>تعديل اللغة</DialogTitle>
              <DialogDescription>قم بتعديل تفاصيل اللغة المحددة</DialogDescription>
            </DialogHeader>
            {editingLanguage && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-code" className="text-right">كود اللغة</Label>
                  <Input
                    id="edit-code"
                    value={editingLanguage.code}
                    onChange={(e) => setEditingLanguage({...editingLanguage, code: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">اسم اللغة</Label>
                  <Input
                    id="edit-name"
                    value={editingLanguage.name}
                    onChange={(e) => setEditingLanguage({...editingLanguage, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-direction" className="text-right">اتجاه النص</Label>
                  <Select
                    value={editingLanguage.direction}
                    onValueChange={(value) => setEditingLanguage({...editingLanguage, direction: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ltr">من اليسار لليمين (LTR)</SelectItem>
                      <SelectItem value="rtl">من اليمين لليسار (RTL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-currency" className="text-right">العملة</Label>
                  <Select
                    value={editingLanguage.currency}
                    onValueChange={(value) => setEditingLanguage({...editingLanguage, currency: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">Dollar ($)</SelectItem>
                      <SelectItem value="SAR">Riyal (ر.س)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-gray-700 text-base">حالة التفعيل</Label>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={editingLanguage.is_active}
                          onCheckedChange={(checked) => setEditingLanguage({...editingLanguage, is_active: checked})}
                        />
                        <span className={`text-sm font-medium min-w-[60px] ${editingLanguage.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {editingLanguage.is_active ? 'مفعلة' : 'معطلة'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-gray-700 text-base">اللغة الافتراضية</Label>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={editingLanguage.is_default}
                          onCheckedChange={(checked) => setEditingLanguage({...editingLanguage, is_default: checked})}
                        />
                        <span className={`text-sm font-medium min-w-[60px] ${editingLanguage.is_default ? 'text-blue-600' : 'text-gray-500'}`}>
                          {editingLanguage.is_default ? 'افتراضية' : 'عادية'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
              <Button onClick={() => setEditingLanguage(null)} variant="outline">
                إلغاء
              </Button>
              <Button onClick={handleUpdateLanguage} className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
                <Save className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Translation Dialog */}
        <Dialog open={editingTranslation !== null} onOpenChange={() => setEditingTranslation(null)}>
          <DialogContent className={`sm:max-w-[525px] ${direction === 'rtl' ? 'font-arabic' : ''}`} dir={direction}>
            <DialogHeader className={direction === 'rtl' ? 'text-right' : 'text-left'}>
              <DialogTitle>تعديل الترجمة</DialogTitle>
              <DialogDescription>قم بتعديل تفاصيل الترجمة المحددة</DialogDescription>
            </DialogHeader>
            {editingTranslation && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-translation-key" className="text-right">مفتاح الترجمة</Label>
                  <Input
                    id="edit-translation-key"
                    value={editingTranslation.key}
                    onChange={(e) => setEditingTranslation({...editingTranslation, key: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-translation-language" className="text-right">اللغة</Label>
                  <Select
                    value={editingTranslation.language_code}
                    onValueChange={(value) => setEditingTranslation({...editingTranslation, language_code: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-translation-category" className="text-right">الفئة</Label>
                  <Select
                    value={editingTranslation.category}
                    onValueChange={(value) => setEditingTranslation({...editingTranslation, category: value})}
                  >
                    <SelectTrigger className="col-span-3">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-translation-value" className="text-right">النص المترجم</Label>
                  <Textarea
                    id="edit-translation-value"
                    value={editingTranslation.value}
                    onChange={(e) => setEditingTranslation({...editingTranslation, value: e.target.value})}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
              <Button onClick={() => setEditingTranslation(null)} variant="outline">
                إلغاء
              </Button>
              <Button onClick={handleUpdateTranslation} className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
                <Save className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Package Edit Modal */}
        <PackageEditModal
          package={editingPackage}
          isOpen={isPackageModalOpen}
          onClose={() => {
            setIsPackageModalOpen(false);
            setEditingPackage(null);
          }}
          onSave={async () => {
            try {
              await loadPackages();
              setIsPackageModalOpen(false);
              setEditingPackage(null);
            } catch (error) {
              console.error('Error reloading packages:', error);
            }
          }}
        />
      </div>
      <GlobalFooter />
    </div>
  );
}
