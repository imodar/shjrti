import React, { useState, useEffect } from "react";
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
import Header from "@/components/Header";
import dashboardHeroBanner from "@/assets/dashboard-hero-banner.jpg";
import dashboardStats from "@/assets/dashboard-stats.jpg";
import familySuccess from "@/assets/family-success.jpg";
import futureFamily from "@/assets/future-family.jpg";
import heritageTech from "@/assets/heritage-tech.jpg";
import memoryPreservation from "@/assets/memory-preservation.jpg";
import { SharedFooter } from "@/components/SharedFooter";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Get families from database
const getFamiliesFromDatabase = async (userId: string) => {
  try {
    const { data: families, error } = await supabase
      .from('families')
      .select(`
        *,
        family_tree_members(count)
      `)
      .eq('creator_id', userId);

    if (error) {
      console.error('Error fetching families:', error);
      return [];
    }

    return families?.map(family => ({
      id: family.id,
      name: family.name,
      members: family.family_tree_members?.[0]?.count || 0,
      lastUpdated: new Date(family.updated_at).toLocaleDateString('en-GB'),
      generations: Math.max(1, Math.ceil((family.family_tree_members?.[0]?.count || 0) / 4)),
      isPublic: family.subscription_status === 'active',
      createdAt: family.created_at
    })) || [];
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
  const [trees, setTrees] = useState<any[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [treeToShare, setTreeToShare] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, profile, totalMembers, markNotificationAsRead, markAllAsRead } = useDashboardData();

  // Load families from database
  useEffect(() => {
    if (user) {
      loadFamilies();
    }
  }, [user]);

  const loadFamilies = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const families = await getFamiliesFromDatabase(user.id);
      setTrees(families);
    } catch (error) {
      console.error('Error loading families:', error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Plan-based features
  const canCreateNewTree = trees.length < currentPlan.treesLimit;
  const planProgress = trees.length / currentPlan.treesLimit * 100;
  const membersProgress = currentPlan.membersUsed / currentPlan.membersLimit * 100;
  
  // Notification functions
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const unreadCount = unreadNotifications.length;
  
  
  const handleMarkNotificationAsRead = (id: string) => {
    markNotificationAsRead(id);
    toast({
      title: "تم وضع علامة مقروء",
      description: "تم تحديث حالة الإشعار"
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast({
      title: "تم وضع علامة مقروء على جميع الإشعارات",
      description: "تم تحديث حالة جميع الإشعارات"
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
  const handleDeleteTree = (id: string) => {
    const tree = trees.find(t => t.id === id);
    if (tree) {
      setTreeToDelete(id);
      setShowDeleteDialog(true);
    }
  };
  const confirmDeleteTree = async () => {
    if (treeToDelete && deleteConfirmText.toLowerCase() === "حذف") {
      try {
        const { error } = await supabase
          .from('families')
          .delete()
          .eq('id', treeToDelete)
          .eq('creator_id', user?.id);

        if (error) {
          console.error('Error deleting family:', error);
          toast({
            title: "خطأ في الحذف",
            description: "حدث خطأ أثناء حذف الشجرة",
            variant: "destructive"
          });
          return;
        }

        // Reload families from database
        await loadFamilies();
        setShowDeleteDialog(false);
        setTreeToDelete(null);
        setDeleteConfirmText("");
        toast({
          title: "تم حذف الشجرة",
          description: "تم حذف الشجرة بنجاح"
        });
      } catch (error) {
        console.error('Error in confirmDeleteTree:', error);
        toast({
          title: "خطأ في الحذف",
          description: "حدث خطأ أثناء حذف الشجرة",
          variant: "destructive"
        });
      }
    }
  };
  const handleShareTree = (id: string) => {
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
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Creative Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-accent/15 to-secondary/15 rounded-full blur-xl animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-primary/15 to-secondary/20 rounded-full blur-2xl animate-float"></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-1/4 left-1/2 w-2 h-16 bg-gradient-to-b from-primary/30 to-transparent rotate-12 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-2 bg-gradient-to-r from-accent/30 to-transparent rotate-45 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-secondary/40 rotate-45 animate-spin-slow"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-6 py-8 pt-32 space-y-16">

          {/* Compact Modern Hero - Single Line */}
          <div className="relative">
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center gap-6">
                <div className="w-2 h-12 bg-gradient-to-b from-primary via-accent to-secondary rounded-full"></div>
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-primary">
                    مرحباً بك في لوحة التحكم
                  </h1>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-muted-foreground">إدارة أشجار عائلتك بسهولة</p>
                </div>
                <div className="w-2 h-12 bg-gradient-to-b from-secondary via-accent to-primary rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Compact Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trees Card - Compact */}
            <Card className="bg-gradient-to-br from-background via-primary/5 to-primary/10 border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{trees.length}</p>
                    <p className="text-xs text-muted-foreground">شجرة عائلية</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members Card - Compact */}
            <Card className="bg-gradient-to-br from-background via-accent/5 to-accent/10 border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">{trees.reduce((acc, tree) => acc + tree.members, 0)}</p>
                    <p className="text-xs text-muted-foreground">فرد</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generations Card - Compact */}
            <Card className="bg-gradient-to-br from-background via-secondary/5 to-secondary/10 border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-secondary">{trees.length > 0 ? Math.max(...trees.map(tree => tree.generations)) : 0}</p>
                    <p className="text-xs text-muted-foreground">جيل</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Add New Tree Button - Prominent */}
            <Button 
              onClick={handleCreateTree} 
              className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-6 py-3 text-lg font-semibold rounded-xl" 
            >
              <Plus className="mr-2 h-5 w-5" />
              إنشاء شجرة جديدة
            </Button>

            {/* Compact Upgrade Banner - Only for Free Users */}
            {currentPlan.type === "free" && (
              <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border border-primary/20 shadow-md">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-primary">
                        ارتقِ لخطة أفضل
                      </h3>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-primary/30 text-primary hover:bg-primary/10 text-xs"
                      onClick={() => setShowUpgradeDialog(true)}
                    >
                      ترقية
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Trees Section */}
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <h2 className="text-3xl font-bold text-primary">
                  أشجار العائلة
                </h2>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-primary rounded-full"></div>
              </div>
              <p className="text-muted-foreground">
                استكشف وأدر مجموعة أشجارك العائلية
              </p>
            </div>

            {trees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {trees.map((tree, index) => (
                  <Card key={tree.id} className="group relative overflow-hidden bg-gradient-to-br from-background to-card/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-3 hover:rotate-1">
                    {/* Creative Background Pattern */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
                      <div className={`absolute inset-0 bg-gradient-to-br ${
                        index % 3 === 0 ? 'from-primary/10 to-primary/5' : 
                        index % 3 === 1 ? 'from-accent/10 to-accent/5' : 
                        'from-secondary/10 to-secondary/5'
                      }`}></div>
                      <div className={`absolute top-0 right-0 w-24 h-24 ${
                        index % 3 === 0 ? 'bg-primary/20' : 
                        index % 3 === 1 ? 'bg-accent/20' : 
                        'bg-secondary/20'
                      } rounded-full blur-2xl animate-pulse`}></div>
                    </div>
                    
                    <CardContent className="p-0 relative z-10">
                      {/* Artistic Header */}
                      <div className={`relative p-8 bg-gradient-to-br ${
                        index % 3 === 0 ? 'from-primary/5 to-primary/10' : 
                        index % 3 === 1 ? 'from-accent/5 to-accent/10' : 
                        'from-secondary/5 to-secondary/10'
                      }`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50"></div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant={tree.isPublic ? "default" : "secondary"} 
                              className={`${
                                index % 3 === 0 ? 'bg-primary/10 text-primary border-primary/20' : 
                                index % 3 === 1 ? 'bg-accent/10 text-accent border-accent/20' : 
                                'bg-secondary/10 text-secondary border-secondary/20'
                              } font-medium`}
                            >
                              {tree.isPublic ? "🌍 عام" : "🔒 خاص"}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 ${
                                index % 3 === 0 ? 'bg-primary' : 
                                index % 3 === 1 ? 'bg-accent' : 
                                'bg-secondary'
                              } rounded-full animate-pulse`}></div>
                              <div className={`w-1 h-1 ${
                                index % 3 === 0 ? 'bg-primary/60' : 
                                index % 3 === 1 ? 'bg-accent/60' : 
                                'bg-secondary/60'
                              } rounded-full animate-pulse`} style={{animationDelay: '0.5s'}}></div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h3 className={`text-2xl font-bold ${
                              index % 3 === 0 ? 'text-primary' : 
                              index % 3 === 1 ? 'text-accent' : 
                              'text-secondary'
                            } group-hover:scale-105 transition-transform duration-300`}>
                              {tree.name}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              آخر تحديث: {tree.lastUpdated}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Creative Stats Section */}
                      <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className={`relative p-6 rounded-2xl ${
                            index % 3 === 0 ? 'bg-primary/5 border border-primary/20' : 
                            index % 3 === 1 ? 'bg-accent/5 border border-accent/20' : 
                            'bg-secondary/5 border border-secondary/20'
                          } text-center group-hover:scale-105 transition-transform duration-300`}>
                            <Users className={`h-6 w-6 mx-auto mb-3 ${
                              index % 3 === 0 ? 'text-primary' : 
                              index % 3 === 1 ? 'text-accent' : 
                              'text-secondary'
                            }`} />
                            <div className={`text-3xl font-bold ${
                              index % 3 === 0 ? 'text-primary' : 
                              index % 3 === 1 ? 'text-accent' : 
                              'text-secondary'
                            }`}>{tree.members}</div>
                            <div className="text-xs text-muted-foreground font-medium">فرد</div>
                          </div>
                          
                          <div className={`relative p-6 rounded-2xl ${
                            index % 3 === 0 ? 'bg-accent/5 border border-accent/20' : 
                            index % 3 === 1 ? 'bg-secondary/5 border border-secondary/20' : 
                            'bg-primary/5 border border-primary/20'
                          } text-center group-hover:scale-105 transition-transform duration-300`}>
                            <TrendingUp className={`h-6 w-6 mx-auto mb-3 ${
                              index % 3 === 0 ? 'text-accent' : 
                              index % 3 === 1 ? 'text-secondary' : 
                              'text-primary'
                            }`} />
                            <div className={`text-3xl font-bold ${
                              index % 3 === 0 ? 'text-accent' : 
                              index % 3 === 1 ? 'text-secondary' : 
                              'text-primary'
                            }`}>{tree.generations}</div>
                            <div className="text-xs text-muted-foreground font-medium">جيل</div>
                          </div>
                        </div>

                        {/* Creative Action Buttons */}
                        <div className="space-y-4">
                          <Button 
                            onClick={() => navigate('/view-tree')} 
                            className={`w-full ${
                              index % 3 === 0 ? 'bg-primary hover:bg-primary/90' : 
                              index % 3 === 1 ? 'bg-accent hover:bg-accent/90' : 
                              'bg-secondary hover:bg-secondary/90'
                            } hover:shadow-xl text-white font-semibold py-3 rounded-xl transform hover:scale-105 transition-all duration-300`}
                          >
                            <Eye className="mr-2 h-5 w-5" />
                            استكشف الشجرة
                          </Button>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => navigate('/family-builder?edit=true')} 
                              className={`${
                                index % 3 === 0 ? 'border-primary/30 hover:bg-primary/10 hover:border-primary/60' : 
                                index % 3 === 1 ? 'border-accent/30 hover:bg-accent/10 hover:border-accent/60' : 
                                'border-secondary/30 hover:bg-secondary/10 hover:border-secondary/60'
                              } rounded-xl font-medium`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleShareTree(tree.id)} 
                              className="border-muted-foreground/30 hover:bg-muted/20 hover:border-muted-foreground/60 rounded-xl font-medium"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteTree(tree.id)} 
                              className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="relative overflow-hidden bg-gradient-to-br from-muted/10 to-muted/5 border-2 border-dashed border-muted-foreground/20 shadow-xl">
                <CardContent className="p-16 text-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                      <Users className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 rounded-full blur-2xl animate-pulse"></div>
                  </div>
                  <h3 className="text-3xl font-bold text-muted-foreground mb-6">لم تبدأ رحلتك بعد</h3>
                  <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
                    ابدأ مغامرة استكشاف تاريخ عائلتك واكتب قصة أجيالك الرقمية
                  </p>
                  <Button 
                    onClick={handleCreateTree} 
                    className="bg-primary hover:bg-primary/90 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-10 py-4 text-lg font-semibold rounded-2xl" 
                  >
                    <Plus className="mr-3 h-6 w-6" />
                    ابدأ أول شجرة
                  </Button>
                </CardContent>
              </Card>
            )}
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

      <SharedFooter />
    </div>;
};
export default Dashboard;