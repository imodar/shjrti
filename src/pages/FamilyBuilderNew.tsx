import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop, Star, Sparkles, Image, Store, MoreVertical, Menu, TreeDeciduous, Activity, Target, Award, Zap, Home, Palette, Compass, Gift, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";
import { useIsMobile } from "@/hooks/use-mobile";
import WifeForm from "@/components/WifeForm";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

const FamilyBuilderNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasAIFeatures } = useSubscription();
  const isMobile = useIsMobile();

  const calculateGenerationCount = () => {
    if (familyMembers.length === 0) return 1;
    
    const generationMap = new Map();
    
    familyMembers.forEach(member => {
      if (member.isFounder || (!member.fatherId && !member.motherId)) {
        generationMap.set(member.id, 1);
      }
    });
    
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

  const getGenerationStats = () => {
    if (familyMembers.length === 0) return [];
    
    const generationMap = new Map();
    
    familyMembers.forEach(member => {
      if (member.isFounder || (!member.fatherId && !member.motherId)) {
        generationMap.set(member.id, 1);
      }
    });
    
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
    
    familyMarriages.forEach(marriage => {
      const husbandGeneration = generationMap.get(marriage.husband?.id);
      const wifeGeneration = generationMap.get(marriage.wife?.id);
      
      if (husbandGeneration && !wifeGeneration) {
        generationMap.set(marriage.wife?.id, husbandGeneration);
      } else if (wifeGeneration && !husbandGeneration) {
        generationMap.set(marriage.husband?.id, wifeGeneration);
      }
    });
    
    const generationCounts = new Map();
    generationMap.forEach((generation) => {
      generationCounts.set(generation, (generationCounts.get(generation) || 0) + 1);
    });
    
    return Array.from(generationCounts.entries()).sort((a, b) => a[0] - b[0]);
  };

  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const { notifications, profile } = useDashboardData();
  
  // Package and subscription data
  const [packageData, setPackageData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const familyId = searchParams.get('family');
  const treeId = searchParams.get('treeId');
  const isNew = searchParams.get('new') === 'true';
  const isEditMode = searchParams.get('edit') === 'true';
  
  const [activeTab, setActiveTab] = useState("overview");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyMarriages, setFamilyMarriages] = useState([]);
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form panel states
  const [formMode, setFormMode] = useState<'view' | 'add' | 'edit'>('view');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Mobile drawer state
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);

  // Fetch family data function
  const fetchFamilyData = async () => {
    try {
      setLoading(true);
        
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Loading package data for user:', user.id);

      const { data: userSubscription, error: subError } = await supabase
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

      console.log('User subscription data:', userSubscription, 'Error:', subError);

      if (userSubscription && userSubscription.packages) {
        setPackageData(userSubscription.packages);
        setSubscriptionData(userSubscription);
      } else {
        console.log('No subscription found, using free package');
        const { data: freePackage } = await supabase
          .from('packages')
          .select('*')
          .ilike('name->en', 'Free')
          .single();
        console.log('Free package fallback:', freePackage);
        if (freePackage) setPackageData(freePackage);
      }
      
      if (!familyId) {
        throw new Error('No family ID provided');
      }

      console.log('🔍 Loading family with ID:', familyId);
      
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .eq('creator_id', user.id)
        .single();

      if (familyError) {
        console.error('Error fetching family:', familyError);
        throw familyError;
      }

      if (!family) {
        throw new Error('Family not found or access denied');
      }

      console.log('✅ Loaded family:', family);
      const familyToUse = family;
      setFamilyData(familyToUse);
      
      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', familyToUse.id);

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

      const { data: marriages, error: marriagesError } = await supabase
        .from('marriages')
        .select(`
          id,
          husband:family_tree_members!marriages_husband_id_fkey(id, name),
          wife:family_tree_members!marriages_wife_id_fkey(id, name),
          is_active
        `)
        .eq('family_id', familyToUse.id)
        .eq('is_active', true);

      if (marriagesError) throw marriagesError;

      if (marriages) {
        setFamilyMarriages(marriages);
        console.log('Fetched marriages:', marriages);
      }
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
  }, [toast]);
  
  // Search and filter states
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Form data states
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    relatedPersonId: null as string | null,
    gender: "male",
    birthDate: null as Date | null,
    isAlive: true,
    deathDate: null as Date | null,
    bio: "",
    imageUrl: "",
    croppedImage: null as string | null,
    isFounder: false
  });

  const [wives, setWives] = useState<Array<{
    id: string;
    name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
    maritalStatus?: string;
    croppedImage?: string | null;
    isFamilyMember?: boolean;
    existingFamilyMemberId?: string;
    isExistingFamilyMember?: boolean;
  }>>([]);

  const [husband, setHusband] = useState<{
    id: string;
    name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
    croppedImage?: string | null;
    isFamilyMember?: boolean;
    existingFamilyMemberId?: string;
    isExistingFamilyMember?: boolean;
  } | null>(null);

  // Image cropping states
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [deleteModalType, setDeleteModalType] = useState<'spouse' | 'bloodMember'>('spouse');
  const [deleteWarningMessage, setDeleteWarningMessage] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/30">
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative">
            <TreeDeciduous className="w-16 h-16 text-primary animate-pulse" />
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-accent animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-secondary/20">
      <GlobalHeader />
      
      {/* Hero Header with Gradient Background and Floating Icons */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/30 to-secondary/20" />
        <div className="absolute inset-0">
          <TreeDeciduous className="absolute top-4 left-8 w-8 h-8 text-primary/30 animate-float" />
          <Heart className="absolute top-8 right-16 w-6 h-6 text-accent/40 animate-float-delayed" />
          <Crown className="absolute bottom-6 left-16 w-7 h-7 text-secondary/50 animate-float-slow" />
          <Star className="absolute top-12 left-1/3 w-5 h-5 text-primary/40 animate-spin-slow" />
          <Sparkles className="absolute bottom-8 right-8 w-6 h-6 text-accent/50 animate-pulse" />
        </div>
        
        <div className="relative px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('dashboard.title', 'لوحة التحكم')}
              </Button>
            </div>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent p-4 shadow-lg">
                  <TreeDeciduous className="w-full h-full text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-md">
                  <Crown className="w-4 h-4 text-primary" />
                </div>
              </div>
              
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-2">
                  {familyData?.name || t('family_builder.title', 'بناء شجرة العائلة')}
                </h1>
                <p className="text-muted-foreground text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('family_builder.subtitle', 'إدارة وتطوير شجرة عائلتك')}
                </p>
              </div>
            </div>

            {/* Creative Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="absolute top-2 right-2">
                  <Users className="w-6 h-6 text-primary/30" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{familyMembers.length}</p>
                      <p className="text-sm text-muted-foreground">{t('family_builder.total_members', 'إجمالي الأعضاء')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:shadow-lg transition-all duration-300">
                <div className="absolute top-2 right-2">
                  <Activity className="w-6 h-6 text-accent/30" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-accent">{calculateGenerationCount()}</p>
                      <p className="text-sm text-muted-foreground">{t('family_builder.generations', 'الأجيال')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:shadow-lg transition-all duration-300">
                <div className="absolute top-2 right-2">
                  <Heart className="w-6 h-6 text-secondary/30" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">{familyMarriages.length}</p>
                      <p className="text-sm text-muted-foreground">{t('family_builder.marriages', 'الزيجات')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="absolute top-2 right-2">
                  <Award className="w-6 h-6 text-primary/30" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {familyMembers.filter(m => m.isFounder).length}
                      </p>
                      <p className="text-sm text-muted-foreground">{t('family_builder.founders', 'المؤسسون')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Creative Tabs */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-card/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Compass className="w-4 h-4" />
              {t('family_builder.overview', 'نظرة عامة')}
            </TabsTrigger>
            <TabsTrigger 
              value="members" 
              className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Users className="w-4 h-4" />
              {t('family_builder.members', 'الأعضاء')}
            </TabsTrigger>
            <TabsTrigger 
              value="builder" 
              className="flex items-center gap-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            >
              <UserPlus className="w-4 h-4" />
              {t('family_builder.add_member', 'إضافة عضو')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Family Tree Preview Card */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-card via-accent/5 to-secondary/5 border-accent/20">
                <div className="absolute top-4 right-4">
                  <TreeDeciduous className="w-8 h-8 text-accent/30 animate-pulse" />
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-primary">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <TreeDeciduous className="w-5 h-5 text-primary" />
                    </div>
                    {t('family_builder.tree_preview', 'معاينة الشجرة')}
                  </CardTitle>
                  <CardDescription>
                    {t('family_builder.tree_preview_desc', 'شاهد كيف تبدو شجرة عائلتك')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 text-center">
                    <TreeDeciduous className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t('family_builder.tree_coming_soon', 'معاينة الشجرة قريباً')}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/family-tree-view?family=${familyId}`)}
                      className="border-primary/30 hover:bg-primary/10"
                    >
                      <TreeDeciduous className="w-4 h-4 mr-2" />
                      {t('family_builder.view_tree', 'عرض الشجرة')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card className="bg-gradient-to-br from-card via-primary/5 to-accent/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-accent">
                    <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-accent" />
                    </div>
                    {t('family_builder.quick_actions', 'إجراءات سريعة')}
                  </CardTitle>
                  <CardDescription>
                    {t('family_builder.quick_actions_desc', 'الأدوات الأكثر استخداماً')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => setActiveTab("builder")}
                    className="w-full justify-start bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('family_builder.add_member', 'إضافة عضو جديد')}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("members")}
                    className="w-full justify-start border-accent/30 hover:bg-accent/10"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {t('family_builder.manage_members', 'إدارة الأعضاء')}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/family-tree-view?family=${familyId}`)}
                    className="w-full justify-start border-secondary/30 hover:bg-secondary/10"
                  >
                    <TreeDeciduous className="w-4 h-4 mr-2" />
                    {t('family_builder.view_tree', 'عرض الشجرة')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Generation Stats */}
            {getGenerationStats().length > 0 && (
              <Card className="bg-gradient-to-r from-card via-secondary/10 to-primary/5 border-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-secondary">
                    <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-secondary" />
                    </div>
                    {t('family_builder.generation_stats', 'إحصائيات الأجيال')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {getGenerationStats().map(([generation, count]) => (
                      <div 
                        key={generation} 
                        className="bg-gradient-to-br from-secondary/10 to-accent/5 rounded-lg p-4 text-center border border-secondary/20"
                      >
                        <p className="text-2xl font-bold text-secondary">{count}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('family_builder.generation', 'الجيل')} {generation}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <Card className="bg-gradient-to-br from-card via-accent/5 to-primary/5 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  {t('family_builder.family_members', 'أفراد العائلة')}
                </CardTitle>
                <CardDescription>
                  {t('family_builder.manage_desc', 'إدارة وتعديل معلومات أفراد العائلة')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('family_builder.search_members', 'البحث في الأعضاء...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-accent/30 focus:border-accent"
                    />
                  </div>
                  
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-accent/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {t('family_builder.all_members', 'جميع الأعضاء')}
                        </div>
                      </SelectItem>
                      <SelectItem value="alive">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-green-500" />
                          {t('family_builder.alive', 'الأحياء')}
                        </div>
                      </SelectItem>
                      <SelectItem value="deceased">
                        <div className="flex items-center gap-2">
                          <Skull className="w-4 h-4 text-gray-500" />
                          {t('family_builder.deceased', 'المتوفون')}
                        </div>
                      </SelectItem>
                      <SelectItem value="male">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          {t('family_builder.male', 'ذكور')}
                        </div>
                      </SelectItem>
                      <SelectItem value="female">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-pink-500" />
                          {t('family_builder.female', 'إناث')}
                        </div>
                      </SelectItem>
                      <SelectItem value="founders">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-accent" />
                          {t('family_builder.founders', 'المؤسسون')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Add Member Card */}
                  <Card 
                    className="border-2 border-dashed border-primary/30 hover:border-primary/50 cursor-pointer transition-all duration-300 bg-gradient-to-br from-primary/5 to-accent/5"
                    onClick={() => setActiveTab("builder")}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-medium text-primary">
                        {t('family_builder.add_new_member', 'إضافة عضو جديد')}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('family_builder.expand_family', 'توسيع شجرة العائلة')}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Member Cards */}
                  {familyMembers.filter(member => {
                    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesFilter = selectedFilter === "all" || 
                      (selectedFilter === "alive" && member.isAlive) ||
                      (selectedFilter === "deceased" && !member.isAlive) ||
                      (selectedFilter === "male" && member.gender === "male") ||
                      (selectedFilter === "female" && member.gender === "female") ||
                      (selectedFilter === "founders" && member.isFounder);
                    
                    return matchesSearch && matchesFilter;
                  }).map((member) => (
                    <Card 
                      key={member.id} 
                      className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-accent/5 border-accent/20"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative">
                            <Avatar className="w-12 h-12 border-2 border-accent/30">
                              <AvatarImage src={member.image} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                              member.isAlive ? "bg-green-500" : "bg-gray-400"
                            )} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                              {member.name}
                              {member.isFounder && <Crown className="w-4 h-4 text-accent" />}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              {member.gender === 'male' ? (
                                <User className="w-3 h-3 text-blue-500" />
                              ) : (
                                <User className="w-3 h-3 text-pink-500" />
                              )}
                              {member.gender === 'male' ? t('family_builder.male', 'ذكر') : t('family_builder.female', 'أنثى')}
                            </p>
                          </div>
                        </div>
                        
                        {member.birthDate && (
                          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(member.birthDate), 'yyyy')}
                            {!member.isAlive && member.deathDate && (
                              <span> - {format(new Date(member.deathDate), 'yyyy')}</span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 border-accent/30 hover:bg-accent/10"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            {t('family_builder.edit', 'تعديل')}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-destructive/30 hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <Card className="bg-gradient-to-br from-card via-secondary/5 to-primary/5 border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-secondary">
                  <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-secondary" />
                  </div>
                  {t('family_builder.add_new_member', 'إضافة عضو جديد')}
                </CardTitle>
                <CardDescription>
                  {t('family_builder.add_member_desc', 'أضف عضواً جديداً إلى شجرة العائلة')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl p-8 text-center">
                  <UserPlus className="w-24 h-24 text-secondary mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-secondary mb-2">
                    {t('family_builder.member_form_title', 'نموذج إضافة عضو')}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t('family_builder.member_form_desc', 'قم بملء المعلومات المطلوبة لإضافة عضو جديد')}
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('family_builder.start_adding', 'بدء الإضافة')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <GlobalFooter />
    </div>
  );
};

export default FamilyBuilderNew;
