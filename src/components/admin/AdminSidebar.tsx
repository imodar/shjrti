import { useMemo, useState } from "react";
import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Package,
  CircleUserRound,
  CreditCard,
  TrendingUp,
  MessageSquare,
  Languages,
  Palette,
  FileText,
  MailOpen,
  Mail,
  Scale,
  Search,
  BarChart3,
  DollarSign,
  Share2,
  Key,
  ShoppingBag,
  Settings,
  LayoutDashboard,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";

type Item = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  /** For tab inside /admin */
  tab?: string;
  /** Or direct route */
  to?: string;
};

type Group = {
  label: string;
  items: Item[];
};

const GROUPS: Group[] = [
  {
    label: "الرئيسية",
    items: [
      { title: "نظرة عامة", icon: LayoutDashboard, to: "/admin" },
    ],
  },
  {
    label: "المحتوى",
    items: [
      { title: "الباقات", icon: Package, tab: "packages" },
      { title: "الصفحات", icon: FileText, tab: "pages" },
      { title: "المظاهر", icon: Palette, tab: "themes" },
      { title: "الترجمات", icon: MessageSquare, tab: "translations" },
      { title: "اللغات", icon: Languages, tab: "languages" },
    ],
  },
  {
    label: "المستخدمون",
    items: [
      { title: "المستخدمين", icon: CircleUserRound, tab: "users" },
      { title: "إحصائيات المستخدمين", icon: BarChart3, to: "/admin/user-statistics" },
    ],
  },
  {
    label: "التسويق والتواصل",
    items: [
      { title: "قوالب الإيميل", icon: MailOpen, to: "/admin/email-templates" },
      { title: "سجل الإيميلات", icon: Mail, to: "/admin/email-logs" },
      { title: "الرسائل", icon: Mail, tab: "contact" },
      { title: "النشرة البريدية", icon: Mail, to: "/admin/newsletter" },
      { title: "السوشيال ميديا", icon: Share2, to: "/admin/social-media" },
      { title: "SEO", icon: Search, to: "/admin/seo" },
    ],
  },
  {
    label: "المالية",
    items: [
      { title: "المدفوعات", icon: CreditCard, tab: "payments" },
      { title: "تحليلات المدفوعات", icon: TrendingUp, to: "/admin/analytics" },
      { title: "الفواتير", icon: DollarSign, to: "/admin/billing" },
      { title: "الاستردادات", icon: DollarSign, to: "/admin/refunds" },
      { title: "طلبات المتجر", icon: ShoppingBag, to: "/admin/store-orders" },
    ],
  },
  {
    label: "النظام",
    items: [
      { title: "الإعدادات العامة", icon: Scale, tab: "settings" },
      { title: "إعدادات API", icon: Key, to: "/admin-api-settings" },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { direction } = useLanguage();
  const currentTab = searchParams.get("tab") || "packages";
  const [query, setQuery] = useState("");

  const isItemActive = (item: Item) => {
    if (item.to) {
      if (item.to === "/admin") return pathname === "/admin" && !searchParams.has("tab");
      return pathname === item.to;
    }
    if (item.tab) return pathname === "/admin" && currentTab === item.tab;
    return false;
  };

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => it.title.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <Sidebar side={direction === "rtl" ? "right" : "left"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Settings className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm text-sidebar-foreground">لوحة الإدارة</span>
          )}
        </div>
        {!collapsed && (
          <div className="px-2 pb-2">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 ltr:left-2 rtl:right-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث..."
                className="h-8 ltr:pl-7 rtl:pr-7 text-xs bg-sidebar-accent/40 border-sidebar-border"
              />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {filteredGroups.length === 0 && !collapsed && (
          <div className="px-4 py-6 text-xs text-muted-foreground text-center">
            لا توجد نتائج
          </div>
        )}
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isItemActive(item);
                  const to = item.to ?? `/admin?tab=${item.tab}`;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <NavLink to={to} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}