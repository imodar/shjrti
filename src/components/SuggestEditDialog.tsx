import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, User, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
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
      toast.error(t("suggestEdit.fillAllFields"));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submitterEmail)) {
      toast.error(t("suggestEdit.invalidEmail"));
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

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to submit suggestion");
      }

      if (!data || !data.suggestionId) {
        throw new Error("Invalid response from server");
      }

      setSuggestionId(data.suggestionId);
      setStep("verify");
      toast.success(t("suggestEdit.codeSent"));
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || t("suggestEdit.submitError"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      toast.error(t("suggestEdit.invalidCode"));
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

      toast.success(t("suggestEdit.submitSuccess"));
      handleClose();
    } catch (error: any) {
      console.error("Verify error:", error);
      if (error.message?.includes("expired")) {
        toast.error(t("suggestEdit.codeExpired"));
      } else if (error.message?.includes("Invalid")) {
        toast.error(t("suggestEdit.wrongCode"));
      } else {
        toast.error(t("suggestEdit.verifyError"));
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
              <DialogTitle>{t("suggestEdit.title")}</DialogTitle>
              <DialogDescription>
                {memberName
                  ? t("suggestEdit.descriptionWithMember").replace("{memberName}", memberName)
                  : t("suggestEdit.descriptionGeneral")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("suggestEdit.yourName")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder={t("suggestEdit.namePlaceholder")}
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("suggestEdit.yourEmail")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("suggestEdit.emailPlaceholder")}
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("suggestEdit.emailHelper")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggestion">{t("suggestEdit.yourSuggestion")}</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="suggestion"
                    placeholder={t("suggestEdit.suggestionPlaceholder")}
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    className="pl-10 min-h-[120px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                {t("suggestEdit.cancel")}
              </Button>
              <Button onClick={handleSubmitSuggestion} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("suggestEdit.submit")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("suggestEdit.verifyTitle")}</DialogTitle>
              <DialogDescription>
                {t("suggestEdit.verifyDescription").replace("{email}", submitterEmail)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("suggestEdit.verificationCode")}</Label>
                <Input
                  id="code"
                  placeholder={t("suggestEdit.codePlaceholder")}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  {t("suggestEdit.codeExpiry")}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("form")} disabled={loading}>
                {t("suggestEdit.back")}
              </Button>
              <Button onClick={handleVerifyCode} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("suggestEdit.verifySubmit")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
