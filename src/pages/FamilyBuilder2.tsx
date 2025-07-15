import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  TreePine, 
  User, 
  Heart, 
  Star,
  Camera,
  Edit3,
  Save,
  Download,
  Share2,
  Settings,
  Calendar,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  birthDate?: string;
  location?: string;
  phone?: string;
  email?: string;
  photo?: string;
  generation: number;
}

const FamilyBuilder2 = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: "1",
      name: "أحمد محمد",
      relation: "الأب",
      birthDate: "1965-03-15",
      location: "الرياض",
      phone: "+966501234567",
      email: "ahmed@example.com",
      generation: 0
    },
    {
      id: "2", 
      name: "فاطمة علي",
      relation: "الأم",
      birthDate: "1970-07-22",
      location: "الرياض", 
      generation: 0
    },
    {
      id: "3",
      name: "محمد أحمد",
      relation: "الابن",
      birthDate: "1995-11-10",
      location: "جدة",
      generation: 1
    }
  ]);

  const generationColors = {
    0: "bg-gradient-to-r from-purple-500 to-pink-500",
    1: "bg-gradient-to-r from-blue-500 to-cyan-500", 
    2: "bg-gradient-to-r from-green-500 to-emerald-500",
    3: "bg-gradient-to-r from-orange-500 to-red-500"
  };

  const relations = [
    "الأب", "الأم", "الابن", "الابنة", "الجد", "الجدة", 
    "العم", "العمة", "الخال", "الخالة", "الأخ", "الأخت"
  ];

  const addNewMember = () => {
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: "",
      relation: "الابن",
      generation: 1
    };
    setSelectedMember(newMember);
    setActiveTab("edit");
  };

  const saveMember = (member: FamilyMember) => {
    if (member.name.trim()) {
      const existingIndex = familyMembers.findIndex(m => m.id === member.id);
      if (existingIndex >= 0) {
        const updated = [...familyMembers];
        updated[existingIndex] = member;
        setFamilyMembers(updated);
      } else {
        setFamilyMembers([...familyMembers, member]);
      }
      setSelectedMember(null);
      setActiveTab("overview");
    }
  };

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.relation.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <TreePine className="h-12 w-12 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold">بناء شجرة العائلة</h1>
            </div>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              اصنع تاريخ عائلتك الرقمي واحفظ ذكرياتكم للأجيال القادمة
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-2">
            <TabsTrigger value="overview" className="rounded-lg">
              <TreePine className="h-4 w-4 mr-2" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-lg">
              <Users className="h-4 w-4 mr-2" />
              الأعضاء
            </TabsTrigger>
            <TabsTrigger value="edit" className="rounded-lg">
              <Edit3 className="h-4 w-4 mr-2" />
              إضافة/تعديل
            </TabsTrigger>
            <TabsTrigger value="tools" className="rounded-lg">
              <Settings className="h-4 w-4 mr-2" />
              الأدوات
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 hover:scale-105 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">إجمالي الأعضاء</p>
                      <p className="text-3xl font-bold">{familyMembers.length}</p>
                    </div>
                    <Users className="h-12 w-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 hover:scale-105 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100">الأجيال</p>
                      <p className="text-3xl font-bold">
                        {Math.max(...familyMembers.map(m => m.generation)) + 1}
                      </p>
                    </div>
                    <TreePine className="h-12 w-12 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 hover:scale-105 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">العلاقات</p>
                      <p className="text-3xl font-bold">
                        {new Set(familyMembers.map(m => m.relation)).size}
                      </p>
                    </div>
                    <Heart className="h-12 w-12 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 hover:scale-105 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">اكتمال البيانات</p>
                      <p className="text-3xl font-bold">75%</p>
                    </div>
                    <Star className="h-12 w-12 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={addNewMember}
                    className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl"
                  >
                    <div className="text-center">
                      <Plus className="h-8 w-8 mx-auto mb-2" />
                      <span>إضافة عضو</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 border-2 border-emerald-200 hover:bg-emerald-50 rounded-xl"
                  >
                    <div className="text-center">
                      <Download className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                      <span className="text-emerald-700">تصدير</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 border-2 border-purple-200 hover:bg-purple-50 rounded-xl"
                  >
                    <div className="text-center">
                      <Share2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <span className="text-purple-700">مشاركة</span>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 border-2 border-orange-200 hover:bg-orange-50 rounded-xl"
                  >
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <span className="text-orange-700">إضافة صور</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Family Tree Visualization */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">شجرة العائلة</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  {[0, 1, 2].map(generation => {
                    const generationMembers = familyMembers.filter(m => m.generation === generation);
                    if (generationMembers.length === 0) return null;
                    
                    return (
                      <div key={generation} className="text-center">
                        <Badge className={`${generationColors[generation as keyof typeof generationColors]} text-white px-4 py-2 mb-4`}>
                          الجيل {generation === 0 ? 'الأول' : generation === 1 ? 'الثاني' : 'الثالث'}
                        </Badge>
                        <div className="flex flex-wrap justify-center gap-4">
                          {generationMembers.map(member => (
                            <div 
                              key={member.id}
                              className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-100 hover:border-primary/30 transition-all cursor-pointer hover:scale-105"
                              onClick={() => {
                                setSelectedMember(member);
                                setActiveTab("edit");
                              }}
                            >
                              <div className="w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3 mx-auto">
                                <User className="h-8 w-8" />
                              </div>
                              <h3 className="font-semibold text-gray-800">{member.name}</h3>
                              <p className="text-sm text-gray-600">{member.relation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            {/* Search and Filter */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="البحث عن عضو..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-2"
                    />
                  </div>
                  <Button variant="outline" className="h-12 px-6 rounded-xl border-2">
                    <Filter className="h-4 w-4 mr-2" />
                    فلترة
                  </Button>
                  <Button onClick={addNewMember} className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة عضو
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Members List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map(member => (
                <Card key={member.id} className="bg-white/80 backdrop-blur-sm shadow-xl border-0 hover:scale-105 transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className={`w-20 h-20 ${generationColors[member.generation as keyof typeof generationColors]} rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4`}>
                        <User className="h-10 w-10" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
                      <Badge variant="secondary" className="mt-2">{member.relation}</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      {member.birthDate && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {member.birthDate}
                        </div>
                      )}
                      {member.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {member.location}
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 rounded-xl"
                      onClick={() => {
                        setSelectedMember(member);
                        setActiveTab("edit");
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      تعديل
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="space-y-6">
            {selectedMember && (
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">
                    {selectedMember.name ? `تعديل ${selectedMember.name}` : "إضافة عضو جديد"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-base font-medium">الاسم الكامل</Label>
                        <Input
                          id="name"
                          value={selectedMember.name}
                          onChange={(e) => setSelectedMember({...selectedMember, name: e.target.value})}
                          className="mt-2 h-12 rounded-xl border-2"
                          placeholder="أدخل الاسم الكامل"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="relation" className="text-base font-medium">صلة القرابة</Label>
                        <select
                          id="relation"
                          value={selectedMember.relation}
                          onChange={(e) => setSelectedMember({...selectedMember, relation: e.target.value})}
                          className="mt-2 w-full h-12 rounded-xl border-2 border-gray-300 px-3"
                        >
                          {relations.map(relation => (
                            <option key={relation} value={relation}>{relation}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="birthDate" className="text-base font-medium">تاريخ الميلاد</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={selectedMember.birthDate || ''}
                          onChange={(e) => setSelectedMember({...selectedMember, birthDate: e.target.value})}
                          className="mt-2 h-12 rounded-xl border-2"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="location" className="text-base font-medium">المكان</Label>
                        <Input
                          id="location"
                          value={selectedMember.location || ''}
                          onChange={(e) => setSelectedMember({...selectedMember, location: e.target.value})}
                          className="mt-2 h-12 rounded-xl border-2"
                          placeholder="المدينة أو المنطقة"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone" className="text-base font-medium">رقم الهاتف</Label>
                        <Input
                          id="phone"
                          value={selectedMember.phone || ''}
                          onChange={(e) => setSelectedMember({...selectedMember, phone: e.target.value})}
                          className="mt-2 h-12 rounded-xl border-2"
                          placeholder="+966501234567"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-base font-medium">البريد الإلكتروني</Label>
                        <Input
                          id="email"
                          type="email"
                          value={selectedMember.email || ''}
                          onChange={(e) => setSelectedMember({...selectedMember, email: e.target.value})}
                          className="mt-2 h-12 rounded-xl border-2"
                          placeholder="example@email.com"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-8 pt-6 border-t">
                    <Button 
                      onClick={() => saveMember(selectedMember)}
                      className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      حفظ
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedMember(null);
                        setActiveTab("overview");
                      }}
                      className="flex-1 h-12 rounded-xl border-2"
                    >
                      إلغاء
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">التصدير والمشاركة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-2">
                    <Download className="h-4 w-4 mr-2" />
                    تصدير كـ PDF
                  </Button>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-2">
                    <Download className="h-4 w-4 mr-2" />
                    تصدير كـ Excel
                  </Button>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-2">
                    <Share2 className="h-4 w-4 mr-2" />
                    مشاركة الرابط
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">الإعدادات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-2">
                    <Settings className="h-4 w-4 mr-2" />
                    إعدادات الخصوصية
                  </Button>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-2">
                    <Save className="h-4 w-4 mr-2" />
                    النسخ الاحتياطي
                  </Button>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-2 text-red-600 border-red-200 hover:bg-red-50">
                    حذف الشجرة
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FamilyBuilder2;