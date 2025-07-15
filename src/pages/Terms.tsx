import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, Users, Shield, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950" dir="rtl">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  الشروط والأحكام
                </h1>
                <p className="text-emerald-600 dark:text-emerald-400">
                  شروط استخدام منصة أشجار العائلة
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
    </div>
  );
}