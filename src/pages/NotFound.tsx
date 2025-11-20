import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 max-w-md mx-auto">
        <div className="mb-8">
          <AlertCircle className="w-24 h-24 mx-auto text-destructive mb-4" />
          <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
          <p className="text-2xl text-foreground mb-2">
            {t('error_404.title', 'عفواً، لقد اتبعت رابطاً غير صحيح')}
          </p>
          <p className="text-muted-foreground mb-8">
            {t('error_404.description', 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها')}
          </p>
        </div>
        
        <Button 
          onClick={() => navigate('/')} 
          size="lg"
          className="gap-2"
        >
          <Home className="w-5 h-5" />
          {t('error_404.back_to_home', 'العودة للصفحة الرئيسية')}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
