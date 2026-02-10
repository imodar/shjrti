import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { familyInvitationsApi } from '@/lib/api';
import type { Collaborator, Invitation } from '@/lib/api/endpoints/familyInvitations';

interface CollaboratorsTabProps {
  familyId: string;
  isOwner?: boolean;
}

const CollaboratorsTab: React.FC<CollaboratorsTabProps> = ({ familyId, isOwner = true }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const fetchData = async () => {
    if (!isOwner) { setLoading(false); return; }
    try {
      const data = await familyInvitationsApi.list(familyId);
      setCollaborators(data.collaborators);
      setInvitations(data.invitations);
    } catch (e) {
      console.error('Error fetching collaborators:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [familyId, isOwner]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSending(true);
    try {
      await familyInvitationsApi.invite(familyId, inviteEmail.trim());
      toast({ title: t('settings.invite_sent', 'تم إرسال الدعوة'), description: inviteEmail });
      setInviteEmail('');
      setShowInviteForm(false);
      fetchData();
    } catch (err: any) {
      const msg = err?.code === 'PLAN_REQUIRED' ? t('settings.plan_required', 'هذه الميزة تتطلب باقة Plus أو أعلى')
        : err?.code === 'ALREADY_COLLABORATOR' ? t('settings.already_collaborator', 'هذا الشخص مشرف بالفعل')
        : err?.code === 'ALREADY_INVITED' ? t('settings.already_invited', 'توجد دعوة معلقة لهذا البريد')
        : err?.message || t('common.error', 'حدث خطأ');
      toast({ title: t('common.error', 'خطأ'), description: msg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (id: string, type: 'collaborator' | 'invitation') => {
    try {
      await familyInvitationsApi.remove(id);
      toast({ title: t('common.success', 'تم بنجاح') });
      fetchData();
    } catch (e: any) {
      toast({ title: t('common.error', 'خطأ'), description: e?.message, variant: 'destructive' });
    }
  };

  if (!isOwner) {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border text-center py-16">
        <span className="material-symbols-outlined text-muted-foreground text-4xl mb-4 block">admin_panel_settings</span>
        <p className="text-muted-foreground">{t('settings.admins_owner_only', 'فقط مالك الشجرة يمكنه إدارة المشرفين')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border flex items-center justify-center py-16">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Collaborators */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">group</span>
            <div>
              <h3 className="font-bold text-lg text-foreground">{t('settings.collaborators', 'المشرفون')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.collaborators_desc', 'الأشخاص الذين يمكنهم إدارة هذه الشجرة')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowInviteForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            {t('settings.invite_new', 'دعوة مشرف')}
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <form onSubmit={handleInvite} className="mb-6 p-4 bg-muted rounded-xl border border-border flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t('settings.invite_email_placeholder', 'أدخل البريد الإلكتروني...')}
              className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {sending ? t('common.sending', 'جاري الإرسال...') : t('settings.send_invite', 'إرسال')}
            </button>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              {t('common.cancel', 'إلغاء')}
            </button>
          </form>
        )}

        {/* Collaborators List */}
        {collaborators.length === 0 && invitations.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-muted-foreground text-3xl mb-3 block">person_off</span>
            <p className="text-sm text-muted-foreground">{t('settings.no_collaborators', 'لا يوجد مشرفون حالياً')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {collaborators.map((collab) => (
              <div key={collab.id} className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                    {(collab.first_name?.[0] || collab.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {collab.first_name || collab.last_name ? `${collab.first_name || ''} ${collab.last_name || ''}`.trim() : collab.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{collab.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">{t('settings.role_editor', 'مشرف')}</span>
                  <button
                    onClick={() => handleRemove(collab.id, 'collaborator')}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title={t('settings.remove_collaborator', 'إزالة')}
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Pending Invitations */}
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-dashed border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{inv.invited_email}</p>
                    <p className="text-xs text-muted-foreground">{t('settings.invitation_pending', 'بانتظار القبول')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full font-bold">
                    {t('settings.pending', 'معلقة')}
                  </span>
                  <button
                    onClick={() => handleRemove(inv.id, 'invitation')}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title={t('settings.revoke_invitation', 'إلغاء الدعوة')}
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorsTab;
