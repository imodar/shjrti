import { TreePine, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";
import familyTreeLogo from "@/assets/family-tree-logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src={familyTreeLogo} 
                alt="شجرتي" 
                className="h-12 w-12 rounded-full"
              />
              <div>
                <h3 className="text-xl font-bold">شجرتي</h3>
                <p className="text-sm opacity-80">اكتشف جذورك</p>
              </div>
            </div>
            <p className="text-sm opacity-90 leading-relaxed">
              منصة عربية متخصصة في بناء أشجار العائلة وحفظ التاريخ العائلي 
              للأجيال القادمة بطريقة سهلة وآمنة.
            </p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  الصفحة الرئيسية
                </a>
              </li>
              <li>
                <a href="#features" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  المميزات
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  كيف يعمل
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  الأسعار
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">الدعم</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  مركز المساعدة
                </a>
              </li>
              <li>
                <a href="#" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  الأسئلة الشائعة
                </a>
              </li>
              <li>
                <a href="#" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  سياسة الخصوصية
                </a>
              </li>
              <li>
                <a href="#" className="text-sm opacity-90 hover:opacity-100 transition-opacity">
                  شروط الاستخدام
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">تواصل معنا</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 opacity-80" />
                <span className="text-sm">info@shajarti.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 opacity-80" />
                <span className="text-sm">+966 123 456 789</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 opacity-80" />
                <span className="text-sm">الرياض، المملكة العربية السعودية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm opacity-80">
            © 2024 شجرتي. جميع الحقوق محفوظة.
          </p>
          <p className="text-sm opacity-80">
            صُنع بـ ❤️ في المملكة العربية السعودية
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;