import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Lightbulb,
  Search,
  Check,
  X,
  Trash2,
  Eye,
  Calendar,
  User,
  ExternalLink,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { FamilyHeader } from "@/components/FamilyHeader";
import { FamilyDataProvider, useFamilyData } from "@/contexts/FamilyDataContext";
import { suggestionsApi, type Suggestion } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

// Using Suggestion type from API

const FamilySuggestionsContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, direction, currentLanguage } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');
  
  // Use FamilyDataContext for family data and members
  const { familyData, familyMembers, loading: dataLoading, error } = useFamilyData();
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Handle authentication and authorization
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!familyId) {
      navigate('/dashboard');
      return;
    }
  }, [authLoading, user, familyId, navigate]);

  // Handle family data errors
  useEffect(() => {
    if (error) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على العائلة أو ليس لديك صلاحية للوصول إليها",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [error, navigate, toast]);

  // Load suggestions using API
  const loadSuggestions = useCallback(async () => {
    if (!familyId) return;
    
    try {
      const data = await suggestionsApi.listByFamily(familyId);
      setSuggestions(data || []);
    } catch (error) {
      console.error("Error loading suggestions:", error);
      sonnerToast.error(t('suggestions.load_error'));
    }
  }, [familyId, t]);

  useEffect(() => {
    if (familyId) {
      loadSuggestions();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel("suggestions-page-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tree_edit_suggestions",
            filter: `family_id=eq.${familyId}`,
          },
          () => {
            loadSuggestions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [familyId]);

  const handleAction = async (suggestion: Suggestion, action: "accept" | "reject") => {
    setSelectedSuggestion(suggestion);
    setActionType(action);
    setAdminNotes("");
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedSuggestion || !actionType) return;

    setActionLoading(selectedSuggestion.id);

    try {
      // Update suggestion status using API
      if (actionType === "accept") {
        await suggestionsApi.accept(selectedSuggestion.id, adminNotes.trim() || undefined);
      } else {
        await suggestionsApi.reject(selectedSuggestion.id, adminNotes.trim() || undefined);
      }

      // Send notification email
      const { error: notifyError } = await supabase.functions.invoke("notify-suggestion-status", {
        body: {
          suggestionId: selectedSuggestion.id,
          status: actionType === "accept" ? "accepted" : "rejected",
          adminNotes: adminNotes.trim() || null,
        },
      });

      if (notifyError) {
        console.error("Notification error:", notifyError);
        sonnerToast.warning(t('suggestions.notification_failed'));
      } else {
        sonnerToast.success(
          actionType === "accept"
            ? t('suggestions.accepted_notified')
            : t('suggestions.rejected_notified')
        );
      }

      setDialogOpen(false);
      loadSuggestions();
    } catch (error) {
      console.error("Action error:", error);
      sonnerToast.error(t('suggestions.process_error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (suggestionId: string) => {
    if (!confirm(t('suggestions.delete_confirm'))) return;

    setActionLoading(suggestionId);

    try {
      await suggestionsApi.delete(suggestionId);
      sonnerToast.success(t('suggestions.deleted_success'));
      loadSuggestions();
    } catch (error) {
      console.error("Delete error:", error);
      sonnerToast.error(t('suggestions.delete_error'));
    } finally {
      setActionLoading(null);
    }
  };

  // Filter suggestions
  const filteredSuggestions = suggestions.filter((s) => {
    const matchesStatus = filterStatus === "all" ? true : s.status === filterStatus;
    const matchesSearch = searchQuery.trim() === "" 
      ? true 
      : s.submitter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.submitter_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.suggestion_text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      under_review: "secondary",
      accepted: "default",
      rejected: "destructive",
    };

    const statusKey = `suggestions.status.${status}` as const;

    return (
      <Badge variant={variants[status] || "outline"}>
        {t(statusKey)}
      </Badge>
    );
  };

  // Statistics
  const stats = {
    total: suggestions.length,
    pending: suggestions.filter((s) => s.status === "pending").length,
    accepted: suggestions.filter((s) => s.status === "accepted").length,
    rejected: suggestions.filter((s) => s.status === "rejected").length,
  };

  const generationCount = 0;

  if (dataLoading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir={direction}>
        <GlobalHeader />
        
        <main className="relative z-10 pt-20 flex-1">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </main>
        
        <GlobalFooterSimplified />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir={direction}>
      <GlobalHeader />
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      <main className="relative z-10 pt-20 flex-1">
        {/* Family Header */}
        <div className="container mx-auto px-4">
          <FamilyHeader 
            familyData={familyData}
            familyId={familyId}
            familyMembers={familyMembers}
            generationCount={generationCount}
            onSettingsClick={() => navigate(`/family-builder-new?family=${familyId}&settings=true`)}
          />
        </div>
        
        {/* Content Section */}
        <section className="py-8 relative">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            {/* Header Card */}
            <div className="relative max-w-5xl mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
              
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-4 sm:py-6 sm:px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      {t('suggestions.page_title')}
                    </h1>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    {t('suggestions.page_description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-5xl mx-auto">
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.total}</p>
                  <p className="text-xs text-gray-500">{t('suggestions.stats.total')}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-amber-200/30 dark:border-amber-700/30 shadow-xl">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  <p className="text-xs text-gray-500">{t('suggestions.stats.pending')}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-green-200/30 dark:border-green-700/30 shadow-xl">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                  <p className="text-xs text-gray-500">{t('suggestions.stats.accepted')}</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-red-200/30 dark:border-red-700/30 shadow-xl">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                  <p className="text-xs text-gray-500">{t('suggestions.stats.rejected')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Search */}
            <div className="max-w-5xl mx-auto mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('suggestions.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-10 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                    <SelectValue placeholder={t('suggestions.filter_by_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('suggestions.status.all')}</SelectItem>
                    <SelectItem value="pending">{t('suggestions.status.pending')}</SelectItem>
                    <SelectItem value="under_review">{t('suggestions.status.under_review')}</SelectItem>
                    <SelectItem value="accepted">{t('suggestions.status.accepted')}</SelectItem>
                    <SelectItem value="rejected">{t('suggestions.status.rejected')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Suggestions List */}
            <div className="max-w-5xl mx-auto space-y-4">
              {filteredSuggestions.length === 0 ? (
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('suggestions.no_suggestions_found')}</p>
                  </CardContent>
                </Card>
              ) : (
                filteredSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Status Header Strip */}
                    <div className={`h-1.5 ${
                      suggestion.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                      suggestion.status === 'accepted' ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
                      'bg-gradient-to-r from-rose-400 to-pink-400'
                    }`} />
                    
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {/* Top Row: Status, Type, Member */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(suggestion.status)}
                            <Badge variant="outline" className="text-xs font-medium bg-background/50">
                              {suggestion.suggestion_type.replace("_", " ")}
                            </Badge>
                          </div>
                          
                          {/* Member Link */}
                          {suggestion.family_tree_members && (
                            <button
                              onClick={() => navigate(`/family-builder-new?family=${familyId}&member=${suggestion.member_id}`)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors group/member"
                            >
                              <User className="h-3.5 w-3.5" />
                              <span className="text-sm font-medium group-hover/member:underline">
                                {suggestion.family_tree_members.name}
                              </span>
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover/member:opacity-100 transition-opacity" />
                            </button>
                          )}
                        </div>

                        {/* Submitter Section */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {suggestion.submitter_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{t('suggestions.submitter_name') || 'الاسم'}:</span>
                              <span className="font-medium text-sm truncate">{suggestion.submitter_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{t('suggestions.submitter_email') || 'البريد'}:</span>
                              <span className="text-xs text-muted-foreground truncate">{suggestion.submitter_email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/60 px-2.5 py-1 rounded-full">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(suggestion.created_at), { 
                              addSuffix: true,
                              locale: currentLanguage === 'ar' ? ar : undefined 
                            })}
                          </div>
                        </div>

                        {/* Suggestion Content */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {t('suggestions.suggestion_content') || 'محتوى الاقتراح'}
                          </label>
                          <div className="text-sm bg-gradient-to-br from-muted/80 to-muted/40 p-4 rounded-xl border border-muted-foreground/10 leading-relaxed">
                            {suggestion.suggestion_text}
                          </div>
                        </div>

                        {/* Admin Notes */}
                        {suggestion.admin_notes && (
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {t('suggestions.notes')}
                            </label>
                            <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                              {suggestion.admin_notes}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-muted-foreground/10">
                          {suggestion.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
                                onClick={() => handleAction(suggestion, "accept")}
                                disabled={actionLoading === suggestion.id}
                              >
                                <Check className="h-4 w-4 me-1.5" />
                                {t('suggestions.accept')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/30"
                                onClick={() => handleAction(suggestion, "reject")}
                                disabled={actionLoading === suggestion.id}
                              >
                                <X className="h-4 w-4 me-1.5" />
                                {t('suggestions.reject')}
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(suggestion.id)}
                            disabled={actionLoading === suggestion.id}
                          >
                            {actionLoading === suggestion.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
      
      <GlobalFooterSimplified />

      {/* Action Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" ? t('suggestions.accept_title') : t('suggestions.reject_title')}
            </DialogTitle>
            <DialogDescription>
              {actionType === "accept"
                ? t('suggestions.accept_desc')
                : t('suggestions.reject_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Textarea
              placeholder={t('suggestions.add_notes_placeholder')}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('suggestions.cancel')}
            </Button>
            <Button
              onClick={confirmAction}
              disabled={actionLoading !== null}
              variant={actionType === "accept" ? "default" : "destructive"}
            >
              {actionLoading !== null && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('suggestions.confirm')} {actionType === "accept" ? t('suggestions.accept') : t('suggestions.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrapper component with FamilyDataProvider
const FamilySuggestions = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');

  return (
    <FamilyDataProvider familyId={familyId}>
      <FamilySuggestionsContent />
    </FamilyDataProvider>
  );
};

export default FamilySuggestions;
