import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, User, FileText } from "lucide-react";

interface SuggestEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  memberId?: string;
  memberName?: string;
}

export function SuggestEditDialog({
  isOpen,
  onClose,
  familyId,
  memberId,
  memberName,
}: SuggestEditDialogProps) {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [loading, setLoading] = useState(false);
  const [suggestionId, setSuggestionId] = useState("");

  // Form fields
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [suggestionText, setSuggestionText] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const resetForm = () => {
    setStep("form");
    setSubmitterName("");
    setSubmitterEmail("");
    setSuggestionText("");
    setVerificationCode("");
    setSuggestionId("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmitSuggestion = async () => {
    if (!submitterName.trim() || !submitterEmail.trim() || !suggestionText.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submitterEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-edit-suggestion", {
        body: {
          familyId,
          memberId,
          submitterName: submitterName.trim(),
          submitterEmail: submitterEmail.trim(),
          suggestionType: memberId ? "member_edit" : "general",
          suggestionText: suggestionText.trim(),
        },
      });

      if (error) throw error;

      setSuggestionId(data.suggestionId);
      setStep("verify");
      toast.success("Verification code sent to your email!");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit suggestion. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-edit-suggestion", {
        body: {
          suggestionId,
          verificationCode: verificationCode.trim(),
        },
      });

      if (error) throw error;

      toast.success("Your suggestion has been submitted successfully!");
      handleClose();
    } catch (error: any) {
      console.error("Verify error:", error);
      if (error.message?.includes("expired")) {
        toast.error("Verification code has expired. Please submit again.");
      } else if (error.message?.includes("Invalid")) {
        toast.error("Invalid verification code. Please check and try again.");
      } else {
        toast.error("Failed to verify code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Suggest an Edit</DialogTitle>
              <DialogDescription>
                {memberName
                  ? `Suggest changes for ${memberName}`
                  : "Suggest changes to this family tree"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a verification code to this email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggestion">Your Suggestion</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="suggestion"
                    placeholder="Describe the changes you'd like to suggest..."
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    className="pl-10 min-h-[120px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmitSuggestion} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Suggestion
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Verify Your Email</DialogTitle>
              <DialogDescription>
                We've sent a 6-digit verification code to {submitterEmail}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  The code will expire in 10 minutes
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("form")} disabled={loading}>
                Back
              </Button>
              <Button onClick={handleVerifyCode} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Submit
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
