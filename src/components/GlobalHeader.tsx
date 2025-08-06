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
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Luxury Background matching Footer */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.1),transparent_50%)]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-2 right-20 w-16 h-16 bg-emerald-500/10 rounded-full animate-pulse blur-xl"></div>
      <div className="absolute top-3 left-16 w-12 h-12 bg-amber-500/10 rounded-full animate-bounce blur-xl"></div>
      
      <div className="relative z-10 border-b border-white/10">
        {/* Main Header Container */}
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between h-16">
            {/* Creative Logo Section */}
            <Link to="/" className={`flex items-center gap-4 group ${direction === 'rtl' ? 'font-arabic' : ''}`}>
              <div className="relative">
                {/* Multiple animated background layers */}
                <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur-xl opacity-40 group-hover:opacity-70 animate-pulse transition-all duration-700"></div>
                <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 animate-pulse transition-all duration-500" style={{animationDelay: '0.5s'}}></div>
                
                {/* Logo container with premium styling */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 via-teal-400 to-amber-400 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 border-2 border-white/30">
                  <img 
                    src={familyTreeLogo} 
                    alt={t('site.name', 'شجرة العائلة')} 
                    className="h-9 w-9 rounded object-cover filter brightness-110"
                  />
                  
                  {/* Premium sparkle effects */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-amber-300 animate-bounce" style={{animationDelay: '0s'}} />
                    <Sparkles className="absolute -bottom-2 -left-2 h-3 w-3 text-emerald-300 animate-bounce" style={{animationDelay: '0.3s'}} />
                    <Sparkles className="absolute top-0 -right-3 h-2 w-2 text-teal-300 animate-bounce" style={{animationDelay: '0.6s'}} />
                    <Crown className="absolute -top-3 left-1/2 transform -translate-x-1/2 h-4 w-4 text-amber-300 animate-bounce" style={{animationDelay: '0.9s'}} />
                  </div>
                </div>
                
                {/* Floating ring effect */}
                <div className="absolute inset-0 w-16 h-16 border-2 border-emerald-300/30 rounded-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>
              </div>
              
              {/* Brand Name and Tagline with enhanced styling */}
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-bold text-emerald-300 bg-gradient-to-r from-emerald-300 via-teal-300 to-amber-300 bg-clip-text [background-clip:text] hover:text-transparent group-hover:scale-105 transition-transform duration-500 filter drop-shadow-lg">
                  {t('site.name', 'شجرة العائلة')}
                </h1>
                <p className="hidden sm:block text-sm text-gray-300 font-medium bg-gradient-to-r from-gray-300 to-emerald-200 bg-clip-text text-transparent">
                  {t('site.tagline', 'منصة إدارة الأنساب')}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation and Auth Section */}
            <div className={`hidden md:flex items-center gap-8 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
              
              {user ? (
                // Authenticated User Section
                <>
                  {/* Admin Panel Link - Only show if user is admin */}
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-300 hover:text-amber-300 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 border border-white/10 hover:border-amber-400/30 group"
                    >
                      <Shield className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span>{t('nav.admin', 'لوحة الإدارة')}</span>
                    </Link>
                  )}

                  {/* Dashboard Link */}
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-300 hover:text-emerald-300 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 border border-white/10 hover:border-emerald-400/30 group"
                  >
                    <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span>{t('nav.dashboard', 'لوحة التحكم')}</span>
                  </Link>

                  {/* Contact Us Link */}
                  <a 
                    href="#contact" 
                    className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-300 hover:text-teal-300 rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 border border-white/10 hover:border-teal-400/30 group"
                  >
                    <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span>{t('nav.contact', 'تواصل معنا')}</span>
                  </a>

                  {/* User Avatar Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="relative group cursor-pointer">
                        {/* Premium floating avatar container */}
                        <div className="absolute inset-0 w-14 h-14 bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 rounded-full blur-xl opacity-50 group-hover:opacity-80 animate-pulse transition-all duration-700"></div>
                        
                        {/* Main avatar ring with premium styling */}
                        <div className="relative w-14 h-14 p-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 rounded-full group-hover:scale-110 transition-all duration-700">
                          <div className="w-full h-full bg-gray-900 rounded-full p-[2px]">
                            <Avatar className="h-full w-full">
                              <AvatarImage src={user.user_metadata?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-emerald-400/30 to-teal-400/30 text-emerald-300 font-bold text-sm border border-emerald-400/30">
                                {user.email?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                        
                        {/* Premium status indicator */}
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-gray-900 flex items-center justify-center shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                        
                        {/* Enhanced sparkle effects */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                          <Sparkles className="absolute -top-3 -right-3 h-5 w-5 text-amber-300 animate-bounce" style={{animationDelay: '0s'}} />
                          <Sparkles className="absolute -bottom-2 -left-3 h-4 w-4 text-emerald-300 animate-bounce" style={{animationDelay: '0.4s'}} />
                          <Sparkles className="absolute top-0 -right-4 h-3 w-3 text-teal-300 animate-bounce" style={{animationDelay: '0.8s'}} />
                          <Crown className="absolute -top-4 left-1/2 transform -translate-x-1/2 h-5 w-5 text-amber-300 animate-bounce" style={{animationDelay: '1.2s'}} />
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent 
                      className="w-72 mt-3 bg-gray-900/95 backdrop-blur-xl border-2 border-emerald-400/30 shadow-2xl rounded-2xl p-3" 
                      align="end"
                      sideOffset={10}
                    >
                      {/* User Info Header */}
                      <DropdownMenuLabel className="p-4 pb-3">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-emerald-400/30">
                              <AvatarImage src={user.user_metadata?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-emerald-400/30 to-teal-400/30 text-emerald-300 font-bold">
                                {user.email?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      
                      <DropdownMenuSeparator className="bg-white/10" />
                      
                      {/* Enhanced Menu Items */}
                      <DropdownMenuItem className="group p-4 rounded-xl hover:bg-emerald-400/10 transition-all duration-300 cursor-pointer border border-transparent hover:border-emerald-400/20" asChild>
                        <Link to="/dashboard" className={`flex items-center gap-4 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="p-3 bg-emerald-400/20 rounded-xl group-hover:bg-emerald-400/30 transition-colors border border-emerald-400/30">
                            <TreePine className="h-5 w-5 text-emerald-300" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{t('nav.dashboard', 'لوحة التحكم')}</p>
                            <p className="text-xs text-gray-400">{t('nav.dashboard.desc', 'إدارة شجرة العائلة')}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="group p-4 rounded-xl hover:bg-teal-400/10 transition-all duration-300 cursor-pointer border border-transparent hover:border-teal-400/20" asChild>
                        <Link to="/profile" className={`flex items-center gap-4 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="p-3 bg-teal-400/20 rounded-xl group-hover:bg-teal-400/30 transition-colors border border-teal-400/30">
                            <Settings className="h-5 w-5 text-teal-300" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{t('nav.settings', 'الإعدادات')}</p>
                            <p className="text-xs text-gray-400">{t('nav.settings.desc', 'تخصيص الحساب')}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="group p-4 rounded-xl hover:bg-amber-400/10 transition-all duration-300 cursor-pointer border border-transparent hover:border-amber-400/20" asChild>
                        <Link to="/payments" className={`flex items-center gap-4 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="p-3 bg-amber-400/20 rounded-xl group-hover:bg-amber-400/30 transition-colors border border-amber-400/30">
                            <CreditCard className="h-5 w-5 text-amber-300" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{t('nav.billing', 'الفواتير')}</p>
                            <p className="text-xs text-gray-400">{t('nav.billing.desc', 'إدارة الاشتراكات')}</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="group p-4 rounded-xl hover:bg-emerald-400/20 transition-all duration-300 cursor-pointer border border-transparent hover:border-emerald-400/30">
                         <div className={`flex items-center gap-4 w-full ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="p-3 bg-emerald-400/20 rounded-xl group-hover:bg-emerald-400/30 transition-colors border border-emerald-400/30">
                            <HelpCircle className="h-5 w-5 text-emerald-300" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{t('nav.help', 'المساعدة')}</p>
                            <p className="text-xs text-gray-400">{t('nav.help.desc', 'الدعم والتوجيه')}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="bg-white/10" />
                      
                      {/* Logout */}
                      <DropdownMenuItem 
                        className="group p-4 rounded-xl hover:bg-red-500/20 transition-all duration-300 cursor-pointer text-red-400 focus:text-red-300 border border-transparent hover:border-red-500/30"
                        onClick={signOut}
                      >
                        <div className={`flex items-center gap-4 w-full ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors border border-red-500/30">
                            <LogOut className="h-5 w-5 text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{t('nav.logout', 'تسجيل الخروج')}</p>
                            <p className="text-xs text-gray-400">{t('nav.logout.desc', 'إنهاء الجلسة')}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                // Non-authenticated User Section  
                <div className="flex items-center gap-4">
                  {/* Register/Login Button */}
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-400 text-white border-0 rounded-xl px-8 py-3 text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 backdrop-blur-sm border border-white/20 hover:border-white/40"
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