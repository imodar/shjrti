import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Heart, 
  Users, 
  Star, 
  TreePine,
  Crown,
  Gem,
  Shield,
  Infinity,
  Camera,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Calendar,
  UserCheck,
  Quote
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentQuote, setCurrentQuote] = useState(0);
  const [displayedMembers, setDisplayedMembers] = useState(0);
  const [displayedPhotos, setDisplayedPhotos] = useState(0);
  const [displayedStories, setDisplayedStories] = useState(0);

  // Sample data
  const familyStats = {
    totalMembers: 47,
    totalPhotos: 156,
    totalStories: 23
  };

  const quotes = [
    {
      text: t('quote_1', "العائلة هي الجذور التي تحميك من عواصف الحياة"),
      author: t('quote_1_author', "المثل العربي")
    },
    {
      text: t('quote_2', "من عرف نفسه عرف ربه، ومن عرف عائلته عرف تاريخه"),
      author: t('quote_2_author', "الحكمة الشعبية")
    },
    {
      text: t('quote_3', "الإرث الحقيقي ليس ما نتركه من مال، بل ما نتركه من ذكريات"),
      author: t('quote_3_author', "قول مأثور")
    }
  ];

  useEffect(() => {
    // Animate counters
    const animateCounter = (target: number, setter: (value: number) => void) => {
      let current = 0;
      const increment = target / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(current));
        }
      }, 30);
    };

    animateCounter(familyStats.totalMembers, setDisplayedMembers);
    animateCounter(familyStats.totalPhotos, setDisplayedPhotos);
    animateCounter(familyStats.totalStories, setDisplayedStories);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <SubscriptionGuard>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
          {/* Floating Background Elements - Matching Home Page */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute top-1/3 left-1/3 w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full opacity-30 animate-bounce"></div>
            <div className="absolute bottom-1/4 right-1/3 w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full opacity-25 animate-pulse"></div>
          </div>

          {/* Floating Animated Icons - Matching Home Page */}
          <div className="absolute top-32 right-20 animate-float">
            <Heart className="h-10 w-10 text-pink-400 opacity-60" />
          </div>
          <div className="absolute bottom-40 left-20 animate-float-delayed">
            <Users className="h-12 w-12 text-emerald-400 opacity-40" />
          </div>
          <div className="absolute top-1/2 left-10 animate-float-slow">
            <Star className="h-8 w-8 text-yellow-400 opacity-60" />
          </div>
          <div className="absolute top-40 right-1/3 animate-bounce">
            <TreePine className="h-10 w-10 text-emerald-500 opacity-50" />
          </div>
          <div className="absolute bottom-1/3 right-10 animate-pulse">
            <Crown className="h-8 w-8 text-amber-500 opacity-60" />
          </div>

          <main className="relative z-10 pt-20">
            {/* Hero Welcome Section - Focused on Action */}
            <section className="py-20 relative">
              {/* Background Gradients - Matching Home Page */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-transparent to-amber-900/20"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.3),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.3),transparent_50%)]"></div>
              
              <div className="container mx-auto px-4 relative z-10">
                {/* Welcome Section */}
                <div className="text-center mb-16">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 text-sm mb-6 shadow-lg">
                    <Sparkles className="h-4 w-4 ml-2" />
                    {t('dashboard_welcome_badge', 'ابدأ رحلتك الآن')}
                  </Badge>
                  
                  <h1 className="text-5xl md:text-7xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      {t('dashboard_welcome', 'أهلاً بعودتك')}
                    </span>
                    <br />
                    <span className="text-gray-800 dark:text-gray-200">
                      {user?.email?.split('@')[0] || t('dashboard_user', 'صديقي العزيز')}
                    </span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
                    {t('dashboard_subtitle', 'استمر في بناء تراثك العائلي الرقمي')}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/family-builder?new=true">
                      <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg px-8 py-4 rounded-full shadow-xl hover-scale">
                        <Plus className="h-5 w-5 ml-2" />
                        {t('add_family_member', 'إضافة فرد عائلة')}
                      </Button>
                    </Link>
                    <Link to="/family-tree-view">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 text-lg px-8 py-4 rounded-full">
                        <TreePine className="h-5 w-5 ml-2" />
                        {t('view_family_tree', 'عرض شجرة العائلة')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Start Guide Section - Matching Home Page Style */}
            <section className="relative py-20 overflow-hidden">
              <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg">
                    <Sparkles className="h-4 w-4" />
                    {t('quick_start_badge', 'دليل البداية السريعة')}
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h2 className="text-5xl md:text-6xl font-bold mb-8">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      {t('quick_start_title', 'ابدأ بناء تراثك')}
                    </span>
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                    {t('quick_start_desc', 'خطوات بسيطة لبناء شجرة عائلتك الرقمية')}
                  </p>
                </div>

                {/* Steps Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      step: "01",
                      icon: <Plus className="h-8 w-8" />,
                      title: t('step_1_title', 'أضف أول فرد'),
                      description: t('step_1_desc', 'ابدأ بإضافة نفسك أو أحد أفراد عائلتك كنقطة انطلاق'),
                      action: t('step_1_action', 'إضافة فرد'),
                      link: '/family-builder?new=true',
                      color: "from-emerald-500 to-teal-500"
                    },
                    {
                      step: "02", 
                      icon: <Users className="h-8 w-8" />,
                      title: t('step_2_title', 'ابني الروابط'),
                      description: t('step_2_desc', 'أضف أفراد العائلة وحدد العلاقات والروابط بينهم'),
                      action: t('step_2_action', 'إدارة العائلة'),
                      link: '/family-overview',
                      color: "from-amber-500 to-orange-500"
                    },
                    {
                      step: "03",
                      icon: <TreePine className="h-8 w-8" />,
                      title: t('step_3_title', 'استكشف النتيجة'),
                      description: t('step_3_desc', 'شاهد شجرة عائلتك تنمو وتأخذ شكلها النهائي الجميل'),
                      action: t('step_3_action', 'عرض الشجرة'),
                      link: '/family-tree-view',
                      color: "from-pink-500 to-rose-500"
                    }
                  ].map((step, index) => (
                    <Card key={index} className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-4 hover:rotate-1">
                      {/* Luxury Card Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-emerald-50 dark:from-gray-800 dark:via-gray-900 dark:to-emerald-950 opacity-90"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-100/30 dark:to-emerald-900/30 group-hover:to-emerald-200/50 dark:group-hover:to-emerald-800/50 transition-all duration-700"></div>
                      
                      {/* Luxury Border Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-700"></div>
                      <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                      
                      <CardContent className="relative p-8 text-center">
                        {/* Step Number */}
                        <div className="text-6xl font-bold text-emerald-100 dark:text-emerald-900/20 mb-4">
                          {step.step}
                        </div>
                        
                        {/* Icon */}
                        <div className="relative mb-6 -mt-12">
                          <div className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 scale-110`}></div>
                          <div className={`relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${step.color} rounded-full shadow-xl group-hover:shadow-2xl group-hover:scale-125 transition-all duration-500`}>
                            <div className="text-white">
                              {step.icon}
                            </div>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                          {step.description}
                        </p>
                        
                        {/* Action Button */}
                        <Link to={step.link}>
                          <Button className={`w-full bg-gradient-to-r ${step.color} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300`}>
                            {step.action}
                            <ArrowRight className="h-4 w-4 mr-2" />
                          </Button>
                        </Link>
                        
                        {/* Luxury Bottom Accent */}
                        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl`}></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Recent Activity & Quick Access */}
            <section className="relative py-20 overflow-hidden">
              {/* Luxury Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-emerald-100 to-teal-100 dark:from-amber-900 dark:via-emerald-900 dark:to-teal-900"></div>
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(16,185,129,0.3),transparent_50%)]"></div>
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_75%_25%,rgba(245,158,11,0.3),transparent_50%)]"></div>
              </div>

              <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  
                  {/* Quick Access Panel */}
                  <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-20 rounded-2xl blur-xl"></div>
                    <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                    
                    <CardHeader className="relative">
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                        <Crown className="h-6 w-6 text-emerald-600" />
                        {t('quick_access_title', 'الوصول السريع')}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="relative space-y-4">
                      {[
                        {
                          icon: <Plus className="h-5 w-5" />,
                          title: t('add_new_member', 'إضافة فرد جديد'),
                          desc: t('add_new_member_desc', 'أضف فرداً جديداً لعائلتك'),
                          link: '/family-builder?new=true',
                          color: 'from-emerald-500 to-teal-500'
                        },
                        {
                          icon: <Users className="h-5 w-5" />,
                          title: t('family_overview', 'نظرة عامة على العائلة'),
                          desc: t('family_overview_desc', 'اطلع على جميع أفراد عائلتك'),
                          link: '/family-overview',
                          color: 'from-amber-500 to-orange-500'
                        },
                        {
                          icon: <TrendingUp className="h-5 w-5" />,
                          title: t('family_statistics', 'إحصائيات العائلة'),
                          desc: t('family_statistics_desc', 'إحصائيات وتحليلات مفصلة'),
                          link: '/family-statistics',
                          color: 'from-pink-500 to-rose-500'
                        },
                        {
                          icon: <Shield className="h-5 w-5" />,
                          title: t('profile_settings', 'إعدادات الملف الشخصي'),
                          desc: t('profile_settings_desc', 'إدارة حسابك وإعداداتك'),
                          link: '/profile',
                          color: 'from-purple-500 to-indigo-500'
                        }
                      ].map((item, index) => (
                        <Link key={index} to={item.link}>
                          <div className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 transition-all duration-300 cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <div className="text-white">
                                  {item.icon}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                                  {item.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.desc}
                                </p>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Motivational Quote */}
                  <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 opacity-20 rounded-2xl blur-xl"></div>
                    <div className="absolute inset-[1px] bg-white dark:bg-gray-800 rounded-2xl"></div>
                    
                    <CardContent className="relative p-12 text-center">
                      <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-xl mb-6">
                          <Quote className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      
                      <blockquote className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-200 mb-8 leading-relaxed">
                        "{quotes[currentQuote].text}"
                      </blockquote>
                      
                      <div className="text-lg text-emerald-600 dark:text-emerald-400 font-medium">
                        — {quotes[currentQuote].author}
                      </div>
                      
                      <div className="flex justify-center mt-8 space-x-2">
                        {quotes.map((_, index) => (
                          <div 
                            key={index}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              index === currentQuote 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 scale-125' 
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Quick Actions with Floating Cards */}
            <section className="py-20 relative">
              <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      {t('quick_actions_title', 'ابدأ الآن')}
                    </span>
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    {t('quick_actions_desc', 'اختر ما تريد فعله اليوم واستمر في بناء إرثك الرقمي')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <Link to="/family-builder?new=true">
                    <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-2 hover:scale-105 cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      
                      <CardContent className="relative p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Plus className="h-6 w-6" />
                          </div>
                          <ArrowRight className="h-6 w-6 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-3">
                          {t('quick_action_add', 'إضافة فرد جديد')}
                        </h3>
                        <p className="opacity-90 text-lg">
                          {t('quick_action_add_desc', 'أضف فرداً جديداً لشجرة عائلتك')}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link to="/family-tree-view">
                    <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-2 hover:scale-105 cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      
                      <CardContent className="relative p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <TreePine className="h-6 w-6" />
                          </div>
                          <ArrowRight className="h-6 w-6 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-3">
                          {t('quick_action_tree', 'استكشف شجرة العائلة')}
                        </h3>
                        <p className="opacity-90 text-lg">
                          {t('quick_action_tree_desc', 'اطلع على شجرة عائلتك الكاملة')}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </div>
            </section>
          </main>
        </div>
      </SubscriptionGuard>
    </div>
  );
};

export default Dashboard;