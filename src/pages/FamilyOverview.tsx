import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, UserPlus, Edit, Trash2, MoreVertical, TreePine, BarChart3, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SharedFooter } from "@/components/SharedFooter";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const FamilyOverview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Data states
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<any[]>([]);
  const [familyData, setFamilyData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [packageData, setPackageData] = useState<any>(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Calculate generation statistics
  const calculateGenerationCount = () => {
    if (familyMembers.length === 0) return 1;
    
    const generationMap = new Map();
    
    // Start with founders as generation 1
    familyMembers.forEach(member => {
      if (member.isFounder || (!member.fatherId && !member.motherId)) {
        generationMap.set(member.id, 1);
      }
    });
    
    // Recursively assign generations
    let changed = true;
    let maxIterations = 50;
    let iterations = 0;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (!generationMap.has(member.id)) {
          if (member.fatherId || member.motherId) {
            const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : undefined;
            const motherGeneration = member.motherId ? generationMap.get(member.motherId) : undefined;
            
            if (fatherGeneration !== undefined || motherGeneration !== undefined) {
              const parentGeneration = Math.max(
                fatherGeneration || 0, 
                motherGeneration || 0
              );
              generationMap.set(member.id, parentGeneration + 1);
              changed = true;
            }
          } else {
            generationMap.set(member.id, 1);
            changed = true;
          }
        }
      });
    }
    
    // Assign spouses to same generation
    familyMarriages.forEach(marriage => {
      const husbandGeneration = generationMap.get(marriage.husband?.id);
      const wifeGeneration = generationMap.get(marriage.wife?.id);
      
      if (husbandGeneration && !wifeGeneration) {
        generationMap.set(marriage.wife?.id, husbandGeneration);
      } else if (wifeGeneration && !husbandGeneration) {
        generationMap.set(marriage.husband?.id, wifeGeneration);
      }
    });
    
    const generations = Array.from(generationMap.values());
    return generations.length > 0 ? Math.max(...generations) : 1;
  };

  // Fetch family data
  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }

        // Fetch family data
        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .select('*')
          .eq('creator_id', user.id)
          .single();

        if (familyError && familyError.code !== 'PGRST116') {
          console.error('Error fetching family:', familyError);
          throw familyError;
        }

        if (familyData) {
          setFamilyData(familyData);

          // Fetch family members
          const { data: membersData, error: membersError } = await supabase
            .from('family_tree_members')
            .select('*')
            .eq('family_id', familyData.id)
            .order('created_at', { ascending: true });

          if (membersError) throw membersError;

          // Transform data
          const transformedMembers = membersData?.map(member => ({
            id: member.id,
            name: member.name,
            fatherId: member.father_id,
            motherId: member.mother_id,
            spouseId: member.spouse_id,
            isFounder: member.is_founder,
            gender: member.gender,
            birthDate: member.birth_date || "",
            isAlive: member.is_alive,
            deathDate: member.death_date || null,
            bio: member.biography || "",
            image: member.image_url || null,
            relation: member.is_founder ? "founder" : "member",
            relatedPersonId: member.related_person_id
          })) || [];

          setFamilyMembers(transformedMembers);

          // Fetch marriages
          const { data: marriagesData, error: marriagesError } = await supabase
            .from('marriages')
            .select('*')
            .eq('family_id', familyData.id)
            .eq('is_active', true);

          if (marriagesError) throw marriagesError;

          const transformedMarriages = marriagesData?.map(marriage => ({
            id: marriage.id,
            familyId: marriage.family_id,
            isActive: marriage.is_active,
            husband: transformedMembers.find(m => m.id === marriage.husband_id),
            wife: transformedMembers.find(m => m.id === marriage.wife_id)
          })) || [];

          setFamilyMarriages(transformedMarriages);
        }

      } catch (error) {
        console.error('Error fetching family data:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ في تحميل بيانات العائلة",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilyData();
  }, [navigate, toast]);

  // Filter members
  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "founders") return matchesSearch && member.isFounder;
    if (selectedFilter === "male") return matchesSearch && member.gender === "male";
    if (selectedFilter === "female") return matchesSearch && member.gender === "female";
    
    return matchesSearch;
  });

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setShowAddMember(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('family_tree_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setFamilyMembers(familyMembers.filter(m => m.id !== memberId));
      toast({
        title: "تم الحذف",
        description: "تم حذف العضو بنجاح"
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف العضو",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات العائلة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة للوحة التحكم
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">إدارة أعضاء العائلة</h1>
                <p className="text-muted-foreground mt-1">
                  إجمالي الأعضاء: {familyMembers.length} | الأجيال: {calculateGenerationCount()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/family-tree-view')}
                variant="outline"
                className="gap-2"
              >
                <TreePine className="h-4 w-4" />
                عرض الشجرة
              </Button>
              <Button
                onClick={() => navigate('/family-statistics')}
                variant="outline"
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                الإحصائيات
              </Button>
              <Button
                onClick={() => setShowAddMember(true)}
                className="gap-2 bg-gradient-to-r from-primary to-accent"
              >
                <UserPlus className="h-4 w-4" />
                إضافة عضو جديد
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-primary/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث عن عضو..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: "all", label: "الكل" },
                { key: "founders", label: "المؤسسون" },
                { key: "male", label: "الذكور" },
                { key: "female", label: "الإناث" }
              ].map(filter => (
                <Button
                  key={filter.key}
                  variant={selectedFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.key)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="group hover:shadow-lg transition-all duration-300 border-primary/20 bg-card/50 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.image} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                      {member.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditMember(member)}>
                        <Edit className="h-4 w-4 mr-2" />
                        تعديل
                      </DropdownMenuItem>
                      {!member.isFounder && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            حذف
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{member.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {member.isFounder && (
                      <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                        مؤسس
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {member.gender === "male" ? "ذكر" : "أنثى"}
                    </Badge>
                    <Badge variant="outline" className={member.isAlive ? "text-green-600" : "text-gray-500"}>
                      {member.isAlive ? "على قيد الحياة" : "متوفى"}
                    </Badge>
                  </div>
                  
                  {member.birthDate && (
                    <p className="text-sm text-muted-foreground">
                      تاريخ الميلاد: {new Date(member.birthDate).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              {searchTerm ? "لم يتم العثور على أعضاء" : "لا توجد أعضاء بعد"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "جرب تعديل البحث أو الفلاتر" : "ابدأ ببناء شجرة عائلتك بإضافة أول عضو"}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowAddMember(true)}
                className="gap-2 bg-gradient-to-r from-primary to-accent"
              >
                <UserPlus className="h-4 w-4" />
                إضافة أول عضو
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Member Modal */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMember ? 'تعديل عضو' : 'إضافة عضو جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              استخدم صفحة بناء الشجرة الكاملة لإضافة وتعديل الأعضاء
            </p>
            <Button
              onClick={() => navigate('/family-builder')}
              className="mt-4 gap-2 bg-gradient-to-r from-primary to-accent"
            >
              <Users className="h-4 w-4" />
              فتح بناء الشجرة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SharedFooter />
    </div>
  );
};

export default FamilyOverview;