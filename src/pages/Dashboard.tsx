import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, TreePine, Settings, Share, Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for family trees
const mockTrees = [
  {
    id: 1,
    name: "عائلة الأحمد",
    description: "شجرة عائلة الأحمد الكريمة",
    membersCount: 12,
    generations: 4,
    createdDate: "2024-01-15",
    lastUpdated: "2024-07-10"
  },
  {
    id: 2,
    name: "عائلة السعد",
    description: "تاريخ وأصول عائلة السعد",
    membersCount: 8,
    generations: 3,
    createdDate: "2024-03-20",
    lastUpdated: "2024-06-25"
  }
];

export default function Dashboard() {
  const [trees, setTrees] = useState(mockTrees);
  const [newTreeData, setNewTreeData] = useState({
    name: "",
    description: ""
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateTree = () => {
    if (newTreeData.name.trim()) {
      const newTree = {
        id: Date.now(),
        name: newTreeData.name,
        description: newTreeData.description,
        membersCount: 0,
        generations: 0,
        createdDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      setTrees([...trees, newTree]);
      setNewTreeData({ name: "", description: "" });
      setIsDialogOpen(false);
    }
  };

  const handleDeleteTree = (id: number) => {
    setTrees(trees.filter(tree => tree.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950" dir="rtl">
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
            <Link to="/">
              <Button variant="outline">
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Create New Tree Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200">
              أشجار العائلة ({trees.length})
            </h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  إنشاء شجرة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء شجرة عائلة جديدة</DialogTitle>
                  <DialogDescription>
                    أضف اسم العائلة ووصف موجز عن تاريخها
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tree-name">اسم العائلة</Label>
                    <Input
                      id="tree-name"
                      placeholder="مثال: عائلة الأحمد"
                      value={newTreeData.name}
                      onChange={(e) => setNewTreeData({...newTreeData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tree-description">وصف العائلة</Label>
                    <Textarea
                      id="tree-description"
                      placeholder="اكتب وصفاً موجزاً عن تاريخ وأصول العائلة..."
                      value={newTreeData.description}
                      onChange={(e) => setNewTreeData({...newTreeData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateTree} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={!newTreeData.name.trim()}
                  >
                    إنشاء الشجرة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Family Trees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trees.map((tree) => (
            <Card key={tree.id} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-emerald-800 dark:text-emerald-200">
                    {tree.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteTree(tree.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-right">
                  {tree.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">أفراد العائلة:</span>
                    <span className="font-medium">{tree.membersCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الأجيال:</span>
                    <span className="font-medium">{tree.generations}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">آخر تحديث:</span>
                    <span className="font-medium">{tree.lastUpdated}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-3">
                    <Link to={`/family-builder?treeId=${tree.id}`} className="flex-1">
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <Users className="h-4 w-4 mr-1" />
                        إدارة الأفراد
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="flex-1">
                      <TreePine className="h-4 w-4 mr-1" />
                      عرض الشجرة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {trees.length === 0 && (
          <div className="text-center py-12">
            <TreePine className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-emerald-800 dark:text-emerald-200 mb-2">
              لا توجد أشجار عائلة بعد
            </h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإنشاء شجرة عائلتك الأولى لحفظ تاريخ وذكريات عائلتك
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              إنشاء شجرة جديدة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}