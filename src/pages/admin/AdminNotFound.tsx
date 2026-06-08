import { Link } from "react-router-dom";
import { FileQuestion, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            الصفحة غير موجودة
          </h1>
          <p className="text-sm text-muted-foreground">
            الصفحة الإدارية التي تبحث عنها غير متوفرة أو تم نقلها.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin" className="inline-flex items-center gap-2">
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            العودة للوحة الإدارة
          </Link>
        </Button>
      </div>
    </div>
  );
}