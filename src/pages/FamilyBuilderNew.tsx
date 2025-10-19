import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Gem } from "lucide-react";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Edit2, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop, Star, Sparkles, Image, Store, MoreVertical, Menu, ChevronsUpDown, Check, ChevronDown, Shield, AlertTriangle, UserCircle, Zap, Calendar as CalendarDays, UsersIcon, Activity, Share2, Link2, Eye, Copy, Download, Lock, Globe, Link, CheckCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDatabase, parseDateFromDatabase } from "@/lib/dateUtils";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { FamilyHeader } from "@/components/FamilyHeader";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { DateDisplay } from "@/components/DateDisplay";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadMemberImage, getMemberImageUrl, deleteMemberImage } from "@/utils/imageUpload";
import Cropper from "react-easy-crop";
import { useIsMobile } from "@/hooks/use-mobile";
import { SpouseForm, SpouseData } from "@/components/SpouseForm";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import FamilyBuilderNewSkeleton from "@/components/skeletons/FamilyBuilderNewSkeleton";
import MemberProfileSkeleton from "@/components/skeletons/MemberProfileSkeleton";
import { MemberProfileView } from "@/components/MemberProfileView";
import { TreeSettingsButton } from "@/pages/FamilyBuilderNew/components/TreeSettings/TreeSettingsButton";
import { MemberCard } from "@/pages/FamilyBuilderNew/components/MemberList/MemberCard";
import { TreeSettingsView } from "@/pages/FamilyBuilderNew/components/TreeSettings/TreeSettingsView";
import { CustomDomainCard } from "@/pages/FamilyBuilderNew/components/TreeSettings/CustomDomainCard";


const FamilyBuilderNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    hasAIFeatures
  } = useSubscription();
  const isMobile = useIsMobile();

  // Image Upload and Crop Component (consolidated states)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);
  const [crop, setCrop] = useState({
    x: 0,
    y: 0
  });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const image = document.createElement('img');
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => {
        resolve(blob);
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
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (croppedBlob) {
        // Store blob for upload, create preview URL for display
        const previewUrl = URL.createObjectURL(croppedBlob);
        setCroppedImage(previewUrl);
        setImageChanged(true);
        setShowCropDialog(false);
        // Store blob in a ref or state for later upload
        (window as any).__croppedImageBlob = croppedBlob;
      }
    }
  };
  const handleDeleteImage = async () => {
    try {
      // 1) Determine current image path
      let currentPath: string | null = editingMember?.image || null;
      if (!currentPath && editingMember?.id) {
        const { data } = await supabase
          .from('family_tree_members')
          .select('image_url')
          .eq('id', editingMember.id)
          .maybeSingle();
        currentPath = data?.image_url ?? null;
      }

      // 2) Delete preview URL if exists
      if (croppedImage && croppedImage.startsWith('blob:')) {
        URL.revokeObjectURL(croppedImage);
      }

      // 3) Remove from storage if it's a storage path
      if (currentPath && !currentPath.startsWith('data:image/') && !currentPath.startsWith('blob:')) {
        await deleteMemberImage(currentPath);
      }

      // 4) Update DB to null image_url if editing an existing member
      if (editingMember?.id) {
        await supabase
          .from('family_tree_members')
          .update({ image_url: null, updated_at: new Date().toISOString() })
          .eq('id', editingMember.id);
      }

      // 5) Update local state to reflect deletion immediately
      setCroppedImage(null);
      setSelectedImage(null);
      setImageChanged(true);
      (window as any).__croppedImageBlob = null;

      if (editingMember) {
        setEditingMember({ ...editingMember, image: null });
      }
      setFamilyMembers(prev => prev.map((m: any) => m.id === editingMember?.id ? { ...m, image: null } : m));

      // 6) Reset file input to allow re-upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 7) Toast
      toast({
        title: 'تم حذف الصورة',
        description: 'تم حذف صورة العضو بنجاح',
      });
    } catch (err) {
      console.error('Failed to delete image', err);
      toast({
        title: 'فشل حذف الصورة',
        description: 'حدث خطأ أثناء حذف الصورة. حاول مجددًا.',
        variant: 'destructive',
      });
    }
  };

  const handleEditImage = () => {
    // If we have the original image, show crop dialog
    if (selectedImage) {
      setShowCropDialog(true);
    } 
    // If editing existing image, trigger file upload
    else if (croppedImage || (editingMember && editingMember.image)) {
      fileInputRef.current?.click();
    }
  };

  // Get image upload permission state from top level
  const {
    isImageUploadEnabled,
    loading: uploadLoading
  } = useImageUploadPermission();
  const {
    toast
  } = useToast();
  const {
    t,
    direction
  } = useLanguage();
  const {
    notifications,
    profile
  } = useDashboardData();

  // Package and subscription data
  const [packageData, setPackageData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const familyId = searchParams.get('family');
  const treeId = searchParams.get('treeId');
  const isNew = searchParams.get('new') === 'true';
  const isEditMode = searchParams.get('edit') === 'true';
  const autoAdd = searchParams.get('autoAdd') === 'true';
  const [activeTab, setActiveTab] = useState("overview");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyMarriages, setFamilyMarriages] = useState([]);
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberListLoading, setMemberListLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [memberProfileData, setMemberProfileData] = useState(null);

  // Memoized generation count calculation
  const generationCount = useMemo(() => {
    if (familyMembers.length === 0) {
      return 1;
    }
    
    const generationMap = new Map();

    // Step 1: Find the founder and assign generation 1
    const founder = familyMembers.find(member => member.isFounder);
    if (founder) {
      generationMap.set(founder.id, 1);

      // Step 2: Find founder's spouse(s) from marriages and assign generation 1
      familyMarriages.forEach(marriage => {
        if (marriage.husband_id === founder.id && marriage.wife_id) {
          generationMap.set(marriage.wife_id, 1);
        } else if (marriage.wife_id === founder.id && marriage.husband_id) {
          generationMap.set(marriage.husband_id, 1);
        }
      });
    }

    // Step 3: Iteratively assign generations based on parent-child relationships
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      familyMembers.forEach(member => {
        if (generationMap.has(member.id)) return; // Skip if already assigned

        const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : null;
        const motherGeneration = member.motherId ? generationMap.get(member.motherId) : null;

        // If at least one parent has a generation, assign child generation
        if (fatherGeneration !== undefined && fatherGeneration !== null || motherGeneration !== undefined && motherGeneration !== null) {
          const parentGeneration = Math.max(fatherGeneration || 0, motherGeneration || 0);
          const childGeneration = parentGeneration + 1;
          generationMap.set(member.id, childGeneration);
          changed = true;

          // Step 4: Also assign the same generation to their spouse(s)
          familyMarriages.forEach(marriage => {
            let spouseId = null;
            if (marriage.husband_id === member.id && marriage.wife_id) {
              spouseId = marriage.wife_id;
            } else if (marriage.wife_id === member.id && marriage.husband_id) {
              spouseId = marriage.husband_id;
            }
            if (spouseId && !generationMap.has(spouseId)) {
              generationMap.set(spouseId, childGeneration);
              changed = true;
            }
          });
        }
      });
    }

    // Step 5: Assign generation 1 to any remaining members without parents (fallback)
    familyMembers.forEach(member => {
      if (!generationMap.has(member.id) && !member.fatherId && !member.motherId) {
        generationMap.set(member.id, 1);
      }
    });

    const maxGeneration = Math.max(...Array.from(generationMap.values()));
    return maxGeneration;
  }, [familyMembers, familyMarriages, loading]);
  const calculateGenerationCount = () => generationCount;

  // Memoized generation stats calculation to prevent re-computation on every render
  const getGenerationStats = useMemo(() => {
    if (familyMembers.length === 0) return [];
    const generationMap = new Map();

    // Step 1: Assign generation 1 to founders and members without parents
    familyMembers.forEach(member => {
      if (member.isFounder || !member.fatherId && !member.motherId) {
        generationMap.set(member.id, 1);
      }
    });

    // Step 2: Calculate generations based on parent-child relationships
    let changed = true;
    let maxIterations = familyMembers.length * 2;
    let iterations = 0;
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      familyMembers.forEach(member => {
        if (generationMap.has(member.id)) return;
        if (!member.fatherId && !member.motherId) {
          generationMap.set(member.id, 1);
          changed = true;
          return;
        }
        const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : null;
        const motherGeneration = member.motherId ? generationMap.get(member.motherId) : null;
        if (fatherGeneration !== undefined || motherGeneration !== undefined) {
          const parentGeneration = Math.max(fatherGeneration || 0, motherGeneration || 0);
          generationMap.set(member.id, parentGeneration + 1);
          changed = true;
        }
      });
    }
    const generationCounts = new Map();
    generationMap.forEach(generation => {
      generationCounts.set(generation, (generationCounts.get(generation) || 0) + 1);
    });
    return Array.from(generationCounts.entries()).sort((a, b) => a[0] - b[0]);
  }, [familyMembers]);

  // Form panel states
  const [formMode, setFormMode] = useState<'view' | 'add' | 'edit' | 'profile' | 'tree-settings'>(() => {
    // Check if settings parameter is present in URL
    const settingsParam = searchParams.get('settings');
    return settingsParam === 'true' ? 'tree-settings' : 'view';
  });
  const [editingMember, setEditingMember] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [relationshipPopoverOpen, setRelationshipPopoverOpen] = useState(false);

  // Mobile drawer state
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const fetchFamilyData = async () => {
    const startTime = performance.now();
    console.log('🚀 Starting family data fetch...');
    
    try {
      setLoading(true);
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const {
        data: userSubscription,
        error: subError
      } = await supabase.from('user_subscriptions').select(`
          *,
          packages:package_id (
            id,
            name,
            max_family_members,
            max_family_trees,
            features
          )
        `).eq('user_id', user.id).eq('status', 'active').order('created_at', {
        ascending: false
      }).limit(1).single();
      if (userSubscription && userSubscription.packages) {
        setPackageData(userSubscription.packages);
        setSubscriptionData(userSubscription);
      } else {
        const {
          data: freePackage
        } = await supabase.from('packages').select('*').ilike('name->en', 'Free').single();
        if (freePackage) setPackageData(freePackage);
      }
      if (!familyId) {
        throw new Error('No family ID provided');
      }
      const {
        data: family,
        error: familyError
      } = await supabase.from('families').select('*').eq('id', familyId).eq('creator_id', user.id).single();
      if (familyError) {
        console.error('Error fetching family:', familyError);
        throw familyError;
      }
      if (!family) {
        throw new Error('Family not found or access denied');
      }
      const familyToUse = family;
      setFamilyData(familyToUse);
      const {
        data: members,
        error: membersError
      } = await supabase.from('family_tree_members')
        .select('id, name, first_name, last_name, father_id, mother_id, spouse_id, related_person_id, is_founder, gender, birth_date, is_alive, death_date, marital_status')
        .eq('family_id', familyToUse.id);
      if (membersError) throw membersError;
      
      // Transform members data (declare at function scope for use in marriages)
      let transformedMembers = [];
      if (members) {
        transformedMembers = members.map(member => ({
          id: member.id,
          name: member.name,
          first_name: member.first_name,
          last_name: member.last_name,
          fatherId: member.father_id,
          motherId: member.mother_id,
          spouseId: member.spouse_id,
          relatedPersonId: member.related_person_id,
          isFounder: member.is_founder,
          gender: member.gender || 'male',
          birthDate: member.birth_date || '',
          isAlive: member.is_alive,
          deathDate: member.death_date || null,
          image: null,
          bio: '',
          marital_status: member.marital_status || 'single',
          relation: ""
        }));
        setFamilyMembers(transformedMembers);
      }
      const {
        data: marriages,
        error: marriagesError
      } = await supabase.from('marriages').select(`
          id,
          husband_id,
          wife_id,
          is_active,
          marital_status
        `).eq('family_id', familyToUse.id).eq('is_active', true);
      if (marriagesError) throw marriagesError;

      // ✨ OPTIMIZED: Match marriages with already-fetched members (NO extra queries!)
      let marriagesWithMembers = [];
      if (marriages && transformedMembers.length > 0) {
        marriagesWithMembers = marriages.map(marriage => {
          const husband = transformedMembers.find(m => m.id === marriage.husband_id);
          const wife = transformedMembers.find(m => m.id === marriage.wife_id);
          return {
            ...marriage,
            husband: husband ? {
              id: husband.id,
              name: husband.name,
              first_name: husband.first_name,
              last_name: husband.last_name,
              father_id: husband.fatherId,
              mother_id: husband.motherId,
              gender: husband.gender,
              birth_date: husband.birthDate,
              is_alive: husband.isAlive,
              death_date: husband.deathDate,
              image_url: husband.image,
              biography: husband.bio,
              marital_status: husband.marital_status
            } : null,
            wife: wife ? {
              id: wife.id,
              name: wife.name,
              first_name: wife.first_name,
              last_name: wife.last_name,
              father_id: wife.fatherId,
              mother_id: wife.motherId,
              gender: wife.gender,
              birth_date: wife.birthDate,
              is_alive: wife.isAlive,
              death_date: wife.deathDate,
              image_url: wife.image,
              biography: wife.bio,
              marital_status: wife.marital_status
            } : null
          };
        });
      }
      
      if (marriagesWithMembers) {
        setFamilyMarriages(marriagesWithMembers);
      }
      
      const endTime = performance.now();
      console.log(`✅ Family data loaded in ${(endTime - startTime).toFixed(0)}ms`);
      console.log(`📊 Stats: ${transformedMembers.length} members, ${marriagesWithMembers.length} marriages`);

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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      const familyId = new URLSearchParams(window.location.search).get('family');
      if (!familyId) throw new Error('Family ID not found in URL');
      const {
        data: family,
        error: familyError
      } = await supabase.from('families').select('*').eq('id', familyId).single();
      if (familyError) throw familyError;
      setFamilyData(family);

      // Fetch only essential member data for initial load
      const {
        data: members,
        error: membersError
      } = await supabase.from('family_tree_members').select(`
          id,
          name,
          first_name,
          last_name,
          father_id,
          mother_id,
          is_founder,
          gender,
          marital_status,
          biography,
          birth_date,
          death_date,
          is_alive,
          image_url
        `).eq('family_id', family.id);
      if (membersError) throw membersError;
      const transformedMembers = members.map(member => ({
        id: member.id,
        name: member.name,
        first_name: member.first_name,
        last_name: member.last_name,
        fatherId: member.father_id,
        motherId: member.mother_id,
        spouseId: null,
        // Will be filled from marriages
        relatedPersonId: null,
        isFounder: member.is_founder,
        gender: member.gender,
        birthDate: "",
        // Will be loaded when profile is viewed
        isAlive: true,
        deathDate: null,
        image: null,
        // Will be loaded when profile is viewed
        bio: "",
        // Will be loaded when profile is viewed
        marital_status: member.marital_status || 'single',
        relation: ""
      }));
      setFamilyMembers(transformedMembers);

      // Fetch minimal marriage data for initial load
      const {
        data: marriages,
        error: marriagesError
      } = await supabase.from('marriages').select(`
          id,
          husband_id,
          wife_id,
          is_active,
          marital_status
        `).eq('family_id', family.id).eq('is_active', true);
      if (marriagesError) throw marriagesError;

      // Create simplified marriage objects for initial load
      let marriagesWithMembers = [];
      if (marriages) {
        marriagesWithMembers = marriages.map(marriage => ({
          ...marriage,
          husband: {
            id: marriage.husband_id,
            name: "Loading..."
          },
          wife: {
            id: marriage.wife_id,
            name: "Loading..."
          }
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
    let isCancelled = false;
    const loadData = async () => {
      if (!isCancelled) {
        await fetchFamilyData();
      }
    };
    loadData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Auto-add member when autoAdd parameter is true and data is loaded
  useEffect(() => {
    if (autoAdd && !loading && familyData && formMode === 'view') {
      handleAddMember();
      // Remove autoAdd from URL to prevent reopening after cancel/save
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('autoAdd');
      navigate({ pathname: location.pathname, search: newParams.toString() }, { replace: true });
    }
  }, [autoAdd, loading, familyData, formMode]);

  // Load spouses when data is updated and there's a member being edited
  useEffect(() => {
    if (editingMember?.id && familyMarriages?.length > 0 && familyMembers?.length > 0) {
      loadExistingSpouses(editingMember);
    }
  }, [editingMember?.id, familyMarriages?.length, familyMembers?.length]);

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

  // Command states for search (keep legacy states for now)
  const [husbandCommandOpen, setHusbandCommandOpen] = useState(false);
  const [wivesCommandOpen, setWivesCommandOpen] = useState<{
    [key: number]: boolean;
  }>({});
  const [wiveFamilyStatus, setWiveFamilyStatus] = useState<{
    [key: number]: 'yes' | 'no' | null;
  }>({});

  // Unified spouse form states
  const [currentSpouse, setCurrentSpouse] = useState<SpouseData | null>(null);
  const [activeSpouseType, setActiveSpouseType] = useState<'wife' | 'husband' | null>(null);
  const [showSpouseForm, setShowSpouseForm] = useState(false);
  const [spouseCommandOpen, setSpouseCommandOpen] = useState(false);
  const [spouseFamilyStatus, setSpouseFamilyStatus] = useState<'yes' | 'no' | null>(null);
  const [editingWifeIndex, setEditingWifeIndex] = useState<number | null>(null);

  // Legacy state getters for backward compatibility
  const currentWife = activeSpouseType === 'wife' ? currentSpouse : null;
  const currentHusband = activeSpouseType === 'husband' ? currentSpouse : null;
  const showWifeForm = showSpouseForm && activeSpouseType === 'wife';
  const showHusbandForm = showSpouseForm && activeSpouseType === 'husband';
  const wifeCommandOpen = activeSpouseType === 'wife' ? spouseCommandOpen : false;
  const wifeFamilyStatus = activeSpouseType === 'wife' ? spouseFamilyStatus : null;
  const husbandFamilyStatus = activeSpouseType === 'husband' ? spouseFamilyStatus : null;

  // Unified spouse form handlers
  const handleSpouseFamilyStatusChange = (status: string) => {
    setSpouseFamilyStatus(status as 'yes' | 'no');
  };
  
  const handleAddSpouse = (spouseType: 'wife' | 'husband') => {
    setCurrentSpouse({
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
    setActiveSpouseType(spouseType);
    setShowSpouseForm(true);
  };

  // Legacy handlers for backward compatibility
  const handleWifeFamilyStatusChange = handleSpouseFamilyStatusChange;
  const handleHusbandFamilyStatusChange = handleSpouseFamilyStatusChange;
  const handleAddWife = () => handleAddSpouse('wife');
  const handleAddHusband = () => handleAddSpouse('husband');
  
  // Legacy setters for backward compatibility
  const setCurrentWife = (spouse: SpouseData | null) => {
    if (spouse === null) {
      if (activeSpouseType === 'wife') {
        setCurrentSpouse(null);
        setActiveSpouseType(null);
      }
    } else {
      setCurrentSpouse(spouse);
      setActiveSpouseType('wife');
    }
  };
  
  const setCurrentHusband = (spouse: SpouseData | null) => {
    if (spouse === null) {
      if (activeSpouseType === 'husband') {
        setCurrentSpouse(null);
        setActiveSpouseType(null);
      }
    } else {
      setCurrentSpouse(spouse);
      setActiveSpouseType('husband');
    }
  };
  
  const setShowWifeForm = (show: boolean) => {
    if (show) {
      setActiveSpouseType('wife');
      setShowSpouseForm(true);
    } else if (activeSpouseType === 'wife') {
      setShowSpouseForm(false);
      setActiveSpouseType(null);
    }
  };
  
  const setShowHusbandForm = (show: boolean) => {
    if (show) {
      setActiveSpouseType('husband');
      setShowSpouseForm(true);
    } else if (activeSpouseType === 'husband') {
      setShowSpouseForm(false);
      setActiveSpouseType(null);
    }
  };
  
  const setWifeCommandOpen = (open: boolean) => {
    if (activeSpouseType === 'wife') {
      setSpouseCommandOpen(open);
    }
  };
  
  const setWifeFamilyStatus = (status: 'yes' | 'no' | null) => {
    if (activeSpouseType === 'wife') {
      setSpouseFamilyStatus(status);
    }
  };
  
  const setHusbandFamilyStatus = (status: 'yes' | 'no' | null) => {
    if (activeSpouseType === 'husband') {
      setSpouseFamilyStatus(status);
    }
  };
  // Helper functions for localStorage spouse data management
  const saveSpouseDataToLocalStorage = (spouseType: 'wife' | 'husband', spouseData: any) => {
    try {
      const key = `family_builder_${familyId}_${spouseType}_data`;
      localStorage.setItem(key, JSON.stringify(spouseData));
    } catch (error) {
      console.warn('Failed to save spouse data to localStorage:', error);
    }
  };

  const loadSpouseDataFromLocalStorage = (spouseType: 'wife' | 'husband') => {
    try {
      const key = `family_builder_${familyId}_${spouseType}_data`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load spouse data from localStorage:', error);
      return null;
    }
  };

  const clearSpouseDataFromLocalStorage = () => {
    try {
      const wifeKey = `family_builder_${familyId}_wife_data`;
      const husbandKey = `family_builder_${familyId}_husband_data`;
      localStorage.removeItem(wifeKey);
      localStorage.removeItem(husbandKey);
    } catch (error) {
      console.warn('Failed to clear spouse data from localStorage:', error);
    }
  };

  // Deduplication helper for spouses
  const deduplicateSpouses = (spouses: any[]) => {
    const seen = new Set();
    return spouses.filter(spouse => {
      const id = spouse.id || spouse.existingFamilyMemberId;
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  };

  const handleSpouseSave = async (spouseType: 'wife' | 'husband') => {
    if (!currentSpouse || activeSpouseType !== spouseType) return;
    if (!currentSpouse) return;
    
    try {
      console.log('🔄 Saving spouse to LOCAL STATE ONLY (no DB write):', spouseType, currentSpouse.name);
      
      // Generate a temporary ID for new spouses if they don't have one
      let spouseId = currentSpouse.id;
      if (!spouseId || spouseId.startsWith('temp_')) {
        spouseId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Update local state with the spouse data (marked as saved for UI purposes)
      const updatedSpouse = {
        ...currentSpouse,
        id: spouseId,
        isSaved: true // Mark as saved in local state
      };
      
      if (spouseType === 'wife') {
        console.log('🔍 WIFE SAVE - Determining index logic...');
        console.log('🔍 currentSpouse.id:', currentSpouse.id);
        console.log('🔍 editingWifeIndex:', editingWifeIndex);
        console.log('🔍 wives array:', wives.map(w => ({
          id: w.id,
          name: w.name
        })));

        // First try to find by ID match (most reliable)
        let wifeIndex = wives.findIndex(w => w.id === currentSpouse.id);
        console.log('🔍 Index by ID match:', wifeIndex);

        // If no ID match and we have an editing index, use that
        if (wifeIndex === -1 && editingWifeIndex !== null && editingWifeIndex >= 0) {
          wifeIndex = editingWifeIndex;
          console.log('🔍 Using editingWifeIndex:', wifeIndex);
        }
        if (wifeIndex >= 0) {
          // Update existing wife - preserve original ID and database reference
          console.log('🔍 UPDATING existing wife at index:', wifeIndex);
          const existingWife = wives[wifeIndex];
          const updatedWife = {
            ...updatedSpouse,
            // Preserve original database ID if it exists
            id: existingWife.id || updatedSpouse.id,
            existingFamilyMemberId: existingWife.existingFamilyMemberId || updatedSpouse.existingFamilyMemberId,
            isSaved: true
          };
          console.log('🔍 Updated wife data:', {
            id: updatedWife.id,
            name: updatedWife.name,
            existingFamilyMemberId: updatedWife.existingFamilyMemberId
          });
          const updatedWives = [...wives];
          updatedWives[wifeIndex] = updatedWife;
          setWives(updatedWives);

          // Save updated wives list to localStorage
          saveSpouseDataToLocalStorage('wife', updatedWives);

          // Update originalWivesData to track changes for new members
          if (originalWivesData.length === 0 && formMode === 'add') {
            // For new members, initialize originalWivesData with the first save
            setOriginalWivesData([...updatedWives]);
          } else {
            // For existing members or subsequent saves, update the specific index
            const updatedOriginal = [...originalWivesData];
            if (updatedOriginal[wifeIndex]) {
              updatedOriginal[wifeIndex] = {
                ...updatedWife
              };
              setOriginalWivesData(updatedOriginal);
            }
          }
        } else {
          // Add new wife
          console.log('🔍 ADDING new wife');
          const newWives = [...wives, updatedSpouse];
          setWives(newWives);

          // Save updated wives list to localStorage
          saveSpouseDataToLocalStorage('wife', newWives);

          // Update originalWivesData for new members
          if (originalWivesData.length === 0 && formMode === 'add') {
            setOriginalWivesData([...newWives]);
          }
        }
        setEditingWifeIndex(null);
      } else {
        // Update husband
        setHusband(updatedSpouse);
        
        // Save husband to localStorage
        saveSpouseDataToLocalStorage('husband', updatedSpouse);
      }

      // Reset form state
      setCurrentSpouse(null);
      setActiveSpouseType(null);
      setShowSpouseForm(false);
      setSpouseFamilyStatus(null);
      
      toast({
        title: "تم حفظ البيانات محلياً",
        description: `تم حفظ بيانات ${spouseType === 'wife' ? 'الزوجة' : 'الزوج'} محلياً. سيتم حفظها في قاعدة البيانات عند حفظ العضو.`,
        variant: "default"
      });
    } catch (error) {
      console.error(`Error saving ${spouseType} data locally:`, error);
      toast({
        title: "خطأ في الحفظ المحلي",
        description: `حدث خطأ أثناء حفظ بيانات ${spouseType === 'wife' ? 'الزوجة' : 'الزوج'} محلياً`,
        variant: "destructive"
      });
    }
  };

  // Helper functions for spouse editing conflict management
  const checkForActiveSpouseEdit = () => {
    if (showWifeForm && editingWifeIndex !== null) {
      return {
        type: 'wife',
        index: editingWifeIndex
      };
    }
    if (showHusbandForm) {
      return {
        type: 'husband',
        index: -1
      };
    }
    return null;
  };
  const closeActiveSpouseEdit = () => {
    console.log('closeActiveSpouseEdit called, activeSpouseType:', activeSpouseType, 'showSpouseForm:', showSpouseForm, 'editingWifeIndex:', editingWifeIndex);
    
    if (activeSpouseType === 'wife' && showSpouseForm) {
      console.log('Closing wife form, current wives before close:', wives);

      // Ensure all wives are marked as saved when closing
      const updatedWives = wives.map(wife => ({
        ...wife,
        isSaved: true
      }));
      setWives(updatedWives);
      setEditingWifeIndex(null);
      console.log('Wife form closed, all wives marked as saved');
    }
    
    if (activeSpouseType === 'husband' && showSpouseForm) {
      console.log('Closing husband form, current husband before close:', husband);

      // Ensure husband is marked as saved when closing
      if (husband) {
        setHusband({
          ...husband,
          isSaved: true
        });
      }
      console.log('Husband form closed, husband marked as saved');
    }

    // Close the form
    setCurrentSpouse(null);
    setActiveSpouseType(null);
    setShowSpouseForm(false);
    setSpouseFamilyStatus('no');
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

    // Determine if this spouse is a family member - be more explicit
    const hasExistingFamilyId = Boolean(spouseData.existingFamilyMemberId && String(spouseData.existingFamilyMemberId).trim() !== '');
    const isExplicitlyFamilyMember = spouseData.isFamilyMember === true;
    const isSpouseFamilyMember = isExplicitlyFamilyMember && hasExistingFamilyId;
    const familyStatus = isSpouseFamilyMember ? 'yes' : 'no';
    console.log('Spouse edit detection:', { spouseType, name: spouseData?.name, isExplicitlyFamilyMember, hasExistingFamilyId, isSpouseFamilyMember, familyStatus, birthDate: spouseData?.birthDate, biography: spouseData?.biography });

    // Normalize spouse data to match SpouseForm interface
    const normalizedSpouseData = {
      id: spouseData.id || '',
      firstName: spouseData.firstName || spouseData.first_name || '',
      lastName: spouseData.lastName || spouseData.last_name || '',
      name: spouseData.name || `${spouseData.firstName || spouseData.first_name || ''} ${spouseData.lastName || spouseData.last_name || ''}`.trim(),
      isAlive: spouseData.isAlive !== undefined ? spouseData.isAlive : (spouseData.is_alive !== undefined ? spouseData.is_alive : true),
      birthDate: spouseData.birthDate instanceof Date ? spouseData.birthDate : (spouseData.birthDate ? new Date(spouseData.birthDate) : (spouseData.birth_date ? new Date(spouseData.birth_date) : null)),
      deathDate: spouseData.deathDate instanceof Date ? spouseData.deathDate : (spouseData.deathDate ? new Date(spouseData.deathDate) : (spouseData.death_date ? new Date(spouseData.death_date) : null)),
      maritalStatus: spouseData.maritalStatus || spouseData.marital_status || 'married',
      isFamilyMember: isSpouseFamilyMember,
      existingFamilyMemberId: spouseData.existingFamilyMemberId || '',
      croppedImage: spouseData.croppedImage || spouseData.image_url || null,
      biography: spouseData.biography || '',
      isSaved: spouseData.isSaved || false
    };

    // No active edit, proceed with editing
    if (spouseType === 'wife') {
      const updatedWives = [...wives];
      updatedWives[index] = {
        ...normalizedSpouseData,
        isSaved: false,
        isFamilyMember: isSpouseFamilyMember
      };
      setWives(updatedWives);
      setEditingWifeIndex(index);
    } else {
      setHusband({
        ...normalizedSpouseData,
        isSaved: false,
        isFamilyMember: isSpouseFamilyMember
      });
    }
    
    // Set unified spouse state with normalized data
    console.log('📝 Setting currentSpouse with data:', { name: normalizedSpouseData.name, birthDate: normalizedSpouseData.birthDate, biography: normalizedSpouseData.biography });
    setCurrentSpouse(normalizedSpouseData);
    setActiveSpouseType(spouseType);
    setShowSpouseForm(true);
    setSpouseFamilyStatus(familyStatus);
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
        ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
        canvas.toBlob(blob => {
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
  const [spouseToEdit, setSpouseToEdit] = useState({
    name: "",
    fatherName: "",
    grandfatherName: "",
    isFounder: false,
    first_name: ""
  });
  const [spousePartnerDetails, setSpousePartnerDetails] = useState({
    name: "",
    fatherName: "",
    grandfatherName: "",
    isFounder: false,
    first_name: ""
  });

  // Spouse deletion modal states
  const [showSpouseDeleteModal, setShowSpouseDeleteModal] = useState(false);
  const [spouseToDelete, setSpouseToDelete] = useState<{
    wife: any;
    index: number;
  } | null>(null);
  const [spouseDeleteWarning, setSpouseDeleteWarning] = useState("");

  // Track original wife data for change detection
  const [originalWivesData, setOriginalWivesData] = useState<any[]>([]);

  // Track original husband data for change detection  
  const [originalHusbandData, setOriginalHusbandData] = useState<any>(null);

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- Spouse rules helpers & delete handlers ---
  const checkIfMemberIsSpouse = useCallback((member: any) => {
    // Spouse: no parents in this family and not a founder
    return !member?.fatherId && !member?.motherId && !member?.isFounder;
  }, []);
  const getSpousePartnerName = (spouseMember: any) => {
    const marriage = familyMarriages.find((marriage: any) => marriage.husband?.id === spouseMember.id || marriage.wife?.id === spouseMember.id);
    if (!marriage) return "";
    if (marriage.husband?.id === spouseMember.id) {
      return marriage.wife?.name || "";
    } else {
      return marriage.husband?.name || "";
    }
  };
  const getSpousePartnerDetails = (spouseMember: any) => {
    const marriage = familyMarriages.find((marriage: any) => marriage.husband?.id === spouseMember.id || marriage.wife?.id === spouseMember.id);
    if (!marriage) return {
      name: "",
      fatherName: "",
      grandfatherName: ""
    };
    let partnerMember;
    if (marriage.husband?.id === spouseMember.id) {
      partnerMember = familyMembers.find(m => m.id === marriage.wife?.id);
    } else {
      partnerMember = familyMembers.find(m => m.id === marriage.husband?.id);
    }
    if (!partnerMember) return {
      name: "",
      fatherName: "",
      grandfatherName: ""
    };

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
    const marriage = familyMarriages.find((m: any) => m.husband?.id === spouseMember.id || m.wife?.id === spouseMember.id);
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

    // Set spouse partner details for the modal
    setSpousePartnerName(partner.name || "غير محدد");

    // Get the current member's father and grandfather information (the spouse who cannot be edited)
    const currentMember = familyMembers.find(m => m.id === spouseMember.id);
    const father = currentMember ? familyMembers.find(m => m.id === currentMember.father_id) : null;
    const fatherName = father?.name || "";

    // Get grandfather information (father's father)
    const grandfather = father ? familyMembers.find(m => m.id === father.father_id) : null;
    const grandfatherName = grandfather?.name || "";
    
    // Set spouse information (the person who cannot be edited - for dialog message)
    setSpouseToEdit({
      name: spouseMember.name || "غير محدد",
      fatherName: fatherName || "غير محدد",
      grandfatherName: grandfatherName || "غير محدد",
      isFounder: currentMember?.is_founder || false,
      first_name: spouseMember.first_name || "غير محدد"
    });
    
    // Set partner information (the person who can be edited - for navigation)
    setSpousePartnerDetails({
      name: partner.name || "غير محدد",
      fatherName: fatherName || "غير محدد",
      grandfatherName: grandfatherName || "غير محدد",
      isFounder: currentMember?.is_founder || false,
      first_name: partner.first_name || "غير محدد"
    });

    // Show the spouse edit warning modal
    setShowSpouseEditWarning(true);
  };
  const handleSpouseDeleteWarning = (spouseMember: any) => {
    // Close any active spouse editing forms first
    closeActiveSpouseEdit();

    // Find the marriage where this spouse belongs
    const marriage = familyMarriages.find((m: any) => m.husband?.id === spouseMember.id || m.wife?.id === spouseMember.id);
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

    // Set spouse partner details for the modal
    setSpousePartnerName(partner.name || "غير محدد");

    // Get the current member's father and grandfather information (not the partner's)
    const currentMember = familyMembers.find(m => m.id === spouseMember.id);
    const father = currentMember ? familyMembers.find(m => m.id === currentMember.father_id) : null;
    const fatherName = father?.name || "";

    // Get grandfather information (father's father)
    const grandfather = father ? familyMembers.find(m => m.id === father.father_id) : null;
    const grandfatherName = grandfather?.name || "";
    setSpousePartnerDetails({
      name: partner.name || "غير محدد",
      fatherName: fatherName || "غير محدد",
      grandfatherName: grandfatherName || "غير محدد",
      isFounder: currentMember?.is_founder || false,
      first_name: partner.first_name || "غير محدد"
    });

    // Show the spouse edit warning modal (same for delete)
    setShowSpouseEditWarning(true);
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
    const memberMarriages = familyMarriages.filter((marriage: any) => marriage.husband?.id === member.id || marriage.wife?.id === member.id);

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
        const childMarriages = familyMarriages.filter((marriage: any) => marriage.husband?.id === child.id || marriage.wife?.id === child.id);
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
        const {
          error: marriageError
        } = await supabase.from('marriages').delete().in('id', Array.from(marriagesToDelete));
        if (marriageError) throw marriageError;
      }

      // Then delete family members
      if (membersToDelete.size > 0) {
        const {
          error: memberError
        } = await supabase.from('family_tree_members').delete().in('id', Array.from(membersToDelete));
        if (memberError) throw memberError;
      }

      // Update local state
      setFamilyMembers(familyMembers.filter(m => !membersToDelete.has(m.id)));
      setFamilyMarriages(familyMarriages.filter((marriage: any) => !marriagesToDelete.has(marriage.id)));
      toast({
        title: t('family_builder.deleted', 'تم الحذف بنجاح'),
        description: `تم حذف ${membersToDelete.size} عضو و ${marriagesToDelete.size} علاقة زواج من شجرة العائلة`
      });

      // Refresh family data to reflect changes in the member list
      await fetchFamilyData();
    } catch (error) {
      console.error('Error in cascading delete:', error);
      throw error;
    }
  };
  const handleDeleteMember = useCallback(async (memberOrId: any) => {
    const id = typeof memberOrId === 'string' ? memberOrId : memberOrId?.id;
    const member = familyMembers.find(m => m.id === id);
    if (!member) {
      toast({
        title: t('family_builder.error', 'خطأ'),
        description: t('family_builder.member_not_found', 'العضو غير موجود'),
        variant: 'destructive'
      });
      return;
    }
    if (member.isFounder) {
      toast({
        title: t('family_builder.warning', 'تحذير'),
        description: t('family_builder.cannot_delete_founder', 'لا يمكن حذف مؤسس العائلة'),
        variant: 'destructive'
      });
      return;
    }
    setMemberToDelete(member);

    // Get detailed information about what will be deleted
    const spouses = familyMarriages.filter((marriage: any) => marriage.husband?.id === member.id || marriage.wife?.id === member.id).map((marriage: any) => {
      const spouseId = marriage.husband?.id === member.id ? marriage.wife?.id : marriage.husband?.id;
      return familyMembers.find(m => m.id === spouseId);
    }).filter(Boolean);
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
    const marriages = familyMarriages.filter((marriage: any) => marriage.husband?.id === member.id || marriage.wife?.id === member.id);
    const isSpouse = checkIfMemberIsSpouse(member);
    if (isSpouse) {
      setDeleteModalType('spouse');
      setDeleteWarningMessage(`تحذير: حذف هذا الزوج/الزوجة سيؤدي إلى:\n` + `- حذف الشخص نفسه\n` + `- إزالة علاقة الزواج\n` + (children.length > 0 ? `- حذف ${children.length} من الأطفال وجميع أحفادهم (${allDescendants.length} شخص إجمالي)\n` : '') + `هل أنت متأكد من المتابعة؟`);
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
      toast({
        title: t('family_builder.error', 'خطأ'),
        description: t('family_builder.delete_error', 'حدث خطأ أثناء حذف العضو'),
        variant: 'destructive'
      });
    }
  };

  // Helper function to check if wife data has changed
  const hasWifeDataChanged = (wife: any, index: number) => {
    const original = originalWivesData[index];
    if (!original && wife.isSaved) return false; // New wife that's saved
    if (!original) return true; // New unsaved wife

    return wife.name !== original.name || wife.isAlive !== original.isAlive || wife.maritalStatus !== original.maritalStatus || wife.isFamilyMember !== original.isFamilyMember || (wife.birthDate?.getTime() || 0) !== (original.birthDate?.getTime() || 0) || (wife.deathDate?.getTime() || 0) !== (original.deathDate?.getTime() || 0);
  };

  // Handle spouse deletion with modal
  const handleSpouseDelete = (spouse: any, index: number) => {
    console.log('🚨 SPOUSE DELETE CLICKED:', {
      spouseName: spouse?.name,
      index: index,
      isHusband: index === -1,
      spouseId: spouse?.id
    });
    const isHusband = index === -1;
    const spouseName = spouse?.name || (isHusband ? 'الزوج' : 'الزوجة');

    // Find children of this spouse
    const spouseChildren = familyMembers.filter(member => member.mother_id === spouse.id || member.father_id === spouse.id);

    // Get all descendants
    const getAllSpouseDescendants = (memberId: string): any[] => {
      const children = familyMembers.filter(member => member.father_id === memberId || member.mother_id === memberId);
      let descendants = [...children];
      children.forEach(child => {
        descendants = [...descendants, ...getAllSpouseDescendants(child.id)];
      });
      return descendants;
    };
    const allDescendants = getAllSpouseDescendants(spouse.id);
    let warningMessage = `تحذير: حذف ${isHusband ? 'هذا الزوج' : 'هذه الزوجة'} سيؤدي إلى:\n`;
    warningMessage += `- حذف ${isHusband ? 'الزوج' : 'الزوجة'}: ${spouseName}\n`;
    warningMessage += `- إزالة علاقة الزواج\n`;
    if (spouseChildren.length > 0) {
      warningMessage += `- حذف ${spouseChildren.length} من الأطفال\n`;
    }
    if (allDescendants.length > spouseChildren.length) {
      warningMessage += `- حذف جميع الأحفاد (${allDescendants.length} شخص إجمالي)\n`;
    }
    warningMessage += `\nسيتم التأكيد النهائي عند حفظ بيانات العضو الحالي.\nهل تريد المتابعة؟`;
    console.log('🚨 SETTING SPOUSE TO DELETE:', {
      spouse,
      index
    });
    setSpouseToDelete({
      wife: spouse,
      index
    });
    setSpouseDeleteWarning(warningMessage);
    setShowSpouseDeleteModal(true);
    console.log('🚨 DELETE MODAL SHOULD BE SHOWN NOW');
  };

  // Confirm spouse deletion (immediate database deletion)
  const confirmSpouseDelete = async () => {
    console.log('🚨 CONFIRM SPOUSE DELETE CALLED');
    if (!spouseToDelete) {
      console.log('❌ No spouse to delete');
      return;
    }
    
    const { wife, index } = spouseToDelete;
    console.log('🚨 DELETING SPOUSE:', { wife: wife?.name, index });
    
    try {
      if (index === -1) {
        // This is a husband deletion
        console.log('🚨 DELETING HUSBAND');
        
        if (husband && husband.isSaved && editingMember) {
          const husbandId = husband.id || husband.existingFamilyMemberId;
          
          // Delete marriage record
          const { error: marriageDeleteError } = await supabase
            .from('marriages')
            .delete()
            .eq('wife_id', editingMember.id)
            .eq('husband_id', husbandId);
            
          if (marriageDeleteError) {
            console.error('Error deleting marriage:', marriageDeleteError);
            toast({
              title: "خطأ في الحذف",
              description: "فشل في حذف علاقة الزواج",
              variant: "destructive"
            });
            return;
          }
          
          // If husband is not a family member, delete his record
          if (!husband.isFamilyMember) {
            const { error: husbandDeleteError } = await supabase
              .from('family_tree_members')
              .delete()
              .eq('id', husbandId);
              
            if (husbandDeleteError) {
              console.error('Error deleting husband member:', husbandDeleteError);
              toast({
                title: "خطأ في الحذف",
                description: "فشل في حذف بيانات الزوج",
                variant: "destructive"
              });
              return;
            }
          } else {
            // Update family member husband to single
            await supabase
              .from('family_tree_members')
              .update({ marital_status: 'single' })
              .eq('id', husbandId);
          }
        }
        
        setHusband(null);
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف الزوج نهائياً",
          variant: "default"
        });
      } else {
        // This is a wife deletion
        console.log('🚨 DELETING WIFE AT INDEX:', index);
        
        const wifeToDelete = wives[index];
        if (wifeToDelete && wifeToDelete.isSaved && editingMember) {
          const wifeId = wifeToDelete.id || wifeToDelete.existingFamilyMemberId;
          
          // Delete marriage record
          const { error: marriageDeleteError } = await supabase
            .from('marriages')
            .delete()
            .eq('husband_id', editingMember.id)
            .eq('wife_id', wifeId);
            
          if (marriageDeleteError) {
            console.error('Error deleting marriage:', marriageDeleteError);
            toast({
              title: "خطأ في الحذف",
              description: "فشل في حذف علاقة الزواج",
              variant: "destructive"
            });
            return;
          }
          
          // If wife is not a family member, delete her record
          if (!wifeToDelete.isFamilyMember) {
            const { error: wifeDeleteError } = await supabase
              .from('family_tree_members')
              .delete()
              .eq('id', wifeId);
              
            if (wifeDeleteError) {
              console.error('Error deleting wife member:', wifeDeleteError);
              toast({
                title: "خطأ في الحذف",
                description: "فشل في حذف بيانات الزوجة",
                variant: "destructive"
              });
              return;
            }
          } else {
            // Update family member wife to single
            await supabase
              .from('family_tree_members')
              .update({ marital_status: 'single' })
              .eq('id', wifeId);
          }
        }
        
        const newWives = wives.filter((_, i) => i !== index);
        setWives(newWives);

        // Update family status object
        const newStatus = { ...wiveFamilyStatus };
        delete newStatus[index];
        const reindexedStatus: { [key: number]: 'yes' | 'no' | null; } = {};
        Object.keys(newStatus).forEach((key, newIndex) => {
          const oldIndex = parseInt(key);
          if (oldIndex > index) {
            reindexedStatus[newIndex] = newStatus[oldIndex];
          } else if (oldIndex < index) {
            reindexedStatus[oldIndex] = newStatus[oldIndex];
          }
        });
        setWiveFamilyStatus(reindexedStatus);
        
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف الزوجة نهائياً",
          variant: "default"
        });
      }
      
      // Refresh family data to reflect changes
      await fetchFamilyData();
      
    } catch (error) {
      console.error('Error during spouse deletion:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء عملية الحذف",
        variant: "destructive"
      });
    }
    
    setShowSpouseDeleteModal(false);
    setSpouseToDelete(null);
    console.log('🚨 SPOUSE DELETE COMPLETED');
  };
  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || selectedFilter === "alive" && member.isAlive || selectedFilter === "deceased" && !member.isAlive || selectedFilter === "male" && member.gender === "male" || selectedFilter === "female" && member.gender === "female" || selectedFilter === "founders" && member.isFounder;
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

  // Fetch detailed member profile data
  const fetchMemberProfile = async (memberId: string) => {
    try {
      setProfileLoading(true);

      // Fetch complete member details
      const {
        data: memberData,
        error: memberError
      } = await supabase.from('family_tree_members').select('*').eq('id', memberId).single();
      if (memberError) throw memberError;

      // Fetch member's marriages with spouse details
      const {
        data: marriages,
        error: marriagesError
      } = await supabase.from('marriages').select(`
          id,
          husband_id,
          wife_id,
          is_active,
          marital_status
        `).eq('family_id', familyId).eq('is_active', true).or(`husband_id.eq.${memberId},wife_id.eq.${memberId}`);
      if (marriagesError) throw marriagesError;

      // Get detailed marriage data with member info
      let memberMarriages = [];
      if (marriages) {
        memberMarriages = await Promise.all(marriages.map(async marriage => {
          const [husbandResult, wifeResult] = await Promise.all([supabase.from('family_tree_members').select('*').eq('id', marriage.husband_id).single(), supabase.from('family_tree_members').select('*').eq('id', marriage.wife_id).single()]);
          return {
            ...marriage,
            husband: husbandResult.data,
            wife: wifeResult.data
          };
        }));
      }

      // Transform member data
      const transformedMember = {
        id: memberData.id,
        name: memberData.name,
        first_name: memberData.first_name,
        last_name: memberData.last_name,
        fatherId: memberData.father_id,
        motherId: memberData.mother_id,
        spouseId: memberData.spouse_id,
        relatedPersonId: memberData.related_person_id,
        isFounder: memberData.is_founder,
        gender: memberData.gender,
        birthDate: memberData.birth_date || "",
        isAlive: memberData.is_alive,
        deathDate: memberData.death_date || null,
        image: memberData.image_url || null,
        bio: memberData.biography || "",
        marital_status: memberData.marital_status || 'single',
        relation: ""
      };

      // Update local state with fresh data
      setMemberProfileData(transformedMember);
      setEditingMember(transformedMember);

      // Update the member in familyMembers array
      setFamilyMembers(prev => prev.map(m => m.id === memberId ? transformedMember : m));

      // Update marriages if this member's marriages changed
      if (memberMarriages.length > 0) {
        setFamilyMarriages(prev => {
          const updatedMarriages = [...prev];
          memberMarriages.forEach(newMarriage => {
            const existingIndex = updatedMarriages.findIndex(m => m.id === newMarriage.id);
            if (existingIndex >= 0) {
              updatedMarriages[existingIndex] = newMarriage;
            } else {
              updatedMarriages.push(newMarriage);
            }
          });
          return updatedMarriages;
        });
      }
    } catch (error) {
      console.error('Error fetching member profile:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات العضو",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };
  const handleViewMember = useCallback(async (member: any) => {
    setFormMode('profile');
    setEditingMember(member);
    if (isMobile) setIsMemberListOpen(false);

    // Fetch fresh member profile data
    await fetchMemberProfile(member.id);
  }, [isMobile, familyId, toast]);
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
    setOriginalWivesData([]);
    setOriginalHusbandData(null);
    // Clear image states
    setCroppedImage(null);
    setSelectedImage(null);
    setImageChanged(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const populateFormData = (member: any) => {
    setFormData({
      name: member.name || "",
      first_name: member.first_name || member.name?.split(' ')[0] || "",
      relation: member.relation || "",
      relatedPersonId: member.relatedPersonId,
      selectedParent: member.relatedPersonId || null,
      gender: member.gender || "male",
      birthDate: member.birthDate ? new Date(member.birthDate) : null,
      isAlive: member.isAlive ?? true,
      deathDate: member.deathDate ? new Date(member.deathDate) : null,
      bio: member.bio || "",
      imageUrl: member.image || "",
      croppedImage: null,
      // Don't set croppedImage when editing existing member
      isFounder: member.isFounder || false
    });

    // Load existing spouses
    loadExistingSpouses(member);

    // Reset image change tracking
    setImageChanged(false);
  };
  const loadExistingSpouses = (member: any) => {
    if (!familyMarriages || familyMarriages.length === 0) return;

    // Reset spouse states first
    setWives([]);
    setHusband(null);
    setOriginalWivesData([]);
    setOriginalHusbandData(null);
    if (member.gender === "male") {
      // Load wives for male member
      const memberMarriages = familyMarriages.filter(marriage => marriage.husband?.id === member.id);
      if (memberMarriages.length > 0) {
        const memberWives = memberMarriages.map(marriage => {
          // Use the wife data from the marriage object directly (it already has all fields from the database)
          const wifeMember = marriage.wife; // Use marriage.wife directly instead of searching in familyMembers

          // Determine if spouse is external: no father_id and not founder
          const isExternalSpouse = wifeMember ? !wifeMember.father_id && !wifeMember.is_founder : true;
          return {
            id: marriage.wife?.id || '',
            name: marriage.wife?.name || '',
            firstName: wifeMember?.first_name || '',
            lastName: wifeMember?.last_name || '',
            birthDate: parseDateFromDatabase(wifeMember?.birth_date),
            maritalStatus: wifeMember?.marital_status || 'married',
            isAlive: wifeMember?.is_alive ?? true,
            deathDate: parseDateFromDatabase(wifeMember?.death_date),
            croppedImage: wifeMember?.image_url || null,
            biography: wifeMember?.biography || '',
            // Add missing biography field
            isFamilyMember: !isExternalSpouse,
            // If external spouse, mark as not family member
            existingFamilyMemberId: wifeMember ? wifeMember.id : '',
            isSaved: true,
            // Mark existing wives as saved
            originalData: wifeMember ? {
              // Store original data for change tracking
              name: marriage.wife?.name || '',
              firstName: wifeMember.first_name || '',
              lastName: wifeMember.last_name || '',
              birthDate: parseDateFromDatabase(wifeMember.birth_date),
              isAlive: wifeMember.is_alive ?? true,
              deathDate: parseDateFromDatabase(wifeMember.death_date),
              maritalStatus: wifeMember.marital_status || 'married',
              croppedImage: wifeMember.image_url || null,
              biography: wifeMember.biography || '',
              // Add missing biography field to original data too
              isFamilyMember: !isExternalSpouse
            } : null
          };
        }).filter(wife => wife.id); // Filter out wives without ID

        setWives(memberWives);
        setOriginalWivesData(memberWives.map(wife => ({
          ...wife
        }))); // Store original data

        // Initialize wife family status based on whether they are family members
        const initialWiveFamilyStatus: {
          [key: number]: 'yes' | 'no' | null;
        } = {};
        memberWives.forEach((wife, index) => {
          initialWiveFamilyStatus[index] = wife.isFamilyMember ? 'yes' : 'no';
        });
        setWiveFamilyStatus(initialWiveFamilyStatus);
      } else {
        setWives([]);
        setWiveFamilyStatus({});
        setOriginalWivesData([]);
      }
    } else if (member.gender === "female") {
      // Load husband for female member
      const memberMarriages = familyMarriages.filter(marriage => marriage.wife?.id === member.id);
      if (memberMarriages.length > 0) {
        const marriage = memberMarriages[0]; // Take the first marriage
        const husbandMember = marriage.husband; // Use marriage.husband directly instead of searching in familyMembers
        // Determine if spouse is external similar to wives logic
        const isExternalSpouse = husbandMember ? (!husbandMember.father_id && !husbandMember.is_founder) : true;
        const husbandData = {
          id: marriage.husband?.id || '',
          firstName: husbandMember?.first_name || marriage.husband?.firstName || '',
          lastName: husbandMember?.last_name || marriage.husband?.lastName || '',
          name: marriage.husband?.name || '',
          birthDate: parseDateFromDatabase(husbandMember?.birth_date),
          maritalStatus: 'married',
          isAlive: husbandMember?.is_alive ?? true,
          deathDate: parseDateFromDatabase(husbandMember?.death_date),
          croppedImage: husbandMember?.image_url || null,
          biography: husbandMember?.biography || '',
          isFamilyMember: !isExternalSpouse,
          existingFamilyMemberId: husbandMember ? husbandMember.id : '',
          isSaved: true // Mark existing husband as saved
        };
        setHusband(husbandData);
        setOriginalHusbandData({
          ...husbandData
        }); // Store original data for change detection
      } else {
        setHusband(null);
        setOriginalHusbandData(null);
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
        return wife.isSaved === true && (familyStatus !== 'yes' || wife.existingFamilyMemberId);
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
  const processSpouse = async ({
    spouse,
    spouseType,
    memberData,
    familyId,
    familyData,
    marriageResults,
    activeMarriageIds,
    isMainMember
  }) => {
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
    
    console.log('🔍 SPOUSE CREATION/UPDATE DEBUG:', {
      spouseName: spouse.name,
      spouseType,
      existingFamilyMemberId: spouse.existingFamilyMemberId,
      spouseId: spouse.id,
      isFamilyMember: spouse.isFamilyMember
    });

    // If spouse has existing ID (either from existingFamilyMemberId or id), update the record
    const existingId = spouse.existingFamilyMemberId || spouse.id;
    if (existingId && !existingId.startsWith('temp_')) {
      // Get current image to handle image state properly
      const {
        data: currentSpouse
      } = await supabase.from('family_tree_members').select('image_url').eq('id', existingId).maybeSingle();

      // Handle image state properly
      let imageUrl;
      if (spouse.croppedImage !== undefined) {
        imageUrl = spouse.croppedImage || null;
      } else {
        imageUrl = currentSpouse?.image_url || null;
      }
      const spouseName = spouse.name || (spouse.firstName && spouse.lastName ? `${spouse.firstName} ${spouse.lastName}` : spouse.firstName || spouse.lastName || '');
      const {
        data: updatedSpouse,
        error: spouseUpdateError
      } = await supabase.from('family_tree_members').update({
        name: spouseName,
        first_name: spouse.firstName || null,
        last_name: spouse.lastName || familyData?.name || null,
        birth_date: formatDateForDatabase(spouse.birthDate),
        is_alive: spouse.isAlive ?? true,
        death_date: !spouse.isAlive ? formatDateForDatabase(spouse.deathDate) : null,
        marital_status: spouse.maritalStatus || 'married',
        image_url: imageUrl,
        biography: spouse.biography || null,
        updated_at: new Date().toISOString()
      }).eq('id', existingId).select().single();
      if (spouseUpdateError) {
        console.error(`Error updating ${spouseType} member:`, spouse.name, spouseUpdateError);
        throw spouseUpdateError;
      }
      return updatedSpouse.id;
    } else {
      // Create new spouse member
      const firstName = spouse.firstName || '';
      const lastName = spouse.lastName || familyData?.name || '';
      const spouseName = firstName && lastName ? `${firstName} ${lastName}` : spouse.name || firstName || lastName || '';
      const {
        data: newSpouseMember,
        error: spouseError
      } = await supabase.from('family_tree_members').insert({
        name: spouseName,
        first_name: firstName,
        last_name: lastName,
        gender: isWife ? 'female' : 'male',
        birth_date: formatDateForDatabase(spouse.birthDate),
        is_alive: spouse.isAlive ?? true,
        death_date: !spouse.isAlive ? formatDateForDatabase(spouse.deathDate) : null,
        family_id: familyId,
        created_by: familyData?.creator_id,
        is_founder: false,
        marital_status: spouse.maritalStatus || 'married',
        image_url: spouse.croppedImage || null,
        biography: spouse.biography || null
      }).select().single();
      if (spouseError) {
        console.error(`Error creating ${spouseType} member:`, spouse.name, spouseError);
        throw spouseError;
      }
      return newSpouseMember.id;
    }
  };
  const updateSpouseMemberStatus = async (spouse, spouseType) => {
    // Get current data to handle image state properly
    const {
      data: currentSpouse
    } = await supabase.from('family_tree_members').select('image_url').eq('id', spouse.existingFamilyMemberId).maybeSingle();

    // Handle image state properly - upload to storage if new image provided
    let imageUrl;
    if (spouse.croppedImage && spouse.croppedImage !== currentSpouse?.image_url) {
      // Check if this is a blob URL (new image)
      if (spouse.croppedImage.startsWith('blob:')) {
        // Delete old image from storage if exists
        if (currentSpouse?.image_url && !currentSpouse.image_url.startsWith('data:image/')) {
          await deleteMemberImage(currentSpouse.image_url);
        }
        
        // Upload new image to storage
        const croppedBlob = (window as any).__croppedImageBlob;
        if (croppedBlob) {
          imageUrl = await uploadMemberImage(croppedBlob, spouse.existingFamilyMemberId);
          console.log('✅ Spouse image uploaded to storage:', imageUrl);
        } else {
          imageUrl = currentSpouse?.image_url || null;
        }
      } else {
        // New Base64 image provided (legacy)
        imageUrl = spouse.croppedImage;
      }
    } else {
      // No new image, preserve existing
      imageUrl = currentSpouse?.image_url || null;
    }
    const {
      error: updateSpouseError
    } = await supabase.from('family_tree_members').update({
      marital_status: spouse.maritalStatus,
      image_url: imageUrl,
      biography: spouse.biography || null
    }).eq('id', spouse.existingFamilyMemberId);
    if (updateSpouseError) {
      console.error(`Error updating ${spouseType} marital status:`, updateSpouseError);
    } else {
      console.log(`Successfully updated ${spouseType} marital status to:`, spouse.maritalStatus);
    }

    // Update marriage table marital status
    const spouseColumn = spouseType === 'wife' ? 'wife_id' : 'husband_id';
    const {
      data: marriage
    } = await supabase.from('marriages').update({
      marital_status: spouse.maritalStatus
    }).eq(spouseColumn, spouse.existingFamilyMemberId).select('husband_id, wife_id').single();

    // Update the other spouse's marital status in family_tree_members
    if (marriage) {
      const otherSpouseId = spouseType === 'wife' ? marriage.husband_id : marriage.wife_id;
      if (otherSpouseId && otherSpouseId !== spouse.existingFamilyMemberId) {
        await supabase.from('family_tree_members').update({
          marital_status: spouse.maritalStatus
        }).eq('id', otherSpouseId);
        console.log(`Also updated other spouse's marital status to:`, spouse.maritalStatus);
      }
    }
  };
  const createOrUpdateMarriage = async ({
    memberData,
    spouseId,
    spouseType,
    spouse,
    familyId,
    activeMarriageIds,
    marriageResults,
    isMainMember
  }) => {
    const isWife = spouseType === 'wife';
    const husbandId = isWife ? memberData.id : spouseId;
    const wifeId = isWife ? spouseId : memberData.id;

    console.log('🔍 Creating marriage between:', { husbandId, wifeId, spouseName: spouse.name });

    // Check if either person is already married to someone else
    const { data: existingHusbandMarriage } = await supabase
      .from('marriages')
      .select('id, wife_id')
      .eq('husband_id', husbandId)
      .eq('is_active', true)
      .neq('wife_id', wifeId)
      .maybeSingle();

    const { data: existingWifeMarriage } = await supabase
      .from('marriages')
      .select('id, husband_id')
      .eq('wife_id', wifeId)
      .eq('is_active', true)
      .neq('husband_id', husbandId)
      .maybeSingle();

    if (existingHusbandMarriage || existingWifeMarriage) {
      console.error('❌ Cannot create marriage - one of the parties is already married:', {
        existingHusbandMarriage,
        existingWifeMarriage
      });
      marriageResults.failed++;
      marriageResults.details.push(`لا يمكن ربط علاقة الزواج مع ${spouse.name} - الشخص متزوج بالفعل`);
      return;
    }

    // Check if marriage already exists between these two people
    const {
      data: existingMarriage
    } = await supabase.from('marriages').select('id').eq('husband_id', husbandId).eq('wife_id', wifeId).maybeSingle();
    let marriageError;
    
    if (existingMarriage) {
      // Update existing marriage to ensure it's active
      const {
        error
      } = await supabase.from('marriages').update({
        is_active: true,
        marital_status: spouse.maritalStatus || 'married'
      }).eq('id', existingMarriage.id);
      marriageError = error;
      activeMarriageIds.push(existingMarriage.id);
      console.log('✅ Updated existing marriage:', existingMarriage.id);
    } else {
      // Create new marriage record
      const {
        data: newMarriage,
        error
      } = await supabase.from('marriages').insert({
        family_id: familyId,
        husband_id: husbandId,
        wife_id: wifeId,
        is_active: true,
        marital_status: spouse.maritalStatus || 'married'
      }).select('id').single();
      marriageError = error;
      if (newMarriage) {
        activeMarriageIds.push(newMarriage.id);
        console.log('✅ Created new marriage:', newMarriage.id);
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
    console.log('🚨 HANDLE FORM SUBMIT CALLED!');
    console.log('🚨 Submission data:', submissionData);
    console.log('🚨 Form mode:', formMode);
    console.log('🚨 Editing member:', editingMember ? editingMember.id : 'none');
    console.log('🚨 Current wives:', wives);
    console.log('🚨 Original wives data:', originalWivesData);
    try {
      if (isSavingRef.current) {
        console.warn('⛔️ Duplicate submit ignored');
        return;
      }
      isSavingRef.current = true;
      setIsSaving(true);

      // Determine marital status based on presence of spouses
      const hasSpouses = submissionData.gender === "male" && wives.length > 0 || submissionData.gender === "female" && husband;

      // Prepare final submission data matching modal structure
      const finalData = {
        ...submissionData,
        maritalStatus: hasSpouses ? "married" : "single",
        wives: submissionData.gender === "male" ? wives : [],
        husband: submissionData.gender === "female" && husband ? husband : null
      };

      // Handle image state properly for edits:
      // - If imageChanged is true, upload new image to storage
      // - If imageChanged is false, keep existing storage path
      let finalImageUrl;
      if (formMode === 'edit' && editingMember) {
        console.log('🚨 Image preservation check:', {
          imageChanged,
          croppedImage: submissionData.croppedImage,
          existingImage: editingMember.image,
          editingMember: editingMember
        });
        if (imageChanged) {
          // Delete old image from storage if exists
          if (editingMember.image && !editingMember.image.startsWith('data:image/')) {
            await deleteMemberImage(editingMember.image);
          }
          
          // Upload new image to storage if provided
          const croppedBlob = (window as any).__croppedImageBlob;
          if (croppedBlob) {
            finalImageUrl = await uploadMemberImage(croppedBlob, editingMember.id);
            console.log('✅ Image uploaded to storage (edit):', finalImageUrl);
          } else {
            finalImageUrl = null;
          }
        } else {
          // Keep existing image path (storage path or Base64 for legacy data)
          finalImageUrl = editingMember.image || null;
        }
      } else {
        // Add mode - already handled in the insert section
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
      console.log('🚨 IS EDIT MODE CHECK:', {
        formMode,
        editingMember: editingMember ? editingMember.id : 'none',
        isEditMode
      });
      let memberData;
      if (isEditMode) {
        // Update existing member
        // Use first_name from formData directly
        const firstName = submissionData.first_name || submissionData.name || '';

        // Determine lastName based on father's family name if father is external
        let lastName = familyData?.name || '';
        if (fatherId) {
          const father = familyMembers.find(m => m.id === fatherId);
          if (father && father.last_name && father.last_name !== familyData?.name) {
            // Father is from external family, use father's last name
            lastName = father.last_name;
          }
        }

        // Ensure name field is properly constructed
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName;
        const {
          data: updatedMember,
          error: updateError
        } = await supabase.from('family_tree_members').update({
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          gender: submissionData.gender,
          birth_date: formatDateForDatabase(submissionData.birthDate),
          is_alive: submissionData.isAlive,
          death_date: !submissionData.isAlive ? formatDateForDatabase(submissionData.deathDate) : null,
          biography: submissionData.bio || null,
          image_url: finalImageUrl,
          father_id: fatherId,
          mother_id: motherId,
          related_person_id: relatedPersonId,
          marital_status: finalData.maritalStatus || 'single',
          updated_at: new Date().toISOString()
        }).eq('id', editingMember.id).select().single();
        if (updateError) {
          console.error('Error updating family member:', updateError);
          throw updateError;
        }
        memberData = updatedMember;
      } else {
        // Insert new family member into database
        // Use first_name from formData directly
        const firstName = submissionData.first_name || submissionData.name || '';

        // Determine lastName based on father's family name if father is external
        let lastName = familyData?.name || '';
        if (fatherId) {
          const father = familyMembers.find(m => m.id === fatherId);
          if (father && father.last_name && father.last_name !== familyData?.name) {
            // Father is from external family, use father's last name
            lastName = father.last_name;
          }
        }

        // Ensure name field is properly constructed
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName;
        
        // Upload image to storage if a new image was cropped
        let imageStoragePath = null;
        const croppedBlob = (window as any).__croppedImageBlob;
        if (croppedBlob && imageChanged) {
          const tempMemberId = `temp-${Date.now()}`;
          imageStoragePath = await uploadMemberImage(croppedBlob, tempMemberId);
          console.log('✅ Image uploaded to storage:', imageStoragePath);
        }
        
        const {
          data: newMember,
          error: memberError
        } = await supabase.from('family_tree_members').insert({
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          gender: submissionData.gender,
          birth_date: formatDateForDatabase(submissionData.birthDate),
          is_alive: submissionData.isAlive,
          death_date: !submissionData.isAlive ? formatDateForDatabase(submissionData.deathDate) : null,
          biography: submissionData.bio || null,
          image_url: imageStoragePath,
          father_id: fatherId,
          mother_id: motherId,
          related_person_id: relatedPersonId,
          family_id: familyId,
          created_by: familyData?.creator_id,
          is_founder: submissionData.isFounder || false,
          marital_status: finalData.maritalStatus || 'single'
        }).select().single();
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

      // Handle spouse deletions first (in edit mode) - regardless of final marital status
      if (isEditMode) {
        console.log('🚨 ENTERING EDIT MODE DELETION CHECKS');
        console.log('🚨 Submission data gender:', submissionData.gender);
        console.log('🚨 Original wives data length:', originalWivesData.length);

        // Handle deleted husband for female members
        if (submissionData.gender === 'female' && originalHusbandData) {
          const hasCurrentHusband = husband && husband.isSaved;
          console.log('🔍 HUSBAND DELETION DEBUG:');
          console.log('Original husband:', originalHusbandData ? {
            id: originalHusbandData.id,
            existingFamilyMemberId: originalHusbandData.existingFamilyMemberId,
            name: originalHusbandData.name,
            isSaved: originalHusbandData.isSaved
          } : null);
          console.log('Current husband:', husband ? {
            id: husband.id,
            existingFamilyMemberId: husband.existingFamilyMemberId,
            name: husband.name,
            isSaved: husband.isSaved
          } : null);
          console.log('Has current husband:', hasCurrentHusband);
          if (!hasCurrentHusband) {
            // Husband was deleted
            if (process.env.NODE_ENV === 'development') {
              console.log('DELETED HUSBAND detected:', originalHusbandData.name);
            }
            try {
              const husbandId = originalHusbandData.id || originalHusbandData.existingFamilyMemberId;
              if (husbandId) {
                // Find and delete marriage record
                const {
                  error: marriageDeleteError
                } = await supabase.from('marriages').delete().eq('wife_id', memberData.id).eq('husband_id', husbandId);
                if (marriageDeleteError) {
                  console.error('Error deleting marriage:', marriageDeleteError);
                  marriageResults.failed++;
                  marriageResults.details.push(`فشل في حذف زواج ${originalHusbandData.name}`);
                } else {
                  // If husband is not a family member (external spouse), delete his record
                  if (!originalHusbandData.isFamilyMember) {
                    const {
                      error: husbandDeleteError
                    } = await supabase.from('family_tree_members').delete().eq('id', husbandId);
                    if (husbandDeleteError) {
                      console.error('Error deleting husband member:', husbandDeleteError);
                      marriageResults.failed++;
                      marriageResults.details.push(`فشل في حذف ${originalHusbandData.name}`);
                    }
                  } else {
                    // If he's a family member, just update his marital status
                    const {
                      error: updateError
                    } = await supabase.from('family_tree_members').update({
                      marital_status: 'single'
                    }).eq('id', husbandId);
                    if (updateError) {
                      console.error('Error updating husband marital status:', updateError);
                    }
                  }

                  // Find and update children to remove father relationship
                  const {
                    error: childrenUpdateError
                  } = await supabase.from('family_tree_members').update({
                    father_id: null
                  }).eq('father_id', husbandId);
                  if (childrenUpdateError) {
                    console.error('Error updating children father_id:', childrenUpdateError);
                  }
                  marriageResults.successful++;
                }
              }
            } catch (error) {
              console.error(`Error deleting husband ${originalHusbandData.name}:`, error);
              marriageResults.failed++;
              marriageResults.details.push(`خطأ في حذف ${originalHusbandData.name}`);
            }
          }
        }

        // Handle deleted wives for male members
        if (submissionData.gender === 'male' && originalWivesData.length > 0) {
          const currentWiveIds = wives.map(w => w.id || w.existingFamilyMemberId).filter(Boolean);
          const deletedWives = originalWivesData.filter(originalWife => !currentWiveIds.includes(originalWife.id || originalWife.existingFamilyMemberId));
          console.log('🔍 DETAILED ID COMPARISON:');
          console.log('Original wives data:', originalWivesData.map(w => ({
            id: w.id,
            existingFamilyMemberId: w.existingFamilyMemberId,
            name: w.name,
            finalId: w.id || w.existingFamilyMemberId
          })));
          console.log('Current wives data:', wives.map(w => ({
            id: w.id,
            existingFamilyMemberId: w.existingFamilyMemberId,
            name: w.name,
            finalId: w.id || w.existingFamilyMemberId
          })));
          console.log('Current wives IDs extracted:', currentWiveIds);
          console.log('Original wives final IDs:', originalWivesData.map(w => w.id || w.existingFamilyMemberId));

          // More detailed deletion check
          originalWivesData.forEach((originalWife, index) => {
            const originalId = originalWife.id || originalWife.existingFamilyMemberId;
            const isFound = currentWiveIds.includes(originalId);
            console.log(`Original wife ${index}: ${originalWife.name} (ID: ${originalId}) - Found in current: ${isFound}`);
          });
          if (process.env.NODE_ENV === 'development') {
            console.log('DELETED WIVES detected:', deletedWives.length);
          }
          for (const deletedWife of deletedWives) {
            try {
              const wifeId = deletedWife.id || deletedWife.existingFamilyMemberId;
              console.log('🗑️ Processing deletion for wife:', {
                name: deletedWife.name,
                id: deletedWife.id,
                existingFamilyMemberId: deletedWife.existingFamilyMemberId,
                finalId: wifeId,
                isFamilyMember: deletedWife.isFamilyMember
              });
              if (!wifeId) {
                console.warn('⚠️ Skipping wife deletion - no valid ID:', deletedWife.name);
                continue;
              }

              // Find and delete marriage record
              console.log('🔗 Deleting marriage record for husband:', memberData.id, 'wife:', wifeId);
              const {
                error: marriageDeleteError
              } = await supabase.from('marriages').delete().eq('husband_id', memberData.id).eq('wife_id', wifeId);
              if (marriageDeleteError) {
                console.error('❌ Error deleting marriage:', marriageDeleteError);
                marriageResults.failed++;
                marriageResults.details.push(`فشل في حذف زواج ${deletedWife.name}`);
                continue;
              } else {
                console.log('✅ Marriage deleted successfully for:', deletedWife.name);
              }

              // If wife is not a family member (external spouse), delete her record
              if (!deletedWife.isFamilyMember) {
                console.log('🗑️ Deleting external wife member:', deletedWife.name);
                const {
                  error: wifeDeleteError
                } = await supabase.from('family_tree_members').delete().eq('id', wifeId);
                if (wifeDeleteError) {
                  console.error('❌ Error deleting wife member:', wifeDeleteError);
                  marriageResults.failed++;
                  marriageResults.details.push(`فشل في حذف ${deletedWife.name}`);
                  continue;
                } else {
                  console.log('✅ External wife member deleted:', deletedWife.name);
                }
              } else {
                console.log('👤 Updating family member wife to single:', deletedWife.name);
                // If she's a family member, just update her marital status
                const {
                  error: updateError
                } = await supabase.from('family_tree_members').update({
                  marital_status: 'single'
                }).eq('id', wifeId);
                if (updateError) {
                  console.error('❌ Error updating wife marital status:', updateError);
                } else {
                  console.log('✅ Family member wife status updated to single:', deletedWife.name);
                }
              }

              // Find and update children to remove mother relationship
              console.log('👶 Updating children to remove mother_id for:', deletedWife.name);
              const {
                error: childrenUpdateError
              } = await supabase.from('family_tree_members').update({
                mother_id: null
              }).eq('mother_id', wifeId);
              if (childrenUpdateError) {
                console.error('❌ Error updating children mother_id:', childrenUpdateError);
              } else {
                console.log('✅ Children mother_id updated for deleted wife:', deletedWife.name);
              }
              console.log('✅ Wife deletion completed successfully:', deletedWife.name);
              marriageResults.successful++;
            } catch (error) {
              console.error(`❌ Error deleting wife ${deletedWife.name}:`, error);
              marriageResults.failed++;
              marriageResults.details.push(`خطأ في حذف ${deletedWife.name}`);
            }
          }
        }
      }

      // Handle marriage operations after main member is saved/updated
      if (finalData.maritalStatus === 'married') {
        // Unified spouse processing function
        const processSpouseMarriage = async (spouseData: any, spouseType: 'wife' | 'husband') => {
          try {
            console.log('🔍 processSpouseMarriage called with:', {
              spouseType,
              spouseData: {
                id: spouseData.id,
                name: spouseData.name,
                firstName: spouseData.firstName,
                lastName: spouseData.lastName,
                existingFamilyMemberId: spouseData.existingFamilyMemberId
              }
            });
            
            const isWife = spouseType === 'wife';
            // Prefer known IDs: in-family uses existingFamilyMemberId, external spouses use their own id (only if UUID)
            const isValidUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
            const candidateId = spouseData.existingFamilyMemberId || spouseData.id || null;
            let spouseId = candidateId && typeof candidateId === 'string' && isValidUuid(candidateId) ? candidateId : null;

            // Ensure we have a proper name for the spouse
            const firstName = spouseData.firstName || '';
            const lastName = spouseData.lastName || familyData?.name || '';
            const spouseName = spouseData.name || (firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || 'غير محدد'));
            
            console.log('🔍 Computed spouse name:', spouseName);

            // If we already have an ID, update existing spouse record accordingly
            if (spouseId) {
              // Preserve existing image if user didn't change it
              const { data: currentSpouse } = await supabase
                .from('family_tree_members')
                .select('image_url')
                .eq('id', spouseId)
                .maybeSingle();

              const imageUrl = (spouseData.croppedImage !== undefined)
                ? (spouseData.croppedImage || null)
                : (currentSpouse?.image_url || null);

              if (spouseData.isFamilyMember) {
                // Update minimal fields for family members we don't own
                await supabase
                  .from('family_tree_members')
                  .update({
                    marital_status: spouseData.maritalStatus,
                    image_url: imageUrl,
                    biography: spouseData.biography || null,
                  })
                  .eq('id', spouseId);

                await supabase
                  .from('marriages')
                  .update({ marital_status: spouseData.maritalStatus })
                  .eq(isWife ? 'wife_id' : 'husband_id', spouseId);
              } else {
                // External spouse we created earlier: safely update full profile fields
                const firstName = spouseData.firstName || '';
                const lastName = spouseData.lastName || familyData?.name || '';
                const spouseName = firstName && lastName
                  ? `${firstName} ${lastName}`
                  : (spouseData.name || firstName || lastName || '');

                await supabase
                  .from('family_tree_members')
                  .update({
                    name: spouseName,
                    first_name: firstName,
                    last_name: lastName,
                    birth_date: formatDateForDatabase(spouseData.birthDate),
                    is_alive: spouseData.isAlive ?? true,
                    death_date: !spouseData.isAlive ? formatDateForDatabase(spouseData.deathDate) : null,
                    marital_status: spouseData.maritalStatus || 'married',
                    image_url: imageUrl,
                    biography: spouseData.biography || null,
                  })
                  .eq('id', spouseId);
              }
            } else {
              // No existing ID → create a brand new external spouse
              const { data: newSpouseMember, error: spouseError } = await supabase
                .from('family_tree_members')
                .insert({
                  name: spouseName,
                  first_name: firstName,
                  last_name: lastName,
                  gender: isWife ? 'female' : 'male',
                  birth_date: formatDateForDatabase(spouseData.birthDate),
                  is_alive: spouseData.isAlive ?? true,
                  death_date: !spouseData.isAlive ? formatDateForDatabase(spouseData.deathDate) : null,
                  family_id: familyId,
                  created_by: familyData?.creator_id,
                  is_founder: false,
                  marital_status: spouseData.maritalStatus || 'married',
                  image_url: spouseData.croppedImage || null,
                  biography: spouseData.biography || null,
                })
                .select()
                .single();

              if (spouseError) {
                throw spouseError;
              }
              spouseId = newSpouseMember.id;
            }

            // Upsert marriage record to prevent duplicates
            if (spouseId) {
              const husbandId = isWife ? memberData.id : spouseId;
              const wifeId = isWife ? spouseId : memberData.id;

              const { error: marriageError } = await supabase
                .from('marriages')
                .upsert(
                  {
                    family_id: familyId,
                    husband_id: husbandId,
                    wife_id: wifeId,
                    is_active: true,
                    marital_status: spouseData.maritalStatus || 'married',
                  },
                  {
                    onConflict: 'husband_id,wife_id',
                    ignoreDuplicates: false,
                  },
                );

              if (marriageError) {
                throw marriageError;
              }

              marriageResults.successful++;
              marriageResults.details.push(`تم ربط الزواج مع ${spouseName}`);
            }
          } catch (error) {
            console.error(`Error processing ${spouseType}:`, error);
            console.error('Error details:', {
              spouseData: {
                id: spouseData.id,
                name: spouseData.name,
                firstName: spouseData.firstName,
                lastName: spouseData.lastName
              }
            });
            marriageResults.failed++;
            // Use computed name to ensure we always have a name in the error message
            const displayName = spouseData.name || 
                              (spouseData.firstName && spouseData.lastName ? `${spouseData.firstName} ${spouseData.lastName}` : 
                               (spouseData.firstName || spouseData.lastName || 'الشخص المحدد'));
             marriageResults.details.push(`خطأ في ربط الزواج مع ${displayName}: ${error.message || error}`);
          }
        };

        // Process wives for male members with deduplication
        if (submissionData.gender === 'male' && wives.length > 0) {
          const savedWives = wives.filter(w => w.isSaved === true);
          const deduplicatedWives = deduplicateSpouses(savedWives);
          console.log('🔍 Processing wives for male member:', deduplicatedWives.length, 'wives (deduplicated from', savedWives.length, 'saved wives)');
          for (const wife of deduplicatedWives) {
            console.log('🔍 Processing wife:', wife.name, 'ID:', wife.id || wife.existingFamilyMemberId);
            await processSpouseMarriage(wife, 'wife');
          }
        }

        // Process husband for female members
        if (submissionData.gender === 'female' && husband && husband.isSaved === true) {
          console.log('🔍 Processing husband for female member:', husband.name, 'ID:', husband.id || husband.existingFamilyMemberId);
          await processSpouseMarriage(husband, 'husband');
        }
      }

      // Clear localStorage spouse data after successful submission
      clearSpouseDataFromLocalStorage();

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
      const memberName = submissionData.name || submissionData.first_name || "العضو";
      let toastDescription = `${actionedText} العضو "${memberName}" بنجاح`;

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

      // Refresh family data to reflect all changes in the member list
      await fetchFamilyData();
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
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [formData, familyData, wives, husband, packageData, subscriptionData, editingMember, toast, t, refreshFamilyData]);
  const nextStep = () => {
    // Validate required fields for step 1
    if (currentStep === 1) {
      if (!formData.first_name?.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى إدخال الاسم الأول",
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

      // Preserve image data when moving to next step
      if (croppedImage && croppedImage !== formData.croppedImage) {
        setFormData(prev => ({
          ...prev,
          croppedImage: croppedImage
        }));
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
    return <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
        <GlobalHeader />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-6">
            <FamilyBuilderNewSkeleton />
          </div>
        </main>
        <GlobalFooterSimplified />
      </div>;

  }
  return <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir={direction}>
      <GlobalHeader />
      <main className="flex-1 relative">
      
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
        <div className="container mx-auto px-4 pt-0 pb-0">
          {/* Hero Section - Adapted from Dashboard */}
         </div>

         {/* Test FamilyHeader Component */}
         <div className="container mx-auto px-4">
           <FamilyHeader
             familyData={familyData}
             familyId={familyId}
             familyMembers={familyMembers}
             generationCount={generationCount}
             onSettingsClick={() => setFormMode('tree-settings')}
           />
         </div>

         {/* Header Section */}

        {/* Main Content */}
        <div className="container mx-auto px-4 pt-2 pb-6">
          <div className={cn("grid gap-6 items-stretch", isMobile ? "grid-cols-1" : "grid-cols-12")}>
            {/* Form Panel - Right Side on Desktop */}
            <div className={cn("space-y-6 h-full min-h-0", isMobile ? "order-2" : "col-span-8 order-2")}>
               <Card className="h-fit relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-white/30 dark:border-gray-600/30 shadow-xl">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-500/10 dark:to-gray-500/5 rounded-lg"></div>
                  <CardHeader className={cn("relative", (formMode === 'view' || formMode === 'profile' || formMode === 'tree-settings') && "hidden")}>
                       <CardTitle className="flex items-center justify-between flex-row-reverse">
                         {/* Step Indicator for add/edit modes - positioned at far left */}
                         {(formMode === 'add' || formMode === 'edit') && <div className="flex items-center gap-4">
                           {[1, 2].map((step, index) => <div key={step} className="flex flex-col items-center gap-2">
                               <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium border-2 transition-all duration-200", currentStep >= step ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-background border-muted-foreground/30 text-muted-foreground")}>
                                 {currentStep > step ? <Check className="h-4 w-4" /> : step}
                               </div>
                               <span className={cn("text-xs font-medium text-center", currentStep >= step ? "text-primary" : "text-muted-foreground")}>
                                 {step === 1 ? "المعلومات الأساسية" : "التفاصيل الإضافية"}
                               </span>
                               {index < 1 && <div className={cn("absolute top-5 right-[-12px] w-6 h-0.5 transition-all duration-200", currentStep > step ? "bg-primary" : "bg-muted-foreground/30")} />}
                             </div>)}
                         </div>}
                         
                         {/* Title and Icon - positioned to the right */}
                         <div className="flex items-center gap-2 mr-auto">
                            {formMode === 'view' && <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                            {formMode === 'add' && <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                            {formMode === 'edit' && <Edit className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                            {formMode === 'profile' && <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                            {formMode === 'tree-settings' && <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-relaxed">
                               {formMode === 'view' && "معلومات العضو"}
                               {formMode === 'add' && "إضافة عضو جديد"}
                               {formMode === 'edit' && `تعديل معلومات ${editingMember?.name || 'العضو'}`}
                               {formMode === 'profile' && `ملف ${editingMember?.name || 'العضو'}`}
                               {formMode === 'tree-settings' && "إعدادات الشجرة"}
                             </span>
                         </div>
                         {formMode === 'profile' && <Button type="button" variant="outline" onClick={currentStep === 1 ? handleCancelForm : prevStep} className="flex items-center gap-2 font-arabic" size="sm">
                             <ArrowLeft className="h-4 w-4" />
                             العودة
                           </Button>}
                      </CardTitle>

                  </CardHeader>
                <CardContent className="relative p-2 sm:p-4 md:p-6 overflow-hidden bg-white">
                  {formMode === 'view' ? <div className="py-8 px-6">
                       {/* Family Overview Header - Redesigned */}
                          
                          {/* Animated Background Orbs */}
                          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse"></div>
                          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/10 via-secondary/5 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
                          
                          
                          <div className="relative z-10 pt-4">
                            {/* Hero Content */}
                            <div className="text-center space-y-8">
                              {/* Logo Section with Enhanced Design */}
                              <div className="relative inline-block">
                                <div className="relative group">
                                  {/* Main Icon Container */}
                                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto">
                                    {/* Animated background rings */}
                                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-spin" style={{animationDuration: '10s'}}></div>
                                    <div className="absolute inset-2 rounded-full border-2 border-secondary/30 animate-spin" style={{animationDuration: '8s', animationDirection: 'reverse'}}></div>
                                    
                                    {/* Main icon */}
                                    <div className="absolute inset-4 bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500 border-2 border-primary/20">
                                      <TreePine className="h-12 w-12 sm:h-14 sm:w-14 text-primary-foreground drop-shadow-lg" />
                                    </div>
                                    
                                    {/* Active Status Indicator */}
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-4 border-card shadow-xl flex items-center justify-center">
                                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Title Section with Enhanced Typography */}
                              <div className="space-y-6">
                                <div className="space-y-3">
                                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                                    <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in">
                                      عائلة {familyData?.name || 'غير محدد'}
                                    </span>
                                  </h1>
                                  
                                  {/* Animated Decorative Line */}
                                  <div className="flex items-center justify-center space-x-2">
                                    <div className="h-1 w-8 bg-gradient-to-r from-transparent to-primary rounded-full animate-fade-in delay-200"></div>
                                    <div className="h-2 w-20 bg-gradient-to-r from-primary via-accent to-secondary rounded-full animate-fade-in delay-100"></div>
                                    <div className="h-1 w-8 bg-gradient-to-r from-secondary to-transparent rounded-full animate-fade-in delay-200"></div>
                                  </div>
                                </div>
                                
                                {/* Family Description with Glass Morphism */}
                                {familyData?.description && (
                                  <div className="max-w-2xl mx-auto animate-fade-in delay-300">
                                    <div className="relative group">
                                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-card/20 to-secondary/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                                      <div className="relative bg-card/60 backdrop-blur-md rounded-2xl p-6 border border-border/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                                        <div 
                                          className="text-muted-foreground text-base sm:text-lg leading-relaxed font-medium"
                                          dangerouslySetInnerHTML={{ __html: familyData.description }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Interactive Elements */}
                                <div className="flex items-center justify-center pt-6">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 bg-primary rounded-full animate-bounce shadow-lg"></div>
                                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100 shadow-md"></div>
                                    <div className="w-3 h-3 bg-secondary rounded-full animate-bounce delay-200 shadow-lg"></div>
                                    <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce delay-300 shadow-md"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>


                      {/* Last Updated Info */}
                      {familyData?.updated_at && <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                            <Clock className="h-3 w-3" />
                            آخر تحديث: {format(new Date(familyData.updated_at), 'd MMMM yyyy', {
                        locale: ar
                      })}
                          </div>
                        </div>}
                    </div> : formMode === 'profile' ? profileLoading ? <MemberProfileSkeleton /> : <MemberProfileView member={editingMember} isSpouse={checkIfMemberIsSpouse(editingMember)} onEdit={() => {
                  setFormMode('edit');
                  setCurrentStep(1);
                  populateFormData(editingMember);
                }} onBack={() => setFormMode('view')} onDelete={() => handleDeleteMember(editingMember)} familyMembers={familyMembers} marriages={familyMarriages} onSpouseEditWarning={() => handleSpouseEditWarning(editingMember)} onSpouseDeleteWarning={() => handleSpouseDeleteWarning(editingMember)} onMemberClick={async member => {
                  setEditingMember(member);
                  setFormMode('profile');
                  await fetchMemberProfile(member.id);
                }} /> : formMode === 'tree-settings' ? <TreeSettingsView familyData={familyData} onBack={() => setFormMode('view')} /> : <div className="space-y-6">

                      {/* Step Content */}
                      {currentStep === 1 && <div className="space-y-6">
                            <h3 className="text-xl font-bold font-arabic text-primary mb-6 pb-2 border-b border-border">المعلومات الأساسية</h3>
                             
                              {/* First row: First Name (1/2), Gender (1/4), Birthdate (1/4) */}
                              <div className="grid grid-cols-12 gap-6">
                                 <div className="col-span-12 md:col-span-6">
                                     <Label htmlFor="first_name" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                       <UserCircle className="h-4 w-4 text-primary" />
                                       الاسم الأول *
                                    </Label>
                                     <Input id="first_name" value={formData.first_name} onChange={e => setFormData({
                          ...formData,
                          first_name: e.target.value
                        })} placeholder="أدخل الاسم الأول" className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" required />
                                 </div>
                                 
                                 <div className="col-span-6 md:col-span-3">
                                    <Label htmlFor="gender" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                      <Zap className="h-4 w-4 text-primary" />
                                      الجنس *
                                   </Label>
                                   <Select value={formData.gender} onValueChange={value => setFormData({
                          ...formData,
                          gender: value
                        })}>
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
                                   <EnhancedDatePicker value={formData.birthDate} onChange={date => setFormData({
                          ...formData,
                          birthDate: date
                        })} placeholder="اختر تاريخ الميلاد" className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" />
                                </div>
                              </div>
                             
                             {/* Second row: Family relation (1/2), Alive status (1/4), Death date (1/4) */}
                             <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-12 md:col-span-6">
                                   <Label htmlFor="parentRelation" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                     <UsersIcon className="h-4 w-4 text-primary" />
                                     العلاقة العائلية (الوالدين) *
                                    {formData.isFounder && <span className="text-xs text-muted-foreground mr-2">(مؤسس العائلة - لا يحتاج لوالدين)</span>}
                                  </Label>
                                   <SearchableDropdown options={loading || !familyMarriages || !familyMembers ? [{
                          value: "loading",
                          label: "جاري تحميل البيانات...",
                          disabled: true
                        }] : familyMarriages.length > 0 ? familyMarriages.filter(marriage => marriage && marriage.id && marriage.husband && marriage.wife).map(marriage => {
                          // Get full member details for proper naming
                          const husbandMember = familyMembers.find(member => member?.id === marriage.husband?.id);
                          const wifeMember = familyMembers.find(member => member?.id === marriage.wife?.id);
                          let displayName = '';

                          // Helper function to get father's name
                          const getFatherName = (member: any) => {
                            const father = familyMembers.find(m => m?.id === member?.father_id || m?.id === member?.fatherId);
                            return father?.name || '';
                          };

                          // Helper function to get grandfather's name
                          const getGrandfatherName = (member: any) => {
                            const father = familyMembers.find(m => m?.id === member?.father_id || m?.id === member?.fatherId);
                            if (father) {
                              const grandfather = familyMembers.find(m => m?.id === father?.father_id || m?.id === father?.fatherId);
                              return grandfather?.name || '';
                            }
                            return '';
                          };

                          // Helper function to build full genealogical name
                          const buildFullName = (member: any, isWife: boolean = false) => {
                            if (!member) return '';
                            const firstName = member.first_name || member.name?.split(' ')[0] || '';

                            // Determine internal vs external membership
                            const father = familyMembers.find(m => m?.id === member?.father_id || m?.id === member?.fatherId);
                            const grandfather = father ? familyMembers.find(m => m?.id === father?.father_id || m?.id === father?.fatherId) : null;
                            const isInternal = Boolean(father) || Boolean(member.is_founder);

                            // Internal members use lineage-based naming
                            if (isInternal) {
                              if (isWife) {
                                if (father) {
                                  const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
                                  return `${firstName} ابنة ${fatherFirstName}`;
                                }
                                return firstName;
                              } else {
                                if (father) {
                                  const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
                                  if (grandfather) {
                                    const grandfatherFirstName = grandfather.first_name || grandfather.name?.split(' ')[0] || grandfather.name;
                                    return `${firstName} ابن ${fatherFirstName} ابن ${grandfatherFirstName}`;
                                  }
                                  return `${firstName} ابن ${fatherFirstName}`;
                                }
                                return firstName;
                              }
                            }

                            // External members: show full name when available
                            const lastName = member.last_name;
                            return lastName ? `${member.first_name || firstName} ${lastName}` : (member.name || firstName);
                          };
                          const familyMember = husbandMember ? buildFullName(husbandMember, false) : 'غير محدد';
                          const spouse = wifeMember ? buildFullName(wifeMember, true) : 'غير محدد';
                          const heartIcon = marriage.marital_status === 'divorced' ? 'heart-crack' : 'heart';

                          // Debug logging
                          console.log('🔍 Marriage Display Debug:', {
                            husbandName: husbandMember?.name,
                            husbandFirstName: husbandMember?.first_name,
                            husbandIsFounder: husbandMember?.is_founder,
                            generatedFamilyMember: familyMember,
                            wifeName: wifeMember?.name,
                            wifeFirstName: wifeMember?.first_name,
                            generatedSpouse: spouse,
                            maritalStatus: marriage.marital_status,
                            heartIcon
                          });
                          return {
                            value: marriage.id,
                            familyMember,
                            spouse,
                            heartIcon,
                            isFounder: husbandMember?.is_founder || false
                          };
                        }) : [{
                          value: "no-data",
                          label: "لا توجد زيجات مسجلة في هذه العائلة",
                          disabled: true
                        }]} value={formData.selectedParent || ""} onValueChange={value => setFormData({
                          ...formData,
                          selectedParent: value === "none" ? null : value
                        })} disabled={loading || !familyMarriages || !familyMembers || formData.isFounder} placeholder={loading ? "جاري التحميل..." : formData.isFounder ? "مؤسس العائلة - لا يحتاج لوالدين" : "اختر الوالدين"} searchPlaceholder="ابحث عن الوالدين..." emptyMessage="لا توجد نتائج تطابق البحث" />
                               </div>
                              
                               <div className="col-span-6 md:col-span-3">
                                  <Label htmlFor="aliveStatus" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" />
                                    الحالة الحيوية
                                 </Label>
                                 <Select value={formData.isAlive ? "alive" : "deceased"} onValueChange={value => setFormData({
                          ...formData,
                          isAlive: value === "alive"
                        })}>
                                   <SelectTrigger className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm">
                                     <SelectValue placeholder="اختر الحالة الحيوية" />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-lg border-2">
                                     <SelectItem value="alive" className="font-arabic rounded-md">على قيد الحياة</SelectItem>
                                     <SelectItem value="deceased" className="font-arabic rounded-md">متوفى</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>

                                {!formData.isAlive && <div className="col-span-6 md:col-span-3">
                                     <Label className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                       <Skull className="h-4 w-4 text-primary" />
                                       تاريخ الوفاة
                                    </Label>
                                    <EnhancedDatePicker value={formData.deathDate} onChange={date => setFormData({
                          ...formData,
                          deathDate: date
                        })} placeholder="اختر تاريخ الوفاة" className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" />
                                  </div>}
                             </div>

                             {/* Biography and Profile Picture - Side by Side Layout */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               {/* Biography Section - 1/2 */}
                               <div>
                                 <Label htmlFor="bio" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                   <FileText className="h-4 w-4 text-primary" />
                                   السيرة الذاتية
                                 </Label>
                                 <Textarea id="bio" value={formData.bio} onChange={e => setFormData({
                          ...formData,
                          bio: e.target.value
                        })} placeholder="أدخل معلومات إضافية عن العضو" rows={6} className="font-arabic rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm resize-none" />
                               </div>

                               {/* Profile Picture Section - 1/2 */}
                               {(formMode === 'add' || formMode === 'edit') && <div className="space-y-3">
                                 <Label htmlFor="picture" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
                                   <Camera className="h-4 w-4 text-primary" />
                                   الصورة الشخصية
                                 </Label>
                              
                              {croppedImage || editingMember && editingMember.image ? <div className="space-y-3">
                                  <div className="relative group flex justify-center">
                                    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20 p-3">
                                       <img src={croppedImage || editingMember && editingMember.image} alt="صورة العضو" className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-lg" />
                                    </div>
                                  </div>
                                  
                                   {isImageUploadEnabled && <div className="flex justify-center gap-2">
                                     <Button type="button" size="sm" variant="secondary" onClick={handleEditImage} className="h-8 px-3">
                                       <Edit2 className="h-3 w-3 ml-1" />
                                       تعديل
                                     </Button>
                                     <Button type="button" size="sm" variant="destructive" onClick={handleDeleteImage} className="h-8 px-3">
                                       <Trash2 className="h-3 w-3 ml-1" />
                                       حذف
                                     </Button>
                                   </div>}
                                </div> : <div className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-300 h-[140px] flex items-center justify-center ${isImageUploadEnabled ? 'border-primary/40 cursor-pointer hover:border-primary/60' : 'border-gray-300 opacity-70 cursor-not-allowed'}`} onClick={() => isImageUploadEnabled && fileInputRef.current?.click()}>
                                  {isImageUploadEnabled ? <div className="space-y-2">
                                      <Upload className="h-8 w-8 text-primary mx-auto" />
                                      <p className="text-sm font-medium text-foreground">انقر لرفع الصورة</p>
                                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF حتى 10MB</p>
                                    </div> : <div className="space-y-2">
                                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                                      <p className="text-sm font-medium text-gray-500">رفع الصور غير متاح</p>
                                      <p className="text-xs text-gray-400">يتطلب اشتراك مدفوع</p>
                                    </div>}
                                </div>}
                              
                              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={!isImageUploadEnabled} />
                             </div>}
                           </div>
                         </div>}

                       {currentStep === 2 && <div className="space-y-4">
                           <h3 className="text-lg font-semibold">
                             {formData.gender === "male" ? "معلومات الزوجة/الزوجات" : "معلومات الزوج"}
                           </h3>
                           <p className="text-sm text-muted-foreground -mt-1">
                             {formData.gender === "male" ? "أضف معلومات الزوجة أو الزوجات إذا كان متزوجاً" : "أضف معلومات الزوج إذا كانت متزوجة"}
                           </p>
                           
                              {formData.gender === "male" ? <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* Wives Display Panel */}
                                  <div className="space-y-4 lg:col-span-1">
                                    <div className="flex items-center gap-2 mb-4 w-full">
                                     <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                       <Heart className="w-3 h-3 text-white" />
                                     </div>
                                     <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300 font-arabic">الزوجات</h4>
                                   </div>
                                   
                                    <div className="space-y-3">
                                       {wives.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                                           <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                           <p className="font-arabic mb-4">لم يتم إضافة زوجات بعد</p>
                                           <Button
                                             onClick={handleAddWife}
                                             className="bg-pink-500 hover:bg-pink-600 text-white font-arabic"
                                           >
                                             <Plus className="w-4 h-4 ml-2" />
                                             إضافة زوجة
                                           </Button>
                                        </div> : <>{wives.map((wife, index) => <div key={index} className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 border-2 border-dashed border-pink-400/60 dark:border-pink-500/60 min-h-[160px]">
                                              <div className="h-full flex flex-col justify-between">
                                                 {/* Header Section */}
                                                 <div className="flex items-start justify-between">
                                                   <div className="flex items-start gap-4 flex-1">
                                                     <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                                                       {wife.croppedImage ? (
                                                         <img 
                                                           src={wife.croppedImage} 
                                                           alt={wife.name || `الزوجة ${index + 1}`}
                                                           className="w-full h-full object-cover rounded-2xl"
                                                         />
                                                       ) : (
                                                         <Heart className="w-5 h-5" />
                                                       )}
                                                     </div>
                                                     <div className="flex-1">
                                                       <h5 className="font-semibold text-gray-900 dark:text-gray-100 font-arabic text-lg mb-2">
                                                         {wife.name || `الزوجة ${index + 1}`}
                                                       </h5>
                                                       
                                                       <div className="space-y-2">
                                                         <div className="flex items-center gap-2 flex-wrap">
                                                           {wife.isSaved && <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                                                               <Check className="h-3 w-3" />
                                                               محفوظة
                                                             </span>}
                                                           <span className="inline-flex items-center gap-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full text-xs font-medium">
                                                             <Heart className="h-3 w-3" />
                                                             {wife.maritalStatus === 'divorced' ? 'مطلقة' : 'متزوجة'}
                                                           </span>
                                                           <span className="text-xs text-muted-foreground font-arabic">
                                                             {wife.isFamilyMember ? 'من نفس العائلة' : 'خارج العائلة'}
                                                           </span>
                                                         </div>
                                                         {wife.isSaved && <p className="text-xs text-pink-600 dark:text-pink-400 font-arabic">
                                                             انقر للتعديل
                                                           </p>}
                                                       </div>
                                                     </div>
                                                   </div>
                                                   
                                                   {/* Action Buttons */}
                                                   <div className="flex gap-2 flex-shrink-0">
                                                    {wife.isSaved && <Button variant="outline" size="sm" onClick={() => {
                                                      handleSpouseEditAttempt('wife', wife, index);
                                                    }} className="gap-1 border-pink-200/50 dark:border-pink-700/50 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/50 transition-all duration-300 h-8 px-2">
                                                        <Edit className="h-3 w-3" />
                                                      </Button>}
                                                    <Button variant="outline" size="sm" onClick={() => handleSpouseDelete(wife, index)} className="gap-1 border-red-200/50 dark:border-red-700/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-300 h-8 px-2">
                                                      <X className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>)}
                                      
                                      {/* Always show Add Wife button */}
                                      <div className="text-center py-4">
                                        <Button
                                          onClick={handleAddWife}
                                          variant="outline"
                                          className="border-2 border-dashed border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 font-arabic"
                                        >
                                          <Plus className="w-4 h-4 ml-2" />
                                          إضافة زوجة أخرى
                                        </Button>
                                      </div></>}
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
                                    
                                      {/* Unified Spouse Form */}
                                      {activeSpouseType && showSpouseForm && (
                                        <SpouseForm 
                                          spouseType={activeSpouseType} 
                                          spouse={currentSpouse || {
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
                                          onSpouseChange={setCurrentSpouse} 
                                          familyMembers={familyMembers} 
                                          selectedMember={selectedMember} 
                                          commandOpen={spouseCommandOpen} 
                                          onCommandOpenChange={setSpouseCommandOpen} 
                                          familyStatus={spouseFamilyStatus} 
                                          onFamilyStatusChange={handleSpouseFamilyStatusChange} 
                                          onSave={() => handleSpouseSave(activeSpouseType)} 
                                          onAdd={() => handleAddSpouse(activeSpouseType)} 
                                          onClose={activeSpouseType === 'wife' ? handleCloseWifeEdit : handleCloseHusbandEdit} 
                                          showForm={showSpouseForm} 
                                        />
                                      )}
                                  </div>
                                 </div> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                   {/* Husband Display Panel */}
                                   <div className="space-y-4 lg:col-span-1">
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center">
                                        <User className="w-3 h-3 text-white" />
                                      </div>
                                      <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 font-arabic">معلومات الزوج</h4>
                                    </div>
                                    
                                     <div className="space-y-3">
                                       {!husband ? <div className="text-center py-8 text-muted-foreground">
                                            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="font-arabic mb-4">لم يتم إضافة زوج بعد</p>
                                            <Button
                                              onClick={handleAddHusband}
                                              className="bg-blue-500 hover:bg-blue-600 text-white font-arabic"
                                            >
                                              <Plus className="w-4 h-4 ml-2" />
                                              إضافة زوج
                                            </Button>
                                         </div> : <><div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 border-2 border-dashed border-blue-400/60 dark:border-blue-500/60 min-h-[160px]">
                                              <div className="h-full flex flex-col justify-between">
                                                {/* Header Section */}
                                                <div className="flex items-start justify-between">
                                                  <div className="flex items-start gap-4 flex-1">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                                                      {husband.croppedImage ? (
                                                        <img 
                                                          src={husband.croppedImage} 
                                                          alt={husband.name || 'الزوج'}
                                                          className="w-full h-full object-cover rounded-2xl"
                                                        />
                                                      ) : (
                                                        <User className="w-5 h-5" />
                                                      )}
                                                    </div>
                                                    <div className="flex-1">
                                                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 font-arabic text-lg mb-2">
                                                        {husband.name || 'الزوج'}
                                                      </h5>
                                                      
                                                      <div className="space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          {husband.isSaved && <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                                                              <Check className="h-3 w-3" />
                                                              محفوظ
                                                            </span>}
                                                          <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                                                            <User className="h-3 w-3" />
                                                            {husband.maritalStatus === 'divorced' ? 'زوج سابق' : 'متزوج'}
                                                          </span>
                                                          <span className="text-xs text-muted-foreground font-arabic">
                                                            {husband.isFamilyMember ? 'من نفس العائلة' : 'خارج العائلة'}
                                                          </span>
                                                        </div>
                                                        {husband.isSaved && <p className="text-xs text-blue-600 dark:text-blue-400 font-arabic">
                                                            انقر للتعديل
                                                          </p>}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  
                                                   {/* Action Buttons */}
                                                   <div className="flex gap-2 flex-shrink-0">
                                                    {husband.isSaved && <Button variant="outline" size="sm" onClick={() => {
                                   if (husband.isSaved) {
                                     handleSpouseEditAttempt('husband', husband, -1);
                                   }
                                 }} className="gap-1 border-blue-200/50 dark:border-blue-700/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300 h-8 px-2">
                                                       <Edit className="h-3 w-3" />
                                                     </Button>}
                                                   <Button variant="outline" size="sm" onClick={() => handleSpouseDelete(husband, -1)} className="gap-1 border-red-200/50 dark:border-red-700/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-300 h-8 px-2">
                                                     <X className="h-3 w-3" />
                                                   </Button>
                                                   </div>
                                                 </div>
                                               </div>
                                          </div>
                                       
                                       {/* Always show Add Husband button */}
                                      <div className="text-center py-4">
                                        <Button
                                          onClick={handleAddHusband}
                                          variant="outline"
                                          className="border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-arabic"
                                        >
                                          <Plus className="w-4 h-4 ml-2" />
                                          إضافة زوج آخر
                                        </Button>
                                      </div></>}
                                     </div>
                                  </div>

                                   {/* Unified Spouse Form */}
                                   <div className="space-y-4 lg:col-span-2">
                                    {activeSpouseType && showSpouseForm && (
                                      <SpouseForm 
                                        spouseType={activeSpouseType} 
                                        spouse={currentSpouse || {
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
                                        onSpouseChange={setCurrentSpouse} 
                                        familyMembers={familyMembers} 
                                        selectedMember={selectedMember} 
                                        commandOpen={spouseCommandOpen} 
                                        onCommandOpenChange={setSpouseCommandOpen} 
                                        familyStatus={spouseFamilyStatus} 
                                        onFamilyStatusChange={handleSpouseFamilyStatusChange} 
                                        onSave={() => handleSpouseSave(activeSpouseType)} 
                                        onAdd={() => handleAddSpouse(activeSpouseType)} 
                                        onClose={activeSpouseType === 'wife' ? handleCloseWifeEdit : handleCloseHusbandEdit} 
                                        showForm={showSpouseForm} 
                                      />
                                    )}
                                  </div>
                               </div>}
                          </div>}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-6">
                          <Button type="button" variant="outline" onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      handleCancelForm();
                    }} size="lg" className="flex items-center gap-2">
                            إلغاء
                          </Button>
                         
                         {currentStep < 2 ? <Button type="button" onClick={nextStep} size="lg" className="flex items-center gap-2">
                             التالي
                             <ArrowLeft className="h-4 w-4" />
                           </Button> : <div className="flex items-center gap-3">
                              <Button type="button" variant="outline" onClick={prevStep} size="lg" className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                العودة
                              </Button>
                              <Button type="button" onClick={() => handleFormSubmit(formData)} disabled={isSaving} size="lg" className="flex items-center gap-2">
                                {isSaving ? <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    جاري الحفظ...
                                  </> : <>
                                    <Save className="h-4 w-4" />
                                    حفظ
                                  </>}
                              </Button>
                            </div>}
                      </div>
                    </div>}
                </CardContent>
              </Card>
            </div>

            {/* Member List - Left Side on Desktop */}
            <div className={cn("space-y-4 h-full min-h-0", isMobile ? "order-1" : "col-span-4 order-1")}>
              {isMobile ? <Drawer open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      <Menu className="h-4 w-4" />
                      عرض قائمة الأعضاء ({familyMembers.length})
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="h-[80vh]">
                    <div className="p-4">
                        <MemberList members={filteredMembers} onEditMember={handleEditMember} onViewMember={handleViewMember} onDeleteMember={handleDeleteMember} onSpouseEditAttempt={handleSpouseEditWarning} checkIfMemberIsSpouse={checkIfMemberIsSpouse} searchTerm={searchTerm} onSearchChange={setSearchTerm} selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} getAdditionalInfo={getAdditionalInfo} getGenderColor={getGenderColor} familyMembers={familyMembers} marriages={familyMarriages} memberListLoading={memberListLoading} formMode={formMode} onAddMember={handleAddMember} packageData={packageData} />
                    </div>
                  </DrawerContent>
                </Drawer> : <Card className="bg-white backdrop-blur-xl border-white/30 shadow-xl h-full min-h-0 flex flex-col">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-lg"></div>
                  <CardHeader className="pb-4 relative shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                       <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                         أعضاء العائلة ({familyMembers.length})
                       </span>
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="relative overflow-y-auto flex-1 min-h-0">
                      <MemberList members={filteredMembers} onEditMember={handleEditMember} onViewMember={handleViewMember} onDeleteMember={handleDeleteMember} onSpouseEditAttempt={handleSpouseEditWarning} checkIfMemberIsSpouse={checkIfMemberIsSpouse} searchTerm={searchTerm} onSearchChange={setSearchTerm} selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} getAdditionalInfo={getAdditionalInfo} getGenderColor={getGenderColor} familyMembers={familyMembers} marriages={familyMarriages} memberListLoading={memberListLoading} formMode={formMode} onAddMember={handleAddMember} packageData={packageData} />
                  </CardContent>
                </Card>}
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
              <AlertDialogTitle className="text-2xl font-bold text-gray-900 font-arabic mb-2 text-center">
                تأكيد حذف {spouseToDelete?.wife?.name || 'الزوجة'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 text-base leading-relaxed font-arabic whitespace-pre-line rtl:text-right">
                {spouseDeleteWarning}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {/* Action buttons */}
            <AlertDialogFooter className="relative z-10 flex gap-3 pt-4">
              <AlertDialogCancel className="flex-1 h-12 text-base border-2 font-arabic hover:bg-gray-50 transition-all duration-300">
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmSpouseDelete} className="flex-1 h-12 text-base bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-arabic shadow-lg hover:shadow-xl transition-all duration-300 border-0">
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
            {selectedImage && <div className="relative h-96">
                <Cropper image={selectedImage} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
              </div>}
            
            <div className="space-y-2">
              <Label>التكبير</Label>
              <Slider value={[zoom]} onValueChange={value => setZoom(value[0])} min={1} max={3} step={0.1} className="w-full" />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCropDialog(false)}>
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

            {memberToDelete && <div className="space-y-4 px-2">
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
                  const spouses = familyMarriages.filter((marriage: any) => marriage.husband?.id === memberToDelete.id || marriage.wife?.id === memberToDelete.id).map((marriage: any) => {
                    const spouseId = marriage.husband?.id === memberToDelete.id ? marriage.wife?.id : marriage.husband?.id;
                    return familyMembers.find(m => m.id === spouseId);
                  }).filter(Boolean);
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
                  const marriages = familyMarriages.filter((marriage: any) => marriage.husband?.id === memberToDelete.id || marriage.wife?.id === memberToDelete.id);
                  return <>
                          {/* Main person */}
                          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                            <User className="h-4 w-4 text-red-600" />
                            <span className="text-red-800 font-medium">الشخص المحدد: {memberToDelete.name}</span>
                          </div>

                          {/* Spouses */}
                          {spouses.length > 0 && <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                              <Heart className="h-4 w-4 text-pink-600" />
                              <div>
                                <span className="text-pink-800 font-medium">الأزواج: {spouses.length}</span>
                                <div className="text-sm text-pink-700 mt-1">
                                  {spouses.map((spouse, index) => <span key={index}>
                                      {spouse?.name || 'غير معروف'}
                                      {index < spouses.length - 1 && ', '}
                                    </span>)}
                                </div>
                              </div>
                            </div>}

                          {/* Children and descendants */}
                          {children.length > 0 && <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <Users className="h-4 w-4 text-blue-600" />
                              <div>
                                <span className="text-blue-800 font-medium">
                                  الأطفال المباشرين: {children.length}
                                </span>
                                {allDescendants.length > children.length && <div className="text-sm text-blue-700 mt-1">
                                    إجمالي الأحفاد: {allDescendants.length} شخص
                                  </div>}
                              </div>
                            </div>}

                          {/* Marriages */}
                          {marriages.length > 0 && <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <Heart className="h-4 w-4 text-purple-600" />
                              <span className="text-purple-800 font-medium">علاقات الزواج: {marriages.length}</span>
                            </div>}
                        </>;
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
              </div>}
          </div>

          <AlertDialogFooter className="gap-3 pt-6">
            <AlertDialogCancel className="flex-1 hover:bg-gray-100">
              <X className="h-4 w-4 mr-2" />
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium shadow-lg">
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
              <AlertDialogTitle className="font-arabic text-xl text-gray-800 font-bold text-center">
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
                        لا يمكن تعديل بيانات {spouseToEdit.name} مباشرة
                      </div>
                 </div>
              </div>

              {/* Partner name highlight */}
              {spousePartnerDetails.name && <div className="bg-white rounded-lg p-4 border-2 border-primary/20 shadow-sm animate-fade-in">
                   <div className="flex items-center justify-center mb-2">
                     <Edit className="h-5 w-5 text-primary mr-2" />
                     <div className="text-sm text-gray-600">للتعديل، انتقل إلى:</div>
                   </div>
                   <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
                       <div className="font-bold text-primary text-lg animate-pulse">
                         {spousePartnerDetails.name}
                       </div>
                   </div>
                </div>}

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

            <AlertDialogFooter className="pt-6 flex flex-col gap-3">
              <AlertDialogCancel className="font-arabic w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-300 text-gray-700 hover:text-gray-800 transition-all duration-200 hover-scale">
                <ArrowRight className="h-4 w-4 mr-2" />
                عودة
              </AlertDialogCancel>
              <Button className="font-arabic w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white transition-all duration-200 hover-scale" onClick={() => {
              setShowSpouseEditWarning(false);
              // Find the specific member to edit based on spousePartnerDetails
              const memberToEdit = familyMembers.find(member => member.first_name === spousePartnerDetails.name || member.name === spousePartnerDetails.name || `${member.first_name} ${member.last_name}`.trim() === spousePartnerDetails.name);
              if (memberToEdit) {
                setFormMode('edit');
                setEditingMember(memberToEdit);
                setCurrentStep(1);
                populateFormData(memberToEdit);
                if (isMobile) setIsMemberListOpen(false);
              }
            }}>
                <Edit className="h-4 w-4 mr-2" />
                تعديل بيانات {spousePartnerDetails.first_name || "العضو"}
              </Button>
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
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="flex-1">
              إلغاء
            </Button>
            <Button onClick={() => {
            setShowUpgradeModal(false);
            navigate('/plan-selection');
          }} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Crown className="h-4 w-4 ml-2" />
              ترقية الباقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </main>
      <GlobalFooterSimplified />
    </div>;
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
  return <div className="space-y-4 h-full min-h-0 flex flex-col">
      {/* Search and Filter on the same row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن عضو..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="pl-10" />
        </div>
        <div className="flex-1">
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
        </div>
      </div>

      {/* Add Member Button */}
      {formMode === 'view' && <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onAddMember} className="w-full flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {packageData && familyMembers.length >= packageData.max_family_members ? `تم الوصول للحد الأقصى (${packageData.max_family_members} أعضاء)` : 'إضافة عضو جديد'}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" side="top">
              {packageData && familyMembers.length >= packageData.max_family_members ? <div className="text-center">
                  <p className="font-semibold text-destructive mb-1">
                    🚫 تم الوصول للحد الأقصى
                  </p>
                  <p className="text-sm">
                    باقتك الحالية تسمح بإضافة {packageData.max_family_members} أعضاء فقط
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    قم بترقية باقتك لإضافة المزيد من الأعضاء
                  </p>
                </div> : <p className="text-sm">انقر لإضافة عضو جديد إلى الشجرة</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>}

      {/* Member List */}
      <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
        {memberListLoading ?
      // Loading skeletons
      Array.from({
        length: 3
      }).map((_, index) => <div key={index} className="p-4 rounded-3xl border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 bg-white/50 dark:bg-gray-800/50">
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
            </div>) : members.length === 0 ? <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>لا توجد أعضاء</p>
          </div> : members.map((member: any) => (
            <MemberCard
              key={member.id}
              member={member}
              familyMembers={familyMembers}
              marriages={marriages}
              onViewMember={onViewMember}
              onEditMember={onEditMember}
              onDeleteMember={onDeleteMember}
              onSpouseEditAttempt={onSpouseEditAttempt}
              checkIfMemberIsSpouse={checkIfMemberIsSpouse}
              getGenderColor={getGenderColor}
            />
          ))}
      </div>
    </div>;
};
export default FamilyBuilderNew;