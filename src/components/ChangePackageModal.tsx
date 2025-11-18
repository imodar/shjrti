import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

interface Package {
  id: string;
  name: any;
  description: any;
  price_usd: number;
  price_sar: number;
  max_family_members: number;
  max_family_trees: number;
  features: any;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_package_name: any;
  subscription_status: string;
}

interface ChangePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess: () => void;
}

export function ChangePackageModal({ isOpen, onClose, user, onSuccess }: ChangePackageModalProps) {
  const { toast } = useToast();
  const { currentLanguage, direction } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [changeType, setChangeType] = useState<"paid" | "free">("paid");
  const [loading, setLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPackages();
    }
  }, [isOpen]);

  const loadPackages = async () => {
    try {
      setLoadingPackages(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الباقات",
        variant: "destructive"
      });
    } finally {
      setLoadingPackages(false);
    }
  };

  const getLocalizedText = (data: any, fallback: string = ''): string => {
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null) {
      return data[currentLanguage] || data.ar || data.en || fallback;
    }
    return fallback;
  };

  const getCurrentPrice = (pkg: Package) => {
    return currentLanguage === 'ar' ? pkg.price_sar : pkg.price_usd;
  };

  const getCurrency = () => {
    return currentLanguage === 'ar' ? 'SAR' : 'USD';
  };

  const handleSubmit = async () => {
    if (!user || !selectedPackageId) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_change_user_package' as any, {
        target_user_id: user.id,
        new_package_id: selectedPackageId,
        change_type: changeType
      });

      if (error) throw error;

      toast({
        title: "تم التغيير بنجاح",
        description: changeType === 'paid' 
          ? "تم إنشاء فاتورة للمستخدم وسيتم تفعيل الباقة الجديدة بعد السداد"
          : "تم تغيير باقة المستخدم مجاناً بنجاح"
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error changing package:', error);
      toast({
        title: "خطأ",
        description: "فشل في تغيير الباقة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${direction === 'rtl' ? 'font-arabic' : ''}`} dir={direction}>
        <DialogHeader>
          <DialogTitle>تغيير باقة المستخدم</DialogTitle>
          <DialogDescription>
            تغيير باقة المستخدم: {user?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Package Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">الباقة الحالية</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {user?.subscription_status === 'active' 
                  ? getLocalizedText(user.subscription_package_name, 'باقة غير معروفة')
                  : 'لا يوجد اشتراك نشط'}
              </p>
            </CardContent>
          </Card>

          {/* Package Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">اختيار الباقة الجديدة</Label>
            {loadingPackages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الباقة الجديدة" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{getLocalizedText(pkg.name)}</span>
                        <Badge variant="secondary" className="mr-2">
                          {getCurrentPrice(pkg)} {getCurrency()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Package Details */}
          {selectedPackage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">تفاصيل الباقة المختارة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>الاسم:</span>
                  <span className="font-medium">{getLocalizedText(selectedPackage.name)}</span>
                </div>
                <div className="flex justify-between">
                  <span>السعر:</span>
                  <span className="font-medium">{getCurrentPrice(selectedPackage)} {getCurrency()}</span>
                </div>
                <div className="flex justify-between">
                  <span>عدد أفراد العائلة:</span>
                  <span className="font-medium">{selectedPackage.max_family_members}</span>
                </div>
                <div className="flex justify-between">
                  <span>عدد أشجار العائلة:</span>
                  <span className="font-medium">{selectedPackage.max_family_trees}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Change Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">نوع التغيير</Label>
            <RadioGroup value={changeType} onValueChange={(value: "paid" | "free") => setChangeType(value)}>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="paid" id="paid" />
                <Label htmlFor="paid" className="font-normal">
                  فاتورة مدفوعة - سيتم إصدار فاتورة للمستخدم للسداد
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free" className="font-normal">
                  تغيير مجاني من الإدارة - تفعيل فوري
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Warning Message */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">تنبيه مهم:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {changeType === 'paid' ? (
                <>
                  <li>• سيتم إنشاء فاتورة جديدة للمستخدم</li>
                  <li>• لن يتم تفعيل الباقة الجديدة حتى يتم السداد</li>
                  <li>• سيتلقى المستخدم إشعار بالفاتورة الجديدة</li>
                </>
              ) : (
                <>
                  <li>• سيتم تغيير الباقة فوراً ومجاناً</li>
                  <li>• هذا التغيير هبة من الإدارة للمستخدم</li>
                  <li>• لن يتم إصدار أي فاتورة</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
          <Button onClick={onClose} variant="outline" disabled={loading}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedPackageId || loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {changeType === 'paid' ? 'إصدار فاتورة وتغيير الباقة' : 'تغيير الباقة مجاناً'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}