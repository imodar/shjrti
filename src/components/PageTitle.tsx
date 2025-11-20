import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const PageTitle = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    // Map routes to translation keys
    const getTitleKey = (pathname: string): string => {
      // Remove leading slash and get first segment
      const path = pathname.slice(1).split('?')[0];
      
      if (!path || path === '') return 'page_title_home';
      if (path.startsWith('dashboard')) return 'page_title_dashboard';
      if (path.startsWith('profile')) return 'page_title_profile';
      if (path.startsWith('family-creator')) return 'page_title_family_creator';
      if (path.startsWith('family-builder')) return 'page_title_family_builder';
      if (path.startsWith('family-tree-view')) return 'page_title_family_tree_view';
      if (path.startsWith('family-statistics')) return 'page_title_family_statistics';
      if (path.startsWith('family-gallery')) return 'page_title_family_gallery';
      if (path.startsWith('admin')) {
        if (path.includes('billing')) return 'page_title_admin_billing';
        if (path.includes('email')) return 'page_title_admin_email';
        if (path.includes('analytics')) return 'page_title_admin_analytics';
        return 'page_title_admin_panel';
      }
      if (path.startsWith('payments')) return 'page_title_payments';
      if (path.startsWith('payment-success')) return 'page_title_payment_success';
      if (path.startsWith('renew-subscription')) return 'page_title_renew_subscription';
      if (path.startsWith('plan-selection')) return 'page_title_plan_selection';
      if (path.startsWith('terms')) return 'page_title_terms';
      if (path.startsWith('privacy')) return 'page_title_privacy';
      if (path.startsWith('contact')) return 'page_title_contact';
      if (path.startsWith('store')) return 'page_title_store';
      if (path.startsWith('auth')) return 'page_title_auth';
      if (path.startsWith('change-password')) return 'page_title_change_password';
      if (path.startsWith('public-tree')) return 'page_title_public_tree';
      if (path.startsWith('share')) return 'page_title_public_tree'; // Public share links use same title as public tree
      
      return 'page_title_not_found';
    };

    const titleKey = getTitleKey(location.pathname);
    const pageTitle = t(titleKey, 'شجرتي');
    
    document.title = pageTitle;
  }, [location.pathname, t]);

  return null;
};

export default PageTitle;
