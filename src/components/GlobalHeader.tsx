import { Button } from "@/components/ui/button";
import { TreePine, User, LogIn, LogOut, Settings, CreditCard, HelpCircle, Sparkles, Mail, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "react-router-dom";
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

export const GlobalHeader = () => {
  const { user, signOut } = useAuth();
  const { t, direction } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Creative Logo Section */}
          <Link to="/" className={`flex items-center gap-4 group ${direction === 'rtl' ? 'font-arabic' : ''}`}>
            <div className="relative">
              {/* Animated background glow */}
              <div className="absolute inset-0 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 animate-pulse transition-all duration-500"></div>
              
              {/* Logo container */}
              <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500 border-2 border-white/20 dark:border-gray-700/20">
                <img 
                  src={familyTreeLogo} 
                  alt={t('site.name', 'شجرة العائلة')} 
                  className="h-8 w-8 rounded object-cover"
                />
                
                {/* Sparkle effects on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 animate-bounce" style={{animationDelay: '0s'}} />
                  <Sparkles className="absolute -bottom-1 -left-1 h-2 w-2 text-emerald-400 animate-bounce" style={{animationDelay: '0.5s'}} />
                </div>
              </div>
            </div>
            
            {/* Brand Name and Tagline */}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {t('site.name', 'شجرة العائلة')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                منصة إدارة الأنساب
              </p>
            </div>
          </Link>

          {/* Navigation and Auth Section */}
          <div className={`flex items-center gap-6 ${direction === 'rtl' ? 'font-arabic' : ''}`}>
            
            {/* Language Switcher - Always visible */}
            <div className="flex items-center">
              <LanguageSwitcher />
            </div>

            {user ? (
              // Authenticated User Section
              <div className="flex items-center gap-4">
                {/* Dashboard Link */}
                <Link 
                  to="/dashboard" 
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300"
                >
                  <Home className="h-4 w-4" />
                  <span>{t('nav.dashboard', 'لوحة التحكم')}</span>
                </Link>

                {/* Contact Us Link */}
                <a 
                  href="#contact" 
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-300"
                >
                  <Mail className="h-4 w-4" />
                  <span>{t('nav.contact', 'تواصل معنا')}</span>
                </a>

                {/* User Avatar Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="relative group cursor-pointer">
                      {/* Floating avatar container with multiple layers */}
                      <div className="absolute inset-0 w-12 h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full blur-lg opacity-40 group-hover:opacity-70 animate-pulse transition-all duration-500"></div>
                      
                      {/* Main avatar ring */}
                      <div className="relative w-12 h-12 p-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full group-hover:scale-110 transition-all duration-500">
                        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full p-[2px]">
                          <Avatar className="h-full w-full">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                              {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      
                      {/* Hover sparkle effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-amber-400 animate-bounce" style={{animationDelay: '0s'}} />
                        <Sparkles className="absolute -bottom-1 -left-2 h-3 w-3 text-emerald-400 animate-bounce" style={{animationDelay: '0.5s'}} />
                        <Sparkles className="absolute top-1 -right-3 h-2 w-2 text-teal-400 animate-bounce" style={{animationDelay: '1s'}} />
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent 
                    className="w-64 mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-emerald-500/20 shadow-2xl rounded-2xl p-2" 
                    align="end"
                    sideOffset={8}
                  >
                    {/* User Info Header */}
                    <DropdownMenuLabel className="p-4 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                              {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white dark:border-gray-900"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                    
                    {/* Menu Items */}
                    <DropdownMenuItem className="group p-3 rounded-xl hover:bg-emerald-500/10 transition-all duration-300 cursor-pointer" asChild>
                      <Link to="/dashboard" className="flex items-center gap-3 flex-row-reverse">
                        <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                          <TreePine className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium">{t('nav.dashboard', 'لوحة التحكم')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.dashboard.desc', 'إدارة شجرة العائلة')}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="group p-3 rounded-xl hover:bg-teal-500/10 transition-all duration-300 cursor-pointer" asChild>
                      <Link to="/profile" className="flex items-center gap-3 flex-row-reverse">
                        <div className="p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                          <Settings className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="font-medium">{t('nav.settings', 'الإعدادات')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.settings.desc', 'تخصيص الحساب')}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="group p-3 rounded-xl hover:bg-amber-500/10 transition-all duration-300 cursor-pointer" asChild>
                      <Link to="/payments" className="flex items-center gap-3 flex-row-reverse">
                        <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                          <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium">{t('nav.billing', 'الفواتير')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.billing.desc', 'إدارة الاشتراكات')}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="group p-3 rounded-xl hover:bg-emerald-500/10 transition-all duration-300 cursor-pointer">
                       <div className="flex items-center gap-3 w-full flex-row-reverse">
                        <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                          <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium">{t('nav.help', 'المساعدة')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.help.desc', 'الدعم والتوجيه')}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                    
                    {/* Logout */}
                    <DropdownMenuItem 
                      className="group p-3 rounded-xl hover:bg-red-500/10 transition-all duration-300 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      onClick={signOut}
                    >
                      <div className="flex items-center gap-3 w-full flex-row-reverse">
                        <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                          <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium">{t('nav.logout', 'تسجيل الخروج')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.logout.desc', 'إنهاء الجلسة')}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Non-authenticated User Section  
              <div className="flex items-center gap-3">
                {/* Register/Login Button */}
                <Button 
                  className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 text-white border-0 rounded-xl px-6 py-2 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <Link to="/auth" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{t('nav.register_now', 'التسجيل الآن')}</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};