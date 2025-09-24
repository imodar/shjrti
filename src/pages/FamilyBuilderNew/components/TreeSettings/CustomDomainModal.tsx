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
      // Basic domain format validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        setValidationError("تنسيق النطاق غير صحيح. يرجى إدخال نطاق صالح (مثال: mydomain.com)");
        return false;
      }
      
      // Check if domain is already taken
      const { data: existingDomain } = await supabase
        .from('families')
        .select('id, name')
        .eq('custom_domain', domain)
        .neq('id', familyId)
        .maybeSingle();
        
      if (existingDomain) {
        setValidationError(`هذا النطاق مستخدم بالفعل من قبل عائلة أخرى: ${existingDomain.name}`);
        return false;
      }
      
      setValidationSuccess("النطاق متاح ويمكن استخدامه");
      return true;
    } catch (error) {
      console.error('Error validating domain:', error);
      setValidationError("حدث خطأ أثناء التحقق من النطاق");
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
          custom_domain: domainValue || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyId);
        
      if (error) throw error;
      
      onDomainUpdated(domainValue || null);
      toast({
        title: domainValue ? "تم حفظ النطاق المخصص" : "تم إزالة النطاق المخصص",
        description: domainValue 
          ? `تم تعيين النطاق: ${domainValue}` 
          : "تم إزالة النطاق المخصص بنجاح"
      });
      onClose();
    } catch (error) {
      console.error('Error saving custom domain:', error);
      toast({
        title: "خطأ في حفظ النطاق",
        description: "حدث خطأ أثناء حفظ النطاق المخصص",
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
          custom_domain: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyId);
        
      if (error) throw error;
      
      setCustomDomain("");
      onDomainUpdated(null);
      toast({
        title: "تم حذف النطاق المخصص",
        description: "تم إزالة النطاق المخصص بنجاح"
      });
      onClose();
    } catch (error) {
      console.error('Error deleting custom domain:', error);
      toast({
        title: "خطأ في حذف النطاق",
        description: "حدث خطأ أثناء حذف النطاق المخصص",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSubdomain = () => {
    // Generate a random subdomain suggestion
    const randomString = Math.random().toString(36).substring(2, 8);
    const suggestion = `family-${randomString}.example.com`;
    setCustomDomain(suggestion);
    validateDomain(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            إدارة النطاق المخصص
          </DialogTitle>
          <DialogDescription>
            قم بتعيين نطاق مخصص لشجرة عائلتك أو إزالة النطاق الحالي
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Domain Display */}
          {currentDomain && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                النطاق الحالي: <strong>{currentDomain}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Domain Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-domain">النطاق المخصص</Label>
            <div className="flex gap-2">
              <Input
                id="custom-domain"
                value={customDomain}
                onChange={(e) => handleDomainChange(e.target.value)}
                placeholder="mydomain.com"
                disabled={isLoading}
              />
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
                جاري التحقق من النطاق...
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
            <p>• يجب أن يكون النطاق بتنسيق صحيح (مثال: mydomain.com)</p>
            <p>• تأكد من ملكيتك للنطاق قبل ربطه</p>
            <p>• سيحتاج النطاق إلى إعداد DNS للعمل بشكل صحيح</p>
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
              حذف النطاق
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
            {customDomain.trim() ? "حفظ النطاق" : "إزالة النطاق"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};