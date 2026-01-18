import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireActiveSubscription?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireActiveSubscription = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Combined loading state - wait for all required checks at once
  const isLoading = loading || 
    (requireAdmin && adminLoading) || 
    (requireActiveSubscription && subscriptionLoading);
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (requireAdmin && !adminLoading && user && !isAdmin) {
      toast({
        title: "غير مسموح",
        description: "ليس لديك صلاحيات للوصول لهذه الصفحة",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [requireAdmin, isAdmin, adminLoading, user, navigate, toast]);

  useEffect(() => {
    if (requireActiveSubscription && !subscriptionLoading && user) {
      if (!hasActiveSubscription) {
        navigate('/plan-selection', { replace: true });
      }
    }
  }, [requireActiveSubscription, hasActiveSubscription, subscriptionLoading, navigate, user]);

  // Single unified loading check - no intermediate loaders
  if (isLoading) {
    return null; // Let page skeleton handle loading state
  }

  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  if (requireActiveSubscription && !hasActiveSubscription) {
    return null;
  }

  return <>{children}</>;
}