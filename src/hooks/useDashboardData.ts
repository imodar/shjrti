import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
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
    // For now, we'll use sample notifications since there's no notification table
    // In the future, this can be connected to a real notifications table
    const sampleNotifications: Notification[] = [
      {
        id: 1,
        title: "مرحباً بك!",
        message: "تم إنشاء حسابك بنجاح. ابدأ ببناء شجرة عائلتك الآن.",
        time: "منذ ساعة",
        read: false,
        type: "success"
      },
      {
        id: 2,
        title: "نصيحة",
        message: "أضف صوراً لأفراد العائلة لجعل الشجرة أكثر تفاعلاً.",
        time: "منذ يومين",
        read: false,
        type: "info"
      }
    ];
    
    setNotifications(sampleNotifications);
  };

  const calculateTotalMembers = () => {
    // Get family members from localStorage
    const familyTrees = JSON.parse(localStorage.getItem('familyTrees') || '[]');
    const newFamilyData = JSON.parse(localStorage.getItem('newFamilyData') || '{}');
    
    let count = 0;
    
    // Count members from all trees
    familyTrees.forEach((tree: any) => {
      if (tree.members) {
        count += tree.members.length;
      }
    });
    
    // Count from new family data
    if (newFamilyData.firstMember) {
      count += 1;
    }
    
    setTotalMembers(count);
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
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