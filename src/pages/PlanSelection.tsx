import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Shield, Lock, ArrowLeft, CheckCircle, Users, TreePine, Sparkles, Gem, ChevronRight, Zap, Heart, Award, TrendingUp, BarChart3, PieChart, Rocket, Infinity, Target } from "lucide-react";
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
    const icons = [Rocket, Crown, Infinity];
    return icons[index % icons.length];
  };

  const getPackageTheme = (index: number) => {
    const themes = [
      {
        gradient: "from-emerald-400 via-cyan-400 to-blue-500",
        bgGradient: "from-emerald-50 via-cyan-50 to-blue-50",
        darkBgGradient: "from-emerald-950/20 via-cyan-950/20 to-blue-950/20",
        accent: "emerald-500",
        icon: "emerald-100",
        ring: "emerald-500/20"
      },
      {
        gradient: "from-purple-400 via-pink-500 to-red-500",
        bgGradient: "from-purple-50 via-pink-50 to-red-50",
        darkBgGradient: "from-purple-950/20 via-pink-950/20 to-red-950/20",
        accent: "purple-500",
        icon: "purple-100",
        ring: "purple-500/20"
      },
      {
        gradient: "from-amber-400 via-orange-500 to-red-500",
        bgGradient: "from-amber-50 via-orange-50 to-red-50",
        darkBgGradient: "from-amber-950/20 via-orange-950/20 to-red-950/20",
        accent: "amber-500",
        icon: "amber-100",
        ring: "amber-500/20"
      }
    ];
    return themes[index % themes.length];
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/50 rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="text-muted-foreground animate-pulse text-lg font-medium">
            {currentLanguage === 'ar' ? "جاري تحميل الباقات..." : "Loading packages..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-muted/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 py-16 max-w-7xl relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="flex flex-col items-center gap-8">
            {/* Logo with creative effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl transform scale-150"></div>
              <img 
                src={familyTreeLogo} 
                alt="شجرتي" 
                className="h-32 w-32 rounded-3xl shadow-2xl hover:scale-105 transition-all duration-500 relative z-10 ring-4 ring-primary/10"
              />
            </div>
            
            {/* Title with creative typography */}
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-300% animate-gradient">
                  {currentLanguage === 'ar' ? 'اختر خطتك المثالية' : 'Choose Your Perfect Plan'}
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {currentLanguage === 'ar' 
                  ? 'انضم إلى آلاف العائلات حول العالم واحتفظ بقصص أجدادك للأجيال القادمة بأسلوب عصري ومبتكر'
                  : 'Join thousands of families worldwide and preserve your ancestors\' stories for future generations with modern innovation'
                }
              </p>
              
              {/* Feature highlights */}
              <div className="flex flex-wrap justify-center gap-6 pt-8">
                {[
                  { icon: Award, text: currentLanguage === 'ar' ? 'جودة عالية' : 'Premium Quality', color: 'from-emerald-500 to-cyan-500' },
                  { icon: Shield, text: currentLanguage === 'ar' ? 'أمان تام' : 'Secure & Safe', color: 'from-blue-500 to-purple-500' },
                  { icon: Zap, text: currentLanguage === 'ar' ? 'سهل الاستخدام' : 'Easy to Use', color: 'from-amber-500 to-orange-500' }
                ].map((feature, idx) => (
                  <div key={idx} className="group flex items-center gap-3 bg-background/50 backdrop-blur-sm rounded-full px-6 py-3 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105">
                    <div className={`p-2 rounded-full bg-gradient-to-r ${feature.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Creative Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {packages.map((pkg, index) => {
            const PackageIcon = getPackageIcon(index);
            const theme = getPackageTheme(index);
            const packagePrice = getPackagePrice(pkg);
            const packageName = getLocalizedValue(pkg.name);
            const packageFeatures = getPackageFeatures(pkg);
            const currentPlan = isCurrentPackage(pkg.id);
            const buttonDisabled = isButtonDisabled(pkg);
            const isFeatured = pkg.is_featured;
            
            return (
              <div key={pkg.id} className="relative group">
                {/* Featured glow effect */}
                {isFeatured && (
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
                )}
                
                <Card className={`
                  relative h-full border-0 overflow-hidden transition-all duration-700 hover:scale-105 cursor-pointer
                  ${isFeatured ? 'scale-105 lg:scale-110' : ''}
                  ${currentPlan ? 'ring-2 ring-primary/50 shadow-primary/25' : ''}
                  bg-gradient-to-br ${theme.bgGradient} dark:${theme.darkBgGradient}
                  shadow-2xl hover:shadow-3xl backdrop-blur-sm
                `}>
                  
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} transform rotate-12 scale-150 group-hover:rotate-45 transition-transform duration-1000`}></div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute top-8 right-8 w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full group-hover:scale-150 group-hover:rotate-180 transition-all duration-1000"></div>
                  <div className="absolute bottom-8 left-8 w-12 h-12 bg-gradient-to-br from-white/5 to-white/2 rounded-full group-hover:scale-125 group-hover:-rotate-90 transition-all duration-700"></div>

                  {/* Featured badge */}
                  {isFeatured && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <Badge className={`bg-gradient-to-r ${theme.gradient} text-white px-8 py-3 shadow-xl animate-bounce hover:animate-none transition-all duration-300 text-sm font-bold`}>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        {currentLanguage === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                      </Badge>
                    </div>
                  )}

                  {/* Current plan badge */}
                  {currentPlan && (
                    <div className="absolute -top-4 right-6 z-20">
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-2 shadow-lg">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {currentLanguage === 'ar' ? 'نشطة' : 'Active'}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-8 pt-12 relative z-10">
                    {/* Creative icon container */}
                    <div className="relative mb-8">
                      <div className={`w-24 h-24 bg-gradient-to-br ${theme.gradient} rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 ring-4 ring-${theme.ring}`}>
                        <PackageIcon className="h-12 w-12 text-white drop-shadow-lg" />
                        <div className="absolute inset-0 rounded-3xl bg-white/20 group-hover:bg-white/30 transition-colors duration-300"></div>
                      </div>
                      
                      {/* Floating icon effects */}
                      <div className={`absolute -top-2 -right-2 w-6 h-6 bg-${theme.accent} rounded-full opacity-80 group-hover:scale-150 transition-all duration-500`}></div>
                      <div className={`absolute -bottom-2 -left-2 w-4 h-4 bg-${theme.accent} rounded-full opacity-60 group-hover:scale-125 transition-all duration-700`}></div>
                    </div>
                    
                    <CardTitle className="text-3xl font-bold text-foreground mb-6 group-hover:scale-105 transition-all duration-300">
                      {packageName}
                    </CardTitle>
                    
                    {/* Creative pricing display */}
                    <div className="mb-8">
                      {packagePrice === 0 ? (
                        <div className="text-center space-y-2">
                          <div className={`text-5xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                            {currentLanguage === 'ar' ? 'مجاني' : 'Free'}
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Infinity className="h-5 w-5 text-muted-foreground" />
                            <p className="text-muted-foreground font-medium">
                              {currentLanguage === 'ar' ? 'للأبد' : 'Forever'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-3">
                          <div className="flex items-baseline justify-center gap-2">
                            <span className={`text-5xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                              {formatPrice(packagePrice)}
                            </span>
                            <span className="text-xl text-muted-foreground font-semibold">
                              {currentLanguage === 'ar' ? '/سنة' : '/year'}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Target className="h-4 w-4" />
                            <p className="text-sm font-medium">
                              {currentLanguage === 'ar' 
                                ? `${Math.round(packagePrice / 12)} ريال شهرياً` 
                                : `$${Math.round(packagePrice / 12)} per month`
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="px-8 pb-8 relative z-10">
                    {/* Features list with creative styling */}
                    <div className="space-y-4 mb-8">
                      {packageFeatures.map((feature, featureIndex) => (
                        <div 
                          key={featureIndex}
                          className="flex items-center gap-4 group/feature hover:scale-105 transition-all duration-300"
                        >
                          <div className={`w-6 h-6 bg-gradient-to-r ${theme.gradient} rounded-full flex items-center justify-center flex-shrink-0 group-hover/feature:scale-110 transition-transform duration-300`}>
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-foreground font-medium group-hover/feature:text-primary transition-colors duration-300">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Call-to-action button */}
                    <Button
                      onClick={() => handlePlanSelect(pkg.id)}
                      disabled={buttonDisabled}
                      className={`
                        w-full h-14 text-lg font-bold rounded-2xl transition-all duration-500 group/btn
                        ${buttonDisabled 
                          ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                          : `bg-gradient-to-r ${theme.gradient} hover:shadow-2xl hover:scale-105 text-white shadow-lg hover:shadow-${theme.accent}/50`
                        }
                      `}
                    >
                      <span className="flex items-center gap-3">
                        {getButtonText(pkg)}
                        {!buttonDisabled && (
                          <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        )}
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;