import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Package {
  id: string;
  name: string | object;
  price_usd: number;
  price_sar: number;
  max_family_trees: number;
  max_family_members: number;
  display_order?: number;
}

interface UserSubscription {
  id: string;
  package_id: string;
  status: string;
  expires_at: string | null;
}

interface UserStats {
  familyTreesCount: number;
  familyMembersCount: number;
}

interface PackageTransitionResult {
  canProceed: boolean;
  action: 'upgrade' | 'downgrade' | 'same' | 'schedule_downgrade' | 'block_downgrade';
  message: string;
  requirements?: string[];
}

export function usePackageTransition() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);

  const getLocalizedValue = (value: string | object): string => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed[currentLanguage] || parsed['en'] || value;
      } catch {
        return value;
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      return (value as any)[currentLanguage] || (value as any)['en'] || '';
    }
    
    return String(value || '');
  };

  const getPackagePrice = (pkg: Package): number => {
    return currentLanguage === 'ar' ? pkg.price_sar : pkg.price_usd;
  };

  const fetchUserStats = async (): Promise<UserStats> => {
    if (!user) return { familyTreesCount: 0, familyMembersCount: 0 };

    try {
      const { count: treesCount } = await supabase
        .from('families')
        .select('*', { count: 'exact' })
        .eq('creator_id', user.id);

      const { data: families } = await supabase
        .from('families')
        .select('id')
        .eq('creator_id', user.id);

      const familyIds = families?.map(f => f.id) || [];
      
      const { count: membersCount } = await supabase
        .from('family_tree_members')
        .select('*', { count: 'exact' })
        .in('family_id', familyIds);

      return {
        familyTreesCount: treesCount || 0,
        familyMembersCount: membersCount || 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { familyTreesCount: 0, familyMembersCount: 0 };
    }
  };

  const analyzePackageTransition = async (
    targetPackage: Package,
    currentSubscription: UserSubscription | null,
    allPackages: Package[]
  ): Promise<PackageTransitionResult> => {
    
    // الحالة 1: مستخدم بدون اشتراك أو باقة مجانية يترقى
    if (!currentSubscription) {
      if (getPackagePrice(targetPackage) > 0) {
        return {
          canProceed: true,
          action: 'upgrade',
          message: currentLanguage === 'ar' 
            ? 'ستبقى على باقتك الحالية حتى إتمام الدفع' 
            : 'You will stay on your current plan until payment is completed'
        };
      }
    }

    // العثور على الباقة الحالية
    const currentPackage = allPackages.find(p => p.id === currentSubscription?.package_id);
    if (!currentPackage) {
      return {
        canProceed: true,
        action: 'upgrade',
        message: currentLanguage === 'ar' 
          ? 'ستبقى على باقتك الحالية حتى إتمام الدفع' 
          : 'You will stay on your current plan until payment is completed'
      };
    }

    const currentPrice = getPackagePrice(currentPackage);
    const targetPrice = getPackagePrice(targetPackage);

    console.log('🔍 Package comparison details:', {
      currentPackage: {
        id: currentPackage.id,
        name: getLocalizedValue(currentPackage.name),
        price: currentPrice
      },
      targetPackage: {
        id: targetPackage.id,
        name: getLocalizedValue(targetPackage.name),
        price: targetPrice
      },
      comparison: {
        isTargetPriceHigher: targetPrice > currentPrice,
        isTargetPriceLower: targetPrice < currentPrice,
        isPriceEqual: targetPrice === currentPrice
      }
    });

    // نفس الباقة
    if (currentSubscription.package_id === targetPackage.id) {
      return {
        canProceed: false,
        action: 'same',
        message: currentLanguage === 'ar' 
          ? 'هذه هي باقتك الحالية' 
          : 'This is your current plan'
      };
    }

    // ترقية - باقة بسعر أعلى
    if (targetPrice > currentPrice) {
      return {
        canProceed: true,
        action: 'upgrade',
        message: currentLanguage === 'ar' 
          ? 'ستبقى على باقتك الحالية حتى إتمام الدفع' 
          : 'You will stay on your current plan until payment is completed'
      };
    }

    // تنزيل - باقة بسعر أقل
    if (targetPrice < currentPrice) {
      const userStats = await fetchUserStats();
      
      // الحالة 3: التحقق من تجاوز الحدود
      const exceedsLimits = 
        userStats.familyTreesCount > targetPackage.max_family_trees ||
        userStats.familyMembersCount > targetPackage.max_family_members;

      if (exceedsLimits) {
        const requirements: string[] = [];
        
        if (userStats.familyTreesCount > targetPackage.max_family_trees) {
          const treesToDelete = userStats.familyTreesCount - targetPackage.max_family_trees;
          requirements.push(
            currentLanguage === 'ar' 
              ? `يجب حذف ${treesToDelete} شجرة عائلة (لديك ${userStats.familyTreesCount} والحد الأقصى ${targetPackage.max_family_trees})` 
              : `Delete ${treesToDelete} family tree(s) (you have ${userStats.familyTreesCount}, limit is ${targetPackage.max_family_trees})`
          );
        }

        if (userStats.familyMembersCount > targetPackage.max_family_members) {
          const membersToDelete = userStats.familyMembersCount - targetPackage.max_family_members;
          requirements.push(
            currentLanguage === 'ar' 
              ? `يجب حذف ${membersToDelete} عضو من العائلة (لديك ${userStats.familyMembersCount} والحد الأقصى ${targetPackage.max_family_members})` 
              : `Delete ${membersToDelete} family member(s) (you have ${userStats.familyMembersCount}, limit is ${targetPackage.max_family_members})`
          );
        }

        return {
          canProceed: false,
          action: 'block_downgrade',
          message: currentLanguage === 'ar' 
            ? `لا يمكن التنزيل لهذه الباقة بسبب تجاوز الحدود المسموحة. يجب عليك تقليل عدد الأشجار والأعضاء أولاً قبل المتابعة. لا يمكن الاستمرار بتنزيل الباقة حتى لو طلبت ذلك.` 
            : `Cannot downgrade to this plan due to exceeding limits. You must reduce the number of trees and members first before proceeding. You cannot continue with the downgrade even if requested.`,
          requirements
        };
      }

      // الحالة 2: تنزيل مسموح - سيتم التطبيق عند انتهاء الباقة الحالية
      const expiryDate = currentSubscription.expires_at 
        ? new Date(currentSubscription.expires_at).toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : 'en-US')
        : (currentLanguage === 'ar' ? 'غير محدد' : 'Not specified');

      return {
        canProceed: true,
        action: 'schedule_downgrade',
        message: currentLanguage === 'ar' 
          ? `سيتم تطبيق باقة "${getLocalizedValue(targetPackage.name)}" في تاريخ ${expiryDate}. ستستمر في الاستفادة من مميزات باقتك الحالية حتى ذلك التاريخ.` 
          : `"${getLocalizedValue(targetPackage.name)}" plan will be applied on ${expiryDate}. You will continue to enjoy your current plan benefits until then.`
      };
    }

    return {
      canProceed: true,
      action: 'upgrade',
      message: ''
    };
  };

  const saveScheduledDowngrade = async (
    targetPackage: Package,
    currentSubscription: UserSubscription
  ) => {
    if (!user || !currentSubscription.expires_at) return;

    try {
      const { error } = await supabase
        .from('scheduled_package_changes')
        .upsert({
          user_id: user.id,
          current_package_id: currentSubscription.package_id,
          target_package_id: targetPackage.id,
          scheduled_date: currentSubscription.expires_at,
          status: 'pending'
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving scheduled downgrade:', error);
      }
    } catch (error) {
      console.error('Error in saveScheduledDowngrade:', error);
    }
  };

  const processPackageTransition = async (
    targetPackage: Package,
    currentSubscription: UserSubscription | null,
    allPackages: Package[]
  ) => {
    setLoading(true);
    try {
      const analysis = await analyzePackageTransition(targetPackage, currentSubscription, allPackages);
      
      // حفظ التغيير المجدول في قاعدة البيانات
      if (analysis.action === 'schedule_downgrade' && currentSubscription) {
        await saveScheduledDowngrade(targetPackage, currentSubscription);
      }
      
      // عرض التحذير للحالة 4: فشل التجديد
      if (analysis.action === 'upgrade' || analysis.action === 'schedule_downgrade') {
        toast({
          title: currentLanguage === 'ar' ? "تنبيه مهم" : "Important Notice",
          description: currentLanguage === 'ar' 
            ? "في حالة فشل عملية التجديد، سيتم إيقاف حسابك مؤقتاً حتى يتم السداد" 
            : "If renewal fails, your account will be temporarily suspended until payment is made",
          variant: "default",
        });
      }

      return analysis;
    } catch (error) {
      console.error('Error processing package transition:', error);
      toast({
        title: currentLanguage === 'ar' ? "خطأ" : "Error",
        description: currentLanguage === 'ar' 
          ? "حدث خطأ في معالجة طلب تغيير الباقة" 
          : "Error processing package change request",
        variant: "destructive",
      });
      return {
        canProceed: false,
        action: 'upgrade' as const,
        message: 'Error occurred'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzePackageTransition,
    processPackageTransition,
    saveScheduledDowngrade,
    loading
  };
}