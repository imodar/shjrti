import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Plus, Users, Calendar, Share2, Edit, Trash2, Crown, TrendingUp, Eye, Copy, CheckCircle, Sparkles, BarChart3, PieChart, Gift, Zap, Settings, User, LogOut, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import dashboardHeroBanner from "@/assets/dashboard-hero-banner.jpg";
import dashboardStats from "@/assets/dashboard-stats.jpg";
import familySuccess from "@/assets/family-success.jpg";
import futureFamily from "@/assets/future-family.jpg";
import heritageTech from "@/assets/heritage-tech.jpg";
import memoryPreservation from "@/assets/memory-preservation.jpg";
import Footer from "@/components/Footer";
import { useDashboardData } from "@/hooks/useDashboardData";

// Get trees from localStorage
const getTreesFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem('familyTrees') || '[]');
  } catch {
    return [];
  }
};

// Mock user plan data
const currentPlan = {
  name: "مجانية",
  type: "free",
  // free: 0/1, basic: 0/2, premium: 0/10
  treesUsed: 0,
  treesLimit: 1, // Free plan allows 1 tree
  membersUsed: 0,
  membersLimit: 10, // Free plan allows 10 members
  features: ["شجرة واحدة", "10 أفراد", "مشاركة محدودة"]
};

// Available plans data
const availablePlans = [
  {
    name: "مجانية",
    type: "free",
    price: "$0",
    priceArabic: "مجاناً",
    period: "",
    treesLimit: 1,
    membersLimit: 10,
    features: ["شجرة واحدة", "10 أفراد", "مشاركة محدودة"],
    popular: false
  },
  {
    name: "أساسية",
    type: "basic",
    price: "$9.99",
    priceArabic: "٩.٩٩ دولار",
    period: "/شهر",
    treesLimit: 2,
    membersLimit: 50,
    features: ["شجرتان عائليتان", "50 فرد", "مشاركة محدودة", "دعم بريد إلكتروني"],
    popular: false
  },
  {
    name: "احترافية",
    type: "premium", 
    price: "$19.99",
    priceArabic: "١٩.٩٩ دولار",
    period: "/شهر",
    treesLimit: 10,
    membersLimit: 200,
    features: ["10 أشجار عائلية", "200 فرد", "مشاركة متقدمة", "تصدير البيانات", "دعم مباشر"],
    popular: true
  }
];
// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    title: "تم إضافة فرد جديد",
    message: "تم إضافة محمد أحمد إلى شجرة عائلة أحمد",
    time: "منذ 5 دقائق",
    isRead: false,
    type: "member"
  },
  {
    id: 2,
    title: "تحديث في الشجرة",
    message: "تم تحديث معلومات فاطمة محمد في شجرة عائلة فاطمة",
    time: "منذ ساعة",
    isRead: false,
    type: "update"
  },
  {
    id: 3,
    title: "مشاركة جديدة",
    message: "شارك سعد الله شجرة العائلة معك",
    time: "منذ يومين",
    isRead: true,
    type: "share"
  },
  {
    id: 4,
    title: "انتهاء الاشتراك قريباً",
    message: "سينتهي اشتراكك خلال 7 أيام",
    time: "منذ 3 أيام",
    isRead: false,
    type: "subscription"
  }
];

const Dashboard = () => {
  const [trees, setTrees] = useState(getTreesFromStorage());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [treeToShare, setTreeToShare] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const { notifications: realNotifications, profile, totalMembers } = useDashboardData();

  // Plan-based features
  const canCreateNewTree = trees.length < currentPlan.treesLimit;
  const planProgress = trees.length / currentPlan.treesLimit * 100;
  const membersProgress = currentPlan.membersUsed / currentPlan.membersLimit * 100;
  
  // Notification functions
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const unreadCount = unreadNotifications.length;
  
  const markNotificationAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
    toast({
      title: "تم وضع علامة مقروء",
      description: "تم تحديث حالة الإشعار"
    });
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    toast({
      title: "تم وضع علامة مقروء على الكل",
      description: "تم تحديث جميع الإشعارات"
    });
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "member":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "update":
        return <Edit className="h-4 w-4 text-green-500" />;
      case "share":
        return <Share2 className="h-4 w-4 text-purple-500" />;
      case "subscription":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  const handleCreateTree = () => {
    // Check if user has reached the tree limit for their plan
    if (trees.length >= currentPlan.treesLimit) {
      // Show upgrade modal instead of navigating directly to payment
      setShowUpgradeDialog(true);
      toast({
        title: "ترقية مطلوبة",
        description: `لقد وصلت للحد الأقصى المسموح في باقة ${currentPlan.name}. يرجى الترقية للمتابعة.`,
        variant: "destructive"
      });
      return;
    }

    // Navigate to family creator page
    navigate("/family-creator");
    toast({
      title: "إنشاء شجرة جديدة",
      description: "تم توجيهك لصفحة إنشاء الشجرة"
    });
  };
  const handleDeleteTree = (id: number) => {
    const tree = trees.find(t => t.id === id);
    if (tree) {
      setTreeToDelete(id);
      setShowDeleteDialog(true);
    }
  };
  const confirmDeleteTree = () => {
    if (treeToDelete && deleteConfirmText.toLowerCase() === "حذف") {
      const updatedTrees = trees.filter(tree => tree.id !== treeToDelete);
      setTrees(updatedTrees);
      localStorage.setItem('familyTrees', JSON.stringify(updatedTrees));
      setShowDeleteDialog(false);
      setTreeToDelete(null);
      setDeleteConfirmText("");
      toast({
        title: "تم حذف الشجرة",
        description: "تم حذف الشجرة بنجاح"
      });
    }
  };
  const handleShareTree = (id: number) => {
    setTreeToShare(id);
    setShowShareDialog(true);
  };
  const copyShareLink = () => {
    const tree = trees.find(t => t.id === treeToShare);
    if (tree) {
      const shareUrl = `${window.location.origin}/tree/${tree.id}`;
      navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط المشاركة إلى الحافظة"
      });
    }
  };
  const getPlanColor = (type: string) => {
    switch (type) {
      case "free":
        return "text-muted-foreground";
      case "basic":
        return "text-accent-foreground";
      case "premium":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };
  const getPlanIcon = (type: string) => {
    switch (type) {
      case "premium":
        return <Crown className="h-4 w-4" />;
      case "basic":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '4s'
      }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border-b border-gradient-to-r from-emerald-200/30 to-cyan-200/30 sticky top-0 z-50">
          {/* Floating geometric shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-2 left-10 w-6 h-6 bg-emerald-400/20 rounded-full animate-pulse"></div>
            <div className="absolute top-6 left-32 w-4 h-4 bg-teal-400/30 rotate-45 animate-pulse" style={{
            animationDelay: '1s'
          }}></div>
            <div className="absolute top-4 left-64 w-3 h-3 bg-cyan-400/25 rounded-full animate-pulse" style={{
            animationDelay: '2s'
          }}></div>
          </div>

          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* Left side - Logo and Title */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    كينلاك - العائلة الرقمية
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-muted-foreground font-medium">منصة إدارة الأنساب</p>
                  </div>
                </div>
              </div>
              
              {/* Right side - Actions and Profile */}
              <div className="flex items-center gap-6">
                {/* Navigation Pills */}
                <div className="hidden md:flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-full p-1 border border-emerald-200/50 dark:border-emerald-700/50">
                  <Button variant="ghost" size="sm" className="rounded-full px-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30">
                    الرئيسية
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-emerald-500/20">
                    الأشجار
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-emerald-500/20">
                    التقارير
                  </Button>
                </div>

                {/* Notification Bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-emerald-200/30">
                      <Bell className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -left-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs flex items-center justify-center text-white font-bold shadow-lg animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl max-h-96 overflow-y-auto" 
                    align="end" 
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal p-0 border-b border-emerald-200/30 dark:border-emerald-700/30 relative overflow-hidden">
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950 opacity-50"></div>
                      
                      {/* Floating decorative elements */}
                      <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full blur-xl opacity-30 animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-full blur-lg opacity-20 animate-pulse delay-700"></div>
                      
                      <div className="relative z-10 p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-sm opacity-30 animate-pulse"></div>
                              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300">
                                <Bell className="h-5 w-5 text-white" />
                              </div>
                              {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-300 dark:to-teal-400 bg-clip-text text-transparent">
                                الإشعارات
                              </span>
                              <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                                {unreadCount > 0 ? `${unreadCount} إشعار جديد` : 'لا توجد إشعارات جديدة'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse">
                                <span className="font-bold">{unreadCount}</span>
                                <span className="mr-1">جديد</span>
                              </Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={markAllAsRead}
                              disabled={unreadCount === 0}
                              className="text-xs bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 text-emerald-700 dark:text-emerald-300 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900 dark:hover:to-teal-900 border border-emerald-200/50 dark:border-emerald-700/50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="font-medium">تحديد الكل مقروء</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <DropdownMenuItem 
                            key={notification.id}
                            className={`p-4 cursor-pointer border-b border-emerald-100/50 dark:border-emerald-800/50 last:border-b-0 ${
                              !notification.isRead 
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50' 
                                : 'hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20'
                            }`}
                            onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0 text-right">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                                  <h4 className={`text-sm font-semibold ${
                                    !notification.isRead 
                                      ? 'text-emerald-800 dark:text-emerald-200' 
                                      : 'text-muted-foreground'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                </div>
                                
                                <p className={`text-sm leading-relaxed text-right ${
                                  !notification.isRead 
                                    ? 'text-emerald-700 dark:text-emerald-300' 
                                    : 'text-muted-foreground'
                                }`}>
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between mt-2">
                                  {!notification.isRead && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markNotificationAsRead(notification.id);
                                      }}
                                      className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 p-1 h-auto"
                                    >
                                      وضع علامة مقروء
                                    </Button>
                                  )}
                                  
                                  <div className="flex items-center gap-1">
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    )}
                                    <span className={`text-xs ${
                                      !notification.isRead 
                                        ? 'text-emerald-600 dark:text-emerald-400 font-medium' 
                                        : 'text-muted-foreground'
                                    }`}>
                                      {notification.isRead ? 'مقروء' : 'جديد'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">لا توجد إشعارات</p>
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* User Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-auto p-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-emerald-200/30">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-transparent">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold">
                              أح
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="hidden lg:block text-left">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                            {profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'المستخدم'}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">{profile?.plan || 'الباقة الأساسية'}</p>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl" align="start" forceMount>
                    <DropdownMenuLabel className="font-normal p-4">
                       <div className="flex items-center gap-3">
                          <div className="flex flex-col space-y-1 flex-1 text-right">
                            <p className="text-base font-semibold leading-none text-emerald-800 dark:text-emerald-200 text-right">
                              {profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'المستخدم'}
                            </p>
                            <p className="text-sm leading-none text-emerald-600 dark:text-emerald-400 text-right">
                              {profile?.email || 'البريد الإلكتروني'}
                            </p>
                            <div className="flex items-center gap-1 mt-2 justify-end">
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">عضو مميز</span>
                              <Crown className="h-3 w-3 text-yellow-500" />
                            </div>
                          </div>
                         <Avatar className="w-12 h-12 ring-2 ring-emerald-500/50">
                           <AvatarImage src="/placeholder.svg" />
                           <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                             أح
                           </AvatarFallback>
                         </Avatar>
                       </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-emerald-200/50 dark:bg-emerald-700/50" />
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-end">
                      <span className="text-emerald-800 dark:text-emerald-200">الملف الشخصي</span>
                      <User className="ml-3 h-4 w-4 text-emerald-600" />
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-end">
                      <span className="text-emerald-800 dark:text-emerald-200">الإعدادات</span>
                      <Settings className="ml-3 h-4 w-4 text-emerald-600" />
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-end">
                      <span className="text-emerald-800 dark:text-emerald-200">إدارة الاشتراك</span>
                      <Crown className="ml-3 h-4 w-4 text-yellow-500" />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-emerald-200/50 dark:bg-emerald-700/50" />
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center justify-end">
                      <span className="text-red-600 dark:text-red-400">تسجيل الخروج</span>
                      <LogOut className="ml-3 h-4 w-4 text-red-500" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Bottom gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        </header>

        <main className="container mx-auto px-6 py-8 space-y-8">

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">إجمالي الأشجار</p>
                    <p className="text-3xl font-bold text-primary">{trees.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">إجمالي الأفراد</p>
                    <p className="text-3xl font-bold text-accent">{trees.reduce((acc, tree) => acc + tree.members, 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">الأجيال</p>
                    <p className="text-3xl font-bold text-secondary-foreground">{trees.length > 0 ? Math.max(...trees.map(tree => tree.generations)) : 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-secondary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Plan Upgrade Section (for free users) */}
          {currentPlan.type === "free" && <Card className="relative overflow-hidden bg-gradient-to-r from-accent/10 via-primary/5 to-secondary/10 border-2 border-dashed border-primary/30">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-primary/5"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                      <Zap className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-2">ارتقِ بتجربتك</h3>
                      <p className="text-muted-foreground">احصل على ميزات متقدمة وأشجار عائلية غير محدودة</p>
                      <div className="flex gap-2 mt-2">
                        {["أشجار غير محدودة", "تخزين متقدم", "مشاركة متطورة"].map((feature, index) => <Badge key={index} variant="outline" className="text-xs border-primary/30">
                            {feature}
                          </Badge>)}
                      </div>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => setShowUpgradeDialog(true)}>
                    <Crown className="mr-2 h-4 w-4" />
                    ترقية الباقة
                  </Button>
                </div>
              </CardContent>
            </Card>}

          {/* Trees Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">أشجار العائلة</h2>
                <p className="text-muted-foreground">أدر وتابع جميع أشجار عائلتك</p>
              </div>
              <Button onClick={handleCreateTree} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                إنشاء شجرة جديدة
              </Button>
            </div>

            {trees.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trees.map(tree => <Card key={tree.id} className="group relative overflow-hidden bg-gradient-to-br from-card via-accent/5 to-primary/5 backdrop-blur-sm border-2 border-gradient-to-r from-primary/20 to-accent/20 hover:border-primary/40 hover:shadow-2xl transition-all duration-700 hover:scale-105">
                    {/* Animated background patterns */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                    </div>
                    
                    {/* Floating geometric shapes */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute top-4 right-6 w-3 h-3 bg-primary/40 rounded-full animate-bounce"></div>
                      <div className="absolute top-8 right-12 w-2 h-2 bg-accent/40 rotate-45 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute bottom-6 left-8 w-4 h-4 bg-secondary/40 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
                    </div>

                    <CardContent className="p-0 relative z-10">
                      {/* Header with curved design */}
                      <div className="relative p-6 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                          {/* Status and Progress */}
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant={tree.isPublic ? "default" : "secondary"} className="shadow-md bg-gradient-to-r from-primary/80 to-accent/80 text-white border-0">
                              {tree.isPublic ? "عام" : "خاص"}
                            </Badge>
                          </div>

                          {/* Tree name and last updated */}
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-500">
                              {tree.name}
                            </h3>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                              <span className="font-medium">آخر تحديث للشجرة:</span>
                              {tree.lastUpdated}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats section with creative layout */}
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 group-hover:border-primary/40 transition-colors duration-500">
                            <div className="absolute top-2 right-2 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div className="mt-8">
                              <div className="text-2xl font-bold text-primary">{tree.members}</div>
                              <div className="text-xs text-muted-foreground">فرد</div>
                            </div>
                          </div>
                          
                          <div className="relative bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-4 border border-accent/20 group-hover:border-accent/40 transition-colors duration-500">
                            <div className="absolute top-2 right-2 w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-accent" />
                            </div>
                            <div className="mt-8">
                              <div className="text-2xl font-bold text-accent">{tree.generations}</div>
                              <div className="text-xs text-muted-foreground">أجيال</div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-3">
                          <Button 
                            onClick={() => navigate('/view-tree')} 
                            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            عرض الشجرة
                          </Button>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate('/family-builder?edit=true')} className="flex-1 border-primary/30 hover:border-primary/60 hover:bg-primary/10 transition-all duration-300">
                              <Edit className="mr-1 h-4 w-4" />
                              تحرير
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleShareTree(tree.id)} className="flex-1 border-accent/30 hover:border-accent/60 hover:bg-accent/10 transition-all duration-300">
                              <Share2 className="mr-1 h-4 w-4" />
                              مشاركة
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteTree(tree.id)} className="border-destructive/30 hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div> : <Card className="relative overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 border-2 border-dashed border-muted-foreground/30">
                <CardContent className="p-12 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-muted-foreground mb-4">لا توجد أشجار عائلية بعد</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    ابدأ رحلتك في بناء تاريخ عائلتك عبر إنشاء أول شجرة عائلية
                  </p>
                  <Button onClick={handleCreateTree} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    إنشاء أول شجرة
                  </Button>
                </CardContent>
              </Card>}
          </div>
        </main>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-3xl bg-gradient-to-br from-card to-card/90 backdrop-blur-sm border-border/50 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Crown className="h-8 w-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ترقية الباقة
            </DialogTitle>
            <DialogDescription className="text-center">
              لقد وصلت إلى الحد الأقصى في باقتك الحالية. اختر الباقة التي تناسب احتياجاتك.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Usage */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">الاستخدام الحالي للأشجار</span>
                <span className="text-sm text-muted-foreground">{trees.length}/{currentPlan.treesLimit}</span>
              </div>
              <Progress 
                value={currentPlan.treesLimit > 0 ? (trees.length / currentPlan.treesLimit) * 100 : 0} 
                className="h-2" 
              />
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availablePlans.map((plan, index) => (
                <Card key={plan.type} className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                        الأكثر شعبية
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-2xl font-bold text-primary">
                      {plan.priceArabic}
                      <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full mt-auto ${
                        plan.type === currentPlan.type 
                          ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                          : plan.popular 
                            ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground' 
                            : ''
                      }`}
                      variant={plan.type === currentPlan.type ? 'secondary' : plan.popular ? 'default' : 'outline'}
                      disabled={plan.type === currentPlan.type}
                      onClick={() => {
                        if (plan.type !== currentPlan.type) {
                          setShowUpgradeDialog(false);
                          navigate("/payment", { state: { selectedPlan: plan } });
                          toast({
                            title: "التوجه للدفع",
                            description: `سيتم توجيهك لصفحة الدفع للباقة ${plan.name}`
                          });
                        }
                      }}
                    >
                      {plan.type === currentPlan.type ? (
                        "الباقة الحالية"
                      ) : (
                        <>
                          {plan.popular && <Crown className="mr-2 h-4 w-4" />}
                          اختيار هذه الباقة
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} className="flex-1">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-red-50/95 via-orange-50/95 to-yellow-50/95 dark:from-red-950/95 dark:via-red-900/95 dark:to-orange-950/95 backdrop-blur-xl border-2 border-red-200/50 dark:border-red-700/50 shadow-2xl overflow-hidden max-w-md">
          {/* Animated Warning Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-tr from-orange-500/15 to-yellow-500/15 rounded-full blur-xl animate-pulse" style={{
              animationDelay: '1s'
            }}></div>
            <div className="absolute top-1/2 right-4 w-3 h-3 bg-red-400/40 rounded-full animate-bounce" style={{
              animationDelay: '0.5s'
            }}></div>
            <div className="absolute top-1/4 left-4 w-2 h-2 bg-orange-400/40 rounded-full animate-bounce" style={{
              animationDelay: '1.5s'
            }}></div>
            
            {/* Danger Lines */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-pulse"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent animate-pulse" style={{
              animationDelay: '0.5s'
            }}></div>
          </div>
          
          <div className="relative z-10">
            <AlertDialogHeader className="text-center pb-6">
              {/* Animated Warning Icon */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform hover:scale-105 transition-transform relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-400 rounded-2xl blur opacity-50 animate-pulse"></div>
                <Trash2 className="h-10 w-10 text-white animate-pulse relative z-10" />
                
                {/* Warning Ring */}
                <div className="absolute -inset-2 border-2 border-red-400/30 rounded-3xl animate-ping"></div>
              </div>
              
              <AlertDialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent text-right mb-2">
                ⚠️ تحذير - حذف الشجرة
              </AlertDialogTitle>
              
              <AlertDialogDescription className="space-y-6 text-right">
                {/* Warning Message */}
                <div className="bg-gradient-to-r from-red-100/80 to-orange-100/80 dark:from-red-950/50 dark:to-orange-950/50 rounded-xl p-4 border border-red-200/50 dark:border-red-700/50">
                  <p className="text-red-700 dark:text-red-300 font-medium leading-relaxed">
                    هل أنت متأكد من رغبتك في حذف هذه الشجرة؟ 
                    <br />
                    <span className="text-orange-600 dark:text-orange-400 font-bold">
                      هذا الإجراء لا يمكن التراجع عنه نهائياً! 🚨
                    </span>
                  </p>
                </div>
                
                {/* Confirmation Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-red-700 dark:text-red-300 text-right">
                    اكتب "حذف" للتأكيد النهائي:
                  </label>
                  <div className="relative">
                    <Input 
                      value={deleteConfirmText} 
                      onChange={e => setDeleteConfirmText(e.target.value)} 
                      placeholder="حذف" 
                      className="text-center text-lg font-bold bg-white/80 dark:bg-gray-800/80 border-2 border-red-300/50 dark:border-red-600/50 focus:border-red-500 focus:ring-red-500/20 shadow-inner"
                    />
                    {deleteConfirmText.toLowerCase() === "حذف" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Risk Indicators */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-red-100/50 dark:bg-red-950/30 rounded-lg p-2 text-center border border-red-200/30 dark:border-red-700/30">
                    <div className="text-red-600 dark:text-red-400 text-xs font-medium">خطر عالي</div>
                  </div>
                  <div className="bg-orange-100/50 dark:bg-orange-950/30 rounded-lg p-2 text-center border border-orange-200/30 dark:border-orange-700/30">
                    <div className="text-orange-600 dark:text-orange-400 text-xs font-medium">لا يمكن التراجع</div>
                  </div>
                  <div className="bg-yellow-100/50 dark:bg-yellow-950/30 rounded-lg p-2 text-center border border-yellow-200/30 dark:border-yellow-700/30">
                    <div className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">فقدان دائم</div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <AlertDialogFooter className="flex gap-3 pt-6">
              <AlertDialogCancel 
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 hover:from-gray-200 hover:to-slate-200 dark:hover:from-gray-700 dark:hover:to-slate-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium shadow-lg transition-all duration-300"
              >
                إلغاء الأمر
              </AlertDialogCancel>
              
              <AlertDialogAction 
                onClick={confirmDeleteTree} 
                disabled={deleteConfirmText.toLowerCase() !== "حذف"}
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {deleteConfirmText.toLowerCase() === "حذف" ? (
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 animate-pulse" />
                    حذف نهائي
                  </span>
                ) : (
                  <span className="opacity-50">حذف نهائي</span>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-emerald-50/95 via-white/95 to-teal-50/95 dark:from-emerald-950/95 dark:via-gray-900/95 dark:to-teal-950/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-teal-400/15 to-cyan-400/15 rounded-full blur-lg animate-pulse" style={{
            animationDelay: '1s'
          }}></div>
            <div className="absolute top-1/2 right-2 w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce" style={{
            animationDelay: '0.5s'
          }}></div>
            <div className="absolute top-1/4 left-2 w-1.5 h-1.5 bg-teal-400/40 rounded-full animate-bounce" style={{
            animationDelay: '1.5s'
          }}></div>
          </div>
          
          <div className="relative z-10">
            <DialogHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform hover:scale-105 transition-transform">
                <Share2 className="h-8 w-8 text-white animate-pulse" />
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent text-right">
                مشاركة الشجرة
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2 leading-relaxed text-right">
                شارك شجرة العائلة مع أحبائك واجعلهم جزءاً من التاريخ العائلي
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Share Link Section */}
              <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30">
                <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2 block">
                  رابط المشاركة
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input value={treeToShare ? `${window.location.origin}/tree/${treeToShare}` : ""} readOnly className="pr-10 bg-white/70 dark:bg-gray-800/70 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-400 focus:ring-emerald-400/20" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <Button size="sm" onClick={copyShareLink} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    {linkCopied ? <CheckCircle className="h-4 w-4 text-white animate-bounce" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Success Message */}
              {linkCopied && <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200/50 dark:border-green-700/50 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-center gap-3 justify-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      تم نسخ الرابط بنجاح! 🎉
                    </p>
                  </div>
                </div>}

              {/* Quick Share Options */}
              <div className="bg-gradient-to-r from-gray-50/50 to-slate-50/50 dark:from-gray-950/30 dark:to-slate-950/30 rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                  مشاركة سريعة
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-950/70 dark:border-blue-700 dark:text-blue-300">
                    واتساب
                  </Button>
                  <Button variant="outline" size="sm" className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-950/70 dark:border-purple-700 dark:text-purple-300">
                    تليجرام
                  </Button>
                  <Button variant="outline" size="sm" className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-950/50 dark:hover:bg-orange-950/70 dark:border-orange-700 dark:text-orange-300">
                    إيميل
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter className="pt-6">
              <Button variant="outline" onClick={() => setShowShareDialog(false)} className="w-full bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 hover:from-gray-100 hover:to-slate-100 dark:hover:from-gray-700 dark:hover:to-slate-700 border-gray-300 dark:border-gray-600 transition-all duration-300">
                إغلاق
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>;
};
export default Dashboard;