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

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's family trees
  useEffect(() => {
    const fetchFamilyTrees = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const { data: families, error } = await supabase
          .from('families')
          .select(`
            id,
            name,
            created_at,
            updated_at,
            family_tree_members(count)
          `)
          .eq('creator_id', user.id);

        if (error) throw error;

        const treesData = families?.map(family => ({
          id: family.id,
          name: family.name,
          members_count: family.family_tree_members?.[0]?.count || 0,
          created_at: family.created_at,
          updated_at: family.updated_at
        })) || [];

        setFamilyTrees(treesData);
      } catch (error) {
        console.error('Error fetching family trees:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ في تحميل البيانات",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyTrees();
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
            <section className="py-12 relative">
              <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-12 relative">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60"></div>
                  </div>
                  
                  {/* Main Content Container */}
                  <div className="relative max-w-4xl mx-auto">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-3xl blur-3xl"></div>
                    
                    <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-3xl p-12 shadow-2xl">
                      {/* Floating Badge */}
                      <div className="relative mb-8">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6">
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 text-base shadow-2xl animate-pulse">
                            <Sparkles className="h-5 w-5 ml-3 animate-spin" />
                            {t('dashboard_welcome_badge', 'لوحة التحكم')}
                            <Sparkles className="h-5 w-5 mr-3 animate-spin" />
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Avatar & Name Section */}
                      <div className="flex flex-col items-center mb-8">
                        {/* User Avatar */}
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-xl opacity-40 animate-pulse scale-125"></div>
                          <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30 dark:border-gray-700/30">
                            <span className="text-3xl font-bold text-white">
                              {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          {/* Status Indicator */}
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                          </div>
                        </div>
                        
                        {/* Welcome Text */}
                        <div className="text-center">
                          <h1 className="text-3xl md:text-5xl font-bold mb-4">
                            <span className="block text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-normal mb-2">
                              {t('dashboard_welcome', 'أهلاً وسهلاً')}
                            </span>
                            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                              {user?.email?.split('@')[0] || t('dashboard_user', 'صديقي العزيز')}
                            </span>
                          </h1>
                        </div>
                      </div>
                      
                      {/* Stats & Description */}
                      <div className="space-y-6">
                        {/* Tree Count with Icon */}
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-6 py-3 rounded-full border border-emerald-300/30 dark:border-emerald-700/30">
                            <TreePine className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                              {familyTrees.length === 0 
                                ? t('no_trees', 'لا توجد أشجار بعد')
                                : `${familyTrees.length} ${t('trees', familyTrees.length === 1 ? 'شجرة' : 'أشجار')}`
                              }
                            </span>
                          </div>
                        </div>
                        
                        {/* Main Description */}
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
                          {familyTrees.length === 0 
                            ? t('no_trees_desc', 'ابدأ رحلتك في بناء إرثك العائلي الرقمي')
                            : t('trees_count_desc', 'استمر في توثيق وتطوير تاريخ عائلتك')
                          }
                        </p>
                        
                        {/* Action Hint */}
                        <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                          <span>
                            {familyTrees.length === 0 
                              ? t('ready_to_start', 'جاهز للبدء؟')
                              : t('manage_trees', 'إدارة أشجارك أدناه')
                            }
                          </span>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        </div>
                      </div>
                      
                      {/* Decorative Corner Elements */}
                      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-emerald-300/40 dark:border-emerald-700/40"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-emerald-300/40 dark:border-emerald-700/40"></div>
                      
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10 dark:opacity-5">
                        <div className="absolute top-10 right-20 w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-16 right-16 w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                        <div className="absolute top-16 left-20 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-20 left-12 w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                      </div>
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
              // Show Existing Trees
              <section className="py-12 relative">
                <div className="container mx-auto px-4 relative z-10">
                  {/* Trees Header */}
                  <div className="flex flex-col md:flex-row justify-between items-center mb-12">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                          {t('your_family_trees', 'أشجارك العائلية')}
                        </span>
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300">
                        {t('manage_trees_desc', 'إدارة وتطوير أشجارك العائلية')}
                      </p>
                    </div>
                    <Link to="/family-builder?new=true">
                      <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-4 rounded-full shadow-xl">
                        <Plus className="h-5 w-5 ml-2" />
                        {t('create_new_tree', 'إنشاء شجرة جديدة')}
                      </Button>
                    </Link>
                  </div>

                  {/* Trees Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {familyTrees.map((tree, index) => (
                      <Card key={tree.id} className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-emerald-50 dark:from-gray-800 dark:via-gray-900 dark:to-emerald-950 opacity-90"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-700"></div>
                        <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                        
                        <CardHeader className="relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                                <TreePine className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                                  {tree.name}
                                </CardTitle>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(tree.created_at).toLocaleDateString('ar-SA')}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                              {tree.members_count} {t('member', 'فرد')}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="relative">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {t('last_update', 'آخر تحديث')}: {new Date(tree.updated_at).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Link to={`/family-tree-view?family=${tree.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                <Eye className="h-4 w-4 ml-2" />
                                {t('view', 'عرض')}
                              </Button>
                            </Link>
                            <Link to={`/family-overview?family=${tree.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                <Edit className="h-4 w-4 ml-2" />
                                {t('manage', 'إدارة')}
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                              onClick={() => handleDeleteTree(tree.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
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