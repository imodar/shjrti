import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  plan: string;
  avatar?: string;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchNotifications();
      calculateTotalMembers();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Use default data if profile doesn't exist
        setProfile({
          firstName: user?.email?.split('@')[0] || 'مستخدم',
          lastName: '',
          email: user?.email || '',
          plan: 'الباقة الأساسية'
        });
      } else {
        setProfile({
          firstName: profileData.first_name || user?.email?.split('@')[0] || 'مستخدم',
          lastName: profileData.last_name || '',
          email: profileData.email || user?.email || '',
          plan: 'الباقة الأساسية'
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setProfile({
        firstName: user?.email?.split('@')[0] || 'مستخدم',
        lastName: '',
        email: user?.email || '',
        plan: 'الباقة الأساسية'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        return;
      }

      const formattedNotifications: Notification[] = (notificationsData || []).map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        time: formatTimeAgo(notification.created_at),
        isRead: notification.is_read,
        type: notification.type as 'info' | 'success' | 'warning' | 'error'
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      setNotifications([]);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `منذ ${diffInWeeks} أسبوع`;
  };

  const calculateTotalMembers = async () => {
    try {
      if (!user?.id) {
        setTotalMembers(0);
        return;
      }

      // First get all families created by the user
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select('id')
        .eq('creator_id', user.id);

      if (familiesError) {
        console.error('Error fetching families:', familiesError);
        setTotalMembers(0);
        return;
      }

      if (!families || families.length === 0) {
        setTotalMembers(0);
        return;
      }

      // Get family IDs
      const familyIds = families.map(family => family.id);

      // Count total family tree members from all user's families
      const { count, error: membersError } = await supabase
        .from('family_tree_members')
        .select('id', { count: 'exact' })
        .in('family_id', familyIds);

      if (membersError) {
        console.error('Error fetching family tree members:', membersError);
        setTotalMembers(0);
        return;
      }

      // Set the count from the database
      setTotalMembers(count || 0);
      
    } catch (error) {
      console.error('Error in calculateTotalMembers:', error);
      setTotalMembers(0);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
    }
  };

  return {
    notifications,
    profile,
    totalMembers,
    loading,
    markNotificationAsRead,
    markAllAsRead,
    refreshData: () => {
      if (user) {
        fetchUserProfile();
        fetchNotifications();
        calculateTotalMembers();
      }
    }
  };
}