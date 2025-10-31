import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import DOMPurify from 'dompurify';
import { DirectionWrapper } from "@/components/DirectionWrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EmailLog {
  id: string;
  template_key: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  variables: any;
  status: string;
  error_message: string | null;
  sent_at: string;
}

export default function AdminEmailLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["email-logs", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(100);

      if (searchTerm) {
        query = query.or(`recipient_email.ilike.%${searchTerm}%,recipient_name.ilike.%${searchTerm}%,template_key.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EmailLog[];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500">تم الإرسال</Badge>;
      case "failed":
        return <Badge variant="destructive">فشل</Badge>;
      default:
        return <Badge variant="secondary">قيد الإرسال</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DirectionWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري التحميل...</p>
          </div>
        </div>
      </DirectionWrapper>
    );
  }

  return (
    <DirectionWrapper>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Mail className="h-8 w-8" />
            سجل الإيميلات المرسلة
          </h1>
          <p className="text-muted-foreground">
            تتبع جميع الإيميلات المرسلة للعملاء
          </p>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">إجمالي الإيميلات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">تم الإرسال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {logs?.filter((l) => l.status === "sent").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">فشل الإرسال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {logs?.filter((l) => l.status === "failed").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">البحث</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>سجل الإيميلات</CardTitle>
            <CardDescription>آخر 100 إيميل تم إرسالها</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحالة</TableHead>
                    <TableHead>القالب</TableHead>
                    <TableHead>المستلم</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>التفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs && logs.length > 0 ? (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            {getStatusBadge(log.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.template_key}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.recipient_name || "غير محدد"}</div>
                            <div className="text-sm text-muted-foreground">{log.recipient_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                        <TableCell>
                          {format(new Date(log.sent_at), "dd MMM yyyy HH:mm", { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                عرض
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>تفاصيل الإيميل</DialogTitle>
                              </DialogHeader>
                              {selectedLog && (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">معلومات عامة</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <span className="text-sm text-muted-foreground">الحالة:</span>
                                        <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-muted-foreground">القالب:</span>
                                        <div className="mt-1">
                                          <Badge variant="outline">{selectedLog.template_key}</Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-muted-foreground">المستلم:</span>
                                        <div className="mt-1">{selectedLog.recipient_email}</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-muted-foreground">التاريخ:</span>
                                        <div className="mt-1">
                                          {format(new Date(selectedLog.sent_at), "dd MMM yyyy HH:mm", {
                                            locale: ar,
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold mb-2">العنوان</h4>
                                    <p className="text-sm bg-accent p-3 rounded">{selectedLog.subject}</p>
                                  </div>

                                  {selectedLog.error_message && (
                                    <div>
                                      <h4 className="font-semibold mb-2 text-red-600">رسالة الخطأ</h4>
                                      <p className="text-sm bg-red-50 p-3 rounded text-red-600">
                                        {selectedLog.error_message}
                                      </p>
                                    </div>
                                  )}

                                  <div>
                                    <h4 className="font-semibold mb-2">المتغيرات المستخدمة</h4>
                                    <div className="bg-accent p-3 rounded">
                                      <pre className="text-xs overflow-x-auto">
                                        {JSON.stringify(selectedLog.variables, null, 2)}
                                      </pre>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold mb-2">معاينة المحتوى</h4>
                                    <div
                                      className="bg-white border p-4 rounded max-h-96 overflow-y-auto"
                                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedLog.body) }}
                                    />
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">لا توجد إيميلات مسجلة</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DirectionWrapper>
  );
}
