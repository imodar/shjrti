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
  Shield,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  max_trees?: number;
  max_members?: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

        // Fetch user subscription with package details
        const { data: subscription, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            packages (
              name,
              max_family_trees,
              max_family_members
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (!subscriptionError && subscription) {
          // Parse package name JSON
          let packageDisplayName = 'باقة مجانية';
          if (subscription.packages?.name) {
            try {
              const nameObj = JSON.parse(subscription.packages.name);
              packageDisplayName = nameObj.ar || nameObj.en || 'باقة مجانية';
            } catch (e) {
              packageDisplayName = subscription.packages.name;
            }
          }
          
          setUserSubscription({
            package_name: packageDisplayName,
            status: subscription.status,
            is_expired: subscription.expires_at ? new Date(subscription.expires_at) <= new Date() : false,
            max_trees: subscription.packages?.max_family_trees || 1,
            max_members: subscription.packages?.max_family_members || 50
          });
        } else {
          // Default free package limits
          setUserSubscription({
            package_name: 'باقة مجانية',
            status: 'free',
            is_expired: false,
            max_trees: 1,
            max_members: 50
          });
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

  // Check if user can create new trees
  const canCreateNewTree = () => {
    if (!userSubscription?.max_trees) return false;
    return familyTrees.length < userSubscription.max_trees;
  };

  // Handle create new tree
  const handleCreateNewTree = () => {
    if (canCreateNewTree()) {
      // Navigate to family builder
      window.location.href = "/family-builder?new=true";
    } else {
      // Show upgrade modal
      setShowUpgradeModal(true);
    }
  };

  // Delete family tree
  const handleDeleteTree = async (treeId: string) => {
    console.log('🗑️ Attempting to delete tree:', treeId);
    console.log('👤 Current user ID:', user?.id);
    
    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', treeId)
        .eq('creator_id', user?.id);

      console.log('❌ Delete error:', error);

      if (error) throw error;

      setFamilyTrees(prev => prev.filter(tree => tree.id !== treeId));
      toast({
        title: "تم الحذف",
        description: "تم حذف الشجرة بنجاح"
      });
      console.log('✅ Tree deleted successfully');
    } catch (error) {
      console.error('🚨 Error deleting tree:', error);
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
            <section className={`${familyTrees.length > 0 ? 'py-4' : 'py-8'} relative`}>
              <div className="container mx-auto px-4 relative z-10">
                <div className="mb-6 relative">
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
                              <div className="flex items-center gap-3 bg-emerald-100 dark:bg-emerald-900/30 px-6 py-3 rounded-full shadow-lg">
                                <TreePine className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">لديك</span>
                                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">شجرة واحدة</span>
                                </div>
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
              <span className="text-sm font-bold">الباقة {userSubscription.package_name}</span>
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
                    <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-2xl border border-white/30 dark:border-gray-700/30 rounded-3xl p-4 shadow-2xl">
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
                            
                            {/* Package Usage Stats - Single Row Design */}
                            <div className="flex items-center gap-6 justify-center">
                              {/* Trees Usage */}
                              <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-700/40 rounded-2xl px-4 py-3 backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-700/30">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <TreePine className="h-5 w-5 text-white" />
                                  </div>
                                  {userSubscription?.max_trees && familyTrees.length >= userSubscription.max_trees && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{familyTrees.length}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">من</span>
                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{userSubscription?.max_trees || 1}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {familyTrees.length === 1 ? 'شجرة' : 'أشجار'}
                                  </p>
                                </div>
                              </div>

                              {/* Separator */}
                              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>

                              {/* Members Usage */}
                              <div className="flex items-center gap-3 bg-white/60 dark:bg-gray-700/40 rounded-2xl px-4 py-3 backdrop-blur-sm border border-teal-200/30 dark:border-teal-700/30">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Users className="h-5 w-5 text-white" />
                                  </div>
                                  {userSubscription?.max_members && familyTrees.reduce((acc, tree) => acc + tree.members_count, 0) >= userSubscription.max_members && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-teal-600 dark:text-teal-400">{familyTrees.reduce((acc, tree) => acc + tree.members_count, 0)}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">من</span>
                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{userSubscription?.max_members || 50}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">فرد</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                          <Button 
                            size="lg" 
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl shadow-xl hover-scale border-0"
                            onClick={handleCreateNewTree}
                          >
                            <Plus className="h-5 w-5 ml-2" />
                            {t('create_new_tree', 'إنشاء شجرة جديدة')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Creative Trees Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {familyTrees.map((tree, index) => (
                      <div key={tree.id} className="group relative">
                        {/* Floating Background Effect */}
                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-700 animate-pulse"></div>
                        
                        <Card className="relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 rounded-3xl">
                          {/* Dynamic Gradient Background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-emerald-50/60 to-teal-50/60 dark:from-gray-800/90 dark:via-emerald-950/60 dark:to-teal-950/60"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-gray-700/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          {/* Decorative Corner Elements */}
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-400/20 to-transparent rounded-bl-3xl"></div>
                          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-teal-400/20 to-transparent rounded-tr-3xl"></div>
                          
                          <CardHeader className="relative pb-6 pt-8">
                            <div className="flex items-start justify-between mb-4">
                              {/* Tree Icon with Family Name */}
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300 animate-pulse"></div>
                                  <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                                    <TreePine className="h-8 w-8 text-white drop-shadow-lg" />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full opacity-80 animate-ping"></div>
                                  </div>
                                </div>
                                
                                {/* Family Name Section */}
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">عائلة</span>
                                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 leading-tight">
                                    {tree.name}
                                  </h3>
                                </div>
                              </div>
                              
                              {/* Member Count Badge */}
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-sm opacity-60"></div>
                                <Badge className="relative bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white border-0 px-4 py-2 rounded-full text-sm font-bold shadow-xl backdrop-blur-sm">
                                  <Users className="h-3.5 w-3.5 ml-1" />
                                  {tree.members_count} فرد
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Creation Date */}
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mr-20">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">تم الإنشاء في {new Date(tree.created_at).toLocaleDateString('en-GB')}</span>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="relative pt-0 pb-8">
                            {/* Stats Row */}
                            <div className="bg-gradient-to-r from-gray-50/80 to-emerald-50/80 dark:from-gray-700/30 dark:to-emerald-900/30 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                  <Star className="h-4 w-4 fill-current" />
                                  <span className="font-semibold">آخر تحديث</span>
                                </div>
                                <span className="text-gray-600 dark:text-gray-300 font-medium">
                                  {new Date(tree.updated_at).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                            </div>
                            
                            {/* Action Buttons - New Creative Design */}
                            <div className="flex items-center justify-between gap-2">
                              {/* Manage Button - Primary */}
                              <Link to={`/family-overview?family=${tree.id}`} className="flex-1 group/btn">
                                <Button className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover/btn:scale-[1.02]">
                                  <Edit className="h-4 w-4 ml-2" />
                                  <span className="font-medium">إدارة</span>
                                </Button>
                              </Link>
                              
                              {/* View Button - Secondary */}
                              <Link to={`/family-tree-view?family=${tree.id}`} className="flex-1 group/btn">
                                <Button variant="outline" className="w-full h-11 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl transition-all duration-300 group-hover/btn:scale-[1.02]">
                                  <Eye className="h-4 w-4 ml-2" />
                                  <span className="font-medium">عرض</span>
                                </Button>
                              </Link>
                              
                              {/* Delete Button - Compact */}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-10 h-11 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 group/btn"
                                onClick={() => handleDeleteTree(tree.id)}
                              >
                                <Trash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
                              </Button>
                            </div>
                          </CardContent>
                          
                          {/* Floating Mini Icons */}
                          <div className="absolute top-4 left-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                            <Heart className="h-6 w-6 text-pink-400" />
                          </div>
                          <div className="absolute bottom-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                            <Gem className="h-5 w-5 text-amber-400" />
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </SubscriptionGuard>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-6 w-6 text-amber-500" />
                <span>ترقية الباقة مطلوبة</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-700/50">
              <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">حد الاستخدام</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                لقد وصلت للحد الأقصى المسموح في باقتك الحالية ({userSubscription?.max_trees || 1} شجرة)
              </p>
            </div>

            <p className="text-gray-600 dark:text-gray-300">
              لإنشاء المزيد من الأشجار العائلية، يمكنك ترقية باقتك للحصول على مميزات أكثر
            </p>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Link to="/plan-selection" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                  <Crown className="h-4 w-4 ml-2" />
                  ترقية الباقة
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;