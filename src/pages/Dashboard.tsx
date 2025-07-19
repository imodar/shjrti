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
import { Plus, Users, Calendar, Share2, Edit, Trash2, Crown, TrendingUp, Eye, Copy, CheckCircle, Sparkles, BarChart3, PieChart, Gift, Zap, Settings, User, LogOut, Bell, Heart, Star, TreePine, Gem, Camera, UserPlus, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Header from "@/components/Header";
import { LuxuryFooter } from "@/components/LuxuryFooter";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

// Get families from database
const getFamiliesFromDatabase = async (userId: string) => {
  try {
    const {
      data: families,
      error
    } = await supabase.from('families').select(`
        *,
        family_tree_members(count)
      `).eq('creator_id', userId);
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { totalMembers, loading: dashboardLoading, profile } = useDashboardData();
  
  // Fallback values for missing properties
  const recentMembers = 3;
  const profileCompletion = 75;
  const memoryCount = 12;
  const recentActivity = [];

  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const isLoading = loading || dashboardLoading;

  useEffect(() => {
    const loadDashboardData = async () => {
      if (user?.id) {
        setLoading(true);
        try {
          const familiesData = await getFamiliesFromDatabase(user.id);
          setTrees(familiesData);
        } catch (error) {
          console.error('Error loading families:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
  }, [user]);

  const handleCreateTree = () => {
    navigate("/family-creator");
    toast({
      title: "إنشاء شجرة جديدة",
      description: "تم توجيهك لصفحة إنشاء الشجرة"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950">
      <Header />
      
      {/* Main Content with Luxury Design */}
      <main className="flex-1 overflow-hidden relative">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-10 animate-bounce"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-1/3 left-1/3 w-8 h-8 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full opacity-10 animate-bounce"></div>
        </div>

        <div className="container mx-auto px-6 py-8 max-w-7xl relative z-10">
          {/* Luxury Welcome Section */}
          <div className="mb-16">
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950 dark:via-teal-950 dark:to-amber-950 rounded-3xl p-8 shadow-2xl border border-emerald-200/20 backdrop-blur-xl">
              {/* Luxury Background Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.1),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.1),transparent_50%)]"></div>
              
              {/* Floating Decorative Elements */}
              <div className="absolute top-4 right-8 animate-pulse">
                <Sparkles className="h-6 w-6 text-emerald-400 opacity-60" />
              </div>
              <div className="absolute bottom-4 left-8 animate-bounce">
                <Crown className="h-5 w-5 text-amber-400 opacity-60" />
              </div>

              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    <Gem className="h-4 w-4" />
                    {t('dashboard_badge', 'لوحة التحكم الخاصة')}
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      {t('dashboard_welcome_title', 'مرحباً،')}
                    </span>
                    <br />
                    <span className="text-gray-800 dark:text-gray-200">
                      {(profile as any)?.full_name || (profile as any)?.name || user?.email?.split('@')[0] || t('guest', 'ضيف')}!
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                    {t('dashboard_subtitle', 'إدارة شجرة عائلتك الرقمية وتتبع تراثك العريق من مكان واحد مميز')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleCreateTree}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl text-lg shadow-xl hover-scale"
                  >
                    <Plus className="h-5 w-5 ml-2" />
                    {t('add_member', 'إضافة فرد')}
                  </Button>
                  <Button variant="outline" className="border-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 px-8 py-4 rounded-2xl text-lg">
                    <Settings className="h-5 w-5 ml-2" />
                    {t('settings', 'الإعدادات')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Luxury Stats Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg">
                <BarChart3 className="h-4 w-4" />
                {t('stats_badge', 'إحصائيات تراثك')}
                <BarChart3 className="h-4 w-4" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                  {t('stats_title', 'نظرة على')}
                </span>
                <br />
                <span className="text-gray-800 dark:text-gray-200">{t('stats_subtitle', 'عائلتك الكريمة')}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Stats Cards */}
              <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 opacity-0 group-hover:opacity-10 transition-all duration-500"></div>
                <CardContent className="relative p-8 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-xl group-hover:scale-110 transition-all duration-500">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                    {t('total_members', 'إجمالي الأفراد')}
                  </p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                    {isLoading ? '...' : totalMembers}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-all duration-500"></div>
                <CardContent className="relative p-8 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-xl group-hover:scale-110 transition-all duration-500">
                      <UserPlus className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                    {t('recent_additions', 'إضافات حديثة')}
                  </p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {isLoading ? '...' : recentMembers}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 opacity-0 group-hover:opacity-10 transition-all duration-500"></div>
                <CardContent className="relative p-8 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full shadow-xl group-hover:scale-110 transition-all duration-500">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
                    {t('profile_completion', 'اكتمال الملفات')}
                  </p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                    {isLoading ? '...' : `${profileCompletion}%`}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-all duration-500"></div>
                <CardContent className="relative p-8 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-xl group-hover:scale-110 transition-all duration-500">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                    {t('memory_count', 'عدد الذكريات')}
                  </p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {isLoading ? '...' : memoryCount}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Activity & Actions Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Recent Activity Card */}
            <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-emerald-50 dark:from-gray-800 dark:via-gray-900 dark:to-emerald-950 opacity-90"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-100/30 dark:to-emerald-900/30 group-hover:to-emerald-200/50 dark:group-hover:to-emerald-800/50 transition-all duration-700"></div>
              
              <CardHeader className="relative pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-20"></div>
                    <div className="relative inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {t('recent_activity', 'النشاط الأخير')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-emerald-50/50 dark:from-gray-700/50 dark:to-emerald-900/20 rounded-xl">
                      <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-emerald-200 dark:from-gray-600 dark:to-emerald-600 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-emerald-200 dark:from-gray-600 dark:to-emerald-600 rounded animate-pulse"></div>
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-emerald-200 dark:from-gray-600 dark:to-emerald-600 rounded animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-emerald-50/50 dark:from-gray-700/50 dark:to-emerald-900/20 rounded-xl hover:from-emerald-50 hover:to-emerald-100/50 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/20 transition-all duration-300 hover-scale">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                        <UserPlus className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                          {activity.action}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          {new Date(activity.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-8 w-8 text-emerald-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {t('no_recent_activity', 'لا توجد أنشطة حديثة')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-amber-50 dark:from-gray-800 dark:via-gray-900 dark:to-amber-950 opacity-90"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-amber-100/30 dark:to-amber-900/30 group-hover:to-amber-200/50 dark:group-hover:to-amber-800/50 transition-all duration-700"></div>
              
              <CardHeader className="relative pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-lg opacity-20"></div>
                    <div className="relative inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {t('quick_actions', 'إجراءات سريعة')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <Button 
                  onClick={() => navigate("/family-builder?new=true")} 
                  variant="outline" 
                  className="w-full justify-start text-right h-auto p-6 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl hover-scale transition-all duration-300"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-semibold text-lg text-emerald-700 dark:text-emerald-300">{t('add_family_member', 'إضافة فرد جديد')}</div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400">{t('add_member_desc', 'أضف معلومات فرد جديد للعائلة')}</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  onClick={() => navigate("/family-tree-view")} 
                  variant="outline" 
                  className="w-full justify-start text-right h-auto p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover-scale transition-all duration-300"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                      <TreePine className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-semibold text-lg text-blue-700 dark:text-blue-300">{t('view_family_tree', 'عرض شجرة العائلة')}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">{t('tree_view_desc', 'استكشف شجرة عائلتك التفاعلية')}</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  onClick={() => navigate("/family-statistics")} 
                  variant="outline" 
                  className="w-full justify-start text-right h-auto p-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl hover-scale transition-all duration-300"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-semibold text-lg text-purple-700 dark:text-purple-300">{t('view_statistics', 'عرض الإحصائيات')}</div>
                      <div className="text-sm text-purple-600 dark:text-purple-400">{t('stats_desc', 'تحليل بيانات عائلتك والإحصائيات')}</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  onClick={() => navigate("/profile")} 
                  variant="outline" 
                  className="w-full justify-start text-right h-auto p-6 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-900/20 dark:hover:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl hover-scale transition-all duration-300"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-semibold text-lg text-amber-700 dark:text-amber-300">{t('profile_settings', 'إعدادات الملف الشخصي')}</div>
                      <div className="text-sm text-amber-600 dark:text-amber-400">{t('profile_desc', 'تحديث معلوماتك الشخصية')}</div>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <LuxuryFooter />
    </div>
  );
};

export default Dashboard;