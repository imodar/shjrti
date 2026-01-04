
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Settings,
  FileText,
  Mail,
  Code,
  Palette,
  AlertTriangle,
  MailOpen,
  TrendingUp,
  Search,
  Share2
} from "lucide-react";
import { PackageEditModal } from '@/components/PackageEditModal';
import { ChangePackageModal } from '@/components/ChangePackageModal';
import { ExtendSubscriptionModal } from '@/components/ExtendSubscriptionModal';
import PageEditor from '@/components/PageEditor';
import ContactSubmissions from '@/components/ContactSubmissions';
import { PaymentGatewaySettings } from '@/components/PaymentGatewaySettings';
import AdminEmailTemplates from './AdminEmailTemplates';
import AdminEmailLogs from './AdminEmailLogs';
import AdminPaymentAnalytics from './AdminPaymentAnalytics';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
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

interface UserProfile {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  profile_id: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_phone: string | null;
  user_status: 'active' | 'pending' | 'suspended' | 'inactive';
  status_reason: string | null;
  subscription_status: string;
  subscription_package_name: any;
  subscription_expires_at: string | null;
}

interface UserSubscription {
  id: string;
  user_id: string;
  package_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  package?: {
    name: any;
    price_usd: number;
    price_sar: number;
  };
}

export default function EnhancedAdminPanel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentLanguage, direction } = useLanguage();
  const { currentTheme, setCurrentTheme } = useTheme();
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
  const [translationSearchQuery, setTranslationSearchQuery] = useState('');
  const [currentTranslationsQuery, setCurrentTranslationsQuery] = useState('');
  const [translationsPage, setTranslationsPage] = useState(0);
  const [translationsTotal, setTranslationsTotal] = useState(0);
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsLoadingMore, setTranslationsLoadingMore] = useState(false);
  const translationsListRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 100;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Custom JavaScript management state
  const [customJavaScript, setCustomJavaScript] = useState('');
  const [savingJavaScript, setSavingJavaScript] = useState(false);
  
  // Google Analytics management state
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [savingAnalyticsId, setSavingAnalyticsId] = useState(false);
  
  // Maintenance mode management state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savingMaintenanceMode, setSavingMaintenanceMode] = useState(false);
  
  // User status management state
  const [statusUpdating, setStatusUpdating] = useState<Set<string>>(new Set());
  const [statusDialog, setStatusDialog] = useState<{isOpen: boolean, user: UserProfile | null}>({isOpen: false, user: null});
  const [newUserStatus, setNewUserStatus] = useState<'active' | 'pending' | 'suspended' | 'inactive'>('active');
  const [statusReason, setStatusReason] = useState('');
  
  // Subscription management modals
  const [changePackageModalOpen, setChangePackageModalOpen] = useState(false);
  const [extendSubscriptionModalOpen, setExtendSubscriptionModalOpen] = useState(false);
  const [editingUserStatus, setEditingUserStatus] = useState<'active' | 'pending' | 'suspended' | 'inactive'>('active');
  const [editingStatusReason, setEditingStatusReason] = useState('');

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

  const loadTranslations = async ({ page = 0, query = currentTranslationsQuery, append = false }: { page?: number; query?: string; append?: boolean } = {}) => {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    try {
      if (append) setTranslationsLoadingMore(true); else setTranslationsLoading(true);
      let builder = supabase
        .from('translations')
        .select('*', { count: 'exact' })
        .order('key', { ascending: true })
        .order('language_code', { ascending: true });
      const q = query?.trim();
      if (q) {
        const like = `%${q}%`;
        builder = builder.or(`key.ilike.${like},value.ilike.${like},language_code.ilike.${like},category.ilike.${like}`);
      }
      const { data, error, count } = await builder.range(from, to);
      if (error) throw error;
      if (append) {
        setTranslations(prev => [...prev, ...(data || [])]);
      } else {
        setTranslations(data || []);
      }
      if (typeof count === 'number') setTranslationsTotal(count);
      setTranslationsPage(page);
    } catch (error) {
      console.error('Error loading translations:', error);
    } finally {
      if (append) setTranslationsLoadingMore(false); else setTranslationsLoading(false);
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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users_for_admin');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadUserSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          package:packages(name, price_usd, price_sar)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading user subscriptions:', error);
    }
  };

  // Load custom JavaScript from admin settings
  const loadCustomJavaScript = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'custom_javascript')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const settingValue = data?.setting_value as { code?: string } | null;
      if (settingValue?.code) {
        setCustomJavaScript(settingValue.code);
      }
    } catch (error) {
      console.error('Error loading custom JavaScript:', error);
    }
  };

  // Load Google Analytics ID from admin settings
  const loadGoogleAnalyticsId = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'google_analytics_id')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.setting_value) {
        setGoogleAnalyticsId(String(data.setting_value));
      }
    } catch (error) {
      console.error('Error loading Google Analytics ID:', error);
    }
  };

  // Save custom JavaScript to admin settings
  const saveCustomJavaScript = async () => {
    setSavingJavaScript(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'custom_javascript',
          setting_value: { code: customJavaScript },
          description: 'Custom JavaScript code to be injected in the head section'
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: "تم حفظ كود الجافاسكريبت بنجاح"
      });
    } catch (error) {
      console.error('Error saving custom JavaScript:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ كود الجافاسكريبت",
        variant: "destructive"
      });
    } finally {
      setSavingJavaScript(false);
    }
  };

  // Save Google Analytics ID to admin settings
  const saveGoogleAnalyticsId = async () => {
    setSavingAnalyticsId(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'google_analytics_id',
          setting_value: googleAnalyticsId,
          description: 'Google Analytics Measurement ID (e.g., G-XXXXXXXXXX)'
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: "تم حفظ معرف Google Analytics بنجاح"
      });
    } catch (error) {
      console.error('Error saving Google Analytics ID:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ معرف Google Analytics",
        variant: "destructive"
      });
    } finally {
      setSavingAnalyticsId(false);
    }
  };

  // Load maintenance mode from admin settings
  const loadMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const settingValue = data?.setting_value as { enabled?: boolean } | null;
      if (settingValue?.enabled !== undefined) {
        setMaintenanceMode(settingValue.enabled);
      }
    } catch (error) {
      console.error('Error loading maintenance mode:', error);
    }
  };

  // Save maintenance mode to admin settings
  const saveMaintenanceMode = async (enabled: boolean) => {
    setSavingMaintenanceMode(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'maintenance_mode',
          setting_value: { enabled },
          description: 'Enable or disable maintenance mode for the entire site'
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error('Error saving maintenance mode:', error);
        throw error;
      }

      setMaintenanceMode(enabled);
      toast({
        title: enabled ? "تم تفعيل وضع الصيانة" : "تم إلغاء وضع الصيانة",
        description: enabled ? "الموقع الآن في وضع الصيانة للمستخدمين العاديين" : "الموقع متاح الآن لجميع المستخدمين",
        variant: enabled ? "destructive" : "default"
      });
    } catch (error) {
      console.error('🔧 Admin Panel: Error saving maintenance mode:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ إعدادات وضع الصيانة",
        variant: "destructive"
      });
    } finally {
      setSavingMaintenanceMode(false);
    }
  };

  // Update user status function
  const updateUserStatus = async (userId: string, status: 'active' | 'pending' | 'suspended' | 'inactive', reason?: string) => {
    setStatusUpdating(prev => new Set([...prev, userId]));
    try {
      const { error } = await supabase.rpc('update_user_status', {
        target_user_id: userId,
        new_status: status,
        status_reason: reason || null
      });

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة المستخدم بنجاح"
      });

      // إعادة تحميل المستخدمين
      await loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة المستخدم",
        variant: "destructive"
      });
    } finally {
      setStatusUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Handle status update dialog
  const handleStatusUpdate = async () => {
    if (!statusDialog.user) return;
    
    await updateUserStatus(statusDialog.user.id, newUserStatus, statusReason);
    setStatusDialog({isOpen: false, user: null});
    setStatusReason('');
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentTranslationsQuery !== translationSearchQuery) {
        setTranslations([]);
        setTranslationsPage(0);
        setCurrentTranslationsQuery(translationSearchQuery);
        loadTranslations({ page: 0, query: translationSearchQuery, append: false });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [translationSearchQuery]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadPackages(), 
      loadTranslations({ page: 0, query: '', append: false }), 
      loadLanguages(), 
      loadUsers(), 
      loadUserSubscriptions(), 
      loadCustomJavaScript(), 
      loadGoogleAnalyticsId(),
      loadMaintenanceMode()
    ]).finally(() => {
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

      setTranslations([]);
      setTranslationsPage(0);
      await loadTranslations({ page: 0, query: currentTranslationsQuery, append: false });
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

      setTranslations([]);
      setTranslationsPage(0);
      await loadTranslations({ page: 0, query: currentTranslationsQuery, append: false });
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

      setTranslations([]);
      setTranslationsPage(0);
      await loadTranslations({ page: 0, query: currentTranslationsQuery, append: false });
    } catch (error) {
      console.error('Error deleting translation:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الترجمة",
        variant: "destructive"
      });
    }
  };

  // User management functions
  const handleUpdateUser = async () => {
    if (!editingUser || !editingUser.profile_id) return;

    try {
      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          phone: editingUser.profile_phone || editingUser.phone
        })
        .eq('id', editingUser.profile_id);

      if (profileError) throw profileError;

      // Update user status if changed
      const { error: statusError } = await supabase.rpc('update_user_status', {
        target_user_id: editingUser.id,
        new_status: editingUser.user_status,
        status_reason: editingUser.status_reason || null
      });

      if (statusError) throw statusError;

      toast({
        title: "نجح",
        description: "تم تحديث جميع بيانات المستخدم بنجاح (البيانات الأساسية، الحالة، والصلاحيات)"
      });

      loadUsers();
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث بيانات المستخدم",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: deletingUser.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "نجح",
        description: "تم حذف المستخدم وجميع بياناته بنجاح"
      });

      loadUsers();
      loadUserSubscriptions();
      setDeletingUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المستخدم",
        variant: "destructive"
      });
    }
  };

  const getUserSubscription = (userId: string) => {
    return userSubscriptions.find(sub => sub.user_id === userId && sub.status === 'active');
  };

  const isUserEmailConfirmed = (user: UserProfile) => {
    return user.email_confirmed_at !== null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir={direction}>
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir={direction}>
      <GlobalHeader />
      <Toaster />
      
      <div className="container mx-auto px-6 pt-24 pb-12" dir={direction}>
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
            
            <Button onClick={() => { 
              loadPackages(); 
              setTranslations([]);
              setTranslationsPage(0);
              loadTranslations({ page: 0, query: currentTranslationsQuery, append: false }); 
              loadLanguages(); 
              loadUsers(); 
              loadUserSubscriptions(); 
              loadCustomJavaScript(); 
              loadGoogleAnalyticsId();
              loadMaintenanceMode();
            }} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-teal-500">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>
            <Button 
              onClick={() => navigate('/admin-api-settings')} 
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:!text-emerald-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              إعدادات API
            </Button>
            <Button 
              onClick={() => navigate('/admin/social-media')} 
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:!text-emerald-700"
            >
              <Share2 className="h-4 w-4 mr-2" />
              إعدادات المشاركة
            </Button>
          </div>
        </div>

        <Tabs defaultValue="packages" className="space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 blur-3xl -z-10 rounded-3xl"></div>
            <TabsList className="grid w-full grid-cols-12 gap-2 bg-gradient-to-br from-white/80 via-emerald-50/30 to-teal-50/30 dark:from-gray-900/80 dark:via-emerald-950/30 dark:to-teal-950/30 backdrop-blur-2xl border-2 border-emerald-200/50 dark:border-emerald-700/50 rounded-2xl p-3 shadow-xl shadow-emerald-500/10">
              <TabsTrigger 
                value="packages" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <Package className="h-5 w-5 transition-transform group-hover:rotate-12 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline">الباقات</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="users" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <CircleUserRound className="h-5 w-5 transition-transform group-hover:scale-110 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline">المستخدمين</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="payments" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <CreditCard className="h-5 w-5 transition-transform group-hover:rotate-6 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline">الدفع</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="analytics" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <TrendingUp className="h-5 w-5 transition-transform group-hover:scale-110 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline text-xs">التحليلات</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="translations"
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <MessageSquare className="h-5 w-5 transition-transform group-hover:-rotate-12 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline">الترجمات</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="languages" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <Languages className="h-5 w-5 transition-transform group-hover:scale-110 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline">اللغات</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="themes" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <Palette className="h-5 w-5 transition-transform group-hover:rotate-180 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline">المظاهر</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="pages" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <FileText className="h-5 w-5 transition-transform group-hover:-rotate-6 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline">الصفحات</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="email-templates" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <MailOpen className="h-5 w-5 transition-transform group-hover:scale-110 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline text-xs">قوالب الإيميل</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="email-logs" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <Mail className="h-5 w-5 transition-transform group-hover:rotate-12 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline text-xs">سجل الإيميلات</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="contact" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <Mail className="h-5 w-5 transition-transform group-hover:-rotate-12 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline">الرسائل</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="settings" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <Scale className="h-5 w-5 transition-transform group-hover:rotate-180 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline">الإعدادات</span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="seo" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <Search className="h-5 w-5 transition-transform group-hover:scale-110 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline text-xs">SEO</span>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="newsletter" 
                className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 data-[state=active]:scale-105 data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 data-[state=inactive]:hover:bg-emerald-50/50 dark:data-[state=inactive]:hover:bg-emerald-950/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 data-[state=active]:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 font-semibold">
                  <Mail className="h-5 w-5 transition-transform group-hover:scale-110 group-data-[state=active]:animate-pulse" />
                  <span className="hidden lg:inline text-xs">{direction === 'rtl' ? 'النشرة' : 'Newsletter'}</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

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

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
              <CardHeader>
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-emerald-600">إدارة المستخدمين</CardTitle>
                    <CardDescription>
                      عرض وإدارة جميع المستخدمين المشتركين في الموقع
                    </CardDescription>
                  </div>
                  
                  {/* Search Box */}
                  <div className="relative w-80">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="بحث عن مستخدم (الاسم، البريد الإلكتروني، الهاتف)..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pe-10"
                    />
                  </div>
                  
                  {/* Quick Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {users.length}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">إجمالي المستخدمين</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 border border-green-200/50 dark:border-green-700/50">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {users.filter(u => u.subscription_status === 'active' && u.subscription_expires_at && new Date(u.subscription_expires_at) > new Date()).length}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300 font-medium">اشتراك نشط</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-3 border border-yellow-200/50 dark:border-yellow-700/50">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {users.filter(u => !u.email_confirmed_at).length}
                      </div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">بانتظار التفعيل</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 border border-purple-200/50 dark:border-purple-700/50">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {users.filter(u => u.user_status === 'active').length}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">مستخدم نشط</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-3 border border-orange-200/50 dark:border-orange-700/50">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {users.filter(u => {
                          if (u.subscription_status !== 'active' || !u.subscription_package_name) return false;
                          const arName = u.subscription_package_name.ar?.toLowerCase() || '';
                          const enName = u.subscription_package_name.en?.toLowerCase() || '';
                          return arName.includes('اساسية') || arName.includes('الاساسية') || 
                                 enName.includes('basic') || enName.includes('free');
                        }).length}
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">باقات أساسية</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-700/50">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {users.filter(u => {
                          if (u.subscription_status !== 'active' || !u.subscription_package_name) return false;
                          const arName = u.subscription_package_name.ar?.toLowerCase() || '';
                          const enName = u.subscription_package_name.en?.toLowerCase() || '';
                          return arName.includes('متكاملة') || arName.includes('المتكاملة') || 
                                 enName.includes('complete') || enName.includes('premium');
                        }).length}
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">باقات متكاملة</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-3 border border-red-200/50 dark:border-red-700/50">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {users.filter(u => u.subscription_status !== 'active' || !u.subscription_package_name).length}
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300 font-medium">غير مشتركين</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users
                    .filter((user) => {
                      if (!userSearchQuery.trim()) return true;
                      const query = userSearchQuery.toLowerCase();
                      return (
                        user.email?.toLowerCase().includes(query) ||
                        user.first_name?.toLowerCase().includes(query) ||
                        user.last_name?.toLowerCase().includes(query) ||
                        user.phone?.toLowerCase().includes(query) ||
                        user.profile_phone?.toLowerCase().includes(query)
                      );
                    })
                    .map((user) => {
                    const subscription = getUserSubscription(user.id);
                    const getStatusBadge = (status: string) => {
                      switch (status) {
                        case 'active':
                          return <Badge className="bg-green-100 text-green-800 border-green-200">فعال</Badge>;
                        case 'pending':
                          return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">بانتظار التفعيل</Badge>;
                        case 'suspended':
                          return <Badge className="bg-red-100 text-red-800 border-red-200">موقف</Badge>;
                        case 'inactive':
                          return <Badge className="bg-gray-100 text-gray-800 border-gray-200">غير مفعل</Badge>;
                        default:
                          return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">بانتظار التفعيل</Badge>;
                      }
                    };

                    const getSubscriptionDisplay = () => {
                      if (user.subscription_status === 'active' && user.subscription_package_name) {
                        const packageName = typeof user.subscription_package_name === 'object' && user.subscription_package_name?.ar 
                          ? user.subscription_package_name.ar 
                          : 'باقة غير معروفة';
                        const expiryDate = user.subscription_expires_at 
                          ? new Date(user.subscription_expires_at).toLocaleDateString('ar-EG')
                          : 'غير محدد';
                        return (
                          <div>
                            <Badge className="bg-green-100 text-green-800 border-green-200">نشط</Badge>
                            <p className="text-xs text-gray-600 mt-1">{packageName}</p>
                            <p className="text-xs text-gray-500">ينتهي: {expiryDate}</p>
                          </div>
                        );
                      } else {
                        return <Badge className="bg-red-100 text-red-800 border-red-200">لا يوجد اشتراك</Badge>;
                      }
                    };

                    return (
                      <div key={user.id} className="p-4 border border-emerald-200/30 dark:border-emerald-700/30 rounded-lg bg-white/50 dark:bg-gray-800/50">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          <div>
                            <p className="font-medium text-emerald-700">{user.email}</p>
                            <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                          </div>
                          <div>
                            <p className="font-medium">{user.first_name || 'غير محدد'}</p>
                            <p className="text-sm text-gray-500">الاسم</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(user.user_status)}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setStatusDialog({isOpen: true, user});
                                  setNewUserStatus(user.user_status);
                                  setStatusReason(user.status_reason || '');
                                }}
                                disabled={statusUpdating.has(user.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-500">حالة المستخدم</p>
                            {user.status_reason && (
                              <p className="text-xs text-gray-400 mt-1">{user.status_reason}</p>
                            )}
                          </div>
                          <div>
                            {getSubscriptionDisplay()}
                            <p className="text-sm text-gray-500">حالة الاشتراك</p>
                          </div>
                          <div>
                            {user.email_confirmed_at ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">مفعل</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">غير مفعل</Badge>
                            )}
                            <p className="text-sm text-gray-500">تفعيل الإيميل</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setEditingUser(user);
                                setEditingUserStatus(user.user_status);
                                setEditingStatusReason(user.status_reason || '');
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setDeletingUser(user)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                    لا يوجد مستخدمين مسجلين حتى الآن
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
          <TabsContent value="relationships" className="space-y-6 hidden">
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
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">الترجمات الموجودة</h4>
                        <Badge variant="secondary" className="font-mono">
                          {translations.length} من {translationsTotal || translations.length}
                        </Badge>
                      </div>
                      <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ابحث عن مفتاح، قيمة، لغة، أو فئة... (مثال: profile.married_male)"
                          value={translationSearchQuery}
                          onChange={(e) => setTranslationSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div
                      ref={translationsListRef}
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        if (
                          !translationsLoadingMore &&
                          translations.length < translationsTotal &&
                          el.scrollTop + el.clientHeight >= el.scrollHeight - 64
                        ) {
                          loadTranslations({ page: translationsPage + 1, query: currentTranslationsQuery, append: true });
                        }
                      }}
                      className="max-h-96 overflow-y-auto space-y-2"
                    >
                      {translationsLoading && translations.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
                      )}

                      {!translationsLoading && translations.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>لا توجد نتائج لـ "{translationSearchQuery}"</p>
                        </div>
                      )}

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

                      {translationsLoadingMore && (
                        <div className="py-3 text-center text-muted-foreground">جاري تحميل المزيد...</div>
                      )}

                      {!translationsLoadingMore && translations.length < translationsTotal && (
                        <div className="py-3 text-center">
                          <Button variant="outline" size="sm" onClick={() => loadTranslations({ page: translationsPage + 1, query: currentTranslationsQuery, append: true })}>
                            تحميل المزيد
                          </Button>
                        </div>
                      )}
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
                       onClick={() => navigate('/admin/billing')}>
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
                      <button className="w-full text-sm p-2 hover:bg-white rounded transition-colors">
                        → عرض الفواتير المعلقة
                      </button>
                      <button className="w-full text-sm p-2 hover:bg-white rounded transition-colors">
                        → تصدير تقرير مالي
                      </button>
                      <button className="w-full text-sm p-2 hover:bg-white rounded transition-colors">
                        → إدارة الاشتراكات
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Themes Tab */}
          <TabsContent value="themes" className="space-y-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-purple-200/30 dark:border-purple-700/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  إدارة المظاهر
                </CardTitle>
                <CardDescription>اختر مظهر الموقع بين النمط العصري والمهني</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Modern Theme Card */}
                  <div 
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                      currentTheme === 'modern' 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                    }`}
                    onClick={() => setCurrentTheme('modern')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">النمط العصري</h3>
                      {currentTheme === 'modern' && (
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-blue-500 rounded flex-1"></div>
                        <div className="h-8 bg-gray-700 rounded flex-1"></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                      تصميم عصري بألوان داكنة وتدرجات زرقاء جذابة
                    </p>
                  </div>

                  {/* Professional Theme Card */}
                  <div 
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                      currentTheme === 'professional' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                    onClick={() => setCurrentTheme('professional')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">النمط المهني</h3>
                      {currentTheme === 'professional' && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-blue-500 rounded"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-blue-500 rounded flex-1"></div>
                        <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                      تصميم مهني بألوان فاتحة شبيه بالمواقع الاجتماعية المشهورة
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">المظهر المحدد حالياً:</h4>
                    <p className="text-blue-700 dark:text-blue-300">
                      {currentTheme === 'modern' ? 'النمط العصري - تصميم داكن بألوان متدرجة' : 'النمط المهني - تصميم فاتح شبيه بالفيسبوك'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-6">
            <PageEditor />
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="email-templates" className="space-y-6">
            <AdminEmailTemplates />
          </TabsContent>

          {/* Email Logs Tab */}
          <TabsContent value="email-logs" className="space-y-6">
            <AdminEmailLogs />
          </TabsContent>

          {/* Contact Submissions Tab */}
          <TabsContent value="contact" className="space-y-6">
            <ContactSubmissions />
          </TabsContent>

          {/* Payment Gateway Settings Tab */}
          <TabsContent value="payments" className="space-y-6">
            <PaymentGatewaySettings />
          </TabsContent>

          {/* Payment Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AdminPaymentAnalytics />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Maintenance Mode Card */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-red-200/30 dark:border-red-700/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-red-600">
                  <ShieldCheck className="h-5 w-5" />
                  وضع الصيانة
                </CardTitle>
                <CardDescription>
                  تفعيل أو إلغاء وضع الصيانة للموقع. عند التفعيل، لن يتمكن المستخدمون العاديون من الوصول للموقع
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-lg border-2 border-red-200/50">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {maintenanceMode ? 'وضع الصيانة مفعل' : 'وضع الصيانة معطل'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {maintenanceMode 
                        ? 'الموقع حالياً في وضع الصيانة. المديرون فقط يمكنهم الوصول.' 
                        : 'الموقع متاح لجميع المستخدمين.'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={maintenanceMode}
                      onCheckedChange={saveMaintenanceMode}
                      disabled={savingMaintenanceMode}
                      className="data-[state=checked]:bg-red-500"
                    />
                    {savingMaintenanceMode && (
                      <RefreshCw className="h-4 w-4 animate-spin text-red-500" />
                    )}
                  </div>
                </div>
                
                {maintenanceMode && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-semibold mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      تحذير: وضع الصيانة مفعل
                    </div>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      <li>• المستخدمون العاديون لا يمكنهم الوصول للموقع</li>
                      <li>• سيتم عرض صفحة الصيانة لجميع الزوار</li>
                      <li>• المديرون فقط يمكنهم الوصول والتنقل في الموقع</li>
                      <li>• تأكد من إلغاء تفعيل الوضع بعد انتهاء الصيانة</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Analytics Card */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-blue-200/30 dark:border-blue-700/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-blue-600">
                  <Globe className="h-5 w-5" />
                  Google Analytics
                </CardTitle>
                <CardDescription>
                  إدارة معرف Google Analytics للموقع
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ga-id">معرف القياس (Measurement ID)</Label>
                  <Input
                    id="ga-id"
                    placeholder="G-XXXXXXXXXX"
                    value={googleAnalyticsId}
                    onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    أدخل معرف Google Analytics الخاص بك (مثال: G-4MHYZ9D4L4)
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">ملاحظات مهمة:</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• سيتم تحميل Google Analytics تلقائياً عند موافقة المستخدم على ملفات تعريف الارتباط التحليلية</li>
                    <li>• يمكن اختبار التفعيل من Developer Tools → Network → تصفية "gtag"</li>
                    <li>• قد تستغرق البيانات 24-48 ساعة للظهور في لوحة تحكم Google Analytics</li>
                    <li>• يمكنك استخدام Google Tag Assistant لاختبار التثبيت فوراً</li>
                  </ul>
                </div>
                <Button 
                  onClick={saveGoogleAnalyticsId} 
                  disabled={savingAnalyticsId}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  {savingAnalyticsId ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  حفظ المعرف
                </Button>
              </CardContent>
            </Card>

            {/* Custom JavaScript Card */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-emerald-600">
                  <Code className="h-5 w-5" />
                  إدارة كود الجافاسكريبت المخصص
                </CardTitle>
                <CardDescription>
                  إضافة كود جافاسكريبت مخصص مثل Google Analytics، Facebook Pixel، وأدوات التتبع الأخرى
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customJs">كود الجافاسكريبت</Label>
                  <Textarea
                    id="customJs"
                    placeholder="أدخل كود الجافاسكريبت هنا...
مثال:
<!-- Google Analytics -->
<script async src='https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID'></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>"
                    value={customJavaScript}
                    onChange={(e) => setCustomJavaScript(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">تنبيه أمني:</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• تأكد من مصدر الكود قبل إضافته</li>
                    <li>• لا تضع كود من مصادر غير موثوقة</li>
                    <li>• سيتم إدراج الكود في منطقة head لجميع الصفحات</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={saveCustomJavaScript} 
                    disabled={savingJavaScript}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500"
                  >
                    {savingJavaScript ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    حفظ الكود
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setCustomJavaScript('')}
                    disabled={savingJavaScript}
                  >
                    مسح الكود
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-emerald-600">إعدادات SEO</CardTitle>
                <CardDescription>
                  إدارة إعدادات محركات البحث والبيانات المهيكلة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  قم بإدارة إعدادات تحسين محركات البحث (SEO) من خلال الصفحة المخصصة التي تتضمن:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ps-4">
                  <li>إعدادات meta tags للصفحة الرئيسية (عربي/إنجليزي)</li>
                  <li>إدارة robots.txt</li>
                  <li>البيانات المهيكلة (JSON-LD Schemas)</li>
                  <li>إعدادات متقدمة (Canonical URLs، Hreflang Tags)</li>
                </ul>
                <Button 
                  onClick={() => navigate('/admin/seo')} 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 mt-4"
                >
                  <Settings className="h-4 w-4 me-2" />
                  فتح إعدادات SEO
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="newsletter" className="space-y-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-emerald-600">
                  {direction === 'rtl' ? 'اشتراكات النشرة البريدية' : 'Newsletter Subscriptions'}
                </CardTitle>
                <CardDescription>
                  {direction === 'rtl' ? 'إدارة جميع المشتركين في النشرة البريدية' : 'Manage all newsletter subscribers'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {direction === 'rtl' 
                    ? 'قم بإدارة اشتراكات النشرة البريدية من خلال الصفحة المخصصة التي تتضمن:'
                    : 'Manage newsletter subscriptions through the dedicated page which includes:'}
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ps-4">
                  <li>{direction === 'rtl' ? 'عرض جميع المشتركين' : 'View all subscribers'}</li>
                  <li>{direction === 'rtl' ? 'البحث والتصفية' : 'Search and filter'}</li>
                  <li>{direction === 'rtl' ? 'تفعيل/تعطيل الاشتراكات' : 'Activate/deactivate subscriptions'}</li>
                  <li>{direction === 'rtl' ? 'تصدير البيانات إلى CSV' : 'Export data to CSV'}</li>
                </ul>
                <Button 
                  onClick={() => navigate('/admin/newsletter')} 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 mt-4"
                >
                  <Mail className="h-4 w-4 me-2" />
                  {direction === 'rtl' ? 'إدارة الاشتراكات' : 'Manage Subscriptions'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Edit Language Dialog */}
        <Dialog open={editingLanguage !== null} onOpenChange={() => setEditingLanguage(null)}>
          <DialogContent className={`sm:max-w-[425px] ${direction === 'rtl' ? 'font-arabic' : ''}`} dir={direction}>
            <DialogHeader>
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
            <DialogHeader>
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

        {/* Delete User Confirmation Dialog */}
        <Dialog open={deletingUser !== null} onOpenChange={() => setDeletingUser(null)}>
          <DialogContent className={`sm:max-w-[525px] ${direction === 'rtl' ? 'font-arabic' : ''}`} dir={direction}>
            <DialogHeader>
              <DialogTitle className="text-red-600">تأكيد حذف المستخدم</DialogTitle>
              <DialogDescription className="text-red-500">
                تحذير: هذا الإجراء لا يمكن التراجع عنه
              </DialogDescription>
            </DialogHeader>
            {deletingUser && (
              <div className="py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-red-800 mb-2">ستؤدي هذه العملية إلى حذف:</h4>
                  <ul className="text-sm text-red-700 space-y-1 mr-4">
                    <li>• بيانات المستخدم الشخصية</li>
                    <li>• جميع العائلات التي أنشأها</li>
                    <li>• جميع أفراد العائلة في عائلاته</li>
                    <li>• اشتراكاته وفواتيره</li>
                    <li>• إشعاراته وطلباته</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <p className="text-sm text-gray-600">المستخدم المراد حذفه:</p>
                  <p className="font-semibold">{deletingUser.email}</p>
                  <p className="text-sm">{deletingUser.first_name} {deletingUser.last_name}</p>
                </div>
              </div>
            )}
            <DialogFooter className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
              <Button onClick={() => setDeletingUser(null)} variant="outline">
                إلغاء
              </Button>
              <Button onClick={handleDeleteUser} variant="destructive" className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
                <Trash2 className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                نعم، احذف المستخدم
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Comprehensive Edit User Dialog */}
        <Dialog open={editingUser !== null} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className={`sm:max-w-[700px] max-h-[90vh] overflow-y-auto ${direction === 'rtl' ? 'font-arabic' : ''}`} dir={direction}>
            <DialogHeader>
              <DialogTitle>إدارة المستخدم - تحكم شامل</DialogTitle>
              <DialogDescription>تحرير جميع بيانات المستخدم وحالاته واشتراكه</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                  <TabsTrigger value="status">الحالة والصلاحيات</TabsTrigger>
                  <TabsTrigger value="subscription">الاشتراك</TabsTrigger>
                </TabsList>
                
                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-email" className="text-right">البريد الإلكتروني</Label>
                      <Input
                        id="edit-email"
                        value={editingUser.email}
                        disabled
                        className="col-span-3 bg-gray-100"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-first-name" className="text-right">الاسم الأول</Label>
                      <Input
                        id="edit-first-name"
                        value={editingUser.first_name || ''}
                        onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-last-name" className="text-right">الاسم الأخير</Label>
                      <Input
                        id="edit-last-name"
                        value={editingUser.last_name || ''}
                        onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-phone" className="text-right">رقم الهاتف</Label>
                      <Input
                        id="edit-phone"
                        value={editingUser.profile_phone || editingUser.phone || ''}
                        onChange={(e) => setEditingUser({...editingUser, profile_phone: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">تاريخ التسجيل</Label>
                      <div className="col-span-3">
                        <p className="text-sm text-gray-600">
                          {new Date(editingUser.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Status and Permissions Tab */}
                <TabsContent value="status" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">حالة التفعيل</Label>
                      <div className="col-span-3">
                        {editingUser.email_confirmed_at ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            مفعل منذ {new Date(editingUser.email_confirmed_at).toLocaleDateString('ar-EG')}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            غير مفعل - يحتاج تأكيد الإيميل
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-user-status" className="text-right">حالة المستخدم</Label>
                      <div className="col-span-3">
                        <Select 
                          value={editingUser.user_status} 
                          onValueChange={(value: 'active' | 'pending' | 'suspended' | 'inactive') => {
                            setEditingUser({...editingUser, user_status: value});
                            setEditingUserStatus(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">فعال - يمكنه استخدام جميع الميزات</SelectItem>
                            <SelectItem value="pending">بانتظار التفعيل - حساب جديد</SelectItem>
                            <SelectItem value="suspended">موقف من الإدمن - لا يمكنه الدخول</SelectItem>
                            <SelectItem value="inactive">غير مفعل - حساب معطل</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-status-reason" className="text-right">سبب الحالة</Label>
                      <Textarea
                        id="edit-status-reason"
                        placeholder="أدخل سبب تغيير الحالة..."
                        value={editingUser.status_reason || ''}
                        onChange={(e) => {
                          setEditingUser({...editingUser, status_reason: e.target.value});
                          setEditingStatusReason(e.target.value);
                        }}
                        className="col-span-3 min-h-[60px]"
                      />
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">معلومات الحالة:</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• <strong>فعال:</strong> يمكن للمستخدم الدخول واستخدام جميع الميزات</li>
                        <li>• <strong>بانتظار التفعيل:</strong> حساب جديد يحتاج تأكيد الإيميل</li>
                        <li>• <strong>موقف:</strong> تم إيقاف المستخدم من قبل الإدارة</li>
                        <li>• <strong>غير مفعل:</strong> حساب معطل ولا يمكن استخدامه</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                {/* Subscription Tab */}
                <TabsContent value="subscription" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">حالة الاشتراك</Label>
                      <div className="col-span-3">
                        {editingUser.subscription_status === 'active' ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            اشتراك نشط
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            لا يوجد اشتراك
                          </Badge>
                        )}
                      </div>
                    </div>

                    {editingUser.subscription_status === 'active' && (
                      <>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">نوع الباقة</Label>
                          <div className="col-span-3">
                            <p className="font-medium">
                              {typeof editingUser.subscription_package_name === 'object' && editingUser.subscription_package_name?.ar 
                                ? editingUser.subscription_package_name.ar 
                                : 'باقة غير معروفة'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">تاريخ انتهاء الاشتراك</Label>
                          <div className="col-span-3">
                            <p className="text-sm">
                              {editingUser.subscription_expires_at 
                                ? new Date(editingUser.subscription_expires_at).toLocaleDateString('ar-EG', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                  })
                                : 'غير محدد'}
                            </p>
                            {editingUser.subscription_expires_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                {(() => {
                                  const expiryDate = new Date(editingUser.subscription_expires_at);
                                  const today = new Date();
                                  const diffTime = expiryDate.getTime() - today.getTime();
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                  
                                  if (diffDays > 0) {
                                    return `باقي ${diffDays} يوم`;
                                  } else if (diffDays === 0) {
                                    return 'ينتهي اليوم';
                                  } else {
                                    return `انتهى منذ ${Math.abs(diffDays)} يوم`;
                                  }
                                })()}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">إدارة الاشتراك:</h4>
                      <div className="space-y-2">
                        {editingUser.subscription_status === 'active' ? (
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              onClick={() => setExtendSubscriptionModalOpen(true)}
                            >
                              تمديد الاشتراك
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => setChangePackageModalOpen(true)}
                            >
                              تغيير الباقة
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                            إنشاء اشتراك جديد
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
            <DialogFooter className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
              <Button onClick={() => setEditingUser(null)} variant="outline">
                إلغاء
              </Button>
              <Button onClick={handleUpdateUser} className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
                <Save className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                حفظ التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Status Update Dialog */}
        <Dialog open={statusDialog.isOpen} onOpenChange={(open) => setStatusDialog({isOpen: open, user: null})}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>تحديث حالة المستخدم</DialogTitle>
              <DialogDescription>
                تغيير حالة المستخدم: {statusDialog.user?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-status">الحالة الجديدة</Label>
                <Select value={newUserStatus} onValueChange={(value: 'active' | 'pending' | 'suspended' | 'inactive') => setNewUserStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="pending">بانتظار التفعيل</SelectItem>
                    <SelectItem value="suspended">موقف من الإدمن</SelectItem>
                    <SelectItem value="inactive">غير مفعل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-reason">سبب التغيير (اختياري)</Label>
                <Textarea
                  id="status-reason"
                  placeholder="أدخل سبب تغيير الحالة..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
              <Button onClick={() => setStatusDialog({isOpen: false, user: null})} variant="outline">
                إلغاء
              </Button>
              <Button onClick={handleStatusUpdate} className="bg-gradient-to-r from-emerald-500 to-teal-500">
                <Save className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                حفظ التغيير
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

        {/* Change Package Modal */}
        <ChangePackageModal
          isOpen={changePackageModalOpen}
          onClose={() => setChangePackageModalOpen(false)}
          user={editingUser}
          onSuccess={() => {
            loadUsers();
            loadUserSubscriptions();
            setChangePackageModalOpen(false);
          }}
        />

        {/* Extend Subscription Modal */}
        <ExtendSubscriptionModal
          isOpen={extendSubscriptionModalOpen}
          onClose={() => setExtendSubscriptionModalOpen(false)}
          user={editingUser}
          onSuccess={() => {
            loadUsers();
            loadUserSubscriptions();
            setExtendSubscriptionModalOpen(false);
          }}
        />
      </div>
      <GlobalFooter />
    </div>
  );
}
