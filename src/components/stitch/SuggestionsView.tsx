import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { suggestionsApi, type Suggestion } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast as sonnerToast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Member } from '@/types/family.types';

interface StitchSuggestionsViewProps {
  familyId: string;
  familyMembers: Member[];
}

export const StitchSuggestionsView: React.FC<StitchSuggestionsViewProps> = ({
  familyId,
  familyMembers,
}) => {
  const { t, currentLanguage } = useLanguage();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const loadSuggestions = useCallback(async () => {
    if (!familyId) return;
    try {
      const data = await suggestionsApi.listByFamily(familyId);
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      sonnerToast.error(t('suggestions.load_error', 'Failed to load suggestions'));
    } finally {
      setLoading(false);
    }
  }, [familyId, t]);

  useEffect(() => {
    if (familyId) {
      loadSuggestions();

      const channel = supabase
        .channel('stitch-suggestions-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tree_edit_suggestions',
          filter: `family_id=eq.${familyId}`,
        }, () => {
          loadSuggestions();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [familyId, loadSuggestions]);

  // Stats
  const stats = {
    total: suggestions.length,
    pending: suggestions.filter(s => s.status === 'pending').length,
    accepted: suggestions.filter(s => s.status === 'accepted').length,
    rejected: suggestions.filter(s => s.status === 'rejected').length,
  };

  // Filter
  const filteredSuggestions = suggestions.filter(s => {
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesSearch = !searchQuery.trim() ||
      s.submitter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.submitter_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.suggestion_text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAction = (suggestion: Suggestion, action: 'accept' | 'reject') => {
    setSelectedSuggestion(suggestion);
    setActionType(action);
    setAdminNotes('');
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedSuggestion || !actionType) return;
    setActionLoading(selectedSuggestion.id);

    try {
      if (actionType === 'accept') {
        await suggestionsApi.accept(selectedSuggestion.id, adminNotes.trim() || undefined);
      } else {
        await suggestionsApi.reject(selectedSuggestion.id, adminNotes.trim() || undefined);
      }

      // Send notification email
      await supabase.functions.invoke('notify-suggestion-status', {
        body: {
          suggestionId: selectedSuggestion.id,
          status: actionType === 'accept' ? 'accepted' : 'rejected',
          adminNotes: adminNotes.trim() || null,
        },
      });

      sonnerToast.success(
        actionType === 'accept'
          ? t('suggestions.accepted_notified', 'Suggestion accepted')
          : t('suggestions.rejected_notified', 'Suggestion rejected')
      );
      setDialogOpen(false);
      loadSuggestions();
    } catch (error) {
      console.error('Action error:', error);
      sonnerToast.error(t('suggestions.process_error', 'Failed to process suggestion'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('suggestions.delete_confirm', 'Are you sure you want to delete this suggestion?'))) return;
    setActionLoading(id);
    try {
      await suggestionsApi.delete(id);
      sonnerToast.success(t('suggestions.deleted_success', 'Suggestion deleted'));
      loadSuggestions();
    } catch (error) {
      console.error('Delete error:', error);
      sonnerToast.error(t('suggestions.delete_error', 'Failed to delete'));
    } finally {
      setActionLoading(null);
    }
  };

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return null;
    const member = familyMembers.find(m => m.id === memberId);
    return member?.name || null;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: t('suggestions.status.pending', 'Pending'), borderColor: 'border-l-amber-500', badgeBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', icon: 'schedule' };
      case 'accepted':
        return { label: t('suggestions.status.accepted', 'Accepted'), borderColor: 'border-l-emerald-500', badgeBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'check_circle' };
      case 'rejected':
        return { label: t('suggestions.status.rejected', 'Rejected'), borderColor: 'border-l-red-500', badgeBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', icon: 'cancel' };
      default:
        return { label: status, borderColor: 'border-l-slate-400', badgeBg: 'bg-slate-50 text-slate-600', icon: 'help' };
    }
  };

  if (loading) {
    return (
      <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0F171A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </section>
    );
  }

  return (
    <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0F171A] custom-scrollbar">
      <div className="max-w-5xl mx-auto p-8 space-y-8">
        {/* Hero + Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          {/* Stats Grid - Left */}
          <div className="grid grid-cols-2 gap-4 order-2 lg:order-1">
            {[
              { icon: 'forum', value: stats.total, label: t('suggestions.stats.total', 'Total Suggestions'), color: 'text-slate-400', borderClass: 'border border-slate-100 dark:border-slate-800' },
              { icon: 'schedule', value: stats.pending, label: t('suggestions.stats.pending', 'Pending'), color: 'text-amber-500', borderClass: 'border-b-2 border-amber-500' },
              { icon: 'check_circle', value: stats.accepted, label: t('suggestions.stats.accepted', 'Accepted'), color: 'text-emerald-500', borderClass: 'border border-slate-100 dark:border-slate-800' },
              { icon: 'cancel', value: stats.rejected, label: t('suggestions.stats.rejected', 'Rejected'), color: 'text-red-500', borderClass: 'border border-slate-100 dark:border-slate-800' },
            ].map((stat, i) => (
              <div key={i} className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm flex flex-col items-center ${stat.borderClass}`}>
                <div className={`${stat.color} mb-2`}>
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Hero Header - Right */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden order-1 lg:order-2 lg:w-80">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 flex flex-col items-center text-center justify-center h-full">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">lightbulb</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t('suggestions.page_title', 'Edit Suggestions')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm">
                {t('suggestions.page_description', 'Manage and review information updates suggested by family members and contributors.')}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm outline-none"
              placeholder={t('suggestions.search_placeholder', 'Search suggestions...')}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm px-6 py-3 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[200px] outline-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">{t('suggestions.status.all', 'All Suggestions')}</option>
            <option value="pending">{t('suggestions.status.pending', 'Pending Only')}</option>
            <option value="accepted">{t('suggestions.status.accepted', 'Accepted')}</option>
            <option value="rejected">{t('suggestions.status.rejected', 'Rejected')}</option>
          </select>
        </div>

        {/* Suggestions List */}
        <div className="space-y-6">
          {filteredSuggestions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4 block">lightbulb</span>
              <p className="text-slate-500">{t('suggestions.no_suggestions_found', 'No suggestions found')}</p>
            </div>
          ) : (
            filteredSuggestions.map(suggestion => {
              const statusConfig = getStatusConfig(suggestion.status);
              const memberName = getMemberName(suggestion.member_id) || suggestion.family_tree_members?.name;

              return (
                <div
                  key={suggestion.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden border-l-4 ${statusConfig.borderColor} ${suggestion.status !== 'pending' ? 'opacity-80' : ''}`}
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 ${statusConfig.badgeBg} text-[10px] font-bold rounded-full uppercase tracking-wider`}>
                        {statusConfig.label}
                      </span>
                      <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {suggestion.suggestion_type.replace('_', ' ')}
                      </span>
                    </div>
                    {memberName && (
                      <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <span className="material-symbols-outlined text-lg">person</span>
                        {memberName}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="flex gap-4 items-start mb-6">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <span className="material-symbols-outlined text-2xl">person_outline</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white">{suggestion.submitter_name}</h4>
                          <span className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(suggestion.created_at), {
                              addSuffix: true,
                              locale: currentLanguage === 'ar' ? ar : undefined,
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-3">
                          {suggestion.submitter_email}
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {suggestion.suggestion_text}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {suggestion.admin_notes && (
                      <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-700/30">
                        <p className="text-xs text-amber-700 dark:text-amber-300">{suggestion.admin_notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {suggestion.status === 'pending' ? (
                      <div className="flex gap-3 justify-end">
                        <button
                          className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                          onClick={() => handleAction(suggestion, 'accept')}
                          disabled={actionLoading === suggestion.id}
                        >
                          {actionLoading === suggestion.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-lg">check</span>
                          )}
                          {t('suggestions.accept', 'Accept')}
                        </button>
                        <button
                          className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
                          onClick={() => handleAction(suggestion, 'reject')}
                          disabled={actionLoading === suggestion.id}
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                          {t('suggestions.reject', 'Reject')}
                        </button>
                        <button
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-50"
                          onClick={() => handleDelete(suggestion.id)}
                          disabled={actionLoading === suggestion.id}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className={`flex items-center gap-2 ${suggestion.status === 'accepted' ? 'text-emerald-600' : 'text-red-500'} font-bold text-xs`}>
                          <span className="material-symbols-outlined text-lg">
                            {suggestion.status === 'accepted' ? 'verified' : 'block'}
                          </span>
                          {suggestion.status === 'accepted'
                            ? t('suggestions.reviewed_merged', 'Reviewed and merged by Admin')
                            : t('suggestions.reviewed_rejected', 'Rejected by Admin')}
                        </div>
                        <button
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-50"
                          onClick={() => handleDelete(suggestion.id)}
                          disabled={actionLoading === suggestion.id}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Finalize Suggestion Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="p-8 relative z-10">
              {/* Dialog Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  actionType === 'accept' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'
                }`}>
                  <span className="material-symbols-outlined text-2xl">
                    {actionType === 'accept' ? 'draw' : 'block'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    {actionType === 'accept'
                      ? t('suggestions.accept_title', 'Finalize Suggestion')
                      : t('suggestions.reject_title', 'Reject Suggestion')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('suggestions.dialog_subtitle', 'Review your decision before updating the family tree.')}
                  </p>
                </div>
              </div>

              {/* Dialog Body */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t('suggestions.message_label', 'Message for the contributor (Optional)')}
                  </label>
                  <textarea
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 resize-none transition-all p-4 outline-none"
                    placeholder={t('suggestions.add_notes_placeholder', 'Enter an optional message for the contributor...')}
                    rows={4}
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                  />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg mt-0.5">info</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('suggestions.dialog_info', 'The contributor will be notified of your decision. If accepted, the changes will be automatically merged into the tree.')}
                  </p>
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="flex items-center gap-3 mt-8">
                <button
                  className="flex-1 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  onClick={() => setDialogOpen(false)}
                >
                  {t('suggestions.cancel', 'Cancel')}
                </button>
                <button
                  className={`flex-1 px-6 py-3 text-white text-sm font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    actionType === 'accept'
                      ? 'bg-primary shadow-primary/20'
                      : 'bg-red-500 shadow-red-500/20'
                  }`}
                  onClick={confirmAction}
                  disabled={actionLoading !== null}
                >
                  {actionLoading !== null ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-lg">send</span>
                  )}
                  {t('suggestions.confirm_send', 'Confirm & Send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StitchSuggestionsView;
