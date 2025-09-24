import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ErrorPageProps {
  code?: string;
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function ErrorPage({ 
  code = "404", 
  title, 
  message, 
  showHomeButton = true, 
  showBackButton = true,
  onBackClick 
}: ErrorPageProps) {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();

  const defaultTitle = code === "404" ? 
    t('error.not_found_title', 'الصفحة غير موجودة') : 
    t('error.default_title', 'حدث خطأ');
    
  const defaultMessage = code === "404" ? 
    t('error.not_found_message', 'عذراً، الصفحة التي تبحث عنها غير موجودة أو قد تحتاج إلى تجديد اشتراكك للوصول إليها') :
    t('error.default_message', 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى أو التحقق من صلاحية اشتراكك');

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md mx-auto px-4">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-destructive-foreground">{code}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">
                {title || defaultTitle}
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                {message || defaultMessage}
              </p>
            </div>
            
            <div className={`flex flex-col gap-3 pt-4`}>
              <div className={`flex gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'} justify-center`}>
                {showBackButton && (
                  <Button 
                    variant="outline" 
                    onClick={handleBack}
                    className="flex-1 max-w-32"
                  >
                    <ArrowRight className={`h-4 w-4 ${direction === 'rtl' ? '' : 'rotate-180'}`} />
                    {t('error.back_button', 'رجوع')}
                  </Button>
                )}
                {showHomeButton && (
                  <Button 
                    onClick={handleHome}
                    className="flex-1 max-w-32 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  >
                    <Home className="h-4 w-4" />
                    {t('error.home_button', 'الرئيسية')}
                  </Button>
                )}
              </div>
              
              {/* زر للذهاب لصفحة الباقات */}
              <Button 
                onClick={() => navigate('/plan-selection')}
                variant="outline"
                className="w-full border-emerald-500 text-emerald-700 hover:bg-emerald-50"
              >
                📦 عرض الباقات وتجديد الاشتراك
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}