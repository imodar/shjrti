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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950">
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950">
      <GlobalHeader />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  إدارة الفوترة والمدفوعات
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  إدارة شاملة للاشتراكات والفواتير والمدفوعات
                </p>
              </div>
            </div>
            
            <Button onClick={refreshData} disabled={refreshing} className="bg-gradient-to-r from-emerald-500 to-teal-500">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.totalRevenue.toLocaleString()} ريال</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-blue-200/30 dark:border-blue-700/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">إيرادات هذا الشهر</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.monthlyRevenue.toLocaleString()} ريال</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-purple-200/30 dark:border-purple-700/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">الاشتراكات النشطة</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.activeSubscriptions}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-orange-200/30 dark:border-orange-700/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">فواتير معلقة</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingInvoices}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              الفواتير
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              الاشتراكات
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    إدارة الفواتير
                  </CardTitle>
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500">
                    <Plus className="h-4 w-4 mr-2" />
                    فاتورة جديدة
                  </Button>
                </div>
                
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث في الفواتير..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="pending">في انتظار الدفع</SelectItem>
                      <SelectItem value="paid">مدفوع</SelectItem>
                      <SelectItem value="failed">فشل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="التاريخ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع التواريخ</SelectItem>
                      <SelectItem value="today">اليوم</SelectItem>
                      <SelectItem value="week">هذا الأسبوع</SelectItem>
                      <SelectItem value="month">هذا الشهر</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    تصدير
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>الباقة</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ الإنشاء</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {invoice.profiles?.first_name} {invoice.profiles?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{invoice.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getLocalizedPackageName(invoice.packages?.name)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {invoice.amount.toLocaleString()} {invoice.currency}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.payment_status)}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.created_at).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowInvoiceModal(true);
                              }}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              {invoice.payment_status === 'pending' && (
                                <Button
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => handleUpdateInvoiceStatus(invoice.id, 'paid')}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-purple-200/30 dark:border-purple-700/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  إدارة الاشتراكات
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>الباقة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ البداية</TableHead>
                        <TableHead>تاريخ الانتهاء</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {subscription.profiles?.first_name} {subscription.profiles?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{subscription.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getLocalizedPackageName(subscription.packages?.name)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(subscription.status)}
                          </TableCell>
                          <TableCell>
                            {new Date(subscription.started_at).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            {subscription.expires_at 
                              ? new Date(subscription.expires_at).toLocaleDateString('ar-SA')
                              : 'غير محدد'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-blue-200/30 dark:border-blue-700/30">
                <CardHeader>
                  <CardTitle>إحصائيات الإيرادات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg">
                      <span>إجمالي الإيرادات</span>
                      <span className="font-bold text-emerald-600">{stats.totalRevenue.toLocaleString()} ريال</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg">
                      <span>إيرادات هذا الشهر</span>
                      <span className="font-bold text-blue-600">{stats.monthlyRevenue.toLocaleString()} ريال</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
                      <span>متوسط قيمة الفاتورة</span>
                      <span className="font-bold text-purple-600">
                        {stats.totalInvoices > 0 ? (stats.totalRevenue / stats.totalInvoices).toLocaleString() : 0} ريال
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-orange-200/30 dark:border-orange-700/30">
                <CardHeader>
                  <CardTitle>إحصائيات المستخدمين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg">
                      <span>إجمالي المستخدمين</span>
                      <span className="font-bold text-green-600">{stats.totalUsers}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg">
                      <span>الاشتراكات النشطة</span>
                      <span className="font-bold text-purple-600">{stats.activeSubscriptions}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg">
                      <span>معدل التحويل</span>
                      <span className="font-bold text-orange-600">
                        {stats.totalUsers > 0 ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>تفاصيل الفاتورة {selectedInvoice.invoice_number}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">رقم الفاتورة</Label>
                    <p className="font-mono">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">الحالة</Label>
                    <div className="mt-1">{getStatusBadge(selectedInvoice.payment_status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">المبلغ</Label>
                    <p className="font-semibold">{selectedInvoice.amount.toLocaleString()} {selectedInvoice.currency}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">تاريخ الإنشاء</Label>
                    <p>{new Date(selectedInvoice.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">بيانات العميل</Label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="font-medium">
                      {selectedInvoice.profiles?.first_name} {selectedInvoice.profiles?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{selectedInvoice.profiles?.email}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">الباقة</Label>
                  <p className="mt-1">{getLocalizedPackageName(selectedInvoice.packages?.name)}</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>
                  إغلاق
                </Button>
                <Button 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500"
                  onClick={() => {
                    // Handle print/download invoice
                    toast({
                      title: "قريباً",
                      description: "ميزة طباعة الفاتورة ستكون متاحة قريباً",
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  تحميل الفاتورة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <GlobalFooter />
    </div>
  );
}