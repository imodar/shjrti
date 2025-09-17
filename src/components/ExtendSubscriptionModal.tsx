import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Calendar } from "lucide-react";
import { addMonths, addYears, format } from "date-fns";
import { ar } from "date-fns/locale";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_expires_at: string | null;
}

interface ExtendSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess: () => void;
}

export function ExtendSubscriptionModal({ isOpen, onClose, user, onSuccess }: ExtendSubscriptionModalProps) {
  const { toast } = useToast();
  const { direction } = useLanguage();
  const [extendType, setExtendType] = useState<string>("");
  const [customMonths, setCustomMonths] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const extensionOptions = [
    { value: "1", label: "شهر واحد", months: 1 },
    { value: "3", label: "3 شهور", months: 3 },
    { value: "6", label: "6 شهور", months: 6 },
    { value: "12", label: "سنة واحدة", months: 12 },
    { value: "24", label: "سنتان", months: 24 },
    { value: "custom", label: "فترة مخصصة", months: 0 }
  ];

  const calculateNewExpiryDate = (): Date | null => {
    if (!user?.subscription_expires_at) return null;
    
    const currentExpiry = new Date(user.subscription_expires_at);
    const selectedOption = extensionOptions.find(opt => opt.value === extendType);
    
    if (!selectedOption) return null;
    
    const monthsToAdd = selectedOption.value === "custom" ? customMonths : selectedOption.months;
    return addMonths(currentExpiry, monthsToAdd);
  };

  const handleSubmit = async () => {
    if (!user || !extendType) return;

    const newExpiryDate = calculateNewExpiryDate();
    if (!newExpiryDate) {
      toast({
        title: "خطأ",
        description: "لا يمكن حساب تاريخ انتهاء الاشتراك الجديد",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_extend_subscription' as any, {
        target_user_id: user.id,
        new_expiry_date: newExpiryDate.toISOString()
      });

      if (error) throw error;

      const monthsAdded = extendType === "custom" ? customMonths : extensionOptions.find(opt => opt.value === extendType)?.months || 0;
      
      toast({
        title: "تم التمديد بنجاح",
        description: `تم تمديد اشتراك المستخدم لـ ${monthsAdded} شهر إضافي`
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast({
        title: "خطأ",
        description: "فشل في تمديد الاشتراك",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const newExpiryDate = calculateNewExpiryDate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[500px] ${direction === 'rtl' ? 'font-arabic' : ''}`} dir={direction}>
        <DialogHeader className={direction === 'rtl' ? 'text-right' : 'text-left'}>
          <DialogTitle>تمديد اشتراك المستخدم</DialogTitle>
          <DialogDescription>
            تمديد اشتراك المستخدم: {user?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                معلومات الاشتراك الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>تاريخ انتهاء الاشتراك الحالي:</span>
                  <span className="font-medium">
                    {user?.subscription_expires_at 
                      ? format(new Date(user.subscription_expires_at), 'dd MMMM yyyy', { locale: ar })
                      : 'غير محدد'}
                  </span>
                </div>
                {user?.subscription_expires_at && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>الأيام المتبقية:</span>
                    <span>
                      {(() => {
                        const expiryDate = new Date(user.subscription_expires_at);
                        const today = new Date();
                        const diffTime = expiryDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays > 0) {
                          return `${diffDays} يوم`;
                        } else if (diffDays === 0) {
                          return 'ينتهي اليوم';
                        } else {
                          return `انتهى منذ ${Math.abs(diffDays)} يوم`;
                        }
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Extension Period Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">فترة التمديد</Label>
            <Select value={extendType} onValueChange={setExtendType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر فترة التمديد" />
              </SelectTrigger>
              <SelectContent>
                {extensionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Months Input */}
            {extendType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="custom-months">عدد الشهور المخصص</Label>
                <Input
                  id="custom-months"
                  type="number"
                  min="1"
                  max="60"
                  value={customMonths}
                  onChange={(e) => setCustomMonths(parseInt(e.target.value) || 1)}
                  placeholder="أدخل عدد الشهور"
                />
              </div>
            )}
          </div>

          {/* New Expiry Date Preview */}
          {newExpiryDate && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-sm text-green-800">تاريخ انتهاء الاشتراك الجديد</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-green-700">
                  {format(newExpiryDate, 'dd MMMM yyyy', { locale: ar })}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  سيتم إضافة {extendType === "custom" ? customMonths : extensionOptions.find(opt => opt.value === extendType)?.months} شهر إلى الاشتراك الحالي
                </p>
              </CardContent>
            </Card>
          )}

          {/* Admin Privilege Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">ملاحظة مهمة:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• تمديد الاشتراك هو ميزة مجانية مخصصة للإدارة فقط</li>
              <li>• لن يتم إصدار أي فاتورة للمستخدم</li>
              <li>• سيتم تمديد الاشتراك فوراً بعد التأكيد</li>
              <li>• هذا التمديد هبة من الإدارة للمستخدم</li>
            </ul>
          </div>
        </div>

        <DialogFooter className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
          <Button onClick={onClose} variant="outline" disabled={loading}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!extendType || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            تأكيد التمديد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}