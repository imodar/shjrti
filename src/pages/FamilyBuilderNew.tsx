import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableDropdown } from "@/components/SearchableDropdown";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Edit2, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop, Star, Sparkles, Image, Store, MoreVertical, Menu, ChevronsUpDown, Check, ChevronDown, Shield, AlertTriangle, UserCircle, Zap, Calendar as CalendarDays, UsersIcon, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { DateDisplay } from "@/components/DateDisplay";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";
import { useIsMobile } from "@/hooks/use-mobile";
import { SpouseForm, SpouseData } from "@/components/SpouseForm";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import FamilyBuilderNewSkeleton from "@/components/skeletons/FamilyBuilderNewSkeleton";
import { MemberProfileView } from "@/components/MemberProfileView";


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
    
    (familyMarriages || []).forEach(marriage => {
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
    
    (familyMarriages || []).forEach(marriage => {
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

  // Image Upload and Crop Component (consolidated states)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = document.createElement('img');
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result as string));
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setShowCropDialog(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (selectedImage && croppedAreaPixels) {
      const croppedImg = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (croppedImg) {
        setCroppedImage(croppedImg);
        setShowCropDialog(false);
      }
    }
  };

  const handleDeleteImage = () => {
    setCroppedImage(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditImage = () => {
    if (selectedImage) {
      setShowCropDialog(true);
    }
  };

  // Get image upload permission state from top level
  const { isImageUploadEnabled, loading: uploadLoading } = useImageUploadPermission();

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
  const [memberListLoading, setMemberListLoading] = useState(false);

  // Form panel states
  const [formMode, setFormMode] = useState<'view' | 'add' | 'edit' | 'profile'>('view');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [relationshipPopoverOpen, setRelationshipPopoverOpen] = useState(false);
  
  // Mobile drawer state
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
        
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      

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

      

      if (userSubscription && userSubscription.packages) {
        setPackageData(userSubscription.packages);
        setSubscriptionData(userSubscription);
      } else {
        
        const { data: freePackage } = await supabase
          .from('packages')
          .select('*')
          .ilike('name->en', 'Free')
          .single();
        
        if (freePackage) setPackageData(freePackage);
      }
      
      if (!familyId) {
        throw new Error('No family ID provided');
      }

      
      
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
          husband_id,
          wife_id,
          is_active,
          marital_status
        `)
        .eq('family_id', familyToUse.id)
        .eq('is_active', true);

      if (marriagesError) throw marriagesError;

      // Get detailed marriage data with member info
      let marriagesWithMembers = [];
      if (marriages) {
        marriagesWithMembers = await Promise.all(marriages.map(async (marriage) => {
          const [husbandResult, wifeResult] = await Promise.all([
            supabase.from('family_tree_members').select('*').eq('id', marriage.husband_id).single(),
            supabase.from('family_tree_members').select('*').eq('id', marriage.wife_id).single()
          ]);
          
          return {
            ...marriage,
            husband: husbandResult.data,
            wife: wifeResult.data
          };
        }));
      }

      if (marriagesError) throw marriagesError;

      if (marriagesWithMembers) {
        setFamilyMarriages(marriagesWithMembers);
        
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
          husband_id,
          wife_id,
          is_active,
          marital_status
        `)
        .eq('family_id', family.id)
        .eq('is_active', true);

      if (marriagesError) throw marriagesError;

      // Get detailed marriage data with member info
      let marriagesWithMembers = [];
      if (marriages) {
        marriagesWithMembers = await Promise.all(marriages.map(async (marriage) => {
          const [husbandResult, wifeResult] = await Promise.all([
            supabase.from('family_tree_members').select('*').eq('id', marriage.husband_id).single(),
            supabase.from('family_tree_members').select('*').eq('id', marriage.wife_id).single()
          ]);
          
          return {
            ...marriage,
            husband: husbandResult.data,
            wife: wifeResult.data
          };
        }));
      }

      if (marriagesWithMembers) {
        setFamilyMarriages(marriagesWithMembers);
      }

      
    } catch (error) {
      console.error('Error refreshing family data:', error);
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, [toast]);

  // Load spouses when data is updated and there's a member being edited
  useEffect(() => {
    if (editingMember && familyMarriages && familyMembers && familyMarriages.length > 0) {
      
      loadExistingSpouses(editingMember);
    }
  }, [familyMarriages, familyMembers, editingMember]);
  
  // Search and filter states
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Form data states
  const [formData, setFormData] = useState({
    name: "",
    first_name: "",
    relation: "",
    relatedPersonId: null as string | null,
    selectedParent: null as string | null,
    gender: "male",
    birthDate: null as Date | null,
    isAlive: true,
    deathDate: null as Date | null,
    bio: "",
    imageUrl: "",
    croppedImage: null as string | null,
    isFounder: false
  });

  const [wives, setWives] = useState<SpouseData[]>([]);

  const [husband, setHusband] = useState<SpouseData | null>(null);

  // Sync croppedImage with formData when croppedImage changes
  useEffect(() => {
    if (croppedImage !== formData.croppedImage) {
      setFormData(prev => ({
        ...prev,
        croppedImage: croppedImage
      }));
    }
  }, [croppedImage, formData.croppedImage]);

  // Command states for search
  const [husbandCommandOpen, setHusbandCommandOpen] = useState(false);
  const [wivesCommandOpen, setWivesCommandOpen] = useState<{ [key: number]: boolean }>({});
  const [wiveFamilyStatus, setWiveFamilyStatus] = useState<{ [key: number]: 'yes' | 'no' | null }>({});
  
  // Unified spouse form states
  const [currentWife, setCurrentWife] = useState<SpouseData | null>(null);
  const [currentHusband, setCurrentHusband] = useState<SpouseData | null>(null);
  const [wifeCommandOpen, setWifeCommandOpen] = useState(false);
  const [wifeFamilyStatus, setWifeFamilyStatus] = useState<'yes' | 'no' | null>(null);
  const [husbandFamilyStatus, setHusbandFamilyStatus] = useState<'yes' | 'no' | null>(null);
  const [showWifeForm, setShowWifeForm] = useState(false);
  const [showHusbandForm, setShowHusbandForm] = useState(false);
  const [editingWifeIndex, setEditingWifeIndex] = useState<number | null>(null);

  // Unified spouse form handlers
  const handleWifeFamilyStatusChange = (status: string) => {
    setWifeFamilyStatus(status as 'yes' | 'no');
  };

  const handleHusbandFamilyStatusChange = (status: string) => {
    setHusbandFamilyStatus(status as 'yes' | 'no');
  };

  const handleAddWife = () => {
    setCurrentWife({
      id: '',
      firstName: '',
      lastName: '',
      name: '',
      isAlive: true,
      birthDate: null,
      deathDate: null,
      maritalStatus: 'married',
      isFamilyMember: false,
      existingFamilyMemberId: '',
      croppedImage: null,
      isSaved: false
    });
    setShowWifeForm(true);
  };

  const handleAddHusband = () => {
    setCurrentHusband({
      id: '',
      firstName: '',
      lastName: '',
      name: '',
      isAlive: true,
      birthDate: null,
      deathDate: null,
      maritalStatus: 'married',
      isFamilyMember: false,
      existingFamilyMemberId: '',
      croppedImage: null,
      isSaved: false
    });
    setShowHusbandForm(true);
  };

  const handleSpouseSave = async (spouseType: 'wife' | 'husband') => {
    const currentSpouse = spouseType === 'wife' ? currentWife : currentHusband;
    if (!currentSpouse) return;
    
    try {
      let spouseId = currentSpouse.id;
      
      // For new spouses without an ID or external spouses, handle database creation
      if (!currentSpouse.isFamilyMember) {
        // External spouse - create or update in database
        if (!spouseId || spouseId === '' || spouseId.startsWith('temp_')) {
          // Create new external spouse in database
          const spouseName = currentSpouse.name || (currentSpouse.firstName && currentSpouse.lastName ? `${currentSpouse.firstName} ${currentSpouse.lastName}` : currentSpouse.firstName || currentSpouse.lastName || '');
          
          const { data: { user } } = await supabase.auth.getUser();
          
          const { data: newSpouseData, error: insertError } = await supabase
            .from('family_tree_members')
            .insert({
              family_id: familyId,
              name: spouseName,
              first_name: currentSpouse.firstName || null,
              last_name: currentSpouse.lastName || null,
              gender: spouseType === 'wife' ? 'female' : 'male',
              birth_date: currentSpouse.birthDate?.toISOString().split('T')[0] || null,
              is_alive: currentSpouse.isAlive ?? true,
              death_date: !currentSpouse.isAlive && currentSpouse.deathDate ? currentSpouse.deathDate.toISOString().split('T')[0] : null,
              marital_status: 'married',
              image_url: currentSpouse.croppedImage || null,
              created_by: user?.id,
              is_founder: false
            })
            .select()
            .single();
            
          if (insertError) {
            throw insertError;
          }
          
          spouseId = newSpouseData.id;
        } else {
          // Update existing external spouse
          const spouseName = currentSpouse.name || (currentSpouse.firstName && currentSpouse.lastName ? `${currentSpouse.firstName} ${currentSpouse.lastName}` : currentSpouse.firstName || currentSpouse.lastName || '');
          
          await supabase
            .from('family_tree_members')
            .update({
              name: spouseName,
              first_name: currentSpouse.firstName || null,
              last_name: currentSpouse.lastName || null,
              birth_date: currentSpouse.birthDate?.toISOString().split('T')[0] || null,
              is_alive: currentSpouse.isAlive ?? true,
              death_date: !currentSpouse.isAlive && currentSpouse.deathDate ? currentSpouse.deathDate.toISOString().split('T')[0] : null,
              marital_status: 'married',
              image_url: currentSpouse.croppedImage || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', spouseId);
        }
      } else if (currentSpouse.isFamilyMember && currentSpouse.existingFamilyMemberId) {
        // Update existing family member spouse
        const spouseName = currentSpouse.name || (currentSpouse.firstName && currentSpouse.lastName ? `${currentSpouse.firstName} ${currentSpouse.lastName}` : currentSpouse.firstName || currentSpouse.lastName || '');
        
        await supabase
          .from('family_tree_members')
          .update({
            name: spouseName,
            first_name: currentSpouse.firstName || null,
            last_name: currentSpouse.lastName || null,
            birth_date: currentSpouse.birthDate?.toISOString().split('T')[0] || null,
            is_alive: currentSpouse.isAlive ?? true,
            death_date: !currentSpouse.isAlive && currentSpouse.deathDate ? currentSpouse.deathDate.toISOString().split('T')[0] : null,
            marital_status: 'married',
            image_url: currentSpouse.croppedImage || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSpouse.existingFamilyMemberId);
          
        spouseId = currentSpouse.existingFamilyMemberId;
      }

      // Update local state with the correct spouse ID
      const updatedSpouse = { ...currentSpouse, id: spouseId, isSaved: true };
      
      if (spouseType === 'wife') {
        // Check if we're editing an existing wife or adding a new one
        const existingWifeIndex = wives.findIndex(w => w.id === currentSpouse.id || (editingWifeIndex !== null && editingWifeIndex >= 0));
        
        if (existingWifeIndex >= 0) {
          // Update existing wife
          const updatedWives = [...wives];
          updatedWives[existingWifeIndex] = updatedSpouse;
          setWives(updatedWives);
        } else {
          // Add new wife
          setWives(prev => [...prev, updatedSpouse]);
        }
        setEditingWifeIndex(null);
      } else {
        // Update husband
        setHusband(updatedSpouse);
      }
      
      // Reset form state
      if (spouseType === 'wife') {
        setCurrentWife(null);
        setShowWifeForm(false);
        setWifeFamilyStatus(null);
      } else {
        setCurrentHusband(null);
        setShowHusbandForm(false);
        setHusbandFamilyStatus(null);
      }
      
      toast({
        title: "تم حفظ البيانات",
        description: `تم حفظ بيانات ${spouseType === 'wife' ? 'الزوجة' : 'الزوج'} بنجاح`,
        variant: "default"
      });
    } catch (error) {
      console.error(`Error saving ${spouseType} data:`, error);
      toast({
        title: "خطأ في الحفظ",
        description: `حدث خطأ أثناء حفظ بيانات ${spouseType === 'wife' ? 'الزوجة' : 'الزوج'}`,
        variant: "destructive"
      });
    }
  };

  // Helper functions for spouse editing conflict management
  const checkForActiveSpouseEdit = () => {
    if (showWifeForm && editingWifeIndex !== null) {
      return { type: 'wife', index: editingWifeIndex };
    }
    if (showHusbandForm) {
      return { type: 'husband', index: -1 };
    }
    return null;
  };

  const closeActiveSpouseEdit = () => {
    if (showWifeForm && editingWifeIndex !== null) {
      setShowWifeForm(false);
      setCurrentWife(null);
      setWifeFamilyStatus(null);
      
      // Restore the original saved wife data
      const updatedWives = [...wives];
      const originalWife = familyMarriages
        .flatMap((m: any) => m.wife ? [m.wife] : [])
        .find((w: any) => w.id === updatedWives[editingWifeIndex]?.id);
      
      if (originalWife && updatedWives[editingWifeIndex]) {
        updatedWives[editingWifeIndex] = {
          ...originalWife,
          isSaved: true,
          isFamilyMember: updatedWives[editingWifeIndex].isFamilyMember
        };
        setWives(updatedWives);
      }
      
      setEditingWifeIndex(null);
    }
    
    if (showHusbandForm && husband) {
      setShowHusbandForm(false);
      setCurrentHusband(null);
      setHusbandFamilyStatus(null);
      
      // Restore the original saved husband data
      const originalHusband = familyMarriages
        .flatMap((m: any) => m.husband ? [m.husband] : [])
        .find((h: any) => h.id === husband.id);
      
      if (originalHusband) {
        setHusband({
          ...originalHusband,
          isSaved: true,
          isFamilyMember: husband.isFamilyMember
        });
      }
    }
  };

  const handleSpouseEditAttempt = (spouseType: 'wife' | 'husband', spouseData: any, index: number) => {
    const activeEdit = checkForActiveSpouseEdit();
    
    if (activeEdit) {
      // There's already an active edit session
      if (activeEdit.type === spouseType && activeEdit.index === index) {
        // Same spouse being edited, just return
        return;
      }
      
      // Different spouse, close the previous edit and proceed with new one
      closeActiveSpouseEdit();
    }
    
    // No active edit, proceed with editing
    if (spouseType === 'wife') {
      const updatedWives = [...wives];
      updatedWives[index] = { ...spouseData, isSaved: false };
      setWives(updatedWives);
      setCurrentWife(spouseData);
      setShowWifeForm(true);
      setEditingWifeIndex(index);
      setWifeFamilyStatus(spouseData.isFamilyMember ? 'yes' : 'no');
    } else {
      setHusband({ ...spouseData, isSaved: false });
      setCurrentHusband(spouseData);
      setShowHusbandForm(true);
      setHusbandFamilyStatus(spouseData.isFamilyMember ? 'yes' : 'no');
    }
    
    toast({
      title: "وضع التعديل",
      description: `يمكنك الآن تعديل بيانات ${spouseType === 'wife' ? 'الزوجة' : 'الزوج'}`,
      variant: "default"
    });
  };

  // Close functions for spouse forms
  const handleCloseWifeEdit = () => {
    closeActiveSpouseEdit();
    toast({
      title: "تم إغلاق التعديل",
      description: "تم إغلاق تعديل الزوجة",
      variant: "default"
    });
  };

  const handleCloseHusbandEdit = () => {
    closeActiveSpouseEdit();
    toast({
      title: "تم إغلاق التعديل", 
      description: "تم إغلاق تعديل الزوج",
      variant: "default"
    });
  };

  // Wrapper functions for backward compatibility
  const handleWifeSave = () => handleSpouseSave('wife');
  const handleHusbandSave = () => handleSpouseSave('husband');

  // Crop function helper
  const createCroppedImage = async (imageSrc: string, crop: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = crop.width;
        canvas.height = crop.height;

        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const croppedImageUrl = URL.createObjectURL(blob);
          resolve(croppedImageUrl);
        }, 'image/jpeg', 0.95);
      };
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = imageSrc;
    });
  };

  // Form states for member creation/editing
  
  // Delete modal states (keep existing delete modal functionality)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [deleteModalType, setDeleteModalType] = useState<'spouse' | 'bloodMember'>('spouse');
  const [deleteWarningMessage, setDeleteWarningMessage] = useState("");
  const [showSpouseEditWarning, setShowSpouseEditWarning] = useState(false);
  const [spousePartnerName, setSpousePartnerName] = useState("");
  const [spousePartnerDetails, setSpousePartnerDetails] = useState({ name: "", fatherName: "", grandfatherName: "" });
  
  // Spouse deletion modal states
  const [showSpouseDeleteModal, setShowSpouseDeleteModal] = useState(false);
  const [spouseToDelete, setSpouseToDelete] = useState<{ wife: any; index: number } | null>(null);
  const [spouseDeleteWarning, setSpouseDeleteWarning] = useState("");
  
  // Track original wife data for change detection
  const [originalWivesData, setOriginalWivesData] = useState<any[]>([]);
  
  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- Spouse rules helpers & delete handlers ---
  const checkIfMemberIsSpouse = useCallback((member: any) => {
    // Spouse: no parents in this family and not a founder
    return !member?.fatherId && !member?.motherId && !member?.isFounder;
  }, []);

  const getSpousePartnerName = (spouseMember: any) => {
    const marriage = familyMarriages.find((marriage: any) => 
      marriage.husband?.id === spouseMember.id || marriage.wife?.id === spouseMember.id
    );
    
    if (!marriage) return "";
    
    if (marriage.husband?.id === spouseMember.id) {
      return marriage.wife?.name || "";
    } else {
      return marriage.husband?.name || "";
    }
  };

  const getSpousePartnerDetails = (spouseMember: any) => {
    const marriage = familyMarriages.find((marriage: any) => 
      marriage.husband?.id === spouseMember.id || marriage.wife?.id === spouseMember.id
    );
    
    if (!marriage) return { name: "", fatherName: "", grandfatherName: "" };
    
    let partnerMember;
    if (marriage.husband?.id === spouseMember.id) {
      partnerMember = familyMembers.find(m => m.id === marriage.wife?.id);
    } else {
      partnerMember = familyMembers.find(m => m.id === marriage.husband?.id);
    }
    
    if (!partnerMember) return { name: "", fatherName: "", grandfatherName: "" };
    
    // Get father information
    const father = familyMembers.find(m => m.id === partnerMember.fatherId);
    const fatherName = father?.name || "";
    
    // Get grandfather information
    const grandfather = father ? familyMembers.find(m => m.id === father.fatherId) : null;
    const grandfatherName = grandfather?.name || "";
    
    return {
      name: partnerMember.name || "",
      fatherName,
      grandfatherName
    };
  };

  const handleSpouseEditWarning = (spouseMember: any) => {
    // Close any active spouse editing forms first
    closeActiveSpouseEdit();
    
    // Find the marriage where this spouse belongs
    const marriage = familyMarriages.find((m: any) => 
      m.husband?.id === spouseMember.id || m.wife?.id === spouseMember.id
    );
    
    if (!marriage) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على معلومات الزواج لهذا العضو",
        variant: "destructive"
      });
      return;
    }
    
    // Get the partner (the actual family member who can be edited)
    const partner = marriage.husband?.id === spouseMember.id ? marriage.wife : marriage.husband;
    
    if (!partner) {
      toast({
        title: "خطأ", 
        description: "لم يتم العثور على معلومات الشريك",
        variant: "destructive"
      });
      return;
    }
    
    // Find the partner in our editing member's context
    if (!editingMember) {
      toast({
        title: "خطأ",
        description: "يجب اختيار عضو أولاً لتعديل الزوج/الزوجة",
        variant: "destructive"
      });
      return;
    }
    
    // Check if this spouse is in the wives array or husband
    if (spouseMember.gender === 'female') {
      const wifeIndex = wives.findIndex(w => w.id === spouseMember.id);
      if (wifeIndex !== -1) {
        const wifeData = wives[wifeIndex];
        handleSpouseEditAttempt('wife', wifeData, wifeIndex);
      } else {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على بيانات الزوجة في القائمة",
          variant: "destructive"
        });
      }
    } else {
      // It's a husband
      if (husband && husband.id === spouseMember.id) {
        handleSpouseEditAttempt('husband', husband, -1);
      } else {
        toast({
          title: "خطأ", 
          description: "لم يتم العثور على بيانات الزوج في القائمة",
          variant: "destructive"
        });
      }
    }
  };

  const getChildrenCount = (parentId: string) => {
    return familyMembers.filter(m => m.fatherId === parentId || m.motherId === parentId).length;
  };

  const getSpousesCount = (memberId: string) => {
    return familyMarriages.filter((marriage: any) => marriage.husband?.id === memberId || marriage.wife?.id === memberId).length;
  };

  const performCascadingDelete = async (member: any) => {
    const membersToDelete = new Set<string>();
    const marriagesToDelete = new Set<string>();

    // Add the main member to be deleted
    membersToDelete.add(member.id);

    // Find all marriages involving this member
    const memberMarriages = familyMarriages.filter((marriage: any) =>
      marriage.husband?.id === member.id || marriage.wife?.id === member.id
    );

    // Process each marriage
    memberMarriages.forEach((marriage: any) => {
      marriagesToDelete.add(marriage.id);
      
      // If deleting a blood family member (not a spouse), also delete their spouse if the spouse is not a blood family member
      if (!checkIfMemberIsSpouse(member)) {
        const spouseId = marriage.husband?.id === member.id ? marriage.wife?.id : marriage.husband?.id;
        if (spouseId) {
          const spouse = familyMembers.find(m => m.id === spouseId);
          // Delete spouse only if they are not a blood family member (i.e., they are a spouse brought in by marriage)
          if (spouse && checkIfMemberIsSpouse(spouse)) {
            membersToDelete.add(spouseId);
          }
        }
      }
    });

    // Recursive function to find and delete all descendants
    const findDescendants = (parentId: string) => {
      const children = familyMembers.filter(m => m.fatherId === parentId || m.motherId === parentId);
      
      children.forEach(child => {
        membersToDelete.add(child.id);
        
        // Find and delete marriages of this child
        const childMarriages = familyMarriages.filter((marriage: any) =>
          marriage.husband?.id === child.id || marriage.wife?.id === child.id
        );
        
        childMarriages.forEach((marriage: any) => {
          marriagesToDelete.add(marriage.id);
          
          // If child's spouse is not a blood family member, delete them too
          const spouseId = marriage.husband?.id === child.id ? marriage.wife?.id : marriage.husband?.id;
          if (spouseId) {
            const spouse = familyMembers.find(m => m.id === spouseId);
            if (spouse && checkIfMemberIsSpouse(spouse)) {
              membersToDelete.add(spouseId);
            }
          }
        });
        
        // Recursively find descendants of this child
        findDescendants(child.id);
      });
    };

    // Start the recursive descent from the member being deleted
    findDescendants(member.id);

    try {
      // Delete marriages first (to avoid foreign key constraints)
      if (marriagesToDelete.size > 0) {
        const { error: marriageError } = await supabase
          .from('marriages')
          .delete()
          .in('id', Array.from(marriagesToDelete));
        if (marriageError) throw marriageError;
      }

      // Then delete family members
      if (membersToDelete.size > 0) {
        const { error: memberError } = await supabase
          .from('family_tree_members')
          .delete()
          .in('id', Array.from(membersToDelete));
        if (memberError) throw memberError;
      }

      // Update local state
      setFamilyMembers(familyMembers.filter(m => !membersToDelete.has(m.id)));
      setFamilyMarriages(familyMarriages.filter((marriage: any) => !marriagesToDelete.has(marriage.id)));

      toast({
        title: t('family_builder.deleted', 'تم الحذف بنجاح'),
        description: `تم حذف ${membersToDelete.size} عضو و ${marriagesToDelete.size} علاقة زواج من شجرة العائلة`
      });
    } catch (error) {
      console.error('Error in cascading delete:', error);
      throw error;
    }
  };

  const handleDeleteMember = useCallback(async (memberOrId: any) => {
    const id = typeof memberOrId === 'string' ? memberOrId : memberOrId?.id;
    const member = familyMembers.find(m => m.id === id);
    if (!member) {
      toast({ title: t('family_builder.error', 'خطأ'), description: t('family_builder.member_not_found', 'العضو غير موجود'), variant: 'destructive' });
      return;
    }

    if (member.isFounder) {
      toast({ title: t('family_builder.warning', 'تحذير'), description: t('family_builder.cannot_delete_founder', 'لا يمكن حذف مؤسس العائلة'), variant: 'destructive' });
      return;
    }

    setMemberToDelete(member);

    // Get detailed information about what will be deleted
    const spouses = familyMarriages
      .filter((marriage: any) => marriage.husband?.id === member.id || marriage.wife?.id === member.id)
      .map((marriage: any) => {
        const spouseId = marriage.husband?.id === member.id ? marriage.wife?.id : marriage.husband?.id;
        return familyMembers.find(m => m.id === spouseId);
      })
      .filter(Boolean);

    const children = familyMembers.filter(m => m.fatherId === member.id || m.motherId === member.id);
    
    // Count all descendants recursively
    const getAllDescendants = (parentId: string): any[] => {
      const directChildren = familyMembers.filter(m => m.fatherId === parentId || m.motherId === parentId);
      let allDescendants = [...directChildren];
      directChildren.forEach(child => {
        allDescendants = [...allDescendants, ...getAllDescendants(child.id)];
      });
      return allDescendants;
    };

    const allDescendants = getAllDescendants(member.id);
    const marriages = familyMarriages.filter((marriage: any) => 
      marriage.husband?.id === member.id || marriage.wife?.id === member.id
    );

    const isSpouse = checkIfMemberIsSpouse(member);
    
    if (isSpouse) {
      setDeleteModalType('spouse');
      setDeleteWarningMessage(
        `تحذير: حذف هذا الزوج/الزوجة سيؤدي إلى:\n` +
        `- حذف الشخص نفسه\n` +
        `- إزالة علاقة الزواج\n` +
        (children.length > 0 ? `- حذف ${children.length} من الأطفال وجميع أحفادهم (${allDescendants.length} شخص إجمالي)\n` : '') +
        `هل أنت متأكد من المتابعة؟`
      );
    } else {
      let warningMessage = `تحذير: حذف هذا العضو سيؤدي إلى حذف:\n`;
      warningMessage += `- الشخص نفسه (${member.name})\n`;
      if (spouses.length > 0) {
        warningMessage += `- ${spouses.length} زوج/زوجة: ${spouses.map(s => s?.name).join(', ')}\n`;
      }
      if (children.length > 0) {
        warningMessage += `- ${children.length} من الأطفال المباشرين\n`;
        if (allDescendants.length > children.length) {
          warningMessage += `- جميع الأحفاد (${allDescendants.length} شخص إجمالي)\n`;
        }
      }
      if (marriages.length > 0) {
        warningMessage += `- ${marriages.length} من علاقات الزواج\n`;
      }
      warningMessage += `\nهل أنت متأكد من المتابعة؟`;
      
      setDeleteModalType('bloodMember');
      setDeleteWarningMessage(warningMessage);
    }
    setShowDeleteModal(true);
  }, [familyMembers, familyMarriages, t]);

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await performCascadingDelete(memberToDelete);
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({ title: t('family_builder.error', 'خطأ'), description: t('family_builder.delete_error', 'حدث خطأ أثناء حذف العضو'), variant: 'destructive' });
    }
  };

  // Helper function to check if wife data has changed
  const hasWifeDataChanged = (wife: any, index: number) => {
    const original = originalWivesData[index];
    if (!original && wife.isSaved) return false; // New wife that's saved
    if (!original) return true; // New unsaved wife
    
    return (
      wife.name !== original.name ||
      wife.isAlive !== original.isAlive ||
      wife.maritalStatus !== original.maritalStatus ||
      wife.isFamilyMember !== original.isFamilyMember ||
      (wife.birthDate?.getTime() || 0) !== (original.birthDate?.getTime() || 0) ||
      (wife.deathDate?.getTime() || 0) !== (original.deathDate?.getTime() || 0)
    );
  };

  // Handle spouse deletion with modal
  const handleSpouseDelete = (wife: any, index: number) => {
    // Find children of this spouse
    const spouseChildren = familyMembers.filter(member => 
      member.mother_id === wife.id || member.father_id === wife.id
    );
    
    // Get all descendants
    const getAllSpouseDescendants = (memberId: string): any[] => {
      const children = familyMembers.filter(member => 
        member.father_id === memberId || member.mother_id === memberId
      );
      let descendants = [...children];
      children.forEach(child => {
        descendants = [...descendants, ...getAllSpouseDescendants(child.id)];
      });
      return descendants;
    };
    
    const allDescendants = getAllSpouseDescendants(wife.id);
    
    let warningMessage = `تحذير: حذف هذه الزوجة سيؤدي إلى:\n`;
    warningMessage += `- حذف الزوجة: ${wife.name}\n`;
    warningMessage += `- إزالة علاقة الزواج\n`;
    
    if (spouseChildren.length > 0) {
      warningMessage += `- حذف ${spouseChildren.length} من الأطفال\n`;
    }
    
    if (allDescendants.length > spouseChildren.length) {
      warningMessage += `- حذف جميع الأحفاد (${allDescendants.length} شخص إجمالي)\n`;
    }
    
    warningMessage += `\nسيتم التأكيد النهائي عند حفظ بيانات العضو الحالي.\nهل تريد المتابعة؟`;
    
    setSpouseToDelete({ wife, index });
    setSpouseDeleteWarning(warningMessage);
    setShowSpouseDeleteModal(true);
  };

  // Confirm spouse deletion (just mark for deletion)
  const confirmSpouseDelete = () => {
    if (!spouseToDelete) return;
    
    const { index } = spouseToDelete;
    const newWives = wives.filter((_, i) => i !== index);
    setWives(newWives);
    
    // Update family status object
    const newStatus = { ...wiveFamilyStatus };
    delete newStatus[index];
    // Reindex the remaining statuses
    const reindexedStatus: { [key: number]: 'yes' | 'no' | null } = {};
    Object.keys(newStatus).forEach((key, newIndex) => {
      const oldIndex = parseInt(key);
      if (oldIndex > index) {
        reindexedStatus[newIndex] = newStatus[oldIndex];
      } else if (oldIndex < index) {
        reindexedStatus[oldIndex] = newStatus[oldIndex];
      }
    });
    setWiveFamilyStatus(reindexedStatus);
    
    setShowSpouseDeleteModal(false);
    setSpouseToDelete(null);
    
    toast({
      title: "تم تحديد الزوجة للحذف",
      description: "سيتم حذف الزوجة نهائياً عند حفظ بيانات العضو",
      variant: "destructive"
    });
  };

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
    // Check if user has reached package limit
    if (packageData && familyMembers.length >= packageData.max_family_members) {
      setShowUpgradeModal(true);
      return;
    }
    
    setFormMode('add');
    setEditingMember(null);
    setCurrentStep(1);
    resetFormData();
    if (isMobile) setIsMemberListOpen(false);
  };

  const handleViewMember = useCallback((member: any) => {
    setFormMode('profile');
    setEditingMember(member);
    if (isMobile) setIsMemberListOpen(false);
  }, [isMobile]);

  const handleEditMember = useCallback((member: any) => {
    setFormMode('edit');
    setEditingMember(member);
    setCurrentStep(1);
    populateFormData(member);
    if (isMobile) setIsMemberListOpen(false);
  }, [isMobile]);

  const handleCancelForm = () => {
    setFormMode('view');
    setEditingMember(null);
    setCurrentStep(1);
    resetFormData();
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      first_name: "",
      relation: "",
      relatedPersonId: null,
      selectedParent: null,
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
      first_name: member.first_name || "",
      relation: member.relation || "",
      relatedPersonId: member.relatedPersonId,
      selectedParent: member.relatedPersonId || null,
      gender: member.gender || "male",
      birthDate: member.birthDate ? new Date(member.birthDate) : null,
      isAlive: member.isAlive ?? true,
      deathDate: member.deathDate ? new Date(member.deathDate) : null,
      bio: member.bio || "",
      imageUrl: member.image || "",
      croppedImage: member.image || null,
      isFounder: member.isFounder || false
    });
    
    // Load existing spouses
    loadExistingSpouses(member);
  };

  const loadExistingSpouses = (member: any) => {
    if (!familyMarriages || familyMarriages.length === 0) return;
    
    // Reset spouse states first
    setWives([]);
    setHusband(null);
    
    if (member.gender === "male") {
      // Load wives for male member
      const memberMarriages = familyMarriages.filter(marriage => 
        marriage.husband?.id === member.id
      );
      
      
      
      if (memberMarriages.length > 0) {
        const memberWives = memberMarriages.map(marriage => {
          // Use the wife data from the marriage object directly (it already has all fields from the database)
          const wifeMember = marriage.wife || familyMembers.find(fm => fm.id === marriage.wife?.id);
          
          // Determine if spouse is external: no father_id and not founder
          const isExternalSpouse = wifeMember ? (!wifeMember.father_id && !wifeMember.is_founder) : true;
          
          return {
            id: marriage.wife?.id || '',
            name: marriage.wife?.name || '',
            firstName: wifeMember?.first_name || '',
            lastName: wifeMember?.last_name || '',
            birthDate: wifeMember?.birth_date ? new Date(wifeMember.birth_date) : null,
            maritalStatus: wifeMember?.marital_status || 'married',
            isAlive: wifeMember?.is_alive ?? true,
            deathDate: wifeMember?.death_date ? new Date(wifeMember.death_date) : null,
            croppedImage: wifeMember?.image_url || null,
            biography: wifeMember?.biography || '', // Add missing biography field
            isFamilyMember: !isExternalSpouse, // If external spouse, mark as not family member
            existingFamilyMemberId: wifeMember ? wifeMember.id : '',
            isSaved: true, // Mark existing wives as saved
            originalData: wifeMember ? { // Store original data for change tracking
              name: marriage.wife?.name || '',
              firstName: wifeMember.first_name || '',
              lastName: wifeMember.last_name || '',
              birthDate: wifeMember.birth_date ? new Date(wifeMember.birth_date) : null,
              isAlive: wifeMember.is_alive ?? true,
              deathDate: wifeMember.death_date ? new Date(wifeMember.death_date) : null,
              maritalStatus: wifeMember.marital_status || 'married',
              croppedImage: wifeMember.image_url || null,
              biography: wifeMember.biography || '', // Add missing biography field to original data too
              isFamilyMember: !isExternalSpouse
            } : null
          };
        }).filter(wife => wife.id); // Filter out wives without ID
        
        
        setWives(memberWives);
        setOriginalWivesData(memberWives.map(wife => ({ ...wife }))); // Store original data
        
        // Initialize wife family status based on whether they are family members
        const initialWiveFamilyStatus: { [key: number]: 'yes' | 'no' | null } = {};
        memberWives.forEach((wife, index) => {
          initialWiveFamilyStatus[index] = wife.isFamilyMember ? 'yes' : 'no';
        });
        setWiveFamilyStatus(initialWiveFamilyStatus);
      } else {
        
        setWives([]);
        setWiveFamilyStatus({});
      }
    } else if (member.gender === "female") {
      // Load husband for female member
      const memberMarriages = familyMarriages.filter(marriage => 
        marriage.wife?.id === member.id
      );
      
      if (memberMarriages.length > 0) {
        const marriage = memberMarriages[0]; // Take the first marriage
        const husbandMember = familyMembers.find(fm => fm.id === marriage.husband?.id);
        
        const husbandData = {
          id: marriage.husband?.id || '',
          firstName: husbandMember?.first_name || marriage.husband?.firstName || '',
          lastName: husbandMember?.last_name || marriage.husband?.lastName || '',
          name: marriage.husband?.name || '',
          birthDate: husbandMember?.birth_date ? new Date(husbandMember.birth_date) : null,
          maritalStatus: 'married',
          isAlive: husbandMember?.is_alive ?? true,
          deathDate: husbandMember?.death_date ? new Date(husbandMember.death_date) : null,
          croppedImage: husbandMember?.image_url || null,
          biography: husbandMember?.biography || '', // Add missing biography field
          isFamilyMember: !!husbandMember, // If found in family members, it's a family member
          existingFamilyMemberId: husbandMember ? husbandMember.id : '',
          isSaved: true // Mark existing husband as saved
        };
        
        
        setHusband(husbandData);
      }
    }
  };

  
  // Unified spouse processing functions
  const processSpouses = async (submissionData, memberData, familyId, familyData, marriageResults, activeMarriageIds) => {
    // Handle wives for male members
    if (submissionData.gender === 'male' && wives.length > 0) {
      const savedWives = wives.filter(wife => {
        const wifeIndex = wives.findIndex(w => w === wife);
        const familyStatus = wiveFamilyStatus[wifeIndex];
        
        return wife.isSaved === true && 
               (familyStatus !== 'yes' || wife.existingFamilyMemberId);
      });
      
      for (const wife of savedWives) {
        await processSpouse({
          spouse: wife,
          spouseType: 'wife',
          memberData,
          familyId,
          familyData,
          marriageResults,
          activeMarriageIds,
          isMainMember: false
        });
      }
    }

    // Handle husband for female members
    if (submissionData.gender === 'female' && husband && husband.isSaved === true) {
      await processSpouse({
        spouse: husband,
        spouseType: 'husband',
        memberData,
        familyId,
        familyData,
        marriageResults,
        activeMarriageIds,
        isMainMember: true
      });
    }
  };

  const processSpouse = async ({ spouse, spouseType, memberData, familyId, familyData, marriageResults, activeMarriageIds, isMainMember }) => {
    try {
      let spouseId = spouse.existingFamilyMemberId;
      
      // Create or update spouse member
      spouseId = await createOrUpdateSpouseMember(spouse, spouseType, familyId, familyData);
      
      if (!spouseId) {
        marriageResults.failed++;
        marriageResults.details.push(`فشل في معالجة بيانات ${spouse.name}`);
        return;
      }

      // Update existing family member spouse status if needed
      if (spouse.isFamilyMember && spouse.existingFamilyMemberId) {
        await updateSpouseMemberStatus(spouse, spouseType);
      }

      // Create or update marriage record
      await createOrUpdateMarriage({
        memberData,
        spouseId,
        spouseType,
        spouse,
        familyId,
        activeMarriageIds,
        marriageResults,
        isMainMember
      });

    } catch (error) {
      console.error(`Error processing ${spouseType}:`, error);
      marriageResults.failed++;
      marriageResults.details.push(`خطأ في معالجة ${spouse.name}`);
    }
  };

  const createOrUpdateSpouseMember = async (spouse, spouseType, familyId, familyData) => {
    const isWife = spouseType === 'wife';
    
    // If spouse has existing ID, update the record
    if (spouse.existingFamilyMemberId && spouse.id) {
      // Get current image to handle image state properly
      const { data: currentSpouse } = await supabase
        .from('family_tree_members')
        .select('image_url')
        .eq('id', spouse.existingFamilyMemberId)
        .maybeSingle();
      
      // Handle image state properly
      let imageUrl;
      if (spouse.croppedImage !== undefined) {
        imageUrl = spouse.croppedImage || null;
      } else {
        imageUrl = currentSpouse?.image_url || null;
      }
      
      const spouseName = spouse.name || (spouse.firstName && spouse.lastName ? `${spouse.firstName} ${spouse.lastName}` : spouse.firstName || spouse.lastName || '');
      const { data: updatedSpouse, error: spouseUpdateError } = await supabase
        .from('family_tree_members')
        .update({
          name: spouseName,
          first_name: spouse.firstName || null,
          last_name: spouse.lastName || familyData?.name || null,
          birth_date: spouse.birthDate?.toISOString().split('T')[0] || null,
          is_alive: spouse.isAlive ?? true,
          death_date: !spouse.isAlive && spouse.deathDate ? spouse.deathDate.toISOString().split('T')[0] : null,
          marital_status: spouse.maritalStatus || 'married',
          image_url: imageUrl,
          biography: spouse.biography || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', spouse.existingFamilyMemberId)
        .select()
        .single();

      if (spouseUpdateError) {
        console.error(`Error updating ${spouseType} member:`, spouse.name, spouseUpdateError);
        throw spouseUpdateError;
      }
      
      return updatedSpouse.id;
    } else {
      // Create new spouse member
      const firstName = spouse.firstName || '';
      const lastName = spouse.lastName || familyData?.name || '';
      const spouseName = firstName && lastName ? `${firstName} ${lastName}` : (spouse.name || firstName || lastName || '');
      
      const { data: newSpouseMember, error: spouseError } = await supabase
        .from('family_tree_members')
        .insert({
          name: spouseName,
          first_name: firstName,
          last_name: lastName,
          gender: isWife ? 'female' : 'male',
          birth_date: spouse.birthDate?.toISOString().split('T')[0] || null,
          is_alive: spouse.isAlive ?? true,
          death_date: !spouse.isAlive && spouse.deathDate ? spouse.deathDate.toISOString().split('T')[0] : null,
          family_id: familyId,
          created_by: familyData?.creator_id,
          is_founder: false,
          marital_status: spouse.maritalStatus || 'married',
          image_url: spouse.croppedImage || null,
          biography: spouse.biography || null
        })
        .select()
        .single();

      if (spouseError) {
        console.error(`Error creating ${spouseType} member:`, spouse.name, spouseError);
        throw spouseError;
      }
      
      return newSpouseMember.id;
    }
  };

  const updateSpouseMemberStatus = async (spouse, spouseType) => {
    // Get current data to handle image state properly
    const { data: currentSpouse } = await supabase
      .from('family_tree_members')
      .select('image_url')
      .eq('id', spouse.existingFamilyMemberId)
      .maybeSingle();
    
    // Handle image state properly - preserve existing image if no new image provided
    let imageUrl;
    // Check if there's a new image or if we should preserve the existing one
    if (spouse.croppedImage && spouse.croppedImage !== currentSpouse?.image_url) {
      // New image provided
      imageUrl = spouse.croppedImage;
    } else {
      // No new image, preserve existing
      imageUrl = currentSpouse?.image_url || null;
    }
    
    const { error: updateSpouseError } = await supabase
      .from('family_tree_members')
      .update({ 
        marital_status: spouse.maritalStatus,
        image_url: imageUrl,
        biography: spouse.biography || null
      })
      .eq('id', spouse.existingFamilyMemberId);
    
    if (updateSpouseError) {
      console.error(`Error updating ${spouseType} marital status:`, updateSpouseError);
    } else {
      console.log(`Successfully updated ${spouseType} marital status to:`, spouse.maritalStatus);
    }

    // Also update marriage table marital status
    const spouseColumn = spouseType === 'wife' ? 'wife_id' : 'husband_id';
    await supabase
      .from('marriages')
      .update({ marital_status: spouse.maritalStatus })
      .eq(spouseColumn, spouse.existingFamilyMemberId);
  };

  const createOrUpdateMarriage = async ({ memberData, spouseId, spouseType, spouse, familyId, activeMarriageIds, marriageResults, isMainMember }) => {
    const isWife = spouseType === 'wife';
    const husbandId = isWife ? memberData.id : spouseId;
    const wifeId = isWife ? spouseId : memberData.id;

    // Check if marriage already exists
    const { data: existingMarriage } = await supabase
      .from('marriages')
      .select('id')
      .eq('husband_id', husbandId)
      .eq('wife_id', wifeId)
      .maybeSingle();

    let marriageError;
    if (existingMarriage) {
      // Update existing marriage to ensure it's active
      const { error } = await supabase
        .from('marriages')
        .update({
          is_active: true,
          marital_status: spouse.maritalStatus || 'married'
        })
        .eq('id', existingMarriage.id);
      marriageError = error;
      activeMarriageIds.push(existingMarriage.id);
    } else {
      // Create new marriage record
      const { data: newMarriage, error } = await supabase
        .from('marriages')
        .insert({
          family_id: familyId,
          husband_id: husbandId,
          wife_id: wifeId,
          is_active: true,
          marital_status: spouse.maritalStatus || 'married'
        })
        .select('id')
        .single();
      
      marriageError = error;
      if (newMarriage) {
        activeMarriageIds.push(newMarriage.id);
      }
    }

    if (marriageError) {
      console.error('Error creating/updating marriage:', marriageError);
      marriageResults.failed++;
      marriageResults.details.push(`خطأ في ربط الزواج مع ${spouse.name}`);
    } else {
      marriageResults.successful++;
      console.log(`Successfully processed marriage with ${spouse.name}`);
    }
  };

  const handleFormSubmit = useCallback(async (submissionData: any) => {
    try {
      setIsSaving(true);
      
      // Determine marital status based on presence of spouses
      const hasSpouses = submissionData.gender === "male" && wives.length > 0 || 
                        submissionData.gender === "female" && husband;
      
      // Prepare final submission data matching modal structure
      const finalData = {
        ...submissionData,
        maritalStatus: hasSpouses ? "married" : "single",
        wives: submissionData.gender === "male" ? wives : [],
        husband: submissionData.gender === "female" && husband ? husband : null
      };
      
      // Handle image state properly for edits:
      // - If image exists in submissionData.croppedImage, use it (user uploaded new image)
      // - If submissionData.croppedImage is explicitly null/empty string, set to null (user removed image)
      // - If submissionData.croppedImage is undefined, keep existing image
      let finalImageUrl;
      if (formMode === 'edit' && editingMember) {
        if (submissionData.croppedImage !== undefined) {
          finalImageUrl = submissionData.croppedImage || null;
        } else {
          finalImageUrl = editingMember.image_url || null;
        }
      } else {
        finalImageUrl = submissionData.croppedImage || null;
      }
      
      // Call the existing submission logic (same as modal)
      
      
      // Determine family relationship info based on selectedParent
      let fatherId = null;
      let motherId = null;
      let relatedPersonId = null;
      
      if (submissionData.selectedParent && submissionData.selectedParent !== "none") {
        const selectedMarriage = familyMarriages.find(m => m.id === submissionData.selectedParent);
        
        if (selectedMarriage) {
          fatherId = selectedMarriage.husband?.id || null;
          motherId = selectedMarriage.wife?.id || null;
          relatedPersonId = selectedMarriage.id;
          
        }
      }

      let isEditMode = formMode === 'edit' && editingMember;
      let memberData;

      if (isEditMode) {
        // Update existing member
        // Use first_name from formData directly
        const firstName = submissionData.first_name || submissionData.name || '';
        const lastName = familyData?.name || '';
        
        // Ensure name field is properly constructed
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName;
        
        const { data: updatedMember, error: updateError } = await supabase
          .from('family_tree_members')
          .update({
            name: fullName,
            first_name: firstName,
            last_name: lastName,
            gender: submissionData.gender,
            birth_date: submissionData.birthDate?.toISOString().split('T')[0] || null,
            is_alive: submissionData.isAlive,
            death_date: !submissionData.isAlive && submissionData.deathDate ? submissionData.deathDate.toISOString().split('T')[0] : null,
            biography: submissionData.bio || null,
            image_url: finalImageUrl,
            father_id: fatherId,
            mother_id: motherId,
            related_person_id: relatedPersonId,
            marital_status: finalData.maritalStatus || 'single',
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMember.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating family member:', updateError);
          throw updateError;
        }

        memberData = updatedMember;
        
      } else {
        // Insert new family member into database
        // Use first_name from formData directly
        const firstName = submissionData.first_name || submissionData.name || '';
        const lastName = familyData?.name || '';
        
        // Ensure name field is properly constructed
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName;
        
        const { data: newMember, error: memberError } = await supabase
          .from('family_tree_members')
          .insert({
            name: fullName,
            first_name: firstName,
            last_name: lastName,
            gender: submissionData.gender,
            birth_date: submissionData.birthDate?.toISOString().split('T')[0] || null,
            is_alive: submissionData.isAlive,
            death_date: !submissionData.isAlive && submissionData.deathDate ? submissionData.deathDate.toISOString().split('T')[0] : null,
            biography: submissionData.bio || null,
            image_url: submissionData.croppedImage || null,
            father_id: fatherId,
            mother_id: motherId,
            related_person_id: relatedPersonId,
            family_id: familyId,
            created_by: familyData?.creator_id,
            is_founder: submissionData.isFounder || false,
            marital_status: finalData.maritalStatus || 'single'
          })
          .select()
          .single();

        if (memberError) {
          console.error('Error adding family member:', memberError);
          throw memberError;
        }

        memberData = newMember;
        
      }

      // Track successful marriages for toast message
      let marriageResults = {
        successful: 0,
        failed: 0,
        details: []
      };

       // Handle marriages if applicable
       if (finalData.maritalStatus === 'married') {
         // Keep track of marriages that should remain active
         let activeMarriageIds = [];
         
         if (isEditMode) {
           // We'll manage marriage activation/deactivation more carefully
           // Don't deactivate all marriages upfront - we'll handle each case individually
         }

         // Handle wives for male members - process all saved wives
         if (submissionData.gender === 'male' && wives.length > 0) {
            const savedWives = wives.filter(wife => {
              // Get the wife's index to check family status
              const wifeIndex = wives.findIndex(w => w === wife);
              const familyStatus = wiveFamilyStatus[wifeIndex];
              
              // Only save if:
              // 1. Wife is marked as saved
              // 2. If wife is from family (familyStatus === 'yes'), must have existingFamilyMemberId
              return wife.isSaved === true && 
                     (familyStatus !== 'yes' || wife.existingFamilyMemberId);
            });
           for (const wife of savedWives) {
             try {
               let wifeId = wife.existingFamilyMemberId;
               
                 // If wife has an existing ID, update the existing record
                 if (wife.existingFamilyMemberId && wife.id) {
                   // Get current image to handle image state properly
                   const { data: currentWife } = await supabase
                     .from('family_tree_members')
                     .select('image_url')
                     .eq('id', wife.existingFamilyMemberId)
                     .maybeSingle();
                   
                   // Handle image state properly:
                   // - If image exists in wife.croppedImage, use it (user uploaded new image)
                   // - If wife.croppedImage is explicitly null/empty string, set to null (user removed image)
                   // - If wife.croppedImage is undefined, keep existing image
                   let imageUrl;
                   if (wife.croppedImage !== undefined) {
                     imageUrl = wife.croppedImage || null;
                   } else {
                     imageUrl = currentWife?.image_url || null;
                   }
                   
                   const wifeName = wife.name || (wife.firstName && wife.lastName ? `${wife.firstName} ${wife.lastName}` : wife.firstName || wife.lastName || '');
                     const { data: updatedWife, error: wifeUpdateError } = await supabase
                       .from('family_tree_members')
                        .update({
                          name: wifeName,
                         first_name: wife.firstName || null,
                         last_name: wife.lastName || familyData?.name || null,
                         birth_date: wife.birthDate?.toISOString().split('T')[0] || null,
                         is_alive: wife.isAlive ?? true,
                         death_date: !wife.isAlive && wife.deathDate ? wife.deathDate.toISOString().split('T')[0] : null,
                          marital_status: wife.maritalStatus || 'married',
                          image_url: imageUrl,
                          biography: wife.biography || null,
                          updated_at: new Date().toISOString()
                       })
                      .eq('id', wife.existingFamilyMemberId)
                      .select()
                      .single();

                    if (wifeUpdateError) {
                      console.error('Error updating wife member:', wife.name, wifeUpdateError);
                      marriageResults.failed++;
                      marriageResults.details.push(`فشل في تحديث بيانات ${wife.name}`);
                      continue;
                    }
                    
                    wifeId = updatedWife.id;
                 
               } else {
                   // If wife is not from existing family members, create new family member
                   const firstName = wife.firstName || '';
                   const lastName = wife.lastName || familyData?.name || '';
                   const wifeName = firstName && lastName ? `${firstName} ${lastName}` : (wife.name || firstName || lastName || '');
                   
                   const { data: newWifeMember, error: wifeError } = await supabase
                     .from('family_tree_members')
                      .insert({
                        name: wifeName,
                        first_name: firstName,
                        last_name: lastName,
                       gender: 'female',
                       birth_date: wife.birthDate?.toISOString().split('T')[0] || null,
                       is_alive: wife.isAlive ?? true,
                       death_date: !wife.isAlive && wife.deathDate ? wife.deathDate.toISOString().split('T')[0] : null,
                       family_id: familyId,
                       created_by: familyData?.creator_id,
                        is_founder: false,
                        marital_status: wife.maritalStatus || 'married',
                        image_url: wife.croppedImage || null,
                        biography: wife.biography || null
                     })
                    .select()
                    .single();

                  if (wifeError) {
                    console.error('Error creating wife member:', wife.name, wifeError);
                    marriageResults.failed++;
                    marriageResults.details.push(`فشل في إنشاء العضو ${wife.name}`);
                    continue;
                  }
                 
                 wifeId = newWifeMember.id;
                 
               }

                   // If wife is an existing family member, update their marital status and handle image properly
                   if (wife.isFamilyMember && wife.existingFamilyMemberId) {
                    // Get current data to handle image state properly
                    const { data: currentWife } = await supabase
                      .from('family_tree_members')
                      .select('image_url')
                      .eq('id', wife.existingFamilyMemberId)
                      .maybeSingle();
                    
                    // Handle image state properly:
                    // - If image exists in wife.croppedImage, use it (user uploaded new image)
                    // - If wife.croppedImage is explicitly null/empty string, set to null (user removed image)
                    // - If wife.croppedImage is undefined, keep existing image
                    let imageUrl;
                    if (wife.croppedImage !== undefined) {
                      imageUrl = wife.croppedImage || null;
                    } else {
                      imageUrl = currentWife?.image_url || null;
                    }
                    
                     const { error: updateWifeError } = await supabase
                       .from('family_tree_members')
                       .update({ 
                         marital_status: wife.maritalStatus,
                         image_url: imageUrl,
                         biography: wife.biography || null
                       })
                       .eq('id', wife.existingFamilyMemberId);
                    
                     if (updateWifeError) {
                       console.error('Error updating wife marital status:', updateWifeError);
                     } else {
                       console.log('Successfully updated wife marital status to:', wife.maritalStatus);
                     }

                     // Also update marriage table marital status
                     await supabase
                       .from('marriages')
                       .update({ marital_status: wife.maritalStatus })
                       .eq('wife_id', wife.existingFamilyMemberId);
                   }

                // Check if marriage already exists and update it, otherwise create new one
                const { data: existingMarriage } = await supabase
                  .from('marriages')
                  .select('id')
                  .eq('husband_id', memberData.id)
                  .eq('wife_id', wifeId)
                  .maybeSingle();

                let marriageError;
                if (existingMarriage) {
                  // Update existing marriage to ensure it's active
                  const { error } = await supabase
                    .from('marriages')
                    .update({
                      is_active: true
                    })
                    .eq('id', existingMarriage.id);
                  marriageError = error;
                 activeMarriageIds.push(existingMarriage.id);
                 
                } else {
                  // Create new marriage record
                  const { data: newMarriage, error } = await supabase
                    .from('marriages')
                    .insert({
                      family_id: familyId,
                      husband_id: memberData.id,
                      wife_id: wifeId,
                      is_active: true
                    })
                    .select('id')
                    .single();
                 marriageError = error;
                 if (newMarriage) {
                   activeMarriageIds.push(newMarriage.id);
                   
                 }
               }

              if (marriageError) {
                console.error('Error creating marriage with wife:', wife.name, marriageError);
                marriageResults.failed++;
                marriageResults.details.push(`فشل ربط الزواج مع ${wife.name}`);
              } else {
                marriageResults.successful++;
                marriageResults.details.push(`تم ربط الزواج مع ${wife.name}`);
                
              }
            } catch (error) {
              console.error('Marriage creation error:', error);
              marriageResults.failed++;
              marriageResults.details.push(`خطأ في ربط الزواج مع ${wife.name}`);
            }
          }
        }

        // Handle husband for female members - process if saved
        if (submissionData.gender === 'female' && husband && husband.isSaved === true) {
          try {
            let husbandId = husband.existingFamilyMemberId;
            
            // If husband is not from existing family members, create new family member first
            if (!husband.isFamilyMember || !husband.existingFamilyMemberId) {
              const firstName = husband.firstName || '';
              const lastName = husband.lastName || familyData?.name || '';
              const husbandName = firstName && lastName ? `${firstName} ${lastName}` : (husband.name || firstName || lastName || '');
              
              const { data: newHusbandMember, error: husbandError } = await supabase
                .from('family_tree_members')
                .insert({
                  name: husbandName,
                  first_name: firstName,
                  last_name: lastName,
                  gender: 'male',
                  birth_date: husband.birthDate?.toISOString().split('T')[0] || null,
                  is_alive: husband.isAlive ?? true,
                  death_date: !husband.isAlive && husband.deathDate ? husband.deathDate.toISOString().split('T')[0] : null,
                  family_id: familyId,
                  created_by: familyData?.creator_id,
                  is_founder: false,
                  marital_status: husband.maritalStatus || 'married',
                  image_url: husband.croppedImage || null,
                  biography: husband.biography || null
                })
                .select()
                .single();

              if (husbandError) {
                console.error('Error creating husband member:', husband.name, husbandError);
                marriageResults.failed++;
                marriageResults.details.push(`فشل في إنشاء العضو ${husband.name}`);
              } else {
                husbandId = newHusbandMember.id;
                
              }
            }

            // Create marriage record if husband was created/found successfully
            if (husbandId) {
              // If husband is an existing family member, update their marital status and handle image properly
              if (husband.isFamilyMember && husband.existingFamilyMemberId) {
                // Get current data to handle image state properly
                const { data: currentHusband } = await supabase
                  .from('family_tree_members')
                  .select('image_url')
                  .eq('id', husband.existingFamilyMemberId)
                  .maybeSingle();
                
                // Handle image state properly:
                // - If image exists in husband.croppedImage, use it (user uploaded new image)
                // - If husband.croppedImage is explicitly null/empty string, set to null (user removed image)
                // - If husband.croppedImage is undefined, keep existing image
                let imageUrl;
                if (husband.croppedImage !== undefined) {
                  imageUrl = husband.croppedImage || null;
                } else {
                  imageUrl = currentHusband?.image_url || null;
                }
                
                const { error: updateHusbandError } = await supabase
                  .from('family_tree_members')
                  .update({ 
                    marital_status: husband.maritalStatus,
                    image_url: imageUrl,
                    biography: husband.biography || null
                  })
                  .eq('id', husband.existingFamilyMemberId);
                
                if (updateHusbandError) {
                  console.error('Error updating husband marital status:', updateHusbandError);
                } else {
                  console.log('Successfully updated husband marital status to:', husband.maritalStatus);
                }

                // Also update marriage table marital status
                await supabase
                  .from('marriages')
                  .update({ marital_status: husband.maritalStatus })
                  .eq('husband_id', husband.existingFamilyMemberId);
                
              }

              // Check if marriage already exists and update it, otherwise create new one
              const { data: existingMarriage } = await supabase
                .from('marriages')
                .select('id')
                .eq('husband_id', husbandId)
                .eq('wife_id', memberData.id)
                .maybeSingle();

              let marriageError;
              if (existingMarriage) {
                // Update existing marriage
                const { error } = await supabase
                  .from('marriages')
                  .update({
                    is_active: true
                  })
                  .eq('id', existingMarriage.id);
                marriageError = error;
              } else {
                // Create new marriage record
                const { error } = await supabase
                  .from('marriages')
                  .insert({
                    family_id: familyId,
                    husband_id: husbandId,
                    wife_id: memberData.id,
                    is_active: true
                  });
                marriageError = error;
              }

              if (marriageError) {
                console.error('Error creating marriage with husband:', husband.name, marriageError);
                marriageResults.failed++;
                marriageResults.details.push(`فشل ربط الزواج مع ${husband.name}`);
              } else {
                marriageResults.successful++;
                marriageResults.details.push(`تم ربط الزواج مع ${husband.name}`);
                
              }
            }
          } catch (error) {
            console.error('Marriage creation error:', error);
            marriageResults.failed++;
            marriageResults.details.push(`خطأ في ربط الزواج مع ${husband.name}`);
           }
         }
         
          // Note: No automatic marriage deactivation - user manually deletes incorrect marriages
       }
       
       // Refresh family data to show updated information
      await refreshFamilyData();
      
      // Reset form state
      setFormMode('view');
      setCurrentStep(1);
      resetFormData();
      setWives([]);
      setHusband(null);
      
      // Show success toast with detailed information
      const actionText = isEditMode ? "تحديث" : "إضافة";
      const actionedText = isEditMode ? "تم تحديث" : "تم إضافة";
      let toastDescription = `${actionedText} العضو "${submissionData.name}" بنجاح`;
      
      // Add marriage information to toast
      if (marriageResults.successful > 0) {
        toastDescription += `\n✅ تم ربط ${marriageResults.successful} زواج بنجاح`;
      }
      
      if (marriageResults.failed > 0) {
        toastDescription += `\n❌ فشل في ربط ${marriageResults.failed} زواج`;
      }
      
      toast({
        title: `تم ${actionText} العضو بنجاح`,
        description: toastDescription,
        variant: "default"
      });

      // Show additional detailed toast if there were marriage operations
      if (marriageResults.successful > 0 || marriageResults.failed > 0) {
        setTimeout(() => {
          toast({
            title: "تفاصيل عمليات الزواج",
            description: marriageResults.details.join('\n'),
            variant: marriageResults.failed > 0 ? "destructive" : "default"
          });
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      
      let errorMessage = "حدث خطأ أثناء حفظ البيانات";
      
      // Provide more specific error messages
      if (error.message?.includes('duplicate')) {
        errorMessage = "يوجد عضو بنفس هذه البيانات مسبقاً";
      } else if (error.message?.includes('foreign key')) {
        errorMessage = "خطأ في الربط مع بيانات العائلة";
      } else if (error.message?.includes('permission')) {
        errorMessage = "ليس لديك صلاحية لتنفيذ هذا الإجراء";
      }
      
      toast({
        title: formMode === 'edit' ? "خطأ في التحديث" : "خطأ في الإضافة",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [formData, familyData, wives, husband, packageData, subscriptionData, editingMember, toast, t, refreshFamilyData]);

  const nextStep = () => {
    // Validate required fields for step 1
    if (currentStep === 1) {
      if (!formData.name?.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى إدخال الاسم الكامل",
          variant: "destructive"
        });
        return;
      }
      if (!formData.gender) {
        toast({
          title: "خطأ في البيانات", 
          description: "يرجى اختيار الجنس",
          variant: "destructive"
        });
        return;
      }
      if (!formData.selectedParent && !formData.isFounder) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى اختيار العلاقة العائلية",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (currentStep < 2) {
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
        <GlobalHeader />
        <div className="container mx-auto px-4 py-6">
          <FamilyBuilderNewSkeleton />
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

      <div className="relative z-10 pt-20">
        {/* Header Box from FamilyBuilder */}
        <div className="container mx-auto px-4 pt-2 pb-0">
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
                      <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent leading-loose">
                        {t('family_builder.family', 'عائلة')} {familyData?.name || t('family_builder.unspecified', 'غير محدد')}
                      </span>
                    </h1>
                  </div>
                </div>

                {/* Sample Statistics Section - Responsive */}
                <div className="flex justify-center items-center gap-4 sm:gap-6 lg:gap-8 flex-wrap pb-2 lg:pb-0">
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

        {/* Main Content */}
                <div className="container mx-auto px-4 pt-2 pb-6">
          <div className={cn(
            "grid gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-12"
          )}>
            {/* Form Panel - Right Side on Desktop */}
            <div className={cn(
              "space-y-6",
              isMobile ? "order-2" : "col-span-8 order-2"
            )}>
               <Card className="h-fit relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-white/30 dark:border-gray-600/30 shadow-xl">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-500/10 dark:to-gray-500/5 rounded-lg"></div>
                  <CardHeader className="relative">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {formMode === 'view' && <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                          {formMode === 'add' && <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                          {formMode === 'edit' && <Edit className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                          {formMode === 'profile' && <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-relaxed">
                             {formMode === 'view' && "معلومات العضو"}
                             {formMode === 'add' && "إضافة عضو جديد"}
                             {formMode === 'edit' && `تعديل معلومات ${editingMember?.name || 'العضو'}`}
                             {formMode === 'profile' && `ملف ${editingMember?.name || 'العضو'}`}
                           </span>
                        </div>
                         {formMode === 'profile' && (
                           <Button
                             type="button"
                             variant="outline"
                             onClick={currentStep === 1 ? handleCancelForm : prevStep}
                             className="flex items-center gap-2 font-arabic"
                             size="sm"
                           >
                             <ArrowLeft className="h-4 w-4" />
                             العودة
                           </Button>
                         )}
                      </CardTitle>

                     {/* Step Indicator for add/edit modes - positioned at far left in RTL */}
                     {(formMode === 'add' || formMode === 'edit') && (
                      <div className="flex items-center gap-3 order-2 ms-auto">
                        {[1, 2].map((step, index) => (
                          <div key={step} className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium border-2 transition-all duration-200",
                                currentStep >= step
                                  ? "bg-primary border-primary text-primary-foreground shadow-md"
                                  : "bg-background border-muted-foreground/30 text-muted-foreground"
                              )}
                            >
                              {currentStep > step ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                step
                              )}
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              currentStep >= step ? "text-primary" : "text-muted-foreground"
                            )}>
                              {step === 1 ? "المعلومات الأساسية" : "التفاصيل الإضافية"}
                            </span>
                            {index < 1 && (
                              <div className={cn(
                                "w-12 h-0.5 mx-2 transition-all duration-200",
                                currentStep > step ? "bg-primary" : "bg-muted-foreground/30"
                              )} />
                            )}
                          </div>
                        ))}
                      </div>
                     )}
                  </CardHeader>
                <CardContent className="relative p-2 sm:p-4 md:p-6 overflow-hidden">
                  {formMode === 'view' ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>اختر عضواً من القائمة لعرض أو تعديل بياناته</p>
                      <p className="text-sm mt-2">أو اضغط "إضافة عضو" لإضافة عضو جديد</p>
                    </div>
                  ) : formMode === 'profile' ? (
                    <MemberProfileView
                      member={editingMember}
                      onEdit={() => {
                        setFormMode('edit');
                        setCurrentStep(1);
                        populateFormData(editingMember);
                      }}
                      onDelete={() => handleDeleteMember(editingMember)}
                      onBack={() => setFormMode('view')}
                      familyMembers={familyMembers}
                      marriages={familyMarriages}
                    />
                  ) : (
                    <div className="space-y-6">

                      {/* Step Content */}
                      {currentStep === 1 && (
                           <div className="space-y-6">
                            <h3 className="text-xl font-bold font-arabic text-primary mb-6 pb-2 border-b border-border">المعلومات الأساسية</h3>
                             
                             {/* First row: Name (1/2), Gender (1/4), Birthdate (1/4) */}
                             <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-12 md:col-span-6">
                                    <Label htmlFor="first_name" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                      <UserCircle className="h-4 w-4 text-primary" />
                                      الاسم الأول *
                                   </Label>
                                    <Input
                                      id="first_name"
                                      value={formData.first_name}
                                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                      placeholder="أدخل الاسم الأول"
                                      className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm"
                                      required
                                    />
                                </div>
                              </div>
                              
                              {/* Second row: Gender (1/4), Birthdate (1/4) */}
                              <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-6 md:col-span-3">
                                   <Label htmlFor="gender" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                     <Zap className="h-4 w-4 text-primary" />
                                     الجنس *
                                  </Label>
                                  <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                                    <SelectTrigger className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm">
                                      <SelectValue placeholder="اختر الجنس" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-2">
                                      <SelectItem value="male" className="font-arabic rounded-md">ذكر</SelectItem>
                                      <SelectItem value="female" className="font-arabic rounded-md">أنثى</SelectItem>
                                    </SelectContent>
                                  </Select>
                               </div>
                                
                               <div className="col-span-6 md:col-span-3">
                                   <Label className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                     <CalendarDays className="h-4 w-4 text-primary" />
                                     تاريخ الميلاد
                                  </Label>
                                  <EnhancedDatePicker
                                    value={formData.birthDate}
                                    onChange={(date) => setFormData({...formData, birthDate: date})}
                                    placeholder="اختر تاريخ الميلاد"
                                    className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm"
                                  />
                               </div>
                             </div>
                             
                             {/* Second row: Family relation (1/2), Alive status (1/4), Death date (1/4) */}
                             <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-12 md:col-span-6">
                                   <Label htmlFor="parentRelation" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                     <UsersIcon className="h-4 w-4 text-primary" />
                                     العلاقة العائلية (الوالدين) *
                                    {formData.isFounder && (
                                      <span className="text-xs text-muted-foreground mr-2">(مؤسس العائلة - لا يحتاج لوالدين)</span>
                                    )}
                                  </Label>
                                   <SearchableDropdown
                                     options={
                                       loading || !familyMarriages || !familyMembers ? 
                                         [{ value: "loading", label: "جاري تحميل البيانات...", disabled: true }] :
                                         familyMarriages.length > 0 ? 
                                           familyMarriages
                                             .filter(marriage => marriage && marriage.id && marriage.husband && marriage.wife)
                                             .map((marriage) => {
                                               // Get full member details for proper naming
                                               const husbandMember = familyMembers.find(member => member?.id === marriage.husband?.id);
                                               const wifeMember = familyMembers.find(member => member?.id === marriage.wife?.id);
                                               
                                               let displayName = '';
                                               
                                               // Helper function to get father's name
                                               const getFatherName = (member: any) => {
                                                 const father = familyMembers.find(m => m?.id === member?.fatherId);
                                                 return father?.name || '';
                                               };
                                               
                                               // Helper function to get grandfather's name
                                               const getGrandfatherName = (member: any) => {
                                                 const father = familyMembers.find(m => m?.id === member?.fatherId);
                                                 if (father) {
                                                   const grandfather = familyMembers.find(m => m?.id === father?.fatherId);
                                                   return grandfather?.name || '';
                                                 }
                                                 return '';
                                               };
                                               
                                               // Helper function to build full genealogical name
                                               const buildFullName = (member: any) => {
                                                 if (!member) return '';
                                                 
                                                 let fullName = member.name || '';
                                                 const fatherName = getFatherName(member);
                                                 const grandfatherName = getGrandfatherName(member);
                                                 
                                                 if (fatherName) {
                                                   fullName += ` بن ${fatherName}`;
                                                   if (grandfatherName) {
                                                     fullName += ` بن ${grandfatherName}`;
                                                   }
                                                 }
                                                 
                                                 return fullName;
                                               };
                                               
                                                const familyMember = husbandMember ? buildFullName(husbandMember) : 'غير محدد';
                                                const spouse = wifeMember ? (wifeMember.name || 'غير محدد') : 'غير محدد';
                                                const heartIcon = marriage.marital_status === 'divorced' ? 'heart-crack' : 'heart';
                                                
                                                return {
                                                  value: marriage.id,
                                                  familyMember,
                                                  spouse,
                                                  heartIcon
                                                };
                                             }) :
                                           [{ value: "no-data", label: "لا توجد زيجات مسجلة في هذه العائلة", disabled: true }]
                                     }
                                     value={formData.selectedParent || ""}
                                     onValueChange={(value) => setFormData({...formData, selectedParent: value === "none" ? null : value})}
                                     disabled={loading || !familyMarriages || !familyMembers || formData.isFounder}
                                     placeholder={
                                       loading ? "جاري التحميل..." : 
                                       formData.isFounder ? "مؤسس العائلة - لا يحتاج لوالدين" : 
                                       "اختر الوالدين"
                                     }
                                     searchPlaceholder="ابحث عن الوالدين..."
                                     emptyMessage="لا توجد نتائج تطابق البحث"
                                   />
                               </div>
                              
                               <div className="col-span-6 md:col-span-3">
                                  <Label htmlFor="aliveStatus" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" />
                                    الحالة الحيوية
                                 </Label>
                                 <Select 
                                   value={formData.isAlive ? "alive" : "deceased"} 
                                   onValueChange={(value) => setFormData({...formData, isAlive: value === "alive"})}
                                 >
                                   <SelectTrigger className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm">
                                     <SelectValue placeholder="اختر الحالة الحيوية" />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-lg border-2">
                                     <SelectItem value="alive" className="font-arabic rounded-md">على قيد الحياة</SelectItem>
                                     <SelectItem value="deceased" className="font-arabic rounded-md">متوفى</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>

                                {!formData.isAlive && (
                                  <div className="col-span-6 md:col-span-3">
                                     <Label className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                       <Skull className="h-4 w-4 text-primary" />
                                       تاريخ الوفاة
                                    </Label>
                                    <EnhancedDatePicker
                                      value={formData.deathDate}
                                      onChange={(date) => setFormData({...formData, deathDate: date})}
                                      placeholder="اختر تاريخ الوفاة"
                                      className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm"
                                    />
                                  </div>
                                )}
                             </div>

                             <div>
                                <Label htmlFor="bio" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  السيرة الذاتية
                               </Label>
                               <Textarea
                                 id="bio"
                                 value={formData.bio}
                                 onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                 placeholder="أدخل معلومات إضافية عن العضو"
                                 rows={3}
                                 className="font-arabic rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm resize-none"
                               />
                              </div>

                             {/* Image Upload Section */}
                             {(formMode === 'add' || formMode === 'edit') && (

                             <div className="space-y-3">
                              <Label htmlFor="picture" className="text-sm font-medium text-foreground">الصورة الشخصية</Label>
                              
                              {(croppedImage || (editingMember && editingMember.image)) ? (
                                <div className="space-y-3">
                                  <div className="relative group flex justify-center">
                                    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20 p-3">
                                       <img 
                                         src={croppedImage || (editingMember && editingMember.image)} 
                                         alt="صورة العضو" 
                                         className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-lg"
                                       />
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-center gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      onClick={handleEditImage}
                                      className="h-8 px-3"
                                    >
                                      <Edit2 className="h-3 w-3 ml-1" />
                                      تعديل
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="destructive"
                                      onClick={handleDeleteImage}
                                      className="h-8 px-3"
                                    >
                                      <Trash2 className="h-3 w-3 ml-1" />
                                      حذف
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-300 ${
                                    isImageUploadEnabled 
                                      ? 'border-primary/40 cursor-pointer hover:border-primary/60' 
                                      : 'border-gray-300 opacity-70 cursor-not-allowed'
                                  }`}
                                  onClick={() => isImageUploadEnabled && fileInputRef.current?.click()}
                                >
                                  {isImageUploadEnabled ? (
                                    <div className="space-y-2">
                                      <Upload className="h-8 w-8 text-primary mx-auto" />
                                      <p className="text-sm font-medium text-foreground">انقر لرفع الصورة</p>
                                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF حتى 10MB</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                                      <p className="text-sm font-medium text-gray-500">رفع الصور غير متاح</p>
                                      <p className="text-xs text-gray-400">يتطلب اشتراك مدفوع</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                disabled={!isImageUploadEnabled}
                              />
                             </div>
                             )}
                         </div>
                       )}

                       {currentStep === 2 && (
                         <div className="space-y-4">
                           <h3 className="text-lg font-semibold">
                             {formData.gender === "male" ? "معلومات الزوجة/الزوجات" : "معلومات الزوج"}
                           </h3>
                           <p className="text-sm text-muted-foreground">
                             {formData.gender === "male" 
                               ? "أضف معلومات الزوجة أو الزوجات إذا كان متزوجاً"
                               : "أضف معلومات الزوج إذا كانت متزوجة"
                             }
                           </p>
                           
                             {formData.gender === "male" ? (
                               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                 {/* Wives Display Panel */}
                                 <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4 w-full">
                                     <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                       <Heart className="w-3 h-3 text-white" />
                                     </div>
                                     <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300 font-arabic">الزوجات</h4>
                                   </div>
                                   
                                   <div className="space-y-3">
                                     {wives.length === 0 ? (
                                       <div className="text-center py-8 text-muted-foreground">
                                         <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                         <p className="font-arabic">لم يتم إضافة زوجات بعد</p>
                                       </div>
                                     ) : (
                                       wives.map((wife, index) => (
                                            <div key={index} className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 border-2 border-dashed border-pink-400/60 dark:border-pink-500/60 min-h-[160px]">
                                              <div className="h-full flex flex-col justify-between">
                                                {/* Header Section */}
                                                <div className="flex items-start justify-between">
                                                  <div className="flex items-start gap-4 flex-1">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                                                      {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 font-arabic text-lg mb-2">
                                                        {wife.name || `الزوجة ${index + 1}`}
                                                      </h5>
                                                      
                                                      <div className="space-y-2">
                                                        
                                                        <div className="flex items-center gap-2">
                                                          {wife.isSaved && (
                                                            <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                                                              <Check className="h-3 w-3" />
                                                              محفوظة
                                                            </span>
                                                          )}
                                                          <span className="inline-flex items-center gap-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full text-xs font-medium">
                                                            <Heart className="h-3 w-3" />
                                                            زوجة
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                {/* Action Buttons at bottom */}
                                                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
                                                  {wife.isSaved && (
                                                    <Button
                                                      variant="secondary"
                                                      size="sm"
                                                      onClick={() => {
                                                        // إعادة تعيين جميع الزوجات إلى الحالة المحفوظة أولاً
                                                        const resetWives = wives.map(w => ({ ...w, isSaved: true }));
                                                        // ثم تعيين الزوجة المحددة للتعديل
                                                        const updatedWives = [...resetWives];
                                                        updatedWives[index] = { ...wife, isSaved: false };
                                                        setWives(updatedWives);
                                                        setCurrentWife(wife);
                                                        setShowWifeForm(true);
                                                        setWifeFamilyStatus(wife.isFamilyMember ? 'yes' : 'no');
                                                        
                                                        toast({
                                                          title: "وضع التعديل",
                                                          description: `يمكنك الآن تعديل بيانات الزوجة ${index + 1}`,
                                                          variant: "default"
                                                        });
                                                      }}
                                                      className="h-8 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 transition-all duration-300"
                                                    >
                                                      <Edit className="h-3 w-3 ml-1" />
                                                      تعديل
                                                    </Button>
                                                  )}
                                                 <Button
                                                   variant="outline"
                                                   size="sm"
                                                   onClick={() => handleSpouseDelete(wife, index)}
                                                   className="h-8 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 transition-all duration-300"
                                                 >
                                                   <X className="h-3 w-3 ml-1" />
                                                   حذف
                                                 </Button>
                                               </div>
                                               
                                               {/* Interactive Area */}
                                               {wife.isSaved && (
                                                 <div 
                                                   className="cursor-pointer hover:bg-pink-50/70 dark:hover:bg-pink-950/30 rounded-lg p-2 -m-1 transition-all duration-300 border border-transparent hover:border-pink-200 dark:hover:border-pink-700 mt-2"
                                                   onClick={() => handleSpouseEditAttempt('wife', wife, index)}
                                                 >
                                                   <p className="text-sm text-pink-600 dark:text-pink-400 font-arabic flex items-center gap-2">
                                                     <Edit className="h-4 w-4" />
                                                     انقر هنا لعرض وتعديل التفاصيل
                                                   </p>
                                                 </div>
                                               )}
                                              </div>
                                           </div>
                                       ))
                                     )}
                                   </div>
                                 </div>

                                  {/* Unified Wife Form */}
                                  <div className="space-y-4 lg:col-span-2">
                                    <div className="flex items-center gap-2 mb-4 w-full">
                                      <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                        <Heart className="w-3 h-3 text-white" />
                                      </div>
                                      <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300 font-arabic">إضافة زوجة</h4>
                                    </div>
                                    
                                      <SpouseForm
                                        spouseType="wife"
                                        spouse={currentWife || {
                                          id: '',
                                          firstName: '',
                                          lastName: '',
                                          name: '',
                                          isAlive: true,
                                          birthDate: null,
                                          deathDate: null,
                                          maritalStatus: 'married',
                                          isFamilyMember: false,
                                          existingFamilyMemberId: '',
                                          croppedImage: null,
                                          biography: '',
                                          isSaved: false
                                        }}
                                       onSpouseChange={setCurrentWife}
                                       familyMembers={familyMembers}
                                       selectedMember={selectedMember}
                                       commandOpen={wifeCommandOpen}
                                       onCommandOpenChange={setWifeCommandOpen}
                                       familyStatus={wifeFamilyStatus}
                                       onFamilyStatusChange={handleWifeFamilyStatusChange}
                                       onSave={handleWifeSave}
                                       onAdd={handleAddWife}
                                       onClose={handleCloseWifeEdit}
                                       showForm={showWifeForm}
                                    />
                                  </div>
                               </div>
                             ) : (
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                 {/* Husband Display Panel */}
                                 <div className="space-y-4">
                                   <div className="flex items-center gap-2 mb-4">
                                     <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center">
                                       <User className="w-3 h-3 text-white" />
                                     </div>
                                     <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 font-arabic">معلومات الزوج</h4>
                                   </div>
                                   
                                   <div className="space-y-3">
                                     {!husband ? (
                                       <div className="text-center py-8 text-muted-foreground">
                                         <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                         <p className="font-arabic">لم يتم إضافة زوج بعد</p>
                                       </div>
                                     ) : (
                                       <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-4 border-2 border-dashed border-blue-400/60 dark:border-blue-500/60">
                                         <div className="flex items-center justify-between">
                                           <div 
                                             className={cn(
                                               "flex items-center gap-3 flex-1",
                                               husband.isSaved ? "cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-lg p-2 -m-2 transition-colors" : ""
                                             )}
                                              onClick={() => {
                                                if (husband.isSaved) {
                                                  setHusband({ ...husband, isSaved: false });
                                                  setCurrentHusband(husband);
                                                  setShowHusbandForm(true);
                                                  setHusbandFamilyStatus(husband.isFamilyMember ? 'yes' : 'no');
                                                  
                                                  toast({
                                                    title: "وضع التعديل",
                                                    description: "يمكنك الآن تعديل بيانات الزوج",
                                                    variant: "default"
                                                  });
                                                }
                                              }}
                                           >
                                             <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                               <User className="w-4 h-4" />
                                             </div>
                                             <div>
                                               <h5 className="font-medium text-gray-900 dark:text-gray-100 font-arabic">
                                                 {husband.name || 'الزوج'}
                                               </h5>
                                               <p className="text-xs text-muted-foreground font-arabic flex items-center gap-1">
                                                 {husband.isFamilyMember ? 'من نفس العائلة' : 'خارج العائلة'}
                                                 {husband.isSaved && (
                                                   <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                                                     <Check className="h-3 w-3" />
                                                     محفوظ
                                                   </span>
                                                 )}
                                               </p>
                                               {husband.isSaved && (
                                                 <p className="text-xs text-blue-600 font-arabic mt-1">
                                                   انقر للتعديل
                                                 </p>
                                               )}
                                             </div>
                                           </div>
                                           <div className="flex gap-2">
                                              {husband.isSaved && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                   onClick={() => {
                                                     if (husband.isSaved) {
                                                       handleSpouseEditAttempt('husband', husband, -1);
                                                     }
                                                   }}
                                                 className="gap-1 border-blue-200/50 dark:border-blue-700/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300 h-8 px-2"
                                               >
                                                 <Edit className="h-3 w-3" />
                                               </Button>
                                             )}
                                             <Button
                                               variant="outline"
                                               size="sm"
                                               onClick={() => handleSpouseDelete(husband, -1)}
                                               className="gap-1 border-red-200/50 dark:border-red-700/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-300 h-8 px-2"
                                             >
                                               <X className="h-3 w-3" />
                                             </Button>
                                           </div>
                                         </div>
                                       </div>
                                     )}
                                   </div>
                                 </div>

                                 {/* Unified Husband Form */}
                                    <SpouseForm
                                      spouseType="husband"
                                      spouse={currentHusband || {
                                        id: '',
                                        firstName: '',
                                        lastName: '',
                                        name: '',
                                        isAlive: true,
                                        birthDate: null,
                                        deathDate: null,
                                        maritalStatus: 'married',
                                        isFamilyMember: false,
                                        existingFamilyMemberId: '',
                                        croppedImage: null,
                                        biography: '',
                                        isSaved: false
                                      }}
                                     onSpouseChange={setCurrentHusband}
                                    familyMembers={familyMembers}
                                    selectedMember={selectedMember}
                                    commandOpen={husbandCommandOpen}
                                    onCommandOpenChange={setHusbandCommandOpen}
                                    familyStatus={husbandFamilyStatus}
                                    onFamilyStatusChange={handleHusbandFamilyStatusChange}
                                    onSave={handleHusbandSave}
                                    onAdd={handleAddHusband}
                                    onClose={handleCloseHusbandEdit}
                                    showForm={showHusbandForm}
                                 />
                               </div>
                              )}
                          </div>
                       )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFormMode('view')}
                            size="lg"
                            className="flex items-center gap-2"
                          >
                            إلغاء
                          </Button>
                         
                         {currentStep < 2 ? (
                           <Button
                             type="button"
                             onClick={nextStep}
                             size="lg"
                             className="flex items-center gap-2"
                           >
                             التالي
                             <ArrowLeft className="h-4 w-4" />
                           </Button>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                size="lg"
                                className="flex items-center gap-2"
                              >
                                <ArrowRight className="h-4 w-4" />
                                العودة
                              </Button>
                              <Button
                                type="button"
                                onClick={() => handleFormSubmit(formData)}
                                disabled={isSaving}
                                size="lg"
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
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Member List - Left Side on Desktop */}
            <div className={cn(
              "space-y-4",
              isMobile ? "order-1" : "col-span-4 order-1"
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
                         onViewMember={handleViewMember}
                          onDeleteMember={handleDeleteMember}
                           onSpouseEditAttempt={handleSpouseEditWarning}
                          checkIfMemberIsSpouse={checkIfMemberIsSpouse}
                          searchTerm={searchTerm}
                          onSearchChange={setSearchTerm}
                          selectedFilter={selectedFilter}
                          onFilterChange={setSelectedFilter}
                          getAdditionalInfo={getAdditionalInfo}
                         getGenderColor={getGenderColor}
                         familyMembers={familyMembers}
                         marriages={familyMarriages}
                         memberListLoading={memberListLoading}
                         formMode={formMode}
                         onAddMember={handleAddMember}
                         packageData={packageData}
                        />
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-lg"></div>
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
                         onViewMember={handleViewMember}
                        onDeleteMember={handleDeleteMember}
                        onSpouseEditAttempt={handleSpouseEditWarning}
                        checkIfMemberIsSpouse={checkIfMemberIsSpouse}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        selectedFilter={selectedFilter}
                        onFilterChange={setSelectedFilter}
                        getAdditionalInfo={getAdditionalInfo}
                       getGenderColor={getGenderColor}
                       familyMembers={familyMembers}
                       marriages={familyMarriages}
                       memberListLoading={memberListLoading}
                       formMode={formMode}
                       onAddMember={handleAddMember}
                       packageData={packageData}
                     />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spouse deletion modal */}
      <AlertDialog open={showSpouseDeleteModal} onOpenChange={setShowSpouseDeleteModal}>
        <AlertDialogContent className="max-w-lg animate-scale-in">
          <div className="relative overflow-hidden">
            {/* Background gradient decoration */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 opacity-60"></div>
            
            {/* Header with warning icon */}
            <AlertDialogHeader className="relative z-10 text-center pb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-lg ring-4 ring-red-100">
                <AlertTriangle className="h-10 w-10 text-white animate-fade-in" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-gray-900 font-arabic mb-2">
                تأكيد حذف الزوجة
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 text-base leading-relaxed font-arabic whitespace-pre-line">
                {spouseDeleteWarning}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {/* Action buttons */}
            <AlertDialogFooter className="relative z-10 flex gap-3 pt-4">
              <AlertDialogCancel className="flex-1 h-12 text-base border-2 font-arabic hover:bg-gray-50 transition-all duration-300">
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmSpouseDelete}
                className="flex-1 h-12 text-base bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-arabic shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              >
                تأكيد الحذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>اقتصاص الصورة</DialogTitle>
            <DialogDescription>
              استخدم الأدوات أدناه لاقتصاص وتعديل الصورة كما تريد
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedImage && (
              <div className="relative h-96">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>التكبير</Label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCropDialog(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleCropSave}>
              حفظ الصورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keep existing delete modals */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent className="max-w-lg animate-scale-in">
          <div className="relative overflow-hidden">
            {/* Background gradient decoration */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 opacity-60"></div>
            
            {/* Header with warning icon */}
            <AlertDialogHeader className="relative z-10 text-center pb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-lg ring-4 ring-red-100">
                <AlertTriangle className="h-10 w-10 text-white animate-fade-in" />
              </div>
              <AlertDialogTitle className="font-arabic text-2xl text-gray-800 font-bold">
                تحذير حذف العضو
              </AlertDialogTitle>
            </AlertDialogHeader>

            {memberToDelete && (
              <div className="space-y-4 px-2">
                {/* Member being deleted */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border-2 border-red-200 animate-fade-in">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">العضو المراد حذفه</h3>
                      <p className="text-red-700 font-medium">{memberToDelete.name}</p>
                    </div>
                  </div>
                </div>

                {/* Items that will be deleted */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-fade-in">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-red-500" />
                      العناصر التي سيتم حذفها
                    </h3>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {(() => {
                      const spouses = familyMarriages
                        .filter((marriage: any) => marriage.husband?.id === memberToDelete.id || marriage.wife?.id === memberToDelete.id)
                        .map((marriage: any) => {
                          const spouseId = marriage.husband?.id === memberToDelete.id ? marriage.wife?.id : marriage.husband?.id;
                          return familyMembers.find(m => m.id === spouseId);
                        })
                        .filter(Boolean);

                      const children = familyMembers.filter(m => m.fatherId === memberToDelete.id || m.motherId === memberToDelete.id);
                      
                      const getAllDescendants = (parentId: string): any[] => {
                        const directChildren = familyMembers.filter(m => m.fatherId === parentId || m.motherId === parentId);
                        let allDescendants = [...directChildren];
                        directChildren.forEach(child => {
                          allDescendants = [...allDescendants, ...getAllDescendants(child.id)];
                        });
                        return allDescendants;
                      };

                      const allDescendants = getAllDescendants(memberToDelete.id);
                      const marriages = familyMarriages.filter((marriage: any) => 
                        marriage.husband?.id === memberToDelete.id || marriage.wife?.id === memberToDelete.id
                      );

                      return (
                        <>
                          {/* Main person */}
                          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                            <User className="h-4 w-4 text-red-600" />
                            <span className="text-red-800 font-medium">الشخص المحدد: {memberToDelete.name}</span>
                          </div>

                          {/* Spouses */}
                          {spouses.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                              <Heart className="h-4 w-4 text-pink-600" />
                              <div>
                                <span className="text-pink-800 font-medium">الأزواج: {spouses.length}</span>
                                <div className="text-sm text-pink-700 mt-1">
                                  {spouses.map((spouse, index) => (
                                    <span key={index}>
                                      {spouse?.name || 'غير معروف'}
                                      {index < spouses.length - 1 && ', '}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Children and descendants */}
                          {children.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <Users className="h-4 w-4 text-blue-600" />
                              <div>
                                <span className="text-blue-800 font-medium">
                                  الأطفال المباشرين: {children.length}
                                </span>
                                {allDescendants.length > children.length && (
                                  <div className="text-sm text-blue-700 mt-1">
                                    إجمالي الأحفاد: {allDescendants.length} شخص
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Marriages */}
                          {marriages.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <Heart className="h-4 w-4 text-purple-600" />
                              <span className="text-purple-800 font-medium">علاقات الزواج: {marriages.length}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Warning message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-yellow-800">
                      <p className="font-medium mb-1">تحذير هام:</p>
                      <p className="text-sm">
                        هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع البيانات المذكورة أعلاه نهائياً من شجرة العائلة.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter className="gap-3 pt-6">
            <AlertDialogCancel className="flex-1 hover:bg-gray-100">
              <X className="h-4 w-4 mr-2" />
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium shadow-lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Spouse edit warning modal - Creative Design */}
      <AlertDialog open={showSpouseEditWarning} onOpenChange={setShowSpouseEditWarning}>
        <AlertDialogContent className="max-w-md animate-scale-in">
          <div className="relative overflow-hidden">
            {/* Background gradient decoration */}
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 opacity-50"></div>
            
            {/* Header with icon */}
            <AlertDialogHeader className="relative z-10 text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-lg">
                <Heart className="h-8 w-8 text-white animate-fade-in" />
              </div>
              <AlertDialogTitle className="font-arabic text-xl text-gray-800 font-bold">
                تعديل محمي
              </AlertDialogTitle>
            </AlertDialogHeader>

            <AlertDialogDescription className="font-arabic text-center space-y-4 px-2">
              {/* Main message card */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200 animate-fade-in">
                 <div className="flex items-center justify-center mb-3">
                   <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-2">
                     <Users className="h-4 w-4 text-amber-600" />
                   </div>
                   <div className="text-gray-700 font-medium">
                     لا يمكن تعديل بيانات الزوج/الزوجة مباشرة
                   </div>
                 </div>
              </div>

              {/* Partner name highlight */}
              {spousePartnerDetails.name && (
                <div className="bg-white rounded-lg p-4 border-2 border-primary/20 shadow-sm animate-fade-in">
                   <div className="flex items-center justify-center mb-2">
                     <Edit className="h-5 w-5 text-primary mr-2" />
                     <div className="text-sm text-gray-600">للتعديل، انتقل إلى:</div>
                   </div>
                   <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
                     <div className="font-bold text-primary text-lg animate-pulse">
                       {spousePartnerDetails.name}
                     </div>
                     {spousePartnerDetails.fatherName && (
                       <div className="text-sm text-gray-600 mt-1">
                         ابن: <span className="font-medium text-gray-700">{spousePartnerDetails.fatherName}</span>
                       </div>
                     )}
                     {spousePartnerDetails.grandfatherName && (
                       <div className="text-xs text-gray-500 mt-1">
                         حفيد: <span className="font-medium text-gray-600">{spousePartnerDetails.grandfatherName}</span>
                       </div>
                     )}
                   </div>
                </div>
              )}

              {/* Info section */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 animate-fade-in">
                 <div className="flex items-start justify-center">
                   <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                     <Shield className="h-3 w-3 text-blue-600" />
                   </div>
                   <div className="text-xs text-blue-700 leading-relaxed">
                     هذا الإجراء يحافظ على سلامة البيانات والعلاقات العائلية المترابطة
                   </div>
                 </div>
              </div>
            </AlertDialogDescription>

            <AlertDialogFooter className="pt-6">
              <AlertDialogCancel className="font-arabic w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-300 text-gray-700 hover:text-gray-800 transition-all duration-200 hover-scale">
                <Check className="h-4 w-4 mr-2" />
                فهمت
              </AlertDialogCancel>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Package Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
              <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
              تطوير الباقة مطلوب
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2 text-center">
              لقد وصلت للحد الأقصى المسموح في باقتك الحالية
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  الحد الأقصى: {packageData?.max_family_members || 0} عضو
                </span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                باقتك الحالية تسمح بإضافة {packageData?.max_family_members || 0} أعضاء فقط.
              </p>
            </div>

            <p className="text-gray-600 dark:text-gray-300">
              لإضافة المزيد من أعضاء العائلة، يمكنك ترقية باقتك للحصول على المزيد من الميزات والإمكانيات.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => setShowUpgradeModal(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button 
              onClick={() => {
                setShowUpgradeModal(false);
                navigate('/plan-selection');
              }}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Crown className="h-4 w-4 ml-2" />
              ترقية الباقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GlobalFooter />
    </div>
  );
};

// Member List Component
const MemberList = ({ 
  members, 
  onEditMember,
  onViewMember, 
  onDeleteMember,
  onSpouseEditAttempt,
  checkIfMemberIsSpouse,
  searchTerm, 
  onSearchChange, 
  selectedFilter, 
  onFilterChange,
  getAdditionalInfo,
  getGenderColor,
  familyMembers,
  marriages,
  memberListLoading,
  formMode,
  onAddMember,
  packageData
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

      {/* Add Member Button */}
      {formMode === 'view' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onAddMember} 
                className="w-full flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {packageData && familyMembers.length >= packageData.max_family_members 
                  ? `تم الوصول للحد الأقصى (${packageData.max_family_members} أعضاء)`
                  : 'إضافة عضو جديد'
                }
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" side="top">
              {packageData && familyMembers.length >= packageData.max_family_members ? (
                <div className="text-center">
                  <p className="font-semibold text-destructive mb-1">
                    🚫 تم الوصول للحد الأقصى
                  </p>
                  <p className="text-sm">
                    باقتك الحالية تسمح بإضافة {packageData.max_family_members} أعضاء فقط
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    قم بترقية باقتك لإضافة المزيد من الأعضاء
                  </p>
                </div>
              ) : (
                <p className="text-sm">انقر لإضافة عضو جديد إلى الشجرة</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Member List */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
        {memberListLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 rounded-3xl border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 bg-white/50 dark:bg-gray-800/50">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          ))
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد أعضاء</p>
          </div>
        ) : (
          members.map((member: any) => (
            <Card 
              key={member.id} 
              className="relative cursor-pointer bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 hover:bg-white/95 dark:hover:bg-gray-800/95 transition-all duration-300 hover:shadow-lg rounded-3xl overflow-hidden"
              onClick={() => onViewMember(member)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 min-h-[80px]">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={member.image} />
                      <AvatarFallback className={getGenderColor(member.gender)}>
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Name */}
                      <div className="flex items-center gap-2">
                        {member.gender === 'male' ? (
                          <User className="h-3 w-3 text-blue-500" />
                        ) : (
                          <UserIcon className="h-3 w-3 text-pink-500" />
                        )}
                        <h3 className="font-semibold text-base font-arabic leading-tight">
                          {member.name}
                        </h3>
                        {(() => {
                          // Only show ابن/ابنة for blood family members (not founders, only descendants with fathers in the family)
                          const memberHasFamilyFather = member.fatherId && familyMembers?.find(m => m?.id === member.fatherId);
                          const isDescendant = !member.isFounder && memberHasFamilyFather;
                          
                          if (isDescendant) {
                            return (
                              <span className="text-xs text-muted-foreground font-normal">
                                {member.gender === 'female' ? 'ابنة' : 'ابن'}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      
                      {/* Father + Grandfather names */}
                      {(() => {
                        const father = familyMembers?.find(m => m?.id === member.fatherId);
                        const grandfather = father ? familyMembers?.find(m => m?.id === father.fatherId) : null;
                        
                        if (father && grandfather) {
                          return (
                            <p className="text-sm text-muted-foreground truncate font-arabic">
                              {father.name} ابن {grandfather.name}
                            </p>
                          );
                        } else if (father) {
                          return (
                            <p className="text-sm text-muted-foreground truncate font-arabic">
                              {father.name}
                            </p>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Spouse information - show founder text for founders, spouse info for non-family members */}
                      {(() => {
                        // Show founder text for founders
                        if (member.isFounder) {
                          return (
                            <p className="text-xs text-blue-600 dark:text-blue-400 truncate font-arabic">
                              الجد الأكبر للعائلة
                            </p>
                          );
                        }

                        // Find marriage where this member is husband or wife
                        const marriage = marriages?.find(m => 
                          (m.husband?.id === member.id || m.wife?.id === member.id) ||
                          (m.husband_id === member.id || m.wife_id === member.id)
                        );
                        
                        if (marriage) {
                          // Determine if this member is the husband or wife
                          const isHusband = (marriage.husband?.id === member.id) || (marriage.husband_id === member.id);
                          
                          // Get spouse data - try both nested object and direct ID approaches
                          let spouse;
                          let spouseId;
                          
                          if (isHusband) {
                            spouse = marriage.wife;
                            spouseId = marriage.wife_id;
                          } else {
                            spouse = marriage.husband;
                            spouseId = marriage.husband_id;
                          }
                          
                          // If spouse is not in nested object, find by ID
                          if (!spouse && spouseId) {
                            spouse = familyMembers?.find(m => m?.id === spouseId);
                          }
                          
                          if (spouse) {
                            // Check if current member is a non-family member (married into the family)
                            // A non-family member would not have father/grandfather in the family tree
                            const memberHasFamilyFather = member.fatherId && familyMembers?.find(m => m?.id === member.fatherId);
                            
                            // Only show spouse info for non-family members (those without family fathers)
                            if (!memberHasFamilyFather) {
                              // Get spouse's father and grandfather from familyMembers
                              const spouseFullData = familyMembers?.find(m => m?.id === spouse.id);
                              const spouseFather = familyMembers?.find(m => m?.id === (spouseFullData?.fatherId || spouse.fatherId));
                              const spouseGrandfather = spouseFather ? familyMembers?.find(m => m?.id === spouseFather.fatherId) : null;
                              
                              // Build the lineage string
                              let spouseInfo = spouse.name || spouse.full_name;
                              
                              if (spouseFather) {
                                // Use ابن for male, ابنة for female
                                const spouseGender = spouseFullData?.gender || spouse.gender;
                                const childOf = spouseGender === 'male' ? 'ابن' : 'ابنة';
                                spouseInfo += ` ${childOf} ${spouseFather.name}`;
                                
                                if (spouseGrandfather) {
                                  spouseInfo += ` ابن ${spouseGrandfather.name}`;
                                }
                              }
                              
                              // Use زوج for husband, زوجة for wife (from member's perspective)
                              const relationLabel = member.gender === 'male' ? 'زوج' : 'زوجة';
                              
                              return (
                                <p className="text-xs text-blue-600 dark:text-blue-400 truncate font-arabic">
                                  {relationLabel} {spouseInfo}
                                </p>
                              );
                            }
                          }
                        }
                        return null;
                      })()}
                      
                      {/* Birth date and other icons */}
                      <div className="flex items-center gap-2">
                        {member.birthDate && (
                          <DateDisplay 
                            date={member.birthDate} 
                            className="text-xs text-muted-foreground font-arabic"
                          />
                        )}
                        {member.isFounder && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                        {!member.isAlive && (
                          <Skull className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                   {/* Edit & Remove buttons at the most left */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                     {/* Only show edit button for non-spouse members */}
                     {!checkIfMemberIsSpouse(member) ? (
                       <Button
                         type="button"
                         size="sm"
                         variant="outline"
                           onClick={(e) => {
                             e.stopPropagation();
                             onEditMember(member);
                           }}
                         className="h-7 w-7 p-0 bg-white/80 hover:bg-white border border-gray-200 shadow-sm"
                       >
                         <Edit2 className="h-3 w-3 text-gray-600" />
                       </Button>
                     ) : (
                       <Button
                         type="button"
                         size="sm"
                         variant="outline"
                         onClick={(e) => {
                           e.stopPropagation();
                           onSpouseEditAttempt(member);
                         }}
                         className="h-7 w-7 p-0 bg-yellow-50/80 hover:bg-yellow-100 border border-yellow-200 shadow-sm"
                       >
                         <Edit2 className="h-3 w-3 text-yellow-600" />
                       </Button>
                     )}
                    
                     <Button
                       type="button"
                       size="sm"
                       variant="outline"
                         onClick={(e) => {
                           e.stopPropagation();
                           if (checkIfMemberIsSpouse(member)) {
                             onSpouseEditAttempt(member);
                           } else {
                             onDeleteMember(member);
                           }
                         }}
                       className={`h-7 w-7 p-0 border shadow-sm ${
                         checkIfMemberIsSpouse(member) 
                           ? 'bg-yellow-50/80 hover:bg-yellow-100 border-yellow-200' 
                           : 'bg-red-50/80 hover:bg-red-100 border-red-200'
                       }`}
                     >
                       <Trash2 className={`h-3 w-3 ${
                         checkIfMemberIsSpouse(member) ? 'text-yellow-600' : 'text-red-500'
                       }`} />
                     </Button>
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
