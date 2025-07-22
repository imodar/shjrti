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
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop, Star, Sparkles, Image, Store, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";
import { ModernFamilyMemberModal } from "@/components/ModernFamilyMemberModal";


const FamilyBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Calculate generation statistics from actual data
  const calculateGenerationCount = () => {
    if (familyMembers.length === 0) return 1;
    
    // Create a map to track generations based on parent-child relationships
    const generationMap = new Map();
    
    // Start with founders (people without parents) as generation 1
    familyMembers.forEach(member => {
      if (member.isFounder || (!member.fatherId && !member.motherId)) {
        generationMap.set(member.id, 1);
      }
    });
    
    // Recursively assign generations based on parent-child relationships
    let changed = true;
    let maxIterations = 50; // Safety limit to prevent infinite loops
    let iterations = 0;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (!generationMap.has(member.id)) {
          // Check if this member has parents
          if (member.fatherId || member.motherId) {
            const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : undefined;
            const motherGeneration = member.motherId ? generationMap.get(member.motherId) : undefined;
            
            // If at least one parent has a generation assigned
            if (fatherGeneration !== undefined || motherGeneration !== undefined) {
              // Take the maximum generation of the parents and add 1
              const parentGeneration = Math.max(
                fatherGeneration || 0, 
                motherGeneration || 0
              );
              generationMap.set(member.id, parentGeneration + 1);
              changed = true;
            }
          } else {
            // If no parents and not a founder, consider as generation 1 (could be married-in spouse)
            generationMap.set(member.id, 1);
            changed = true;
          }
        }
      });
    }
    
    // Assign spouses to same generation as their partners
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
    
    // Start with founders (people without parents) as generation 1
    familyMembers.forEach(member => {
      if (member.isFounder || (!member.fatherId && !member.motherId)) {
        generationMap.set(member.id, 1);
      }
    });
    
    // Recursively assign generations based on parent-child relationships
    let changed = true;
    let maxIterations = 50; // Safety limit to prevent infinite loops
    let iterations = 0;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (!generationMap.has(member.id)) {
          // Check if this member has parents
          if (member.fatherId || member.motherId) {
            const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : undefined;
            const motherGeneration = member.motherId ? generationMap.get(member.motherId) : undefined;
            
            // If at least one parent has a generation assigned
            if (fatherGeneration !== undefined || motherGeneration !== undefined) {
              // Take the maximum generation of the parents and add 1
              const parentGeneration = Math.max(
                fatherGeneration || 0, 
                motherGeneration || 0
              );
              generationMap.set(member.id, parentGeneration + 1);
              changed = true;
            }
          } else {
            // If no parents and not a founder, consider as generation 1 (could be married-in spouse)
            generationMap.set(member.id, 1);
            changed = true;
          }
        }
      });
    }
    
    // Assign spouses to same generation as their partners
    familyMarriages.forEach(marriage => {
      const husbandGeneration = generationMap.get(marriage.husband?.id);
      const wifeGeneration = generationMap.get(marriage.wife?.id);
      
      if (husbandGeneration && !wifeGeneration) {
        generationMap.set(marriage.wife?.id, husbandGeneration);
      } else if (wifeGeneration && !husbandGeneration) {
        generationMap.set(marriage.husband?.id, wifeGeneration);
      }
    });
    
    // Count members per generation
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
  const treeId = searchParams.get('treeId');
  const isNew = searchParams.get('new') === 'true';
  const isEditMode = searchParams.get('edit') === 'true';
  
  const [activeTab, setActiveTab] = useState("overview");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyMarriages, setFamilyMarriages] = useState([]);
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch family data from database
  const fetchFamilyData = async () => {
    try {
      setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        console.log('Loading package data for user:', user.id);

        // Get user's subscription details directly from user_subscriptions table
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
          console.log('Setting package data from subscription:', userSubscription.packages);
          setPackageData(userSubscription.packages);
          setSubscriptionData(userSubscription);
        } else {
          // No active subscription, use free package
          console.log('No subscription found, using free package');
          const { data: freePackage } = await supabase
            .from('packages')
            .select('*')
            .ilike('name->en', 'Free')
            .single();
          console.log('Free package fallback:', freePackage);
          if (freePackage) setPackageData(freePackage);
        }
        
        // Get user's families
        const { data: families, error: familiesError } = await supabase
          .from('families')
          .select('*')
          .eq('creator_id', (await supabase.auth.getUser()).data.user?.id)
          .order('created_at', { ascending: false });

        if (familiesError) throw familiesError;

        if (families && families.length > 0) {
          const family = families[0]; // Use most recent family
          setFamilyData(family);
          
          // Get family members
          // Load family tree members from the new table
          const { data: members, error: membersError } = await supabase
            .from('family_tree_members')
            .select('*')
            .eq('family_id', family.id);

          if (membersError) throw membersError;

          if (members) {
            // Transform the data to match the expected format
            const transformedMembers = members.map(member => ({
              id: member.id,
              name: member.name,
              fatherId: member.father_id,
              motherId: member.mother_id,
              spouseId: member.spouse_id, // Add the new spouse_id field
              relatedPersonId: member.related_person_id,
              isFounder: member.is_founder,
              gender: member.gender || 'male',
              birthDate: member.birth_date || '',
              isAlive: member.is_alive,
              deathDate: member.death_date || null,
              image: member.image_url || null,
              bio: member.biography || '',
              relation: "" // Add relation field for consistency
            }));
            
            console.log('Fetched family members:', transformedMembers);
            setFamilyMembers(transformedMembers);
          }

          // Get marriages to show as family units
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
            console.log('Fetched marriages:', marriages);
          }
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

    // Create a refresh function that doesn't show loading
    const refreshFamilyData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        console.log('Refreshing family data...');

        // Fetch family info
        const familyId = new URLSearchParams(window.location.search).get('family');
        if (!familyId) throw new Error('Family ID not found in URL');

        const { data: family, error: familyError } = await supabase
          .from('families')
          .select('*')
          .eq('id', familyId)
          .single();

        if (familyError) throw familyError;
        setFamilyData(family);

        // Fetch family members
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

        // Get marriages to show as family units
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
  
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showRelatedPersonDropdown, setShowRelatedPersonDropdown] = useState(false);
  const [editingWife, setEditingWife] = useState<{ id: string; name: string; isAlive: boolean; birthDate: Date | null; deathDate: Date | null } | null>(null);
  const [editingHusband, setEditingHusband] = useState<{ id: string; name: string; isAlive: boolean; birthDate: Date | null; deathDate: Date | null } | null>(null);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [wives, setWives] = useState<Array<{
    id: string;
    name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
    maritalStatus?: string;
  }>>([]);
  const [husbands, setHusbands] = useState<Array<{
    id: string;
    name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
  }>>([]);
  // Filter state - single select dropdown
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    relatedPersonId: null as string | null,
    gender: "",
    birthDate: null as Date | null,
    isAlive: true,
    deathDate: null as Date | null,
    bio: "",
    image: null as File | null,
    croppedImage: null as string | null
  });

  // Filter options
  const filterOptions = [
    { value: "all", label: t('family_builder.show_all_members', 'Show All Members') },
    { value: "blood_relations", label: t('family_builder.show_blood_relations', 'Show Blood Relations (Same Family)') },
    { value: "non_family", label: t('family_builder.show_non_family', 'Show All Non-Family Members') },
    { value: "wives", label: t('family_builder.show_wives', 'Show All Wives') },
    { value: "husbands", label: t('family_builder.show_husbands', 'Show All Husbands') },
    { value: "blood_with_female_children", label: t('family_builder.show_blood_with_female_children', 'Blood Relations and Female Children from Same Father Family') }
  ];

  // Filter members based on search term and selected filter
  console.log('Current filter:', selectedFilter);
  console.log('Family members:', familyMembers);
  console.log('Family marriages:', familyMarriages);
  
  const filteredMembers = familyMembers.filter(member => {
    // First filter by search term (with null checks)
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.relation && member.relation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    // Apply selected filter
    switch (selectedFilter) {
      case "all":
        return true;
        
      case "blood_relations":
        // Show only direct blood relations from the original family
        // Exclude children whose father is a "married-in" husband
        if (member.isFounder) return true;
        
        if (member.fatherId) {
          // Check if father is a non-blood husband (married into family)
          const father = familyMembers.find(m => m.id === member.fatherId);
          if (father) {
            const fatherIsNonBlood = father.gender === 'male' && 
              familyMarriages.some(marriage => 
                marriage.husband?.id === father.id &&
                !father.fatherId && !father.motherId && !father.isFounder
              );
            
            // If father is non-blood, this member should not appear in blood relations
            if (fatherIsNonBlood) {
              console.log(`${member.name} excluded - father ${father.name} is non-blood husband`);
              return false;
            }
            return true;
          }
        }
        
        return false;
        
      case "non_family":
        // Show all members who are not from the original family (regardless of marriage status)
        // This includes: married-in spouses and their children
        return !member.isFounder && 
               (!member.fatherId || 
                !familyMembers.some(father => 
                  father.id === member.fatherId && 
                  (father.isFounder || father.fatherId)
                ));
        
      case "wives":
        // Show only female members who married INTO the family (not daughters of the family)
        return member.gender === 'female' && 
          familyMarriages.some(marriage => marriage.wife?.id === member.id) &&
          !member.fatherId && !member.motherId && !member.isFounder;
        
      case "husbands":
        // Show only male members who married INTO the family (not sons of the family)
        return member.gender === 'male' && 
          familyMarriages.some(marriage => marriage.husband?.id === member.id) &&
          !member.fatherId && !member.motherId && !member.isFounder;
          
      case "blood_with_female_children":
        // Show blood relations AND children of females from same father's family
        const isDirectBloodRelation = member.isFounder || 
          (member.fatherId && 
           familyMembers.some(father => 
             father.id === member.fatherId && 
             (father.isFounder || father.fatherId) // Father must be from original family
           ));
        
        // Check if this is a child of a female from the same father's family
        const isChildOfFemaleFromSameFamily = member.motherId && 
          familyMembers.some(potentialMother => 
            potentialMother.id === member.motherId &&
            potentialMother.gender === 'female' &&
            (potentialMother.fatherId || potentialMother.isFounder) // Mother is from father's family
          );
          
        return isDirectBloodRelation || isChildOfFemaleFromSameFamily;
        
      default:
        return true;
    }
  });

  // Relationship options with translations
  const getRelationshipOptions = (gender: string, familyMembers: any[] = []) => {
    if (gender === "male") {
      return [
        { value: "father", label: t("father", "أب"), icon: "👨‍🦳" },
        { value: "husband", label: t("husband", "زوج"), icon: "👨" },
        { value: "brother", label: t("brother", "أخ"), icon: "👨‍🦱" },
        { value: "son", label: t("son", "ابن"), icon: "👶" }
      ];
    } else if (gender === "female") {
      return [
        { value: "mother", label: t("mother", "أم"), icon: "👩‍🦳" },
        { value: "wife", label: t("wife", "زوجة"), icon: "👩" },
        { value: "sister", label: t("sister", "أخت"), icon: "👩‍🦱" },
        { value: "daughter", label: t("daughter", "ابنة"), icon: "👶" }
      ];
    }
    return [];
  };
  
  // Function specifically for marriage display in the control
  const getMarriageDisplayName = (marriage: any) => {
    const husbandMember = familyMembers.find(m => m.id === marriage.husband?.id);
    const wifeMember = familyMembers.find(m => m.id === marriage.wife?.id);
    
    // Husband display logic
    let husbandDisplay = marriage.husband?.name || "";
    if (husbandMember && (husbandMember.fatherId || husbandMember.isFounder)) {
      // Husband is from the original family
      husbandDisplay += " الشيخ سعيد";
    }
    
    // Wife display logic  
    let wifeDisplay = marriage.wife?.name || "";
    if (wifeMember && (wifeMember.fatherId || wifeMember.isFounder)) {
      // Wife is from the original family
      if (wifeMember.fatherId) {
        const father = familyMembers.find(m => m.id === wifeMember.fatherId);
        if (father) {
          wifeDisplay += ` بنت ${father.name} الشيخ سعيد`;
        }
      } else if (wifeMember.isFounder) {
        wifeDisplay += " الشيخ سعيد";
      }
    } else {
      // Wife is from outside family - add family name if available
      // For now, we'll use known family names based on the examples
      if (wifeDisplay === "رانية") {
        wifeDisplay += " بلش";
      } else if (wifeDisplay === "لانا") {
        wifeDisplay += " دواليبي";
      }
    }
    
    return `${husbandDisplay} + ${wifeDisplay}`;
  };
  // Function to get additional info for each member
  const getAdditionalInfo = (member) => {
    console.log('getAdditionalInfo called for:', member.name);
    console.log('Member details:', {
      name: member.name,
      gender: member.gender,
      fatherId: member.fatherId,
      motherId: member.motherId,
      isFounder: member.isFounder,
      relatedPersonId: member.relatedPersonId
    });
    console.log('Available family members:', familyMembers.map(m => ({ id: m.id, name: m.name })));
    console.log('Available marriages:', familyMarriages);
    
    // Method 1: Check if this person is a child of a marriage using relatedPersonId
    if (member.relatedPersonId) {
      console.log(`${member.name} has relatedPersonId: ${member.relatedPersonId}`);
      const parentMarriage = familyMarriages.find(marriage => marriage.id === member.relatedPersonId);
      
      if (parentMarriage) {
        console.log(`Found parent marriage for ${member.name}:`, parentMarriage);
        
        const father = familyMembers.find(m => m.id === parentMarriage.husband?.id);
        const mother = familyMembers.find(m => m.id === parentMarriage.wife?.id);
        
        if (father) {
          const familyName = familyData?.name || "العائلة";
          if (member.gender === 'male') {
            const result = `ابن ${father.name} ${familyName}`;
            console.log(`Male child result for ${member.name}:`, result);
            return result;
          } else if (member.gender === 'female') {
            const result = `بنت ${father.name} ${familyName}`;
            console.log(`Female child result for ${member.name}:`, result);
            return result;
          }
        }
      } else {
        console.log(`No marriage found for relatedPersonId: ${member.relatedPersonId}`);
      }
    }
    
    // Method 2: Check if this person is married (spouse)
    const memberMarriage = familyMarriages.find(marriage => 
      marriage.husband?.id === member.id || marriage.wife?.id === member.id
    );
    
    if (memberMarriage) {
      console.log(`Found marriage for ${member.name}:`, memberMarriage);
      
      // For husbands married into the family
      if (member.gender === 'male' && memberMarriage.husband?.id === member.id) {
        const wife = familyMembers.find(w => w.id === memberMarriage.wife?.id);
        if (wife) {
          // Check if wife is from the original family (founder or has parents)
          const wifeIsFromFamily = wife.isFounder || wife.fatherId || wife.motherId || wife.relatedPersonId;
          
          if (wifeIsFromFamily) {
            let wifeInfo = wife.name;
            
            // Try to find wife's father from marriages or father_id
            if (wife.fatherId) {
              const wifeFather = familyMembers.find(f => f.id === wife.fatherId);
              if (wifeFather) {
                wifeInfo += ` بنت ${wifeFather.name}`;
              }
            } else if (wife.relatedPersonId) {
              // Find wife's parent marriage
              const wifeParentMarriage = familyMarriages.find(m => m.id === wife.relatedPersonId);
              if (wifeParentMarriage) {
                const wifeFather = familyMembers.find(f => f.id === wifeParentMarriage.husband?.id);
                if (wifeFather) {
                  wifeInfo += ` بنت ${wifeFather.name}`;
                }
              }
            }
            
            const familyName = familyData?.name || "العائلة";
            wifeInfo += ` ${familyName}`;
            
            const result = `زوج ${wifeInfo}`;
            console.log(`Husband result for ${member.name}:`, result);
            return result;
          }
        }
      }
      
      // For wives married into the family 
      if (member.gender === 'female' && memberMarriage.wife?.id === member.id) {
        const husband = familyMembers.find(h => h.id === memberMarriage.husband?.id);
        if (husband) {
          // Check if husband is from the original family
          const husbandIsFromFamily = husband.isFounder || husband.fatherId || husband.motherId || husband.relatedPersonId;
            
          if (husbandIsFromFamily) {
            let husbandInfo = husband.name;
            
            // Try to find husband's father
            if (husband.fatherId) {
              const husbandFather = familyMembers.find(f => f.id === husband.fatherId);
              if (husbandFather) {
                husbandInfo += ` ابن ${husbandFather.name}`;
              }
            } else if (husband.relatedPersonId) {
              // Find husband's parent marriage
              const husbandParentMarriage = familyMarriages.find(m => m.id === husband.relatedPersonId);
              if (husbandParentMarriage) {
                const husbandFather = familyMembers.find(f => f.id === husbandParentMarriage.husband?.id);
                if (husbandFather) {
                  husbandInfo += ` ابن ${husbandFather.name}`;
                }
              }
            }
            
            const familyName = familyData?.name || "العائلة";
            husbandInfo += ` ${familyName}`;
            
            const result = `زوجة ${husbandInfo}`;
            console.log(`Wife result for ${member.name}:`, result);
            return result;
          }
        }
      }
    }
    
    // Method 3: Fallback to father_id/mother_id for legacy data
    if (member.fatherId || member.motherId) {
      console.log(`${member.name} has parent IDs - checking for parent marriage`);
      
      // Find the marriage where one parent is husband and other is wife
      const parentMarriage = familyMarriages.find(marriage => {
        const husbandMatches = marriage.husband?.id === member.fatherId;
        const wifeMatches = marriage.wife?.id === member.motherId;
        return husbandMatches || wifeMatches;
      });
      
      if (parentMarriage) {
        console.log(`Found parent marriage for ${member.name}:`, parentMarriage);
        
        const father = familyMembers.find(m => m.id === parentMarriage.husband?.id);
        
        if (father) {
          const familyName = familyData?.name || "العائلة";
          if (member.gender === 'male') {
            const result = `ابن ${father.name} ${familyName}`;
            console.log(`Male child result for ${member.name}:`, result);
            return result;
          } else if (member.gender === 'female') {
            const result = `بنت ${father.name} ${familyName}`;
            console.log(`Female child result for ${member.name}:`, result);
            return result;
          }
        }
      }
    }
    
    // Method 4: If this person is a founder, show family name
    if (member.isFounder) {
      const result = familyData?.name || "العائلة";
      console.log(`Founder result for ${member.name}:`, result);
      return result;
    }
    
    console.log(`No additional info determined for ${member.name}`);
    return null;
  };

  // Image handling functions
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData({...formData, image: file});
      
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setShowImageCrop(true);
      });
      reader.readAsDataURL(file);
    }
  }, [formData]);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = document.createElement('img') as HTMLImageElement;
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

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

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.addEventListener('load', () => resolve(reader.result as string));
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.8);
    });
  };

  const handleCropSave = async () => {
    if (imageSrc && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        setFormData({...formData, croppedImage});
        setShowImageCrop(false);
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        toast({
          title: t('family_builder.saved_image', 'تم حفظ الصورة'),
          description: t('family_builder.image_saved_desc', 'تم قص الصورة وحفظها بنجاح')
        });
      } catch (e) {
        console.error(e);
        toast({
          title: t('family_builder.error_processing_image', 'خطأ في معالجة الصورة'),
          description: t('family_builder.error_processing_image_desc', 'حدث خطأ أثناء قص الصورة'),
          variant: "destructive"
        });
      }
    }
  };

  const handleAddNewMember = () => {
    console.log('handleAddNewMember called');
    console.log('Current family members count:', familyMembers.length);
    console.log('Package data:', packageData);
    console.log('Max family members:', packageData?.max_family_members);
    
    // Check member limit before allowing to add
    if (packageData && familyMembers.length >= packageData.max_family_members) {
      console.log('Member limit reached, showing toast');
      toast({
        title: t('family_builder.max_limit_reached', 'تم الوصول للحد الأقصى'),
        description: `${t('family_builder.max_limit_desc', 'لا يمكن إضافة أعضاء جدد. الحد الأقصى المسموح:')} ${packageData.max_family_members} ${t('family_builder.member', 'عضو')}`,
        variant: "destructive"
      });
      return;
    }
    
    console.log('Member limit check passed, opening modal');
    console.log('About to setShowAddMember(true), current state:', showAddMember);
    setShowAddMember(true);
    console.log('setShowAddMember(true) called');
  };

  // Handler for the modern modal submission
  const handleModernModalSubmit = async (memberData: any) => {
    try {
      console.log('Modern modal submit with data:', memberData);
      console.log('Selected member for editing:', selectedMember);
      
      const familyId = searchParams.get('family');
      if (!familyId) {
        toast({
          title: "خطأ",
          description: "معرف العائلة مطلوب",
          variant: "destructive"
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Determine marital status based on spouses
      const hasSpouses = (memberData.gender === "male" && memberData.wives?.length > 0) || 
                        (memberData.gender === "female" && memberData.husband);
      const maritalStatus = hasSpouses ? "married" : "single";

      // Insert main member
      const memberInsertData = {
        family_id: familyId,
        name: memberData.name,
        gender: memberData.gender,
        father_id: memberData.fatherId,
        mother_id: memberData.motherId,
        related_person_id: memberData.relatedPersonId, // Set the related person ID
        birth_date: memberData.birthDate,
        is_alive: memberData.isAlive,
        death_date: memberData.deathDate,
        biography: memberData.bio || "",
        image_url: memberData.croppedImage,
        is_founder: false,
        marital_status: maritalStatus, // Set marital status based on spouses
        created_by: user.id
      };

      const { data: insertedMember, error: memberError } = selectedMember 
        ? await supabase
            .from('family_tree_members')
            .update(memberInsertData)
            .eq('id', selectedMember.id)
            .select()
            .single()
        : await supabase
            .from('family_tree_members')
            .insert(memberInsertData)
            .select()
            .single();

      if (memberError) throw memberError;

      // Handle wives for male members
      console.log('🔥 Checking wives for male member:', memberData.gender, memberData.wives?.length);
      if (memberData.gender === "male" && memberData.wives?.length > 0) {
        console.log('🔥 Processing wives:', memberData.wives);
        for (const wife of memberData.wives) {
          if (wife.name.trim()) {
            const { data: insertedWife, error: wifeError } = await supabase
              .from('family_tree_members')
              .insert({
                family_id: familyId,
                name: wife.name,
                gender: "female",
                birth_date: wife.birthDate,
                is_alive: wife.isAlive,
                death_date: wife.deathDate,
                image_url: wife.croppedImage,
                is_founder: false,
                marital_status: "married", // Set wife as married
                created_by: user.id
              })
              .select()
              .single();

            if (wifeError) throw wifeError;

            // Create marriage record
            const { error: marriageError } = await supabase
              .from('marriages')
              .insert({
                family_id: familyId,
                husband_id: insertedMember.id,
                wife_id: insertedWife.id,
                is_active: true
              });

            if (marriageError) throw marriageError;
          }
        }
      }

      // Handle husband for female members
      if (memberData.gender === "female" && memberData.husband) {
        const husband = memberData.husband;
        if (husband.name.trim()) {
          const { data: insertedHusband, error: husbandError } = await supabase
            .from('family_tree_members')
            .insert({
              family_id: familyId,
              name: husband.name,
              gender: "male",
              birth_date: husband.birthDate,
              is_alive: husband.isAlive,
              death_date: husband.deathDate,
              image_url: husband.croppedImage,
              is_founder: false,
              marital_status: "married", // Set husband as married
              created_by: user.id
            })
            .select()
            .single();

          if (husbandError) throw husbandError;

          // Create marriage record
          const { error: marriageError } = await supabase
            .from('marriages')
            .insert({
              family_id: familyId,
              husband_id: insertedHusband.id,
              wife_id: insertedMember.id,
              is_active: true
            });

          if (marriageError) throw marriageError;
        }
      }

      // Refresh family data - trigger re-fetch by reloading the page
      window.location.reload();
      
      toast({
        title: selectedMember ? "تم التحديث بنجاح" : "تم الإضافة بنجاح",
        description: selectedMember 
          ? `تم تحديث بيانات ${memberData.name}` 
          : `تم إضافة ${memberData.name} للعائلة`
      });

    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الفرد",
        variant: "destructive"
      });
    }
  };

  const handleEditMember = async (member: any) => {
    console.log('Edit member called:', member);
    setSelectedMember(member);
    setShowAddMember(true); // Open the modern modal for editing
  };

  const handleSaveMember = async () => {
    if (isSaving) return; // Prevent double submissions
    
    if (!formData.name || !formData.gender) {
      toast({
        title: t('family_builder.error', 'خطأ'),
        description: t('family_builder.complete_fields', 'يرجى إكمال جميع الحقول المطلوبة (الاسم والجنس)'),
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Determine parent IDs based on selected family relation
      let fatherId = null;
      let motherId = null;
      
      console.log('Setting parent relationships - relatedPersonId:', formData.relatedPersonId, 'relation:', formData.relation);
      
      if (formData.relatedPersonId) {
        // Find the marriage to get parents
        const selectedMarriage = familyMarriages.find(m => m.id === formData.relatedPersonId);
        console.log('Found selected marriage:', selectedMarriage);
        if (selectedMarriage) {
          fatherId = selectedMarriage.husband?.id || null;
          motherId = selectedMarriage.wife?.id || null;
          console.log('Set parent IDs - father:', fatherId, 'mother:', motherId);
        }
      }

      // Get current user ID
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        throw new Error('User must be authenticated to add family members');
      }

      const memberData = {
        family_id: familyData?.id,
        name: formData.name,
        related_person_id: null, // Set to null for now as this should reference family_tree_members, not marriages
        father_id: fatherId,
        mother_id: motherId,
        gender: formData.gender,
        birth_date: formData.birthDate?.toISOString().split('T')[0] || null,
        is_alive: formData.isAlive,
        death_date: formData.deathDate?.toISOString().split('T')[0] || null,
        biography: formData.bio,
        image_url: formData.croppedImage,
        created_by: user.id
      };

      console.log('Saving member data:', memberData);
      console.log('Selected family relation:', formData.relatedPersonId, 'Relation:', formData.relation);

      if (selectedMember) {
        // Update existing member
        const { error } = await supabase
          .from('family_tree_members')
          .update(memberData)
          .eq('id', selectedMember.id);

        if (error) throw error;

        // Add wives if this is a male member and there are new wives
        console.log('Checking wives for existing male member:', formData.gender, wives.length, wives);
        if (formData.gender === "male" && wives.length > 0) {
          console.log('Adding wives for existing male member:', wives);
          for (const wife of wives) {
            // Check if wife already exists
            const existingWife = familyMembers.find(m => m.name === wife.name && m.spouseId === selectedMember.id);
            if (existingWife) {
              console.log('Wife already exists, skipping:', wife.name);
              continue;
            }
            
            console.log('Adding new wife:', wife);
            
            try {
              // Create wife as family tree member
              console.log('Creating wife in database...');
              const { data: wifeData, error: wifeError } = await supabase
                .from('family_tree_members')
                .insert({
                  family_id: familyData?.id,
                  name: wife.name,
                  gender: 'female',
                  birth_date: wife.birthDate ? wife.birthDate.toISOString().split('T')[0] : null,
                  death_date: wife.deathDate ? wife.deathDate.toISOString().split('T')[0] : null,
                  is_alive: wife.isAlive,
                  created_by: user.id
                })
                .select()
                .single();

              if (wifeError) {
                console.error('Error creating wife:', wifeError);
                throw wifeError;
              }
              console.log('Wife created successfully:', wifeData);

              // Create marriage record
              console.log('Creating marriage record...');
              const { data: marriageData, error: marriageError } = await supabase
                .from('marriages')
                .insert({
                  family_id: familyData?.id,
                  husband_id: selectedMember.id,
                  wife_id: wifeData.id,
                  is_active: true
                })
                .select()
                .single();

              if (marriageError) {
                console.error('Error creating marriage:', marriageError);
                throw marriageError;
              }
              console.log('Marriage created successfully:', marriageData);

              // Update spouse_id for both husband and wife
              console.log('Updating spouse_id fields...');
              const { error: updateHusbandError } = await supabase
                .from('family_tree_members')
                .update({ spouse_id: wifeData.id })
                .eq('id', selectedMember.id);

              if (updateHusbandError) {
                console.error('Error updating husband spouse_id:', updateHusbandError);
                throw updateHusbandError;
              }

              const { error: updateWifeError } = await supabase
                .from('family_tree_members')
                .update({ spouse_id: selectedMember.id })
                .eq('id', wifeData.id);

              if (updateWifeError) {
                console.error('Error updating wife spouse_id:', updateWifeError);
                throw updateWifeError;
              }
              console.log('Spouse IDs updated successfully');

              // Add wife to local state
              const newWife = {
                id: wifeData.id,
                name: wifeData.name,
                fatherId: wifeData.father_id,
                motherId: wifeData.mother_id,
                spouseId: selectedMember.id,
                isFounder: wifeData.is_founder,
                gender: wifeData.gender,
                birthDate: wifeData.birth_date || "",
                isAlive: wifeData.is_alive,
                deathDate: wifeData.death_date || null,
                bio: wifeData.biography || "",
                image: wifeData.image_url || null,
                relation: "wife"
              };

              setFamilyMembers(prev => [...prev, newWife]);

              // Add marriage to local state
              const newMarriage = {
                id: marriageData.id,
                familyId: marriageData.family_id,
                isActive: marriageData.is_active,
                husband: {
                  id: selectedMember.id,
                  name: selectedMember.name
                },
                wife: {
                  id: wifeData.id,
                  name: wifeData.name
                }
              };

              setFamilyMarriages(prev => [...prev, newMarriage]);

            } catch (wifeError) {
              console.error('Error adding wife:', wifeError);
              toast({
                title: "خطأ في إضافة الزوجة",
                description: `حدث خطأ أثناء إضافة الزوجة ${wife.name}`,
                variant: "destructive"
              });
            }
          }
        }

        // Update local state
        setFamilyMembers(familyMembers.map(member => 
          member.id === selectedMember.id ? {
            ...member,
            name: formData.name,
            gender: formData.gender,
            fatherId: fatherId,
            motherId: motherId,
            birthDate: formData.birthDate?.toISOString().split('T')[0] || "",
            isAlive: formData.isAlive,
            deathDate: formData.deathDate?.toISOString().split('T')[0] || null,
            bio: formData.bio,
            image: formData.croppedImage,
            relatedPersonId: formData.relatedPersonId
          } : member
        ));

        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات العضو بنجاح"
        });
      } else {
        // Create new member
        const { data, error } = await supabase
          .from('family_tree_members')
          .insert([memberData])
          .select()
          .single();

        if (error) throw error;

        // Add wives if this is a male member
        console.log('Checking wives for male member:', formData.gender, wives.length, wives);
        if (formData.gender === "male" && wives.length > 0) {
          console.log('Adding wives for male member:', wives);
          for (const wife of wives) {
            console.log('Adding wife:', wife);
            
            try {
              // Create wife as family tree member
              console.log('Creating wife in database...');
              const { data: wifeData, error: wifeError } = await supabase
                .from('family_tree_members')
                .insert({
                  family_id: familyData?.id,
                  name: wife.name,
                  gender: 'female',
                  birth_date: wife.birthDate ? wife.birthDate.toISOString().split('T')[0] : null,
                  death_date: wife.deathDate ? wife.deathDate.toISOString().split('T')[0] : null,
                  is_alive: wife.isAlive,
                  created_by: user.id
                })
                .select()
                .single();

              if (wifeError) {
                console.error('Error creating wife:', wifeError);
                throw wifeError;
              }
              console.log('Wife created successfully:', wifeData);

              // Create marriage record
              console.log('Creating marriage record...');
              const { data: marriageData, error: marriageError } = await supabase
                .from('marriages')
                .insert({
                  family_id: familyData?.id,
                  husband_id: data.id,
                  wife_id: wifeData.id,
                  is_active: true
                })
                .select()
                .single();

              if (marriageError) {
                console.error('Error creating marriage:', marriageError);
                throw marriageError;
              }
              console.log('Marriage created successfully:', marriageData);

              // Update spouse_id for both husband and wife
              console.log('Updating spouse_id fields...');
              const { error: updateHusbandError } = await supabase
                .from('family_tree_members')
                .update({ spouse_id: wifeData.id })
                .eq('id', data.id);

              if (updateHusbandError) {
                console.error('Error updating husband spouse_id:', updateHusbandError);
                throw updateHusbandError;
              }
              console.log('Husband spouse_id updated successfully');

              const { error: updateWifeError } = await supabase
                .from('family_tree_members')
                .update({ spouse_id: data.id })
                .eq('id', wifeData.id);

              if (updateWifeError) {
                console.error('Error updating wife spouse_id:', updateWifeError);
                throw updateWifeError;
              }
              console.log('Wife spouse_id updated successfully');

              // Add wife to local state
              const newWife = {
                id: wifeData.id,
                name: wifeData.name,
                fatherId: wifeData.father_id,
                motherId: wifeData.mother_id,
                spouseId: data.id, // Add spouse_id to local state
                isFounder: wifeData.is_founder,
                gender: wifeData.gender,
                birthDate: wifeData.birth_date || "",
                isAlive: wifeData.is_alive,
                deathDate: wifeData.death_date || null,
                bio: wifeData.biography || "",
                image: wifeData.image_url || null,
                relation: "wife"
              };
              setFamilyMembers(prev => [...prev, newWife]);
              console.log('Wife added to local state:', newWife);
              
              // Also add the marriage to familyMarriages array
              const newMarriage = {
                id: marriageData.id,
                is_active: marriageData.is_active,
                husband: {
                  id: data.id,
                  name: formData.name
                },
                wife: {
                  id: wifeData.id,
                  name: wifeData.name
                }
              };
              setFamilyMarriages(prev => [...prev, newMarriage]);
              console.log('Marriage added to familyMarriages:', newMarriage);
              
            } catch (error) {
              console.error('Error in wife creation process:', error);
              throw error;
            }
          }
        }

        // Add husbands if this is a female member
        console.log('Checking husbands for female member:', formData.gender, husbands.length, husbands);
        if (formData.gender === "female" && husbands.length > 0) {
          for (const husband of husbands) {
            console.log('Adding husband:', husband);
            // Create husband as family tree member
            const { data: husbandData, error: husbandError } = await supabase
              .from('family_tree_members')
              .insert({
                family_id: familyData?.id,
                name: husband.name,
                gender: 'male',
                birth_date: husband.birthDate ? husband.birthDate.toISOString().split('T')[0] : null,
                death_date: husband.deathDate ? husband.deathDate.toISOString().split('T')[0] : null,
                is_alive: husband.isAlive,
                created_by: user.id
              })
              .select()
              .single();

            if (husbandError) throw husbandError;

            // Create marriage record
            console.log('Creating marriage record for husband...');
            const { data: marriageData, error: marriageError } = await supabase
              .from('marriages')
              .insert({
                family_id: familyData?.id,
                husband_id: husbandData.id,
                wife_id: data.id,
                is_active: true
              })
              .select()
              .single();

            if (marriageError) {
              console.error('Error creating marriage for husband:', marriageError);
              throw marriageError;
            }
            console.log('Marriage for husband created successfully:', marriageData);

            // Update spouse_id for both husband and wife
            const { error: updateWifeError } = await supabase
              .from('family_tree_members')
              .update({ spouse_id: husbandData.id })
              .eq('id', data.id);

            if (updateWifeError) throw updateWifeError;

            const { error: updateHusbandError } = await supabase
              .from('family_tree_members')
              .update({ spouse_id: data.id })
              .eq('id', husbandData.id);

            if (updateHusbandError) throw updateHusbandError;

            // Add husband to local state
            const newHusband = {
              id: husbandData.id,
              name: husbandData.name,
              fatherId: husbandData.father_id,
              motherId: husbandData.mother_id,
              isFounder: husbandData.is_founder,
              gender: husbandData.gender,
              birthDate: husbandData.birth_date || "",
              isAlive: husbandData.is_alive,
              deathDate: husbandData.death_date || null,
              bio: husbandData.biography || "",
              image: husbandData.image_url || null,
              relation: "husband"
            };
            setFamilyMembers(prev => [...prev, newHusband]);
            console.log('Husband added to local state:', newHusband);
            
            // Also add the marriage to familyMarriages array
            const newMarriage = {
              id: marriageData.id,
              is_active: marriageData.is_active,
              husband: {
                id: husbandData.id,
                name: husbandData.name
              },
              wife: {
                id: data.id,
                name: formData.name
              }
            };
            setFamilyMarriages(prev => [...prev, newMarriage]);
            console.log('Marriage added to familyMarriages for husband:', newMarriage);
          }
        }

        // Update local state
        const newMember = {
          id: data.id,
          name: data.name,
          fatherId: data.father_id,
          motherId: data.mother_id,
          isFounder: data.is_founder,
          gender: data.gender,
          birthDate: data.birth_date || "",
          isAlive: data.is_alive,
          deathDate: data.death_date || null,
          bio: data.biography || "",
          image: data.image_url || null
        };

        console.log('Adding new member to family:', newMember);
        console.log('Current family members before adding:', familyMembers.map(m => ({ id: m.id, name: m.name })));
        setFamilyMembers(prevMembers => {
          const updatedMembers = [...prevMembers, newMember];
          console.log('Updated family members after adding:', updatedMembers.map(m => ({ id: m.id, name: m.name })));
          return updatedMembers;
        });
        toast({
          title: "تم الإضافة",
          description: `تم إضافة ${formData.name}${wives.length > 0 ? ` مع ${wives.length} زوجة` : ''}${husbands.length > 0 ? ` مع ${husbands.length} زوج` : ''} للعائلة`
        });

        // Refresh data from database to ensure UI reflects actual database state
        console.log('Refreshing data from database after member addition...');
        await refreshFamilyData();
      }

      setShowAddMember(false);
      setSelectedMember(null);
      setCurrentStep(1);
      setWives([]); // Reset wives
      setHusbands([]); // Reset husbands
      setEditingWife(null); // Reset editing wife
      setEditingHusband(null); // Reset editing husband
      setFormData({
        name: "",
        relation: "",
        relatedPersonId: null,
        gender: "",
        birthDate: null,
        isAlive: true,
        deathDate: null,
        bio: "",
        image: null,
        croppedImage: null
      });
    } catch (error) {
      console.error('Error saving member:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      // Check if member is a founder
      const memberToDelete = familyMembers.find(member => member.id === id);
      if (memberToDelete?.isFounder) {
        toast({
          title: "تحذير",
          description: "لا يمكن حذف مؤسس العائلة",
          variant: "destructive"
        });
        return;
      }

      // First, delete any marriage records related to this member
      const { error: marriageError } = await supabase
        .from('marriages')
        .delete()
        .or(`husband_id.eq.${id},wife_id.eq.${id}`);

      if (marriageError) {
        console.error('Error deleting marriages:', marriageError);
        throw marriageError;
      }

      // Then delete the member
      const { error } = await supabase
        .from('family_tree_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setFamilyMembers(familyMembers.filter(member => member.id !== id));
      
      // Update marriages state to remove deleted member's marriages
      setFamilyMarriages(familyMarriages.filter(marriage => 
        marriage.husband?.id !== id && marriage.wife?.id !== id
      ));

      toast({
        title: "تم الحذف",
        description: "تم حذف العضو من شجرة العائلة"
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

  const getRelationIcon = (relation: string) => {
    const icons: { [key: string]: string } = {
      father: "👨‍🦳", mother: "👩‍🦳", husband: "👨", wife: "👩",
      brother: "👨‍🦱", sister: "👩‍🦱", son: "👶", daughter: "👶",
      founder: "👑"
    };
    return icons[relation] || "👤";
  };

// Function to generate full hierarchical name
  const getFullName = (member: any) => {
    if (!familyData?.name) return member.name;
    
    // For founders, return name + family name
    if (member.relation === "founder" || !member.relatedPersonId) {
      return `${member.name} ${familyData.name}`;
    }
    
    // For others, build the chain: name + father's chain + family name
    const buildNameChain = (currentMember: any, visited = new Set()): string => {
      // Prevent infinite loops
      if (visited.has(currentMember.id)) {
        return currentMember.name;
      }
      visited.add(currentMember.id);
      
      // If no related person, just return current name
      if (!currentMember.relatedPersonId) {
        return currentMember.name;
      }
      
      // Find the related person (parent)
      const relatedPerson = familyMembers.find(m => m.id === currentMember.relatedPersonId);
      if (!relatedPerson) {
        return currentMember.name;
      }
      
      // If related person is founder, build final chain
      if (relatedPerson.relation === "founder" || !relatedPerson.relatedPersonId) {
        return `${currentMember.name} ${relatedPerson.name} ${familyData.name}`;
      }
      
      // Recursively build the chain
      const parentChain = buildNameChain(relatedPerson, visited);
      // Remove family name from parent chain if it exists to avoid duplication
      const cleanParentChain = parentChain.replace(` ${familyData.name}`, '');
      return `${currentMember.name} ${cleanParentChain} ${familyData.name}`;
    };
    
    return buildNameChain(member);
  };

  const getGenderColor = (gender: string) => {
    return gender === "male" ? "bg-blue-500/20 text-blue-700 border-blue-200" : "bg-pink-500/20 text-pink-700 border-pink-200";
  };

  const nextStep = () => {
    if (currentStep === 1 && (!formData.name || !formData.gender)) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى إدخال الاسم واختيار الجنس",
        variant: "destructive"
      });
      return;
    }
    
    // Validate family selection for step 1
    if (currentStep === 1 && formData.relation === "child" && !formData.relatedPersonId) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى اختيار العائلة المرتبطة للطفل",
        variant: "destructive"
      });
      return;
    }
    
    // Skip step 3 (wives) for female members
    if (currentStep === 2 && formData.gender === "female") {
      setCurrentStep(3); // This will trigger the save since step 3 button shows save
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">{t('family_builder.loading', 'جاري تحميل بيانات العائلة...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={direction} className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950/50 dark:to-cyan-950 relative overflow-hidden">
      {/* Luxury Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-cyan-400/10 rounded-full blur-3xl animate-float opacity-60"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-tr from-cyan-400/15 via-teal-400/20 to-emerald-400/10 rounded-full blur-2xl animate-float-delayed opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-400/10 via-emerald-400/15 to-cyan-400/5 rounded-full blur-3xl animate-float-slow opacity-30"></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-300/15 via-teal-300/20 to-cyan-300/10 rounded-full blur-2xl animate-pulse opacity-50"></div>
      </div>
      
      <GlobalHeader />

      {/* Main Content */}
      <div className="pt-24 relative z-10 min-h-screen">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
        </div>

        {/* Floating Animated Icons */}
        <div className="absolute top-32 right-20 animate-float pointer-events-none">
          <Heart className="h-10 w-10 text-pink-400 opacity-60" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float-delayed pointer-events-none">
          <Users className="h-12 w-12 text-emerald-400 opacity-40" />
        </div>
        <div className="absolute top-1/2 left-10 animate-float-slow pointer-events-none">
          <Star className="h-8 w-8 text-yellow-400 opacity-60" />
        </div>
        <div className="max-w-7xl mx-auto px-6">
          {/* Header Box */}
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
                      <div className="text-xs text-gray-500 dark:text-gray-400">أعضاء</div>
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
                      <div className="text-xs text-gray-500 dark:text-gray-400">أجيال</div>
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
                          : 'اليوم'
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
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">نظرة عامة</span>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => navigate('/family-tree-view')}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
                      <TreePine className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">مخطط الشجرة</span>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => navigate('/store')}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-all group-hover:bg-emerald-500 group-hover:text-white">
                      <Store className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">المتجر</span>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => navigate('/family-statistics')}
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
          
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8" style={{direction: direction}}>
            {/* Modern Tabs Navigation */}
            <div className="flex justify-center relative">
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">

              {/* Search and Add Section */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-8">
                {/* Search Bar - Right Side in RTL */}
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('family_builder.search_placeholder', 'البحث في أفراد العائلة...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 h-11 sm:h-12 rounded-xl border-primary/20 focus:border-primary bg-card/50 backdrop-blur-sm w-full"
                  />
                </div>
                {/* Controls Section - Left Side in RTL */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-full sm:w-48 lg:w-64 h-11 sm:h-12 rounded-xl border-primary/20 focus:border-primary bg-card/50 backdrop-blur-sm">
                      <SelectValue placeholder={t('family_builder.choose_display_type', 'Choose Display Type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Badge and Add Button Section */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <Button
                      onClick={() => {
                        console.log('🔴 Add button clicked!');
                        console.log('Current members:', familyMembers.length, 'Package data:', packageData);
                        handleAddNewMember();
                      }}
                      disabled={packageData && familyMembers.length >= packageData.max_family_members}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-3 sm:px-6 h-11 sm:h-12 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <Plus className="ml-2 h-4 w-4" />
                      <span className="text-xs sm:text-sm">{t('family_builder.add_member', 'إضافة فرد')}</span>
                    </Button>
                    {packageData && (
                      <Badge 
                        variant={familyMembers.length >= packageData.max_family_members ? "destructive" : "secondary"}
                        className="px-3 py-2 text-xs sm:text-sm text-center whitespace-nowrap"
                      >
                        {familyMembers.length}/{packageData.max_family_members} أعضاء
                        {familyMembers.length >= packageData.max_family_members && (
                          <span className="hidden sm:inline"> (وصلت للحد الأقصى)</span>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Family Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Family Members - الأفراد أولاً */}
                {filteredMembers.map((member) => (
                  <Card key={member.id} className="group relative bg-gradient-to-br from-card/60 via-card/80 to-card/90 backdrop-blur-xl border border-white/20 shadow-xl rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-primary/40">
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    {/* Floating particles effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute top-4 right-6 w-2 h-2 bg-primary/30 rounded-full animate-pulse"></div>
                      <div className="absolute top-8 right-12 w-1 h-1 bg-accent/40 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-secondary/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
                    </div>

                    <CardContent className="relative z-10 p-0">
                      {/* Header Section with Creative Layout */}
                      <div className="relative p-6 bg-gradient-to-r from-white/10 via-white/5 to-transparent">
                        <div className="flex items-start gap-4">
                          {/* Enhanced Avatar with Ring Animation */}
                          <div className="relative group/avatar">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg group-hover/avatar:border-primary/50 transition-all duration-300">
                              <Avatar className="w-full h-full rounded-2xl">
                                <AvatarImage src={member.image || undefined} className="object-cover group-hover/avatar:scale-110 transition-transform duration-500" />
                                <AvatarFallback className="bg-gradient-to-br from-primary via-accent to-secondary text-white font-bold text-lg rounded-2xl">
                                  {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              {/* Status indicator with pulse */}
                              <div className={cn(
                                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-lg",
                                member.isAlive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                              )}></div>
                            </div>
                          </div>
                          
                          {/* Member Info with Creative Typography */}
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-3 mb-2">
                               <h3 className="font-bold text-foreground text-xl leading-tight truncate group-hover:text-primary transition-colors duration-300 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                                 {member.name}
                               </h3>
                               <Badge className={cn(
                                 "px-3 py-1 rounded-full font-medium text-xs border-0 shadow-md transition-all duration-300 group-hover:scale-105",
                                 member.gender === "male" 
                                   ? "bg-blue-100 text-blue-700 shadow-blue-200/50" 
                                   : "bg-pink-100 text-pink-700 shadow-pink-200/50"
                               )}>
                                 {member.gender === "male" ? `👨 ${t('family_builder.male', 'ذكر')}` : `👩 ${t('family_builder.female', 'أنثى')}`}
                               </Badge>
                             </div>
                             
                             {/* Additional info under name */}
                             {(() => {
                               const additionalInfo = getAdditionalInfo(member);
                               console.log(`Additional info for ${member.name}:`, additionalInfo);
                               return additionalInfo ? (
                                 <div className="mb-2">
                                   <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed">
                                     {additionalInfo}
                                   </p>
                                 </div>
                               ) : null;
                             })()}
                          </div>

                          {/* Actions Menu with Creative Design */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-90 group-hover:bg-primary/20">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 bg-card/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
                              <DropdownMenuItem onClick={() => handleEditMember(member)} className="gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Edit className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">{t('family_builder.edit_data', 'تعديل البيانات')}</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10 my-1" />
                              {!member.isFounder && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteMember(member.id)}
                                  className="gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive"
                                >
                                  <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                                    <Trash2 className="h-4 w-4" />
                                  </div>
                                  <span className="font-medium">{t('family_builder.delete_from_family', 'حذف من العائلة')}</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Content Section with Creative Cards */}
                      <div className="p-6 space-y-4">
                        {/* Relation Card with Gradient */}
                        <div className="relative group/relation">
                          
                              {member.relatedPersonId ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                   <span className="text-sm text-muted-foreground">{t(member.relation, member.relation)}</span>
                                   <span className="font-bold text-primary">
                                     {(() => {
                                       const relatedPerson = familyMembers.find(m => m.id === member.relatedPersonId);
                                       return relatedPerson ? getFullName(relatedPerson) : "غير محدد";
                                     })()}
                                   </span>
                                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                                </div>
                              ) : null}
                        </div>

                        {/* Status Card with Animation */}
                        <div className="flex justify-center">
                          <div className={cn(
                            "relative group/status inline-flex items-center gap-3 px-6 py-3 rounded-2xl font-medium text-sm shadow-lg transition-all duration-300 hover:scale-105 border",
                            member.isAlive 
                              ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-700 hover:shadow-green-200/50" 
                              : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600 hover:shadow-gray-200/50"
                          )}>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover/status:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center gap-3">
                              {member.isAlive ? (
                                <>
                                  <div className="relative">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                                  </div>
                                  <span className="font-semibold">{t('family_builder.alive', 'على قيد الحياة')}</span>
                                  <Heart className="h-4 w-4 text-green-600 animate-pulse" />
                                </>
                              ) : (
                                <>
                                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                  <span className="font-semibold">{t('family_builder.deceased', 'متوفى')}</span>
                                  <Skull className="h-4 w-4 text-gray-500" />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add New Member Card - يظهر بعد آخر عضو */}
                {packageData && familyMembers.length >= packageData.max_family_members ? (
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-2 border-red-200 dark:border-red-800 rounded-2xl">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
                        <UserPlus className="h-8 w-8 text-red-600 dark:text-red-400" />
                      </div>
                      <h3 className="font-bold text-red-600 dark:text-red-400 text-lg mb-2">تم الوصول للحد الأقصى</h3>
                      <p className="text-red-500 dark:text-red-300 text-center text-sm mb-4">
                        لقد وصلت إلى الحد الأقصى المسموح ({packageData.max_family_members} أعضاء)
                      </p>
                      <Button 
                        onClick={() => navigate('/payments')}
                        variant="outline"
                        className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        ترقية الباقة
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card 
                    className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer group hover:from-primary/10 hover:to-accent/10 hover:border-primary/50 transition-all duration-300"
                    onClick={handleAddNewMember}
                  >
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-bold text-primary text-lg mb-2">{t('family_builder.add_new_member', 'إضافة فرد جديد')}</h3>
                      <p className="text-muted-foreground text-center text-sm">{t('family_builder.click_to_add', 'انقر هنا لإضافة عضو جديد إلى شجرة العائلة')}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Tree View Tab */}
            <TabsContent value="tree-view" className="space-y-8">
              <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
                  <CardTitle className="text-center text-2xl text-foreground">{t('family_builder.family_tree', 'شجرة العائلة')}</CardTitle>
                  <CardDescription className="text-center text-muted-foreground">{t('family_builder.interactive_view', 'عرض تفاعلي لشجرة العائلة')}</CardDescription>
                </CardHeader>
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <TreePine className="h-16 w-16 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{t('family_builder.tree_under_development', 'Tree View Under Development')}</h3>
                    <p className="text-muted-foreground text-lg">{t('family_builder.coming_soon', 'سيتم إضافة عرض تفاعلي للشجرة قريباً')}</p>
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
                      إحصائيات الأجيال
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getGenerationStats().map(([generation, count]) => (
                        <div key={generation} className="flex justify-between items-center">
                          <span>الجيل {generation === 1 ? 'الأول' : generation === 2 ? 'الثاني' : generation === 3 ? 'الثالث' : `الـ${generation}`}</span>
                          <Badge className="bg-primary/20 text-primary">{count} أفراد</Badge>
                        </div>
                      ))}
                      {getGenerationStats().length === 0 && (
                        <div className="text-center text-muted-foreground">
                          لا توجد بيانات أجيال
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      توزيع الجنس
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>الذكور</span>
                        <Badge className="bg-blue-500/20 text-blue-700">
                          {familyMembers.filter(m => m.gender === 'male').length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>{t('family_builder.females', 'Females')}</span>
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
      </div>

      {/* Modern Family Member Modal */}
      <ModernFamilyMemberModal
        isOpen={showAddMember}
        onClose={() => {
          console.log('Modal onClose called');
          setShowAddMember(false);
          setSelectedMember(null); // Reset selected member when closing
        }}
        onSubmit={handleModernModalSubmit}
        familyId={searchParams.get('family') || ''}
        editMember={selectedMember} // Pass the member being edited
      />

      <GlobalFooter />
    </div>
  );
};

export default FamilyBuilder;