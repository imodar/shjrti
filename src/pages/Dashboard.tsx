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
  ArrowLeft,
  Heart,
  Star,
  Gem,
  Shield,
  X
} from "lucide-react";
import { GlobalFooter } from "@/components/GlobalFooter";
import { GlobalHeader } from "@/components/GlobalHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTreeId, setDeleteTreeId] = useState<string | null>(null);
  const [deleteTreeName, setDeleteTreeName] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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
      // Navigate to family creator
      window.location.href = "/family-creator";
    } else {
      // Show upgrade modal
      setShowUpgradeModal(true);
    }
  };

  const handleDeleteTreeClick = (treeId: string, treeName: string) => {
    setDeleteTreeId(treeId);
    setDeleteTreeName(treeName);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTreeId || deleteConfirmText.trim() !== deleteTreeName.trim()) {
      toast({
        title: "خطأ في التأكيد",
        description: "يجب كتابة اسم الشجرة بشكل صحيح للتأكيد",
        variant: "destructive"
      });
      return;
    }

    console.log('🗑️ Attempting to delete tree:', deleteTreeId);
    console.log('👤 Current user ID:', user?.id);
    
    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', deleteTreeId)
        .eq('creator_id', user?.id);

      if (error) {
        console.error('❌ Delete error:', error);
        toast({
          title: "خطأ في الحذف",
          description: "حدث خطأ أثناء حذف شجرة العائلة",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Tree deleted successfully');
      
      // Remove from local state
      setFamilyTrees(prev => prev.filter(tree => tree.id !== deleteTreeId));
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setDeleteTreeId(null);
      setDeleteTreeName("");
      setDeleteConfirmText("");
      
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف شجرة العائلة بنجاح"
      });
    } catch (error) {
      console.error('❌ Unexpected error during deletion:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen">
      <GlobalHeader />
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
            <section className={`${familyTrees.length > 0 ? 'py-2' : 'py-4'} relative`}>
              <div className="container mx-auto px-4 relative z-10">
                <div className="mb-2 relative">
                  {/* Main Content Container - Horizontal Rectangle */}
                  <div className="relative max-w-5xl mx-auto">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
                    
                    <div className={`relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl ${familyTrees.length > 0 ? 'py-1.5 px-2' : 'py-2 px-3'} shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10`}>
                      <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
                        {/* Left: Avatar & Welcome */}
                        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                          {/* User Avatar */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
                            <div className={`relative ${familyTrees.length > 0 ? 'w-8 h-8' : 'w-12 h-12'} bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-xl border-3 border-white/30 dark:border-gray-700/30`}>
                              <span className={`${familyTrees.length > 0 ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-bold text-white`}>
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
                            <h1 className={`${familyTrees.length > 0 ? 'text-xs sm:text-sm md:text-base' : 'text-sm sm:text-base md:text-lg'} font-bold`}>
                              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                                أهلاً {userProfile?.first_name || user?.email?.split('@')[0] || 'صديقي العزيز'}
                              </span>
                            </h1>
                          </div>
                        </div>

                        {/* Center: Tree Count & Description */}
                        <div className="flex-1 text-center">
                          <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 mb-2 sm:mb-3">
                            {familyTrees.length === 1 ? (
                              <div className="flex items-center gap-1 sm:gap-2 md:gap-3 bg-emerald-100 dark:bg-emerald-900/30 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full shadow-lg">
                                <TreePine className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">لديك</span>
                                  <span className="text-xs sm:text-sm md:text-base font-bold text-emerald-700 dark:text-emerald-300">شجرة واحدة</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <TreePine className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs sm:text-sm md:text-base font-semibold text-emerald-700 dark:text-emerald-300">
                                  {familyTrees.length === 0 
                                    ? t('no_trees', 'لا توجد أشجار بعد')
                                    : `${familyTrees.length} ${t('trees', 'أشجار')}`
                                  }
                                </span>
                              </>
                            )}
                          </div>
                          {familyTrees.length === 0 && (
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                              {t('no_trees_desc', 'ابدأ رحلتك في بناء إرثك العائلي الرقمي')}
                            </p>
                          )}
                        </div>

                        {/* Right: Badge & Subscription Status */}
                        <div className="flex flex-col items-center gap-1 sm:gap-2 md:gap-3">
                          {/* Subscription Status */}
          {userSubscription?.package_name && !userSubscription?.is_expired ? (
            <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full shadow-lg">
              <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs font-bold">الباقة {userSubscription.package_name}</span>
            </div>
                          ) : !userSubscription?.package_name ? (
                            <div className="flex flex-col items-center gap-1 sm:gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 border border-amber-200/50 dark:border-amber-700/50 shadow-lg">
                              <div className="flex items-center gap-1 sm:gap-2 text-amber-600 dark:text-amber-400">
                                <Gem className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs font-medium">حساب مجاني</span>
                              </div>
                              <Link to="/plan-selection">
                                <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs px-2 sm:px-3 py-1 rounded-full border-0">
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
              <section className="py-2 pb-16 relative">
                <div className="container mx-auto px-4 relative z-10">
                  {/* Header with Icon and Title on Same Line */}
                  <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-xl">
                        <TreePine className="h-8 w-8 text-white" />
                      </div>
                      <h2 className="text-2xl md:text-4xl font-bold">
                        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                          {t('start_your_legacy', 'ابدأ إرثك العائلي')}
                        </span>
                      </h2>
                      <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
                        {t('building_easy_desc', 'بناء شجرة عائلتك أمر بسيط وممتع!')}
                      </p>
                    </div>
                  </div>

                  {/* Simplified Steps in One Row with Connection Lines */}
                  <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                      {/* Connection Lines - Between Icons */}
                      <div className="hidden md:block absolute top-4 inset-x-0 z-0">
                        <div className="flex justify-between items-center max-w-2xl mx-auto px-16">
                          <div className="w-32 h-0.5 bg-gradient-to-r from-emerald-300 to-teal-300"></div>
                          <div className="w-32 h-0.5 bg-gradient-to-r from-teal-300 to-amber-300"></div>
                        </div>
                      </div>
                      
                      {/* Step 1 */}
                      <div className="text-center group hover:scale-105 transition-transform duration-300 relative">
                        <div className="flex items-center justify-center gap-3 mb-3 relative z-10">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Plus className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                            {t('step1_title', 'إنشاء الشجرة')}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {t('step1_desc', 'ابدأ بإنشاء شجرة عائلتك الأولى وإعطائها اسماً مميزاً')}
                        </p>
                        {/* Arrow for desktop - RTL direction */}
                        <div className="hidden md:block absolute -left-4 top-6 text-emerald-400">
                          <svg className="w-4 h-4 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="text-center group hover:scale-105 transition-transform duration-300 relative">
                        <div className="flex items-center justify-center gap-3 mb-3 relative z-10">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                            {t('step2_title', 'إضافة الأفراد')}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {t('step2_desc', 'أضف أفراد عائلتك مع تفاصيلهم الشخصية والصور')}
                        </p>
                        {/* Arrow for desktop - RTL direction */}
                        <div className="hidden md:block absolute -left-4 top-6 text-teal-400">
                          <svg className="w-4 h-4 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="text-center group hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center justify-center gap-3 mb-3 relative z-10">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Heart className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                            {t('step3_title', 'حفظ الذكريات')}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {t('step3_desc', 'احفظ إرثك العائلي للأجيال القادمة')}
                        </p>
                      </div>

                      {/* Mobile Connection Lines */}
                      <div className="md:hidden col-span-full flex justify-center items-center gap-4 mt-4">
                        <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-300 to-teal-300"></div>
                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-teal-300 to-amber-300"></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-amber-300 to-orange-300"></div>
                      </div>
                    </div>
                  </div>

                  {/* Call to Action Section - Build First Tree */}
                  <div className="max-w-4xl mx-auto mt-20">
                    <div className="relative">
                      {/* Glow Background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/30 to-amber-600/20 rounded-3xl blur-3xl"></div>
                      
                      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-white/30 dark:border-gray-700/30 shadow-2xl text-center">
                        {/* Icon */}
                        <div className="flex items-center justify-center mb-8">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl">
                              <TreePine className="h-10 w-10 text-white" />
                            </div>
                          </div>
                        </div>

                        <h3 className="text-3xl md:text-4xl font-bold mb-6">
                          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                            {t('build_first_tree', 'اصنع أول شجرة عائلية')}
                          </span>
                        </h3>

                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                          {t('first_tree_desc', 'بخطوات بسيطة ، ستبدأ رحلة حفظ تاريخ عائلتك ، إبدأ الآن واصنع إرثك الرقمي ليدوم للأبد')}
                        </p>

                        {/* Action Button */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                          <Button 
                            onClick={handleCreateNewTree}
                            className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 text-white border-0 rounded-2xl px-8 py-4 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-3">
                              <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                              <span>{t('create_first_tree', 'إنشاء شجرتي الأولى')}</span>
                              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
                            </div>
                          </Button>

                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                            <span className="font-medium">{t('free_to_start', 'مجاني للبدء')}</span>
                          </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full opacity-60 animate-bounce"></div>
                        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full opacity-60 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="py-4 relative mt-2">
                <div className="container mx-auto px-4 relative z-10">
                  {/* Statistics Box */}
                  <div className="w-full bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-amber-950/50 rounded-xl p-3 mb-6 border border-emerald-200/50 dark:border-emerald-700/50">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Total Families */}
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="flex-shrink-0">
                          <TreePine className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              أشجار العائلة
                            </div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {familyTrees.length} / {userSubscription?.max_trees || '∞'}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${userSubscription?.max_trees ? Math.min((familyTrees.length / userSubscription.max_trees) * 100, 100) : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Total Members */}
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="flex-shrink-0">
                          <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              إجمالي الأفراد
                            </div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {familyTrees.reduce((total, tree) => total + (tree.members_count || 0), 0)} / {userSubscription?.max_members || '∞'}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-teal-500 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${userSubscription?.max_members ? Math.min((familyTrees.reduce((total, tree) => total + (tree.members_count || 0), 0) / userSubscription.max_members) * 100, 100) : 0}%` 
                              }}
                            ></div>
                          </div>
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
                              <Link to={`/family-builder?family=${tree.id}`} className="flex-1 group/btn">
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
                                onClick={() => handleDeleteTreeClick(tree.id, tree.name)}
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
                    
                    {/* Add New Family Tree Card - Always Last */}
                    <div className="group relative">
                      <Card 
                        className={`relative overflow-hidden border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-500 hover:-translate-y-1 ${
                          familyTrees.length >= (userSubscription?.max_trees || 0)
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-300/50 dark:border-red-600/50 shadow-lg hover:shadow-xl'
                            : 'bg-white dark:bg-gray-800 border-emerald-300/50 dark:border-emerald-600/50 shadow-lg hover:shadow-xl'
                        }`}
                        onClick={() => {
                          if (familyTrees.length >= (userSubscription?.max_trees || 0)) {
                            setShowUpgradeModal(true);
                          } else {
                            navigate('/family-creator');
                          }
                        }}>
                        <CardContent className="relative z-10 p-8 text-center flex flex-col justify-center min-h-[320px]">
                          <div className="flex flex-col items-center space-y-4">
                            {/* Plus Icon with Animation */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg ${
                              familyTrees.length >= (userSubscription?.max_trees || 0)
                                ? 'bg-gradient-to-br from-red-500 to-red-600'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                            }`}>
                              {familyTrees.length >= (userSubscription?.max_trees || 0) ? (
                                <Star className="h-8 w-8 text-white" />
                              ) : (
                                <Plus className="h-8 w-8 text-white" />
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                {familyTrees.length >= (userSubscription?.max_trees || 0)
                                  ? 'ترقية الباقة مطلوبة'
                                  : 'إنشاء شجرة عائلة جديدة'
                                }
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {familyTrees.length >= (userSubscription?.max_trees || 0)
                                  ? 'لقد وصلت للحد المسموح من الأشجار'
                                  : 'ابدأ في بناء تاريخ عائلتك'
                                }
                              </p>
                            </div>
                          </div>
                          
                          {/* Floating Mini Icons */}
                          <div className="absolute top-4 left-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                            <TreePine className={`h-6 w-6 ${
                              familyTrees.length >= (userSubscription?.max_trees || 0)
                                ? 'text-red-400'
                                : 'text-emerald-400'
                            }`} />
                          </div>
                          <div className="absolute bottom-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                            <Users className={`h-5 w-5 ${
                              familyTrees.length >= (userSubscription?.max_trees || 0)
                                ? 'text-red-400'
                                : 'text-teal-400'
                            }`} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-lg mx-auto overflow-hidden border-0 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-950/20 dark:via-red-900/20 dark:to-red-800/20 backdrop-blur-lg">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-16 h-16 bg-red-200/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 right-6 w-20 h-20 bg-rose-200/20 rounded-full animate-bounce delay-300"></div>
            <div className="absolute top-1/2 right-4 w-12 h-12 bg-pink-200/25 rounded-full animate-pulse delay-700"></div>
          </div>
          
          {/* Main Content */}
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-center mb-6">
                {/* Animated Icon Container */}
                <div className="relative flex items-center justify-center mb-4">
                  <div className="relative">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 w-20 h-20 bg-red-500/20 rounded-full animate-ping"></div>
                    {/* Inner pulsing circle */}
                    <div className="relative w-16 h-16 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-red-500/30 animate-pulse">
                      <Trash2 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Title with gradient text */}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                  تأكيد الحذف
                </h2>
              </DialogTitle>
            </DialogHeader>
            
            <div className="text-center space-y-6 px-2">
              {/* Enhanced Warning Card */}
              <div className="relative overflow-hidden bg-white/80 dark:bg-red-950/40 rounded-3xl p-6 border-2 border-red-200/50 dark:border-red-700/50 shadow-lg backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500"></div>
                
                <div className="flex items-center justify-center gap-3 text-red-700 dark:text-red-300 mb-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <X className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="font-bold text-lg">تحذير خطير</span>
                </div>
                
                <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed font-medium">
                  هذا الإجراء <span className="font-bold text-red-700 dark:text-red-300">لا يمكن التراجع عنه</span>. 
                  سيتم حذف جميع بيانات الشجرة والذكريات المرتبطة بها نهائياً.
                </p>
              </div>

              {/* Tree Name Display */}
              <div className="bg-white/60 dark:bg-gray-800/40 rounded-2xl p-4 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  لتأكيد الحذف، اكتب اسم الشجرة بالضبط:
                </p>
                <div className="text-lg font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 dark:from-gray-200 dark:via-gray-300 dark:to-gray-400 bg-clip-text text-transparent px-4 py-2 bg-gray-100/50 dark:bg-gray-700/30 rounded-xl border border-gray-300/50 dark:border-gray-600/50">
                  "{deleteTreeName}"
                </div>
              </div>

              {/* Input Field */}
              <div className="space-y-3">
                <Label htmlFor="confirmText" className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                  اكتب اسم الشجرة للتأكيد:
                </Label>
                <div className="relative">
                  <Input
                    id="confirmText"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={deleteTreeName}
                    className="text-center text-lg font-medium bg-white/80 dark:bg-gray-800/60 border-2 border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800/50 transition-all duration-300"
                  />
                  {deleteConfirmText.trim() === deleteTreeName.trim() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 font-semibold"
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleConfirmDelete}
                  disabled={deleteConfirmText.trim() !== deleteTreeName.trim()}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:via-rose-600 hover:to-red-700 text-white font-bold shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                >
                  <Trash2 className="h-5 w-5 ml-2" />
                  حذف نهائي
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <GlobalFooter />
    </div>
  );
};

export default Dashboard;