import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RefreshCw, DollarSign, AlertTriangle, CheckCircle, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { Json } from '@/integrations/supabase/types';

interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string | null;
  amount: number;
  currency: string | null;
  payment_status: string | null;
  payment_gateway: string | null;
  paypal_capture_id: string | null;
  created_at: string;
  packages?: {
    name: Json;
  } | null;
  user_email?: string;
  user_name?: string;
}

export default function AdminRefundsContent() {
  const { currentLanguage, direction } = useLanguage();
  const language = currentLanguage;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  const isRTL = direction === 'rtl';
  const dateLocale = language === 'ar' ? ar : enUS;

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          packages (name)
        `)
        .eq('payment_status', 'paid')
        .not('paypal_capture_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((invoicesData || []).map(inv => inv.user_id).filter(Boolean))];
      
      let profilesMap: Record<string, { email: string; first_name: string | null; last_name: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, first_name, last_name')
          .in('user_id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = p;
            return acc;
          }, {} as typeof profilesMap);
        }
      }

      const mappedInvoices: Invoice[] = (invoicesData || []).map(inv => ({
        ...inv,
        user_email: profilesMap[inv.user_id]?.email || '',
        user_name: `${profilesMap[inv.user_id]?.first_name || ''} ${profilesMap[inv.user_id]?.last_name || ''}`.trim(),
      }));

      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error(isRTL ? 'فشل في تحميل الفواتير' : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedInvoice) return;

    setIsRefunding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('admin-refund-payment', {
        body: {
          invoiceId: selectedInvoice.id,
          reason: refundReason || undefined,
          amount: refundAmount || undefined
        }
      });

      if (response.error) throw response.error;

      toast.success(
        isRTL 
          ? `تم استرداد ${response.data.amount} ${selectedInvoice.currency || 'USD'} بنجاح`
          : `Successfully refunded ${response.data.amount} ${selectedInvoice.currency || 'USD'}`
      );

      setShowRefundDialog(false);
      setSelectedInvoice(null);
      setRefundReason('');
      setRefundAmount(null);
      loadInvoices();
    } catch (error: any) {
      console.error('Refund error:', error);
      toast.error(
        isRTL 
          ? `فشل الاسترداد: ${error.message || 'خطأ غير معروف'}`
          : `Refund failed: ${error.message || 'Unknown error'}`
      );
    } finally {
      setIsRefunding(false);
    }
  };

  const openRefundDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setRefundAmount(invoice.amount);
    setRefundReason('');
    setShowRefundDialog(true);
  };

  const getPackageName = (pkg: any): string => {
    if (!pkg?.name) return '-';
    if (typeof pkg.name === 'string') return pkg.name;
    return pkg.name[language] || pkg.name.ar || pkg.name.en || '-';
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 me-1" />{isRTL ? 'مدفوع' : 'Paid'}</Badge>;
      case 'refunded':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 me-1" />{isRTL ? 'مسترد' : 'Refunded'}</Badge>;
      case 'partially_refunded':
        return <Badge className="bg-orange-500"><AlertTriangle className="w-3 h-3 me-1" />{isRTL ? 'مسترد جزئياً' : 'Partial Refund'}</Badge>;
      default:
        return <Badge variant="secondary">{status || '-'}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const searchLower = searchTerm.toLowerCase();
    const email = inv.user_email?.toLowerCase() || '';
    const name = inv.user_name?.toLowerCase() || '';
    const invoiceNum = inv.invoice_number?.toLowerCase() || '';
    return email.includes(searchLower) || name.includes(searchLower) || invoiceNum.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isRTL ? 'إدارة الاستردادات' : 'Refund Management'}
          </h2>
          <p className="text-muted-foreground">
            {isRTL ? 'استرداد المدفوعات عبر PayPal' : 'Manage PayPal payment refunds'}
          </p>
        </div>
        <Button onClick={loadInvoices} variant="outline">
          <RefreshCw className="w-4 h-4 me-2" />
          {isRTL ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isRTL ? 'الفواتير المؤهلة للاسترداد' : 'Refundable Invoices'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isRTL ? 'إجمالي المبالغ' : 'Total Amount'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isRTL ? 'بوابة الدفع' : 'Payment Gateway'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">PayPal</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'البحث عن فاتورة' : 'Search Invoices'}</CardTitle>
          <CardDescription>
            {isRTL ? 'ابحث بالبريد الإلكتروني أو الاسم أو رقم الفاتورة' : 'Search by email, name, or invoice number'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute start-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isRTL ? 'بحث...' : 'Search...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'الفواتير المدفوعة' : 'Paid Invoices'}</CardTitle>
          <CardDescription>
            {isRTL ? 'اختر فاتورة لإجراء استرداد' : 'Select an invoice to process a refund'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? 'رقم الفاتورة' : 'Invoice #'}</TableHead>
                <TableHead>{isRTL ? 'المستخدم' : 'User'}</TableHead>
                <TableHead>{isRTL ? 'الباقة' : 'Package'}</TableHead>
                <TableHead>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                <TableHead>{isRTL ? 'إجراء' : 'Action'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isRTL ? 'لا توجد فواتير مؤهلة للاسترداد' : 'No refundable invoices found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">
                      {invoice.invoice_number || invoice.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.user_name || '-'}</div>
                        <div className="text-sm text-muted-foreground">{invoice.user_email || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPackageName(invoice.packages)}</TableCell>
                    <TableCell className="font-medium">
                      {invoice.amount} {invoice.currency || 'USD'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: dateLocale })}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openRefundDialog(invoice)}
                      >
                        <DollarSign className="w-4 h-4 me-1" />
                        {isRTL ? 'استرداد' : 'Refund'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {isRTL ? 'تأكيد الاسترداد' : 'Confirm Refund'}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? 'هذا الإجراء سيسترد المبلغ المحدد إلى حساب العميل على PayPal'
                : 'This action will refund the specified amount to the customer\'s PayPal account'}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRTL ? 'الفاتورة:' : 'Invoice:'}</span>
                  <span className="font-mono">{selectedInvoice.invoice_number || selectedInvoice.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRTL ? 'المستخدم:' : 'User:'}</span>
                  <span>{selectedInvoice.user_email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRTL ? 'المبلغ الأصلي:' : 'Original Amount:'}</span>
                  <span className="font-bold">{selectedInvoice.amount} {selectedInvoice.currency || 'USD'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'مبلغ الاسترداد' : 'Refund Amount'}</Label>
                <Input
                  type="number"
                  value={refundAmount ?? ''}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || null)}
                  max={selectedInvoice.amount}
                  min={0.01}
                  step={0.01}
                />
                <p className="text-xs text-muted-foreground">
                  {isRTL 
                    ? 'اترك المبلغ الأصلي لاسترداد كامل، أو أدخل مبلغ أقل لاسترداد جزئي'
                    : 'Leave original amount for full refund, or enter less for partial refund'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'سبب الاسترداد (اختياري)' : 'Refund Reason (Optional)'}</Label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder={isRTL ? 'أدخل سبب الاسترداد...' : 'Enter reason for refund...'}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRefund}
              disabled={isRefunding || !refundAmount || refundAmount <= 0}
            >
              {isRefunding ? (
                <RefreshCw className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4 me-2" />
              )}
              {isRTL ? 'تأكيد الاسترداد' : 'Confirm Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
