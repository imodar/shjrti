import { useState, useEffect } from "react";
import { 
  Sparkles, 
  TreePine,
  Crown,
  Plus,
  Users,
  Calendar,
  Edit,
  Eye,
  Trash2,
  ArrowRight,
  Heart,
  Star,
  Gem,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FamilyTree {
  id: string;
  name: string;
  members_count: number;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  first_name?: string;
  last_name?: string;
}

interface UserSubscription {
  package_name?: string;
  status?: string;
  is_expired?: boolean;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Fetch family trees
        const { data: families, error: familiesError } = await supabase
          .from('families')
          .select(`
            id,
            name,
            created_at,
            updated_at,
            family_tree_members(count)
          `)
          .eq('creator_id', user.id);

        if (familiesError) throw familiesError;

        const treesData = families?.map(family => ({
          id: family.id,
          name: family.name,
          members_count: family.family_tree_members?.[0]?.count || 0,
          created_at: family.created_at,
          updated_at: family.updated_at
        })) || [];

        setFamilyTrees(treesData);

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (!profileError && profile) {
          setUserProfile(profile);
        }

        // Fetch user subscription
        const { data: subscription, error: subscriptionError } = await supabase
          .rpc('get_user_subscription_details', { user_uuid: user.id });

        if (!subscriptionError && subscription && subscription.length > 0) {
          setUserSubscription(subscription[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ في تحميل البيانات",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id, toast]);

  // Delete family tree
  const handleDeleteTree = async (treeId: string) => {
    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', treeId)
        .eq('creator_id', user?.id);

      if (error) throw error;

      setFamilyTrees(prev => prev.filter(tree => tree.id !== treeId));
      toast({
        title: "تم الحذف",
        description: "تم حذف الشجرة بنجاح"
      });
    } catch (error) {
      console.error('Error deleting tree:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف الشجرة",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <SubscriptionGuard>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
          </div>

          {/* Floating Animated Icons */}
          <div className="absolute top-32 right-20 animate-float">
            <Heart className="h-10 w-10 text-pink-400 opacity-60" />
          </div>
          <div className="absolute bottom-40 left-20 animate-float-delayed">
            <Users className="h-12 w-12 text-emerald-400 opacity-40" />
          </div>
          <div className="absolute top-1/2 left-10 animate-float-slow">
            <Star className="h-8 w-8 text-yellow-400 opacity-60" />
          </div>

          <main className="relative z-10 pt-20">
            {/* Hero Section */}
            <section className={`${familyTrees.length > 0 ? 'py-6' : 'py-12'} relative`}>
              <div className="container mx-auto px-4 relative z-10">
                <div className="mb-8 relative">
                  {/* Main Content Container - Horizontal Rectangle */}
                  <div className="relative max-w-5xl mx-auto">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
                    
                    <div className={`relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl ${familyTrees.length > 0 ? 'p-4' : 'p-6'} shadow-xl`}>
                      <div className="flex items-center justify-between gap-8">
                        {/* Left: Avatar & Welcome */}
                        <div className="flex items-center gap-6">
                          {/* User Avatar */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
                            <div className={`relative ${familyTrees.length > 0 ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-xl border-3 border-white/30 dark:border-gray-700/30`}>
                              <span className={`${familyTrees.length > 0 ? 'text-lg' : 'text-xl'} font-bold text-white`}>
                                {userProfile?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            {/* Status Indicator */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                            </div>
                          </div>
                          
                          {/* Welcome Text */}
                          <div className="text-right">
                            <h1 className={`${familyTrees.length > 0 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'} font-bold`}>
                              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                                أهلاً {userProfile?.first_name || user?.email?.split('@')[0] || 'صديقي العزيز'}
                              </span>
                            </h1>
                          </div>
                        </div>

                        {/* Center: Tree Count & Description */}
                        <div className="flex-1 text-center">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            {familyTrees.length === 1 ? (
                              <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full">
                                <TreePine className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">شجرة واحدة</span>
                              </div>
                            ) : (
                              <>
                                <TreePine className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                                  {familyTrees.length === 0 
                                    ? t('no_trees', 'لا توجد أشجار بعد')
                                    : `${familyTrees.length} ${t('trees', 'أشجار')}`
                                  }
                                </span>
                              </>
                            )}
                          </div>
                          {familyTrees.length === 0 && (
                            <p className="text-gray-600 dark:text-gray-300">
                              {t('no_trees_desc', 'ابدأ رحلتك في بناء إرثك العائلي الرقمي')}
                            </p>
                          )}
                        </div>

                        {/* Right: Badge & Subscription Status */}
                        <div className="flex flex-col items-center gap-3">
                          {/* Subscription Status */}
                          {userSubscription?.package_name && !userSubscription?.is_expired ? (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg">
                              <Crown className="h-4 w-4" />
                              <span className="text-sm font-bold">مشترك مميز</span>
                            </div>
                          ) : !userSubscription?.package_name ? (
                            <div className="flex flex-col items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-4 border border-amber-200/50 dark:border-amber-700/50 shadow-lg">
                              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <Gem className="h-4 w-4" />
                                <span className="text-sm font-medium">حساب مجاني</span>
                              </div>
                              <Link to="/plan-selection">
                                <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs px-3 py-1 rounded-full border-0">
                                  طوّر حسابك
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 shadow-lg animate-pulse">
                              <Sparkles className="h-4 w-4 ml-2" />
                              {t('dashboard_welcome_badge', 'لوحة التحكم')}
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                            <span>
                              {familyTrees.length === 0 
                                ? t('ready_to_start', 'جاهز للبدء؟')
                                : t('manage_trees', 'إدارة أشجارك أدناه')
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute top-2 right-2 w-6 h-6 border-r border-t border-emerald-300/40 dark:border-emerald-700/40"></div>
                      <div className="absolute bottom-2 left-2 w-6 h-6 border-l border-b border-emerald-300/40 dark:border-emerald-700/40"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {loading ? (
              <section className="py-12">
                <div className="container mx-auto px-4">
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                  </div>
                </div>
              </section>
            ) : familyTrees.length === 0 ? (
              // Empty State - Encourage Building First Tree
              <section className="py-12 relative">
                <div className="container mx-auto px-4 relative z-10">
                  {/* Encouragement Section */}
                  <div className="text-center mb-16">
                    <div className="mb-8">
                      <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-2xl mb-8 animate-pulse">
                        <TreePine className="h-16 w-16 text-white" />
                      </div>
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                      <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        {t('start_your_legacy', 'ابدأ إرثك العائلي')}
                      </span>
                    </h2>
                    
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
                      {t('building_easy_desc', 'بناء شجرة عائلتك أمر بسيط وممتع! فقط ببضع خطوات ستحصل على شجرة رائعة تحفظ تاريخ عائلتك للأبد')}
                    </p>

                    <Link to="/family-builder?new=true">
                      <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-xl px-12 py-6 rounded-full shadow-2xl hover-scale">
                        <Plus className="h-6 w-6 ml-3" />
                        {t('build_first_tree', 'ابني شجرتك الأولى الآن')}
                      </Button>
                    </Link>
                  </div>

                  {/* Why Build Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {[
                      {
                        icon: <Heart className="h-8 w-8" />,
                        title: t('preserve_memories', 'احفظ الذكريات'),
                        description: t('preserve_memories_desc', 'احفظ قصص وذكريات عائلتك للأجيال القادمة'),
                        color: "from-pink-500 to-rose-500"
                      },
                      {
                        icon: <Crown className="h-8 w-8" />,
                        title: t('family_pride', 'فخر العائلة'),
                        description: t('family_pride_desc', 'اعرض تاريخ عائلتك العريق بطريقة جميلة ومنظمة'),
                        color: "from-amber-500 to-orange-500"
                      },
                      {
                        icon: <Shield className="h-8 w-8" />,
                        title: t('secure_heritage', 'تراث آمن'),
                        description: t('secure_heritage_desc', 'احم معلومات عائلتك بأعلى مستويات الأمان'),
                        color: "from-emerald-500 to-teal-500"
                      }
                    ].map((benefit, index) => (
                      <Card key={index} className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-emerald-50 dark:from-gray-800 dark:via-gray-900 dark:to-emerald-950 opacity-90"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-700"></div>
                        <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                        
                        <CardContent className="relative p-8 text-center">
                          <div className="relative mb-6">
                            <div className={`absolute inset-0 bg-gradient-to-r ${benefit.color} rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 scale-110`}></div>
                            <div className={`relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-full shadow-xl group-hover:shadow-2xl group-hover:scale-125 transition-all duration-500`}>
                              <div className="text-white">
                                {benefit.icon}
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                            {benefit.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                            {benefit.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Simple Steps */}
                  <div className="mt-16 text-center">
                    <h3 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">
                      {t('just_three_steps', 'فقط ثلاث خطوات بسيطة')}
                    </h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
                        <span className="text-lg text-gray-700 dark:text-gray-300">{t('step_1_simple', 'أضف اسمك')}</span>
                      </div>
                      <ArrowRight className="h-6 w-6 text-emerald-500 transform md:rotate-0 rotate-90" />
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">2</div>
                        <span className="text-lg text-gray-700 dark:text-gray-300">{t('step_2_simple', 'أضف أفراد العائلة')}</span>
                      </div>
                      <ArrowRight className="h-6 w-6 text-emerald-500 transform md:rotate-0 rotate-90" />
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">3</div>
                        <span className="text-lg text-gray-700 dark:text-gray-300">{t('step_3_simple', 'استمتع بالنتيجة')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              // Show Existing Trees - Modern Design
              <section className="py-8 relative">
                <div className="container mx-auto px-4 relative z-10">
                  {/* Modern Header */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-amber-500/5 rounded-3xl blur-3xl"></div>
                    <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-2xl border border-white/30 dark:border-gray-700/30 rounded-3xl p-6 shadow-2xl">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
                            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl">
                              <TreePine className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          <div>
                            <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                                {t('your_family_trees', 'أشجارك العائلية')}
                              </span>
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {familyTrees.length} {t('trees', familyTrees.length === 1 ? 'شجرة' : 'أشجار')} • {familyTrees.reduce((acc, tree) => acc + tree.members_count, 0)} {t('total_members', 'فرد إجمالي')}
                            </p>
                          </div>
                        </div>
                        <Link to="/family-builder?new=true">
                          <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl shadow-xl hover-scale border-0">
                            <Plus className="h-5 w-5 ml-2" />
                            {t('create_new_tree', 'إنشاء شجرة جديدة')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Modern Trees Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {familyTrees.map((tree, index) => (
                      <Card key={tree.id} className="group relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-3xl">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-emerald-50/50 to-teal-50/50 dark:from-gray-800/80 dark:via-emerald-950/50 dark:to-teal-950/50"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-teal-500/0 to-amber-500/0 group-hover:from-emerald-500/10 group-hover:via-teal-500/10 group-hover:to-amber-500/10 transition-all duration-500"></div>
                        
                        {/* Content */}
                        <div className="relative">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <TreePine className="h-7 w-7 text-white" />
                                  </div>
                                </div>
                                <div>
                                  <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 mb-1">
                                    {tree.name}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{new Date(tree.created_at).toLocaleDateString('en-GB')}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-0 px-3 py-1 rounded-full text-xs font-medium">
                                {tree.members_count} {t('member', 'فرد')}
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            {/* Last Update */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl px-3 py-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              <span className="font-medium">
                                {t('last_update', 'آخر تحديث')}: {new Date(tree.updated_at).toLocaleDateString('en-GB')}
                              </span>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                              <Link to={`/family-tree-view?family=${tree.id}`} className="group/btn">
                                <Button variant="outline" size="sm" className="w-full h-11 border-emerald-200/60 dark:border-emerald-700/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 rounded-xl">
                                  <Eye className="h-4 w-4 mb-1 group-hover/btn:scale-110 transition-transform duration-200" />
                                  <span className="text-xs">{t('view', 'عرض')}</span>
                                </Button>
                              </Link>
                              <Link to={`/family-overview?family=${tree.id}`} className="group/btn">
                                <Button variant="outline" size="sm" className="w-full h-11 border-emerald-200/60 dark:border-emerald-700/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 rounded-xl">
                                  <Edit className="h-4 w-4 mb-1 group-hover/btn:scale-110 transition-transform duration-200" />
                                  <span className="text-xs">{t('manage', 'إدارة')}</span>
                                </Button>
                              </Link>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full h-11 border-red-200/60 dark:border-red-700/40 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 rounded-xl group/btn"
                                onClick={() => handleDeleteTree(tree.id)}
                              >
                                <Trash2 className="h-4 w-4 mb-1 group-hover/btn:scale-110 transition-transform duration-200" />
                                <span className="text-xs">{t('delete', 'حذف')}</span>
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </SubscriptionGuard>
    </div>
  );
};

export default Dashboard;