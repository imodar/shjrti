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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
        </div>

        {/* Floating Animated Icons */}
        <div className="absolute top-32 right-20 animate-float">
          <Heart className="h-10 w-10 text-pink-400 opacity-60" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float-delayed">
          <Users className="h-12 w-12 text-emerald-400 opacity-40" />
        </div>
        <div className="absolute top-1/2 left-10 animate-float-slow">
          <Star className="h-8 w-8 text-yellow-400 opacity-60" />
        </div>
        
        <GlobalHeader />
        <div className="flex items-center justify-center min-h-[80vh] relative z-10">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
              <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
            </div>
            <p className="text-lg font-medium bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
              {t('common.loading', 'جاري التحميل...')}
            </p>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir={direction}>
      <GlobalHeader />
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      {/* Floating Animated Icons */}
      <div className="absolute top-32 right-20 animate-float">
        <Heart className="h-10 w-10 text-pink-400 opacity-60" />
      </div>
      <div className="absolute bottom-40 left-20 animate-float-delayed">
        <Users className="h-12 w-12 text-emerald-400 opacity-40" />
      </div>
      <div className="absolute top-1/2 left-10 animate-float-slow">
        <Star className="h-8 w-8 text-yellow-400 opacity-60" />
      </div>
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-primary/5 via-primary/10 to-transparent blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-secondary/5 via-secondary/10 to-transparent blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header Box from FamilyBuilder */}
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <div className="mb-8">
            <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-4 sm:px-6 shadow-2xl ring-1 ring-white/20 dark:ring-gray-500/20">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
                {/* Right Side: Icon + Title + Description */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xl border-2 border-white/30 dark:border-gray-700/30">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
                    </div>
                    {/* Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        {t('family_builder.family', 'عائلة')} {familyData?.name || t('family_builder.unspecified', 'غير محدد')}
                      </span>
                    </h1>
                  </div>
                </div>

                {/* Sample Statistics Section - Responsive */}
                <div className="flex justify-center items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-2 lg:pb-0">
                  {/* Members Available */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-center">
                      <div className="text-sm sm:text-base lg:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {familyMembers.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('family_builder.members_count', 'أعضاء')}</div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="w-px h-6 sm:h-8 bg-white/20 dark:bg-gray-600/20"></div>

                  {/* Number of Generations */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                    <div className="text-center">
                      <div className="text-sm sm:text-base lg:text-lg font-bold text-amber-600 dark:text-amber-400">
                        {calculateGenerationCount()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('family_builder.generations', 'أجيال')}</div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="w-px h-6 sm:h-8 bg-white/20 dark:bg-gray-600/20"></div>

                  {/* Last Modified Date */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400" />
                    <div className="text-center">
                      <div className="text-sm sm:text-base lg:text-lg font-bold text-teal-600 dark:text-teal-400">
                        {familyData?.updated_at 
                          ? format(new Date(familyData.updated_at), 'd MMM', { locale: ar })
                          : t('family_builder.today', 'اليوم')
                        }
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t('family_builder.last_modified', 'آخر تعديل')}</div>
                    </div>
                  </div>
                </div>

                {/* Navigation Icons */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white shadow-lg flex items-center justify-center group-hover:scale-105 transition-all">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.overview', 'نظرة عامة')}</span>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => navigate(`/family-tree-view?family=${familyId}`)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
                      <TreePine className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.tree_diagram', 'مخطط الشجرة')}</span>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => navigate('/store')}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
                      <Store className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.store', 'المتجر')}</span>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => navigate(`/family-statistics?family=${familyId}`)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
                      <Star className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">{t('family_builder.statistics', 'الإحصائات')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    {familyData?.name ? `شجرة ${familyData.name}` : t('family_builder.title', 'بناء شجرة العائلة')}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {t('family_builder.subtitle', 'أضف وأدر أفراد عائلتك بسهولة')}
                  </p>
                </div>
              </div>
              
              {hasAIFeatures && (
                <div className="flex gap-2">
                  <SmartSearchBar familyId={familyId} />
                  <SuggestionPanel familyId={familyId} />
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10 hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-lg"></div>
                <CardContent className="relative p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-lg opacity-20 animate-pulse"></div>
                      <div className="relative p-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-200/20 dark:border-emerald-700/20">
                        <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{familyMembers.length}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الأعضاء</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10 hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-amber-500/5 rounded-lg"></div>
                <CardContent className="relative p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-amber-500 rounded-lg blur-lg opacity-20 animate-pulse"></div>
                      <div className="relative p-2 bg-gradient-to-r from-teal-500/10 to-amber-500/10 rounded-lg border border-teal-200/20 dark:border-teal-700/20">
                        <TreePine className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent">{calculateGenerationCount()}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">الأجيال</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10 hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5 rounded-lg"></div>
                <CardContent className="relative p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg blur-lg opacity-20 animate-pulse"></div>
                      <div className="relative p-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-lg border border-pink-200/20 dark:border-pink-700/20">
                        <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{familyMarriages.length}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">الزيجات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10 hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-lg"></div>
                <CardContent className="relative p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg blur-lg opacity-20 animate-pulse"></div>
                      <div className="relative p-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-lg border border-purple-200/20 dark:border-purple-700/20">
                        <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                        {familyMembers.filter(m => m.isFounder).length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">المؤسسون</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="tree" className="flex items-center gap-2">
                <TreePine className="h-4 w-4" />
                الشجرة
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                الإحصائيات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className={cn(
                "grid gap-6",
                isMobile ? "grid-cols-1" : "grid-cols-12"
              )}>
                {/* Form Panel - Left Side on Desktop */}
                <div className={cn(
                  "space-y-6",
                  isMobile ? "order-2" : "col-span-8 order-1"
                )}>
                  <Card className="h-fit relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-lg"></div>
                    <CardHeader className="pb-4 relative">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {formMode === 'view' && <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                          {formMode === 'add' && <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                          {formMode === 'edit' && <Edit className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            {formMode === 'view' && "معلومات العضو"}
                            {formMode === 'add' && "إضافة عضو جديد"}
                            {formMode === 'edit' && "تعديل العضو"}
                          </span>
                        </CardTitle>
                        {formMode === 'view' && (
                          <Button onClick={handleAddMember} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            إضافة عضو
                          </Button>
                        )}
                        {formMode !== 'view' && (
                          <Button variant="outline" onClick={handleCancelForm}>
                            إلغاء
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      {formMode === 'view' ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>اختر عضواً من القائمة لعرض أو تعديل بياناته</p>
                          <p className="text-sm mt-2">أو اضغط "إضافة عضو" لإضافة عضو جديد</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Step Indicator */}
                          <div className="flex items-center justify-between mb-6">
                            {[1, 2, 3].map((step) => (
                              <div
                                key={step}
                                className={cn(
                                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                                  currentStep >= step
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {step}
                              </div>
                            ))}
                          </div>

                          {/* Step Content */}
                          {currentStep === 1 && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="name">الاسم الكامل *</Label>
                                  <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="أدخل الاسم الكامل"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="gender">الجنس</Label>
                                  <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر الجنس" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="male">ذكر</SelectItem>
                                      <SelectItem value="female">أنثى</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>تاريخ الميلاد</Label>
                                  <EnhancedDatePicker
                                    value={formData.birthDate}
                                    onChange={(date) => setFormData({...formData, birthDate: date})}
                                    placeholder="اختر تاريخ الميلاد"
                                  />
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="isAlive"
                                    checked={formData.isAlive}
                                    onChange={(e) => setFormData({...formData, isAlive: e.target.checked})}
                                  />
                                  <Label htmlFor="isAlive">على قيد الحياة</Label>
                                </div>
                              </div>

                              {!formData.isAlive && (
                                <div>
                                  <Label>تاريخ الوفاة</Label>
                                  <EnhancedDatePicker
                                    value={formData.deathDate}
                                    onChange={(date) => setFormData({...formData, deathDate: date})}
                                    placeholder="اختر تاريخ الوفاة"
                                  />
                                </div>
                              )}

                              <div>
                                <Label htmlFor="bio">السيرة الذاتية</Label>
                                <Textarea
                                  id="bio"
                                  value={formData.bio}
                                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                  placeholder="أدخل معلومات إضافية عن العضو"
                                  rows={3}
                                />
                              </div>
                            </div>
                          )}

                          {currentStep === 2 && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">العلاقات العائلية</h3>
                              <p className="text-sm text-muted-foreground">أضف معلومات الزواج والعلاقات العائلية</p>
                              {/* TODO: Add relationship forms */}
                            </div>
                          )}

                          {currentStep === 3 && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">الصورة والمعلومات الإضافية</h3>
                              {/* TODO: Add image upload */}
                            </div>
                          )}

                          {/* Navigation Buttons */}
                          <div className="flex justify-between pt-6">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={prevStep}
                              disabled={currentStep === 1}
                              className="flex items-center gap-2"
                            >
                              <ArrowLeft className="h-4 w-4" />
                              السابق
                            </Button>
                            
                            {currentStep < 3 ? (
                              <Button
                                type="button"
                                onClick={nextStep}
                                className="flex items-center gap-2"
                              >
                                التالي
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                onClick={() => handleFormSubmit(formData)}
                                disabled={isSaving}
                                className="flex items-center gap-2"
                              >
                                {isSaving ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    جاري الحفظ...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4" />
                                    حفظ
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Member List - Right Side on Desktop */}
                <div className={cn(
                  "space-y-4",
                  isMobile ? "order-1" : "col-span-4 order-2"
                )}>
                  {isMobile ? (
                    <Drawer open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
                      <DrawerTrigger asChild>
                        <Button variant="outline" className="w-full flex items-center gap-2">
                          <Menu className="h-4 w-4" />
                          عرض قائمة الأعضاء ({familyMembers.length})
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="h-[80vh]">
                        <div className="p-4">
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
                    <Card className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-lg"></div>
                      <CardHeader className="pb-4 relative">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            أعضاء العائلة ({familyMembers.length})
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative">
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
              <Card className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-lg"></div>
                <CardContent className="relative p-8">
                  <div className="text-center text-muted-foreground">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
                      <TreePine className="relative h-12 w-12 mx-auto mb-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-medium">عرض الشجرة سيتم تطويره قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics">
              <Card className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-lg"></div>
                <CardContent className="relative p-8">
                  <div className="text-center text-muted-foreground">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
                      <Star className="relative h-12 w-12 mx-auto mb-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent font-medium">الإحصائيات المفصلة ستتوفر قريباً</p>
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

// Member List Component
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
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث عن عضو..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter */}
      <Select value={selectedFilter} onValueChange={onFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="تصفية حسب..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع الأعضاء</SelectItem>
          <SelectItem value="alive">الأحياء</SelectItem>
          <SelectItem value="deceased">المتوفين</SelectItem>
          <SelectItem value="male">الذكور</SelectItem>
          <SelectItem value="female">الإناث</SelectItem>
          <SelectItem value="founders">المؤسسون</SelectItem>
        </SelectContent>
      </Select>

      {/* Member List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد أعضاء</p>
          </div>
        ) : (
          members.map((member: any) => (
            <Card 
              key={member.id} 
              className="relative cursor-pointer bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 hover:bg-white/95 dark:hover:bg-gray-800/95 transition-all duration-300 hover:shadow-lg rounded-3xl overflow-hidden"
              onClick={() => onEditMember(member)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.image} />
                    <AvatarFallback className={getGenderColor(member.gender)}>
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    {getAdditionalInfo(member) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {getAdditionalInfo(member)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {member.isFounder && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    {!member.isAlive && (
                      <Skull className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FamilyBuilderNew;
