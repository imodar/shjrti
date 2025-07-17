import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, TreePine } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const DynamicPricing = () => {
  const [packages, setPackages] = useState([]);
  const [pricingContent, setPricingContent] = useState({
    title: "اختر الخطة المناسبة لك",
    subtitle: "خطط مرنة لتناسب احتياجات كل عائلة"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      // Load packages
      const { data: packagesData } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      // Load pricing content
      const { data: contentData } = await supabase
        .from('homepage_content')
        .select('content')
        .eq('section', 'pricing')
        .single();

      if (packagesData) {
        setPackages(packagesData);
      }

      if (contentData?.content && typeof contentData.content === 'object') {
        setPricingContent(contentData.content as any);
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="animate-pulse">Loading pricing...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 text-accent font-medium">
            <Star className="h-5 w-5 fill-current" />
            الخطط والأسعار
          </div>
          
          <h2 className="text-3xl lg:text-5xl font-bold">
            {pricingContent.title}
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {pricingContent.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg: any, index: number) => {
            const features = Array.isArray(pkg.features) ? pkg.features : [];
            const isPopular = index === 1; // Make middle package popular
            
            return (
              <Card 
                key={pkg.id} 
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  isPopular ? 'ring-2 ring-primary shadow-xl scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      الأكثر شعبية
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center space-y-4">
                  <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
                    isPopular ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}>
                    <TreePine className="h-8 w-8" />
                  </div>
                  
                  <div>
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {pkg.description}
                    </CardDescription>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-4xl font-bold">
                      ${pkg.price}
                      <span className="text-lg font-normal text-muted-foreground">/شهرياً</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      isPopular 
                        ? 'hero-gradient border-0 text-white' 
                        : 'variant="outline"'
                    }`}
                    size="lg"
                  >
                    {isPopular ? 'ابدأ الآن' : 'اختر هذه الخطة'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            جميع الخطط تشمل فترة تجريبية مجانية لمدة 7 أيام
          </p>
          <Button variant="ghost" size="lg">
            مقارنة تفصيلية للخطط
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DynamicPricing;