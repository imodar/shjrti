import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2,
  Plus,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  currentDomain?: string;
  onDomainUpdated: (newDomain: string | null) => void;
}

export const CustomDomainModal: React.FC<CustomDomainModalProps> = ({
  isOpen,
  onClose,
  familyId,
  currentDomain,
  onDomainUpdated
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [customDomain, setCustomDomain] = useState(currentDomain || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [validationSuccess, setValidationSuccess] = useState("");

  const validateDomain = async (domain: string) => {
    if (!domain.trim()) {
      setValidationError("");
      setValidationSuccess("");
      return false;
    }
    
    setIsValidating(true);
    setValidationError("");
    setValidationSuccess("");
    
    try {
      // Basic path validation (only letters, numbers, and hyphens)
      const pathRegex = /^[a-zA-Z0-9-]+$/;
      if (!pathRegex.test(domain)) {
        setValidationError("يمكن استخدام الحروف والأرقام والشرطات فقط (مثال: my-family)");
        return false;
      }
      
      // Check minimum and maximum length
      if (domain.length < 3) {
        setValidationError("يجب أن يكون الرابط 3 أحرف على الأقل");
        return false;
      }
      
      if (domain.length > 30) {
        setValidationError("يجب أن يكون الرابط 30 حرف كحد أقصى");
        return false;
      }
      
      // Check if path is already taken
      const { data: existingDomain } = await supabase
        .from('families')
        .select('id, name')
        .eq('custom_link', domain)
        .neq('id', familyId)
        .maybeSingle();
        
      if (existingDomain) {
        setValidationError(`هذا الرابط مستخدم بالفعل من قبل عائلة أخرى: ${existingDomain.name}`);
        return false;
      }
      
      setValidationSuccess("الرابط متاح ويمكن استخدامه");
      return true;
    } catch (error) {
      console.error('Error validating domain:', error);
      setValidationError("حدث خطأ أثناء التحقق من الرابط");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleDomainChange = (value: string) => {
    setCustomDomain(value);
    if (value !== currentDomain) {
      // Clear previous validation when domain changes
      setValidationError("");
      setValidationSuccess("");
      
      // Auto-validate after 1 second of no typing
      const timeoutId = setTimeout(() => {
        if (value.trim()) {
          validateDomain(value.trim());
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSaveDomain = async () => {
    const domainValue = customDomain.trim();
    
    if (domainValue && !(await validateDomain(domainValue))) {
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({ 
          custom_link: domainValue || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyId);
        
      if (error) throw error;
      
      onDomainUpdated(domainValue || null);
      toast({
        title: domainValue ? "تم حفظ الرابط المخصص" : "تم إزالة الرابط المخصص",
        description: domainValue 
          ? `تم تعيين الرابط: ${domainValue}` 
          : "تم إزالة الرابط المخصص بنجاح"
      });
      onClose();
    } catch (error) {
      console.error('Error saving custom domain:', error);
      toast({
        title: "خطأ في حفظ الرابط",
        description: "حدث خطأ أثناء حفظ الرابط المخصص",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDomain = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({ 
          custom_link: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyId);
        
      if (error) throw error;
      
      setCustomDomain("");
      onDomainUpdated(null);
      toast({
        title: "تم حذف الرابط المخصص",
        description: "تم إزالة الرابط المخصص بنجاح"
      });
      onClose();
    } catch (error) {
      console.error('Error deleting custom domain:', error);
      toast({
        title: "خطأ في حذف الرابط",
        description: "حدث خطأ أثناء حذف الرابط المخصص",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSubdomain = () => {
    // Generate a random path suggestion
    const randomString = Math.random().toString(36).substring(2, 8);
    const suggestion = `family-${randomString}`;
    setCustomDomain(suggestion);
    validateDomain(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            إدارة الرابط المخصص
          </DialogTitle>
          <DialogDescription>
            قم بتعيين رابط مخصص لشجرة عائلتك أو إزالة الرابط الحالي
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Domain Display */}
          {currentDomain && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                الرابط الحالي: <strong>https://shjrti.com/{currentDomain}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Domain Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-domain">الرابط المخصص</Label>
            <div className="flex gap-2 rtl:flex-row-reverse">
              <div className="flex items-center rtl:flex-row-reverse">
                <span className="px-3 py-2 bg-muted text-sm rounded-l-md border border-r-0 rtl:rounded-r-md rtl:rounded-l-none rtl:border-l rtl:border-r-0">
                  https://shjrti.com/
                </span>
                <Input
                  id="custom-domain"
                  value={customDomain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  placeholder="my-family"
                  disabled={isLoading}
                  className="rounded-l-none rtl:rounded-r-none rtl:rounded-l-md focus-visible:ring-0 focus-visible:ring-offset-0 border-input"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSubdomain}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                اقتراح
              </Button>
            </div>
            
            {/* Validation Status */}
            {isValidating && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التحقق من الرابط...
              </div>
            )}
            
            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
            
            {validationSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-700">
                  {validationSuccess}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Help Text */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• يمكن استخدام الحروف الإنجليزية والأرقام والشرطات فقط</p>
            <p>• يجب أن يكون الرابط بين 3 و 30 حرف</p>
            <p>• سيصبح الرابط: https://shjrti.com/[رابطك]</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {currentDomain && (
            <Button
              variant="destructive"
              onClick={handleDeleteDomain}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              حذف الرابط
            </Button>
          )}
          
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          
          <Button
            onClick={handleSaveDomain}
            disabled={isLoading || (customDomain.trim() !== "" && validationError !== "")}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : customDomain.trim() ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {customDomain.trim() ? "حفظ الرابط" : "إزالة الرابط"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};