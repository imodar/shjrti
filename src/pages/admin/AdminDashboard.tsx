import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Trees,
  CreditCard,
  DollarSign,
  MessageSquare,
  Mail,
  TrendingUp,
  Activity,
} from "lucide-react";

interface Stats {
  usersCount: number;
  familiesCount: number;
  membersCount: number;
  activeSubscriptions: number;
  revenueUsd: number;
  paidInvoices: number;
  pendingContacts: number;
  newsletterSubs: number;
  newUsers30d: number;
}

interface ActivityRow {
  id: string;
  action_type: string | null;
  target_name: string | null;
  created_at: string;
}

const initialStats: Stats = {
  usersCount: 0,
  familiesCount: 0,
  membersCount: 0,
  activeSubscriptions: 0,
  revenueUsd: 0,
  paidInvoices: 0,
  pendingContacts: 0,
  newsletterSubs: 0,
  newUsers30d: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<ActivityRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      try {
        const [
          users,
          families,
          members,
          subs,
          paidInvoices,
          contacts,
          newsletter,
          newUsers,
          activity,
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("families").select("*", { count: "exact", head: true }),
          supabase.from("family_tree_members").select("*", { count: "exact", head: true }),
          supabase.from("user_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("invoices").select("amount, currency, payment_status").eq("payment_status", "paid"),
          supabase.from("contact_submissions").select("*", { count: "exact", head: true }).eq("status", "new"),
          supabase.from("newsletter_subscriptions").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since30),
          supabase.from("activity_log").select("id, action_type, target_name, created_at").order("created_at", { ascending: false }).limit(8),
        ]);

        const revenue = (paidInvoices.data || []).reduce((sum, inv: any) => sum + (Number(inv.amount) || 0), 0);

        if (cancelled) return;
        setStats({
          usersCount: users.count || 0,
          familiesCount: families.count || 0,
          membersCount: members.count || 0,
          activeSubscriptions: subs.count || 0,
          revenueUsd: revenue,
          paidInvoices: (paidInvoices.data || []).length,
          pendingContacts: contacts.count || 0,
          newsletterSubs: newsletter.count || 0,
          newUsers30d: newUsers.count || 0,
        });
        setRecent((activity.data as ActivityRow[]) || []);
      } catch (e) {
        console.error("Dashboard stats error", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { title: "المستخدمون", value: stats.usersCount, icon: Users, hint: `+${stats.newUsers30d} خلال 30 يوم`, to: "/admin/user-statistics" },
    { title: "العائلات", value: stats.familiesCount, icon: Trees, hint: `${stats.membersCount} فرد عائلة`, to: "/admin?tab=users" },
    { title: "الاشتراكات النشطة", value: stats.activeSubscriptions, icon: CreditCard, hint: "اشتراكات سارية", to: "/admin?tab=payments" },
    { title: "إجمالي الإيرادات", value: `$${stats.revenueUsd.toFixed(2)}`, icon: DollarSign, hint: `${stats.paidInvoices} فاتورة مدفوعة`, to: "/admin/billing" },
    { title: "رسائل التواصل", value: stats.pendingContacts, icon: MessageSquare, hint: "بانتظار الرد", to: "/admin?tab=contact" },
    { title: "النشرة البريدية", value: stats.newsletterSubs, icon: Mail, hint: "مشترك", to: "/admin/newsletter" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">نظرة عامة</h1>
          <p className="text-sm text-muted-foreground">ملخص أداء المنصة في لمحة واحدة</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/analytics">
              <TrendingUp className="h-4 w-4 ms-1" />
              تحليلات المدفوعات
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin?tab=packages">إدارة الباقات</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Link key={c.title} to={c.to} className="block">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? <span className="inline-block w-12 h-6 bg-muted animate-pulse rounded" /> : c.value}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{c.hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              آخر النشاطات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا يوجد نشاط حديث</p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((r) => (
                  <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.action_type || "إجراء"}</div>
                      {r.target_name && (
                        <div className="text-xs text-muted-foreground truncate">{r.target_name}</div>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {new Date(r.created_at).toLocaleDateString("ar")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">روابط سريعة</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/admin?tab=users">المستخدمون</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/admin?tab=packages">الباقات</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/admin/billing">الفواتير</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/admin/refunds">الاستردادات</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/admin/email-templates">قوالب الإيميل</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start">
              <Link to="/admin/seo">SEO</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}