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
import { Plus, Users, Calendar, Share2, Edit, Trash2, Crown, TrendingUp, Eye, Copy, CheckCircle, Sparkles, BarChart3, PieChart, Gift, Zap, Settings, User, LogOut, Bell, Heart, Star, TreePine, Gem, Camera, UserPlus, Activity, Clock, Play, Infinity } from "lucide-react";
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
import { Link } from "react-router-dom";

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
      
      {/* Hero Dashboard Section - Matching Home Page Style */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-transparent to-amber-900/20"></div>
        
        {/* Floating Elements - Same as Home Page */}
        <div className="absolute top-20 right-10 animate-pulse">
          <Heart className="h-12 w-12 text-pink-400 opacity-60" />
        </div>
        <div className="absolute bottom-32 left-16 animate-bounce">
          <Users className="h-16 w-16 text-emerald-400 opacity-40" />
        </div>
        <div className="absolute top-40 left-32 animate-pulse">
          <Star className="h-8 w-8 text-yellow-400 opacity-60" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Welcome Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 text-sm">
                  <Sparkles className="h-4 w-4 ml-2" />
                  {t('dashboard_badge', 'لوحة التحكم المتقدمة')}
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent leading-tight">
                  {t('dashboard_welcome', 'مرحباً')}
                  <br />
                  <span className="text-gray-800 dark:text-gray-200">
                    {(profile as any)?.full_name || (profile as any)?.name || user?.email?.split('@')[0] || t('guest', 'ضيف')}
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t('dashboard_description', 'إدارة شاملة لتراثك العائلي الرقمي. تحكم في أشجارك، تابع الإحصائيات، واستكشف تاريخ عائلتك من مكان واحد متقدم.')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/family-builder?new=true">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-4 rounded-full shadow-xl hover-scale">
                    <Plus className="h-5 w-5 ml-2" />
                    {t('add_new_member', 'إضافة فرد جديد')}
                  </Button>
                </Link>
                <Link to="/family-tree-view">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 text-lg px-8 py-4 rounded-full">
                    <TreePine className="h-5 w-5 ml-2" />
                    {t('view_family_tree', 'عرض الشجرة')}
                  </Button>
                </Link>
              </div>

              {/* Stats Row - Matching Home Page */}
              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{trees.length}</div>
                  <div className="text-sm text-gray-500">{t('family_trees', 'شجرة عائلية')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{totalMembers}</div>
                  <div className="text-sm text-gray-500">{t('total_members', 'فرد محفوظ')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{profileCompletion}%</div>
                  <div className="text-sm text-gray-500">{t('completion_rate', 'معدل الإكمال')}</div>
                </div>
              </div>
            </div>

            {/* Right Side - Creative Dashboard Visualization */}
            <div className="relative animate-scale-in">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30">
                
                {/* Dashboard Preview Content */}
                <div className="p-8 h-[600px] flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">نظرة عامة</h3>
                    <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      مباشر
                    </Badge>
                  </div>
                  
                  {/* Mini Stats Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 text-center backdrop-blur-sm">
                      <Users className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-emerald-600">{totalMembers}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">الأفراد</div>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 text-center backdrop-blur-sm">
                      <TreePine className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-teal-600">{trees.length}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">الأشجار</div>
                    </div>
                  </div>
                  
                  {/* Progress Visualization */}
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-6 mb-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">اكتمال البيانات</span>
                      <span className="text-sm font-bold text-emerald-600">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-3 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  
                  {/* Quick Actions Preview */}
                  <div className="flex-1 flex flex-col gap-3">
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl justify-start" size="sm">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة فرد جديد
                    </Button>
                    <Button variant="outline" className="w-full border-emerald-200 dark:border-emerald-700 rounded-xl justify-start" size="sm">
                      <Eye className="h-4 w-4 ml-2" />
                      استكشاف الشجرة
                    </Button>
                    <Button variant="outline" className="w-full border-emerald-200 dark:border-emerald-700 rounded-xl justify-start" size="sm">
                      <BarChart3 className="h-4 w-4 ml-2" />
                      عرض الإحصائيات
                    </Button>
                  </div>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Cards - Same Style as Home Page */}
              <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-bounce">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium">{t('live_activity', 'نشاط مباشر')}</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl animate-pulse">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">{t('smart_control', 'تحكم ذكي')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Matching Home Page Luxury Design */}
      <section className="relative py-32 overflow-hidden">
        {/* Luxury Background - Same as Home Page */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.3),transparent_50%)]"></div>
        
        {/* Floating Decorations - Same as Home Page */}
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Luxury Header - Same Style as Home Page */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg">
              <Sparkles className="h-4 w-4" />
              {t('dashboard_features_badge', 'ميزات متقدمة')}
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                {t('dashboard_features_title_1', 'إدارة')}
              </span>
              <br />
              <span className="text-gray-800 dark:text-gray-200">{t('dashboard_features_title_2', 'متكاملة')}</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('dashboard_features_description', 'تجربة متكاملة لإدارة تراثك العائلي بأحدث التقنيات والأدوات المتقدمة')}
            </p>
          </div>

          {/* Dashboard Features Grid - Same Luxury Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Activity className="h-8 w-8" />,
                title: t('activity_monitoring', 'مراقبة النشاط'),
                description: t('activity_monitoring_desc', 'تابع جميع الأنشطة والتحديثات في الوقت الفعلي')
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: t('advanced_analytics', 'تحليلات متقدمة'),
                description: t('advanced_analytics_desc', 'إحصائيات تفصيلية ورؤى عميقة حول بيانات عائلتك')
              },
              {
                icon: <Settings className="h-8 w-8" />,
                title: t('smart_management', 'إدارة ذكية'),
                description: t('smart_management_desc', 'أدوات متطورة لإدارة وتنظيم معلومات العائلة')
              },
              {
                icon: <Infinity className="h-8 w-8" />,
                title: t('unlimited_access', 'وصول لا محدود'),
                description: t('unlimited_access_desc', 'استخدم جميع الميزات دون قيود أو حدود')
              }
            ].map((feature, index) => (
              <Card key={index} className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-4 hover:rotate-1">
                {/* Luxury Card Background - Same as Home Page */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-emerald-50 dark:from-gray-800 dark:via-gray-900 dark:to-emerald-950 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-100/30 dark:to-emerald-900/30 group-hover:to-emerald-200/50 dark:group-hover:to-emerald-800/50 transition-all duration-700"></div>
                
                {/* Luxury Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-700"></div>
                <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                
                <CardContent className="relative p-10 text-center">
                  {/* Luxury Icon - Same Style as Home Page */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 scale-110"></div>
                    <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-full shadow-xl group-hover:shadow-2xl group-hover:scale-125 transition-all duration-500">
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce"></div>
                  </div>
                  
                  {/* Luxury Text - Same Style as Home Page */}
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  {/* Luxury Bottom Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Luxury Call to Action - Same Style as Home Page */}
          <div className="text-center mt-20">
            <div className="inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-lg font-medium">
              <Star className="h-5 w-5 text-amber-500" />
              <span>{t('dashboard_cta', 'ابدأ إدارة تراثك الآن')}</span>
              <Star className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section - Enhanced Version */}
      <section className="relative py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 text-sm mb-6">
              <Zap className="h-4 w-4 ml-2" />
              {t('quick_actions_badge', 'إجراءات سريعة')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                {t('quick_actions_title', 'ابدأ من هنا')}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Add New Member Card */}
            <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('add_member_card_title', 'إضافة فرد جديد')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{t('add_member_card_desc', 'أضف أفراد جدد لعائلتك وحافظ على تحديث الشجرة')}</p>
                <Link to="/family-builder?new=true">
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl">
                    {t('start_adding', 'ابدأ الإضافة')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* View Family Tree Card */}
            <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300">
                  <TreePine className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('view_tree_card_title', 'استكشاف الشجرة')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{t('view_tree_card_desc', 'تصفح شجرة عائلتك التفاعلية واستكشف الروابط')}</p>
                <Link to="/family-tree-view">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl">
                    {t('explore_now', 'استكشف الآن')}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('stats_card_title', 'الإحصائيات')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{t('stats_card_desc', 'اطلع على تحليلات مفصلة حول بيانات عائلتك')}</p>
                <Link to="/family-statistics">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl">
                    {t('view_statistics', 'عرض الإحصائيات')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <LuxuryFooter />
    </div>
  );
};

export default Dashboard;