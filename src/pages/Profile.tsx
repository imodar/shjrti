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
import { LuxuryFooter } from "@/components/LuxuryFooter";
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950/50 dark:to-cyan-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950/50 dark:to-cyan-950 relative overflow-hidden">
      {/* Luxury Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-cyan-400/10 rounded-full blur-3xl animate-float opacity-60"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-tr from-cyan-400/15 via-teal-400/20 to-emerald-400/10 rounded-full blur-2xl animate-float-delayed opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-400/10 via-emerald-400/15 to-cyan-400/5 rounded-full blur-3xl animate-float-slow opacity-30"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border-b border-emerald-200/30 dark:border-emerald-700/30 sticky top-0 z-50">
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

        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* User Avatar & Overview */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
                <CardHeader className="text-center pb-4">
                  <div className="relative mx-auto">
                    <Avatar className="w-32 h-32 ring-4 ring-emerald-500/30 ring-offset-4 ring-offset-background">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-4xl font-bold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-200">{getDisplayName()}</CardTitle>
                    <CardDescription className="text-emerald-600 dark:text-emerald-400">{profileData.email}</CardDescription>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      {currentPackage?.name || "الباقة المجانية"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">تاريخ الانضمام</span>
                      </div>
                      <span className="text-sm text-emerald-700 dark:text-emerald-300">{profileData.joinDate}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-950/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-teal-600" />
                        <span className="text-sm font-medium text-teal-800 dark:text-teal-200">أشجار العائلة</span>
                      </div>
                      <span className="text-sm text-teal-700 dark:text-teal-300">{stats.familiesCreated}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-950/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5 text-cyan-600" />
                        <span className="text-sm font-medium text-cyan-800 dark:text-cyan-200">أفراد العائلة</span>
                      </div>
                      <span className="text-sm text-cyan-700 dark:text-cyan-300">{stats.totalMembers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details & Edit Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl text-emerald-800 dark:text-emerald-200">المعلومات الشخصية</CardTitle>
                    <Button
                      onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                      variant={isEditing ? "outline" : "default"}
                      className={isEditing 
                        ? "border-red-300 text-red-700 hover:bg-red-50" 
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg"}
                    >
                      {isEditing ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          إلغاء
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          تعديل
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-emerald-800 dark:text-emerald-200 font-medium">الاسم الأول</Label>
                      {isEditing ? (
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                          className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                      ) : (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200/50">
                          <p className="text-emerald-800 dark:text-emerald-200">{profileData.firstName || "غير محدد"}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-emerald-800 dark:text-emerald-200 font-medium">اسم العائلة</Label>
                      {isEditing ? (
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                          className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                      ) : (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200/50">
                          <p className="text-emerald-800 dark:text-emerald-200">{profileData.lastName || "غير محدد"}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-emerald-800 dark:text-emerald-200 font-medium">البريد الإلكتروني</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                      ) : (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200/50">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-emerald-600" />
                            <p className="text-emerald-800 dark:text-emerald-200">{profileData.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-emerald-800 dark:text-emerald-200 font-medium">رقم الهاتف</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                          placeholder="05XXXXXXXX"
                        />
                      ) : (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200/50">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-emerald-600" />
                            <p className="text-emerald-800 dark:text-emerald-200">{profileData.phone || "غير محدد"}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-emerald-200/50">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        إلغاء
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            حفظ التغييرات
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
                <CardHeader>
                  <CardTitle className="text-xl text-emerald-800 dark:text-emerald-200">الإجراءات السريعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link to="/change-password">
                      <Button className="w-full justify-start bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg">
                        <Settings className="h-4 w-4 mr-2" />
                        تغيير كلمة المرور
                      </Button>
                    </Link>
                    <Link to="/payments">
                      <Button className="w-full justify-start bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-lg">
                        <Crown className="h-4 w-4 mr-2" />
                        إدارة الاشتراك
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <LuxuryFooter />
    </div>
  );
}