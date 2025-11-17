import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Receipt, 
  Calendar, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Plus,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { DirectionWrapper } from "@/components/DirectionWrapper";

interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  package_id: string;
  amount: number;
  currency: string;
  payment_status: string;
  status: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  stripe_payment_intent_id?: string;
  profiles?: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  packages?: {
    name: any;
  };
}

interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  status: string;
  started_at: string;
  expires_at: string;
  created_at: string;
  profiles?: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  packages?: {
    name: any;
    price_usd: number;
    price_sar: number;
  };
}

interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  pendingInvoices: number;
  totalInvoices: number;
  totalUsers: number;
}

export default function AdminBilling() {
  const { toast } = useToast();
  const { direction } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    pendingInvoices: 0,
    totalInvoices: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load all billing data
  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load invoices with user and package info
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          packages (name)
        `)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Load user profiles separately
      const userIds = [...new Set(invoicesData?.map(inv => inv.user_id).filter(Boolean) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      // Merge profile data with invoices
      const invoicesWithProfiles = (invoicesData || []).map(invoice => ({
        ...invoice,
        profiles: profilesData?.find(p => p.user_id === invoice.user_id) || null
      }));

      // Load subscriptions with user and package info
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          packages (name, price_usd, price_sar)
        `)
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      // Merge profile data with subscriptions
      const subscriptionsWithProfiles = (subscriptionsData || []).map(subscription => ({
        ...subscription,
        profiles: profilesData?.find(p => p.user_id === subscription.user_id) || null
      }));

      setInvoices(invoicesWithProfiles as Invoice[]);
      setSubscriptions(subscriptionsWithProfiles as Subscription[]);

      // Calculate stats
      calculateStats(invoicesWithProfiles, subscriptionsWithProfiles);

    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الفوترة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoicesData: Invoice[], subscriptionsData: Subscription[]) => {
    const totalRevenue = invoicesData
      .filter(inv => inv.payment_status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyRevenue = invoicesData
      .filter(inv => {
        const invDate = new Date(inv.created_at);
        return inv.payment_status === 'paid' && 
               invDate.getMonth() === currentMonth && 
               invDate.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    const activeSubscriptions = subscriptionsData.filter(sub => sub.status === 'active').length;
    const pendingInvoices = invoicesData.filter(inv => inv.payment_status === 'pending').length;

    setStats({
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions,
      pendingInvoices,
      totalInvoices: invoicesData.length,
      totalUsers: new Set(subscriptionsData.map(sub => sub.user_id)).size
    });
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadBillingData();
    setRefreshing(false);
    toast({
      title: "تم التحديث",
      description: "تم تحديث البيانات بنجاح",
    });
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />مدفوع</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />في انتظار الدفع</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />فشل</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500 text-white"><XCircle className="h-3 w-3 mr-1" />ملغي</Badge>;
      case 'active':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />نشط</Badge>;
      case 'expired':
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />منتهي الصلاحية</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const getLocalizedPackageName = (packageName: any) => {
    if (typeof packageName === 'string') {
      try {
        const parsed = JSON.parse(packageName);
        return parsed.ar || parsed.en || packageName;
      } catch {
        return packageName;
      }
    }
    if (typeof packageName === 'object' && packageName !== null) {
      return packageName.ar || packageName.en || 'باقة غير محددة';
    }
    return 'باقة غير محددة';
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          payment_status: newStatus,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الفاتورة بنجاح",
      });

      loadBillingData();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الفاتورة",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الفاتورة بنجاح",
      });

      loadBillingData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الفاتورة",
        variant: "destructive",
      });
    }
  };

  const handleEditSubscription = async (subscription: Subscription) => {
    // For now, show a toast that this feature is coming soon
    toast({
      title: "قريباً",
      description: "ميزة تعديل الاشتراكات ستكون متاحة قريباً",
    });
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الاشتراك بنجاح",
      });

      loadBillingData();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الاشتراك",
        variant: "destructive",
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.profiles?.first_name + ' ' + invoice.profiles?.last_name)?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.payment_status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const invoiceDate = new Date(invoice.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = invoiceDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = invoiceDate >= weekAgo;
          break;
        case 'month':
          matchesDate = invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear();
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subscription.profiles?.first_name + ' ' + subscription.profiles?.last_name)?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <DirectionWrapper>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir={direction}>
          <GlobalHeader />
          <div className="container mx-auto px-6 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
        <GlobalFooter />
      </div>
      </DirectionWrapper>
    );
  }

// Create Invoice Form Component
function CreateInvoiceForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [usersRes, packagesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, email, first_name, last_name'),
        supabase.from('packages').select('id, name, price_sar, price_usd').eq('is_active', true)
      ]);
      
      setUsers(usersRes.data || []);
      setPackages(packagesRes.data || []);
    };
    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedUser || !selectedPackage || !amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_invoice', {
        p_user_id: selectedUser,
        p_package_id: selectedPackage,
        p_amount: parseFloat(amount),
        p_currency: currency
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الفاتورة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedPackageName = (packageName: any) => {
    if (typeof packageName === 'object' && packageName !== null) {
      return packageName.ar || packageName.en || 'باقة غير محددة';
    }
    return packageName || 'باقة غير محددة';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>المستخدم</Label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المستخدم" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.first_name} {user.last_name} - {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>الباقة</Label>
          <Select value={selectedPackage} onValueChange={(value) => {
            setSelectedPackage(value);
            const pkg = packages.find(p => p.id === value);
            if (pkg) {
              setAmount(currency === 'SAR' ? pkg.price_sar : pkg.price_usd);
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الباقة" />
            </SelectTrigger>
            <SelectContent>
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {getLocalizedPackageName(pkg.name)} - {currency === 'SAR' ? pkg.price_sar : pkg.price_usd} {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>المبلغ</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="المبلغ"
            />
          </div>
          <div>
            <Label>العملة</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAR">ريال سعودي</SelectItem>
                <SelectItem value="USD">دولار أمريكي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-teal-500">
          {loading ? "جاري الإنشاء..." : "إنشاء الفاتورة"}
        </Button>
      </DialogFooter>
    </div>
  );
}