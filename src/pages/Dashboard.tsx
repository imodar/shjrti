import { useState, useEffect } from "react";
import { useDateFormat } from "@/hooks/useDateFormat";
import { DateDisplay, RelativeDateDisplay } from "@/components/DateDisplay";
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
  X,
  Search,
  Loader2
} from "lucide-react";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { GlobalHeader } from "@/components/GlobalHeader";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { UpgradeBadge } from "@/components/UpgradeBadge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import TreeDeleteModal from "@/components/TreeDeleteModal";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeroSkeleton } from "@/components/skeletons/DashboardHeroSkeleton";
import { FamiliesGridSkeleton } from "@/components/skeletons/FamiliesGridSkeleton";
import { StatsBarSkeleton } from "@/components/skeletons/StatsBarSkeleton";
import { profilesApi, subscriptionsApi, invoicesApi } from "@/lib/api";

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
  package_name?: any; // Can be string or object
  status?: string;
  is_expired?: boolean;
  max_trees?: number;
  max_members?: number;
  price_sar?: number;
  price_usd?: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t, direction, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const { hasAIFeatures } = useSubscription();
  const navigate = useNavigate();
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [packageMismatch, setPackageMismatch] = useState<{ invoiceId: string; expectedPackage: string } | null>(null);
  const [fixingSubscription, setFixingSubscription] = useState(false);

  // State for TreeDeleteModal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTreeId, setDeleteTreeId] = useState<string | null>(null);
  const [deleteTreeName, setDeleteTreeName] = useState("");

  // Fetch user's data using REST APIs
  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Parallel fetch for families (still using supabase for member count), profile, and subscription via APIs
        const [familiesResult, profileResult, subscriptionResult] = await Promise.allSettled([
          // Families with member count - keeping supabase for aggregation support
          supabase
            .from('families')
            .select(`
              id,
              name,
              created_at,
              updated_at,
              family_tree_members(count)
            `)
            .eq('creator_id', user.id)
            .eq('is_archived', false),
          // Profile via API
          profilesApi.get(),
          // Subscription via API
          subscriptionsApi.get()
        ]);

        if (!isMounted) return;

        // Handle families data
        if (familiesResult.status === 'fulfilled' && !familiesResult.value.error) {
          const families = familiesResult.value.data;
          const treesData = families?.map(family => ({
            id: family.id,
            name: family.name,
            members_count: family.family_tree_members?.[0]?.count || 0,
            created_at: family.created_at,
            updated_at: family.updated_at
          })) || [];
          setFamilyTrees(treesData);
        }

        // Handle profile data from API
        if (profileResult.status === 'fulfilled') {
          const profile = profileResult.value;
          setUserProfile({
            first_name: profile.first_name || undefined,
            last_name: profile.last_name || undefined
          });
        }

        // Handle subscription data from API
        if (subscriptionResult.status === 'fulfilled') {
          const subscription = subscriptionResult.value;
          
          // Check if it's a free subscription (status === 'free')
          if (subscription.status === 'free' || !subscription.packages) {
            const pkg = subscription.package || subscription.packages;
            setUserSubscription({
              package_name: pkg?.name || t('dashboard.free_package', 'Free Package'),
              status: 'free',
              is_expired: false,
              max_trees: pkg?.max_family_trees || 1,
              max_members: pkg?.max_family_members || 50,
              price_sar: pkg?.price_sar || 0,
              price_usd: pkg?.price_usd || 0
            });
          } else {
            const pkg = subscription.packages;
            setUserSubscription({
              package_name: pkg?.name,
              status: subscription.status,
              is_expired: subscription.expires_at ? new Date(subscription.expires_at) <= new Date() : false,
              max_trees: pkg?.max_family_trees || 1,
              max_members: pkg?.max_family_members || 50,
              price_sar: pkg?.price_sar || 0,
              price_usd: pkg?.price_usd || 0
            });
          }
        } else {
          // Default free package limits
          setUserSubscription({
            package_name: t('dashboard.free_package', 'Free Package'),
            status: 'free',
            is_expired: false,
            max_trees: 1,
            max_members: 50
          });
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        console.error('Error fetching dashboard data:', error);
        toast({
          title: t('dashboard.error', 'Error'),
          description: t('dashboard.error_loading_data', 'Error occurred while loading data'),
          variant: "destructive"
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [user?.id, currentLanguage, toast, t]);

  // Check for package mismatch using APIs
  useEffect(() => {
    const checkPackageMismatch = async () => {
      if (!user?.id || !userSubscription) return;

      try {
        // Get latest paid invoice via API
        const latestInvoice = await invoicesApi.getLatestPaid();
        if (!latestInvoice) return;

        // Get current subscription via API
        const subscription = await subscriptionsApi.get();
        if (!subscription || subscription.status === 'free') return;

        // Check if there's a mismatch
        if (subscription.package_id !== latestInvoice.package_id) {
          let packageName = 'Unknown Package';
          try {
            const nameObj = typeof subscription.packages?.name === 'string'
              ? JSON.parse(subscription.packages.name)
              : subscription.packages?.name;
            packageName = nameObj?.[currentLanguage] || nameObj?.ar || nameObj?.en || packageName;
          } catch (e) {
            packageName = typeof subscription.packages?.name === 'string' 
              ? subscription.packages.name 
              : packageName;
          }

          setPackageMismatch({
            invoiceId: latestInvoice.id,
            expectedPackage: packageName
          });
        } else {
          setPackageMismatch(null);
        }
      } catch (error) {
        console.error('Error checking package mismatch:', error);
      }
    };

    checkPackageMismatch();
  }, [user?.id, userSubscription, currentLanguage]);

  // Fix subscription package
  const handleFixSubscription = async () => {
    if (!packageMismatch) return;
    
    setFixingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-paid-subscription', {
        body: { invoiceId: packageMismatch.invoiceId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: currentLanguage === 'ar' ? "تم تحديث الباقة بنجاح! ✅" : "Subscription Updated! ✅",
          description: currentLanguage === 'ar'
            ? "تم ترقية حسابك إلى الباقة الصحيحة"
            : "Your account has been upgraded to the correct package",
        });

        setPackageMismatch(null);
        
        // Refresh the page to show updated subscription
        window.location.reload();
      } else {
        throw new Error('Failed to fix subscription');
      }
    } catch (error: any) {
      console.error('Error fixing subscription:', error);
      toast({
        title: currentLanguage === 'ar' ? "خطأ في التحديث" : "Update Error",
        description: currentLanguage === 'ar'
          ? "فشل في تحديث الباقة. يرجى المحاولة مرة أخرى أو الاتصال بالدعم"
          : "Failed to update package. Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setFixingSubscription(false);
    }
  };

  // Check if user can create new trees
  const canCreateNewTree = () => {
    if (!userSubscription?.max_trees) return false;
    return familyTrees.length < userSubscription.max_trees;
  };

  // Handle create new tree
  const handleCreateNewTree = () => {
    if (canCreateNewTree()) {
      // Navigate to family creator
      navigate("/family-creator");
    } else {
      // Show upgrade modal
      setShowUpgradeModal(true);
    }
  };

  const handleDeleteTreeClick = (treeId: string, treeName: string) => {
    setDeleteTreeId(treeId);
    setDeleteTreeName(treeName);
    setShowDeleteModal(true);
  };

  const handleTreeDeleteSuccess = (treeId: string) => {
    setFamilyTrees(prev => prev.filter(tree => tree.id !== treeId));
    setDeleteTreeId(null);
    setDeleteTreeName("");
  };

  return (
    <div className="min-h-screen flex flex-col" dir={direction}>
      <GlobalHeader />
      <SubscriptionGuard>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
          {/* Package Mismatch Alert */}
          {packageMismatch && (
            <div className="relative z-50 pt-20">
              <div className="container mx-auto px-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 mb-4 shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                          {currentLanguage === 'ar' ? '⚠️ الباقة غير محدثة' : '⚠️ Package Not Updated'}
                        </h3>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          {currentLanguage === 'ar' 
                            ? 'لقد دفعت لكن لم يتم تحديث باقتك. اضغط على زر التحديث لإصلاح ذلك.'
                            : 'You paid but your package was not updated. Click update to fix this.'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleFixSubscription}
                      disabled={fixingSubscription}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      {fixingSubscription ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          {currentLanguage === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 ml-2" />
                          {currentLanguage === 'ar' ? 'تحديث الباقة' : 'Update Package'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          <main className="relative z-10 pt-20 flex-1">
            {/* Hero Section */}
            <section className="py-4 relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="mb-2 relative">
                      {/* Main Content Container - Horizontal Rectangle */}
                      <div className="relative w-full mx-auto">
                      {/* Background Glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
                      
                      <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-6 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                        {loading ? (
                          /* Hero Skeleton */
                          <div className="flex items-center justify-between gap-4">
                            {/* Left: Avatar & Welcome Skeleton */}
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                              <div className="space-y-2">
                                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              </div>
                            </div>
                            
                            {/* Center: Tree Count Skeleton */}
                            <div className="flex-1 text-center">
                              <div className="flex items-center justify-center gap-3 mb-3">
                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              </div>
                            </div>
                            
                            {/* Right: Badge Skeleton */}
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 md:gap-8">
                            {/* Top Row on Mobile: Avatar & Welcome + Badge */}
                            <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-4 md:gap-6">
                              {/* User Avatar */}
                              <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
                                  <div className={`relative ${familyTrees.length > 0 ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-xl border-3 border-white/30 dark:border-gray-700/30`}>
                                    <span className={`${familyTrees.length > 0 ? 'text-xs' : 'text-xs sm:text-sm md:text-base'} font-bold text-white`}>
                                      {userProfile?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                  {/* Status Indicator */}
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-ping"></div>
                                  </div>
                                </div>
                                
                                {/* Welcome Text */}
                                <div className="text-start">
                                  <h1 className={`${familyTrees.length > 0 ? 'text-xs sm:text-sm md:text-base' : 'text-sm sm:text-base md:text-lg'} font-bold`}>
                                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                                      {t('dashboard_welcome', 'أهلاً')} {userProfile?.first_name || user?.email?.split('@')[0] || 'صديقي العزيز'}
                                    </span>
                                  </h1>
                                </div>
                              </div>

                              {/* Badge - Shows next to welcome on mobile */}
                              <div className="flex sm:hidden flex-col items-center gap-1">
                                <UpgradeBadge 
                                  packageName={userSubscription?.package_name}
                                  isPremium={userSubscription?.package_name && !userSubscription?.is_expired && (userSubscription?.price_sar > 0 || userSubscription?.price_usd > 0)}
                                />
                              </div>
                            </div>
    
                            {/* Center: Tree Count & Description */}
                            <div className="flex-1 text-center">
                              <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 mb-1 sm:mb-2 md:mb-3">
                                {familyTrees.length === 1 ? (
                                  <div className="flex items-center gap-1 sm:gap-2 md:gap-3 bg-emerald-100 dark:bg-emerald-900/30 px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-full shadow-lg">
                                    <TreePine className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">{t('dashboard_have', 'لديك')}</span>
                                      <span className="text-[10px] sm:text-xs md:text-sm font-bold text-emerald-700 dark:text-emerald-300">{t('dashboard_single_tree', 'شجرة واحدة')}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <TreePine className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                      {familyTrees.length === 0 
                                        ? t('no_trees', 'لا توجد أشجار بعد')
                                        : `${familyTrees.length} ${t('trees', 'أشجار')}`
                                      }
                                    </span>
                                  </>
                                )}
                              </div>
                              {familyTrees.length === 0 && (
                                <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-300">
                                  {t('no_trees_desc', 'ابدأ رحلتك في بناء إرثك العائلي الرقمي')}
                                </p>
                              )}
                            </div>
    
                            {/* Right: Badge & Subscription Status - Hidden on mobile, shown on tablet+ */}
                            <div className="hidden sm:flex flex-col items-center gap-1 sm:gap-2 md:gap-3">
                              {/* Subscription Status */}
                              <UpgradeBadge 
                                packageName={userSubscription?.package_name}
                                isPremium={userSubscription?.package_name && !userSubscription?.is_expired && (userSubscription?.price_sar > 0 || userSubscription?.price_usd > 0)}
                              />
                              
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                                <span>
                                  {familyTrees.length === 0 
                                    ? t('ready_to_start', 'جاهز للبدء؟')
                                    : t('manage_trees', 'إدارة أشجارك أدناه')
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Decorative Elements */}
                        <div className="absolute top-2 right-2 w-6 h-6 border-r border-t border-emerald-300/40 dark:border-emerald-700/40"></div>
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-l border-b border-emerald-300/40 dark:border-emerald-700/40"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            {loading ? (
              <section className="py-4 relative mt-2">
                <div className="container mx-auto px-4 relative z-10">
                  <StatsBarSkeleton />
                  <FamiliesGridSkeleton count={6} />
                </div>
              </section>
            ) : familyTrees.length === 0 ? (
              <section className="py-2 pb-32 relative">
                <div className="container mx-auto px-4 relative z-10">
                  {/* البحث الذكي والاقتراحات - يظهر فقط إذا كانت ميزات الـ AI مفعلة */}
                  {hasAIFeatures && (
                    <div className="mb-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* البحث الذكي */}
                        <div className="lg:col-span-2">
                          <Card className="bg-white/70 backdrop-blur-sm border-emerald-200/50">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-emerald-700">
                                <Search className="h-5 w-5" />
                                {t('smart_search_title', 'البحث الذكي في العائلة')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <SmartSearchBar
                                familyId={familyTrees[0]?.id || ''}
                                onResultSelect={(member) => {
                                  toast({
                                    title: t('member_found_title', 'تم العثور على العضو'),
                                    description: `${member.name} ${t('member_found_desc', 'موجود في قاعدة البيانات')}`,
                                    variant: "default"
                                  });
                                }}
                                placeholder={t('smart_search_placeholder', 'ابحث عن أفراد العائلة... (مثال: ابن عم أحمد)')}
                              />
                            </CardContent>
                          </Card>
                        </div>

                        {/* الاقتراحات الذكية */}
                        <div className="lg:col-span-1">
                          <SuggestionPanel
                            familyId={familyTrees[0]?.id || ''}
                            className="h-fit"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Header with Icon and Title on Same Line */}
                  <div className="text-center mb-8 md:mb-12">
                    <div className="flex flex-col items-center justify-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="flex items-center justify-center gap-3 md:gap-4">
                        <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-xl">
                          <TreePine className="h-6 w-6 md:h-8 md:w-8 text-white" />
                        </div>
                        <h2 className="text-xl md:text-4xl font-bold">
                          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                            {t('start_your_legacy', 'ابدأ إرثك العائلي')}
                          </span>
                        </h2>
                      </div>
                      <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300">
                        {t('building_easy_desc', 'بناء شجرة عائلتك أمر بسيط وممتع!')}
                      </p>
                    </div>
                  </div>

                  {/* Simplified Steps in One Row with Connection Lines */}
                  <div className="max-w-6xl mx-auto">
                    <div className="hidden md:grid md:grid-cols-3 gap-6 relative">
                      {/* Connection Lines - Between Icons */}
                      <div className="hidden md:block absolute top-4 inset-x-0 z-0">
                        <div className="flex justify-between items-center max-w-2xl mx-auto px-16">
                          <div className="w-32 h-0.5 bg-gradient-to-r from-emerald-300 to-teal-300"></div>
                          <div className="w-32 h-0.5 bg-gradient-to-r from-teal-300 to-amber-300"></div>
                        </div>
                      </div>
                      
                      {/* Step 1 */}
                      <div className="text-center group hover:scale-105 transition-transform duration-300 relative">
                        <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3 relative z-10">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Plus className="h-3 w-3 md:h-4 md:w-4 text-white" />
                          </div>
                          <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-white">
                            {t('step1_title', 'إنشاء الشجرة')}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm px-2 md:px-0">
                          {t('step1_desc', 'ابدأ بإنشاء شجرة عائلتك الأولى وإعطائها اسماً مميزاً')}
                        </p>
                        {/* Arrow for desktop */}
                        <div className={`hidden md:block absolute top-6 text-emerald-400 ${direction === 'rtl' ? '-left-4' : '-right-4'}`}>
                          <svg className={`w-4 h-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="text-center group hover:scale-105 transition-transform duration-300 relative">
                        <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3 relative z-10">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-teal-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Users className="h-3 w-3 md:h-4 md:w-4 text-white" />
                          </div>
                          <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-white">
                            {t('step2_title', 'إضافة الأفراد')}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm px-2 md:px-0">
                          {t('step2_desc', 'أضف أفراد عائلتك مع تفاصيلهم الشخصية والصور')}
                        </p>
                        {/* Arrow for desktop */}
                        <div className={`hidden md:block absolute top-6 text-teal-400 ${direction === 'rtl' ? '-left-4' : '-right-4'}`}>
                          <svg className={`w-4 h-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="text-center group hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3 relative z-10">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-amber-500 to-rose-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Heart className="h-3 w-3 md:h-4 md:w-4 text-white" />
                          </div>
                          <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-white">
                            {t('step3_title', 'حفظ الذكريات')}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm px-2 md:px-0">
                          {t('step3_desc', 'احفظ إرثك العائلي للأجيال القادمة')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Call to Action Section - Build First Tree */}
                  <div className="max-w-4xl mx-auto mt-6 md:mt-20">
                    <div className="relative">
                      {/* Glow Background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/30 to-amber-600/20 rounded-3xl blur-3xl"></div>
                      
                      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white/30 dark:border-gray-700/30 shadow-2xl text-center">
                        {/* Icon */}
                        <div className="flex items-center justify-center mb-4 md:mb-8">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl">
                              <TreePine className="h-8 w-8 md:h-10 md:w-10 text-white" />
                            </div>
                          </div>
                        </div>

                        <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-6">
                          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                            {t('build_first_tree', 'اصنع أول شجرة عائلية')}
                          </span>
                        </h3>

                        <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300 mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed">
                          {t('first_tree_desc', 'بخطوات بسيطة ، ستبدأ رحلة حفظ تاريخ عائلتك ، إبدأ الآن واصنع إرثك الرقمي ليدوم للأبد')}
                        </p>

                        {/* Action Button */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                          <Button 
                            onClick={handleCreateNewTree}
                            className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 text-white border-0 rounded-2xl px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-2 md:gap-3">
                              <Plus className="h-5 w-5 md:h-6 md:w-6 group-hover:rotate-90 transition-transform duration-300" />
                              <span>{t('create_first_tree', 'إنشاء شجرتي الأولى')}</span>
                              {direction === 'rtl' ? (
                                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 group-hover:-translate-x-1 transition-transform duration-300" />
                              ) : (
                                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                              )}
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
                              {t('dashboard.family_trees_section', 'Family Trees')}
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
                              {t('total_members', 'إجمالي الأفراد')}
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
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{t('family_word', 'عائلة')}</span>
                                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 leading-tight">
                                    {tree.name}
                                  </h3>
                                </div>
                              </div>
                              
                              {/* Member Count Badge */}
                              <div className="relative flex-shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-sm opacity-60"></div>
                                <Badge className="relative bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white border-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl backdrop-blur-sm whitespace-nowrap">
                                  <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1" />
                                  {tree.members_count} {tree.members_count === 1 ? t('member_count', 'فرد') : t('members_count', 'أفراد')}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Creation Date */}
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mr-20">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">{t('created_on_prefix', 'تم إنشاؤها في')} <DateDisplay date={tree.created_at} className="inline" /></span>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="relative pt-0 pb-8">
                            {/* Stats Row */}
                            <div className="bg-gradient-to-r from-gray-50/80 to-emerald-50/80 dark:from-gray-700/30 dark:to-emerald-900/30 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                  <Star className="h-4 w-4 fill-current" />
                                  <span className="font-semibold">{t('last_update', 'آخر تحديث')}</span>
                                </div>
                                <span className="text-gray-600 dark:text-gray-300 font-medium">
                                  <RelativeDateDisplay date={tree.updated_at} className="inline" />
                                </span>
                              </div>
                            </div>
                            
                            {/* Action Buttons - New Creative Design */}
                            <div className="flex items-center justify-between gap-2">
                              {/* Manage Button - Primary */}
                              <Link 
                                to={`/family-builder-new?family=${tree.id}`} 
                                className="flex-1 group/btn"
                                onClick={() => {
                                  console.log('🔗 Navigating to family builder with ID:', tree.id);
                                  console.log('🔗 Tree name:', tree.name);
                                  console.log('🔗 Full URL:', `/family-builder?family=${tree.id}`);
                                }}
                              >
                                <Button className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover/btn:scale-[1.02]">
                                  <Edit className="h-4 w-4 ml-2" />
                                  <span className="font-medium">{t('manage', 'إدارة الأعضاء')}</span>
                                </Button>
                              </Link>
                              
                              {/* View Button - Secondary */}
                              <Link 
                                to={`/family-tree-view?family=${tree.id}`} 
                                className="flex-1 group/btn"
                                onClick={() => {
                                  console.log('🔗 Navigating to family tree view with ID:', tree.id);
                                  console.log('🔗 Tree name:', tree.name);
                                  console.log('🔗 Full URL:', `/family-tree-view?family=${tree.id}`);
                                }}
                              >
                                <Button variant="outline" className="w-full h-11 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 rounded-xl transition-all duration-300 group-hover/btn:scale-[1.02]">
                                  <Eye className="h-4 w-4 ml-2" />
                                  <span className="font-medium">{t('view', 'عرض الشجرة')}</span>
                                </Button>
                              </Link>
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
                                  ? t('dashboard.upgrade_required', 'Package Upgrade Required')
                                  : t('dashboard.create_new_tree', 'Create New Family Tree')
                                }
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {familyTrees.length >= (userSubscription?.max_trees || 0)
                                  ? t('dashboard.reached_tree_limit', 'You have reached the allowed tree limit')
                                  : t('build_family_history', 'ابدأ في بناء تاريخ عائلتك')
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
                <span>{t('dashboard.upgrade_required', 'Package Upgrade Required')}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-700/50">
              <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">{t('usage_limit', 'حد الاستخدام')}</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t('dashboard.upgrade_package_description', 'You have reached the maximum limit allowed in your current package')} ({userSubscription?.max_trees || 1} {t('dashboard.trees_suffix', 'tree')})
              </p>
            </div>

            <p className="text-gray-600 dark:text-gray-300">
              {t('dashboard.upgrade_benefits', 'To create more family trees, you can upgrade your package to get more features')}
            </p>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1"
              >
                 {t('cancel', 'إلغاء')}
              </Button>
              <Link to="/plan-selection" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                  <Crown className="h-4 w-4 ml-2" />
                  {t('dashboard.upgrade_package', 'Upgrade Package')}
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tree Delete Modal */}
      <TreeDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleTreeDeleteSuccess}
        treeId={deleteTreeId}
        treeName={deleteTreeName}
      />
      
      <GlobalFooterSimplified />
    </div>
  );
};

export default Dashboard;