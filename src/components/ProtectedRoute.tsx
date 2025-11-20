import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireActiveSubscription?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireActiveSubscription = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { isExpired, hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Remove dangerous development mode bypass for security
  // Instead of bypassing auth completely, use proper development configuration
  
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

  // Check subscription - redirect if no active subscription
  useEffect(() => {
    if (requireActiveSubscription && !subscriptionLoading && user) {
      if (!hasActiveSubscription) {
        navigate('/plan-selection', { replace: true });
      }
    }
  }, [requireActiveSubscription, hasActiveSubscription, subscriptionLoading, navigate, user]);

  // Don't block rendering - let child components handle loading states
  // Just perform auth/subscription checks without showing intermediate loaders
  if (!loading && !user) {
    return null; // Will redirect via useEffect
  }

  if (requireAdmin && !adminLoading && !isAdmin) {
    return null; // Will redirect via useEffect
  }

  if (requireActiveSubscription && !subscriptionLoading && !hasActiveSubscription) {
    return null; // Will redirect via useEffect
  }

  
  return <>{children}</>;
}