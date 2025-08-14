import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TreePine, User, LogIn, LogOut, Settings, CreditCard, HelpCircle, Sparkles, Mail, Home, Globe, ChevronDown, Crown, Menu, X, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import familyTreeLogo from "@/assets/family-tree-logo.png";

export const GlobalHeader = () => {
  const { user, signOut } = useAuth();
  const { t, direction, setLanguage, languages, currentLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(!!data && data.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 social-nav">
      <div className="relative z-10 border-b border-border/20">
        {/* Modern Social Media Header Container */}
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between h-12">
            {/* Clean Modern Logo Section */}
            <Link to="/" className={`flex items-center gap-3 group ${direction === 'rtl' ? 'font-arabic' : ''}`}>
              <div className="relative">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <img 
                    src={familyTreeLogo} 
                    alt={t('site.name', 'شجرة العائلة')} 
                    className="h-6 w-6 rounded object-cover"
                  />
                </div>
              </div>
              
              {/* Clean Brand Name */}
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                  {t('site.name', 'شجرة العائلة')}
                </h1>
              </div>
            </Link>

            {/* Modern Desktop Navigation */}
            <div className={`hidden md:flex items-center gap-6 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
              
              {user ? (
                // Clean Authenticated User Section
                <>
                  {/* Admin Panel Link - Clean modern style */}
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200"
                    >
                      <Shield className="h-4 w-4" />
                      <span>{t('nav.admin', 'لوحة الإدارة')}</span>
                    </Link>
                  )}

                  {/* Dashboard Link */}
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200"
                  >
                    <Home className="h-4 w-4" />
                    <span>{t('nav.dashboard', 'لوحة التحكم')}</span>
                  </Link>

                  {/* Contact Us Link */}
                  <a 
                    href="#contact" 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{t('nav.contact', 'تواصل معنا')}</span>
                  </a>

                  {/* Clean Modern Avatar Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="relative group cursor-pointer">
                        <Avatar className="h-9 w-9 border border-border hover:border-primary transition-colors duration-200">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Simple status indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background"></div>
                      </div>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent 
                      className="w-64 mt-2 bg-card border border-border shadow-lg rounded-lg p-2" 
                      align="end"
                      sideOffset={8}
                    >
                      {/* Clean User Info Header */}
                      <DropdownMenuLabel className="p-3 pb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                              {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
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
                      
                      <DropdownMenuSeparator />
                      
                      {/* Clean Modern Menu Items */}
                      <DropdownMenuItem className="p-2 rounded-md hover:bg-accent transition-colors duration-200 cursor-pointer" asChild>
                        <Link to="/dashboard" className={`flex items-center gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="p-2 bg-primary/10 rounded-md">
                            <TreePine className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{t('nav.dashboard', 'لوحة التحكم')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.dashboard.desc', 'إدارة شجرة العائلة')}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="p-2 rounded-md hover:bg-accent transition-colors duration-200 cursor-pointer" asChild>
                        <Link to="/profile" className={`flex items-center gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="p-2 bg-muted rounded-md">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{t('nav.settings', 'الإعدادات')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.settings.desc', 'تخصيص الحساب')}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="p-2 rounded-md hover:bg-accent transition-colors duration-200 cursor-pointer" asChild>
                        <Link to="/payments" className={`flex items-center gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="p-2 bg-muted rounded-md">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{t('nav.billing', 'الفواتير')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.billing.desc', 'إدارة الاشتراكات')}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="p-2 rounded-md hover:bg-accent transition-colors duration-200 cursor-pointer">
                         <div className={`flex items-center gap-3 w-full ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="p-2 bg-muted rounded-md">
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{t('nav.help', 'المساعدة')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.help.desc', 'الدعم والتوجيه')}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {/* Logout */}
                      <DropdownMenuItem 
                        className="p-2 rounded-md hover:bg-destructive/10 transition-colors duration-200 cursor-pointer text-destructive focus:text-destructive"
                        onClick={signOut}
                      >
                        <div className={`flex items-center gap-3 w-full ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="p-2 bg-destructive/10 rounded-md">
                            <LogOut className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium text-destructive text-sm">{t('nav.logout', 'تسجيل الخروج')}</p>
                            <p className="text-xs text-muted-foreground">{t('nav.logout.desc', 'إنهاء الجلسة')}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                // Clean Non-authenticated User Section  
                <div className="flex items-center gap-3">
                  {/* Modern Login Button */}
                  <Button 
                    className="h-9 px-6 text-sm"
                    asChild
                  >
                    <Link to="/auth" className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      <span>{t('nav.login', 'تسجيل الدخول')}</span>
                    </Link>
                  </Button>
                </div>
              )}

              {/* Desktop Language Switcher */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/20 hover:border-white/40 rounded-xl px-4 py-3 backdrop-blur-sm transition-all duration-300 group-hover:scale-105"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="text-sm font-medium">
                          {languages.find(lang => lang.code === currentLanguage)?.name || currentLanguage.toUpperCase()}
                        </span>
                        <ChevronDown className="h-3 w-3 group-hover:rotate-180 transition-transform duration-300" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent 
                    className="w-40 mt-2 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 backdrop-blur-xl shadow-2xl rounded-xl p-2" 
                    align="end"
                    sideOffset={8}
                  >
                    {languages.map((language) => (
                      <DropdownMenuItem 
                        key={language.code}
                        className="group p-3 rounded-lg hover:bg-amber-400/5 transition-all duration-300 cursor-pointer border border-transparent hover:border-amber-400/15"
                        onClick={() => setLanguage(language.code)}
                      >
                        <div className="flex items-center justify-center w-full">
                          <span className="text-white font-medium">{language.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              {/* Mobile Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-3 py-2"
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  className="w-32 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 backdrop-blur-xl shadow-2xl rounded-xl p-2" 
                  align="end"
                  sideOffset={8}
                >
                  {languages.map((language) => (
                    <DropdownMenuItem 
                      key={language.code}
                      className="group p-2 rounded-lg hover:bg-amber-400/5 transition-all duration-300 cursor-pointer"
                      onClick={() => setLanguage(language.code)}
                    >
                      <span className="text-white text-sm">{language.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-3 py-2"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                
                <SheetContent 
                  side={direction === 'rtl' ? 'left' : 'right'}
                  className="w-80 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 border-l border-white/10 p-0"
                >
                  {/* Mobile Sheet Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">{t('nav.menu', 'القائمة')}</h2>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Sheet Content */}
                  <div className="flex flex-col p-6 space-y-4">
                    {user ? (
                      // Authenticated User Mobile Menu
                      <>
                        {/* User Info */}
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                          <Avatar className="h-12 w-12 border-2 border-emerald-400/30">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-400/30 to-teal-400/30 text-emerald-300 font-bold">
                              {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Mobile Navigation Links */}
                        <Link 
                          to="/dashboard" 
                          className={`flex items-center gap-4 p-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="p-2 bg-emerald-400/20 rounded-lg">
                            <TreePine className="h-5 w-5 text-emerald-300" />
                          </div>
                          <span className="font-medium">{t('nav.dashboard', 'لوحة التحكم')}</span>
                        </Link>

                        <Link 
                          to="/profile" 
                          className={`flex items-center gap-4 p-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="p-2 bg-teal-400/20 rounded-lg">
                            <Settings className="h-5 w-5 text-teal-300" />
                          </div>
                          <span className="font-medium">{t('nav.settings', 'الإعدادات')}</span>
                        </Link>

                        <Link 
                          to="/payments" 
                          className={`flex items-center gap-4 p-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="p-2 bg-amber-400/20 rounded-lg">
                            <CreditCard className="h-5 w-5 text-amber-300" />
                          </div>
                          <span className="font-medium">{t('nav.billing', 'الفواتير')}</span>
                        </Link>

                        <a 
                          href="#contact" 
                          className={`flex items-center gap-4 p-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="p-2 bg-teal-400/20 rounded-lg">
                            <Mail className="h-5 w-5 text-teal-300" />
                          </div>
                          <span className="font-medium">{t('nav.contact', 'تواصل معنا')}</span>
                        </a>

                        <button 
                          className={`flex items-center gap-4 p-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="p-2 bg-emerald-400/20 rounded-lg">
                            <HelpCircle className="h-5 w-5 text-emerald-300" />
                          </div>
                          <span className="font-medium">{t('nav.help', 'المساعدة')}</span>
                        </button>

                        {/* Mobile Logout */}
                        <div className="border-t border-white/10 pt-4 mt-4">
                          <button 
                            className={`flex items-center gap-4 p-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 w-full ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              signOut();
                            }}
                          >
                            <div className="p-2 bg-red-500/20 rounded-lg">
                              <LogOut className="h-5 w-5 text-red-400" />
                            </div>
                            <span className="font-medium">{t('nav.logout', 'تسجيل الخروج')}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      // Non-authenticated User Mobile Menu
                      <div className="space-y-4">
                        <Button 
                          className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-400 text-white border-0 rounded-xl px-6 py-4 text-base font-bold shadow-xl"
                          asChild
                        >
                          <Link 
                            to="/auth" 
                            className="flex items-center justify-center gap-3"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="h-5 w-5" />
                            <span>{t('nav.register_now', 'التسجيل الآن')}</span>
                          </Link>
                        </Button>

                        <a 
                          href="#contact" 
                          className={`flex items-center gap-4 p-4 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="p-2 bg-teal-400/20 rounded-lg">
                            <Mail className="h-5 w-5 text-teal-300" />
                          </div>
                          <span className="font-medium">{t('nav.contact', 'تواصل معنا')}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};