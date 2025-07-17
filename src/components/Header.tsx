import { Button } from "@/components/ui/button";
import { TreePine, User, LogIn, LogOut, Settings, CreditCard, HelpCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import familyTreeLogo from "@/assets/family-tree-logo.png";

const Header = () => {
  const { user, signOut } = useAuth();
  const { t, direction } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      {/* Simple Header Container */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Simple Logo Section */}
          <div className={`flex items-center gap-3 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
            {/* Clean Logo */}
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <img 
                src={familyTreeLogo} 
                alt={t('site.name', 'شجرتي')} 
                className="h-6 w-6 rounded object-cover"
              />
            </div>
            
            {/* Brand Name */}
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {t('site.name', 'شجرتي')}
              </h1>
            </div>
          </div>

          {/* Clean Navigation */}
          <nav className={`hidden lg:flex items-center gap-1 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
            <a href="#features" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
              {t('nav.features', 'المميزات')}
            </a>
            <a href="#how-it-works" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
              {t('nav.how-it-works', 'كيف يعمل')}
            </a>
            <a href="#pricing" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
              {t('nav.pricing', 'الأسعار')}
            </a>
            <a href="#contact" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
              {t('nav.contact', 'تواصل معنا')}
            </a>
          </nav>

          {/* Clean Auth Section */}
          <div className={`flex items-center gap-4 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
            {/* Language Switcher */}
            <LanguageSwitcher />
              
              {user ? (
                <div className="flex items-center gap-4">
                  {/* Creative User Avatar Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="relative group cursor-pointer">
                        {/* Floating avatar container with multiple layers */}
                        <div className="absolute inset-0 w-12 h-12 bg-gradient-to-r from-primary via-accent to-secondary rounded-full blur-lg opacity-40 group-hover:opacity-70 animate-pulse transition-all duration-500"></div>
                        
                        {/* Main avatar ring */}
                        <div className="relative w-12 h-12 p-[2px] bg-gradient-to-r from-primary via-accent to-secondary rounded-full group-hover:scale-110 transition-all duration-500">
                          <div className="w-full h-full bg-background rounded-full p-[2px]">
                            <Avatar className="h-full w-full">
                              <AvatarImage src={user.user_metadata?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-sm">
                                {user.email?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        
                        {/* Status indicator */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                        
                        {/* Hover sparkle effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-accent animate-bounce" style={{animationDelay: '0s'}} />
                          <Sparkles className="absolute -bottom-1 -left-2 h-3 w-3 text-primary animate-bounce" style={{animationDelay: '0.5s'}} />
                          <Sparkles className="absolute top-1 -right-3 h-2 w-2 text-secondary animate-bounce" style={{animationDelay: '1s'}} />
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent 
                      className="w-64 mt-2 bg-background/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl rounded-2xl p-2" 
                      align="end"
                      sideOffset={8}
                    >
                      {/* User Info Header */}
                      <DropdownMenuLabel className="p-4 pb-2">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.user_metadata?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                                {user.email?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-background"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      
                      <DropdownMenuSeparator className="bg-border/50" />
                      
                      {/* Menu Items */}
                      <DropdownMenuItem className="group p-3 rounded-xl hover:bg-primary/10 transition-all duration-300 cursor-pointer" asChild>
                        <a href="/dashboard" className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <TreePine className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{t('nav.dashboard', 'لوحة التحكم')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.dashboard.desc', 'إدارة شجرة العائلة')}</p>
                          </div>
                        </a>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="group p-3 rounded-xl hover:bg-accent/10 transition-all duration-300 cursor-pointer" asChild>
                        <a href="/profile" className="flex items-center gap-3">
                          <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                            <Settings className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium">{t('nav.settings', 'الإعدادات')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.settings.desc', 'تخصيص الحساب')}</p>
                          </div>
                        </a>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="group p-3 rounded-xl hover:bg-secondary/10 transition-all duration-300 cursor-pointer" asChild>
                        <a href="/payments" className="flex items-center gap-3">
                          <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                            <CreditCard className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium">{t('nav.billing', 'الفواتير')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.billing.desc', 'إدارة الاشتراكات')}</p>
                          </div>
                        </a>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="group p-3 rounded-xl hover:bg-primary/10 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-3 w-full">
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <HelpCircle className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{t('nav.help', 'المساعدة')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.help.desc', 'الدعم والتوجيه')}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="bg-border/50" />
                      
                      {/* Logout */}
                      <DropdownMenuItem 
                        className="group p-3 rounded-xl hover:bg-destructive/10 transition-all duration-300 cursor-pointer text-destructive focus:text-destructive"
                        onClick={signOut}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="p-2 bg-destructive/10 rounded-lg group-hover:bg-destructive/20 transition-colors">
                            <LogOut className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium">{t('nav.logout', 'تسجيل الخروج')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.logout.desc', 'إنهاء الجلسة')}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Simple Login Button */}
                <Button variant="ghost" size="sm" asChild>
                  <a href="/auth" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>{t('nav.login', 'تسجيل الدخول')}</span>
                  </a>
                </Button>
                
                {/* Simple Register Button */}
                <Button size="sm" asChild>
                  <a href="/auth" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{t('nav.register', 'إنشاء حساب')}</span>
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;