import { Heart, Github, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative mt-16 bg-gradient-to-r from-background via-accent/5 to-secondary/10 border-t border-border/50">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-bl from-secondary/10 to-primary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  كينلاك
                </h3>
                <p className="text-xs text-muted-foreground">Kinlak</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              منصة رائدة في إدارة الأنساب والعائلات الرقمية، نساعدك في الحفاظ على تاريخ عائلتك وبناء جسور التواصل بين الأجيال.
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-8 h-8 bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center justify-center transition-colors group"
              >
                <Twitter className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center justify-center transition-colors group"
              >
                <Linkedin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center justify-center transition-colors group"
              >
                <Github className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">روابط سريعة</h4>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                الرئيسية
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                إنشاء شجرة عائلية
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                استكشاف العائلات
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                الأسعار
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">المساعدة</h4>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                مركز المساعدة
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                الأسئلة الشائعة
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                شروط الاستخدام
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                سياسة الخصوصية
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">تواصل معنا</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-accent" />
                </div>
                <span className="text-muted-foreground">info@kinlak.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-accent" />
                </div>
                <span className="text-muted-foreground" dir="ltr">+966 50 123 4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <span className="text-muted-foreground">الرياض، المملكة العربية السعودية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© 2024 كينلاك (Kinlak). جميع الحقوق محفوظة</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>صنع بـ</span>
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
              <span>في المملكة العربية السعودية</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;