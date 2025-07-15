import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Camera, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "أحمد محمد الأحمد",
    email: "ahmed.ahmad@email.com",
    phone: "+966 50 123 4567",
    location: "الرياض، المملكة العربية السعودية",
    bio: "مهتم بحفظ تاريخ العائلة وتوثيق الأنساب للأجيال القادمة",
    joinDate: "2024-01-15"
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here would be the actual save logic
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950" dir="rtl">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  الملف الشخصي
                </h1>
                <p className="text-emerald-600 dark:text-emerald-400">
                  إدارة معلوماتك الشخصية
                </p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button variant="outline">
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </div>

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
                      {profileData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
                  {profileData.name}
                </h3>
                <p className="text-muted-foreground mb-4">{profileData.email}</p>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  عضو منذ {profileData.joinDate}
                </Badge>
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
                  <span className="font-medium">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي الأفراد</span>
                  <span className="font-medium">20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">آخر نشاط</span>
                  <span className="font-medium">اليوم</span>
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
                      <Button onClick={handleSave} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Save className="h-4 w-4 mr-2" />
                        حفظ
                      </Button>
                      <Button onClick={handleCancel} size="sm" variant="outline">
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
                    <Label htmlFor="name">الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        disabled={!isEditing}
                        className="pr-10"
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
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">الموقع</Label>
                    <div className="relative">
                      <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        disabled={!isEditing}
                        className="pr-10"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">نبذة شخصية</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="اكتب نبذة عن نفسك..."
                  />
                </div>
                
                {/* Account Settings */}
                <div className="relative mt-8">
                  {/* Decorative gradient border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200 dark:from-emerald-800 dark:via-teal-800 dark:to-emerald-800 rounded-xl p-[1px]">
                    <div className="bg-white dark:bg-gray-800 rounded-xl h-full w-full"></div>
                  </div>
                  
                  <div className="relative bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl p-6 backdrop-blur-sm">
                    {/* Icon and title with decorative elements */}
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
                          {/* Hover gradient effect */}
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
                    
                    {/* Danger Zone */}
                    <div className="mt-6 pt-6 border-t border-red-200/50 dark:border-red-800/50">
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-red-200/50 dark:border-red-800/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                            <X className="h-4 w-4 text-white" />
                          </div>
                          <h5 className="font-semibold text-red-700 dark:text-red-300">المنطقة الخطرة</h5>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-all duration-300"
                        >
                          <div className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            <span>حذف الحساب نهائياً</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}