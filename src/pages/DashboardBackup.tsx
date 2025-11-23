import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, TreePine, Plus, Edit, Trash2, TrendingUp, Calendar, Heart, Award, Target, Sparkles, User, CreditCard, FileText, LogOut, Settings, Share2, Copy, Check, ShoppingCart } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import dashboardStatsImage from "@/assets/dashboard-stats.jpg";
import familySuccessImage from "@/assets/family-success.jpg";
import heritageTechImage from "@/assets/heritage-tech.jpg";
import dashboardHeroBanner from "@/assets/dashboard-hero-banner.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

// Mock data for family trees
const mockTrees = [{
  id: 1,
  name: "عائلة الأحمد",
  description: "شجرة عائلة الأحمد الكريمة",
  membersCount: 12,
  generations: 4,
  createdDate: "2024-01-15",
  lastUpdated: "2024-07-10"
}, {
  id: 2,
  name: "عائلة السعد",
  description: "تاريخ وأصول عائلة السعد",
  membersCount: 8,
  generations: 3,
  createdDate: "2024-03-20",
  lastUpdated: "2024-06-25"
}];
export default function Dashboard() {
  const { direction } = useLanguage();
  const [trees, setTrees] = useState(mockTrees);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [treeToShare, setTreeToShare] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const handleDeleteTree = (id: number) => {
    setTreeToDelete(id);
    setDeleteDialogOpen(true);
  };
  const confirmDeleteTree = () => {
    if (treeToDelete && deleteConfirmText === "DELETE") {
      setTrees(trees.filter(tree => tree.id !== treeToDelete));
      setDeleteDialogOpen(false);
      setTreeToDelete(null);
      setDeleteConfirmText("");
    }
  };
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTreeToDelete(null);
    setDeleteConfirmText("");
  };
  const handleShareTree = (id: number) => {
    setTreeToShare(id);
    setShareDialogOpen(true);
    setLinkCopied(false);
  };
  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/tree/${treeToShare}?public=true`;
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };
  const closeShareDialog = () => {
    setShareDialogOpen(false);
    setTreeToShare(null);
    setLinkCopied(false);
  };
  return <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TreePine className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  لوحة التحكم
                </h1>
                <p className="text-emerald-600 dark:text-emerald-400">
                  إدارة أشجار العائلة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/store">
                <Button variant="outline" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  متجر الطباعة
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline">
                  العودة للرئيسية
                </Button>
              </Link>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full flex items-center gap-2">
                      <User className="h-4 w-4" />
                      الملف الشخصي
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
              <Link to="/store" className="w-full flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                متجر الطباعة
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/payments" className="w-full flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                طرق الدفع والاشتراكات
              </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/change-password" className="w-full flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      تغيير كلمة المرور
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/terms" className="w-full flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      الشروط والأحكام
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Banner */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl animate-fade-in">
            <img 
              src={dashboardHeroBanner} 
              alt="شجرة العائلة" 
              className="w-full h-48 md:h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-emerald-800/60 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-start px-8 md:px-12">
              <div className="text-white max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-slide-in-right">
                  احفظ تراث عائلتك للأبد
                </h2>
                <p className="text-lg md:text-xl opacity-90 mb-6 animate-fade-in">
                  ابنِ شجرة عائلتك واحتفظ بذكريات وتاريخ أجيالك في مكان واحد آمن ومنظم
                </p>
                <Link to="/family-builder?new=true">
                  <Button className="bg-white text-emerald-800 hover:bg-gray-100 px-8 py-3 text-lg font-semibold hover-scale">
                    <Plus className="h-5 w-5 ml-2" />
                    ابدأ شجرتك الآن
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Create New Tree Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                أشجار العائلة
              </h2>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                {trees.length} شجرة
              </Badge>
            </div>
            <Link to="/family-builder?new=true">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                إنشاء شجرة جديدة
              </Button>
            </Link>
          </div>
        </div>

        {/* Family Trees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trees.map(tree => <Card key={tree.id} className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-emerald-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-emerald-800 dark:text-emerald-200">
                    {tree.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleShareTree(tree.id)} className="text-emerald-600 hover:text-emerald-700">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteTree(tree.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-right">
                  {tree.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>اكتمال الشجرة</span>
                      <span>{Math.min(tree.membersCount * 10, 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500" style={{
                    width: `${Math.min(tree.membersCount * 10, 100)}%`
                  }}></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <div className="text-lg font-bold text-emerald-600">{tree.membersCount}</div>
                      <div className="text-xs text-muted-foreground">أفراد</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{tree.generations}</div>
                      <div className="text-xs text-muted-foreground">أجيال</div>
                    </div>
                  </div>
                  
                  <div className="text-center text-xs text-muted-foreground">
                    آخر تحديث: {tree.lastUpdated}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Link to={`/family-builder?treeId=${tree.id}`} className="flex-1">
                      <Button size="sm" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 group-hover:shadow-lg transition-all">
                        <Users className="h-4 w-4 mr-1" />
                        إدارة الأفراد
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="flex-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300">
                      <TreePine className="h-4 w-4 mr-1" />
                      عرض الشجرة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Empty State */}
        {trees.length === 0 && <div className="text-center py-16">
            <div className="relative mb-8">
              <img src={dashboardStatsImage} alt="إحصائيات الشجرة" className="w-64 h-32 mx-auto rounded-xl object-cover shadow-lg" />
              <div className="absolute inset-0 bg-emerald-600/20 rounded-xl"></div>
            </div>
            <TreePine className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-3">
              ابدأ رحلتك مع أشجار العائلة
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              احفظ تاريخ عائلتك وذكرياتها الثمينة. ابدأ الآن وأنشئ إرثاً رقمياً للأجيال القادمة
            </p>
            <Link to="/family-builder?new=true">
              <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-lg px-8 py-3 h-auto">
                <Plus className="h-5 w-5 mr-2" />
                إنشاء شجرة جديدة
              </Button>
            </Link>
            
            {/* Features highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                <Users className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">إدارة سهلة</h4>
                <p className="text-sm text-muted-foreground">إضافة وإدارة أفراد العائلة بطريقة بسيطة ومرنة</p>
              </div>
              <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                <TreePine className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">تصور تفاعلي</h4>
                <p className="text-sm text-muted-foreground">عرض شجرة العائلة بشكل بصري جميل وتفاعلي</p>
              </div>
              <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                <Heart className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">حفظ الذكريات</h4>
                <p className="text-sm text-muted-foreground">احتفظ بتاريخ وقصص عائلتك للأجيال القادمة</p>
              </div>
            </div>
          </div>}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={direction}>
          <DialogHeader>
            <DialogTitle className="text-red-600 text-center px-px py-[24px]">تأكيد حذف الشجرة</DialogTitle>
            <DialogDescription className="text-right">
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الشجرة وجميع بياناتها نهائياً.
              {treeToDelete && <span className="block mt-2 font-medium">
                  شجرة: {trees.find(t => t.id === treeToDelete)?.name}
                </span>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm" className="text-right block">
                للتأكيد، اكتب <span className="font-bold text-red-600">DELETE</span> في المربع أدناه:
              </Label>
              <Input id="delete-confirm" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="اكتب DELETE هنا" className="text-center" />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeDeleteDialog}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTree} disabled={deleteConfirmText !== "DELETE"}>
              حذف الشجرة نهائياً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={direction}>
          <DialogHeader>
            <DialogTitle className="text-emerald-600 text-center py-[20px]">مشاركة شجرة العائلة</DialogTitle>
            <DialogDescription className="text-right">
              شارك شجرة العائلة مع الآخرين بدون الحاجة لتسجيل الدخول
              {treeToShare && <span className="block mt-2 font-medium">
                  شجرة: {trees.find(t => t.id === treeToShare)?.name}
                </span>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-right block">رابط المشاركة العام:</Label>
              <div className="flex gap-2">
                <Input value={`${window.location.origin}/tree/${treeToShare}?public=true`} readOnly />
                <Button onClick={copyShareLink} variant="outline" size="icon" className={linkCopied ? "text-green-600" : ""}>
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {linkCopied && <p className="text-xs text-green-600 text-right">تم نسخ الرابط بنجاح!</p>}
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 text-right">
                💡 سيتمكن أي شخص لديه هذا الرابط من عرض شجرة العائلة بدون تسجيل الدخول
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={closeShareDialog} className="w-full">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}