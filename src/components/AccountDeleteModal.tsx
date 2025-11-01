import { useState, useEffect } from "react";
import { Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AccountDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: {
    familiesCreated: number;
    totalMembers: number;
  };
}

const AccountDeleteModal = ({ isOpen, onClose, userStats }: AccountDeleteModalProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Modal state management
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  // Progress tracking
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  
  const confirmationWord = "DELETE";
  
  const deletionSteps = [
    'جاري حذف الأشجار والأعضاء...',
    'جاري حذف الصور والذكريات...',
    'جاري حذف الاشتراكات والفواتير...',
    'جاري حذف الحساب نهائيًا...',
    'تم الحذف بنجاح ✓'
  ];

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowConfirmModal(true);
      setShowProgressModal(false);
      setDeleteConfirmText("");
      setProgress(0);
      setCurrentStep(0);
      setDeletionError(null);
    } else {
      setShowConfirmModal(false);
      setShowProgressModal(false);
      setDeleteConfirmText("");
    }
  }, [isOpen]);

  // Map progress to current step index
  useEffect(() => {
    const stepsCount = deletionSteps.length;
    if (progress > 0 && progress < 100) {
      const idx = Math.min(Math.floor((progress / 100) * stepsCount), stepsCount - 1);
      setCurrentStep(idx);
    }
  }, [progress, deletionSteps.length]);

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== confirmationWord) {
      toast({
        title: "خطأ في التأكيد",
        description: `يجب كتابة "${confirmationWord}" بشكل صحيح`,
        variant: "destructive"
      });
      return;
    }

    // Close confirm modal and open progress modal
    setShowConfirmModal(false);
    setShowProgressModal(true);
    setIsDeleting(true);
    setDeletionError(null);
    setProgress(0);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Start progress animation
      progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 3, 95));
      }, 500);

      // Call edge function to delete account
      const { data, error } = await supabase.functions.invoke('delete-current-user');
      
      if (error) {
        setDeletionError(`حدث خطأ أثناء حذف الحساب: ${error.message}`);
        return;
      }

      if (!data?.success) {
        setDeletionError(data?.error || 'فشل حذف الحساب');
        return;
      }

      // Complete progress
      setProgress(100);
      setCurrentStep(deletionSteps.length - 1);
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف حسابك وجميع بياناتك نهائيًا"
      });

      // Wait a bit then sign out and redirect
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Sign out and redirect to homepage
      await supabase.auth.signOut();
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('Error during account deletion:', error);
      setDeletionError(`حدث خطأ غير متوقع: ${error?.message || ''}`);
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsDeleting(false);
    }
  };

  const resetConfirmation = () => {
    setDeleteConfirmText("");
    onClose();
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-2xl mx-auto overflow-hidden border-0 bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 dark:from-red-950/20 dark:via-red-900/20 dark:to-orange-900/20 backdrop-blur-lg">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-16 h-16 bg-red-200/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 right-6 w-24 h-24 bg-orange-200/20 rounded-full animate-bounce delay-300"></div>
            <div className="absolute top-1/2 right-4 w-12 h-12 bg-rose-200/25 rounded-full animate-pulse delay-700"></div>
          </div>
          
          {/* Main Content */}
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-center mb-6">
                {/* Animated Icon Container */}
                <div className="relative flex items-center justify-center mb-4">
                  <div className="relative">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 w-24 h-24 bg-red-500/20 rounded-full animate-ping"></div>
                    {/* Inner pulsing circle */}
                    <div className="relative w-20 h-20 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-xl shadow-red-500/40 animate-pulse">
                      <AlertTriangle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Title with gradient text */}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 bg-clip-text text-transparent">
                  ⚠️ تحذير: حذف الحساب نهائيًا
                </h2>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 px-2">
              {/* Critical Warning Alert */}
              <Alert className="border-red-400 dark:border-red-600 bg-red-50/80 dark:bg-red-950/40">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-800 dark:text-red-200 font-bold text-lg">
                  هذا الإجراء لا يمكن التراجع عنه أبدًا!
                </AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-300 space-y-3 mt-2">
                  <p className="font-semibold">
                    حذف حسابك سيؤدي إلى إزالة <strong className="text-red-900 dark:text-red-100">جميع بياناتك نهائيًا</strong> من نظامنا:
                  </p>
                  <ul className="list-disc pr-6 space-y-2 text-sm">
                    <li><strong>🌳 {userStats.familiesCreated} شجرة عائلة</strong> - بما فيها جميع العلاقات والبيانات</li>
                    <li><strong>👥 {userStats.totalMembers} عضو</strong> - جميع معلومات الأعضاء المسجلة</li>
                    <li><strong>🖼️ الصور والذكريات</strong> - جميع الملفات المرفوعة من الأشجار والأعضاء</li>
                    <li><strong>💳 معلومات الاشتراك</strong> - حالة الاشتراك والفواتير</li>
                    <li><strong>📧 الإشعارات والرسائل</strong> - جميع الإشعارات المخزنة</li>
                    <li><strong>⚙️ الإعدادات والتفضيلات</strong> - جميع إعداداتك الشخصية</li>
                    <li><strong>👤 الحساب الشخصي</strong> - لن تستطيع الدخول مرة أخرى بنفس البريد</li>
                  </ul>
                  <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-300 dark:border-red-700 mt-4">
                    <p className="font-bold text-red-900 dark:text-red-100 text-center">
                      ⛔ لا يمكن استرجاع أي من هذه البيانات بعد الحذف!
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Confirmation Text Display */}
              <div className="bg-white/80 dark:bg-gray-800/60 rounded-2xl p-5 backdrop-blur-sm border-2 border-red-300/50 dark:border-red-700/50">
                <p className="text-gray-700 dark:text-gray-300 mb-3 text-center font-medium">
                  للتأكيد النهائي، اكتب كلمة <span className="font-bold text-red-600 dark:text-red-400 text-lg">"{confirmationWord}"</span> بالأحرف الكبيرة:
                </p>
                <div className="text-2xl font-bold text-center bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent px-4 py-3 bg-red-100/50 dark:bg-red-900/30 rounded-xl border-2 border-red-300 dark:border-red-600">
                  {confirmationWord}
                </div>
              </div>

              {/* Input Field */}
              <div className="space-y-3">
                <Label htmlFor="confirmText" className="text-base font-semibold text-gray-700 dark:text-gray-300 block text-center">
                  اكتب "{confirmationWord}" للتأكيد:
                </Label>
                <div className="relative">
                  <Input
                    id="confirmText"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={confirmationWord}
                    className="text-center text-xl font-bold bg-white/90 dark:bg-gray-800/70 border-2 border-red-300/50 dark:border-red-600/50 rounded-xl focus:border-red-500 dark:focus:border-red-400 focus:ring-4 focus:ring-red-200 dark:focus:ring-red-800/50 transition-all duration-300 h-14"
                  />
                  {deleteConfirmText.trim().toUpperCase() === confirmationWord && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-scale-in shadow-lg">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <Button 
                  variant="outline" 
                  onClick={resetConfirmation}
                  className="flex-1 h-14 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 font-semibold text-base"
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleConfirmDelete}
                  disabled={deleteConfirmText.trim().toUpperCase() !== confirmationWord}
                  className="flex-1 h-14 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-700 hover:via-rose-700 hover:to-orange-700 text-white font-bold text-base shadow-lg shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                >
                  <Trash2 className="h-5 w-5 ml-2" />
                  حذف حسابي نهائيًا
                </Button>
              </div>

              {/* GDPR Compliance Note */}
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                يتم تنفيذ هذا الإجراء للامتثال للوائح GDPR وCCPA وقوانين حماية البيانات
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deletion Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={(open) => { if (!isDeleting && !open) handleClose(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg">
              {progress < 100 ? (
                <>
                  <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
                  <span>جاري حذف الحساب...</span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-green-600">تم الحذف بنجاح</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {deletionSteps[currentStep] || 'جاري الإنهاء...'}
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{progress}%</span>
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} / {deletionSteps.length}
                </span>
              </div>
            </div>

            {/* Steps list */}
            <ul className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
              {deletionSteps.map((step, idx) => (
                <li
                  key={idx}
                  className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                    idx < currentStep 
                      ? 'text-green-600 dark:text-green-400' 
                      : idx === currentStep 
                      ? 'text-red-600 dark:text-red-400 font-semibold' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      idx < currentStep 
                        ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                        : idx === currentStep 
                        ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/30' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    {idx < currentStep ? (
                      <span className="text-white text-xs font-bold">✓</span>
                    ) : idx === currentStep ? (
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                    ) : (
                      <span className="text-white text-xs">{idx + 1}</span>
                    )}
                  </span>
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ul>

            {deletionError && (
              <Alert className="border-red-400 bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
                  {deletionError}
                </AlertDescription>
              </Alert>
            )}

            {progress === 100 && !deletionError && (
              <Alert className="border-green-400 bg-green-50 dark:bg-green-950/30">
                <AlertDescription className="text-green-700 dark:text-green-300 text-sm text-center">
                  سيتم توجيهك إلى الصفحة الرئيسية الآن...
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            {!isDeleting && deletionError && (
              <Button onClick={handleClose} variant="outline" className="w-full">
                إغلاق
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountDeleteModal;
