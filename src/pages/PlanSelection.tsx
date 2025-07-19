import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Shield, Lock, ArrowLeft, CheckCircle, Users, TreePine, Sparkles, Gem, ChevronRight, Zap, Heart, Award, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import familyTreeLogo from "@/assets/family-tree-logo.png";

interface Package {
  id: string;
  name: string | object;
  description: string | object;
  price: number;
  price_usd: number;
  price_sar: number;
  max_family_trees: number;
  max_family_members: number;
  is_featured: boolean;
  currency: string;
  created_at?: string;
  updated_at?: string;
  features?: any;
  is_active?: boolean;
  display_order?: number;
}

interface UserSubscription {
  id: string;
  package_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
}

interface UserStats {
  familyTreesCount: number;
  familyMembersCount: number;
}

const PlanSelection = () => {
  const navigate = useNavigate();
  const { currentLanguage, currency, formatPrice } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ familyTreesCount: 0, familyMembersCount: 0 });

  useEffect(() => {
    fetchPackages();
    if (user) {
      fetchUserSubscription();
      fetchUserStats();
    }
  }, [user]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data: packagesData, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching packages:', error);
        return;
      }

      const transformedPackages = (packagesData || []).map(pkg => ({
        ...pkg,
        price: (pkg as any).price || pkg.price_usd || pkg.price_sar || 0,
        currency: currentLanguage === 'ar' ? 'SAR' : 'USD'
      }));
      
      setPackages(transformedPackages);
    } catch (error) {
      console.error('Error in fetchPackages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user subscription:', error);
        return;
      }

      setUserSubscription(data);
    } catch (error) {
      console.error('Error in fetchUserSubscription:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const { count: treesCount, error: treesError } = await supabase
        .from('families')
        .select('*', { count: 'exact' })
        .eq('creator_id', user.id);

      if (treesError) {
        console.error('Error fetching trees count:', treesError);
      }

      const { count: membersCount, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*', { count: 'exact' })
        .in('family_id', 
          await supabase
            .from('families')
            .select('id')
            .eq('creator_id', user.id)
            .then(({ data }) => data?.map(f => f.id) || [])
        );

      if (membersError) {
        console.error('Error fetching members count:', membersError);
      }

      setUserStats({
        familyTreesCount: treesCount || 0,
        familyMembersCount: membersCount || 0
      });
    } catch (error) {
      console.error('Error in fetchUserStats:', error);
    }
  };

  const getLocalizedValue = (value: string | object, language: string = currentLanguage): string => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        const localizedText = parsed[language] || parsed['en'] || value;
        return localizedText;
      } catch {
        return value;
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      const localizedText = (value as any)[language] || (value as any)['en'] || '';
      return localizedText;
    }
    
    return String(value || '');
  };

  const getPackageFeatures = (pkg: Package): string[] => {
    if (Array.isArray(pkg.features)) {
      return pkg.features;
    }
    if (typeof pkg.features === 'object' && pkg.features !== null) {
      const features = (pkg.features as any)[currentLanguage] || (pkg.features as any)['en'] || [];
      return Array.isArray(features) ? features : [];
    }
    return [];
  };

  const getPackagePrice = (pkg: Package): number => {
    if (currentLanguage === 'ar') {
      return pkg.price_sar || 0;
    } else {
      return pkg.price_usd || 0;
    }
  };

  const getPackageIcon = (index: number) => {
    const icons = [Shield, Star, Crown];
    return icons[index % icons.length];
  };

  const getPackageGradient = (index: number) => {
    const gradients = [
      "from-slate-500 via-slate-600 to-slate-700",
      "from-emerald-500 via-emerald-600 to-teal-600", 
      "from-purple-500 via-indigo-600 to-purple-700"
    ];
    return gradients[index % gradients.length];
  };

  const isCurrentPackage = (packageId: string): boolean => {
    return userSubscription?.package_id === packageId;
  };

  const createInvoiceAndRedirectToPayment = async (packageId: string) => {
    if (!user) return;

    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    if (!selectedPackage) return;

    try {
      const familyId = crypto.randomUUID();
      const packagePrice = getPackagePrice(selectedPackage);
      const currency = currentLanguage === 'ar' ? 'SAR' : 'USD';

      const { data: invoiceId, error } = await supabase.rpc('create_invoice', {
        p_user_id: user.id,
        p_family_id: familyId,
        p_package_id: packageId,
        p_amount: packagePrice,
        p_currency: currency
      });

      if (error) {
        console.error('Error creating invoice:', error);
        toast({
          title: currentLanguage === 'ar' ? "خطأ" : "Error",
          description: currentLanguage === 'ar' 
            ? "حدث خطأ في إنشاء الفاتورة" 
            : "Error creating invoice",
          variant: "destructive",
        });
        return;
      }

      navigate("/payment", { 
        state: { 
          planId: packageId, 
          invoiceId: invoiceId,
          amount: packagePrice,
          currency: currency
        } 
      });

    } catch (error) {
      console.error('Error in createInvoiceAndRedirectToPayment:', error);
      toast({
        title: currentLanguage === 'ar' ? "خطأ" : "Error",
        description: currentLanguage === 'ar' 
          ? "حدث خطأ في معالجة طلبك" 
          : "Error processing your request",
        variant: "destructive",
      });
    }
  };

  const handlePlanSelect = async (planId: string) => {
    if (!user) {
      toast({
        title: currentLanguage === 'ar' ? "تسجيل الدخول مطلوب" : "Login Required",
        description: currentLanguage === 'ar' 
          ? "يجب تسجيل الدخول أولاً لاختيار خطة" 
          : "Please login first to select a plan",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const isExpired = userSubscription?.expires_at ? new Date(userSubscription.expires_at) < new Date() : true;
    
    if (isCurrentPackage(planId) && !isExpired) {
      toast({
        title: currentLanguage === 'ar' ? "خطتك الحالية" : "Current Plan",
        description: currentLanguage === 'ar' 
          ? "هذه هي خطتك الحالية النشطة" 
          : "This is your current active plan",
      });
      return;
    }

    await createInvoiceAndRedirectToPayment(planId);
  };

  const getButtonText = (pkg: Package): string => {
    if (!user) {
      return currentLanguage === 'ar' ? "تسجيل الدخول للاختيار" : "Login to Select";
    }

    const isExpired = userSubscription?.expires_at ? new Date(userSubscription.expires_at) < new Date() : true;
    
    if (isCurrentPackage(pkg.id)) {
      if (isExpired) {
        return currentLanguage === 'ar' ? "تجديد الاشتراك" : "Renew Subscription";
      } else {
        return currentLanguage === 'ar' ? "خطتك الحالية" : "Current Plan";
      }
    }

    const packagePrice = getPackagePrice(pkg);
    if (packagePrice === 0) {
      return currentLanguage === 'ar' ? "ابدأ مجاناً" : "Start Free";
    }

    return currentLanguage === 'ar' ? "اختيار الخطة" : "Select Plan";
  };

  const isButtonDisabled = (pkg: Package): boolean => {
    if (!user) return false;
    const isCurrent = isCurrentPackage(pkg.id);
    const isExpired = userSubscription?.expires_at ? new Date(userSubscription.expires_at) < new Date() : true;
    return isCurrent && !isExpired;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">
            {currentLanguage === 'ar' ? "جاري تحميل الباقات..." : "Loading packages..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Creative Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">
                {currentLanguage === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <img 
              src={familyTreeLogo} 
              alt="شجرتي" 
              className="h-8 w-8 rounded-full"
            />
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              شجرتي
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Creative Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-purple-500/10 rounded-3xl blur-3xl"></div>
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 bg-clip-text text-transparent">
                {currentLanguage === 'ar' ? 'اختر خطتك المثالية' : 'Choose Your Perfect Plan'}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {currentLanguage === 'ar' 
                ? 'انضم إلى آلاف العائلات التي تحتفظ بتاريخها الرقمي معنا'
                : 'Join thousands of families preserving their digital heritage with us'
              }
            </p>
          </div>
        </div>

        {/* Dashboard Stats */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-1">
                      {currentLanguage === 'ar' ? 'أشجار العائلة' : 'Family Trees'}
                    </p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {userStats.familyTreesCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <TreePine className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">
                      {currentLanguage === 'ar' ? 'أفراد العائلة' : 'Family Members'}
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {userStats.familyMembersCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">
                      {currentLanguage === 'ar' ? 'الباقة الحالية' : 'Current Plan'}
                    </p>
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                      {userSubscription?.package_id ? 'مدفوعة' : 'مجانية'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-600 dark:text-amber-400 text-sm font-medium mb-1">
                      {currentLanguage === 'ar' ? 'النمو' : 'Growth'}
                    </p>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      +{userStats.familyMembersCount > 0 ? Math.round((userStats.familyMembersCount / 10) * 100) : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Creative Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => {
            const PackageIcon = getPackageIcon(index);
            const packageGradient = getPackageGradient(index);
            const packagePrice = getPackagePrice(pkg);
            const packageName = getLocalizedValue(pkg.name);
            const packageFeatures = getPackageFeatures(pkg);
            const currentPlan = isCurrentPackage(pkg.id);
            const buttonDisabled = isButtonDisabled(pkg);
            
            return (
              <Card 
                key={pkg.id} 
                className={`relative border-0 overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                  pkg.is_featured ? 'scale-105 lg:scale-110 shadow-2xl' : 'hover:scale-105'
                } ${currentPlan ? 'ring-2 ring-blue-500 shadow-blue-500/25' : ''}`}
                style={{
                  background: pkg.is_featured 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                    : currentPlan 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)'
                    : 'rgba(255, 255, 255, 0.8)'
                }}
              >
                {/* Creative Background Effects */}
                <div className={`absolute inset-0 bg-gradient-to-br ${packageGradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>

                {/* Featured Badge */}
                {pkg.is_featured && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 shadow-lg animate-pulse">
                      <Sparkles className="h-3 w-3 mr-2" />
                      {currentLanguage === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                    </Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {currentPlan && (
                  <div className="absolute -top-3 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 shadow-lg">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {currentLanguage === 'ar' ? 'نشطة' : 'Active'}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6 relative z-10">
                  {/* Creative Icon */}
                  <div className={`w-20 h-20 bg-gradient-to-br ${packageGradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <PackageIcon className="h-10 w-10 text-white" />
                    <div className="absolute inset-0 rounded-3xl bg-white/20 group-hover:bg-white/30 transition-colors duration-300"></div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-foreground mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                    {packageName}
                  </CardTitle>
                  
                  {/* Creative Pricing */}
                  <div className="mb-6">
                    {packagePrice === 0 ? (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-emerald-600 mb-2">
                          {currentLanguage === 'ar' ? 'مجاني' : 'Free'}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {currentLanguage === 'ar' ? 'للأبد' : 'Forever'}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-1 mb-2">
                          <span className="text-4xl font-bold text-foreground">
                            {formatPrice(packagePrice)}
                          </span>
                          <span className="text-lg text-muted-foreground">
                            {currentLanguage === 'ar' ? '/سنة' : '/year'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {currentLanguage === 'ar' 
                            ? `${Math.round(packagePrice / 12)} ريال شهرياً` 
                            : `$${Math.round(packagePrice / 12)} per month`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 relative z-10">
                  {/* Creative Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xl font-bold text-foreground mb-1">
                        {pkg.max_family_trees === -1 
                          ? '∞'
                          : pkg.max_family_trees
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentLanguage === 'ar' ? 'أشجار' : 'Trees'}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xl font-bold text-foreground mb-1">
                        {pkg.max_family_members === -1 
                          ? '∞'
                          : pkg.max_family_members
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentLanguage === 'ar' ? 'أفراد' : 'Members'}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  {packageFeatures.length > 0 && (
                    <ul className="space-y-3 mb-8">
                      {packageFeatures.slice(0, 4).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3 text-sm group">
                          <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {/* Creative CTA Button */}
                  <Button 
                    onClick={() => handlePlanSelect(pkg.id)}
                    disabled={buttonDisabled}
                    className={`w-full h-12 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      currentPlan 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                        : pkg.is_featured
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 dark:from-slate-100 dark:to-slate-200 dark:text-slate-900 dark:hover:from-white dark:hover:to-slate-100'
                    } group/button`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {getButtonText(pkg)}
                      <ChevronRight className="h-4 w-4 group-hover/button:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Button>
                </CardContent>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent group-hover:h-2 transition-all duration-300"></div>
              </Card>
            );
          })}
        </div>

        {/* Creative CTA Section */}
        <div className="mt-16 text-center">
          <Card className="border-0 bg-gradient-to-r from-emerald-50 via-white to-purple-50 dark:from-emerald-950/30 dark:via-slate-800 dark:to-purple-950/30 shadow-xl">
            <CardContent className="p-12">
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold text-foreground mb-4">
                  {currentLanguage === 'ar' 
                    ? 'ابدأ رحلتك في حفظ التاريخ'
                    : 'Start Your Heritage Journey'
                  }
                </h3>
                
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  {currentLanguage === 'ar' 
                    ? 'انضم إلى آلاف العائلات حول العالم واحتفظ بقصص أجدادك للأجيال القادمة'
                    : 'Join thousands of families worldwide and preserve your ancestors\' stories for future generations'
                  }
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Award className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {currentLanguage === 'ar' ? 'جودة عالية' : 'Premium Quality'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {currentLanguage === 'ar' ? 'أمان تام' : 'Secure & Safe'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Zap className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {currentLanguage === 'ar' ? 'سهل الاستخدام' : 'Easy to Use'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;