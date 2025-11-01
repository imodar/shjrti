import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package, X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScheduledPackageChangeCardProps {
  scheduledChange: {
    id: string;
    target_package_id: string;
    scheduled_date: string;
    status: string;
    target_package?: {
      name: any;
      price_usd: number;
    };
  };
  onCancelled: () => void;
}

export function ScheduledPackageChangeCard({ 
  scheduledChange, 
  onCancelled 
}: ScheduledPackageChangeCardProps) {
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const getPackageName = () => {
    const name = scheduledChange.target_package?.name;
    if (typeof name === 'object' && name !== null) {
      return name.ar || name.en || 'باقة';
    }
    return name || 'باقة';
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('cancel_scheduled_package_change', {
        p_user_id: user.id,
        p_scheduled_change_id: scheduledChange.id
      });

      if (error) throw error;

      if (data === true) {
        toast({
          title: "تم إلغاء التغيير المجدول",
          description: "تم إلغاء تغيير الباقة بنجاح",
        });
        onCancelled();
      } else {
        throw new Error('Failed to cancel scheduled change');
      }
    } catch (error: any) {
      console.error('Error cancelling scheduled change:', error);
      toast({
        title: "خطأ في الإلغاء",
        description: error.message || "حدث خطأ أثناء إلغاء التغيير المجدول",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <>
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              تغيير مجدول للباقة
            </CardTitle>
            <Badge variant="secondary">قيد الانتظار</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الباقة الجديدة:</span>
              <span className="font-semibold">{getPackageName()}</span>
            </div>
            
            {scheduledChange.target_package?.price_usd && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">السعر الجديد:</span>
                <span className="font-semibold">${scheduledChange.target_package.price_usd} سنوياً</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                تاريخ التطبيق:
              </span>
              <span className="font-semibold">
                {format(new Date(scheduledChange.scheduled_date), 'dd MMMM yyyy', { locale: ar })}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              سيتم تطبيق الباقة الجديدة تلقائياً عند انتهاء اشتراكك الحالي
            </p>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowCancelDialog(true)}
              disabled={isCancelling}
            >
              <X className="h-4 w-4 ml-2" />
              إلغاء التغيير المجدول
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء التغيير المجدول</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء التغيير المجدول للباقة؟ سيبقى اشتراكك الحالي ساري المفعول حتى تاريخ انتهائه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
