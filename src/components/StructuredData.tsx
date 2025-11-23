import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface StructuredDataSchema {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

interface BreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

/**
 * Component that injects JSON-LD Structured Data for SEO
 * Supports Organization, WebSite, and BreadcrumbList schemas
 */
export const StructuredData = () => {
  const location = useLocation();
  const [schemas, setSchemas] = useState<StructuredDataSchema[]>([]);

  useEffect(() => {
    loadStructuredData();
  }, [location.pathname]);

  const loadStructuredData = async () => {
    try {
      // Fetch global schemas (Organization, WebSite)
      const { data: globalSchemas, error: globalError } = await supabase
        .from('structured_data')
        .select('schema_data')
        .is('page_slug', null)
        .eq('is_active', true);

      if (globalError) {
        console.error('[StructuredData] Error loading global schemas:', globalError);
        return;
      }

      const loadedSchemas: StructuredDataSchema[] = [];

      // Add global schemas
      if (globalSchemas) {
        globalSchemas.forEach(item => {
          loadedSchemas.push(item.schema_data as StructuredDataSchema);
        });
      }

      // Generate BreadcrumbList for current page
      const breadcrumb = generateBreadcrumb(location.pathname);
      if (breadcrumb) {
        loadedSchemas.push(breadcrumb);
      }

      setSchemas(loadedSchemas);
      
      console.log('[StructuredData] Loaded schemas:', loadedSchemas.length);
    } catch (error) {
      console.error('[StructuredData] Error:', error);
    }
  };

  const generateBreadcrumb = (pathname: string): StructuredDataSchema | null => {
    // Don't generate breadcrumbs for homepage
    if (pathname === '/' || pathname === '') {
      return null;
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: 'https://shjrti.com/',
      },
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = getPageNameFromSegment(segment);
      
      items.push({
        '@type': 'ListItem',
        position: index + 2,
        name,
        item: `https://shjrti.com${currentPath}`,
      });
    });

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    };
  };

  const getPageNameFromSegment = (segment: string): string => {
    const pageNames: Record<string, string> = {
      'dashboard': 'لوحة التحكم',
      'family-builder-new': 'بناء الشجرة',
      'family-tree-view': 'عرض الشجرة',
      'family-gallery': 'معرض الصور',
      'family-statistics': 'الإحصائيات',
      'profile': 'الملف الشخصي',
      'payments': 'المدفوعات',
      'plan-selection': 'اختيار الخطة',
      'privacy-policy': 'سياسة الخصوصية',
      'terms-conditions': 'الشروط والأحكام',
      'contact-us': 'اتصل بنا',
      'admin': 'لوحة الإدارة',
    };
    
    return pageNames[segment] || segment;
  };

  // Inject schemas into document head
  useEffect(() => {
    if (schemas.length === 0) return;

    // Remove existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add new schemas
    schemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      script.id = `structured-data-${index}`;
      document.head.appendChild(script);
    });

    return () => {
      // Cleanup on unmount
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => script.remove());
    };
  }, [schemas]);

  return null; // This component doesn't render anything visible
};

export default StructuredData;
