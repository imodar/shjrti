import { Button } from "@/components/ui/button";
import { TreePine, User, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import familyTreeLogo from "@/assets/family-tree-logo.png";

const Header = () => {
  const { user, signOut } = useAuth();
  const { t, direction } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      {/* Floating Header Container */}
      <div className="relative max-w-7xl mx-auto">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl"></div>
        <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 rounded-3xl"></div>
        
        {/* Floating decorative elements */}
        <div className="absolute -top-2 left-8 w-4 h-4 bg-emerald-400/30 rounded-full animate-pulse"></div>
        <div className="absolute -top-1 left-16 w-2 h-2 bg-teal-400/40 rotate-45 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -top-2 right-12 w-3 h-3 bg-cyan-400/35 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Main Header Content */}
        <div className="relative px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section with Enhanced Design */}
            <div className={`flex items-center gap-4 group ${direction === 'rtl' ? 'font-arabic' : ''}`}>
              {/* Animated Logo Container */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all duration-500 animate-pulse"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <img 
                    src={familyTreeLogo} 
                    alt={t('site.name', 'شجرتي')} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Brand Text with Gradient */}
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:via-teal-500 group-hover:to-cyan-500 transition-all duration-500">
                  {t('site.name', 'شجرتي')}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                    {t('site.tagline', 'اكتشف جذورك')}
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Navigation */}
            <nav className={`hidden lg:flex items-center gap-2 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
              <div className="flex items-center gap-1 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl p-1 border border-emerald-200/30 dark:border-emerald-700/30">
                <a href="#features" className="relative px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-200 rounded-xl hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all duration-300 group">
                  <span className="relative z-10">{t('nav.features', 'المميزات')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
                <a href="#how-it-works" className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-xl hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all duration-300 group">
                  <span className="relative z-10">{t('nav.how-it-works', 'كيف يعمل')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
                <a href="#pricing" className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-xl hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all duration-300 group">
                  <span className="relative z-10">{t('nav.pricing', 'الأسعار')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
                <a href="#contact" className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-xl hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all duration-300 group">
                  <span className="relative z-10">{t('nav.contact', 'تواصل معنا')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              </div>
            </nav>

            {/* Enhanced Auth Buttons & Language Switcher */}
            <div className={`flex items-center gap-3 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
              {/* Language Switcher with enhanced design */}
              <div className="relative">
                <LanguageSwitcher />
              </div>
              
              {user ? (
                <div className="flex items-center gap-2">
                  {/* Dashboard Button */}
                  <Button variant="ghost" size="sm" className="relative group bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-emerald-200/30 dark:border-emerald-700/30 hover:border-emerald-300/50 transition-all duration-300" asChild>
                    <a href="/dashboard" className="flex items-center gap-2">
                      <div className="relative">
                        <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                      </div>
                      <span className="text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-200">
                        {t('nav.dashboard', 'لوحة التحكم')}
                      </span>
                    </a>
                  </Button>
                  
                  {/* Logout Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="relative group bg-white/20 hover:bg-red-50/50 backdrop-blur-sm rounded-xl border border-red-200/30 hover:border-red-300/50 transition-all duration-300" 
                    onClick={signOut}
                  >
                    <div className="relative">
                      <LogOut className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-red-500 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    </div>
                    <span className="text-red-600 dark:text-red-400 group-hover:text-red-500 ml-2">
                      {t('nav.logout', 'تسجيل الخروج')}
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Login Button */}
                  <Button variant="ghost" size="sm" className="relative group bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-gray-200/30 dark:border-gray-700/30 hover:border-emerald-300/50 transition-all duration-300" asChild>
                    <a href="/auth" className="flex items-center gap-2">
                      <div className="relative">
                        <LogIn className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300" />
                        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {t('nav.login', 'تسجيل الدخول')}
                      </span>
                    </a>
                  </Button>
                  
                  {/* Register Button with Gradient */}
                  <Button size="sm" className="relative group overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 border-0 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" asChild>
                    <a href="/auth" className="flex items-center gap-2">
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative flex items-center gap-2">
                        <div className="relative">
                          <User className="h-4 w-4 text-white group-hover:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-white/30 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <span className="text-white font-medium">
                          {t('nav.register', 'إنشاء حساب')}
                        </span>
                      </div>
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 -top-[100%] -left-[100%] w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/20 to-transparent rotate-45 group-hover:animate-[shine_0.8s_ease-out] transition-all duration-300"></div>
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom glow effect */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent rounded-full blur-sm"></div>
      </div>
    </header>
  );
};

export default Header;