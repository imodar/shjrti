import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, AlertTriangle, CheckCircle, Globe, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Family } from "../../types/family.types";

interface CustomDomainCardProps {
  familyData: Family;
}

export const CustomDomainCard: React.FC<CustomDomainCardProps> = ({ 
  familyData 
}) => {
  const { toast } = useToast();
  const { subscription } = useSubscription();
  
  const [customDomain, setCustomDomain] = useState(familyData?.custom_domain || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [hasCustomDomainFeature, setHasCustomDomainFeature] = useState(false);
  const [checkingFeature, setCheckingFeature] = useState(true);
  const [sharePassword, setSharePassword] = useState(familyData?.share_password || "");
  const [isPasswordProtected, setIsPasswordProtected] = useState(!!familyData?.share_password);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Check if user's package has custom domains enabled
  useEffect(() => {
    const checkCustomDomainFeature = async () => {
      setCheckingFeature(true);
      try {
        // Get current user's active subscription
        const { data: userSub, error: subError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            packages(
              custom_domains_enabled,
              name
            )
          `)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('status', 'active')
          .single();
          
        if (userSub && userSub.packages && !subError) {
          setHasCustomDomainFeature(userSub.packages.custom_domains_enabled);
        } else {
          setHasCustomDomainFeature(false);
        }
      } catch (error) {
        console.error('Error checking custom domain feature:', error);
        setHasCustomDomainFeature(false);
      } finally {
        setCheckingFeature(false);
      }
    };

    checkCustomDomainFeature();
  }, []);

  // Domain validation
  const validateDomain = async (domain: string) => {
    if (!domain) return true;
    
    setIsValidating(true);
    setValidationError("");
    
    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      setValidationError("تنسيق النطاق غير صحيح");
      setIsValidating(false);
      return false;
    }
    
    try {
      // Check if domain is already taken
      const { data: existingDomain } = await supabase
        .from('families')
        .select('id')
        .eq('custom_domain', domain)
        .neq('id', familyData.id)
        .single();
        
      if (existingDomain) {
        setValidationError("هذا النطاق مستخدم بالفعل");
        setIsValidating(false);
        return false;
      }
    } catch (error) {
      // If no existing domain found, that's good
    }
    
    setIsValidating(false);
    return true;
  };

  const handleSaveCustomDomain = async () => {
    if (!(await validateDomain(customDomain))) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({ custom_domain: customDomain || null })
        .eq('id', familyData.id);
        
      if (error) throw error;
      
      toast({
        title: "تم حفظ النطاق المخصص",
        description: customDomain ? `تم تعيين النطاق: ${customDomain}` : "تم إزالة النطاق المخصص"
      });
      
      setIsEditing(false);
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

  const handlePasswordUpdate = async () => {
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({ share_password: isPasswordProtected ? sharePassword : null })
        .eq('id', familyData.id);
        
      if (error) throw error;
      
      toast({
        title: isPasswordProtected ? "تم تفعيل حماية كلمة المرور" : "تم إلغاء حماية كلمة المرور",
        description: isPasswordProtected ? "الشجرة محمية بكلمة مرور الآن" : "الشجرة متاحة بدون كلمة مرور"
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "خطأ في تحديث كلمة المرور",
        description: "حدث خطأ أثناء تحديث إعدادات كلمة المرور",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (checkingFeature) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            النطاق المخصص
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          النطاق المخصص
        </CardTitle>
        <CardDescription>
          استخدم نطاقك الخاص لعرض شجرة العائلة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasCustomDomainFeature ? (
          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                ميزة النطاق المخصص غير متاحة
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              قم بترقية باقتك للحصول على إمكانية استخدام نطاق مخصص لشجرة عائلتك
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-domain">النطاق المخصص</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="custom-domain"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="example.com"
                  disabled={!isEditing || isLoading}
                />
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveCustomDomain} 
                      disabled={isLoading || isValidating}
                      size="sm"
                    >
                      {isLoading ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setCustomDomain(familyData?.custom_domain || "");
                        setValidationError("");
                      }}
                      size="sm"
                    >
                      إلغاء
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    size="sm"
                  >
                    تعديل
                  </Button>
                )}
              </div>
              {validationError && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {validationError}
                </div>
              )}
              {isValidating && (
                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  جاري التحقق من النطاق...
                </div>
              )}
            </div>
            
            {familyData?.custom_domain && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    النطاق المخصص نشط: {familyData.custom_domain}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
        <Separator />
        
        {/* Password Protection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">حماية بكلمة مرور</Label>
              <p className="text-sm text-muted-foreground">
                احمِ شجرة عائلتك بكلمة مرور للوصول المحدود
              </p>
            </div>
            <Button
              variant={isPasswordProtected ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPasswordProtected(!isPasswordProtected)}
            >
              <Lock className="h-4 w-4 mr-2" />
              {isPasswordProtected ? "مفعل" : "غير مفعل"}
            </Button>
          </div>
          
          {isPasswordProtected && (
            <div className="space-y-2">
              <Label htmlFor="share-password">كلمة المرور</Label>
              <div className="flex gap-2">
                <Input
                  id="share-password"
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="أدخل كلمة مرور قوية"
                />
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={isUpdatingPassword || !sharePassword.trim()}
                  size="sm"
                >
                  {isUpdatingPassword ? "جاري التحديث..." : "تحديث"}
                </Button>
              </div>
            </div>
          )}
          
          {!isPasswordProtected && sharePassword && (
            <Button
              onClick={handlePasswordUpdate}
              disabled={isUpdatingPassword}
              size="sm"
              variant="outline"
            >
              {isUpdatingPassword ? "جاري الإزالة..." : "إزالة كلمة المرور"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};