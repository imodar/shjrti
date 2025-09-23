import { useState, useEffect } from "react";
type DatePreference = 'gregorian' | 'gregorian-levantine' | 'hijri';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Calendar, Edit, Save, X, Camera, Trash2, AlertTriangle, Heart, Users, Bell, Settings, LogOut, Crown, Gem, TreePine, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { useAuth } from "@/contexts/AuthContext";
import { useDatePreference } from "@/contexts/DatePreferenceContext";
import { useDateFormat } from "@/hooks/useDateFormat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const { datePreference: globalDatePreference, setDatePreference: setGlobalDatePreference } = useDatePreference();
  const { format } = useDateFormat();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<{
    name: string;
    status: string;
    expires_at?: string;
  } | null>(null);
  const [stats, setStats] = useState({
    familiesCreated: 0,
    totalMembers: 0,
    lastActivity: "اليوم"
  });
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    joinDate: "",
    datePreference: globalDatePreference as DatePreference
  });

  // Sync local state with global date preference
  useEffect(() => {
    setProfileData(prev => ({ ...prev, datePreference: globalDatePreference }));
  }, [globalDatePreference]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchUserStats();
      fetchCurrentPackage();
    }
  }, [user]);

  const fetchCurrentPackage = async () => {
    try {
      if (!user?.id) return;

      console.log('Fetching current package for user:', user.id);

      // Get user's active subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          status,
          expires_at,
          packages (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subError) {
        console.log('No active subscription found:', subError);
        setCurrentPackage({
          name: "الباقة المجانية",
          status: "active"
        });
        return;
      }

      console.log('Subscription found:', subscription);

      // Parse the package name JSON to get the Arabic name
      let packageName = "باقة مخصصة";
      if (subscription.packages?.name) {
         try {
           // @ts-ignore - Handle JSONB format after migration
           const nameObj = typeof subscription.packages.name === 'string' 
             ? JSON.parse(subscription.packages.name) 
             : subscription.packages.name;
           packageName = nameObj.ar || nameObj.en || "باقة مخصصة";
         } catch (e) {
           // If it's not JSON, use the name as is
           // @ts-ignore - Handle mixed types
           packageName = typeof subscription.packages.name === 'string' 
             ? subscription.packages.name 
             : "باقة مخصصة";
         }
      }

      setCurrentPackage({
        name: packageName,
        status: subscription.status,
        expires_at: subscription.expires_at
      });

    } catch (error) {
      console.error('Error fetching current package:', error);
      setCurrentPackage({
        name: "الباقة المجانية",
        status: "active"
      });
    }
  };

  const fetchUserStats = async () => {
    try {
      if (!user?.id) return;

      console.log('Fetching user stats for:', user.id);

      // Get families created by the user
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select('id')
        .eq('creator_id', user.id);

      if (familiesError) {
        console.error('Error fetching families:', familiesError);
        return;
      }

      const familiesCount = families?.length || 0;
      console.log('Families created:', familiesCount);

      // Get total family tree members from all user's families
      let totalMembers = 0;
      if (families && families.length > 0) {
        const familyIds = families.map(family => family.id);
        
        const { count, error: membersError } = await supabase
          .from('family_tree_members')
          .select('id', { count: 'exact' })
          .in('family_id', familyIds);

        if (membersError) {
          console.error('Error fetching family tree members:', membersError);
        } else {
          totalMembers = count || 0;
        }
      }

      console.log('Total members:', totalMembers);

      setStats({
        familiesCreated: familiesCount,
        totalMembers: totalMembers,
        lastActivity: "اليوم"
      });

    } catch (error) {
      console.error('Error in fetchUserStats:', error);
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile data for user:', user?.id);
      
      // Fetch profile data from database
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      console.log('Profile fetch result:', { profileData, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error('Error fetching profile:', error);
        toast({
          title: "خطأ في التحميل",
          description: "حدث خطأ أثناء تحميل البيانات",
          variant: "destructive"
        });
        return;
      }

      // Set profile data from database or fallback to user auth data
      const userData = {
        firstName: profileData?.first_name || "",
        lastName: profileData?.last_name || "",
        email: profileData?.email || user?.email || "",
        phone: profileData?.phone || "",
        joinDate: profileData?.created_at ? format(new Date(profileData.created_at)) : format(new Date()),
        datePreference: (profileData?.date_preference || "gregorian") as DatePreference
      };

      console.log('Setting profile data:', userData);
      setProfileData(userData);
      
    } catch (error) {
      console.error('Error in fetchProfileData:', error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('Starting save operation for user:', user?.id);
      console.log('Profile data to save:', profileData);

      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      console.log('Existing profile check:', { existingProfile, checkError });

      let error;

      if (existingProfile) {
        console.log('Updating existing profile...');
        // Update existing profile
        const result = await supabase
          .from('profiles')
          .update({
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone,
            date_preference: profileData.datePreference,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id);
        
        console.log('Update result:', result);
        error = result.error;
      } else {
        console.log('Creating new profile...');
        // Insert new profile
        const result = await supabase
          .from('profiles')
          .insert({
            user_id: user?.id,
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone,
            date_preference: profileData.datePreference
          });
        
        console.log('Insert result:', result);
        error = result.error;
      }

      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "خطأ في الحفظ",
          description: "حدث خطأ أثناء حفظ البيانات",
          variant: "destructive"
        });
        return;
      }

      console.log('Profile saved successfully');
      setIsEditing(false);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ معلوماتك الشخصية بنجاح"
      });

      // Refresh profile data from database
      await fetchProfileData();

    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values by fetching from database
    fetchProfileData();
  };

  const getDisplayName = () => {
    const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
    return fullName || profileData.email || "مستخدم";
  };

  const getInitials = () => {
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName[0]}${profileData.lastName[0]}`;
    } else if (profileData.firstName) {
      return profileData.firstName.slice(0, 2);
    } else if (profileData.email) {
      return profileData.email.slice(0, 2).toUpperCase();
    }
    return "مس";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950/50 dark:to-cyan-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      {/* Floating Animated Icons */}
      <div className="absolute top-32 right-20 animate-float">
        <Heart className="h-10 w-10 text-pink-400 opacity-60" />
      </div>
      <div className="absolute bottom-40 left-20 animate-float-delayed">
        <Users className="h-12 w-12 text-emerald-400 opacity-40" />
      </div>
      <div className="absolute top-1/2 left-10 animate-float-slow">
        <User className="h-8 w-8 text-yellow-400 opacity-60" />
      </div>

      <div className="relative z-10">
        <GlobalHeader />

        <div className="container mx-auto px-6 pt-24 pb-12 relative z-10">
          <div className="max-w-6xl mx-auto">
            
            {/* Profile Header Section */}
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
              
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-6 px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* User Avatar */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white/30 dark:border-gray-700/30">
                        <span className="text-2xl font-bold text-white">
                          {getInitials()}
                        </span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                      </div>
                    </div>
                    
                    {/* Welcome Text */}
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                          الملف الشخصي
                        </span>
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        إدارة معلوماتك الشخصية والحساب
                      </p>
                    </div>
                  </div>
                  
                  {/* Package Status - Match Dashboard Logic */}
                  <div className="flex flex-col items-start gap-2">
                    {currentPackage && currentPackage.name !== "الباقة المجانية" && currentPackage.status === "active" ? (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 rounded-full shadow-lg">
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-bold">{currentPackage.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl p-3 border border-amber-200/50 dark:border-amber-700/50 shadow-lg">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <Gem className="h-4 w-4" />
                          <span className="text-sm font-medium">{currentPackage?.name || "الباقة المجانية"}</span>
                        </div>
                        <Link to="/plan-selection">
                          <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs px-2 py-1 rounded-full border-0">
                            طوّر حسابك
                          </Button>
                        </Link>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                      <span>نشط منذ {profileData.joinDate}</span>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-2 right-2 w-6 h-6 border-r border-t border-emerald-300/40 dark:border-emerald-700/40"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-l border-b border-emerald-300/40 dark:border-emerald-700/40"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Stats Section */}
              <div className="space-y-6">
                
                {/* Account Stats */}
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">
                        إحصائيات الحساب
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">الأشجار المنشأة</p>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.familiesCreated}</p>
                          </div>
                          <TreePine className="h-8 w-8 text-emerald-500" />
                        </div>
                      </div>
                      
                      <div className="bg-teal-50 dark:bg-teal-950/30 p-4 rounded-lg border border-teal-200/50 dark:border-teal-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">إجمالي الأفراد</p>
                            <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{stats.totalMembers}</p>
                          </div>
                          <Users className="h-8 w-8 text-teal-500" />
                        </div>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">آخر نشاط</p>
                            <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">{stats.lastActivity}</p>
                          </div>
                          <Calendar className="h-8 w-8 text-amber-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Information and Quick Actions */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            المعلومات الشخصية
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            تحديث بياناتك الأساسية
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                      >
                        {isEditing ? (
                          <>
                            <X className="h-4 w-4" />
                            إلغاء
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4" />
                            تعديل
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium">الاسم الأول</Label>
                        <Input
                          value={profileData.firstName}
                          onChange={(e) => setProfileData(prev => ({...prev, firstName: e.target.value}))}
                          disabled={!isEditing}
                          className="bg-white/50 dark:bg-gray-900/50 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 dark:focus:border-emerald-400"
                          placeholder="اكتب اسمك الأول"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium">اسم العائلة</Label>
                        <Input
                          value={profileData.lastName}
                          onChange={(e) => setProfileData(prev => ({...prev, lastName: e.target.value}))}
                          disabled={!isEditing}
                          className="bg-white/50 dark:bg-gray-900/50 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 dark:focus:border-emerald-400"
                          placeholder="اكتب اسم العائلة"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium">البريد الإلكتروني</Label>
                        <Input
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({...prev, email: e.target.value}))}
                          disabled={!isEditing}
                          className="bg-white/50 dark:bg-gray-900/50 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 dark:focus:border-emerald-400"
                          placeholder="البريد الإلكتروني"
                          type="email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium">رقم الهاتف</Label>
                        <Input
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({...prev, phone: e.target.value}))}
                          disabled={!isEditing}
                          className="bg-white/50 dark:bg-gray-900/50 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 dark:focus:border-emerald-400"
                          placeholder="رقم الهاتف (اختياري)"
                          type="tel"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex gap-3 pt-4 border-t border-emerald-200/50 dark:border-emerald-700/50">
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 gap-2"
                        >
                          {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          إلغاء
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Quick Actions with Creative Design */}
                <div className="relative">
                  {/* Background Gradient Blur */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-pink-500/20 rounded-2xl blur-xl"></div>
                  
                  <Card className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
                    {/* Decorative Header Background */}
                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-amber-400/20 via-orange-400/30 to-pink-400/20"></div>
                    
                     <CardHeader className="relative pb-3 pt-4">
                       <div className="flex items-center gap-4">
                        <div className="relative">
                          {/* Icon Glow Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur-lg opacity-60 animate-pulse"></div>
                          <div className="relative w-12 h-12 bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-xl border-2 border-white/30 dark:border-gray-700/30">
                            <Settings className="h-6 w-6 text-white animate-pulse" />
                          </div>
                        </div>
                        <div>
                          <CardTitle className="text-xl bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 bg-clip-text text-transparent font-bold">
                            إجراءات سريعة
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            الوصول السريع للخدمات المهمة
                          </p>
                        </div>
                      </div>
                      
                      {/* Decorative Corner Elements */}
                      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-amber-300/50 dark:border-amber-700/50 rounded-tr-lg"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-orange-300/50 dark:border-orange-700/50 rounded-bl-lg"></div>
                    </CardHeader>
                    
                    <CardContent className="relative space-y-4 pb-8 pt-6">
                      {/* Date Preference Section */}
                      <div className="mb-6 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              نوع التقويم المفضل
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              اختر نوع التقويم الذي تفضل عرض التواريخ به
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="datePreference" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            نوع التقويم
                          </Label>
                          {isEditing ? (
                            <Select
                              value={profileData.datePreference}
                              onValueChange={(value) => setProfileData({...profileData, datePreference: value as DatePreference})}
                            >
                              <SelectTrigger className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200">
                                <SelectValue placeholder="اختر نوع التقويم" />
                              </SelectTrigger>
                               <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
                                 <SelectItem value="gregorian" className="hover:bg-blue-50 dark:hover:bg-blue-950">
                                   <div className="flex items-center gap-2">
                                     <span>📅</span>
                                     <span>التقويم الميلادي (يناير، فبراير...)</span>
                                   </div>
                                 </SelectItem>
                                 <SelectItem value="gregorian-levantine" className="hover:bg-purple-50 dark:hover:bg-purple-950">
                                   <div className="flex items-center gap-2">
                                     <span>🗓️</span>
                                     <span>التقويم الشامي (كانون الثاني، شباط...)</span>
                                   </div>
                                 </SelectItem>
                                 <SelectItem value="hijri" className="hover:bg-emerald-50 dark:hover:bg-emerald-950">
                                   <div className="flex items-center gap-2">
                                     <span>🌙</span>
                                     <span>التقويم الهجري (الإسلامي)</span>
                                   </div>
                                 </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                             <div 
                               className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600"
                               onClick={async () => {
                                 // Cycle through date preferences
                                 let newPreference: DatePreference;
                                 if (profileData.datePreference === 'gregorian') {
                                   newPreference = 'gregorian-levantine';
                                 } else if (profileData.datePreference === 'gregorian-levantine') {
                                   newPreference = 'hijri';
                                 } else {
                                   newPreference = 'gregorian';
                                 }
                                 
                                 try {
                                   await setGlobalDatePreference(newPreference);
                                   let description = '';
                                   if (newPreference === 'gregorian') {
                                     description = 'تم تغيير تفضيل التقويم إلى الميلادي (يناير، فبراير...)';
                                   } else if (newPreference === 'gregorian-levantine') {
                                     description = 'تم تغيير تفضيل التقويم إلى الشامي (كانون الثاني، شباط...)';
                                   } else {
                                     description = 'تم تغيير تفضيل التقويم إلى الهجري';
                                   }
                                   
                                   toast({
                                     title: "تم التحديث",
                                     description
                                   });
                                 } catch (error) {
                                   toast({
                                     title: "خطأ",
                                     description: "حدث خطأ أثناء تحديث تفضيل التقويم",
                                     variant: "destructive"
                                   });
                                 }
                               }}
                             >
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                   <span>
                                     {profileData.datePreference === 'hijri' ? '🌙' : 
                                      profileData.datePreference === 'gregorian-levantine' ? '🗓️' : '📅'}
                                   </span>
                                   <span className="text-gray-700 dark:text-gray-300">
                                     {profileData.datePreference === 'hijri' ? 'التقويم الهجري (الإسلامي)' :
                                      profileData.datePreference === 'gregorian-levantine' ? 'التقويم الشامي (كانون الثاني، شباط...)' :
                                      'التقويم الميلادي (يناير، فبراير...)'}
                                   </span>
                                 </div>
                                 <span className="text-xs text-blue-600 dark:text-blue-400 opacity-70">
                                   انقر للتبديل
                                 </span>
                               </div>
                             </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link to="/payments" className="group">
                          <Button className="w-full justify-start gap-3 h-14 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-700 border border-amber-200/70 dark:from-amber-950/40 dark:to-orange-950/40 dark:hover:from-amber-950/60 dark:hover:to-orange-950/60 dark:text-amber-300 dark:border-amber-700/70 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                              <Crown className="h-4 w-4 text-white group-hover:animate-pulse" />
                            </div>
                            <span className="font-medium">إدارة الاشتراك</span>
                          </Button>
                        </Link>
                        
                        <Link to="/change-password" className="group">
                          <Button className="w-full justify-start gap-3 h-14 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 text-gray-700 border border-gray-200/70 dark:from-gray-800/60 dark:to-slate-800/60 dark:hover:from-gray-800/80 dark:hover:to-slate-800/80 dark:text-gray-300 dark:border-gray-600/70 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105">
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg flex items-center justify-center">
                              <Shield className="h-4 w-4 text-white group-hover:animate-pulse" />
                            </div>
                            <span className="font-medium">تغيير كلمة المرور</span>
                          </Button>
                        </Link>
                      </div>
                      
                      {/* Floating Decorative Elements */}
                      <div className="absolute -top-2 right-8 w-4 h-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-60 animate-bounce"></div>
                      <div className="absolute -bottom-1 left-12 w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-50 animate-pulse"></div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}