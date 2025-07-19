import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  TreePine, 
  ArrowRight,
  Heart,
  Users,
  Star,
  Crown,
  Gem,
  Shield,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export function LuxuryFooter() {
  const { t } = useLanguage();

  return (
    <footer className="relative overflow-hidden">
      {/* Luxury Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.1),transparent_50%)]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-10 right-20 w-24 h-24 bg-emerald-500/10 rounded-full animate-pulse blur-xl"></div>
      <div className="absolute bottom-16 left-16 w-16 h-16 bg-amber-500/10 rounded-full animate-bounce blur-xl"></div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="md:col-span-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-50"></div>
                  <TreePine className="relative h-10 w-10 text-emerald-400" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {t('footer_brand_name', 'شجرة العائلة')}
                </span>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                {t('footer_brand_description', 'نحفظ تراثك ونبني إرثك الرقمي للأجيال القادمة بأحدث التقنيات وأعلى معايير الجودة')}
              </p>
              <div className="flex items-center gap-3 text-emerald-400">
                <Crown className="h-5 w-5" />
                <span className="text-sm font-medium">{t('footer_brand_badge', 'الأفضل في المنطقة')}</span>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white relative">
                {t('footer_quick_links_title', 'روابط سريعة')}
                <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              </h3>
              <div className="space-y-3">
                <Link to="/" className="group flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-all duration-300">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <span>{t('footer_link_home', 'الرئيسية')}</span>
                </Link>
                <Link to="/dashboard" className="group flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-all duration-300">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <span>{t('footer_link_dashboard', 'لوحة التحكم')}</span>
                </Link>
                <Link to="/family-creator" className="group flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-all duration-300">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <span>{t('footer_link_family_creator', 'إنشاء العائلة')}</span>
                </Link>
                <Link to="/store" className="group flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-all duration-300">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <span>{t('footer_link_store', 'المتجر')}</span>
                </Link>
              </div>
            </div>
            
            {/* Support */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white relative">
                {t('footer_support_title', 'الدعم والمساعدة')}
                <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              </h3>
              <div className="space-y-3">
                <Link to="/terms" className="group flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-all duration-300">
                  <Shield className="h-4 w-4" />
                  <span>{t('footer_link_terms', 'الشروط والأحكام')}</span>
                </Link>
                <Link to="/plan-selection" className="group flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-all duration-300">
                  <Crown className="h-4 w-4" />
                  <span>{t('footer_link_plans', 'خطط الاشتراك')}</span>
                </Link>
                <Link to="/profile" className="group flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-all duration-300">
                  <Users className="h-4 w-4" />
                  <span>{t('footer_link_profile', 'الملف الشخصي')}</span>
                </Link>
              </div>
            </div>
            
            {/* Social & Contact */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white relative">
                {t('footer_contact_title', 'تواصل معنا')}
                <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              </h3>
              
              {/* Social Links */}
              <div className="flex gap-3">
                <a href="#" className="group relative w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg">
                  <Heart className="h-5 w-5 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
                </a>
                <a href="#" className="group relative w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
                </a>
                <a href="#" className="group relative w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg">
                  <Star className="h-5 w-5 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
                </a>
              </div>
              
              {/* Newsletter */}
              <div className="space-y-3">
                <h5 className="text-white font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  {t('footer_newsletter_title', 'النشرة الإخبارية')}
                </h5>
                <div className="flex gap-2">
                  <Input 
                    placeholder={t('footer_newsletter_placeholder', 'بريدك الإلكتروني')}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 backdrop-blur-sm"
                  />
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-0 shadow-lg">
                    {t('footer_newsletter_subscribe', 'اشتراك')}
                  </Button>
                </div>
              </div>
              
              {/* Trust Badges */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span>{t('footer_trust_data', 'حماية البيانات معتمدة')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span>{t('footer_trust_rating', 'تقييم ٥ نجوم من العملاء')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Luxury Bottom Bar */}
        <div className="border-t border-gray-700/50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-gray-400">
                <p>{t('footer_copyright', '© ٢٠٢٤ شجرة العائلة. جميع الحقوق محفوظة.')}</p>
              </div>
              <div className="flex items-center gap-6 text-gray-400 text-sm">
                <span className="flex items-center gap-2">
                  <Gem className="h-4 w-4 text-emerald-400" />
                  {t('footer_made_with_love', 'صنع بحب في الشرق الأوسط')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}