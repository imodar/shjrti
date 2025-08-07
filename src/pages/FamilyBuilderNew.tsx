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
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop, Star, Sparkles, Image, Store, MoreVertical, Menu } from "lucide-react";
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

  const refreshFamilyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      console.log('Refreshing family data...');

      const familyId = new URLSearchParams(window.location.search).get('family');
      if (!familyId) throw new Error('Family ID not found in URL');

      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (familyError) throw familyError;
      setFamilyData(family);

      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', family.id);

      if (membersError) throw membersError;

      const transformedMembers = members.map(member => ({
        id: member.id,
        name: member.name,
        fatherId: member.father_id,
        motherId: member.mother_id,
        spouseId: member.spouse_id,
        relatedPersonId: member.related_person_id,
        isFounder: member.is_founder,
        gender: member.gender,
        birthDate: member.birth_date || "",
        isAlive: member.is_alive,
        deathDate: member.death_date || null,
        image: member.image_url || null,
        bio: member.biography || "",
        relation: ""
      }));

      setFamilyMembers(transformedMembers);

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

      if (marriages) {
        setFamilyMarriages(marriages);
      }

      console.log('Family data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing family data:', error);
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
  
  // Delete modal states (keep existing delete modal functionality)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [deleteModalType, setDeleteModalType] = useState<'spouse' | 'bloodMember'>('spouse');
  const [deleteWarningMessage, setDeleteWarningMessage] = useState("");

  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
      (selectedFilter === "alive" && member.isAlive) ||
      (selectedFilter === "deceased" && !member.isAlive) ||
      (selectedFilter === "male" && member.gender === "male") ||
      (selectedFilter === "female" && member.gender === "female") ||
      (selectedFilter === "founders" && member.isFounder);
    
    return matchesSearch && matchesFilter;
  });

  // Form panel actions
  const handleAddMember = () => {
    setFormMode('add');
    setEditingMember(null);
    setCurrentStep(1);
    resetFormData();
    if (isMobile) setIsMemberListOpen(false);
  };

  const handleEditMember = (member: any) => {
    setFormMode('edit');
    setEditingMember(member);
    setCurrentStep(1);
    populateFormData(member);
    if (isMobile) setIsMemberListOpen(false);
  };

  const handleCancelForm = () => {
    setFormMode('view');
    setEditingMember(null);
    setCurrentStep(1);
    resetFormData();
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      relation: "",
      relatedPersonId: null,
      gender: "male",
      birthDate: null,
      isAlive: true,
      deathDate: null,
      bio: "",
      imageUrl: "",
      croppedImage: null,
      isFounder: false
    });
    setWives([]);
    setHusband(null);
  };

  const populateFormData = (member: any) => {
    setFormData({
      name: member.name || "",
      relation: member.relation || "",
      relatedPersonId: member.relatedPersonId,
      gender: member.gender || "male",
      birthDate: member.birthDate ? new Date(member.birthDate) : null,
      isAlive: member.isAlive,
      deathDate: member.deathDate ? new Date(member.deathDate) : null,
      bio: member.bio || "",
      imageUrl: member.image || "",
      croppedImage: member.image || null,
      isFounder: member.isFounder || false
    });
    // TODO: Load existing spouses
  };

  const handleFormSubmit = async (submissionData: any) => {
    try {
      setIsSaving(true);
      
      // TODO: Implement form submission logic (same as original modal)
      
      await refreshFamilyData();
      setFormMode('view');
      resetFormData();
      
      toast({
        title: formMode === 'edit' ? "تم تحديث العضو" : "تم إضافة العضو",
        description: formMode === 'edit' ? "تم تحديث بيانات العضو بنجاح" : "تم إضافة العضو الجديد بنجاح",
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getAdditionalInfo = (member: any) => {
    const parts = [];
    if (member.birthDate) parts.push(`مولود: ${member.birthDate}`);
    if (!member.isAlive && member.deathDate) parts.push(`متوفى: ${member.deathDate}`);
    if (member.isFounder) parts.push("مؤسس العائلة");
    return parts.join(" • ");
  };

  const getFullName = (member: any) => {
    if (!member.relatedPersonId || !familyMembers.length) return member.name;
    const relatedPerson = familyMembers.find(m => m.id === member.relatedPersonId);
    if (!relatedPerson) return member.name;
    return `${member.name} (${member.relation} ${relatedPerson.name})`;
  };

  const getGenderColor = (gender: string) => {
    return gender === "female" ? "text-pink-600" : "text-blue-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <GlobalHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading', 'جاري التحميل...')}</p>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20" dir={direction}>
      <GlobalHeader />
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-primary/5 via-primary/10 to-transparent blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-secondary/5 via-secondary/10 to-transparent blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Enhanced Header Section with Glassmorphism */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-xl border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
          <div className="container mx-auto px-4 py-12 relative">
            {/* Floating Action Button for Back */}
            <div className="absolute top-6 left-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 hover:scale-110 border border-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center justify-between mb-12">
              <div className="animate-fade-in">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent mb-4">
                  {familyData?.name ? `شجرة ${familyData.name}` : t('family_builder.title', 'بناء شجرة العائلة')}
                </h1>
                <p className="text-lg text-white/70 font-light">
                  {t('family_builder.subtitle', 'أضف وأدر أفراد عائلتك بسهولة')}
                </p>
              </div>
              
              {hasAIFeatures && (
                <div className="flex gap-3 animate-fade-in" style={{animationDelay: '0.2s'}}>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative">
                      <SmartSearchBar familyId={familyId} />
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative">
                      <SuggestionPanel familyId={familyId} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Redesigned Stats Cards with 3D Effect */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                {
                  icon: Users,
                  value: familyMembers.length,
                  label: "إجمالي الأعضاء",
                  gradient: "from-blue-500 via-blue-600 to-blue-700",
                  glowColor: "blue-500/30",
                  delay: "0s"
                },
                {
                  icon: TreePine,
                  value: calculateGenerationCount(),
                  label: "الأجيال",
                  gradient: "from-emerald-500 via-emerald-600 to-emerald-700",
                  glowColor: "emerald-500/30",
                  delay: "0.1s"
                },
                {
                  icon: Heart,
                  value: familyMarriages.length,
                  label: "الزيجات",
                  gradient: "from-pink-500 via-pink-600 to-pink-700",
                  glowColor: "pink-500/30",
                  delay: "0.2s"
                },
                {
                  icon: Crown,
                  value: familyMembers.filter(m => m.isFounder).length,
                  label: "المؤسسون",
                  gradient: "from-amber-500 via-amber-600 to-amber-700",
                  glowColor: "amber-500/30",
                  delay: "0.3s"
                }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="relative group animate-fade-in hover-scale"
                  style={{animationDelay: stat.delay}}
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500 scale-110`}></div>
                  
                  {/* Card */}
                  <Card className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:shadow-2xl hover:-translate-y-2">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                          <p className="text-sm text-white/70 font-medium">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Main Content with Modern Layout */}
        <div className="container mx-auto px-4 py-12">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Floating Tab Navigation */}
            <div className="flex justify-center mb-12">
              <TabsList className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-3 px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium">نظرة عامة</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="tree" 
                  className="flex items-center gap-3 px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <TreePine className="h-5 w-5" />
                  <span className="font-medium">الشجرة</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="statistics" 
                  className="flex items-center gap-3 px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <Star className="h-5 w-5" />
                  <span className="font-medium">الإحصائيات</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <div className={cn(
                "grid gap-8",
                isMobile ? "grid-cols-1" : "grid-cols-12"
              )}>
                {/* Enhanced Form Panel */}
                <div className={cn(
                  "space-y-6 animate-fade-in",
                  isMobile ? "order-2" : "col-span-8 order-1"
                )}>
                  <Card className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20"></div>
                      <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                      <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
                    </div>
                    
                    <CardHeader className="pb-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-white">
                          {formMode === 'view' && <User className="h-6 w-6 text-blue-400" />}
                          {formMode === 'add' && <UserPlus className="h-6 w-6 text-emerald-400" />}
                          {formMode === 'edit' && <Edit className="h-6 w-6 text-amber-400" />}
                          <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                            {formMode === 'view' && "معلومات العضو"}
                            {formMode === 'add' && "إضافة عضو جديد"}
                            {formMode === 'edit' && "تعديل العضو"}
                          </span>
                        </CardTitle>
                        {formMode === 'view' && (
                          <Button 
                            onClick={handleAddMember} 
                            className="relative group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-2">
                              <Plus className="h-5 w-5" />
                              <span className="font-medium">إضافة عضو</span>
                            </div>
                          </Button>
                        )}
                        {formMode !== 'view' && (
                          <Button 
                            variant="outline" 
                            onClick={handleCancelForm}
                            className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-xl px-6 py-3 transition-all duration-300"
                          >
                            إلغاء
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="relative z-10">
                      {formMode === 'view' ? (
                        <div className="text-center py-20">
                          <div className="relative inline-block">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                            <User className="relative h-16 w-16 mx-auto mb-6 text-white/50" />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-3">اختر عضواً من القائمة</h3>
                          <p className="text-white/60 mb-6">لعرض أو تعديل بياناته</p>
                          <p className="text-sm text-white/40">أو اضغط "إضافة عضو" لإضافة عضو جديد</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {/* Enhanced Step Indicator */}
                          <div className="flex items-center justify-center mb-8">
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                              {[1, 2, 3].map((step, index) => (
                                <div key={step} className="flex items-center">
                                  <div
                                    className={cn(
                                      "flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold transition-all duration-300 relative",
                                      currentStep >= step
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-110"
                                        : "bg-white/10 text-white/50 border border-white/20"
                                    )}
                                  >
                                    {currentStep > step ? (
                                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                      </div>
                                    ) : (
                                      step
                                    )}
                                    {currentStep >= step && (
                                      <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur animate-pulse"></div>
                                    )}
                                  </div>
                                  {index < 2 && (
                                    <div 
                                      className={cn(
                                        "w-16 h-1 mx-2 rounded-full transition-all duration-500",
                                        currentStep > step + 1 
                                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600" 
                                          : "bg-white/20"
                                      )}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Enhanced Form Steps */}
                          <div className="min-h-[400px]">
                            {currentStep === 1 && (
                              <div className="space-y-6 animate-fade-in">
                                <div className="text-center mb-8">
                                  <h3 className="text-2xl font-bold text-white mb-2">المعلومات الأساسية</h3>
                                  <p className="text-white/60">أدخل البيانات الأساسية للعضو</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-3">
                                    <Label htmlFor="name" className="text-white font-medium flex items-center gap-2">
                                      <User className="h-4 w-4 text-blue-400" />
                                      الاسم الكامل *
                                    </Label>
                                    <Input
                                      id="name"
                                      value={formData.name}
                                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                                      placeholder="أدخل الاسم الكامل"
                                      className="bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 rounded-xl h-12 focus:bg-white/15 focus:border-white/40 transition-all duration-300"
                                    />
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <Label htmlFor="gender" className="text-white font-medium flex items-center gap-2">
                                      <Crown className="h-4 w-4 text-purple-400" />
                                      الجنس
                                    </Label>
                                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                                      <SelectTrigger className="bg-white/10 backdrop-blur-md border-white/20 text-white rounded-xl h-12 hover:bg-white/15 transition-all duration-300">
                                        <SelectValue placeholder="اختر الجنس" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-gray-900/95 backdrop-blur-xl border-white/20 rounded-xl">
                                        <SelectItem value="male" className="text-white hover:bg-white/10">ذكر</SelectItem>
                                        <SelectItem value="female" className="text-white hover:bg-white/10">أنثى</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-3">
                                    <Label className="text-white font-medium flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-emerald-400" />
                                      تاريخ الميلاد
                                    </Label>
                                    <div className="relative">
                                      <EnhancedDatePicker
                                        value={formData.birthDate}
                                        onChange={(date) => setFormData({...formData, birthDate: date})}
                                        placeholder="اختر تاريخ الميلاد"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <Label className="text-white font-medium flex items-center gap-2">
                                      <Heart className="h-4 w-4 text-pink-400" />
                                      الحالة
                                    </Label>
                                    <div className="flex items-center space-x-3 rtl:space-x-reverse bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                                      <input
                                        type="checkbox"
                                        id="isAlive"
                                        checked={formData.isAlive}
                                        onChange={(e) => setFormData({...formData, isAlive: e.target.checked})}
                                        className="w-5 h-5 rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-500 focus:ring-2 transition-all duration-300"
                                      />
                                      <Label htmlFor="isAlive" className="text-white font-medium cursor-pointer">على قيد الحياة</Label>
                                    </div>
                                  </div>
                                </div>

                                {!formData.isAlive && (
                                  <div className="animate-fade-in">
                                    <Label className="text-white font-medium flex items-center gap-2">
                                      <Skull className="h-4 w-4 text-gray-400" />
                                      تاريخ الوفاة
                                    </Label>
                                    <div className="mt-3">
                                      <EnhancedDatePicker
                                        value={formData.deathDate}
                                        onChange={(date) => setFormData({...formData, deathDate: date})}
                                        placeholder="اختر تاريخ الوفاة"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <Label htmlFor="bio" className="text-white font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-amber-400" />
                                    السيرة الذاتية
                                  </Label>
                                  <Textarea
                                    id="bio"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    placeholder="أدخل معلومات إضافية عن العضو..."
                                    rows={4}
                                    className="bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 rounded-xl focus:bg-white/15 focus:border-white/40 transition-all duration-300 resize-none"
                                  />
                                </div>
                              </div>
                            )}

                            {currentStep === 2 && (
                              <div className="space-y-6 animate-fade-in">
                                <div className="text-center mb-8">
                                  <h3 className="text-2xl font-bold text-white mb-2">العلاقات العائلية</h3>
                                  <p className="text-white/60">أضف معلومات الزواج والعلاقات العائلية</p>
                                </div>
                                <div className="text-center py-16 text-white/60">
                                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <p>سيتم تطوير إدارة العلاقات قريباً</p>
                                </div>
                              </div>
                            )}

                            {currentStep === 3 && (
                              <div className="space-y-6 animate-fade-in">
                                <div className="text-center mb-8">
                                  <h3 className="text-2xl font-bold text-white mb-2">الصورة والمعلومات الإضافية</h3>
                                  <p className="text-white/60">أضف صورة شخصية ومعلومات إضافية</p>
                                </div>
                                <div className="text-center py-16 text-white/60">
                                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <p>سيتم تطوير رفع الصور قريباً</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Enhanced Navigation Buttons */}
                          <div className="flex justify-between pt-8 border-t border-white/10">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={prevStep}
                              disabled={currentStep === 1}
                              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105"
                            >
                              <ArrowLeft className="h-4 w-4 ml-2" />
                              السابق
                            </Button>
                            
                            {currentStep < 3 ? (
                              <Button
                                type="button"
                                onClick={nextStep}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                              >
                                <span className="mr-2">التالي</span>
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                onClick={() => handleFormSubmit(formData)}
                                disabled={isSaving}
                                className="relative group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                                <div className="relative flex items-center gap-2">
                                  {isSaving ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                      <span>جاري الحفظ...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4" />
                                      <span className="font-medium">حفظ</span>
                                    </>
                                  )}
                                </div>
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Member List Panel */}
                <div className={cn(
                  "space-y-6 animate-fade-in",
                  isMobile ? "order-1" : "col-span-4 order-2"
                )} style={{animationDelay: '0.1s'}}>
                  {isMobile ? (
                    <Drawer open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
                      <DrawerTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-xl py-4 transition-all duration-300 hover:scale-105"
                        >
                          <Menu className="h-5 w-5 ml-2" />
                          <span className="font-medium">عرض قائمة الأعضاء ({familyMembers.length})</span>
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="h-[85vh] bg-gray-900/95 backdrop-blur-xl border-white/20">
                        <div className="p-6">
                          <MemberList 
                            members={filteredMembers}
                            onEditMember={handleEditMember}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            selectedFilter={selectedFilter}
                            onFilterChange={setSelectedFilter}
                            getAdditionalInfo={getAdditionalInfo}
                            getGenderColor={getGenderColor}
                          />
                        </div>
                      </DrawerContent>
                    </Drawer>
                  ) : (
                    <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                      <CardHeader className="pb-4 bg-gradient-to-r from-white/5 to-transparent">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-white">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                            أعضاء العائلة ({familyMembers.length})
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <MemberList 
                          members={filteredMembers}
                          onEditMember={handleEditMember}
                          searchTerm={searchTerm}
                          onSearchChange={setSearchTerm}
                          selectedFilter={selectedFilter}
                          onFilterChange={setSelectedFilter}
                          getAdditionalInfo={getAdditionalInfo}
                          getGenderColor={getGenderColor}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tree">
              <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
                <CardContent className="p-12">
                  <div className="text-center text-white/60">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                      <TreePine className="relative h-16 w-16 mx-auto text-white/50" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">عرض الشجرة</h3>
                    <p className="text-lg">سيتم تطويره قريباً مع تصورات تفاعلية مذهلة</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics">
              <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
                <CardContent className="p-12">
                  <div className="text-center text-white/60">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                      <Star className="relative h-16 w-16 mx-auto text-white/50" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">الإحصائيات المفصلة</h3>
                    <p className="text-lg">ستتوفر قريباً مع رسوم بيانية تفاعلية</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Keep existing delete modals */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteWarningMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // TODO: Implement delete logic
                setShowDeleteModal(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GlobalFooter />
    </div>
  );
};

// Enhanced Member List Component
const MemberList = ({ 
  members, 
  onEditMember, 
  searchTerm, 
  onSearchChange, 
  selectedFilter, 
  onFilterChange,
  getAdditionalInfo,
  getGenderColor 
}: any) => {
  return (
    <div className="space-y-6">
      {/* Enhanced Search */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
          <Input
            placeholder="ابحث عن عضو..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 rounded-xl h-12 focus:bg-white/15 focus:border-white/40 transition-all duration-300"
          />
        </div>
      </div>

      {/* Enhanced Filter */}
      <Select value={selectedFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="bg-white/10 backdrop-blur-md border-white/20 text-white rounded-xl h-12 hover:bg-white/15 transition-all duration-300">
          <SelectValue placeholder="تصفية حسب..." />
        </SelectTrigger>
        <SelectContent className="bg-gray-900/95 backdrop-blur-xl border-white/20 rounded-xl">
          <SelectItem value="all" className="text-white hover:bg-white/10">جميع الأعضاء</SelectItem>
          <SelectItem value="alive" className="text-white hover:bg-white/10">الأحياء</SelectItem>
          <SelectItem value="deceased" className="text-white hover:bg-white/10">المتوفين</SelectItem>
          <SelectItem value="male" className="text-white hover:bg-white/10">الذكور</SelectItem>
          <SelectItem value="female" className="text-white hover:bg-white/10">الإناث</SelectItem>
          <SelectItem value="founders" className="text-white hover:bg-white/10">المؤسسون</SelectItem>
        </SelectContent>
      </Select>

      {/* Enhanced Member List */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {members.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <Users className="relative h-12 w-12 mx-auto text-white/50" />
            </div>
            <p className="text-white/60 text-lg">لا توجد أعضاء</p>
            <p className="text-white/40 text-sm mt-2">ابدأ بإضافة أول عضو في العائلة</p>
          </div>
        ) : (
          members.map((member: any, index: number) => (
            <div
              key={member.id}
              className="animate-fade-in hover-scale"
              style={{animationDelay: `${index * 0.05}s`}}
            >
              <Card 
                className="cursor-pointer bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:shadow-white/5 group"
                onClick={() => onEditMember(member)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white/20 group-hover:border-white/40 transition-all duration-300">
                        <AvatarImage src={member.image} />
                        <AvatarFallback className={cn("font-bold text-lg", getGenderColor(member.gender))}>
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {member.isFounder && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                          <Crown className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-lg truncate group-hover:text-blue-200 transition-colors duration-300">
                        {member.name}
                      </p>
                      {getAdditionalInfo(member) && (
                        <p className="text-xs text-white/60 truncate mt-1">
                          {getAdditionalInfo(member)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!member.isAlive && (
                        <div className="p-1 bg-gray-500/20 rounded-full">
                          <Skull className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <Edit className="h-4 w-4 text-white/40 group-hover:text-white/80 transition-colors duration-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FamilyBuilderNew;
