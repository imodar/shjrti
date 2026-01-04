import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Users,
  Trees,
  UserCheck,
  Image,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  Clock,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface TreeDetail {
  family_id: string;
  tree_name: string;
  tree_created_at: string;
  members_count: number;
  tree_photos_count: number;
  members_photos_count: number;
}

interface UserStatistics {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  last_login: string | null;
  total_trees: number;
  total_members: number;
  total_member_photos: number;
  total_family_photos: number;
  subscription_status: string;
  subscription_package_name: { ar?: string; en?: string } | null;
  trees_detail: TreeDetail[];
}

export default function AdminUserStatistics() {
  const { direction } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const { data: statistics, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-user-statistics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_user_statistics");
      if (error) throw error;
      // Transform the data to match our interface
      return (data || []).map((item: Record<string, unknown>) => ({
        ...item,
        trees_detail: Array.isArray(item.trees_detail) 
          ? item.trees_detail 
          : (item.trees_detail as TreeDetail[] | null) || [],
      })) as UserStatistics[];
    },
  });

  const filteredStatistics = useMemo(() => {
    if (!statistics) return [];
    if (!searchQuery.trim()) return statistics;

    const query = searchQuery.toLowerCase();
    return statistics.filter(
      (user) =>
        user.email?.toLowerCase().includes(query) ||
        user.first_name?.toLowerCase().includes(query) ||
        user.last_name?.toLowerCase().includes(query)
    );
  }, [statistics, searchQuery]);

  const summaryStats = useMemo(() => {
    if (!statistics) return { users: 0, trees: 0, members: 0, photos: 0 };
    return {
      users: statistics.length,
      trees: statistics.reduce((sum, u) => sum + (u.total_trees || 0), 0),
      members: statistics.reduce((sum, u) => sum + (u.total_members || 0), 0),
      photos: statistics.reduce(
        (sum, u) => sum + (u.total_member_photos || 0) + (u.total_family_photos || 0),
        0
      ),
    };
  }, [statistics]);

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "yyyy/MM/dd", {
        locale: direction === "rtl" ? ar : enUS,
      });
    } catch {
      return "-";
    }
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: direction === "rtl" ? ar : enUS,
      });
    } catch {
      return "-";
    }
  };

  const exportToCSV = () => {
    if (!statistics) return;

    const headers = [
      "البريد الإلكتروني",
      "الاسم الأول",
      "الاسم الأخير",
      "تاريخ التسجيل",
      "آخر دخول",
      "عدد الأشجار",
      "عدد الأعضاء",
      "صور الأعضاء",
      "صور الأشجار",
      "حالة الاشتراك",
    ];

    const rows = statistics.map((user) => [
      user.email,
      user.first_name || "",
      user.last_name || "",
      formatDate(user.created_at),
      formatDate(user.last_login),
      user.total_trees,
      user.total_members,
      user.total_member_photos,
      user.total_family_photos,
      user.subscription_status === "active" ? "نشط" : "غير نشط",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `user-statistics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getUserDisplayName = (user: UserStatistics) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return user.email?.split("@")[0] || "مستخدم";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              إجمالي المستخدمين
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-200">
              {summaryStats.users.toLocaleString("ar-EG")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              إجمالي الأشجار
            </CardTitle>
            <Trees className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-200">
              {summaryStats.trees.toLocaleString("ar-EG")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50 dark:border-purple-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              إجمالي الأعضاء
            </CardTitle>
            <UserCheck className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-200">
              {summaryStats.members.toLocaleString("ar-EG")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/50 dark:border-orange-800/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              إجمالي الصور
            </CardTitle>
            <Image className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-200">
              {summaryStats.photos.toLocaleString("ar-EG")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-emerald-600">
                تفاصيل إحصائيات المستخدمين
              </CardTitle>
              <CardDescription>
                عرض تفصيلي لكل مستخدم وأشجاره وأعضائه وصوره
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                تحديث
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                تصدير CSV
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالاسم أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead className="text-center">الأشجار</TableHead>
                  <TableHead className="text-center">الأعضاء</TableHead>
                  <TableHead className="text-center">الصور</TableHead>
                  <TableHead className="text-center">آخر دخول</TableHead>
                  <TableHead className="text-center">الاشتراك</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStatistics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لا توجد بيانات"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStatistics.map((user) => (
                    <Collapsible
                      key={user.user_id}
                      open={expandedUsers.has(user.user_id)}
                      onOpenChange={() => toggleUserExpanded(user.user_id)}
                      asChild
                    >
                      <>
                        <CollapsibleTrigger asChild>
                          <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {expandedUsers.has(user.user_id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {getUserDisplayName(user)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(user.created_at)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                {user.total_trees}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                {user.total_members}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                {(user.total_member_photos || 0) + (user.total_family_photos || 0)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatRelativeTime(user.last_login)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {user.subscription_status === "active" ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                                  {user.subscription_package_name?.ar || "نشط"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  غير مشترك
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        </CollapsibleTrigger>

                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={7} className="p-0">
                              <div className="p-4 space-y-3">
                                {user.trees_detail && user.trees_detail.length > 0 ? (
                                  <div className="grid gap-3">
                                    <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                      <Trees className="h-4 w-4" />
                                      تفاصيل الأشجار ({user.trees_detail.length})
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {user.trees_detail.map((tree) => (
                                        <div
                                          key={tree.family_id}
                                          className="bg-white dark:bg-gray-800 rounded-lg border p-3 space-y-2"
                                        >
                                          <div className="font-medium text-sm">
                                            {tree.tree_name}
                                          </div>
                                          <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                                              <div className="font-bold text-purple-700 dark:text-purple-300">
                                                {tree.members_count}
                                              </div>
                                              <div className="text-muted-foreground">عضو</div>
                                            </div>
                                            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                                              <div className="font-bold text-orange-700 dark:text-orange-300">
                                                {tree.members_photos_count}
                                              </div>
                                              <div className="text-muted-foreground">صور أعضاء</div>
                                            </div>
                                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                              <div className="font-bold text-blue-700 dark:text-blue-300">
                                                {tree.tree_photos_count}
                                              </div>
                                              <div className="text-muted-foreground">صور شجرة</div>
                                            </div>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            أُنشئت: {formatDate(tree.tree_created_at)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-muted-foreground">
                                    لا توجد أشجار لهذا المستخدم
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground text-center">
            عرض {filteredStatistics.length} من {statistics?.length || 0} مستخدم
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
