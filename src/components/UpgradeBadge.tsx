import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface UpgradeBadgeProps {
  packageName?: any;
  isPremium?: boolean;
  showUpgradePrompt?: boolean; // Show white box with upgrade button for free plan
}

export const UpgradeBadge: React.FC<UpgradeBadgeProps> = ({ 
  packageName,
  isPremium = false,
  showUpgradePrompt = true // Default to true to show upgrade for free plans
}) => {
  const { currentLanguage, t } = useLanguage();

  const getPackageName = () => {
    try {
      if (typeof packageName === 'object' && packageName !== null) {
        return packageName[currentLanguage] || packageName['ar'] || packageName['en'] || t('basic_plan', 'Basic');
      }
      return packageName || t('basic_plan', 'Basic');
    } catch {
      return t('basic_plan', 'Basic');
    }
  };

  // Premium badge - orange gradient with crown
  if (isPremium) {
    return (
      <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl sm:rounded-2xl px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 shadow-lg border border-white/20">
        <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="text-xs font-bold">
          {t('dashboard.package_prefix', 'Package')} {getPackageName()}
        </span>
      </div>
    );
  }

  // Free plan - white box with orange border, package name, and upgrade button
  if (showUpgradePrompt) {
    return (
      <div className="flex flex-col items-center gap-1 sm:gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 border-2 border-amber-500/70 dark:border-orange-500/70 shadow-lg">
        <div className="flex items-center gap-1 sm:gap-2 text-amber-600 dark:text-amber-400">
          <Gem className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs font-medium">{getPackageName()}</span>
        </div>
        <Link to="/plan-selection">
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs px-2 sm:px-3 py-1 rounded-full border-0"
          >
            {t('upgrade_account', 'طوّر حسابك')}
          </Button>
        </Link>
      </div>
    );
  }

  // Default fallback - simple badge
  return (
    <div className="flex items-center gap-1 sm:gap-2 text-amber-600 dark:text-amber-400">
      <Gem className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="text-xs font-medium">{getPackageName()}</span>
    </div>
  );
};
