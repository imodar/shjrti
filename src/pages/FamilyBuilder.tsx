import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, Plus, Search, TreePine, ArrowLeft, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { ModernFamilyMemberModal } from "@/components/ModernFamilyMemberModal";
import { FamilyMemberCard } from "@/components/FamilyMemberCard";
import { AddMemberCard } from "@/components/AddMemberCard";
import { useGenerationStats } from "@/hooks/useGenerationStats";

interface FamilyMember {
  id: string;
  name: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  relatedPersonId?: string;
  isFounder?: boolean;
  gender: string;
  birthDate?: string;
  isAlive: boolean;
  deathDate?: string | null;
  image?: string | null;
  bio?: string;
  relation?: string;
}

interface Marriage {
  id: string;
  husband?: { id: string; name: string };
  wife?: { id: string; name: string };
  is_active: boolean;
}

const FamilyBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasAIFeatures } = useSubscription();
  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const { notifications, profile } = useDashboardData();
  
  const familyId = searchParams.get('family');
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<Marriage[]>([]);
  const [familyData, setFamilyData] = useState<any>(null);
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [deleteWarningMessage, setDeleteWarningMessage] = useState("");

  // Generation statistics
  const { generationCount, generationStats } = useGenerationStats(familyMembers, familyMarriages);

  // Fetch family data
  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's subscription
      const { data: userSubscription } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          packages:package_id (
            id,
            name,
            max_family_members,
            max_family_trees,
            features
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (userSubscription?.packages) {
        setPackageData(userSubscription.packages);
      } else {
        const { data: freePackage } = await supabase
          .from('packages')
          .select('*')
          .ilike('name->en', 'Free')
          .single();
        if (freePackage) setPackageData(freePackage);
      }
      
      if (!familyId) throw new Error('No family ID provided');

      // Get family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .eq('creator_id', user.id)
        .single();

      if (familyError) throw familyError;
      setFamilyData(family);
      
      // Get family members
      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', family.id);

      if (membersError) throw membersError;

      if (members) {
        const transformedMembers = members.map(member => ({
          id: member.id,
          name: member.name,
          fatherId: member.father_id,
          motherId: member.mother_id,
          spouseId: member.spouse_id,
          relatedPersonId: member.related_person_id,
          isFounder: member.is_founder,
          gender: member.gender || 'male',
          birthDate: member.birth_date || '',
          isAlive: member.is_alive,
          deathDate: member.death_date || null,
          image: member.image_url || null,
          bio: member.biography || '',
          relation: ""
        }));
        
        setFamilyMembers(transformedMembers);
      }

      // Get marriages
      const { data: marriages, error: marriagesError } = await supabase
        .from('marriages')
        .select(`
          id,
          husband:family_tree_members!marriages_husband_id_fkey(id, name),
          wife:family_tree_members!marriages_wife_id_fkey(id, name),
          is_active
        `)
        .eq('family_id', family.id)
        .eq('is_active', true);

      if (marriagesError) throw marriagesError;
      if (marriages) setFamilyMarriages(marriages);

    } catch (error) {
      console.error('Error fetching family data:', error);
      toast({
        title: t('family_builder.error_loading_data', 'خطأ في تحميل البيانات'),
        description: t('family_builder.error_loading_desc', 'حدث خطأ أثناء تحميل بيانات العائلة'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, [familyId, toast]);

  // Utility functions
  const getAdditionalInfo = (member: FamilyMember): string | null => {
    if (member.isFounder) {
      return t('family_builder.founder', 'مؤسس العائلة');
    }
    return null;
  };

  const getFullName = (member: FamilyMember): string => {
    return member.name;
  };

  const checkIfMemberIsSpouse = (member: FamilyMember): boolean => {
    return !!member.spouseId && !member.isFounder;
  };

  const handleAddNewMember = () => {
    if (packageData && familyMembers.length >= packageData.max_family_members) {
      toast({
        title: t('family_builder.max_limit_reached', 'تم الوصول للحد الأقصى'),
        description: t('family_builder.upgrade_needed', 'يرجى ترقية الباقة لإضافة المزيد من الأعضاء'),
        variant: "destructive"
      });
      return;
    }
    setShowAddMember(true);
  };

  const handleEditMember = (member: FamilyMember) => {
    setSelectedMember(member);
    setShowAddMember(true);
  };

  const handleDeleteMember = (memberId: string) => {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) return;
    
    setMemberToDelete(member);
    setDeleteWarningMessage(`هل أنت متأكد من حذف ${member.name}؟`);
    setShowDeleteModal(true);
  };

  const performDelete = async () => {
    if (!memberToDelete) return;

    try {
      const { error } = await supabase
        .from('family_tree_members')
        .delete()
        .eq('id', memberToDelete.id);

      if (error) throw error;

      setFamilyMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      toast({
        title: t('family_builder.member_deleted', 'تم حذف العضو'),
        description: t('family_builder.member_deleted_success', 'تم حذف العضو بنجاح'),
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: t('family_builder.delete_error', 'خطأ في الحذف'),
        description: t('family_builder.delete_error_desc', 'حدث خطأ أثناء حذف العضو'),
        variant: "destructive"
      });
    } finally {
      setShowDeleteModal(false);
      setMemberToDelete(null);
    }
  };

  const handleModernModalSubmit = async (formData: any) => {
    try {
      // Handle form submission logic here
      await fetchFamilyData(); // Refresh data
      setShowAddMember(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: t('family_builder.save_error', 'خطأ في الحفظ'),
        description: t('family_builder.save_error_desc', 'حدث خطأ أثناء حفظ البيانات'),
        variant: "destructive"
      });
    }
  };

  // Filter members based on search and filter
  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
      (selectedFilter === "male" && member.gender === "male") ||
      (selectedFilter === "female" && member.gender === "female") ||
      (selectedFilter === "alive" && member.isAlive) ||
      (selectedFilter === "deceased" && !member.isAlive);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <GlobalHeader />
      
      {/* Hero Section */}
      <div className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('family_builder.back_to_dashboard', 'العودة للوحة التحكم')}
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              {familyData?.name || t('family_builder.family_tree', 'شجرة العائلة')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('family_builder.manage_members', 'إدارة أفراد العائلة')}
            </p>
            
            {/* Statistics */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{familyMembers.length}</div>
                <div className="text-sm text-muted-foreground">{t('family_builder.total_members', 'إجمالي الأعضاء')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">{generationCount}</div>
                <div className="text-sm text-muted-foreground">{t('family_builder.generations', 'الأجيال')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">{familyMarriages.length}</div>
                <div className="text-sm text-muted-foreground">{t('family_builder.marriages', 'الزيجات')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Features */}
      {hasAIFeatures && (
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SmartSearchBar familyId={familyId || ''} />
            </div>
            <div>
              <SuggestionPanel familyId={familyId || ''} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="overview">{t('family_builder.overview', 'نظرة عامة')}</TabsTrigger>
            <TabsTrigger value="tree-view">{t('family_builder.tree_view', 'عرض الشجرة')}</TabsTrigger>
            <TabsTrigger value="statistics">{t('family_builder.statistics', 'الإحصائيات')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('family_builder.search_members', 'البحث في الأعضاء...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-input bg-background"
              >
                <option value="all">{t('family_builder.all_members', 'جميع الأعضاء')}</option>
                <option value="male">{t('family_builder.males', 'الذكور')}</option>
                <option value="female">{t('family_builder.females', 'الإناث')}</option>
                <option value="alive">{t('family_builder.alive', 'على قيد الحياة')}</option>
                <option value="deceased">{t('family_builder.deceased', 'متوفى')}</option>
              </select>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <FamilyMemberCard
                  key={member.id}
                  member={member}
                  familyMembers={familyMembers}
                  onEdit={handleEditMember}
                  onDelete={handleDeleteMember}
                  getAdditionalInfo={getAdditionalInfo}
                  getFullName={getFullName}
                  checkIfMemberIsSpouse={checkIfMemberIsSpouse}
                />
              ))}

              <AddMemberCard
                packageData={packageData}
                familyMembersCount={familyMembers.length}
                onAddMember={handleAddNewMember}
              />
            </div>
          </TabsContent>

          {/* Tree View Tab */}
          <TabsContent value="tree-view" className="space-y-8">
            <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
                <CardTitle className="text-center text-2xl text-foreground">
                  {t('family_builder.family_tree', 'شجرة العائلة')}
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  {t('family_builder.interactive_view', 'عرض تفاعلي لشجرة العائلة')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TreePine className="h-16 w-16 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {t('family_builder.tree_under_development', 'عرض الشجرة قيد التطوير')}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {t('family_builder.coming_soon', 'سيتم إضافة عرض تفاعلي للشجرة قريباً')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    {t('family_builder.generation_stats', 'إحصائيات الأجيال')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generationStats.map(([generation, count]) => (
                      <div key={generation} className="flex justify-between items-center">
                        <span>
                          {t('family_builder.generation', 'الجيل')} {generation === 1 ? 'الأول' : generation === 2 ? 'الثاني' : generation === 3 ? 'الثالث' : `الـ${generation}`}
                        </span>
                        <Badge className="bg-primary/20 text-primary">{count} أفراد</Badge>
                      </div>
                    ))}
                    {generationStats.length === 0 && (
                      <div className="text-center text-muted-foreground">
                        {t('family_builder.no_generation_data', 'لا توجد بيانات أجيال')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {t('family_builder.gender_distribution', 'توزيع الجنس')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>{t('family_builder.males', 'الذكور')}</span>
                      <Badge className="bg-blue-500/20 text-blue-700">
                        {familyMembers.filter(m => m.gender === 'male').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{t('family_builder.females', 'الإناث')}</span>
                      <Badge className="bg-pink-500/20 text-pink-700">
                        {familyMembers.filter(m => m.gender === 'female').length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ModernFamilyMemberModal
        isOpen={showAddMember}
        onClose={() => {
          setShowAddMember(false);
          setSelectedMember(null);
        }}
        onSubmit={handleModernModalSubmit}
        familyId={familyId || ''}
        editingMember={selectedMember}
      />

      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('family_builder.confirm_delete', 'تأكيد الحذف')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteWarningMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('family_builder.cancel', 'إلغاء')}</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} className="bg-destructive">
              {t('family_builder.delete', 'حذف')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GlobalFooter />
    </div>
  );
};

export default FamilyBuilder;