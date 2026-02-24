/**
 * StitchLayout - Shared layout wrapper for all Stitch theme pages.
 * Loads the header once; only child content re-renders on navigation.
 * Pages can override header props via setHeaderOverrides().
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { subscriptionsApi } from '@/lib/api';
import { profilesApi } from '@/lib/api/endpoints/profiles';
import { StitchHeader } from './Header';
import { cn } from '@/lib/utils';

interface HeaderOverrides {
  familyName?: string;
  suggestionsCount?: number;
  onTabChange?: (tab: string) => void;
  isOwner?: boolean;
}

export interface StitchLayoutContext {
  userName: string;
  packageName: Record<string, string> | string;
  isLoadingLayout: boolean;
  setHeaderOverrides: (overrides: HeaderOverrides) => void;
}

export function useStitchLayout() {
  return useOutletContext<StitchLayoutContext>();
}

const StitchLayout: React.FC = () => {
  const { user } = useAuth();
  const { direction } = useLanguage();
  const location = useLocation();

  const [userName, setUserName] = useState('');
  const [packageName, setPackageName] = useState<Record<string, string> | string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [headerOverrides, setHeaderOverridesState] = useState<HeaderOverrides>({});
  const loadedRef = useRef(false);

  // Reset overrides on route change
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setHeaderOverridesState({});
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const setHeaderOverrides = useCallback((overrides: HeaderOverrides) => {
    setHeaderOverridesState(overrides);
  }, []);

  // Determine header variant and activeTab from route
  const pathname = location.pathname;
  const searchParams = new URLSearchParams(location.search);

  const isBuilderPage = pathname === '/family-builder' || pathname === '/stitch-family-builder';
  const isTreePage = pathname === '/family-tree-view' || pathname === '/stitch-tree-view';
  const isFamilyPage = isBuilderPage || isTreePage;

  const variant = isFamilyPage ? 'builder' : 'account';
  const hideNav = pathname === '/family-creator' || pathname === '/stitch-family-creator';

  let activeTab = 'home';
  if (pathname === '/dashboard' || pathname === '/stitch-dashboard') activeTab = 'home';
  else if (pathname === '/profile' || pathname === '/stitch-account') activeTab = 'account';
  else if (isTreePage) activeTab = 'tree';
  else if (isBuilderPage) activeTab = searchParams.get('tab') || 'dashboard';

  // Load user profile + package once
  useEffect(() => {
    if (!user || loadedRef.current) return;

    const loadData = async () => {
      try {
        const [profileRes, subRes] = await Promise.all([
          profilesApi.get().catch(() => null),
          subscriptionsApi.get().catch(() => null),
        ]);

        if (profileRes) {
          const p = profileRes as any;
          setUserName(
            [p.first_name, p.last_name].filter(Boolean).join(' ') ||
            user.email?.split('@')[0] || 'User'
          );
        }

        if (subRes) {
          const sub = subRes as any;
          const pkgName = sub.packages?.name || sub.package?.name;
          if (pkgName) {
            setPackageName(pkgName);
          }
        }

        loadedRef.current = true;
      } catch (e) {
        console.error('StitchLayout: Failed to load layout data', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const contextValue: StitchLayoutContext = {
    userName,
    packageName,
    isLoadingLayout: isLoading,
    setHeaderOverrides,
  };

  return (
    <div className={cn(
      'theme-stitch min-h-screen bg-slate-50 dark:bg-background',
      direction === 'rtl' && 'rtl'
    )}>
      <StitchHeader
        variant={variant as 'builder' | 'account'}
        activeTab={activeTab}
        userName={userName}
        packageName={packageName}
        hideNav={hideNav}
        isLoadingLayout={isLoading}
        familyName={headerOverrides.familyName}
        suggestionsCount={headerOverrides.suggestionsCount}
        onTabChange={headerOverrides.onTabChange}
        isOwner={headerOverrides.isOwner}
      />
      <Outlet context={contextValue} />
    </div>
  );
};

export default StitchLayout;
