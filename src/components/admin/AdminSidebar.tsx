import { NavLink, useLocation, useSearchParams } from "react-router-dom";
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
      { title: "إحصائيات المستخدمين", icon: BarChart3, tab: "user-statistics" },
    ],
  },
  {
    label: "التسويق والتواصل",
    items: [
      { title: "قوالب الإيميل", icon: MailOpen, tab: "email-templates" },
      { title: "سجل الإيميلات", icon: Mail, tab: "email-logs" },
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
      { title: "تحليلات المدفوعات", icon: TrendingUp, tab: "analytics" },
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
  const currentTab = searchParams.get("tab") || "packages";

  const isItemActive = (item: Item) => {
    if (item.to) return pathname === item.to;
    if (item.tab) return pathname === "/admin" && currentTab === item.tab;
    return false;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
            <Settings className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm">لوحة الإدارة</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((group) => (
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