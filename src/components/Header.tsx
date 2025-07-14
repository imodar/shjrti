import { Button } from "@/components/ui/button";
import { TreePine, User, LogIn } from "lucide-react";
import familyTreeLogo from "@/assets/family-tree-logo.png";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={familyTreeLogo} 
            alt="شجرتي" 
            className="h-10 w-10 rounded-full"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-primary">شجرتي</h1>
            <p className="text-xs text-muted-foreground">اكتشف جذورك</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
            المميزات
          </a>
          <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            كيف يعمل
          </a>
          <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
            الأسعار
          </a>
          <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
            تواصل معنا
          </a>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2">
            <LogIn className="h-4 w-4" />
            تسجيل الدخول
          </Button>
          <Button size="sm" className="gap-2 hero-gradient border-0">
            <User className="h-4 w-4" />
            إنشاء حساب
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;