import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  TreePine, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Heart 
} from "lucide-react";

export function SharedFooter() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <TreePine className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">شجرة العائلة</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              احفظ تاريخ عائلتك وورثها للأجيال القادمة من خلال منصتنا المتقدمة لبناء أشجار العائلة الرقمية.
            </p>
            <div className="flex gap-4">
              <Button size="icon" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">روابط سريعة</h4>
            <div className="space-y-2">
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">الرئيسية</a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">عن الموقع</a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">الخدمات</a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">الأسعار</a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">المتجر</a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">تواصل معنا</a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">الدعم والمساعدة</h4>
            <div className="space-y-2">
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">مركز المساعدة</a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">الأسئلة الشائعة</a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">شروط الاستخدام</a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">سياسة الخصوصية</a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors">اتفاقية المستخدم</a>
            </div>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">تواصل معنا</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="h-4 w-4" />
                <span>+966 11 123 4567</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="h-4 w-4" />
                <span>info@familytree.sa</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>الرياض، المملكة العربية السعودية</span>
              </div>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium">اشترك في النشرة الإخبارية</h5>
              <div className="flex gap-2">
                <Input 
                  placeholder="بريدك الإلكتروني" 
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
                <Button className="bg-blue-600 hover:bg-blue-700">
                  اشتراك
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/20" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-300 text-sm">
            © 2024 شجرة العائلة. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <span>صُنع بـ</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>في المملكة العربية السعودية</span>
          </div>
        </div>
      </div>
    </footer>
  );
}