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
    <header className="fixed top-0 left-0 right-0 z-50 p-6">
      {/* Advanced Background with Morphing Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 animate-[gradient_6s_ease-in-out_infinite]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.3),transparent_50%)] animate-pulse"></div>
      </div>

      {/* Floating Header Container with Glass Morphism */}
      <div className="relative max-w-7xl mx-auto group">
        {/* Layered Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/60 to-background/50 backdrop-blur-3xl rounded-[2rem] border-2 border-primary/20 shadow-[0_8px_40px_hsl(var(--primary)/0.15)] group-hover:shadow-[0_12px_60px_hsl(var(--primary)/0.25)] transition-all duration-700"></div>
        
        {/* Animated Border Glow */}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-primary via-accent to-secondary p-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="h-full w-full rounded-[calc(2rem-2px)] bg-background/90"></div>
        </div>

        {/* Floating Geometric Elements */}
        <div className="absolute -top-3 left-6 w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-xl rotate-12 animate-[float_3s_ease-in-out_infinite] opacity-40"></div>
        <div className="absolute -top-2 left-20 w-4 h-4 bg-gradient-to-br from-accent to-secondary rounded-full animate-[float_4s_ease-in-out_infinite_0.5s] opacity-50"></div>
        <div className="absolute -top-4 right-8 w-5 h-5 bg-gradient-to-br from-secondary to-primary rounded-lg rotate-45 animate-[float_3.5s_ease-in-out_infinite_1s] opacity-45"></div>
        <div className="absolute -top-1 right-24 w-3 h-3 bg-gradient-to-br from-primary to-secondary rounded-full animate-[float_2.5s_ease-in-out_infinite_1.5s] opacity-60"></div>
        
        {/* Main Header Content with Enhanced Layout */}
        <div className="relative px-10 py-6">
          <div className="flex items-center justify-between">
            {/* Revolutionary Logo Section */}
            <div className={`flex items-center gap-5 group cursor-pointer ${direction === 'rtl' ? 'font-arabic' : ''}`}>
              {/* 3D Logo Container with Multiple Layers */}
              <div className="relative perspective-1000">
                {/* Glow ring */}
                <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-primary via-accent to-secondary rounded-full blur-xl opacity-30 group-hover:opacity-60 animate-spin-slow transition-all duration-700"></div>
                
                {/* Main logo container */}
                <div className="relative w-14 h-14 transform-gpu group-hover:scale-110 group-hover:rotate-y-12 transition-all duration-700 preserve-3d">
                  {/* Background layer */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary rounded-2xl shadow-2xl opacity-90"></div>
                  
                  {/* Middle reflection layer */}
                  <div className="absolute inset-1 bg-gradient-to-tr from-background/20 to-transparent rounded-xl backdrop-blur-sm"></div>
                  
                  {/* Logo image */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl overflow-hidden">
                    <img 
                      src={familyTreeLogo} 
                      alt={t('site.name', 'شجرتي')} 
                      className="h-9 w-9 rounded-full object-cover filter group-hover:brightness-110 transition-all duration-500"
                    />
                  </div>
                  
                  {/* Holographic overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/10 to-accent/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                
                {/* Orbiting particles */}
                <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
                  <div className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full animate-[orbit_4s_linear_infinite] opacity-60"></div>
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full animate-[orbit_5s_linear_infinite_reverse] opacity-50"></div>
                  <div className="absolute bottom-2 left-1/2 w-1 h-1 bg-secondary rounded-full animate-[orbit_3s_linear_infinite] opacity-70"></div>
                </div>
              </div>
              
              {/* Brand Identity with Typography Magic */}
              <div className="space-y-1">
                <h1 className="text-2xl font-bold relative overflow-hidden">
                  <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-[shimmer_3s_ease-in-out_infinite] font-black tracking-tight">
                    {t('site.name', 'شجرتي')}
                  </span>
                  {/* Underline animation */}
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </h1>
                
                <div className="flex items-center gap-3">
                  {/* Animated status indicator */}
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse delay-300"></div>
                    <div className="w-1 h-1 bg-secondary rounded-full animate-pulse delay-700"></div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground/80 font-medium tracking-wide">
                    {t('site.tagline', 'اكتشف جذورك')}
                  </p>
                </div>
              </div>
            </div>

            {/* Futuristic Navigation with Morphing Pills */}
            <nav className={`hidden lg:flex items-center gap-3 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
              <div className="relative flex items-center gap-2 bg-background/50 backdrop-blur-2xl rounded-full p-2 border border-border/50 shadow-lg">
                {/* Navigation items with magnetic effect */}
                <a href="#features" className="relative group px-5 py-3 text-sm font-semibold text-foreground/80 hover:text-primary rounded-full transition-all duration-500 hover:scale-105">
                  <span className="relative z-10">{t('nav.features', 'المميزات')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/15 to-secondary/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </a>
                
                <div className="w-px h-6 bg-border/50"></div>
                
                <a href="#how-it-works" className="relative group px-5 py-3 text-sm font-semibold text-foreground/80 hover:text-accent rounded-full transition-all duration-500 hover:scale-105">
                  <span className="relative z-10">{t('nav.how-it-works', 'كيف يعمل')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-secondary/15 to-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </a>
                
                <div className="w-px h-6 bg-border/50"></div>
                
                <a href="#pricing" className="relative group px-5 py-3 text-sm font-semibold text-foreground/80 hover:text-secondary rounded-full transition-all duration-500 hover:scale-105">
                  <span className="relative z-10">{t('nav.pricing', 'الأسعار')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 via-primary/15 to-accent/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </a>
                
                <div className="w-px h-6 bg-border/50"></div>
                
                <a href="#contact" className="relative group px-5 py-3 text-sm font-semibold text-foreground/80 hover:text-primary rounded-full transition-all duration-500 hover:scale-105">
                  <span className="relative z-10">{t('nav.contact', 'تواصل معنا')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/15 to-accent/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
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
                <div className="flex items-center gap-4">
                  {/* Enhanced Login Button */}
                  <Button variant="ghost" size="sm" className="relative group bg-background/30 hover:bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-primary/50 transition-all duration-500 px-6 py-3" asChild>
                    <a href="/auth" className="flex items-center gap-3">
                      <div className="relative">
                        <LogIn className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                        <div className="absolute inset-0 bg-primary rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                      </div>
                      <span className="text-foreground/80 group-hover:text-primary font-medium">
                        {t('nav.login', 'تسجيل الدخول')}
                      </span>
                    </a>
                  </Button>
                  
                  {/* Premium Register Button */}
                  <Button size="sm" className="relative group overflow-hidden bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 border-0 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-500 px-6 py-3" asChild>
                    <a href="/auth" className="flex items-center gap-3">
                      {/* Animated background layers */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-accent/80 to-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,white/20,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative flex items-center gap-3">
                        <div className="relative">
                          <User className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-white/30 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <span className="text-white font-semibold">
                          {t('nav.register', 'إنشاء حساب')}
                        </span>
                      </div>
                      
                      {/* Floating sparkles */}
                      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <Sparkles className="absolute top-1 left-2 h-3 w-3 text-white/60 animate-bounce" style={{animationDelay: '0s'}} />
                        <Sparkles className="absolute bottom-1 right-3 h-2 w-2 text-white/40 animate-bounce" style={{animationDelay: '0.7s'}} />
                        <Sparkles className="absolute top-2 right-1 h-2 w-2 text-white/50 animate-bounce" style={{animationDelay: '1.4s'}} />
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

        {/* Advanced Bottom Effects */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full blur-lg animate-pulse"></div>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
      </div>
    </header>
  );
};

export default Header;