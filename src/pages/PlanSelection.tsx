import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Shield, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  features: any;
  display_order: number;
  currency: string;
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

      setPackages(packagesData || []);
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
    const colors = ["bg-gray-500", "bg-emerald-500", "bg-purple-500"];
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

  const handlePlanSelect = (planId: string) => {
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

    // Proceed with plan selection
    const packagePrice = getPackagePrice(selectedPackage);
    if (packagePrice === 0) {
      // Free plan - go directly to dashboard
      navigate("/dashboard");
    } else {
      // Paid plan - go to payment page
      navigate("/payment", { state: { planId } });
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
    if (!user) return false; // Allow click to redirect to login
    
    // For renewal scenarios, allow all buttons to be clickable
    // Only disable if it's exactly the same current plan and subscription is not expired
    const isCurrent = isCurrentPackage(pkg.id);
    const isExpired = userSubscription?.expires_at ? new Date(userSubscription.expires_at) < new Date() : true;
    
    return isCurrent && !isExpired;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <div className="text-white text-xl">
          {currentLanguage === 'ar' ? "جاري تحميل الباقات..." : "Loading packages..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center text-white mb-12">
          <img 
            src={familyTreeLogo} 
            alt="شجرتي" 
            className="h-20 w-20 rounded-full mx-auto mb-6 border-4 border-white/20"
          />
          <h1 className="text-4xl font-bold mb-4">
            {currentLanguage === 'ar' ? 'اختر خطتك المثالية' : 'Choose Your Perfect Plan'}
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            {currentLanguage === 'ar' 
              ? 'ابدأ رحلتك مع الخطة التي تناسب احتياجاتك في بناء شجرة عائلتك'
              : 'Start your journey with the plan that fits your family tree building needs'
            }
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                className={`relative transition-all hover:shadow-2xl hover:scale-105 bg-white/95 backdrop-blur-sm flex flex-col h-full ${
                  selectedPlan === pkg.id ? 'ring-4 ring-white scale-105' : ''
                } ${pkg.is_featured ? 'border-emerald-300 shadow-2xl' : ''} ${
                  currentPlan ? 'ring-2 ring-emerald-500 bg-emerald-50/90' : ''
                }`}
              >
                {pkg.is_featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-6 py-2 text-sm">
                      {currentLanguage === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                    </Badge>
                  </div>
                )}

                {currentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-emerald-600 text-white px-4 py-2 text-sm">
                      {currentLanguage === 'ar' ? 'خطتك الحالية' : 'Current Plan'}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-8">
                  <div className={`w-16 h-16 ${packageColor} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg relative`}>
                    <PackageIcon className="h-8 w-8 text-white" />
                    {currentPlan && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                        <Lock className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold text-primary mb-2">{packageName}</CardTitle>
                  <div className="mt-4">
                    {packagePrice === 0 ? (
                      <div className="text-center">
                        <span className="text-3xl font-bold text-emerald-600">
                          {currentLanguage === 'ar' ? 'مجانا للأبد' : 'Free Forever'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-primary">{formatPrice(packagePrice)}</span>
                        <span className="text-muted-foreground">
                          {currentLanguage === 'ar' ? '/سنوياً' : '/yearly'}
                        </span>
                      </>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="px-6 pb-8 flex flex-col flex-grow">
                  <ul className="space-y-3 mb-8 flex-grow">
                    {packageFeatures.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full py-3 text-lg font-medium transition-all mt-auto ${
                      currentPlan 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                        : pkg.is_featured 
                          ? 'hero-gradient border-0 text-white hover:shadow-lg' 
                          : 'bg-primary hover:bg-primary/90'
                    }`}
                    onClick={() => handlePlanSelect(pkg.id)}
                    disabled={buttonDisabled}
                  >
                    {getButtonText(pkg)}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-white/80 mt-12">
          <p className="text-sm">
            {currentLanguage === 'ar' 
              ? 'يمكنك تغيير خطتك أو إلغائها في أي وقت من إعدادات الحساب'
              : 'You can change or cancel your plan anytime from account settings'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;
