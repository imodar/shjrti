import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireActiveSubscription?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireActiveSubscription = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { isExpired, loading: subscriptionLoading } = useSubscription();
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

  // Check subscription expiration for subscription-protected routes
  useEffect(() => {
    if (requireActiveSubscription && !subscriptionLoading && user) {
      // Only redirect if we've finished loading AND subscription is expired
      if (isExpired) {
        // Add a small delay to ensure subscription context has been updated
        setTimeout(() => {
          navigate('/renew-subscription');
        }, 100);
      }
    }
  }, [requireActiveSubscription, isExpired, subscriptionLoading, navigate, user]);

  if (loading || (requireAdmin && adminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Wait for subscription loading to complete before making decisions
  if (requireActiveSubscription && subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحقق من الاشتراك...</p>
        </div>
      </div>
    );
  }

  if (!user || (requireAdmin && !isAdmin)) {
    console.log('ProtectedRoute: Access denied - user not authenticated or not admin');
    return null;
  }

  if (requireActiveSubscription && isExpired) {
    console.log('ProtectedRoute: Access denied - subscription required but expired');
    return null;
  }

  
  return <>{children}</>;
}