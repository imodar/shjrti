import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Download, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminNewsletterSubscriptions() {
  const { t, direction } = useLanguage();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch newsletter subscriptions
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["newsletter-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscriptions"] });
      toast.success(t("common.success"));
    },
    onError: (error) => {
      console.error("Error toggling subscription:", error);
      toast.error(t("common.error"));
    },
  });

  // Delete subscription mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscriptions"] });
      toast.success(t("common.deleted"));
    },
    onError: (error) => {
      console.error("Error deleting subscription:", error);
      toast.error(t("common.error"));
    },
  });

  // Filter subscriptions based on search
  const filteredSubscriptions = subscriptions?.filter((sub) =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Export to CSV
  const handleExport = () => {
    if (!subscriptions || subscriptions.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvContent = [
      ["Email", "Status", "Subscribed Date"],
      ...subscriptions.map((sub) => [
        sub.email,
        sub.is_active ? "Active" : "Inactive",
        format(new Date(sub.created_at), "yyyy-MM-dd HH:mm:ss"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `newsletter_subscriptions_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Exported successfully");
  };

  return (
    <div className="container mx-auto p-6" dir={direction}>
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-emerald-600">
                {direction === "rtl" ? "اشتراكات النشرة البريدية" : "Newsletter Subscriptions"}
              </CardTitle>
              <CardDescription>
                {direction === "rtl"
                  ? "إدارة جميع المشتركين في النشرة البريدية"
                  : "Manage all newsletter subscribers"}
              </CardDescription>
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {direction === "rtl" ? "تصدير CSV" : "Export CSV"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={direction === "rtl" ? "بحث بالبريد الإلكتروني..." : "Search by email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-emerald-600">
                  {subscriptions?.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {direction === "rtl" ? "إجمالي المشتركين" : "Total Subscribers"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {subscriptions?.filter((s) => s.is_active).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {direction === "rtl" ? "نشط" : "Active"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-600">
                  {subscriptions?.filter((s) => !s.is_active).length || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {direction === "rtl" ? "غير نشط" : "Inactive"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{direction === "rtl" ? "البريد الإلكتروني" : "Email"}</TableHead>
                  <TableHead>{direction === "rtl" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{direction === "rtl" ? "تاريخ الاشتراك" : "Subscribed Date"}</TableHead>
                  <TableHead className="text-center">{direction === "rtl" ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      {direction === "rtl" ? "جاري التحميل..." : "Loading..."}
                    </TableCell>
                  </TableRow>
                ) : filteredSubscriptions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      {direction === "rtl" ? "لا يوجد مشتركين" : "No subscribers found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions?.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">{subscription.email}</TableCell>
                      <TableCell>
                        <Badge variant={subscription.is_active ? "default" : "secondary"}>
                          {subscription.is_active
                            ? direction === "rtl"
                              ? "نشط"
                              : "Active"
                            : direction === "rtl"
                            ? "غير نشط"
                            : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(subscription.created_at), "yyyy-MM-dd HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: subscription.id,
                                isActive: subscription.is_active,
                              })
                            }
                            disabled={toggleActiveMutation.isPending}
                          >
                            {subscription.is_active ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(direction === "rtl" ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
                                deleteMutation.mutate(subscription.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
