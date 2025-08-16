import React, { useState, useEffect } from 'react';
import { RelativeDateDisplay } from '@/components/DateDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Calendar, User, MessageSquare, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactSubmission {
  id: string;
  full_name: string;
  email: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const ContactSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الرسائل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev =>
        prev.map(sub => sub.id === id ? { ...sub, status } : sub)
      );

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الرسالة بنجاح",
      });

      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive",
      });
    }
  };

  const deleteSubmission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev => prev.filter(sub => sub.id !== id));
      toast({
        title: "تم الحذف",
        description: "تم حذف الرسالة بنجاح",
      });
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الرسالة",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">في الانتظار</Badge>;
      case 'in_progress':
        return <Badge variant="default">قيد المعالجة</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">تم الحل</Badge>;
      case 'closed':
        return <Badge variant="destructive">مغلق</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Remove the local formatDate function since we're using the global one

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">رسائل التواصل</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {submissions.length} رسالة
        </Badge>
      </div>

      <div className="grid gap-4">
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد رسائل حتى الآن</p>
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{submission.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{submission.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <RelativeDateDisplay date={submission.created_at} />
                    </div>

                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {submission.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(submission.status)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setIsViewModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setEditStatus(submission.status);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                          deleteSubmission(submission.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الرسالة</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الاسم الكامل</Label>
                  <Input value={selectedSubmission.full_name} readOnly />
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input value={selectedSubmission.email} readOnly />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>تاريخ الإرسال</Label>
                  <RelativeDateDisplay date={selectedSubmission.created_at} />
                </div>
                <div>
                  <Label>الحالة</Label>
                  <div className="pt-2">
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                </div>
              </div>

              <div>
                <Label>الرسالة</Label>
                <Textarea 
                  value={selectedSubmission.description} 
                  readOnly 
                  className="min-h-[150px] mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة الرسالة</DialogTitle>
            <DialogDescription>
              اختر الحالة الجديدة للرسالة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الحالة</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                  <SelectItem value="resolved">تم الحل</SelectItem>
                  <SelectItem value="closed">مغلق</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={() => selectedSubmission && updateStatus(selectedSubmission.id, editStatus)}
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactSubmissions;