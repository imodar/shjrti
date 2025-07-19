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
import { Plus, Users, Calendar, Share2, Edit, Trash2, Crown, TrendingUp, Eye, Copy, CheckCircle, Sparkles, BarChart3, PieChart, Gift, Zap, Settings, User, LogOut, Bell, Heart, Star, TreePine, Gem, Camera, UserPlus, Activity, Palette, Brush, Layers, Globe, Shield, Infinity } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <Header />
      
      {/* Creative Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full animate-pulse transform rotate-45"></div>
        <div className="absolute top-40 left-10 w-24 h-24 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 transform rotate-12 animate-bounce" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
        <div className="absolute bottom-40 right-32 w-28 h-28 bg-gradient-to-r from-pink-400/20 to-rose-500/20 rounded-lg transform rotate-45 animate-pulse"></div>
        <div className="absolute top-60 right-60 w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 transform rotate-45 animate-bounce"></div>
        
        {/* Creative Mesh Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(34,197,94,0.2),transparent_50%)]"></div>
        
        {/* Floating Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <path d="M100,200 Q200,100 300,200 T500,200" stroke="url(#grad1)" strokeWidth="2" fill="none" className="animate-pulse" />
          <path d="M600,300 Q700,200 800,300 T1000,300" stroke="url(#grad1)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDelay: '1s' }} />
        </svg>
      </div>

      {/* Main Creative Content */}
      <main className="relative z-10 pt-24">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          
          {/* Creative Hero Section - Artistic Layout */}
          <div className="mb-20">
            <div className="relative">
              {/* Floating Welcome Card */}
              <div className="absolute -top-10 -left-10 w-72 h-40 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl backdrop-blur-md border border-white/10 transform -rotate-6 animate-pulse"></div>
              
              {/* Main Hero Content */}
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-[3rem] p-12 border border-white/20 shadow-2xl">
                {/* Creative Header Layout */}
                <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
                  
                  {/* Left: Welcome Content */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-20 bg-gradient-to-b from-cyan-400 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                      <div>
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium border border-white/20">
                          <Crown className="h-4 w-4" />
                          {t('dashboard_badge', 'مساحة الإبداع الشخصية')}
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-bold mt-4 leading-tight">
                          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            أهلاً وسهلاً
                          </span>
                          <br />
                          <span className="text-white/90">
                            {(profile as any)?.full_name || (profile as any)?.name || user?.email?.split('@')[0] || t('guest', 'صديقي')}
                          </span>
                        </h1>
                        <p className="text-xl text-white/70 leading-relaxed mt-4 max-w-xl">
                          رحلة استثنائية عبر تراثك العائلي في عالم رقمي مبتكر ومليء بالإبداع
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Creative Action Panel */}
                  <div className="relative">
                    {/* Floating Background */}
                    <div className="absolute -inset-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl transform rotate-3 animate-pulse"></div>
                    
                    <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                      <div className="space-y-4">
                        <Button 
                          onClick={handleCreateTree}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                          <Plus className="h-5 w-5 ml-2" />
                          {t('create_masterpiece', 'ابدأ التحفة')}
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Button variant="outline" className="border-white/20 text-white/80 hover:bg-white/10 backdrop-blur-sm rounded-xl">
                            <Settings className="h-4 w-4 ml-2" />
                            إعدادات
                          </Button>
                          <Button variant="outline" className="border-white/20 text-white/80 hover:bg-white/10 backdrop-blur-sm rounded-xl">
                            <Palette className="h-4 w-4 ml-2" />
                            تخصيص
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Creative Stats Bar */}
                <div className="mt-12 grid grid-cols-4 gap-6">
                  {[
                    { value: trees.length, label: 'أشجار', icon: TreePine, color: 'from-emerald-400 to-cyan-400' },
                    { value: totalMembers, label: 'أفراد', icon: Users, color: 'from-blue-400 to-purple-400' },
                    { value: `${profileCompletion}%`, label: 'مكتمل', icon: Layers, color: 'from-purple-400 to-pink-400' },
                    { value: memoryCount, label: 'ذكريات', icon: Camera, color: 'from-pink-400 to-rose-400' }
                  ].map((stat, index) => (
                    <div key={index} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
                      <div className="relative text-center p-6">
                        <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl mb-3 shadow-lg`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-white">{isLoading ? '...' : stat.value}</div>
                        <div className="text-sm text-white/60">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Creative Dashboard Grid - Asymmetrical Layout */}
          <div className="grid grid-cols-12 gap-8 mb-20">
            
            {/* Large Feature Card - Spans 8 columns */}
            <div className="col-span-12 lg:col-span-8">
              <div className="relative h-96">
                {/* Creative Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl transform rotate-1"></div>
                
                <div className="relative h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/20">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Activity className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">النشاط الإبداعي</h3>
                      </div>
                      <Badge className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border-white/20">
                        مباشر
                      </Badge>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center">
                      {recentActivity.length > 0 ? (
                        <div className="space-y-4 w-full">
                          {recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
                                <UserPlus className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium">{activity.action}</p>
                                <p className="text-white/60 text-sm">{new Date(activity.created_at).toLocaleDateString('ar-SA')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-24 h-24 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10">
                            <Sparkles className="h-12 w-12 text-white/60" />
                          </div>
                          <h4 className="text-xl font-bold text-white mb-2">مساحة إبداعية فارغة</h4>
                          <p className="text-white/60">ابدأ رحلتك الإبداعية الآن</p>
                          <Button 
                            onClick={handleCreateTree}
                            className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl"
                          >
                            <Plus className="h-4 w-4 ml-2" />
                            إنشاء
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Creative Cards Stack */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              
              {/* Quick Actions Card */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 rounded-3xl transform -rotate-2 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">أدوات سريعة</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate("/family-builder?new=true")}
                      className="w-full bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 hover:from-emerald-600/50 hover:to-cyan-600/50 text-white border border-white/20 backdrop-blur-sm rounded-xl justify-start"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة فرد
                    </Button>
                    
                    <Button 
                      onClick={() => navigate("/family-tree-view")}
                      className="w-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 hover:from-blue-600/50 hover:to-purple-600/50 text-white border border-white/20 backdrop-blur-sm rounded-xl justify-start"
                    >
                      <TreePine className="h-4 w-4 ml-2" />
                      عرض الشجرة
                    </Button>
                    
                    <Button 
                      onClick={() => navigate("/family-statistics")}
                      className="w-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 text-white border border-white/20 backdrop-blur-sm rounded-xl justify-start"
                    >
                      <BarChart3 className="h-4 w-4 ml-2" />
                      الإحصائيات
                    </Button>
                  </div>
                </div>
              </div>

              {/* Creative Stats Card */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-rose-600/20 rounded-3xl transform rotate-1"></div>
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">نظرة عامة</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">معدل الإكمال</span>
                      <span className="text-white font-bold">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-2 bg-white/10" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">النشاط الأسبوعي</span>
                      <span className="text-white font-bold">+{recentMembers}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">الذكريات المحفوظة</span>
                      <span className="text-white font-bold">{memoryCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Creative Gallery Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm text-white px-8 py-3 rounded-full text-sm font-medium border border-white/20 mb-6">
                <Brush className="h-4 w-4" />
                معرض الإبداعات
                <Brush className="h-4 w-4" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  مجموعة أعمالك
                </span>
                <br />
                <span className="text-white/90">الفنية الرقمية</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                استكشف وأدر مجموعة أشجارك العائلية في تجربة بصرية مذهلة
              </p>
            </div>

            {trees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trees.map((tree, index) => (
                  <div key={tree.id} className="relative group">
                    {/* Creative Background Shape */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${
                      index % 4 === 0 ? 'from-emerald-600/20 to-cyan-600/20' :
                      index % 4 === 1 ? 'from-blue-600/20 to-purple-600/20' :
                      index % 4 === 2 ? 'from-purple-600/20 to-pink-600/20' :
                      'from-pink-600/20 to-rose-600/20'
                    } rounded-3xl transform group-hover:scale-105 group-hover:rotate-1 transition-all duration-500`}></div>
                    
                    <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 h-64">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <Badge className={`${
                            tree.isPublic ? 'bg-green-600/30 text-green-200' : 'bg-gray-600/30 text-gray-200'
                          } border-white/20`}>
                            {tree.isPublic ? '🌍 عام' : '🔒 خاص'}
                          </Badge>
                          <div className="flex gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              index % 4 === 0 ? 'bg-emerald-400' :
                              index % 4 === 1 ? 'bg-blue-400' :
                              index % 4 === 2 ? 'bg-purple-400' :
                              'bg-pink-400'
                            }`}></div>
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:scale-105 transition-transform duration-300">
                          {tree.name}
                        </h3>
                        
                        <p className="text-white/60 text-sm mb-4 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          آخر تحديث: {tree.lastUpdated}
                        </p>
                        
                        <div className="flex-1 flex items-end">
                          <div className="w-full grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                index % 4 === 0 ? 'text-emerald-400' :
                                index % 4 === 1 ? 'text-blue-400' :
                                index % 4 === 2 ? 'text-purple-400' :
                                'text-pink-400'
                              }`}>
                                {tree.members}
                              </div>
                              <div className="text-xs text-white/60">أفراد</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                index % 4 === 0 ? 'text-cyan-400' :
                                index % 4 === 1 ? 'text-purple-400' :
                                index % 4 === 2 ? 'text-pink-400' :
                                'text-rose-400'
                              }`}>
                                {tree.generations}
                              </div>
                              <div className="text-xs text-white/60">أجيال</div>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => navigate('/family-tree-view')}
                          className={`mt-4 w-full bg-gradient-to-r ${
                            index % 4 === 0 ? 'from-emerald-600 to-cyan-600' :
                            index % 4 === 1 ? 'from-blue-600 to-purple-600' :
                            index % 4 === 2 ? 'from-purple-600 to-pink-600' :
                            'from-pink-600 to-rose-600'
                          } text-white rounded-xl font-semibold transform hover:scale-105 transition-all duration-300`}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          استكشف
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-2xl"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
                    <TreePine className="h-16 w-16 text-white/60" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">لوحة فارغة تنتظر إبداعك</h3>
                <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                  ابدأ رحلة استثنائية في رسم تاريخ عائلتك الرقمي بأسلوب فني مبتكر
                </p>
                <Button 
                  onClick={handleCreateTree}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 rounded-2xl text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                >
                  <Plus className="h-6 w-6 ml-2" />
                  ابدأ التحفة الأولى
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <LuxuryFooter />
    </div>
  );
};

export default Dashboard;