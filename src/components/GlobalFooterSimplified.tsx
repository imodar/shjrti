import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { 
  TreePine, 
  Crown, 
  Shield, 
  Heart, 
  Star, 
  Gem,
  Home,
  BarChart3,
  Settings,
  CreditCard,
  UserCircle,
  Building2
} from "lucide-react";

export const GlobalFooterSimplified = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  // Function to get page-specific icons
  const getPageIcon = () => {
    switch (location.pathname) {
      case '/':
        return Home;
      case '/dashboard':
      case '/dashboard-backup':
        return BarChart3;
      case '/family-creator':
      case '/family-builder':
      case '/family-tree-view':
        return TreePine;
      case '/family-statistics':
        return BarChart3;
      case '/profile':
        return UserCircle;
      case '/payments':
      case '/payment':
        return CreditCard;
      case '/plan-selection':
        return Crown;
      case '/auth':
        return Shield;
      case '/admin-panel':
      case '/enhanced-admin-panel':
        return Settings;
      case '/store':
        return Building2;
      default:
        return TreePine;
    }
  };

  const PageIcon = getPageIcon();

  return (
    <footer className="relative overflow-hidden">
      {/* Luxury Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.1),transparent_50%)]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-4 right-8 w-12 h-12 bg-emerald-500/10 rounded-full animate-pulse blur-xl"></div>
      <div className="absolute bottom-4 left-8 w-8 h-8 bg-amber-500/10 rounded-full animate-bounce blur-xl"></div>

      <div className="relative z-10">
        {/* Simplified Footer Content */}
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
            
            {/* Brand Section */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-50"></div>
                <PageIcon className="relative h-6 w-6 md:h-8 md:w-8 text-emerald-400" />
              </div>
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {t('footer_brand_name', 'شجرة العائلة')}
              </span>
              <div className="flex items-center gap-2 text-emerald-400">
                <Crown className="h-4 w-4" />
                <span className="text-xs font-medium hidden sm:block">{t('footer_brand_badge', 'الأفضل في المنطقة')}</span>
              </div>
            </div>
            
            {/* Trust Badges & Copyright */}
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 text-center md:text-right">
              <div className="flex items-center gap-4 text-gray-300 text-xs md:text-sm">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-emerald-400" />
                  <span className="hidden sm:block">{t('footer_trust_data', 'حماية البيانات معتمدة')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-400" />
                  <span className="hidden sm:block">{t('footer_trust_rating', 'تقييم ٥ نجوم')}</span>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-400 text-xs md:text-sm">
                <p>{t('footer_copyright', '© ٢٠٢٤ شجرة العائلة. جميع الحقوق محفوظة.')}</p>
                <span className="flex items-center gap-1">
                  <Gem className="h-3 w-3 text-emerald-400" />
                  <span className="hidden md:block">{t('footer_made_with_love', 'صنع بحب في الشرق الأوسط')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};