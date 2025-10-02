import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Check, X, Mail, Calendar, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Suggestion {
  id: string;
  submitter_name: string;
  submitter_email: string;
  suggestion_type: string;
  suggestion_text: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  member_id: string | null;
  family_tree_members?: {
    name: string;
  } | null;
}

interface SuggestedEditsPanelProps {
  familyId: string;
}

export function SuggestedEditsPanel({ familyId }: SuggestedEditsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    loadSuggestions();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel("suggestions-changes")
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
  }, [familyId]);

  const loadSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from("tree_edit_suggestions")
        .select(`
          *,
          family_tree_members (
            name
          )
        `)
        .eq("family_id", familyId)
        .eq("is_email_verified", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error("Error loading suggestions:", error);
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

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
      const { data: { user } } = await supabase.auth.getUser();

      // Update suggestion status
      const { error: updateError } = await supabase
        .from("tree_edit_suggestions")
        .update({
          status: actionType === "accept" ? "accepted" : "rejected",
          admin_notes: adminNotes.trim() || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedSuggestion.id);

      if (updateError) throw updateError;

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
        toast.warning("Suggestion updated, but notification email failed");
      } else {
        toast.success(
          actionType === "accept"
            ? "Suggestion accepted and user notified"
            : "Suggestion rejected and user notified"
        );
      }

      setDialogOpen(false);
      loadSuggestions();
    } catch (error) {
      console.error("Action error:", error);
      toast.error("Failed to process suggestion");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (suggestionId: string) => {
    if (!confirm("Are you sure you want to delete this suggestion?")) return;

    setActionLoading(suggestionId);

    try {
      const { error } = await supabase
        .from("tree_edit_suggestions")
        .delete()
        .eq("id", suggestionId);

      if (error) throw error;

      toast.success("Suggestion deleted");
      loadSuggestions();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete suggestion");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSuggestions = suggestions.filter((s) =>
    filterStatus === "all" ? true : s.status === filterStatus
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      under_review: "secondary",
      accepted: "default",
      rejected: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Suggested Edits</h3>
          <p className="text-sm text-muted-foreground">
            {pendingCount > 0 ? `${pendingCount} pending suggestions` : "No pending suggestions"}
          </p>
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suggestions</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSuggestions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No suggestions found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSuggestions.map((suggestion) => (
            <Card key={suggestion.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(suggestion.status)}
                      <Badge variant="outline">{suggestion.suggestion_type.replace("_", " ")}</Badge>
                      {suggestion.family_tree_members && (
                        <Badge variant="secondary">
                          <Eye className="mr-1 h-3 w-3" />
                          {suggestion.family_tree_members.name}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{suggestion.submitter_name}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{suggestion.submitter_email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    <p className="text-sm bg-muted p-3 rounded-md">{suggestion.suggestion_text}</p>

                    {suggestion.admin_notes && (
                      <div className="text-sm">
                        <span className="font-medium">Notes: </span>
                        <span className="text-muted-foreground">{suggestion.admin_notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {suggestion.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(suggestion, "accept")}
                          disabled={actionLoading === suggestion.id}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(suggestion, "reject")}
                          disabled={actionLoading === suggestion.id}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
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
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" ? "Accept Suggestion" : "Reject Suggestion"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "accept"
                ? "Add optional notes to thank the contributor"
                : "Add optional notes explaining why this suggestion isn't being accepted"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Textarea
              placeholder="Add notes (optional)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={actionLoading !== null}
              variant={actionType === "accept" ? "default" : "destructive"}
            >
              {actionLoading !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {actionType === "accept" ? "Accept" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
