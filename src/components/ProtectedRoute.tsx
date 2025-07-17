import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(requireAdmin);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (requireAdmin && user) {
      const checkAdminStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error checking admin status:', error);
            toast({
              title: "خطأ",
              description: "حدث خطأ في التحقق من صلاحيات الإدارة",
              variant: "destructive",
            });
            navigate('/dashboard');
            return;
          }

          if (!data) {
            toast({
              title: "غير مسموح",
              description: "ليس لديك صلاحيات للوصول لهذه الصفحة",
              variant: "destructive",
            });
            navigate('/dashboard');
            return;
          }

          setIsAdmin(true);
        } catch (error) {
          console.error('Error checking admin status:', error);
          navigate('/dashboard');
        } finally {
          setAdminLoading(false);
        }
      };

      checkAdminStatus();
    }
  }, [requireAdmin, user, navigate, toast]);

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}