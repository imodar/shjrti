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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className={`flex items-center gap-3 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
          <img 
            src={familyTreeLogo} 
            alt={t('site.name', 'شجرتي')} 
            className="h-10 w-10 rounded-full"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-primary">{t('site.name', 'شجرتي')}</h1>
            <p className="text-xs text-muted-foreground">{t('site.tagline', 'اكتشف جذورك')}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`hidden md:flex items-center gap-6 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
          <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
            {t('nav.features', 'المميزات')}
          </a>
          <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            {t('nav.how-it-works', 'كيف يعمل')}
          </a>
          <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
            {t('nav.pricing', 'الأسعار')}
          </a>
          <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
            {t('nav.contact', 'تواصل معنا')}
          </a>
        </nav>

        {/* Auth Buttons & Language Switcher */}
        <div className={`flex items-center gap-3 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
          <LanguageSwitcher />
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="gap-2" asChild>
                <a href="/dashboard">
                  <User className="h-4 w-4" />
                  {t('nav.dashboard', 'لوحة التحكم')}
                </a>
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                {t('nav.logout', 'تسجيل الخروج')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="gap-2" asChild>
                <a href="/auth">
                  <LogIn className="h-4 w-4" />
                  {t('nav.login', 'تسجيل الدخول')}
                </a>
              </Button>
              <Button size="sm" className="gap-2 hero-gradient border-0" asChild>
                <a href="/auth">
                  <User className="h-4 w-4" />
                  {t('nav.register', 'إنشاء حساب')}
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;