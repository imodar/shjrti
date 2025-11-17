import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, TrendingUp, DollarSign, Users, AlertCircle, Package, Target, ArrowUp, ArrowDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DirectionWrapper } from "@/components/DirectionWrapper";

interface AnalyticsData {
  total_package_views: number;
  total_upgrade_clicks: number;
  total_package_selections: number;
  total_payment_initiations: number;
  total_payment_successes: number;
  total_payment_failures: number;
  conversion_rate_click_to_initiate: number;
  conversion_rate_initiate_to_success: number;
  conversion_rate_overall: number;
  total_revenue: number;
  avg_transaction_value: number;
  top_package_id: string | null;
  top_package_name: any;
  top_failure_reason: string | null;
}

export default function AdminPaymentAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // days
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase.rpc('get_payment_funnel_analytics', {
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setAnalytics(data[0]);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات التحليلية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">لا توجد بيانات متاحة</p>
        </CardContent>
      </Card>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            {trend === 'up' && <ArrowUp className="h-3 w-3 text-green-500 mr-1" />}
            {trend === 'down' && <ArrowDown className="h-3 w-3 text-red-500 mr-1" />}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DirectionWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">تحليلات المدفوعات</h2>
          <p className="text-muted-foreground">تتبع مسار التحويل من الترقية إلى الدفع</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(7)}
          >
            7 أيام
          </Button>
          <Button
            variant={dateRange === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(30)}
          >
            30 يوم
          </Button>
          <Button
            variant={dateRange === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(90)}
          >
            90 يوم
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الإيرادات"
          value={`${analytics.total_revenue.toFixed(2)} ر.س`}
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="متوسط قيمة المعاملة"
          value={`${analytics.avg_transaction_value.toFixed(2)} ر.س`}
          icon={TrendingUp}
        />
        <StatCard
          title="المدفوعات الناجحة"
          value={analytics.total_payment_successes}
          icon={Users}
          description={`من ${analytics.total_payment_initiations} محاولة`}
        />
        <StatCard
          title="المدفوعات الفاشلة"
          value={analytics.total_payment_failures}
          icon={AlertCircle}
          trend="down"
        />
      </div>

      {/* Funnel Stats */}
      <Card>
        <CardHeader>
          <CardTitle>مسار التحويل</CardTitle>
          <CardDescription>تتبع رحلة المستخدم من النقر إلى الدفع</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div>
                <p className="font-semibold">عرض الباقات</p>
                <p className="text-sm text-muted-foreground">{analytics.total_package_views} مشاهدة</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div>
                <p className="font-semibold">نقرات الترقية</p>
                <p className="text-sm text-muted-foreground">{analytics.total_upgrade_clicks} نقرة</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <div>
                <p className="font-semibold">اختيار الباقة</p>
                <p className="text-sm text-muted-foreground">{analytics.total_package_selections} اختيار</p>
              </div>
              <Package className="h-8 w-8 text-amber-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg">
              <div>
                <p className="font-semibold">بدء الدفع</p>
                <p className="text-sm text-muted-foreground">{analytics.total_payment_initiations} محاولة</p>
              </div>
              <DollarSign className="h-8 w-8 text-cyan-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div>
                <p className="font-semibold">دفع ناجح</p>
                <p className="text-sm text-muted-foreground">{analytics.total_payment_successes} عملية</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rates */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">معدل التحويل: نقرة → دفع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.conversion_rate_click_to_initiate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              من النقرات التي تحولت إلى محاولات دفع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">معدل النجاح: دفع → نجاح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {analytics.conversion_rate_initiate_to_success.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              من محاولات الدفع التي نجحت
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">معدل التحويل الإجمالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {analytics.conversion_rate_overall.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              من النقرات إلى الدفع الناجح
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Package & Failure Reasons */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الباقة الأكثر مبيعاً</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.top_package_name ? (
              <div className="text-xl font-semibold">
                {analytics.top_package_name[currentLanguage] || analytics.top_package_name['ar'] || 'غير محدد'}
              </div>
            ) : (
              <p className="text-muted-foreground">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أكثر سبب للفشل</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.top_failure_reason ? (
              <div className="text-xl font-semibold text-red-600">
                {analytics.top_failure_reason}
              </div>
            ) : (
              <p className="text-muted-foreground">لا توجد أخطاء مسجلة</p>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </DirectionWrapper>
  );
}
