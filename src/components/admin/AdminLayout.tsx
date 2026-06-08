import { useEffect, useState } from "react";
import { Outlet, useLocation, useSearchParams, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ROUTE_TITLES: Record<string, string> = {
  "/admin": "نظرة عامة",
  "/admin/billing": "الفواتير",
  "/admin/refunds": "الاستردادات",
  "/admin/seo": "إعدادات SEO",
  "/admin/newsletter": "النشرة البريدية",
  "/admin/social-media": "السوشيال ميديا",
  "/admin/store-orders": "طلبات المتجر",
  "/admin-api-settings": "إعدادات API",
};

const TAB_TITLES: Record<string, string> = {
  packages: "الباقات",
  users: "المستخدمين",
  payments: "المدفوعات",
  analytics: "تحليلات المدفوعات",
  translations: "الترجمات",
  languages: "اللغات",
  themes: "المظاهر",
  pages: "الصفحات",
  "email-templates": "قوالب الإيميل",
  "email-logs": "سجل الإيميلات",
  contact: "الرسائل",
  settings: "الإعدادات العامة",
  seo: "SEO",
  newsletter: "النشرة البريدية",
  "user-statistics": "إحصائيات المستخدمين",
  refunds: "الاستردادات",
  "social-media": "السوشيال ميديا",
  "api-settings": "إعدادات API",
  "store-orders": "طلبات المتجر",
};

const SIDEBAR_STORAGE_KEY = "admin:sidebar:open";

export default function AdminLayout() {
  const { direction } = useLanguage();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
    } catch {}
  }, [sidebarOpen]);

  const pageTitle =
    pathname === "/admin" && tab
      ? TAB_TITLES[tab] ?? "لوحة الإدارة"
      : ROUTE_TITLES[pathname] ?? "لوحة الإدارة";

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen flex w-full bg-background" dir={direction}>
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-14 flex items-center gap-3 border-b bg-background/95 backdrop-blur px-3 sm:px-4">
            <SidebarTrigger />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/admin">الإدارة</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}