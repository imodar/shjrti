import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useResolvedImageUrl } from '@/utils/useResolvedImageUrl';
import { membersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MemberDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: any;
  familyMembers: any[];
  marriages: any[];
}

export const MemberDeleteModal: React.FC<MemberDeleteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member,
  familyMembers,
  marriages,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const memberImageSrc = useResolvedImageUrl(member?.image_url || null);

  const stats = useMemo(() => {
    if (!member) return { spouses: 0, children: 0, marriages: 0 };

    const memberMarriages = marriages.filter(
      m => m.husband_id === member.id || m.wife_id === member.id
    );

    const childrenCount = familyMembers.filter(
      m => m.father_id === member.id || m.mother_id === member.id
    ).length;

    return {
      spouses: memberMarriages.length,
      children: childrenCount,
      marriages: memberMarriages.length,
    };
  }, [member, familyMembers, marriages]);

  const displayName = member
    ? member.first_name && member.last_name
      ? `${member.first_name} ${member.last_name}`
      : member.name || ''
    : '';

  const handleDelete = async () => {
    if (!member?.id) return;
    setIsDeleting(true);
    try {
      await membersApi.delete(member.id);
      toast({
        title: t('profile.deletion_success', 'Deleted Successfully'),
        description: t('profile.member_deleted', 'Member has been deleted successfully'),
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error?.message || t('profile.delete_failed', 'Failed to delete member'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-red-50/95 dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-red-100/50 dark:border-red-900/30">
        <div className="p-6 md:p-8 flex flex-col items-center">
          {/* Warning Icon */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
            <div className="relative w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)' }}>
              <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {t('profile.delete_warning_title', 'تحذير حذف العضو')}
          </h2>
          <p className="text-xs text-slate-500 mb-6 font-medium">
            {t('profile.delete_warning_subtitle', 'أنت على وشك إزالة هذا الفرد نهائياً من الشجرة')}
          </p>

          {/* Member Card */}
          <div className="w-full p-3 bg-white/80 dark:bg-slate-800/50 rounded-2xl flex items-center gap-3 mb-6 border border-red-100/30 dark:border-red-900/20 shadow-sm">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-red-50 dark:border-red-900/30 flex-shrink-0">
              {memberImageSrc ? (
                <img src={memberImageSrc} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className={cn(
                  'w-full h-full flex items-center justify-center text-white text-lg font-bold',
                  member.gender === 'female' ? 'bg-pink-400' : 'bg-blue-400'
                )}>
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block mb-0.5">
                {t('profile.selected_member', 'العضو المختار')}
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{displayName}</p>
            </div>
          </div>

          {/* Affected Data Stats */}
          <div className="w-full mb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ms-1">
              {t('profile.affected_data', 'البيانات المتأثرة بالحذف')}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-3 rounded-2xl text-center border border-white/60 dark:border-slate-700/50 shadow-sm">
                <span className="material-symbols-outlined text-pink-500 mb-1 text-xl">favorite</span>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  {t('profile.spouses_label', 'الأزواج')}
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.spouses}</p>
              </div>
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-3 rounded-2xl text-center border border-white/60 dark:border-slate-700/50 shadow-sm">
                <span className="material-symbols-outlined text-blue-500 mb-1 text-xl">child_care</span>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  {t('profile.children_label', 'الأطفال')}
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.children}</p>
              </div>
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-3 rounded-2xl text-center border border-white/60 dark:border-slate-700/50 shadow-sm">
                <span className="material-symbols-outlined text-purple-500 mb-1 text-xl">family_restroom</span>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  {t('profile.relationships_label', 'العلاقات')}
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{stats.marriages}</p>
              </div>
            </div>
          </div>

          {/* Permanent Warning */}
          <div className="w-full p-4 bg-slate-900 dark:bg-red-950/40 rounded-2xl flex items-start gap-3 mb-6 shadow-lg shadow-slate-900/10">
            <span className="material-symbols-outlined text-red-500 flex-shrink-0 mt-0.5">gavel</span>
            <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">
                {t('profile.permanent_action', 'Permanent Action')}
              </p>
              <p className="text-[11px] text-slate-300 dark:text-red-100 leading-relaxed font-medium">
                {t('profile.delete_permanent_warning', 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع البيانات المتعلقة والروابط العائلية لهذا العضو بشكل قطعي.')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-3.5 bg-white/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              {t('cancel', 'إلغاء')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-[1.8] py-3.5 bg-gradient-to-r from-[#FF6B6B] to-[#F06292] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isDeleting ? (
                <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-xl">delete_sweep</span>
              )}
              {isDeleting
                ? t('profile.deleting', 'جاري الحذف...')
                : t('profile.confirm_delete', 'تأكيد الحذف')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDeleteModal;
