import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Shield, Lock, ArrowLeft, CheckCircle, Users, TreePine, Sparkles, Gem, Menu, X } from "lucide-react";
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

      // Transform data to include computed price and currency
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
      // Get family trees count
      const { count: treesCount, error: treesError } = await supabase
        .from('families')
        .select('*', { count: 'exact' })
        .eq('creator_id', user.id);

      if (treesError) {
        console.error('Error fetching trees count:', treesError);
      }

      // Get family members count across all user's families
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
    console.log('getLocalizedValue called with:', { value, language, type: typeof value });
    
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        const localizedText = parsed[language] || parsed['en'] || value;
        console.log('Parsed JSON string:', { parsed, localizedText });
        return localizedText;
      } catch {
        return value;
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      const localizedText = (value as any)[language] || (value as any)['en'] || '';
      console.log('Localized value for language', language, ':', localizedText, 'from', value);
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

  const getPackageColor = (index: number) => {
    const colors = ["from-gray-500 to-gray-600", "from-emerald-500 to-emerald-600", "from-purple-500 to-purple-600"];
    return colors[index % colors.length];
  };

  const canDowngradeToPackage = (targetPackage: Package): { canDowngrade: boolean; reason?: string } => {
    if (userStats.familyTreesCount > targetPackage.max_family_trees) {
      return {
        canDowngrade: false,
        reason: currentLanguage === 'ar' 
          ? `لديك ${userStats.familyTreesCount} أشجار عائلية، والخطة تسمح بـ ${targetPackage.max_family_trees} فقط`
          : `You have ${userStats.familyTreesCount} family trees, but this plan only allows ${targetPackage.max_family_trees}`
      };
    }

    if (userStats.familyMembersCount > targetPackage.max_family_members) {
      return {
        canDowngrade: false,
        reason: currentLanguage === 'ar'
          ? `لديك ${userStats.familyMembersCount} أفراد عائلة، والخطة تسمح بـ ${targetPackage.max_family_members} فقط`
          : `You have ${userStats.familyMembersCount} family members, but this plan only allows ${targetPackage.max_family_members}`
      };
    }

    return { canDowngrade: true };
  };

  const isCurrentPackage = (packageId: string): boolean => {
    return userSubscription?.package_id === packageId;
  };

  const isDowngrade = (targetPackage: Package): boolean => {
    if (!userSubscription) return false;
    
    const currentPackage = packages.find(pkg => pkg.id === userSubscription.package_id);
    if (!currentPackage) return false;

    const currentPrice = getPackagePrice(currentPackage);
    const targetPrice = getPackagePrice(targetPackage);
    
    return targetPrice < currentPrice;
  };

  const createInvoiceAndRedirectToPayment = async (packageId: string) => {
    if (!user) return;

    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    if (!selectedPackage) return;

    try {
      // Create a temporary family ID if user doesn't have one
      const familyId = crypto.randomUUID();
      const packagePrice = getPackagePrice(selectedPackage);
      const currency = currentLanguage === 'ar' ? 'SAR' : 'USD';

      // Create invoice using the database function
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

      // Navigate to payment page with invoice ID
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
    // Check if user is logged in
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

    // Check if it's the current package and subscription is not expired
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

    const selectedPackage = packages.find(pkg => pkg.id === planId);
    if (!selectedPackage) return;

    // Check if it's a downgrade and validate
    if (isDowngrade(selectedPackage)) {
      const { canDowngrade, reason } = canDowngradeToPackage(selectedPackage);
      
      if (!canDowngrade) {
        toast({
          title: currentLanguage === 'ar' ? "لا يمكن التراجع للخطة" : "Cannot Downgrade",
          description: reason,
          variant: "destructive",
        });
        return;
      }
    }

    // Generate invoice and redirect to payment for all paid plans
    const packagePrice = getPackagePrice(selectedPackage);
    if (packagePrice === 0) {
      // Free plan - still create invoice but mark as paid immediately
      await createInvoiceAndRedirectToPayment(planId);
    } else {
      // Paid plan - create invoice and go to payment page
      await createInvoiceAndRedirectToPayment(planId);
    }
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
        return currentLanguage === 'ar' ? "خطتك الحالية النشطة" : "Current Active Plan";
      }
    }

    const packagePrice = getPackagePrice(pkg);
    if (packagePrice === 0) {
      return currentLanguage === 'ar' ? "ابدأ مجاناً" : "Start Free";
    }

    return currentLanguage === 'ar' ? "اختيار الخطة" : "Select Plan";
  };

  const isButtonDisabled = (pkg: Package): boolean => {
    if (!user) return false; // Allow click to redirect to login
    
    // For renewal scenarios, allow all buttons to be clickable
    // Only disable if it's exactly the same current plan and subscription is not expired
    const isCurrent = isCurrentPackage(pkg.id);
    const isExpired = userSubscription?.expires_at ? new Date(userSubscription.expires_at) < new Date() : true;
    
    return isCurrent && !isExpired;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">
            {currentLanguage === 'ar' ? "جاري تحميل الباقات..." : "Loading packages..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <img 
              src={familyTreeLogo} 
              alt="شجرتي" 
              className="h-8 w-8 rounded-full"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              شجرتي
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentLanguage === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
            </Link>
          </nav>

          {/* User Info */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email?.split('@')[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {currentLanguage === 'ar' ? 'اختر خطتك المثالية' : 'Choose Your Perfect Plan'}
            </h1>
            <p className="text-muted-foreground">
              {currentLanguage === 'ar' 
                ? 'اختر الباقة التي تناسب احتياجاتك في بناء شجرة عائلتك الرقمية'
                : 'Select the package that fits your digital family tree building needs'
              }
            </p>
          </div>

          {/* Current Usage Stats */}
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <TreePine className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{userStats.familyTreesCount}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'ar' ? 'أشجار العائلة' : 'Family Trees'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{userStats.familyMembersCount}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'ar' ? 'أفراد العائلة' : 'Family Members'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                      <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {userSubscription?.package_id ? 'باقة مدفوعة' : 'باقة مجانية'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentLanguage === 'ar' ? 'الاشتراك الحالي' : 'Current Subscription'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => {
              const PackageIcon = getPackageIcon(index);
              const packageColor = getPackageColor(index);
              const packagePrice = getPackagePrice(pkg);
              const packageName = getLocalizedValue(pkg.name);
              const packageFeatures = getPackageFeatures(pkg);
              const currentPlan = isCurrentPackage(pkg.id);
              const buttonDisabled = isButtonDisabled(pkg);
              
              return (
                <Card 
                  key={pkg.id} 
                  className={`relative border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    pkg.is_featured ? 'ring-2 ring-emerald-500 shadow-emerald-500/20' : ''
                  } ${currentPlan ? 'ring-2 ring-blue-500 shadow-blue-500/20' : ''}`}
                >
                  {pkg.is_featured && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-white px-4 py-1">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {currentLanguage === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                      </Badge>
                    </div>
                  )}

                  {currentPlan && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-blue-600 text-white px-4 py-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {currentLanguage === 'ar' ? 'خطتك الحالية' : 'Current Plan'}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${packageColor} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <PackageIcon className="h-8 w-8 text-white" />
                    </div>
                    
                    <CardTitle className="text-xl font-bold text-foreground mb-2">
                      {packageName}
                    </CardTitle>
                    
                    <div className="mb-4">
                      {packagePrice === 0 ? (
                        <div className="text-center">
                          <span className="text-3xl font-bold text-emerald-600">
                            {currentLanguage === 'ar' ? 'مجاني' : 'Free'}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {currentLanguage === 'ar' ? 'للأبد' : 'Forever'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-3xl font-bold text-foreground">
                            {formatPrice(packagePrice)}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {currentLanguage === 'ar' ? '/سنوياً' : '/yearly'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          {currentLanguage === 'ar' ? 'أشجار العائلة' : 'Family Trees'}
                        </span>
                        <span className="font-semibold text-foreground">
                          {pkg.max_family_trees === -1 
                            ? (currentLanguage === 'ar' ? 'غير محدود' : 'Unlimited')
                            : pkg.max_family_trees
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          {currentLanguage === 'ar' ? 'أفراد العائلة' : 'Family Members'}
                        </span>
                        <span className="font-semibold text-foreground">
                          {pkg.max_family_members === -1 
                            ? (currentLanguage === 'ar' ? 'غير محدود' : 'Unlimited')
                            : pkg.max_family_members
                          }
                        </span>
                      </div>
                    </div>

                    {packageFeatures.length > 0 && (
                      <ul className="space-y-2 mb-6">
                        {packageFeatures.slice(0, 4).map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <Button 
                      onClick={() => handlePlanSelect(pkg.id)}
                      disabled={buttonDisabled}
                      className={`w-full ${
                        currentPlan 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : pkg.is_featured
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900'
                      } text-white transition-colors`}
                    >
                      {getButtonText(pkg)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center">
            <Card className="border-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
              <CardContent className="p-8">
                <Gem className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {currentLanguage === 'ar' 
                    ? 'هل تحتاج إلى مساعدة في اختيار الخطة المناسبة؟'
                    : 'Need help choosing the right plan?'
                  }
                </h3>
                <p className="text-muted-foreground">
                  {currentLanguage === 'ar' 
                    ? 'فريقنا جاهز لمساعدتك في اختيار الباقة المثالية لاحتياجاتك'
                    : 'Our team is ready to help you choose the perfect package for your needs'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlanSelection;