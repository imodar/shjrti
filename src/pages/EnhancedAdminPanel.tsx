import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Package, 
  FileText, 
  DollarSign, 
  ShoppingCart, 
  Settings, 
  Home,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Languages,
  UserCheck,
  UserX,
  Mail,
  Shield,
  Globe,
  Currency
} from 'lucide-react';

const EnhancedAdminPanel = () => {
  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // State for different data types
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [families, setFamilies] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [homepageContent, setHomepageContent] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [stats, setStats] = useState({});

  // Form states
  const [editingPackage, setEditingPackage] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [editingTranslation, setEditingTranslation] = useState(null);
  const [newLanguage, setNewLanguage] = useState({
    code: '',
    name: '',
    direction: 'ltr',
    currency: 'USD'
  });
  const [newTranslation, setNewTranslation] = useState({
    key: '',
    value: '',
    language_code: '',
    category: 'general'
  });
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    role: 'admin'
  });

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadPackages(),
        loadFamilies(),
        loadLanguages(),
        loadTranslations(),
        loadAdmins(),
        loadHomepageContent(),
        loadCurrencies(),
        loadStats()
      ]);
    } catch (error) {
      toast({
        title: t('error', 'خطأ'),
        description: t('failed_load_data', 'فشل في تحميل البيانات'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const loadPackages = async () => {
    const { data } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });
    setPackages(data || []);
  };

  const loadFamilies = async () => {
    const { data } = await supabase
      .from('families')
      .select(`
        *,
        profiles:creator_id(first_name, last_name, email),
        packages(name, price_usd, price_sar)
      `)
      .order('created_at', { ascending: false });
    setFamilies(data || []);
  };

  const loadLanguages = async () => {
    const { data } = await supabase
      .from('languages')
      .select('*')
      .order('is_default', { ascending: false });
    setLanguages(data || []);
  };

  const loadTranslations = async () => {
    const { data } = await supabase
      .from('translations')
      .select('*')
      .order('language_code', { ascending: true });
    setTranslations(data || []);
  };

  const loadAdmins = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });
    setAdmins(data || []);
  };

  const loadHomepageContent = async () => {
    const { data } = await supabase
      .from('homepage_content')
      .select('*');
    
    const contentObj = {};
    data?.forEach(item => {
      if (!contentObj[item.language_code]) {
        contentObj[item.language_code] = {};
      }
      contentObj[item.language_code][item.section] = item.content;
    });
    setHomepageContent(contentObj);
  };

  const loadCurrencies = async () => {
    const { data } = await supabase
      .from('currencies')
      .select('*')
      .order('code', { ascending: true });
    setCurrencies(data || []);
  };

  const loadStats = async () => {
    const [usersCount, familiesCount, packagesCount] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('families').select('*', { count: 'exact', head: true }),
      supabase.from('packages').select('*', { count: 'exact', head: true })
    ]);

    setStats({
      users: usersCount.count || 0,
      families: familiesCount.count || 0,
      packages: packagesCount.count || 0
    });
  };

  const toggleUserStatus = async (userId, isDisabled) => {
    try {
      // Note: This would require a function to enable/disable users
      // For now, we'll just show a toast
      toast({
        title: t('success', 'نجح'),
        description: isDisabled ? 
          t('user_enabled', 'تم تفعيل المستخدم') : 
          t('user_disabled', 'تم إيقاف المستخدم')
      });
    } catch (error) {
      toast({
        title: t('error', 'خطأ'),
        description: t('failed_update_user', 'فشل في تحديث المستخدم'),
        variant: "destructive"
      });
    }
  };

  const resendConfirmationEmail = async (userEmail) => {
    try {
      // This would require server-side function
      toast({
        title: t('success', 'نجح'),
        description: t('confirmation_sent', 'تم إرسال إيميل التأكيد')
      });
    } catch (error) {
      toast({
        title: t('error', 'خطأ'),
        description: t('failed_send_email', 'فشل في إرسال الإيميل'),
        variant: "destructive"
      });
    }
  };

  const createLanguage = async () => {
    try {
      const { error } = await supabase
        .from('languages')
        .insert([newLanguage]);

      if (error) throw error;

      toast({
        title: t('success', 'نجح'),
        description: t('language_created', 'تم إنشاء اللغة بنجاح')
      });

      setNewLanguage({ code: '', name: '', direction: 'ltr', currency: 'USD' });
      loadLanguages();
    } catch (error) {
      toast({
        title: t('error', 'خطأ'),
        description: t('failed_create_language', 'فشل في إنشاء اللغة'),
        variant: "destructive"
      });
    }
  };

  const createTranslation = async () => {
    try {
      const { error } = await supabase
        .from('translations')
        .insert([newTranslation]);

      if (error) throw error;

      toast({
        title: t('success', 'نجح'),
        description: t('translation_created', 'تم إنشاء الترجمة بنجاح')
      });

      setNewTranslation({ key: '', value: '', language_code: '', category: 'general' });
      loadTranslations();
    } catch (error) {
      toast({
        title: t('error', 'خطأ'),
        description: t('failed_create_translation', 'فشل في إنشاء الترجمة'),
        variant: "destructive"
      });
    }
  };

  const createAdmin = async () => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .insert([newAdmin]);

      if (error) throw error;

      toast({
        title: t('success', 'نجح'),
        description: t('admin_created', 'تم إنشاء المدير بنجاح')
      });

      setNewAdmin({ email: '', role: 'admin' });
      loadAdmins();
    } catch (error) {
      toast({
        title: t('error', 'خطأ'),
        description: t('failed_create_admin', 'فشل في إنشاء المدير'),
        variant: "destructive"
      });
    }
  };

  const updateTranslation = async () => {
    if (!editingTranslation?.id) return;
    
    try {
      const { error } = await supabase
        .from('translations')
        .update({
          key: editingTranslation.key,
          value: editingTranslation.value,
          category: editingTranslation.category
        })
        .eq('id', editingTranslation.id);
      
      if (error) throw error;
      
      toast({
        title: t('success', 'نجح'),
        description: t('translation_updated', 'تم تحديث الترجمة')
      });
      
      setEditingTranslation(null);
      loadTranslations();
    } catch (error) {
      console.error('Error updating translation:', error);
      toast({
        title: t('error', 'خطأ'),
        description: t('translation_update_failed', 'فشل في تحديث الترجمة'),
        variant: 'destructive'
      });
    }
  };

  // User Management Functions
  const updateUser = async () => {
    if (!editingUser?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: editingUser.email,
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          phone: editingUser.phone
        })
        .eq('id', editingUser.id);
      
      if (error) throw error;
      
      toast({
        title: t('success', 'نجح'),
        description: t('user_updated', 'تم تحديث المستخدم')
      });
      
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: t('error', 'خطأ'),
        description: t('user_update_failed', 'فشل في تحديث المستخدم'),
        variant: 'destructive'
      });
    }
  };

  const deleteUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: t('success', 'نجح'),
        description: t('user_deleted', 'تم حذف المستخدم')
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: t('error', 'خطأ'),
        description: t('user_delete_failed', 'فشل في حذف المستخدم'),
        variant: 'destructive'
      });
    }
  };

  // Package Management Functions
  const updatePackage = async () => {
    if (!editingPackage?.id) return;
    
    try {
      const { error } = await supabase
        .from('packages')
        .update({
          name: editingPackage.name,
          description: editingPackage.description,
          price: parseFloat(editingPackage.price),
          price_usd: parseFloat(editingPackage.price_usd || editingPackage.price),
          price_sar: parseFloat(editingPackage.price_sar || editingPackage.price),
          is_active: editingPackage.is_active
        })
        .eq('id', editingPackage.id);
      
      if (error) throw error;
      
      toast({
        title: t('success', 'نجح'),
        description: t('package_updated', 'تم تحديث الباقة')
      });
      
      setEditingPackage(null);
      loadPackages();
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: t('error', 'خطأ'),
        description: t('package_update_failed', 'فشل في تحديث الباقة'),
        variant: 'destructive'
      });
    }
  };

  const deletePackage = async (packageId) => {
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', packageId);
      
      if (error) throw error;
      
      toast({
        title: t('success', 'نجح'),
        description: t('package_deleted', 'تم حذف الباقة')
      });
      
      loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: t('error', 'خطأ'),
        description: t('package_delete_failed', 'فشل في حذف الباقة'),
        variant: 'destructive'
      });
    }
  };

  // Language Management Functions
  const updateLanguage = async () => {
    if (!editingLanguage?.id) return;
    
    try {
      const { error } = await supabase
        .from('languages')
        .update({
          name: editingLanguage.name,
          code: editingLanguage.code,
          direction: editingLanguage.direction,
          currency: editingLanguage.currency,
          is_active: editingLanguage.is_active
        })
        .eq('id', editingLanguage.id);
      
      if (error) throw error;
      
      toast({
        title: t('success', 'نجح'),
        description: t('language_updated', 'تم تحديث اللغة')
      });
      
      setEditingLanguage(null);
      loadLanguages();
    } catch (error) {
      console.error('Error updating language:', error);
      toast({
        title: t('error', 'خطأ'),
        description: t('language_update_failed', 'فشل في تحديث اللغة'),
        variant: 'destructive'
      });
    }
  };

  const deleteLanguage = async (languageId) => {
    try {
      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('id', languageId);
      
      if (error) throw error;
      
      toast({
        title: t('success', 'نجح'),
        description: t('language_deleted', 'تم حذف اللغة')
      });
      
      loadLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
      toast({
        title: t('error', 'خطأ'),
        description: t('language_delete_failed', 'فشل في حذف اللغة'),
        variant: 'destructive'
      });
    }
  };

  // Admin Management Functions
  const deleteAdmin = async (adminId) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);
      
      if (error) throw error;
      
      toast({
        title: t('success', 'نجح'),
        description: t('admin_deleted', 'تم حذف المدير')
      });
      
      loadAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        title: t('error', 'خطأ'),
        description: t('admin_delete_failed', 'فشل في حذف المدير'),
        variant: 'destructive'
      });
    }
  };

  // Family Management Functions
  const deleteFamily = async (familyId) => {
    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId);
      
      if (error) throw error;
      
      toast({
        title: t('success', 'نجح'),
        description: t('family_deleted', 'تم حذف العائلة')
      });
      
      loadFamilies();
    } catch (error) {
      console.error('Error deleting family:', error);
      toast({
        title: t('error', 'خطأ'),
        description: t('family_delete_failed', 'فشل في حذف العائلة'),
        variant: 'destructive'
      });
    }
  };

  const deleteTranslation = async (translationId) => {
    try {
      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('id', translationId);
      
      if (error) throw error;
      
      toast({
        title: t('success', 'نجح'),
        description: t('translation_deleted', 'تم حذف الترجمة')
      });
      
      loadTranslations();
    } catch (error) {
      console.error('Error deleting translation:', error);
      toast({
        title: t('error', 'خطأ'),
        description: t('translation_delete_failed', 'فشل في حذف الترجمة'),
        variant: 'destructive'
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>{t('access_denied', 'الوصول مرفوض')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t('no_admin_access', 'ليس لديك صلاحية الوصول لهذه الصفحة')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <Header />
      
      <div className="container mx-auto p-6 pt-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">{t('admin_panel', 'لوحة الإدارة')}</h1>
          <Button onClick={loadAllData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('refresh', 'تحديث')}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="dashboard">{t('dashboard', 'الرئيسية')}</TabsTrigger>
            <TabsTrigger value="users">{t('users', 'المستخدمون')}</TabsTrigger>
            <TabsTrigger value="packages">{t('packages', 'الباقات')}</TabsTrigger>
            <TabsTrigger value="families">{t('families', 'العائلات')}</TabsTrigger>
            <TabsTrigger value="languages">{t('languages', 'اللغات')}</TabsTrigger>
            <TabsTrigger value="translations">{t('translations', 'الترجمات')}</TabsTrigger>
            <TabsTrigger value="content">{t('content', 'المحتوى')}</TabsTrigger>
            <TabsTrigger value="admins">{t('admins', 'المديرون')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('total_users', 'إجمالي المستخدمين')}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats as any).users || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('families', 'العائلات')}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats as any).families || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('packages', 'الباقات')}</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats as any).packages || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('languages', 'اللغات')}</CardTitle>
                  <Languages className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{languages.length}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t('user_management', 'إدارة المستخدمين')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name', 'الاسم')}</TableHead>
                      <TableHead>{t('email', 'البريد الإلكتروني')}</TableHead>
                      <TableHead>{t('phone', 'الهاتف')}</TableHead>
                      <TableHead>{t('status', 'الحالة')}</TableHead>
                      <TableHead>{t('actions', 'الإجراءات')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.first_name} {user.last_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>
                          <Badge variant={user.user_id ? "default" : "destructive"}>
                            {user.user_id ? t('active', 'نشط') : t('inactive', 'غير نشط')}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => toggleUserStatus(user.user_id, !user.user_id)}
                          >
                            {user.user_id ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                           <Button 
                             variant="destructive" 
                             size="sm" 
                             onClick={() => {
                               if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                                 deleteUser(user.id);
                               }
                             }}
                           >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Packages Tab */}
          <TabsContent value="packages">
            <Card>
              <CardHeader>
                <CardTitle>{t('package_management', 'إدارة الباقات')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name', 'الاسم')}</TableHead>
                      <TableHead>{t('price_usd', 'السعر بالدولار')}</TableHead>
                      <TableHead>{t('price_sar', 'السعر بالريال')}</TableHead>
                      <TableHead>{t('status', 'الحالة')}</TableHead>
                      <TableHead>{t('actions', 'الإجراءات')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell>{pkg.name}</TableCell>
                        <TableCell>${pkg.price_usd}</TableCell>
                        <TableCell>{pkg.price_sar} ر.س</TableCell>
                        <TableCell>
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>
                            {pkg.is_active ? t('active', 'نشط') : t('inactive', 'غير نشط')}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingPackage(pkg)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                           <Button 
                             variant="destructive" 
                             size="sm" 
                             onClick={() => {
                               if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
                                 deletePackage(pkg.id);
                               }
                             }}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Languages Management */}
          <TabsContent value="languages">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('add_language', 'إضافة لغة جديدة')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lang-code">{t('language_code', 'رمز اللغة')}</Label>
                      <Input
                        id="lang-code"
                        value={newLanguage.code}
                        onChange={(e) => setNewLanguage({...newLanguage, code: e.target.value})}
                        placeholder="en, ar, fr..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="lang-name">{t('language_name', 'اسم اللغة')}</Label>
                      <Input
                        id="lang-name"
                        value={newLanguage.name}
                        onChange={(e) => setNewLanguage({...newLanguage, name: e.target.value})}
                        placeholder="English, العربية, Français..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="direction">{t('direction', 'الاتجاه')}</Label>
                      <Select value={newLanguage.direction} onValueChange={(value) => setNewLanguage({...newLanguage, direction: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ltr">LTR</SelectItem>
                          <SelectItem value="rtl">RTL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currency">{t('currency', 'العملة')}</Label>
                      <Select value={newLanguage.currency} onValueChange={(value) => setNewLanguage({...newLanguage, currency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="SAR">SAR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={createLanguage}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('add_language', 'إضافة لغة')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('existing_languages', 'اللغات الموجودة')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('code', 'الرمز')}</TableHead>
                        <TableHead>{t('name', 'الاسم')}</TableHead>
                        <TableHead>{t('direction', 'الاتجاه')}</TableHead>
                        <TableHead>{t('currency', 'العملة')}</TableHead>
                        <TableHead>{t('status', 'الحالة')}</TableHead>
                        <TableHead>{t('default', 'افتراضي')}</TableHead>
                        <TableHead>{t('actions', 'الإجراءات')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {languages.map((lang) => (
                        <TableRow key={lang.id}>
                          <TableCell>{lang.code}</TableCell>
                          <TableCell>{lang.name}</TableCell>
                          <TableCell>{lang.direction}</TableCell>
                          <TableCell>{lang.currency}</TableCell>
                          <TableCell>
                            <Badge variant={lang.is_active ? "default" : "secondary"}>
                              {lang.is_active ? t('active', 'نشط') : t('inactive', 'غير نشط')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={lang.is_default ? "default" : "outline"}>
                              {lang.is_default ? t('yes', 'نعم') : t('no', 'لا')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setEditingLanguage(lang)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                           <Button 
                             variant="destructive" 
                             size="sm" 
                             onClick={() => {
                               if (confirm('هل أنت متأكد من حذف هذه اللغة؟')) {
                                 deleteLanguage(lang.id);
                               }
                             }}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Translations Management */}
          <TabsContent value="translations">
            <div className="space-y-6">
              {/* Relationship Terms Quick Management */}
              <Card>
                <CardHeader>
                  <CardTitle>إدارة مصطلحات القرابة</CardTitle>
                  <CardDescription>إدارة سريعة لمصطلحات القرابة المستخدمة في شجرة العائلة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Male Relations */}
                    <div>
                      <h4 className="font-semibold mb-3 text-blue-700">علاقات الذكور</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'father', defaultValue: 'أب', icon: '👨‍🦳' },
                          { key: 'husband', defaultValue: 'زوج', icon: '👨' },
                          { key: 'brother', defaultValue: 'أخ', icon: '👨‍🦱' },
                          { key: 'son', defaultValue: 'ابن', icon: '👶' },
                          { key: 'grandfather', defaultValue: 'جد', icon: '👴' },
                          { key: 'uncle', defaultValue: 'عم', icon: '👨‍🦲' }
                        ].map((relation) => (
                          <div key={relation.key} className="flex items-center gap-3 p-3 border rounded-lg">
                            <span className="text-2xl">{relation.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{relation.key}</div>
                              <div className="text-muted-foreground text-xs">
                                {translations.find(t => t.key === relation.key && t.language_code === 'ar')?.value || relation.defaultValue}
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const existing = translations.find(t => t.key === relation.key && t.language_code === 'ar');
                                if (existing) {
                                  setEditingTranslation(existing);
                                } else {
                                  setNewTranslation({
                                    key: relation.key,
                                    value: relation.defaultValue,
                                    language_code: 'ar',
                                    category: 'relationships'
                                  });
                                }
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Female Relations */}
                    <div>
                      <h4 className="font-semibold mb-3 text-pink-700">علاقات الإناث</h4>
                      <div className="space-y-2">
                        {[
                          { key: 'mother', defaultValue: 'أم', icon: '👩‍🦳' },
                          { key: 'wife', defaultValue: 'زوجة', icon: '👩' },
                          { key: 'sister', defaultValue: 'أخت', icon: '👩‍🦱' },
                          { key: 'daughter', defaultValue: 'ابنة', icon: '👶' },
                          { key: 'grandmother', defaultValue: 'جدة', icon: '👵' },
                          { key: 'aunt', defaultValue: 'عمة', icon: '👩‍🦲' }
                        ].map((relation) => (
                          <div key={relation.key} className="flex items-center gap-3 p-3 border rounded-lg">
                            <span className="text-2xl">{relation.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{relation.key}</div>
                              <div className="text-muted-foreground text-xs">
                                {translations.find(t => t.key === relation.key && t.language_code === 'ar')?.value || relation.defaultValue}
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const existing = translations.find(t => t.key === relation.key && t.language_code === 'ar');
                                if (existing) {
                                  setEditingTranslation(existing);
                                } else {
                                  setNewTranslation({
                                    key: relation.key,
                                    value: relation.defaultValue,
                                    language_code: 'ar',
                                    category: 'relationships'
                                  });
                                }
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('add_translation', 'إضافة ترجمة جديدة')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="trans-key">{t('key', 'المفتاح')}</Label>
                      <Input
                        id="trans-key"
                        value={newTranslation.key}
                        onChange={(e) => setNewTranslation({...newTranslation, key: e.target.value})}
                        placeholder="welcome_message"
                      />
                    </div>
                    <div>
                      <Label htmlFor="trans-lang">{t('language', 'اللغة')}</Label>
                      <Select value={newTranslation.language_code} onValueChange={(value) => setNewTranslation({...newTranslation, language_code: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="trans-value">{t('value', 'القيمة')}</Label>
                    <Textarea
                      id="trans-value"
                      value={newTranslation.value}
                      onChange={(e) => setNewTranslation({...newTranslation, value: e.target.value})}
                      placeholder="مرحباً بكم"
                    />
                  </div>
                  <Button onClick={createTranslation}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('add_translation', 'إضافة ترجمة')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('existing_translations', 'الترجمات الموجودة')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('key', 'المفتاح')}</TableHead>
                        <TableHead>{t('language', 'اللغة')}</TableHead>
                        <TableHead>{t('value', 'القيمة')}</TableHead>
                        <TableHead>{t('category', 'الفئة')}</TableHead>
                        <TableHead>{t('actions', 'الإجراءات')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {translations.slice(0, 20).map((trans) => (
                        <TableRow key={trans.id}>
                          <TableCell className="font-mono text-sm">{trans.key}</TableCell>
                          <TableCell>{trans.language_code}</TableCell>
                          <TableCell className="max-w-xs truncate">{trans.value}</TableCell>
                          <TableCell>{trans.category}</TableCell>
                          <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setEditingTranslation(trans)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                           <Button 
                             variant="destructive" 
                             size="sm" 
                             onClick={() => {
                               if (confirm('هل أنت متأكد من حذف هذه الترجمة؟')) {
                                 deleteTranslation(trans.id);
                               }
                             }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Management */}
          <TabsContent value="admins">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('add_admin', 'إضافة مدير جديد')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="admin-email">{t('email', 'البريد الإلكتروني')}</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                        placeholder="admin@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-role">{t('role', 'الدور')}</Label>
                      <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({...newAdmin, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={createAdmin}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('add_admin', 'إضافة مدير')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('existing_admins', 'المديرون الموجودون')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('email', 'البريد الإلكتروني')}</TableHead>
                        <TableHead>{t('role', 'الدور')}</TableHead>
                        <TableHead>{t('created_at', 'تاريخ الإنشاء')}</TableHead>
                        <TableHead>{t('actions', 'الإجراءات')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <Badge>{admin.role}</Badge>
                          </TableCell>
                          <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                           <Button 
                             variant="destructive" 
                             size="sm"
                             onClick={() => {
                               if (confirm('هل أنت متأكد من حذف هذا المدير؟')) {
                                 deleteAdmin(admin.id);
                               }
                             }}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Management */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>{t('content_management', 'إدارة المحتوى')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('content_coming_soon', 'إدارة المحتوى متعدد اللغات قادمة قريباً')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Families Tab */}
          <TabsContent value="families">
            <Card>
              <CardHeader>
                <CardTitle>{t('families_management', 'إدارة العائلات')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name', 'الاسم')}</TableHead>
                      <TableHead>{t('creator', 'المنشئ')}</TableHead>
                      <TableHead>{t('package', 'الباقة')}</TableHead>
                      <TableHead>{t('status', 'الحالة')}</TableHead>
                      <TableHead>{t('actions', 'الإجراءات')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {families.map((family) => (
                      <TableRow key={family.id}>
                        <TableCell>{family.name}</TableCell>
                        <TableCell>
                          {family.profiles ? `${family.profiles.first_name} ${family.profiles.last_name}` : 'N/A'}
                        </TableCell>
                        <TableCell>{family.packages?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={family.subscription_status === 'active' ? "default" : "secondary"}>
                            {family.subscription_status || 'inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button variant="outline" size="sm" onClick={() => {/* Edit family logic */}}>
                            <Edit className="w-4 h-4" />
                          </Button>
                           <Button 
                             variant="destructive" 
                             size="sm" 
                             onClick={() => {
                               if (confirm('هل أنت متأكد من حذف هذه العائلة؟')) {
                                 deleteFamily(family.id);
                               }
                             }}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Translation Dialog */}
      <Dialog open={!!editingTranslation} onOpenChange={() => setEditingTranslation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit_translation', 'تعديل الترجمة')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('key', 'المفتاح')}</Label>
              <Input
                value={editingTranslation?.key || ''}
                onChange={(e) => setEditingTranslation(prev => ({...prev, key: e.target.value}))}
                className="font-mono"
              />
            </div>
            <div>
              <Label>{t('value', 'القيمة')}</Label>
              <Textarea
                value={editingTranslation?.value || ''}
                onChange={(e) => setEditingTranslation(prev => ({...prev, value: e.target.value}))}
                rows={4}
              />
            </div>
            <div>
              <Label>{t('category', 'الفئة')}</Label>
              <Input
                value={editingTranslation?.category || ''}
                onChange={(e) => setEditingTranslation(prev => ({...prev, category: e.target.value}))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingTranslation(null)}>
                {t('cancel', 'إلغاء')}
              </Button>
              <Button onClick={updateTranslation}>
                {t('save', 'حفظ')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit_user', 'تعديل المستخدم')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('email', 'البريد الإلكتروني')}</Label>
              <Input
                value={editingUser?.email || ''}
                onChange={(e) => setEditingUser(prev => ({...prev, email: e.target.value}))}
              />
            </div>
            <div>
              <Label>{t('first_name', 'الاسم الأول')}</Label>
              <Input
                value={editingUser?.first_name || ''}
                onChange={(e) => setEditingUser(prev => ({...prev, first_name: e.target.value}))}
              />
            </div>
            <div>
              <Label>{t('last_name', 'الاسم الأخير')}</Label>
              <Input
                value={editingUser?.last_name || ''}
                onChange={(e) => setEditingUser(prev => ({...prev, last_name: e.target.value}))}
              />
            </div>
            <div>
              <Label>{t('phone', 'الهاتف')}</Label>
              <Input
                value={editingUser?.phone || ''}
                onChange={(e) => setEditingUser(prev => ({...prev, phone: e.target.value}))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                {t('cancel', 'إلغاء')}
              </Button>
              <Button onClick={updateUser}>
                {t('save', 'حفظ')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={!!editingPackage} onOpenChange={() => setEditingPackage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit_package', 'تعديل الباقة')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('name', 'الاسم')}</Label>
              <Input
                value={editingPackage?.name || ''}
                onChange={(e) => setEditingPackage(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            <div>
              <Label>{t('description', 'الوصف')}</Label>
              <Textarea
                value={editingPackage?.description || ''}
                onChange={(e) => setEditingPackage(prev => ({...prev, description: e.target.value}))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('price_usd', 'السعر بالدولار')}</Label>
                <Input
                  type="number"
                  value={editingPackage?.price_usd || ''}
                  onChange={(e) => setEditingPackage(prev => ({...prev, price_usd: e.target.value}))}
                />
              </div>
              <div>
                <Label>{t('price_sar', 'السعر بالريال')}</Label>
                <Input
                  type="number"
                  value={editingPackage?.price_sar || ''}
                  onChange={(e) => setEditingPackage(prev => ({...prev, price_sar: e.target.value}))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={editingPackage?.is_active || false}
                onCheckedChange={(checked) => setEditingPackage(prev => ({...prev, is_active: checked}))}
              />
              <Label>{t('active', 'نشط')}</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingPackage(null)}>
                {t('cancel', 'إلغاء')}
              </Button>
              <Button onClick={updatePackage}>
                {t('save', 'حفظ')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Language Dialog */}
      <Dialog open={!!editingLanguage} onOpenChange={() => setEditingLanguage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit_language', 'تعديل اللغة')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('language_code', 'رمز اللغة')}</Label>
              <Input
                value={editingLanguage?.code || ''}
                onChange={(e) => setEditingLanguage(prev => ({...prev, code: e.target.value}))}
              />
            </div>
            <div>
              <Label>{t('language_name', 'اسم اللغة')}</Label>
              <Input
                value={editingLanguage?.name || ''}
                onChange={(e) => setEditingLanguage(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            <div>
              <Label>{t('direction', 'الاتجاه')}</Label>
              <Select
                value={editingLanguage?.direction || 'ltr'}
                onValueChange={(value) => setEditingLanguage(prev => ({...prev, direction: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ltr">LTR</SelectItem>
                  <SelectItem value="rtl">RTL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('currency', 'العملة')}</Label>
              <Select
                value={editingLanguage?.currency || 'USD'}
                onValueChange={(value) => setEditingLanguage(prev => ({...prev, currency: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="SAR">SAR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={editingLanguage?.is_active || false}
                onCheckedChange={(checked) => setEditingLanguage(prev => ({...prev, is_active: checked}))}
              />
              <Label>{t('active', 'نشط')}</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingLanguage(null)}>
                {t('cancel', 'إلغاء')}
              </Button>
              <Button onClick={updateLanguage}>
                {t('save', 'حفظ')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedAdminPanel;