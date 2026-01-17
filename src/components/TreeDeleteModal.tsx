import { useState, useEffect } from "react";
import { Trash2, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { familiesApi } from "@/lib/api";

interface TreeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (treeId: string) => void;
  treeId: string | null;
  treeName: string;
}

const TreeDeleteModal = ({ isOpen, onClose, onSuccess, treeId, treeName }: TreeDeleteModalProps) => {
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
  
  const deletionSteps = [
    'جاري مسح الأعضاء',
    'جاري مسح العلاقات', 
    'جاري مسح الوسائط والذكريات',
    'جاري تنظيف الشجرة'
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
    if (!treeId || deleteConfirmText.trim() !== treeName.trim()) {
      toast({
        title: t('dashboard.confirmation_error', 'Confirmation Error'),
        description: t('dashboard.tree_name_confirmation', 'Tree name must be typed correctly for confirmation'),
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
        setProgress((prev) => Math.min(prev + 5, 95));
      }, 400);

      // Perform deletion via REST API
      const result = await familiesApi.delete(treeId);
      
      if (!result?.deleted) {
        const message = t('dashboard.tree_not_found_error', 'Tree not found or you do not have permission to delete it');
        setDeletionError(`${t('dashboard.tree_deletion_error', 'Error occurred while deleting family tree')}: ${message}`);
        return;
      }

      // Complete progress
      setProgress(100);
      
      toast({
        title: t('dashboard.deletion_success', 'Deleted Successfully'),
        description: t('dashboard.tree_deletion_success', 'Family tree deleted successfully')
      });

      // Delay before closing modal and calling success callback
      await new Promise((resolve) => setTimeout(resolve, 600));
      onSuccess(treeId);
      onClose();
    } catch (error: any) {
      console.error('Error during deletion:', error);
      setDeletionError(`${t('dashboard.unexpected_error', 'Unexpected error occurred')}: ${error?.message || ''}`);
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
        <DialogContent className="max-w-lg mx-auto overflow-hidden border-0 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-950/20 dark:via-red-900/20 dark:to-red-800/20 backdrop-blur-lg">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-16 h-16 bg-red-200/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 right-6 w-20 h-20 bg-rose-200/20 rounded-full animate-bounce delay-300"></div>
            <div className="absolute top-1/2 right-4 w-12 h-12 bg-pink-200/25 rounded-full animate-pulse delay-700"></div>
          </div>
          
          {/* Main Content */}
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-center mb-6">
                {/* Animated Icon Container */}
                <div className="relative flex items-center justify-center mb-4">
                  <div className="relative">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 w-20 h-20 bg-red-500/20 rounded-full animate-ping"></div>
                    {/* Inner pulsing circle */}
                    <div className="relative w-16 h-16 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-red-500/30 animate-pulse">
                      <Trash2 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Title with gradient text */}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                  {t('confirm_deletion', 'تأكيد الحذف')}
                </h2>
              </DialogTitle>
            </DialogHeader>
            
            <div className="text-center space-y-6 px-2">
              {/* Enhanced Warning Card */}
              <div className="relative overflow-hidden bg-white/80 dark:bg-red-950/40 rounded-3xl p-6 border-2 border-red-200/50 dark:border-red-700/50 shadow-lg backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500"></div>
                
                <div className="flex items-center justify-center gap-3 text-red-700 dark:text-red-300 mb-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <X className="h-5 w-5 text-red-600" />
                  </div>
                   <span className="font-bold text-lg">{t('serious_warning', 'تحذير خطير')}</span>
                </div>
                
                <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed font-medium">
                   {t('irreversible_action', 'هذا الإجراء')} <span className="font-bold text-red-700 dark:text-red-300">{t('cannot_be_undone', 'لا يمكن التراجع عنه')}</span>. 
                   {t('dashboard.deletion_warning', 'All tree data and associated memories will be permanently deleted.')}
                </p>
              </div>

              {/* Tree Name Display */}
              <div className="bg-white/60 dark:bg-gray-800/40 rounded-2xl p-4 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {t('dashboard.type_tree_name', 'To confirm deletion, type the tree name exactly:')}
                </p>
                <div className="text-lg font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 dark:from-gray-200 dark:via-gray-300 dark:to-gray-400 bg-clip-text text-transparent px-4 py-2 bg-gray-100/50 dark:bg-gray-700/30 rounded-xl border border-gray-300/50 dark:border-gray-600/50">
                  "{treeName}"
                </div>
              </div>

              {/* Input Field */}
              <div className="space-y-3">
                <Label htmlFor="confirmText" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                  {t('dashboard.confirm_tree_name', 'Type tree name to confirm:')}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmText"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={treeName}
                    className="text-center text-lg font-medium bg-white/80 dark:bg-gray-800/60 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800/50 transition-all duration-300"
                  />
                  {deleteConfirmText.trim() === treeName.trim() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                        <span className="text-white text-xs">✓</span>
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
                  className="flex-1 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 font-semibold"
                >
                   {t('cancel', 'إلغاء')}
                </Button>
                <Button 
                  onClick={handleConfirmDelete}
                  disabled={deleteConfirmText.trim() !== treeName.trim()}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:via-rose-600 hover:to-red-700 text-white font-bold shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                >
                  <Trash2 className="h-5 w-5 ml-2" />
                  {t('final_delete', 'حذف نهائي')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deletion Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={(open) => { if (!isDeleting && !open) handleClose(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-red-600 animate-spin" />
              {t('deleting_tree', 'جاري حذف الشجرة...')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {deletionSteps[currentStep] || t('finalizing', 'جاري الإنهاء...')}
              </div>
              <Progress value={progress} />
              <div className="text-xs text-muted-foreground">{progress}%</div>
            </div>

            {/* Steps list */}
            <ul className="space-y-2">
              {deletionSteps.map((step, idx) => (
                <li
                  key={idx}
                  className={`flex items-center gap-2 text-sm ${idx < currentStep ? 'text-emerald-600' : idx === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${idx < currentStep ? 'bg-emerald-500' : idx === currentStep ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  ></span>
                  {step}
                </li>
              ))}
            </ul>

            {deletionError && (
              <div className="text-sm text-red-600">
                {deletionError}
              </div>
            )}
          </div>

          <DialogFooter>
            {!isDeleting && (
              <Button onClick={handleClose} className="w-full">
                {t('close', 'إغلاق')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TreeDeleteModal;