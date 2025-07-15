import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, Users, Shield, Mail, Bell, Settings, LogOut, Crown, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Footer from "@/components/Footer";

export default function Terms() {
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
          {/* Floating geometric shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-2 right-10 w-6 h-6 bg-emerald-400/20 rounded-full animate-pulse"></div>
            <div className="absolute top-6 right-32 w-4 h-4 bg-teal-400/30 rotate-45 animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-4 right-64 w-3 h-3 bg-cyan-400/25 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>

          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* Left side - Logo and Title */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    الشروط والأحكام
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-muted-foreground font-medium">شروط استخدام منصة أشجار العائلة</p>
                  </div>
                </div>
              </div>
              
              {/* Right side - Actions and Profile */}
              <div className="flex items-center gap-6">
                {/* Navigation Pills */}
                <div className="hidden md:flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-full p-1 border border-emerald-200/50 dark:border-emerald-700/50">
                  <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-emerald-500/20" asChild>
                    <Link to="/dashboard">الرئيسية</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-emerald-500/20">
                    الأشجار
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full px-4 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30">
                    الشروط
                  </Button>
                </div>

                {/* Notification Bell */}
                <div className="relative">
                  <Button variant="ghost" size="icon" className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-emerald-200/30">
                    <Bell className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs flex items-center justify-center text-white font-bold shadow-lg animate-bounce">
                      3
                    </span>
                  </Button>
                </div>
                
                {/* User Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-auto p-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-emerald-200/30">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-transparent">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold">
                              أح
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="hidden lg:block text-right">
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">أحمد محمد</p>
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
                            أح
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                          <p className="text-base font-semibold leading-none text-emerald-800 dark:text-emerald-200">أحمد محمد</p>
                          <p className="text-sm leading-none text-emerald-600 dark:text-emerald-400">
                            ahmed@example.com
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <Crown className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">عضو مميز</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-emerald-200/50 dark:bg-emerald-700/50" />
                    <DropdownMenuItem className="p-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/50" asChild>
                      <Link to="/profile">
                        <User className="mr-3 h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-800 dark:text-emerald-200">الملف الشخصي</span>
                      </Link>
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

          {/* Bottom gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Info */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-8">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">معلومات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="font-medium">آخر تحديث</p>
                    <p className="text-muted-foreground">15 يناير 2024</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="font-medium">ينطبق على</p>
                    <p className="text-muted-foreground">جميع المستخدمين</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="font-medium">الخصوصية</p>
                    <p className="text-muted-foreground">محمية بالكامل</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="font-medium">للاستفسارات</p>
                    <p className="text-muted-foreground">support@familytree.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Terms Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">
                  شروط وأحكام استخدام منصة أشجار العائلة
                </CardTitle>
                <p className="text-muted-foreground">
                  نرحب بكم في منصة أشجار العائلة. يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام خدماتنا.
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[800px] pr-4">
                  <div className="space-y-8">
                    {/* Section 1 */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        1. قبول الشروط
                      </h3>
                      <div className="space-y-3 text-muted-foreground">
                        <p>
                          بالوصول إلى منصة أشجار العائلة واستخدامها، فإنك توافق على الالتزام بهذه الشروط والأحكام وجميع القوانين واللوائح المعمول بها.
                        </p>
                        <p>
                          إذا كنت لا توافق على أي من هذه الشروط، فيُرجى عدم استخدام المنصة.
                        </p>
                      </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        2. تعريف الخدمة
                      </h3>
                      <div className="space-y-3 text-muted-foreground">
                        <p>
                          منصة أشجار العائلة هي خدمة رقمية تتيح للمستخدمين إنشاء وإدارة أشجار عائلاتهم، وحفظ المعلومات والصور والتاريخ العائلي.
                        </p>
                        <p>
                          تشمل الخدمة إنشاء ملفات شخصية لأفراد العائلة، وربط العلاقات الأسرية، وتصدير البيانات.
                        </p>
                      </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        3. حسابات المستخدمين
                      </h3>
                      <div className="space-y-3 text-muted-foreground">
                        <p>
                          لاستخدام بعض ميزات المنصة، يجب عليك إنشاء حساب. أنت مسؤول عن الحفاظ على سرية معلومات حسابك.
                        </p>
                        <p>
                          يجب أن تكون المعلومات التي تقدمها دقيقة ومحدثة. أنت مسؤول عن جميع الأنشطة التي تحدث تحت حسابك.
                        </p>
                        <p>
                          يحق لنا إيقاف أو إنهاء حسابك في حالة انتهاك هذه الشروط.
                        </p>
                      </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        4. الخصوصية وحماية البيانات
                      </h3>
                      <div className="space-y-3 text-muted-foreground">
                        <p>
                          نحن ملتزمون بحماية خصوصيتك وأمان بياناتك. جميع المعلومات الشخصية محمية وفقاً لسياسة الخصوصية الخاصة بنا.
                        </p>
                        <p>
                          لن نشارك معلوماتك الشخصية مع أطراف ثالثة دون موافقتك الصريحة، باستثناء ما تتطلبه القوانين.
                        </p>
                        <p>
                          يحق لك طلب حذف بياناتك في أي وقت، وسنقوم بمعالجة طلبك وفقاً للقوانين المعمول بها.
                        </p>
                      </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        5. المحتوى والملكية الفكرية
                      </h3>
                      <div className="space-y-3 text-muted-foreground">
                        <p>
                          أنت تحتفظ بجميع الحقوق في المحتوى الذي تنشره على المنصة، بما في ذلك النصوص والصور والمعلومات.
                        </p>
                        <p>
                          بنشر المحتوى، تمنحنا ترخيصاً لاستخدام هذا المحتوى لتشغيل الخدمة وتحسينها.
                        </p>
                        <p>
                          يحظر نشر محتوى مسيء أو غير قانوني أو ينتهك حقوق الآخرين.
                        </p>
                      </div>
                    </section>

                    {/* Section 6 */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        6. الاشتراكات والدفع
                      </h3>
                      <div className="space-y-3 text-muted-foreground">
                        <p>
                          نقدم خطط اشتراك متنوعة، بما في ذلك خطة مجانية وخطط مدفوعة بمزايا إضافية.
                        </p>
                        <p>
                          يتم تحصيل رسوم الاشتراك مقدماً ولا يمكن استردادها إلا في ظروف استثنائية.
                        </p>
                        <p>
                          يحق لنا تغيير أسعار الاشتراك مع إشعار مسبق للمستخدمين.
                        </p>
                      </div>
                    </section>

                    {/* Section 7 */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        7. إخلاء المسؤولية
                      </h3>
                      <div className="space-y-3 text-muted-foreground">
                        <p>
                          تُقدم الخدمة "كما هي" دون أي ضمانات صريحة أو ضمنية.
                        </p>
                        <p>
                          لا نتحمل مسؤولية دقة المعلومات التي يدخلها المستخدمون أو أي أضرار ناتجة عن استخدام المنصة.
                        </p>
                        <p>
                          نبذل قصارى جهدنا لضمان استمرارية الخدمة، لكننا لا نضمن عدم حدوث انقطاع مؤقت.
                        </p>
                      </div>
                    </section>

                    {/* Section 8 */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        8. إنهاء الخدمة
                      </h3>
                      <div className="space-y-3 text-muted-foreground">
                        <p>
                          يحق لك إنهاء حسابك في أي وقت من خلال إعدادات الحساب أو التواصل معنا.
                        </p>
                        <p>
                          يحق لنا إيقاف أو إنهاء حسابك في حالة انتهاك الشروط أو عدم دفع الرسوم المستحقة.
                        </p>
                        <p>
                          عند إنهاء الحساب، ستفقد الوصول إلى جميع البيانات المحفوظة في المنصة.
                        </p>
                      </div>
                    </section>

                    {/* Section 9 */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        9. التغييرات على الشروط
                      </h3>
                      <div className="space-y-3 text-muted-foreground">
                        <p>
                          نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت.
                        </p>
                        <p>
                          سيتم إشعار المستخدمين بأي تغييرات جوهرية قبل دخولها حيز التنفيذ.
                        </p>
                        <p>
                          استمرار استخدام المنصة بعد التغييرات يعني موافقتك على الشروط المحدثة.
                        </p>
                      </div>
                    </section>

                    {/* Section 10 */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        10. القانون المعمول به والمنازعات
                      </h3>
                      <div className="space-y-3 text-muted-foreground">
                        <p>
                          تخضع هذه الشروط والأحكام للقوانين المعمول بها في المملكة العربية السعودية.
                        </p>
                        <p>
                          في حالة وجود أي منازعات، نسعى لحلها ودياً، وإلا فستخضع للمحاكم المختصة.
                        </p>
                      </div>
                    </section>

                    {/* Contact */}
                    <section>
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                        التواصل معنا
                      </h3>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg">
                        <p className="text-emerald-700 dark:text-emerald-300 mb-4">
                          إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى التواصل معنا:
                        </p>
                        <div className="space-y-2 text-sm">
                          <p><strong>البريد الإلكتروني:</strong> legal@familytree.com</p>
                          <p><strong>الهاتف:</strong> +966 11 123 4567</p>
                          <p><strong>العنوان:</strong> الرياض، المملكة العربية السعودية</p>
                        </div>
                      </div>
                    </section>
                  </div>
                </ScrollArea>
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