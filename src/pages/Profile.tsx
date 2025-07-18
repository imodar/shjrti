import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, Edit, Save, X, Camera, Trash2, AlertTriangle, Heart, Users, Bell, Settings, LogOut, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
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
    joinDate: ""
  });

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
          const nameObj = JSON.parse(subscription.packages.name);
          packageName = nameObj.ar || nameObj.en || "باقة مخصصة";
        } catch (e) {
          // If it's not JSON, use the name as is
          packageName = subscription.packages.name;
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
        firstName: profileData?.first_name || user?.email?.split('@')[0] || "",
        lastName: profileData?.last_name || "",
        email: profileData?.email || user?.email || "",
        phone: profileData?.phone || "",
        joinDate: profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA')
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
            phone: profileData.phone
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
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border-b border-gradient-to-r from-emerald-200/30 to-cyan-200/30 sticky top-0 z-50">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-2 right-10 w-6 h-6 bg-emerald-400/20 rounded-full animate-pulse"></div>
            <div className="absolute top-6 right-32 w-4 h-4 bg-teal-400/30 rotate-45 animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-4 right-64 w-3 h-3 bg-cyan-400/25 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>

          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                    <User className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    الملف الشخصي
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-muted-foreground font-medium">إدارة معلوماتك الشخصية</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-full p-1 border border-emerald-200/50 dark:border-emerald-700/50">
                  <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-emerald-500/20" asChild>
                    <Link to="/dashboard">الرئيسية</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-emerald-500/20">
                    الأشجار
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full px-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30">
                    الملف الشخصي
                  </Button>
                </div>

                <div className="relative">
                  <Button variant="ghost" size="icon" className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-emerald-200/30">
                    <Bell className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs flex items-center justify-center text-white font-bold shadow-lg animate-bounce">
                      3
                    </span>
                  </Button>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-auto p-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-emerald-200/30">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 ring-2 ring-emerald-500/50">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold">
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="hidden lg:block text-right">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{getDisplayName()}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">الباقة المميزة</p>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 ring-2 ring-emerald-500/50">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-base font-semibold leading-none text-emerald-800 dark:text-emerald-200">{getDisplayName()}</p>
                          <p className="text-sm leading-none text-emerald-600 dark:text-emerald-400">
                            {profileData.email}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <Crown className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">عضو مميز</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-emerald-200/50 dark:bg-emerald-700/50" />
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                      <User className="mr-3 h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-800 dark:text-emerald-200">الملف الشخصي</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                      <Settings className="mr-3 h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-800 dark:text-emerald-200">الإعدادات</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50" asChild>
                      <Link to="/payments">
                        <Crown className="mr-3 h-4 w-4 text-yellow-500" />
                        <span className="text-emerald-800 dark:text-emerald-200">إدارة الاشتراك</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-emerald-200/50 dark:bg-emerald-700/50" />
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/50">
                      <LogOut className="mr-3 h-4 w-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">تسجيل الخروج</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-24 h-24 mx-auto">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-600">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                  {getDisplayName()}
                </h3>
                <p className="text-muted-foreground mb-4">{profileData.email}</p>
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    عضو منذ {profileData.joinDate}
                  </Badge>
                  {currentPackage && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Crown className="h-4 w-4 text-yellow-600" />
                        <span className="font-semibold text-yellow-800 dark:text-yellow-300">الباقة الحالية</span>
                      </div>
                      <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">{currentPackage.name}</p>
                      {currentPackage.expires_at && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                          تنتهي في: {new Date(currentPackage.expires_at).toLocaleDateString('ar-SA')}
                        </p>
                      )}
                      <Badge 
                        variant={currentPackage.status === 'active' ? 'default' : 'secondary'}
                        className={`mt-2 ${currentPackage.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {currentPackage.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">إحصائيات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الأشجار المنشأة</span>
                  <span className="font-medium">{stats.familiesCreated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي الأفراد</span>
                  <span className="font-medium">{stats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">آخر نشاط</span>
                  <span className="font-medium">{stats.lastActivity}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-emerald-800 dark:text-emerald-200">المعلومات الشخصية</CardTitle>
                    <CardDescription>قم بتحديث معلوماتك الشخصية هنا</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      تعديل
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                      <Button onClick={handleCancel} size="sm" variant="outline" disabled={saving}>
                        <X className="h-4 w-4 mr-2" />
                        إلغاء
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">الاسم الأول</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        disabled={!isEditing}
                        className="pr-10"
                        placeholder="الاسم الأول"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName">الاسم الأخير</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        disabled={!isEditing}
                        className="pr-10"
                        placeholder="الاسم الأخير"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        disabled={!isEditing}
                        className="pr-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        disabled={!isEditing}
                        className="pr-10"
                        placeholder="رقم الهاتف"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Account Settings */}
                <div className="relative mt-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200 dark:from-emerald-800 dark:via-teal-800 dark:to-emerald-800 rounded-xl p-[1px]">
                    <div className="bg-white dark:bg-gray-800 rounded-xl h-full w-full"></div>
                  </div>
                  
                  <div className="relative bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg blur-sm opacity-30"></div>
                        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                          <Edit className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-xl bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                          إعدادات الحساب
                        </h4>
                        <p className="text-sm text-muted-foreground">إدارة حسابك وإعداداته المتقدمة</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link to="/change-password" className="group">
                        <div className="relative overflow-hidden rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 bg-white/50 dark:bg-gray-800/50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-emerald-800/30 hover:-translate-y-1">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/0 to-teal-100/0 group-hover:from-emerald-100/80 group-hover:to-teal-100/80 dark:group-hover:from-emerald-900/30 dark:group-hover:to-teal-900/30 transition-all duration-300"></div>
                          <div className="relative flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 group-hover:scale-110 transition-transform duration-300">
                              <Calendar className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">تغيير كلمة المرور</p>
                              <p className="text-xs text-muted-foreground">تحديث كلمة المرور الخاصة بك</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                      
                      <Link to="/payments" className="group">
                        <div className="relative overflow-hidden rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 bg-white/50 dark:bg-gray-800/50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-emerald-800/30 hover:-translate-y-1">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/0 to-teal-100/0 group-hover:from-emerald-100/80 group-hover:to-teal-100/80 dark:group-hover:from-emerald-900/30 dark:group-hover:to-teal-900/30 transition-all duration-300"></div>
                          <div className="relative flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 group-hover:scale-110 transition-transform duration-300">
                              <Mail className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">إدارة طرق الدفع</p>
                              <p className="text-xs text-muted-foreground">إعداد وإدارة وسائل الدفع</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-red-200/50 dark:border-red-800/50">
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-red-200/50 dark:border-red-800/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                            <X className="h-4 w-4 text-white" />
                          </div>
                          <h5 className="font-semibold text-red-700 dark:text-red-300">المنطقة الخطرة</h5>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-all duration-300"
                            >
                              <div className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                <span>حذف الحساب نهائياً</span>
                              </div>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl" dir="rtl">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-50/90 via-pink-50/90 to-orange-50/90 dark:from-red-950/30 dark:via-pink-950/30 dark:to-orange-950/30 rounded-lg"></div>
                            
                            <div className="relative">
                              <DialogHeader className="text-center pb-6">
                                <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 rounded-full flex items-center justify-center">
                                  <div className="text-4xl animate-pulse">😢</div>
                                </div>
                                
                                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                                  آسفون لرؤيتك تغادر...
                                </DialogTitle>
                                <DialogDescription className="text-lg text-gray-600 dark:text-gray-300">
                                  نحن نفهم أن الأمور قد تتغير، لكننا سنفتقدك حقاً
                                </DialogDescription>
                              </DialogHeader>

                              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6">
                                <div className="flex items-start gap-4">
                                  <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                                    <AlertTriangle className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2 text-lg">
                                      تحذير: هذا الإجراء لا يمكن التراجع عنه!
                                    </h3>
                                    <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-2">
                                      <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                                        سيتم حذف جميع أشجار العائلة الخاصة بك نهائياً
                                      </li>
                                      <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                                        ستفقد جميع البيانات والصور المحفوظة
                                      </li>
                                      <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                                        لن تتمكن من استرداد حسابك بعد الحذف
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  <h3 className="font-semibold text-blue-800 dark:text-blue-300">ذكرياتك معنا</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.familiesCreated}</div>
                                    <div className="text-xs text-muted-foreground">أشجار منشأة</div>
                                  </div>
                                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalMembers}</div>
                                    <div className="text-xs text-muted-foreground">فرد مضاف</div>
                                  </div>
                                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">15</div>
                                    <div className="text-xs text-muted-foreground">يوم معنا</div>
                                  </div>
                                </div>
                              </div>

                              <div className="mb-6">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                  للتأكيد، اكتب <span className="font-bold text-red-600 dark:text-red-400">"احذف حسابي"</span> في المربع أدناه:
                                </Label>
                                <Input 
                                  placeholder="احذف حسابي"
                                  className="text-center font-medium"
                                />
                              </div>

                              <DialogFooter className="gap-3">
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="flex-1">
                                    إلغاء الأمر
                                  </Button>
                                </DialogTrigger>
                                <Button 
                                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  حذف الحساب نهائياً
                                </Button>
                              </DialogFooter>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
      </div>
    </div>
  );
}
