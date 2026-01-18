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
import { Checkbox } from "@/components/ui/checkbox";
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
import DOMPurify from 'dompurify';
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
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { useAuth } from "@/contexts/AuthContext";
import { 
  cascadingDeleteMember, 
  createMember as createMemberApi, 
  updateMember as updateMemberApi,
  createOrUpdateMarriage as createOrUpdateMarriageApi,
  createOrUpdateSpouse,
  deleteSpouseWithMarriage,
  updateTwinGroup,
  removeFromTwinGroup
} from "@/services/familyBuilderService";
import { membersApi, marriagesApi, familiesApi } from '@/lib/api';
import { uploadMemberImage, getMemberImageUrl, deleteMemberImage } from "@/utils/imageUpload";
import Cropper from "react-easy-crop";
import { useIsMobile } from "@/hooks/use-mobile";
import { SpouseForm, SpouseData } from "@/components/SpouseForm";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import FamilyBuilderNewSkeleton from "@/components/skeletons/FamilyBuilderNewSkeleton";
import MemberProfileSkeleton from "@/components/skeletons/MemberProfileSkeleton";
import { MemberProfileView } from "@/components/MemberProfileView";
import { TreeSettingsButton } from "@/pages/FamilyBuilderNew/components/TreeSettings/TreeSettingsButton";
import { MemberCard } from "@/components/shared/MemberCard";
import { MemberList } from "@/pages/FamilyBuilderNew/components/MemberList/MemberList";
import { TreeSettingsView } from "@/pages/FamilyBuilderNew/components/TreeSettings/TreeSettingsView";
import { CustomDomainCard } from "@/pages/FamilyBuilderNew/components/TreeSettings/CustomDomainCard";
import { useFamilyData } from "@/contexts/FamilyDataContext";


const FamilyBuilderNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    hasAIFeatures
  } = useSubscription();
  const isMobile = useIsMobile();
  
  // ✅ Use useAuth() for user data (no extra network call!)
  const { user: authUser } = useAuth();
  
  // ✅ Use FamilyDataContext for shared data (no duplicate queries!)
  const { 
    familyData: contextFamilyData, 
    familyMembers: contextMembers, 
    marriages: contextMarriages,
    loading: contextLoading,
    refetch: refetchFamilyData 
  } = useFamilyData();

  // Image Upload and Crop Component (consolidated states)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);
  const [editingMemberImageUrl, setEditingMemberImageUrl] = useState<string | null>(null);
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

    // Calculate scale factor to keep image under max size (1200px)
    const MAX_SIZE = 1200;
    const scale = Math.min(MAX_SIZE / pixelCrop.width, MAX_SIZE / pixelCrop.height, 1);
    
    // Set canvas dimensions based on scaled size
    canvas.width = pixelCrop.width * scale;
    canvas.height = pixelCrop.height * scale;

    // Draw image with scaling
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Compress to JPEG with quality 0.8
    return new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => {
        resolve(blob);
      }, 'image/jpeg', 0.8); // Lower quality for smaller file size
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
        try {
          const memberData = await membersApi.get(editingMember.id);
          currentPath = memberData?.image_url ?? null;
        } catch (error) {
          console.error('Error fetching member image:', error);
        }
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
        await membersApi.updateImage(editingMember.id, null);
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
    else if (croppedImage || editingMemberImageUrl) {
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

  // Get subscription from context
  const { subscription } = useSubscription();
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

  // ✅ Marriages sync is now handled in the main useEffect below (line ~530)

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

  // ✅ REMOVED: fetchFamilyData - data is now synced from FamilyDataContext below

  // ✅ Sync Context data to local state immediately
  useEffect(() => {
    if (contextLoading) {
      setLoading(true);
      return;
    }
    
    // 1) Update family data
    setFamilyData(contextFamilyData || null);
    
    // 2) Transform members from context to local state structure
    const transformedMembers = (contextMembers || []).map(member => ({
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
      isAlive: member.is_alive !== false,
      deathDate: member.death_date || null,
      image: member.image_url || null,
      bio: member.biography || '',
      marital_status: member.marital_status || 'single',
      relation: "",
      is_twin: member.is_twin || false,
      twin_group_id: member.twin_group_id || null
    }));
    setFamilyMembers(transformedMembers);
    
    // 3) Link marriages with members from transformed list
    const marriagesWithMembers = (contextMarriages || []).map((marriage: any) => {
      const husband = transformedMembers.find(m => m.id === marriage.husband_id) || null;
      const wife = transformedMembers.find(m => m.id === marriage.wife_id) || null;
      
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
    setFamilyMarriages(marriagesWithMembers);
    setLoading(false);
  }, [contextFamilyData, contextMembers, contextMarriages, contextLoading]);

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

  // Auto-open member profile when member parameter is present in URL
  useEffect(() => {
    const memberId = searchParams.get('member');
    if (memberId && !loading && familyMembers?.length > 0 && formMode === 'view') {
      const member = familyMembers.find((m: any) => m.id === memberId);
      if (member) {
        setEditingMember(member);
        setFormMode('profile');
        // Remove member from URL to prevent reopening after close
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('member');
        navigate({ pathname: location.pathname, search: newParams.toString() }, { replace: true });
      }
    }
  }, [searchParams, loading, familyMembers, formMode]);

  // Load spouses when data is updated and there's a member being edited
  useEffect(() => {
    if (editingMember?.id && familyMarriages?.length > 0 && familyMembers?.length > 0) {
      loadExistingSpouses(editingMember);
    }
  }, [editingMember?.id, familyMarriages?.length, familyMembers?.length]);

  // Load signed URL for editing member's image if it's a storage path
  useEffect(() => {
    const loadEditingMemberImage = async () => {
      if (editingMember?.image && !editingMember.image.startsWith('data:image/') && !editingMember.image.startsWith('blob:')) {
        // It's a storage path, fetch signed URL
        const signedUrl = await getMemberImageUrl(editingMember.image);
        setEditingMemberImageUrl(signedUrl);
      } else {
        // It's Base64 or blob URL, use directly
        setEditingMemberImageUrl(editingMember?.image || null);
      }
    };
    
    loadEditingMemberImage();
  }, [editingMember?.image]);

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
    isFounder: false,
    is_twin: false,
    twin_group_id: null as string | null,
    selected_twins: [] as string[]
  });
  const [wives, setWives] = useState<SpouseData[]>([]);
  const [husbands, setHusbands] = useState<SpouseData[]>([]);

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
  const [parentsLocked, setParentsLocked] = useState(false);

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
        // Update husband - similar logic to wives
        console.log('🔍 HUSBAND SAVE - Determining index logic...');
        console.log('🔍 currentSpouse.id:', currentSpouse.id);
        console.log('🔍 husbands array:', husbands.map(h => ({
          id: h.id,
          name: h.name
        })));

        // Try to find by ID match
        let husbandIndex = husbands.findIndex(h => h.id === currentSpouse.id);
        console.log('🔍 Index by ID match:', husbandIndex);

        if (husbandIndex >= 0) {
          // Update existing husband
          console.log('🔍 UPDATING existing husband at index:', husbandIndex);
          const existingHusband = husbands[husbandIndex];
          const updatedHusband = {
            ...updatedSpouse,
            id: existingHusband.id || updatedSpouse.id,
            existingFamilyMemberId: existingHusband.existingFamilyMemberId || updatedSpouse.existingFamilyMemberId,
            isSaved: true
          };
          const updatedHusbands = [...husbands];
          updatedHusbands[husbandIndex] = updatedHusband;
          setHusbands(updatedHusbands);
          saveSpouseDataToLocalStorage('husband', updatedHusbands);
        } else {
          // Add new husband
          console.log('🔍 ADDING new husband');
          const newHusbands = [...husbands, updatedSpouse];
          setHusbands(newHusbands);
          saveSpouseDataToLocalStorage('husband', newHusbands);
        }
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
      console.log('Closing husband form, current husbands before close:', husbands);

      // Ensure all husbands are marked as saved when closing
      const updatedHusbands = husbands.map(husband => ({
        ...husband,
        isSaved: true
      }));
      setHusbands(updatedHusbands);
      console.log('Husband form closed, all husbands marked as saved');
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
      const updatedHusbands = [...husbands];
      updatedHusbands[index] = {
        ...normalizedSpouseData,
        isSaved: false,
        isFamilyMember: isSpouseFamilyMember
      };
      setHusbands(updatedHusbands);
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
    try {
      // Use the centralized cascading delete service
      const result = await cascadingDeleteMember(
        member.id,
        familyId!,
        familyMembers,
        familyMarriages
      );

      // Update local state
      const membersToDelete = new Set<string>();
      const marriagesToDelete = new Set<string>();
      
      // Recalculate which members/marriages were deleted for local state update
      membersToDelete.add(member.id);
      familyMarriages.forEach((marriage: any) => {
        if (marriage.husband?.id === member.id || marriage.wife?.id === member.id) {
          marriagesToDelete.add(marriage.id);
          const spouseId = marriage.husband?.id === member.id ? marriage.wife?.id : marriage.husband?.id;
          const spouse = familyMembers.find(m => m.id === spouseId);
          if (spouse && checkIfMemberIsSpouse(spouse)) {
            membersToDelete.add(spouseId);
          }
        }
      });
      
      const findDescendants = (parentId: string) => {
        familyMembers.filter(m => m.fatherId === parentId || m.motherId === parentId).forEach(child => {
          membersToDelete.add(child.id);
          familyMarriages.filter((m: any) => m.husband?.id === child.id || m.wife?.id === child.id).forEach((m: any) => {
            marriagesToDelete.add(m.id);
            const spouseId = m.husband?.id === child.id ? m.wife?.id : m.husband?.id;
            const spouse = familyMembers.find(mem => mem.id === spouseId);
            if (spouse && checkIfMemberIsSpouse(spouse)) membersToDelete.add(spouseId);
          });
          findDescendants(child.id);
        });
      };
      findDescendants(member.id);

      setFamilyMembers(familyMembers.filter(m => !membersToDelete.has(m.id)));
      setFamilyMarriages(familyMarriages.filter((marriage: any) => !marriagesToDelete.has(marriage.id)));
      
      toast({
        title: t('family_builder.deleted', 'تم الحذف بنجاح'),
        description: `تم حذف ${result.membersDeleted} عضو و ${result.marriagesDeleted} علاقة زواج من شجرة العائلة`
      });

      await refetchFamilyData();
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

  // Confirm spouse deletion (immediate database deletion) - using API
  const confirmSpouseDelete = async () => {
    console.log('🚨 CONFIRM SPOUSE DELETE CALLED');
    if (!spouseToDelete) {
      console.log('❌ No spouse to delete');
      return;
    }
    
    const { wife, index } = spouseToDelete;
    console.log('🚨 DELETING SPOUSE:', { wife: wife?.name, index });
    
    try {
      if (index >= 0) {
        // Determine if this is a husband or wife based on the context
        const isHusbandDeletion = wife?.gender === 'male' || husbands.some(h => h.id === wife?.id);
        
        if (isHusbandDeletion) {
          const husbandToDelete = husbands[index];
          
          if (husbandToDelete && husbandToDelete.isSaved && editingMember) {
            const husbandId = husbandToDelete.id || husbandToDelete.existingFamilyMemberId;
            
            try {
              // Use API to delete - the member delete will cascade to marriages
              if (!husbandToDelete.isFamilyMember) {
                await membersApi.delete(husbandId);
              } else {
                // Update family member husband to single
                await membersApi.update(husbandId, { marital_status: 'single' });
                // Find and delete the marriage
                const marriageToDelete = familyMarriages.find(
                  (m: any) => m.wife_id === editingMember.id && m.husband_id === husbandId
                );
                if (marriageToDelete) {
                  await marriagesApi.delete(marriageToDelete.id);
                }
              }
            } catch (error) {
              console.error('Error deleting husband:', error);
              toast({
                title: "خطأ في الحذف",
                description: "فشل في حذف بيانات الزوج",
                variant: "destructive"
              });
              return;
            }
          }
          
          const updatedHusbands = husbands.filter((_, i) => i !== index);
          setHusbands(updatedHusbands);
          toast({
            title: "تم الحذف بنجاح",
            description: "تم حذف الزوج نهائياً",
            variant: "default"
          });
        } else {
          // Wife deletion
          const wifeToDelete = wives[index];
          
          if (wifeToDelete && wifeToDelete.isSaved && editingMember) {
            const wifeId = wifeToDelete.id || wifeToDelete.existingFamilyMemberId;
            
            try {
              if (!wifeToDelete.isFamilyMember) {
                await membersApi.delete(wifeId);
              } else {
                await membersApi.update(wifeId, { marital_status: 'single' });
                const marriageToDelete = familyMarriages.find(
                  (m: any) => m.husband_id === editingMember.id && m.wife_id === wifeId
                );
                if (marriageToDelete) {
                  await marriagesApi.delete(marriageToDelete.id);
                }
              }
            } catch (error) {
              console.error('Error deleting wife:', error);
              toast({
                title: "خطأ في الحذف",
                description: "فشل في حذف بيانات الزوجة",
                variant: "destructive"
              });
              return;
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
      }
      
      // Refresh family data to reflect changes
      await refetchFamilyData();
      
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
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (member.name || '').toLowerCase().includes(searchLower) ||
      (member.first_name || '').toLowerCase().includes(searchLower) ||
      (member.last_name || '').toLowerCase().includes(searchLower);
    
    const matchesFilter = 
      selectedFilter === "all" || 
      (selectedFilter === "alive" && member.isAlive === true) || 
      (selectedFilter === "deceased" && member.isAlive === false) || 
      (selectedFilter === "male" && member.gender === "male") || 
      (selectedFilter === "female" && member.gender === "female") || 
      (selectedFilter === "founders" && member.isFounder === true);
    
    return matchesSearch && matchesFilter;
  });

  // Get siblings (same father AND mother) - for Twin feature
  const getSiblings = useCallback((currentMemberId: string | null, fatherId: string | null, motherId: string | null): any[] => {
    if (!fatherId || !motherId) return [];
    
    return familyMembers.filter(member => 
      member.id !== currentMemberId && // ليس نفس الشخص
      member.fatherId === fatherId && 
      member.motherId === motherId
    );
  }, [familyMembers]);

  // Get current member's siblings based on form data
  const currentSiblings = useMemo(() => {
    let fatherId = null;
    let motherId = null;
    
    if (formMode === 'edit') {
      // في وضع التعديل: استخدم بيانات العضو الحالي
      fatherId = editingMember?.fatherId;
      motherId = editingMember?.motherId;
    } else {
      // في وضع الإضافة: استخرج الوالدين من الزواج المحدد
      if (formData.selectedParent && formData.selectedParent !== "none") {
        const selectedMarriage = familyMarriages.find(m => m.id === formData.selectedParent);
        if (selectedMarriage) {
          fatherId = selectedMarriage.husband?.id || null;
          motherId = selectedMarriage.wife?.id || null;
        }
      }
    }
    
    if (!fatherId || !motherId) return [];
    
    const currentId = formMode === 'edit' ? editingMember?.id : null;
    return getSiblings(currentId, fatherId, motherId);
  }, [formMode, editingMember, formData.selectedParent, familyMarriages, getSiblings]);

  // Form panel actions
  const handleAddMember = () => {
    // Check if user has reached package limit using subscription from context
    if (subscription?.package_name && familyMembers.length >= subscription.package_name.max_family_members) {
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
  // Track latest member click to handle race conditions
  const latestMemberClickRef = useRef<string | null>(null);
  
  const fetchMemberProfile = useCallback(async (memberId: string) => {
    // Store this as the latest click - if another click comes, this will be outdated
    const clickId = `${memberId}_${Date.now()}`;
    latestMemberClickRef.current = clickId;
    
    try {
      setProfileLoading(true);

      const getMemberFromLocalCache = (id: string) => {
        return (familyMembers || []).find((m: any) => m?.id === id) ?? null;
      };

      // Check if this is still the latest click before proceeding
      if (latestMemberClickRef.current !== clickId) {
        console.log('[fetchMemberProfile] Aborted - newer click detected');
        return;
      }

      // Use cached data directly - no API call needed if data exists
      const cachedMember = getMemberFromLocalCache(memberId);
      if (!cachedMember) {
        // Only fetch from API if not in cache
        const memberData = await membersApi.get(memberId);
        if (!memberData) throw new Error('Member not found');
        
        // Check again if still latest click after API call
        if (latestMemberClickRef.current !== clickId) {
          console.log('[fetchMemberProfile] Aborted after API - newer click detected');
          return;
        }
        
        // Process API data
        const transformedMember = {
          id: memberData.id,
          name: memberData.name,
          first_name: (memberData as any).first_name ?? null,
          last_name: (memberData as any).last_name ?? null,
          fatherId: (memberData as any).father_id ?? null,
          motherId: (memberData as any).mother_id ?? null,
          spouseId: (memberData as any).spouse_id ?? null,
          relatedPersonId: (memberData as any).related_person_id ?? null,
          isFounder: (memberData as any).is_founder ?? false,
          gender: (memberData as any).gender ?? null,
          birthDate: (memberData as any).birth_date ?? "",
          isAlive: (memberData as any).is_alive ?? null,
          deathDate: (memberData as any).death_date ?? null,
          image: (memberData as any).image_url ?? null,
          bio: (memberData as any).biography ?? "",
          marital_status: (memberData as any).marital_status ?? 'single',
          relation: "",
          is_twin: (memberData as any).is_twin ?? false,
          twin_group_id: (memberData as any).twin_group_id ?? null,
        };
        setMemberProfileData(transformedMember);
        setEditingMember(transformedMember);
      } else {
        // Use cached data directly - fast path!
        const transformedMember = {
          id: cachedMember.id,
          name: cachedMember.name,
          first_name: cachedMember.first_name ?? cachedMember.firstName ?? null,
          last_name: cachedMember.last_name ?? cachedMember.lastName ?? null,
          fatherId: cachedMember.father_id ?? cachedMember.fatherId ?? null,
          motherId: cachedMember.mother_id ?? cachedMember.motherId ?? null,
          spouseId: cachedMember.spouse_id ?? cachedMember.spouseId ?? null,
          relatedPersonId: cachedMember.related_person_id ?? cachedMember.relatedPersonId ?? null,
          isFounder: cachedMember.is_founder ?? cachedMember.isFounder ?? false,
          gender: cachedMember.gender ?? null,
          birthDate: cachedMember.birth_date ?? cachedMember.birthDate ?? "",
          isAlive: cachedMember.is_alive ?? cachedMember.isAlive ?? null,
          deathDate: cachedMember.death_date ?? cachedMember.deathDate ?? null,
          image: cachedMember.image_url ?? cachedMember.image ?? null,
          bio: cachedMember.biography ?? cachedMember.bio ?? "",
          marital_status: cachedMember.marital_status ?? cachedMember.maritalStatus ?? 'single',
          relation: "",
          is_twin: cachedMember.is_twin ?? cachedMember.isTwin ?? false,
          twin_group_id: cachedMember.twin_group_id ?? cachedMember.twinGroupId ?? null,
        };
        setMemberProfileData(transformedMember);
        setEditingMember(transformedMember);
      }

      // Build marriages from local cache
      const sourceMarriages = contextMarriages ?? familyMarriages ?? [];
      const memberMarriagesData = sourceMarriages.filter(
        (m: any) => m?.husband_id === memberId || m?.wife_id === memberId
      );

      if (memberMarriagesData.length > 0) {
        const memberMarriages = memberMarriagesData.map((marriage: any) => {
          const husband = marriage?.husband ?? getMemberFromLocalCache(marriage.husband_id);
          const wife = marriage?.wife ?? getMemberFromLocalCache(marriage.wife_id);
          return { ...marriage, husband, wife };
        });

        setFamilyMarriages((prev: any[]) => {
          const byId = new Map(prev.map((m: any) => [m.id, m]));
          memberMarriages.forEach((m: any) => byId.set(m.id, m));
          return Array.from(byId.values());
        });
      }
    } catch (error) {
      // Only show error if this is still the latest click
      if (latestMemberClickRef.current === clickId) {
        console.error('Error fetching member profile:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ في تحميل بيانات العضو",
          variant: "destructive",
        });
      }
    } finally {
      // Only update loading if this is still the latest click
      if (latestMemberClickRef.current === clickId) {
        setProfileLoading(false);
      }
    }
  }, [familyMembers, contextMarriages, familyMarriages, toast]);

  const handleViewMember = useCallback((member: any) => {
    // Immediately update UI - no waiting for data fetch
    setFormMode('profile');
    setEditingMember(member);
    if (isMobile) setIsMemberListOpen(false);

    // Fetch additional profile data in background (non-blocking)
    fetchMemberProfile(member.id);
  }, [isMobile, fetchMemberProfile]);
  const handleEditMember = useCallback((member: any) => {
    setFormMode('edit');
    setEditingMember(member);
    setCurrentStep(1);
    
    // Close spouse form before loading member data
    setCurrentSpouse(null);
    setActiveSpouseType(null);
    setShowSpouseForm(false);
    setSpouseFamilyStatus(null);
    
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
      isFounder: false,
      is_twin: false,
      twin_group_id: null,
      selected_twins: []
    });
    setParentsLocked(false);
    setWives([]);
    setHusbands([]);
    setOriginalWivesData([]);
    setOriginalHusbandData(null);
    
    // Reset spouse form states
    setCurrentSpouse(null);
    setActiveSpouseType(null);
    setShowSpouseForm(false);
    setSpouseFamilyStatus(null);
    setEditingWifeIndex(null);
    
    // Clear image states
    setCroppedImage(null);
    setSelectedImage(null);
    setImageChanged(false);
    setEditingMemberImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const populateFormData = (member: any) => {
    // جلب الإخوة التوائم الحاليين إذا كان هذا العضو توأم
    let currentTwinSiblings: string[] = [];
    if (member.is_twin && member.twin_group_id) {
      currentTwinSiblings = familyMembers
        .filter((m: any) => 
          m.id !== member.id && 
          m.twin_group_id === member.twin_group_id
        )
        .map((m: any) => m.id);
    }

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
      isFounder: member.isFounder || false,
      is_twin: member.is_twin || false,
      twin_group_id: member.twin_group_id || null,
      selected_twins: currentTwinSiblings
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
    setHusbands([]);
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
        setHusbands([husbandData]);
        setOriginalHusbandData({
          ...husbandData
        }); // Store original data for change detection
      } else {
        setHusbands([]);
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
    if (submissionData.gender === 'female' && husbands.length > 0) {
      const savedHusbands = husbands.filter(husband => husband.isSaved === true);
      for (const husband of savedHusbands) {
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
      const currentMember = await membersApi.get(existingId).catch(() => null);

      // Handle image state properly
      let imageUrl;
      if (spouse.croppedImage !== undefined) {
        imageUrl = spouse.croppedImage || null;
      } else {
        imageUrl = currentMember?.image_url || null;
      }
      const spouseName = spouse.name || (spouse.firstName && spouse.lastName ? `${spouse.firstName} ${spouse.lastName}` : spouse.firstName || spouse.lastName || '');
      
      const updatedSpouse = await membersApi.update(existingId, {
        name: spouseName,
        first_name: spouse.firstName || null,
        last_name: spouse.lastName || familyData?.name || null,
        birth_date: formatDateForDatabase(spouse.birthDate),
        is_alive: spouse.isAlive ?? true,
        death_date: !spouse.isAlive ? formatDateForDatabase(spouse.deathDate) : null,
        marital_status: spouse.maritalStatus || 'married',
        image_url: imageUrl,
        biography: spouse.biography || null,
      });
      return updatedSpouse.id;
    } else {
      // Create new spouse member using API
      const firstName = spouse.firstName || '';
      const lastName = spouse.lastName || familyData?.name || '';
      const spouseName = firstName && lastName ? `${firstName} ${lastName}` : spouse.name || firstName || lastName || '';
      
      const newSpouseMember = await membersApi.create({
        name: spouseName,
        first_name: firstName,
        last_name: lastName,
        gender: isWife ? 'female' : 'male',
        birth_date: formatDateForDatabase(spouse.birthDate),
        is_alive: spouse.isAlive ?? true,
        death_date: !spouse.isAlive ? formatDateForDatabase(spouse.deathDate) : undefined,
        family_id: familyId,
        created_by: familyData?.creator_id,
        is_founder: false,
        marital_status: spouse.maritalStatus || 'married',
        image_url: spouse.croppedImage || undefined,
        biography: spouse.biography || undefined,
      });
      return newSpouseMember.id;
    }
  };
  const updateSpouseMemberStatus = async (spouse, spouseType) => {
    // Get current data to handle image state properly
    let currentMember;
    try {
      currentMember = await membersApi.get(spouse.existingFamilyMemberId);
    } catch {
      currentMember = null;
    }

    // Handle image state properly - upload to storage if new image provided
    let imageUrl;
    if (spouse.croppedImage && spouse.croppedImage !== currentMember?.image_url) {
      // Check if this is a blob URL (new image)
      if (spouse.croppedImage.startsWith('blob:')) {
        // Delete old image from storage if exists
        if (currentMember?.image_url && !currentMember.image_url.startsWith('data:image/')) {
          await deleteMemberImage(currentMember.image_url);
        }
        
        // Upload new image to storage
        const croppedBlob = (window as any).__croppedImageBlob;
        if (croppedBlob) {
          imageUrl = await uploadMemberImage(croppedBlob, spouse.existingFamilyMemberId);
          console.log('✅ Spouse image uploaded to storage:', imageUrl);
        } else {
          imageUrl = currentMember?.image_url || null;
        }
      } else {
        // New Base64 image provided (legacy)
        imageUrl = spouse.croppedImage;
      }
    } else {
      // No new image, preserve existing
      imageUrl = currentMember?.image_url || null;
    }
    
    // Update spouse member using API
    try {
      await membersApi.update(spouse.existingFamilyMemberId, {
        marital_status: spouse.maritalStatus,
        image_url: imageUrl,
        biography: spouse.biography || null
      });
      console.log(`Successfully updated ${spouseType} marital status to:`, spouse.maritalStatus);
    } catch (error) {
      console.error(`Error updating ${spouseType} marital status:`, error);
    }

    // Update marriage table marital status - find the marriage first
    const memberMarriage = familyMarriages.find((m: any) => 
      spouseType === 'wife' 
        ? m.wife_id === spouse.existingFamilyMemberId 
        : m.husband_id === spouse.existingFamilyMemberId
    );

    if (memberMarriage) {
      try {
        await marriagesApi.update(memberMarriage.id, {
          marital_status: spouse.maritalStatus
        });
        
        // Update the other spouse's marital status
        const otherSpouseId = spouseType === 'wife' ? memberMarriage.husband_id : memberMarriage.wife_id;
        if (otherSpouseId && otherSpouseId !== spouse.existingFamilyMemberId) {
          await membersApi.update(otherSpouseId, {
            marital_status: spouse.maritalStatus
          });
          console.log(`Also updated other spouse's marital status to:`, spouse.maritalStatus);
        }
      } catch (error) {
        console.error('Error updating marriage status:', error);
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

    // Check if either person is already married to someone else (still using Supabase for query)
    const existingHusbandMarriage = familyMarriages.find((m: any) => 
      m.husband_id === husbandId && m.is_active && m.wife_id !== wifeId
    );
    const existingWifeMarriage = familyMarriages.find((m: any) => 
      m.wife_id === wifeId && m.is_active && m.husband_id !== husbandId
    );

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
    const existingMarriage = familyMarriages.find((m: any) => 
      m.husband_id === husbandId && m.wife_id === wifeId
    );
    
    try {
      if (existingMarriage) {
        // Update existing marriage to ensure it's active
        await marriagesApi.update(existingMarriage.id, {
          is_active: true,
          marital_status: spouse.maritalStatus || 'married'
        });
        activeMarriageIds.push(existingMarriage.id);
        console.log('✅ Updated existing marriage:', existingMarriage.id);
      } else {
        // Create new marriage record using API
        const newMarriage = await marriagesApi.create({
          family_id: familyId,
          husband_id: husbandId,
          wife_id: wifeId,
          is_active: true,
          marital_status: spouse.maritalStatus || 'married'
        });
        activeMarriageIds.push(newMarriage.id);
        console.log('✅ Created new marriage:', newMarriage.id);
      }
      marriageResults.successful++;
      console.log(`Successfully processed marriage with ${spouse.name}`);
    } catch (error) {
      console.error('Error creating/updating marriage:', error);
      marriageResults.failed++;
      marriageResults.details.push(`خطأ في ربط الزواج مع ${spouse.name}`);
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
      const hasSpouses = submissionData.gender === "male" && wives.length > 0 || submissionData.gender === "female" && husbands.length > 0;

      // Prepare final submission data matching modal structure
      const finalData = {
        ...submissionData,
        maritalStatus: hasSpouses ? "married" : "single",
        wives: submissionData.gender === "male" ? wives : [],
        husbands: submissionData.gender === "female" ? husbands : []
      };

      // Handle image uploads with safer flow:
      // 1. Upload new image first (if provided)
      // 2. Update DB with new image_url
      // 3. Delete old image only after successful DB update
      let finalImageUrl;
      let oldImagePath = null;
      
      if (formMode === 'edit' && editingMember) {
        console.log('🚨 Image preservation check:', {
          imageChanged,
          croppedImage: submissionData.croppedImage,
          existingImage: editingMember.image,
          editingMember: editingMember
        });
        
        if (imageChanged) {
          // Store old image path for later deletion
          if (editingMember.image && !editingMember.image.startsWith('data:image/') && !editingMember.image.startsWith('blob:')) {
            oldImagePath = editingMember.image;
          }
          
          // Upload new image FIRST before updating DB
          const croppedBlob = (window as any).__croppedImageBlob;
          if (croppedBlob) {
            try {
              finalImageUrl = await uploadMemberImage(croppedBlob, editingMember.id);
              console.log('✅ Image uploaded to storage (edit):', finalImageUrl);
              
              if (!finalImageUrl) {
                // Upload failed - keep existing image
                toast({
                  title: "تحذير",
                  description: "فشل رفع الصورة. تم الاحتفاظ بالصورة القديمة.",
                  variant: "destructive"
                });
                finalImageUrl = editingMember.image || null;
                oldImagePath = null; // Don't delete old image
              }
            } catch (error) {
              console.error('Image upload error:', error);
              toast({
                title: "خطأ في رفع الصورة",
                description: "حجم الصورة كبير جداً. تم الاحتفاظ بالصورة القديمة.",
                variant: "destructive"
              });
              finalImageUrl = editingMember.image || null;
              oldImagePath = null; // Don't delete old image
            }
          } else {
            finalImageUrl = null;
          }
        } else {
          // Keep existing image path (storage path or Base64 for legacy data)
          finalImageUrl = editingMember.image || null;
        }
      } else {
        // Add mode - will be handled below
        finalImageUrl = null;
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
        try {
          const updatedMember = await membersApi.update(editingMember.id, {
            name: fullName,
            first_name: firstName,
            last_name: lastName,
            gender: submissionData.gender,
            birth_date: formatDateForDatabase(submissionData.birthDate) || null,
            is_alive: submissionData.isAlive,
            death_date: !submissionData.isAlive ? formatDateForDatabase(submissionData.deathDate) : null,
            biography: submissionData.bio || null,
            image_url: finalImageUrl,
            father_id: fatherId,
            mother_id: motherId,
            related_person_id: relatedPersonId,
            marital_status: finalData.maritalStatus || 'single',
            is_twin: submissionData.is_twin || false,
            twin_group_id: submissionData.twin_group_id || null
          });
          memberData = updatedMember;
        } catch (updateError) {
          console.error('Error updating family member:', updateError);
          throw updateError;
        }
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
        
        // Insert member first WITHOUT image using API
        try {
          const newMember = await membersApi.create({
            name: fullName,
            first_name: firstName,
            last_name: lastName,
            gender: submissionData.gender,
            birth_date: formatDateForDatabase(submissionData.birthDate) || undefined,
            is_alive: submissionData.isAlive,
            death_date: !submissionData.isAlive ? formatDateForDatabase(submissionData.deathDate) : undefined,
            biography: submissionData.bio || undefined,
            image_url: undefined, // Will be updated below if image exists
            father_id: fatherId || undefined,
            mother_id: motherId || undefined,
            related_person_id: relatedPersonId || undefined,
            family_id: familyId,
            created_by: familyData?.creator_id || undefined,
            is_founder: submissionData.isFounder || false,
            marital_status: finalData.maritalStatus || 'single',
            is_twin: submissionData.is_twin || false,
            twin_group_id: submissionData.twin_group_id || undefined
          });
          memberData = newMember;
        } catch (memberError) {
          console.error('Error adding family member:', memberError);
          throw memberError;
        }
        
        // Now upload image using the real member ID
        const croppedBlob = (window as any).__croppedImageBlob;
        if (croppedBlob && imageChanged) {
          try {
            const imageStoragePath = await uploadMemberImage(croppedBlob, memberData.id);
            console.log('✅ Image uploaded to storage:', imageStoragePath);
            
            if (imageStoragePath) {
              // Update member with image path
              // Update member with image path using API
              try {
                await membersApi.updateImage(memberData.id, imageStoragePath);
                // Update memberData with the image path
                memberData.image_url = imageStoragePath;
                finalImageUrl = imageStoragePath;
              } catch (imageUpdateError) {
                console.error('Error updating member with image:', imageUpdateError);
              }
            }
          } catch (error) {
            console.error('Image upload error:', error);
            toast({
              title: "تحذير",
              description: "فشل رفع الصورة. تم حفظ العضو بدون صورة.",
              variant: "default"
            });
          }
        }
      }

      // ✅ Twin Group Management - ربط التوائم
      if (submissionData.is_twin && submissionData.selected_twins && submissionData.selected_twins.length > 0) {
        // توليد twin_group_id جديد أو استخدام الموجود
        let twinGroupId = submissionData.twin_group_id;
        
        if (!twinGroupId) {
          twinGroupId = crypto.randomUUID(); // توليد UUID جديد
        }
        
        // تحديث العضو الحالي بـ twin_group_id
        await membersApi.update(memberData.id, { 
          is_twin: true, 
          twin_group_id: twinGroupId 
        });
        
        // Get original twin siblings to detect removals
        const originalTwinSiblings = formMode === 'edit' && editingMember?.twin_group_id
          ? familyMembers.filter(m => 
              m.twin_group_id === editingMember.twin_group_id && 
              m.id !== memberData.id
            ).map(m => m.id)
          : [];
        
        // Find siblings that were removed from the twin group
        const removedSiblings = originalTwinSiblings.filter(
          siblingId => !submissionData.selected_twins.includes(siblingId)
        );
        
        // Remove deselected siblings from twin group
        if (removedSiblings.length > 0) {
          const removeUpdates = removedSiblings.map(async (siblingId: string) => {
            return membersApi.update(siblingId, { 
              is_twin: false, 
              twin_group_id: null 
            });
          });
          
          await Promise.all(removeUpdates);
          console.log(`✅ Removed ${removedSiblings.length} members from twin group`);
        }
        
        // تحديث جميع الإخوة المختارين بنفس twin_group_id
        const twinUpdates = submissionData.selected_twins.map(async (siblingId: string) => {
          return membersApi.update(siblingId, { 
            is_twin: true, 
            twin_group_id: twinGroupId 
          });
        });
        
        await Promise.all(twinUpdates);
        
        console.log(`✅ Successfully linked ${submissionData.selected_twins.length + 1} twins with group ID: ${twinGroupId}`);
      }

      // إزالة من مجموعة التوائم إذا تم إلغاء الاختيار للعضو الحالي
      if (!submissionData.is_twin && memberData.twin_group_id) {
        await membersApi.update(memberData.id, { 
          is_twin: false, 
          twin_group_id: null 
        });
        
        console.log(`✅ Removed member from twin group`);
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
          const hasCurrentHusbands = husbands.length > 0 && husbands.some(h => h.isSaved);
          console.log('🔍 HUSBAND DELETION DEBUG:');
          console.log('Original husband:', originalHusbandData ? {
            id: originalHusbandData.id,
            existingFamilyMemberId: originalHusbandData.existingFamilyMemberId,
            name: originalHusbandData.name,
            isSaved: originalHusbandData.isSaved
          } : null);
          console.log('Current husbands:', husbands.length);
          console.log('Has current husbands:', hasCurrentHusbands);
          if (!hasCurrentHusbands) {
            // Husband was deleted
            if (process.env.NODE_ENV === 'development') {
              console.log('DELETED HUSBAND detected:', originalHusbandData.name);
            }
            try {
              const husbandId = originalHusbandData.id || originalHusbandData.existingFamilyMemberId;
              if (husbandId) {
                // Delete marriage record using API
                try {
                  await marriagesApi.deleteBySpouses(husbandId, memberData.id);
                  
                  // If husband is not a family member (external spouse), delete his record
                  if (!originalHusbandData.isFamilyMember) {
                    try {
                      await membersApi.delete(husbandId);
                    } catch (deleteError) {
                      console.error('Error deleting husband member:', deleteError);
                      marriageResults.failed++;
                      marriageResults.details.push(`فشل في حذف ${originalHusbandData.name}`);
                    }
                  } else {
                    // If he's a family member, just update his marital status
                    try {
                      await membersApi.updateMaritalStatus(husbandId, 'single');
                    } catch (updateError) {
                      console.error('Error updating husband marital status:', updateError);
                    }
                  }

                  // Clear father reference for children
                  try {
                    await membersApi.clearParentReference(husbandId, 'father');
                  } catch (childrenError) {
                    console.error('Error updating children father_id:', childrenError);
                  }
                  marriageResults.successful++;
                } catch (marriageError) {
                  console.error('Error deleting marriage:', marriageError);
                  marriageResults.failed++;
                  marriageResults.details.push(`فشل في حذف زواج ${originalHusbandData.name}`);
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

              // Delete marriage record using API
              console.log('🔗 Deleting marriage record for husband:', memberData.id, 'wife:', wifeId);
              try {
                await marriagesApi.deleteBySpouses(memberData.id, wifeId);
                console.log('✅ Marriage deleted successfully for:', deletedWife.name);
              } catch (marriageDeleteError) {
                console.error('❌ Error deleting marriage:', marriageDeleteError);
                marriageResults.failed++;
                marriageResults.details.push(`فشل في حذف زواج ${deletedWife.name}`);
                continue;
              }

              // If wife is not a family member (external spouse), delete her record
              if (!deletedWife.isFamilyMember) {
                console.log('🗑️ Deleting external wife member:', deletedWife.name);
                try {
                  await membersApi.delete(wifeId);
                  console.log('✅ External wife member deleted:', deletedWife.name);
                } catch (wifeDeleteError) {
                  console.error('❌ Error deleting wife member:', wifeDeleteError);
                  marriageResults.failed++;
                  marriageResults.details.push(`فشل في حذف ${deletedWife.name}`);
                  continue;
                }
              } else {
                console.log('👤 Updating family member wife to single:', deletedWife.name);
                // If she's a family member, just update her marital status
                try {
                  await membersApi.updateMaritalStatus(wifeId, 'single');
                  console.log('✅ Family member wife status updated to single:', deletedWife.name);
                } catch (updateError) {
                  console.error('❌ Error updating wife marital status:', updateError);
                }
              }

              // Clear mother reference for children
              console.log('👶 Updating children to remove mother_id for:', deletedWife.name);
              try {
                await membersApi.clearParentReference(wifeId, 'mother');
                console.log('✅ Children mother_id updated for deleted wife:', deletedWife.name);
              } catch (childrenUpdateError) {
                console.error('❌ Error updating children mother_id:', childrenUpdateError);
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
              // Get current spouse data to preserve image if not changed
              let currentImageUrl = null;
              try {
                const currentSpouse = await membersApi.get(spouseId);
                currentImageUrl = currentSpouse?.image_url || null;
              } catch (e) {
                console.log('Could not fetch current spouse image');
              }

              const imageUrl = (spouseData.croppedImage !== undefined)
                ? (spouseData.croppedImage || null)
                : currentImageUrl;

              if (spouseData.isFamilyMember) {
                // Update minimal fields for family members we don't own
                await membersApi.update(spouseId, {
                  marital_status: spouseData.maritalStatus,
                  image_url: imageUrl,
                  biography: spouseData.biography || null,
                });

                // Update marriage status
                await marriagesApi.updateBySpouseId(spouseId, isWife, {
                  marital_status: spouseData.maritalStatus
                });
              } else {
                // External spouse we created earlier: safely update full profile fields
                const firstName = spouseData.firstName || '';
                const lastName = spouseData.lastName || familyData?.name || '';
                const spouseName = firstName && lastName
                  ? `${firstName} ${lastName}`
                  : (spouseData.name || firstName || lastName || '');

                await membersApi.update(spouseId, {
                  name: spouseName,
                  first_name: firstName,
                  last_name: lastName,
                  birth_date: formatDateForDatabase(spouseData.birthDate),
                  is_alive: spouseData.isAlive ?? true,
                  death_date: !spouseData.isAlive ? formatDateForDatabase(spouseData.deathDate) : null,
                  marital_status: spouseData.maritalStatus || 'married',
                  image_url: imageUrl,
                  biography: spouseData.biography || null,
                });
              }
            } else {
              // No existing ID → create a brand new external spouse using API
              const newSpouse = await membersApi.create({
                name: spouseName,
                first_name: firstName,
                last_name: lastName,
                gender: isWife ? 'female' : 'male',
                birth_date: formatDateForDatabase(spouseData.birthDate),
                is_alive: spouseData.isAlive ?? true,
                death_date: !spouseData.isAlive ? formatDateForDatabase(spouseData.deathDate) : null,
                family_id: familyId,
                is_founder: false,
                marital_status: spouseData.maritalStatus || 'married',
                image_url: spouseData.croppedImage || null,
                biography: spouseData.biography || null,
              });

              spouseId = newSpouse.id;
            }

            // Upsert marriage record to prevent duplicates
            if (spouseId) {
              const husbandId = isWife ? memberData.id : spouseId;
              const wifeId = isWife ? spouseId : memberData.id;

              await marriagesApi.upsert({
                family_id: familyId,
                husband_id: husbandId,
                wife_id: wifeId,
                is_active: true,
                marital_status: spouseData.maritalStatus || 'married',
              });

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
        if (submissionData.gender === 'female' && husbands.length > 0) {
          const savedHusbands = husbands.filter(h => h.isSaved === true);
          for (const husband of savedHusbands) {
            console.log('🔍 Processing husband for female member:', husband.name, 'ID:', husband.id || husband.existingFamilyMemberId);
            await processSpouseMarriage(husband, 'husband');
          }
        }
      }

      // Clear localStorage spouse data after successful submission
      clearSpouseDataFromLocalStorage();

      // Refresh family data to show updated information
      await refetchFamilyData();

      // Reset form state
      setFormMode('view');
      setCurrentStep(1);
      resetFormData();
      setWives([]);
      setHusbands([]);

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
      await refetchFamilyData();
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
  }, [formData, familyData, wives, husbands, subscription, editingMember, toast, t, refetchFamilyData]);
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
      // Close spouse form when entering step 2
      setCurrentSpouse(null);
      setActiveSpouseType(null);
      setShowSpouseForm(false);
      setSpouseFamilyStatus(null);
      
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
  return <SubscriptionGuard requireActiveSubscription={true}>
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir={direction}>
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
          <div className={cn("grid gap-6 items-start", isMobile ? "grid-cols-1" : "grid-cols-12")}>
            {/* Form Panel - Right Side on Desktop */}
            <div className={cn("space-y-6", isMobile ? "order-2" : "col-span-8 order-2")}>
               <Card className="relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-white/30 dark:border-gray-600/30 shadow-xl">
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
                         <div className="flex items-center gap-2 me-auto">
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
                <CardContent className="relative p-2 sm:p-4 md:p-6 bg-white">
                  {formMode === 'view' ? <div className="py-8 px-6">
                       {/* Family Overview Header - Redesigned */}
                          
                          {/* Animated Background Orbs */}
                          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse"></div>
                          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/10 via-secondary/5 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
                          
                          
                          <div className="relative z-10 pt-4">
                            {/* Hero Content */}
                            <div className="text-center space-y-10">
                              {/* Logo Section with Luxury Design */}
                              <div className="relative inline-block">
                                <div className="relative group">
                                  {/* Outer Glow Effect */}
                                  <div className="absolute inset-0 blur-3xl opacity-60 bg-gradient-to-r from-emerald-400 via-teal-500 to-amber-500 rounded-full transform scale-150 group-hover:scale-175 transition-transform duration-700"></div>
                                  
                                  {/* Main Icon Container */}
                                  <div className="relative w-36 h-36 sm:w-40 sm:h-40 mx-auto">
                                    {/* Rotating Decorative Rings */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-amber-500/30 animate-spin blur-sm" style={{animationDuration: '12s'}}></div>
                                    <div className="absolute inset-3 rounded-full bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 animate-spin" style={{animationDuration: '10s', animationDirection: 'reverse'}}></div>
                                    
                                    {/* Inner Shadow Ring */}
                                    <div className="absolute inset-6 rounded-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-2 border-primary/30 shadow-inner"></div>
                                    
                                    {/* Main Gradient Icon Circle */}
                                    <div className="absolute inset-8 bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 group-hover:shadow-emerald-500/60 group-hover:scale-110 transition-all duration-500 border-4 border-white/20 backdrop-blur-sm">
                                      <TreePine className="h-14 w-14 sm:h-16 sm:w-16 text-white drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
                                    </div>
                                    
                                    {/* Sparkle Effects */}
                                    <div className="absolute top-2 right-8 w-2 h-2 bg-amber-300 rounded-full shadow-lg shadow-amber-300/50 animate-pulse"></div>
                                    <div className="absolute bottom-6 left-4 w-1.5 h-1.5 bg-emerald-300 rounded-full shadow-lg shadow-emerald-300/50 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                                    <div className="absolute top-8 left-2 w-1 h-1 bg-teal-200 rounded-full shadow-lg shadow-teal-200/50 animate-pulse" style={{animationDelay: '1s'}}></div>
                                    
                                    {/* Premium Badge */}
                                    <div className="absolute -top-1 -right-1 w-10 h-10 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-full border-4 border-card shadow-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                                      <Crown className="w-5 h-5 text-white" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Title Section with Luxury Typography */}
                              <div className="space-y-6">
                                <div className="space-y-4 relative">
                                  {/* Background Text Effect */}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-5 blur-sm">
                                    <span className="text-7xl sm:text-8xl font-black">{familyData?.name || ''}</span>
                                  </div>
                                  
                                  {/* Main Title */}
                                  <h1 className="relative text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.4] py-4 overflow-visible">
                                    <span className="inline-block bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent animate-fade-in hover:scale-105 transition-transform duration-300 pb-3">
                                      عائلة {familyData?.name || 'غير محدد'}
                                    </span>
                                  </h1>
                                  
                                  {/* Luxury Decorative Line with Gems */}
                                  <div className="flex items-center justify-center gap-3 pt-2">
                                    <div className="flex items-center gap-2">
                                      <div className="h-px w-12 bg-gradient-to-r from-transparent via-emerald-500 to-emerald-500 rounded-full"></div>
                                      <Gem className="w-3 h-3 text-emerald-500 animate-pulse" />
                                    </div>
                                    <div className="h-3 w-3 rotate-45 bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50"></div>
                                    <div className="h-2.5 w-24 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full shadow-lg shadow-primary/30 relative overflow-hidden">
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                                    </div>
                                    <div className="h-3 w-3 rotate-45 bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50"></div>
                                    <div className="flex items-center gap-2">
                                      <Gem className="w-3 h-3 text-emerald-500 animate-pulse" style={{animationDelay: '0.5s'}} />
                                      <div className="h-px w-12 bg-gradient-to-r from-emerald-500 to-transparent rounded-full"></div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Family Description */}
                                {familyData?.description && (
                                  <div className="max-w-2xl mx-auto animate-fade-in delay-300">
                                    <div 
                                      className="text-foreground text-base sm:text-lg leading-relaxed font-medium"
                                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(familyData.description) }}
                                    />
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
                }} onAddChild={(parentMember, spouseId) => {
                  // Reset form for new child with pre-selected parent and specific spouse
                  const selectedMarriage = spouseId 
                    ? familyMarriages.find(m => 
                        (m.husband_id === parentMember.id || m.wife_id === parentMember.id) &&
                        (m.husband_id === spouseId || m.wife_id === spouseId)
                      )
                    : familyMarriages.find(m => 
                        (m.husband?.id === parentMember.id) || (m.wife?.id === parentMember.id)
                      );
                  
                  setFormData({
                    name: "",
                    first_name: "",
                    relation: "child",
                    relatedPersonId: selectedMarriage?.id || null,
                    selectedParent: selectedMarriage?.id || null,
                    gender: "male",
                    birthDate: null,
                    isAlive: true,
                    deathDate: null,
                    bio: "",
                    imageUrl: "",
                    croppedImage: null,
                    isFounder: false,
                    is_twin: false,
                    twin_group_id: null,
                    selected_twins: []
                  });
                  setWives([]);
                  setHusbands([]);
                  setEditingMember(null);
                  setFormMode('add');
                  setCurrentStep(1);
                  setCroppedImage(null);
                  setParentsLocked(true);
                }} /> : formMode === 'tree-settings' ? <TreeSettingsView familyData={familyData} onBack={() => setFormMode('view')} /> : <div className="space-y-6">

                      {/* Step Content */}
                      {currentStep === 1 && <div className="space-y-6">
                            <h3 className="text-xl font-bold font-arabic text-primary mb-6 pb-2 border-b border-border">المعلومات الأساسية</h3>
                             
                              {/* First row: First Name (1/4), Gender (1/4), Family relation (1/2) */}
                              <div className="grid grid-cols-12 gap-6">
                                 <div className="col-span-6 md:col-span-3">
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
                          const husbandMember = familyMembers.find(member => member?.id === marriage.husband?.id);
                          const wifeMember = familyMembers.find(member => member?.id === marriage.wife?.id);
                          let displayName = '';

                          const getFatherName = (member: any) => {
                            const father = familyMembers.find(m => m?.id === member?.father_id || m?.id === member?.fatherId);
                            return father?.name || '';
                          };

                          const getGrandfatherName = (member: any) => {
                            const father = familyMembers.find(m => m?.id === member?.father_id || m?.id === member?.fatherId);
                            if (father) {
                              const grandfather = familyMembers.find(m => m?.id === father?.father_id || m?.id === father?.fatherId);
                              return grandfather?.name || '';
                            }
                            return '';
                          };

                          const buildFullName = (member: any, isWife: boolean = false) => {
                            if (!member) return '';
                            const firstName = member.first_name || member.name?.split(' ')[0] || '';
                            const father = familyMembers.find(m => m?.id === member?.father_id || m?.id === member?.fatherId);
                            const grandfather = father ? familyMembers.find(m => m?.id === father?.father_id || m?.id === father?.fatherId) : null;
                            const isInternal = Boolean(father) || Boolean(member.is_founder);

                            console.log('🔍 buildFullName:', {
                              memberName: member.name,
                              firstName,
                              gender: member.gender,
                              father_id: member.father_id,
                              fatherFound: !!father,
                              fatherName: father?.name,
                              grandfatherFound: !!grandfather,
                              grandfatherName: grandfather?.name,
                              isInternal,
                              isWife
                            });

                            if (isInternal) {
                              if (isWife) {
                                if (father) {
                                  const relationship = member.gender === 'female' ? 'بنت' : 'ابن';
                                  const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
                                  if (grandfather) {
                                    const grandfatherFirstName = grandfather.first_name || grandfather.name?.split(' ')[0] || grandfather.name;
                                    return `${firstName} ${relationship} ${fatherFirstName} بن ${grandfatherFirstName}`;
                                  }
                                  return `${firstName} ${relationship} ${fatherFirstName}`;
                                }
                                return firstName;
                              } else {
                                if (father) {
                                  const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
                                  if (grandfather) {
                                    const grandfatherFirstName = grandfather.first_name || grandfather.name?.split(' ')[0] || grandfather.name;
                                    return `${firstName} بن ${fatherFirstName} بن ${grandfatherFirstName}`;
                                  }
                                  return `${firstName} بن ${fatherFirstName}`;
                                }
                                return firstName;
                              }
                            } else {
                              return member.name || firstName;
                            }
                          };

                          const husbandName = buildFullName(husbandMember);
                          const wifeName = buildFullName(wifeMember, true);

                          displayName = `${husbandName} و ${wifeName}`;

                          console.log('💑 Marriage Display:', {
                            marriageId: marriage.id,
                            husbandId: marriage.husband?.id,
                            wifeId: marriage.wife?.id,
                            husbandName,
                            wifeName,
                            displayName,
                            husbandMember,
                            wifeMember
                          });

                          return {
                            value: marriage.id,
                            familyMember: husbandName,
                            spouse: wifeName,
                            heartIcon: 'heart' as const,
                            isFounder: husbandMember?.is_founder || false
                          };
                        }) : [{
                          value: "no-data",
                          label: "لا توجد زيجات مسجلة في هذه العائلة",
                          disabled: true
                        }]} value={formData.selectedParent || ""} onValueChange={value => setFormData({
                          ...formData,
                          selectedParent: value === "none" ? null : value
                        })} disabled={loading || !familyMarriages || !familyMembers || formData.isFounder || parentsLocked} placeholder={loading ? "جاري التحميل..." : formData.isFounder ? "مؤسس العائلة - لا يحتاج لوالدين" : parentsLocked ? "تم اختيار الوالدين تلقائياً" : "اختر الوالدين"} searchPlaceholder="ابحث عن الوالدين..." emptyMessage="لا توجد نتائج تطابق البحث" />
                              </div>
                            </div>

                              {/* Second row: Twin (1/4), Birthdate (1/4), Alive status (1/4), Death date (1/4) */}
                              <div className="grid grid-cols-12 gap-6">
                                {/* Twin Selection Dropdown */}
                                {currentSiblings.length > 0 && (
                                  <div className="col-span-6 md:col-span-3 space-y-3">
                                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    {t('form.twin_status')}
                                  </Label>
                                  <Select 
                                    value={formData.is_twin ? "has_twins" : "no_twin"} 
                                    onValueChange={(value) => {
                                      if (value === "no_twin") {
                                        setFormData(prev => ({
                                          ...prev,
                                          is_twin: false,
                                          twin_group_id: null,
                                          selected_twins: []
                                        }));
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm">
                                      <SelectValue>
                                        {formData.is_twin && formData.selected_twins.length > 0 
                                          ? `توأم مع ${formData.selected_twins.length} ${formData.selected_twins.length === 1 ? 'شخص' : 'أشخاص'}`
                                          : t('form.not_twin')
                                        }
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-2 bg-background z-50">
                                      <SelectItem value="no_twin" className="font-arabic rounded-md">
                                        {t('form.not_twin')}
                                      </SelectItem>
                                      <div className="px-2 py-2 border-t">
                                        <p className="text-xs text-muted-foreground mb-2 px-2 font-arabic">
                                          {t('form.select_twin_siblings')}
                                        </p>
                                        {currentSiblings.map(sibling => (
                                          <div 
                                            key={sibling.id} 
                                            className="flex items-center space-x-2 rtl:space-x-reverse py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const isSelected = formData.selected_twins.includes(sibling.id);
                                              setFormData(prev => {
                                                const newSelectedTwins = isSelected
                                                  ? prev.selected_twins.filter(id => id !== sibling.id)
                                                  : [...prev.selected_twins, sibling.id];
                                                
                                                return {
                                                  ...prev,
                                                  is_twin: newSelectedTwins.length > 0,
                                                  selected_twins: newSelectedTwins
                                                };
                                              });
                                            }}
                                          >
                                            <Checkbox
                                              id={`twin-${sibling.id}`}
                                              checked={formData.selected_twins.includes(sibling.id)}
                                              onCheckedChange={(checked) => {
                                                setFormData(prev => {
                                                  const newSelectedTwins = checked
                                                    ? [...prev.selected_twins, sibling.id]
                                                    : prev.selected_twins.filter(id => id !== sibling.id);
                                                  
                                                  return {
                                                    ...prev,
                                                    is_twin: newSelectedTwins.length > 0,
                                                    selected_twins: newSelectedTwins
                                                  };
                                                });
                                              }}
                                            />
                                            <Label htmlFor={`twin-${sibling.id}`} className="text-sm cursor-pointer font-arabic flex-1">
                                              {sibling.name}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    </SelectContent>
                                  </Select>
                                  </div>
                                )}

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
                              
                               {croppedImage || editingMemberImageUrl ? <div className="space-y-3">
                                   <div className="relative group flex justify-center">
                                     <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20 p-3">
                                        <img src={croppedImage || editingMemberImageUrl} alt="صورة العضو" className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-lg" />
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
                                         </div> : <>{wives.map((wife, index) => <div key={index} className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 border-2 border-dashed border-pink-400/60 dark:border-pink-500/60 cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300" onClick={() => {
                                                if (wife.isSaved) {
                                                  handleSpouseEditAttempt('wife', wife, index);
                                                }
                                              }}>
                                              <div className="flex items-start gap-4 mb-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                                  {wife.croppedImage ? (
                                                    <img 
                                                      src={wife.croppedImage} 
                                                      alt={wife.name || `الزوجة ${index + 1}`}
                                                      className="w-full h-full object-cover rounded-full"
                                                    />
                                                  ) : (
                                                    <Heart className="w-6 h-6" />
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
                                              <div className="flex gap-2 justify-end">
                                               {wife.isSaved && <Button variant="outline" size="sm" onClick={() => {
                                                 handleSpouseEditAttempt('wife', wife, index);
                                               }} className="gap-1 border-pink-200/50 dark:border-pink-700/50 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/50 transition-all duration-300">
                                                   <Edit className="h-3 w-3" />
                                                   تعديل
                                                 </Button>}
                                               <Button variant="outline" size="sm" onClick={() => handleSpouseDelete(wife, index)} className="gap-1 border-red-200/50 dark:border-red-700/50 text-red-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-300">
                                                 <X className="h-3 w-3" />
                                                 حذف
                                               </Button>
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
                                       {husbands.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                                            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="font-arabic mb-4">لم يتم إضافة زوج بعد</p>
                                            <Button
                                              onClick={handleAddHusband}
                                              className="bg-blue-500 hover:bg-blue-600 text-white font-arabic"
                                            >
                                              <Plus className="w-4 h-4 ml-2" />
                                              إضافة زوج
                                            </Button>
                                          </div> : <div className="space-y-4">
                                              {husbands.map((husband, index) => (
                                                <div key={husband.id || index} className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 border-2 border-dashed border-blue-400/60 dark:border-blue-500/60 cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300" onClick={() => {
                                                  if (husband.isSaved) {
                                                    handleSpouseEditAttempt('husband', husband, index);
                                                  }
                                                }}>
                                                  <div className="flex items-start gap-4 mb-4">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                                      {husband.croppedImage ? (
                                                        <img 
                                                          src={husband.croppedImage} 
                                                          alt={husband.name || 'الزوج'}
                                                          className="w-full h-full object-cover rounded-full"
                                                        />
                                                      ) : (
                                                        <User className="w-6 h-6" />
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
                                                  <div className="flex gap-2 justify-end">
                                                    {husband.isSaved && <Button variant="outline" size="sm" onClick={() => {
                                                      handleSpouseEditAttempt('husband', husband, index);
                                                    }} className="gap-1 border-blue-200/50 dark:border-blue-700/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-300">
                                                      <Edit className="h-3 w-3" />
                                                      تعديل
                                                    </Button>}
                                                    <Button variant="outline" size="sm" onClick={() => handleSpouseDelete(husband, index)} className="gap-1 border-red-200/50 dark:border-red-700/50 text-red-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-300">
                                                      <X className="h-3 w-3" />
                                                      حذف
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                       
                                       {/* Always show Add Husband button */}
                                      <div className="text-center">
                                        <Button
                                          onClick={handleAddHusband}
                                          variant="outline"
                                          className="border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-arabic w-full"
                                        >
                                          <Plus className="w-4 h-4 ml-2" />
                                          إضافة زوج آخر
                                        </Button>
                                      </div>
                                    </div>}
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
                  <DrawerContent className="h-[80vh] flex flex-col">
                    <div className="flex-1 overflow-y-auto mobile-smooth-scroll p-4">
                        <MemberList members={filteredMembers} onEditMember={handleEditMember} onViewMember={handleViewMember} onDeleteMember={handleDeleteMember} onSpouseEditAttempt={handleSpouseEditWarning} checkIfMemberIsSpouse={checkIfMemberIsSpouse} searchTerm={searchTerm} onSearchChange={setSearchTerm} selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} getAdditionalInfo={getAdditionalInfo} getGenderColor={getGenderColor} familyMembers={familyMembers} marriages={familyMarriages} memberListLoading={contextLoading || memberListLoading} formMode={formMode} onAddMember={handleAddMember} packageData={subscription?.package_name} generationCount={generationCount} />
                    </div>
                  </DrawerContent>
                </Drawer> : <Card className="bg-white backdrop-blur-xl border-white/30 shadow-xl h-full min-h-0 flex flex-col">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-lg"></div>
                   <CardHeader className="pb-4 relative shrink-0">
                     <CardTitle className="flex items-center justify-between gap-2">
                       <div className="flex items-center gap-2">
                         <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                         <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                           {t('family_builder.members_title')}
                         </span>
                       </div>
                       <div className="flex items-center gap-1">
                         <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs">
                           <Users className="h-3 w-3 text-primary" />
                           <span className="font-medium">{familyMembers.length}</span>
                         </div>
                         <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-full text-xs">
                           <span className="font-medium text-blue-600">{familyMembers.filter(m => m.gender === 'male').length}</span>
                           <span className="text-blue-600">♂</span>
                         </div>
                         <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 rounded-full text-xs">
                           <span className="font-medium text-rose-600">{familyMembers.filter(m => m.gender === 'female').length}</span>
                           <span className="text-rose-600">♀</span>
                         </div>
                         <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded-full text-xs">
                           <span className="font-medium text-amber-600">{generationCount}</span>
                           <span className="text-amber-600">🏛</span>
                         </div>
                       </div>
                     </CardTitle>
                   </CardHeader>
                  <CardContent className="relative overflow-y-auto flex-1 min-h-0 pt-2">
                      <MemberList members={filteredMembers} onEditMember={handleEditMember} onViewMember={handleViewMember} onDeleteMember={handleDeleteMember} onSpouseEditAttempt={handleSpouseEditWarning} checkIfMemberIsSpouse={checkIfMemberIsSpouse} searchTerm={searchTerm} onSearchChange={setSearchTerm} selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} getAdditionalInfo={getAdditionalInfo} getGenderColor={getGenderColor} familyMembers={familyMembers} marriages={familyMarriages} memberListLoading={contextLoading || memberListLoading} formMode={formMode} onAddMember={handleAddMember} packageData={subscription?.package_name} generationCount={generationCount} />
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

            <div className="font-arabic text-center space-y-4 px-2">
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
            </div>

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
                  الحد الأقصى: {subscription?.package_name?.max_family_members || 0} عضو
                </span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                باقتك الحالية تسمح بإضافة {subscription?.package_name?.max_family_members || 0} أعضاء فقط.
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
    </div>
  </SubscriptionGuard>;
};

export default FamilyBuilderNew;