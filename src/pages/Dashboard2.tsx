import React, { useState } from "react";
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

// Mock data
const mockTrees = [{
  id: 1,
  name: "عائلة أحمد",
  members: 25,
  generations: 4,
  lastUpdated: "منذ يومين",
  image: familySuccess,
  progress: 85,
  isPublic: true
}, {
  id: 2,
  name: "عائلة فاطمة",
  members: 12,
  generations: 3,
  lastUpdated: "منذ أسبوع",
  image: futureFamily,
  progress: 60,
  isPublic: false
}, {
  id: 3,
  name: "عائلة محمد",
  members: 35,
  generations: 5,
  lastUpdated: "منذ 3 أيام",
  image: heritageTech,
  progress: 92,
  isPublic: true
}];

// Mock user plan data
const currentPlan = {
  name: "مجانية",
  type: "free",
  // free, basic, premium
  treesUsed: 3,
  treesLimit: 3,
  membersUsed: 72,
  membersLimit: 100,
  features: ["3 أشجار عائلية", "100 فرد", "مشاركة محدودة"]
};
const Dashboard2 = () => {
  const [trees, setTrees] = useState(mockTrees);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [treeToShare, setTreeToShare] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const {
    toast
  } = useToast();

  // Plan-based features
  const canCreateNewTree = currentPlan.treesUsed < currentPlan.treesLimit;
  const planProgress = currentPlan.treesUsed / currentPlan.treesLimit * 100;
  const membersProgress = currentPlan.membersUsed / currentPlan.membersLimit * 100;
  const handleCreateTree = () => {
    if (currentPlan.type === "free" && !canCreateNewTree) {
      setShowUpgradeDialog(true);
      return;
    }

    // Handle tree creation logic here
    toast({
      title: "إنشاء شجرة جديدة",
      description: "سيتم توجيهك لصفحة إنشاء الشجرة"
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
      setTrees(trees.filter(tree => tree.id !== treeToDelete));
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
                <div className="relative">
                  <Button variant="ghost" size="icon" className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-emerald-200/30">
                    <Bell className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs flex items-center justify-center text-white font-bold shadow-lg animate-bounce">
                      3
                    </span>
                  </Button>
                </div>
                
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
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">أحمد محمد</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">الباقة المميزة</p>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl" align="start" forceMount>
                    <DropdownMenuLabel className="font-normal p-4">
                       <div className="flex items-center gap-3">
                          <div className="flex flex-col space-y-1 flex-1 text-right">
                            <p className="text-base font-semibold leading-none text-emerald-800 dark:text-emerald-200 text-right">أحمد محمد</p>
                            <p className="text-sm leading-none text-emerald-600 dark:text-emerald-400 text-right">
                              ahmed@example.com
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
          {/* Hero Section with Plan Info */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground shadow-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <img src={dashboardHeroBanner} alt="Dashboard Hero" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay" />
            
            <div className="relative z-10 p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    {getPlanIcon(currentPlan.type)}
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      الباقة {currentPlan.name}
                    </Badge>
                  </div>
                  <h2 className="text-4xl font-bold mb-4">مرحباً بعودتك!</h2>
                  <p className="text-xl text-white/90 mb-6">
                    استمر في بناء تاريخ عائلتك والحفاظ على الذكريات الثمينة
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-5 w-5 text-white" />
                        <span className="text-white/80 text-sm">الأشجار</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {currentPlan.treesUsed}/{currentPlan.treesLimit}
                      </div>
                      <Progress value={planProgress} className="h-2 bg-white/20" />
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-white" />
                        <span className="text-white/80 text-sm">الأفراد</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {currentPlan.membersUsed}/{currentPlan.membersLimit}
                      </div>
                      <Progress value={membersProgress} className="h-2 bg-white/20" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

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
                    <p className="text-3xl font-bold text-secondary-foreground">{Math.max(...trees.map(tree => tree.generations))}</p>
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
                {trees.map(tree => <Card key={tree.id} className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-border/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Tree Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img src={tree.image} alt={tree.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge variant={tree.isPublic ? "default" : "secondary"} className="shadow-lg">
                          {tree.isPublic ? "عام" : "خاص"}
                        </Badge>
                      </div>

                      {/* Progress Circle */}
                      
                    </div>

                    <CardContent className="p-6 relative z-10">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {tree.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">{tree.lastUpdated}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm text-muted-foreground">{tree.members} فرد</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-accent" />
                            <span className="text-sm text-muted-foreground">{tree.generations} أجيال</span>
                          </div>
                        </div>

                         <div className="flex gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleShareTree(tree.id)} className="flex-1 group-hover:border-primary/50 transition-colors">
                             <Share2 className="mr-1 h-4 w-4" />
                             مشاركة
                           </Button>
                           <Button variant="outline" size="sm" className="flex-1 group-hover:border-primary/50 transition-colors">
                             <Edit className="mr-1 h-4 w-4" />
                             تحرير
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => handleDeleteTree(tree.id)} className="group-hover:border-destructive/50 group-hover:text-destructive transition-colors">
                             <Trash2 className="h-4 w-4" />
                           </Button>
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
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-card to-card/90 backdrop-blur-sm border-border/50">
          <DialogHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Crown className="h-8 w-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ترقية مطلوبة
            </DialogTitle>
            <DialogDescription className="text-center">
              لقد وصلت إلى الحد الأقصى للأشجار في الباقة المجانية. قم بترقية باقتك للحصول على أشجار غير محدودة وميزات متقدمة.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">الاستخدام الحالي</span>
                <span className="text-sm text-muted-foreground">{currentPlan.treesUsed}/{currentPlan.treesLimit}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">مميزات الباقة الاحترافية:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  أشجار عائلية غير محدودة
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  أفراد غير محدودين
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  مشاركة متقدمة
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  تصدير البيانات
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} className="flex-1">
              إلغاء
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground">
              <Crown className="mr-2 h-4 w-4" />
              ترقية الآن
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
export default Dashboard2;