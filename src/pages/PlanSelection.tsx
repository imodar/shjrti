import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
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
  features: any; // Using any to handle Json type from Supabase
  display_order: number;
  currency: string;
}

const PlanSelection = () => {
  const navigate = useNavigate();
  const { currentLanguage, currency, formatPrice } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

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

  const getLocalizedValue = (value: string | object, language: string = currentLanguage): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      // Handle multilingual JSON objects like {"en":"Free","ar":"مجانية"}
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
    return currentLanguage === 'ar' ? (pkg.price_sar || pkg.price || 0) : (pkg.price_usd || pkg.price || 0);
  };

  const getPackageIcon = (index: number) => {
    const icons = [Shield, Star, Crown];
    return icons[index % icons.length];
  };

  const getPackageColor = (index: number) => {
    const colors = ["bg-gray-500", "bg-emerald-500", "bg-purple-500"];
    return colors[index % colors.length];
  };

  const handlePlanSelect = (planId: string) => {
    const selectedPackage = packages.find(pkg => pkg.id === planId);
    if (selectedPackage && getPackagePrice(selectedPackage) === 0) {
      // Free plan - go directly to dashboard
      navigate("/dashboard");
    } else {
      // Paid plan - go to payment page
      navigate("/payment", { state: { planId } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <div className="text-white text-xl">جاري تحميل الباقات...</div>
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
          <h1 className="text-4xl font-bold mb-4">اختر خطتك المثالية</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            ابدأ رحلتك مع الخطة التي تناسب احتياجاتك في بناء شجرة عائلتك
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
            
            return (
              <Card 
                key={pkg.id} 
                className={`relative transition-all hover:shadow-2xl hover:scale-105 bg-white/95 backdrop-blur-sm flex flex-col h-full ${
                  selectedPlan === pkg.id ? 'ring-4 ring-white scale-105' : ''
                } ${pkg.is_featured ? 'border-emerald-300 shadow-2xl' : ''}`}
              >
                {pkg.is_featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-6 py-2 text-sm">الأكثر شعبية</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-8">
                  <div className={`w-16 h-16 ${packageColor} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <PackageIcon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-primary mb-2">{packageName}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-primary">{formatPrice(packagePrice)}</span>
                    <span className="text-muted-foreground">/سنوياً</span>
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
                      pkg.is_featured 
                        ? 'hero-gradient border-0 text-white hover:shadow-lg' 
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                    onClick={() => handlePlanSelect(pkg.id)}
                  >
                    {packagePrice === 0 ? "ابدأ مجاناً" : "اختيار الخطة"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-white/80 mt-12">
          <p className="text-sm">
            يمكنك تغيير خطتك أو إلغائها في أي وقت من إعدادات الحساب
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;