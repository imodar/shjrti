import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Shield, Lock, ArrowLeft, CheckCircle, Users, TreePine, Sparkles, Gem, ChevronRight, ChevronLeft, Zap, Heart, Award, TrendingUp, BarChart3, PieChart, Rocket, Infinity, Target } from "lucide-react";
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
  const { currentLanguage, currency, formatPrice, direction } = useLanguage();
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
    const icons = [Shield, Crown, Gem];
    return icons[index % icons.length];
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-teal-500 rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 animate-pulse text-lg font-medium">
            {currentLanguage === 'ar' ? "جاري تحميل الباقات..." : "Loading packages..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
      {/* Background decorations matching dashboard */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>
      
      {/* Floating animated icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-20 animate-float">
          <Heart className="h-10 w-10 text-pink-400 opacity-60" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float-delayed">
          <Users className="h-12 w-12 text-emerald-400 opacity-40" />
        </div>
        <div className="absolute top-1/2 left-10 animate-float-slow">
          <Star className="h-8 w-8 text-yellow-400 opacity-60" />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-16 max-w-6xl relative z-10">
        {/* Header section matching dashboard style */}
        <div className="text-center mb-16 fade-in">
          <div className="flex flex-col items-center gap-8">
            {/* Logo with dashboard-style glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/30 to-amber-500/20 rounded-3xl blur-2xl"></div>
              <img 
                src={familyTreeLogo} 
                alt="شجرتي" 
                className="h-20 w-20 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 relative z-10 ring-2 ring-white/20 dark:ring-gray-600/20"
              />
            </div>
            
            {/* Title with dashboard gradient */}
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 shadow-lg">
                <Sparkles className="h-4 w-4 ml-2" />
                {currentLanguage === 'ar' ? 'خطط مميزة لحفظ تراث عائلتك' : 'Premium Plans for Your Family Heritage'}
              </Badge>
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                  {currentLanguage === 'ar' ? 'اختر خطتك المثالية' : 'Choose Your Perfect Plan'}
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
                {currentLanguage === 'ar' 
                  ? 'اختر الخطة التي تناسب احتياجاتك واحفظ تاريخ عائلتك بأفضل الطرق'
                  : 'Choose the plan that fits your needs and preserve your family history in the best way'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Plans grid with smaller, elegant design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {packages.map((pkg, index) => {
            const PackageIcon = getPackageIcon(index);
            const packagePrice = getPackagePrice(pkg);
            const packageName = getLocalizedValue(pkg.name);
            const packageFeatures = getPackageFeatures(pkg);
            const currentPlan = isCurrentPackage(pkg.id);
            const buttonDisabled = isButtonDisabled(pkg);
            const isFeatured = pkg.is_featured;
            
            return (
              <Card 
                key={pkg.id} 
                className={`
                  relative h-full transition-all duration-500 hover:scale-105 hover:shadow-xl
                  ${isFeatured ? 'ring-4 ring-gradient-to-r ring-orange-400 border-orange-300 dark:border-orange-600 scale-105 shadow-orange-200/50 dark:shadow-orange-800/50' : ''}
                  ${currentPlan ? 'ring-2 ring-amber-200 dark:ring-amber-700' : ''}
                  ${isFeatured ? 'bg-gradient-to-br from-orange-50/80 via-white/70 to-amber-50/80 dark:from-orange-950/20 dark:via-gray-800/70 dark:to-amber-950/20' : 'bg-white/70 dark:bg-gray-800/70'}
                  backdrop-blur-xl border shadow-xl
                  ${!isFeatured ? 'border-emerald-200/30 dark:border-emerald-700/30' : ''}
                `}
              >
                {/* Featured badge */}
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1.5 text-xs font-semibold shadow-lg animate-bounce">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {currentLanguage === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                    </Badge>
                  </div>
                )}

                {/* Current plan badge */}
                {currentPlan && (
                  <div className="absolute -top-3 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 text-xs shadow-lg">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {currentLanguage === 'ar' ? 'نشطة' : 'Active'}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4 pt-8">
                  {/* Icon with dashboard-style gradient */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-300">
                      <PackageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent mb-3">
                    {packageName}
                  </CardTitle>
                  
                  {/* Pricing */}
                  <div className="mb-4">
                    {packagePrice === 0 ? (
                      <div className="text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          {currentLanguage === 'ar' ? 'مجاني' : 'Free'}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {currentLanguage === 'ar' ? 'للأبد' : 'Forever'}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-1 mb-1">
                          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                            {formatPrice(packagePrice)}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {currentLanguage === 'ar' ? '/سنة' : '/year'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {currentLanguage === 'ar' 
                            ? `${Math.round(packagePrice / 12)} ريال شهرياً` 
                            : `$${Math.round(packagePrice / 12)} per month`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="px-6 pb-6">
                  {/* Features list */}
                  <div className="space-y-2 mb-6">
                    {packageFeatures.slice(0, 4).map((feature, featureIndex) => (
                      <div 
                        key={featureIndex}
                        className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {feature}
                          </span>
                        </div>
                    ))}
                  </div>
                  
                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePlanSelect(pkg.id)}
                    disabled={buttonDisabled}
                    className={`
                      w-full h-10 text-sm font-medium rounded-lg transition-all duration-300
                      ${buttonDisabled 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg text-white hover:scale-105'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {getButtonText(pkg)}
                      {!buttonDisabled && (
                        direction === 'rtl' ? 
                          <ChevronLeft className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom stats section matching dashboard style */}
        <div className="flex items-center justify-center gap-8 pt-16 fade-in">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">+1000</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentLanguage === 'ar' ? 'عائلة سعيدة' : 'Happy families'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">+50k</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentLanguage === 'ar' ? 'فرد محفوظ' : 'Members preserved'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">99%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentLanguage === 'ar' ? 'رضا المستخدمين' : 'User satisfaction'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;