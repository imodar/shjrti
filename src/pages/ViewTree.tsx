import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, Bell, Settings, User, LogOut, ArrowLeft, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Download, Share2, Users2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

// Mock tree data with family members organized by generations
const mockTreeData = {
  id: 1,
  name: "عائلة أحمد",
  generations: [
    {
      level: 1,
      title: "الجيل الأول (الأجداد)",
      members: [
        { id: 1, name: "أحمد محمد", gender: "male", birthYear: 1920, deathYear: 1985, spouse: "فاطمة علي" },
        { id: 2, name: "فاطمة علي", gender: "female", birthYear: 1925, deathYear: 1990, spouse: "أحمد محمد" }
      ]
    },
    {
      level: 2,
      title: "الجيل الثاني (الآباء)",
      members: [
        { id: 3, name: "محمد أحمد", gender: "male", birthYear: 1950, spouse: "عائشة سالم" },
        { id: 4, name: "عائشة سالم", gender: "female", birthYear: 1955, spouse: "محمد أحمد" },
        { id: 5, name: "علي أحمد", gender: "male", birthYear: 1952, spouse: "زينب حسن" },
        { id: 6, name: "زينب حسن", gender: "female", birthYear: 1958, spouse: "علي أحمد" }
      ]
    },
    {
      level: 3,
      title: "الجيل الثالث (الأبناء)",
      members: [
        { id: 7, name: "أحمد محمد", gender: "male", birthYear: 1980, spouse: "مريم يوسف" },
        { id: 8, name: "مريم يوسف", gender: "female", birthYear: 1985, spouse: "أحمد محمد" },
        { id: 9, name: "فاطمة محمد", gender: "female", birthYear: 1982 },
        { id: 10, name: "سالم علي", gender: "male", birthYear: 1984, spouse: "نورا أحمد" },
        { id: 11, name: "نورا أحمد", gender: "female", birthYear: 1988, spouse: "سالم علي" },
        { id: 12, name: "حسن علي", gender: "male", birthYear: 1986 }
      ]
    },
    {
      level: 4,
      title: "الجيل الرابع (الأحفاد)",
      members: [
        { id: 13, name: "محمد أحمد", gender: "male", birthYear: 2010 },
        { id: 14, name: "علي أحمد", gender: "male", birthYear: 2012 },
        { id: 15, name: "زينب سالم", gender: "female", birthYear: 2015 },
        { id: 16, name: "يوسف سالم", gender: "male", birthYear: 2018 }
      ]
    }
  ]
};

const ViewTree = () => {
  const [zoomLevel, setZoomLevel] = useState([100]);
  const [showDetails, setShowDetails] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "تم نسخ الرابط",
      description: "تم نسخ رابط الشجرة إلى الحافظة"
    });
  };

  const handleDownload = () => {
    toast({
      title: "تحميل الشجرة",
      description: "سيتم تحميل الشجرة قريباً"
    });
  };

  const getMemberCard = (member: any, level: number) => (
    <div
      key={member.id}
      className={`relative group bg-gradient-to-br ${
        member.gender === 'male' 
          ? 'from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800' 
          : 'from-pink-50 via-pink-100 to-pink-200 dark:from-pink-950 dark:via-pink-900 dark:to-pink-800'
      } rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border ${
        member.gender === 'male' ? 'border-blue-200 dark:border-blue-700' : 'border-pink-200 dark:border-pink-700'
      } min-w-[200px] max-w-[250px]`}
      style={{ transform: `scale(${zoomLevel[0] / 100})` }}
    >
      <div className="flex flex-col items-center gap-2">
        <Avatar className="w-12 h-12 border-2 border-white shadow-md">
          <AvatarFallback className={`${
            member.gender === 'male' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'
          } font-bold text-sm`}>
            {member.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="text-center">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{member.name}</h4>
          {showDetails && (
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300 mt-2">
              <p>مواليد: {member.birthYear}</p>
              {member.deathYear && <p>وفاة: {member.deathYear}</p>}
              {member.spouse && <p className="truncate">الزوج/ة: {member.spouse}</p>}
            </div>
          )}
        </div>
        
        <Badge variant={member.gender === 'male' ? 'default' : 'secondary'} className="text-xs">
          {member.gender === 'male' ? 'ذكر' : 'أنثى'}
        </Badge>
      </div>
    </div>
  );

  const renderTreeLevel = (level: number, members: any[]) => (
    <div key={level} className="flex flex-col items-center">
      {/* Level Title */}
      <div className="mb-4">
        <Badge variant="outline" className="px-4 py-2 text-sm font-semibold">
          {mockTreeData.generations.find(g => g.level === level)?.title}
        </Badge>
      </div>
      
      {/* Members */}
      <div className="flex flex-wrap justify-center gap-6 mb-8">
        {members.map(member => getMemberCard(member, level))}
      </div>
      
      {/* Connection Lines */}
      {level < mockTreeData.generations.length && (
        <div className="flex flex-col items-center mb-6">
          <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
          <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-md"></div>
          <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header - Same as Dashboard2 */}
        <header className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border-b border-gradient-to-r from-emerald-200/30 to-cyan-200/30 sticky top-0 z-50">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-2 left-10 w-6 h-6 bg-emerald-400/20 rounded-full animate-pulse"></div>
            <div className="absolute top-6 left-32 w-4 h-4 bg-teal-400/30 rotate-45 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-4 left-64 w-3 h-3 bg-cyan-400/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* Left side - Logo and Title */}
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/dashboard2')}
                  className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-emerald-200/30"
                >
                  <ArrowLeft className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                </Button>
                
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    {mockTreeData.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-muted-foreground font-medium">عرض الشجرة</p>
                  </div>
                </div>
              </div>
              
              {/* Right side - Actions and Profile */}
              <div className="flex items-center gap-4">
                {/* Tree Controls */}
                <div className="flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-full p-2 border border-emerald-200/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="rounded-full px-3"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    مشاركة
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="rounded-full px-3"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    تحميل
                  </Button>
                </div>

                {/* Profile Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-emerald-200/30">
                      <Avatar className="h-10 w-10 border-2 border-emerald-200/50">
                        <AvatarImage src="/placeholder.svg" alt="المستخدم" />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
                          أ
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">أحمد محمد</p>
                        <p className="text-xs leading-none text-muted-foreground">ahmed@example.com</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>الملف الشخصي</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>الإعدادات</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Tree Controls Panel */}
        <div className="container mx-auto px-6 py-6">
          <Card className="mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-emerald-200/30">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                إعدادات العرض
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Zoom Control */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    مستوى التكبير: {zoomLevel[0]}%
                  </h4>
                  <div className="space-y-2">
                    <Slider
                      value={zoomLevel}
                      onValueChange={setZoomLevel}
                      max={200}
                      min={50}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setZoomLevel([Math.max(50, zoomLevel[0] - 10)])}>
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setZoomLevel([100])}>
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setZoomLevel([Math.min(200, zoomLevel[0] + 10)])}>
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Display Options */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">خيارات العرض</h4>
                  <div className="space-y-2">
                    <Button
                      variant={showDetails ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                      className="w-full"
                    >
                      {showDetails ? 'إخفاء التفاصيل' : 'إظهار التفاصيل'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Family Tree Display */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-emerald-200/30 overflow-hidden">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-3">
                <Users2 className="h-8 w-8" />
                شجرة عائلة {mockTreeData.name}
              </CardTitle>
              <CardDescription className="text-lg">
                {mockTreeData.generations.reduce((total, gen) => total + gen.members.length, 0)} فرد عبر {mockTreeData.generations.length} أجيال
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col items-center space-y-0">
                {mockTreeData.generations.map((generation) =>
                  renderTreeLevel(generation.level, generation.members)
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer - Same as Dashboard2 */}
      <Footer />
    </div>
  );
};

export default ViewTree;