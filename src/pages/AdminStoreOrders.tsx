import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, RefreshCw, Search, Eye, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface StoreOrder {
  id: string;
  user_id: string | null;
  status: string | null;
  total_amount?: number | null;
  amount?: number | null;
  currency?: string | null;
  payment_gateway?: string | null;
  created_at: string;
  [key: string]: any;
}

const STATUSES = ['all', 'pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function AdminStoreOrders() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<StoreOrder | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate('/dashboard');
    if (isAdmin) loadOrders();
  }, [isAdmin, adminLoading]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) {
      console.error(e);
      toast.error(isRTL ? 'فشل تحميل الطلبات' : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('store_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
        .eq('id', selected.id);
      if (error) throw error;
      toast.success(isRTL ? 'تم تحديث الحالة' : 'Status updated');
      setSelected({ ...selected, status: newStatus });
      loadOrders();
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(s) ||
      (o.user_id || '').toLowerCase().includes(s) ||
      JSON.stringify(o).toLowerCase().includes(s)
    );
  });

  const statusBadge = (status: string | null) => {
    const map: Record<string, string> = {
      paid: 'bg-green-500',
      pending: 'bg-yellow-500',
      processing: 'bg-blue-500',
      shipped: 'bg-indigo-500',
      delivered: 'bg-emerald-600',
      cancelled: 'bg-gray-500',
      refunded: 'bg-red-500',
    };
    return <Badge className={map[status || ''] || 'bg-gray-400'}>{status || '-'}</Badge>;
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" dir={direction}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6" />
                {isRTL ? 'طلبات المتجر' : 'Store Orders'}
              </h1>
              <p className="text-muted-foreground">
                {isRTL ? 'إدارة جميع طلبات المتجر' : 'Manage all store orders'}
              </p>
            </div>
          </div>
          <Button onClick={loadOrders} variant="outline">
            <RefreshCw className="w-4 h-4 me-2" />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? 'الفلترة' : 'Filter'}</CardTitle>
            <CardDescription>{filtered.length} / {orders.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute start-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={isRTL ? 'بحث...' : 'Search...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s === 'all' ? (isRTL ? 'الكل' : 'All') : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? 'رقم الطلب' : 'Order #'}</TableHead>
                  <TableHead>{isRTL ? 'المستخدم' : 'User'}</TableHead>
                  <TableHead>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                  <TableHead>{isRTL ? 'البوابة' : 'Gateway'}</TableHead>
                  <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{isRTL ? 'إجراء' : 'Action'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {isRTL ? 'لا توجد طلبات' : 'No orders'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-mono text-xs">{(o.user_id || '-').slice(0, 8)}</TableCell>
                      <TableCell>
                        {(o.total_amount ?? o.amount ?? 0)} {o.currency || ''}
                      </TableCell>
                      <TableCell>{o.payment_gateway || '-'}</TableCell>
                      <TableCell>{statusBadge(o.status)}</TableCell>
                      <TableCell>{format(new Date(o.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setSelected(o)}>
                          <Eye className="w-4 h-4 me-1" />
                          {isRTL ? 'تفاصيل' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تفاصيل الطلب' : 'Order Details'}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs">{JSON.stringify(selected, null, 2)}</pre>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold">{isRTL ? 'تغيير الحالة:' : 'Change status:'}</label>
                <Select value={selected.status || ''} onValueChange={updateStatus} disabled={updating}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.filter(s => s !== 'all').map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {isRTL ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}