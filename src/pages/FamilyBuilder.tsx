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
  const { t } = useLanguage();
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
  useEffect(() => {
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
              marriage_date,
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
          title: "خطأ في تحميل البيانات",
          description: "حدث خطأ أثناء تحميل بيانات العائلة",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

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
    { value: "all", label: "عرض جميع الأعضاء" },
    { value: "blood_relations", label: "عرض الأقارب بالدم (نفس العائلة)" },
    { value: "non_family", label: "عرض جميع الأفراد خارج العائلة الأصلية" },
    { value: "wives", label: "عرض جميع الزوجات" },
    { value: "husbands", label: "عرض جميع الأزواج" },
    { value: "blood_with_female_children", label: "الأقارب بالدم وأطفال الإناث من نفس عائلة الأب" }
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
      isFounder: member.isFounder
    });
    
    // For males from the same family (have fatherId or are founders)
    if (member.gender === 'male' && (member.fatherId || member.isFounder)) {
      console.log(`${member.name} is male with fatherId or founder`);
      if (member.fatherId) {
        const father = familyMembers.find(m => m.id === member.fatherId);
        console.log(`Father found for ${member.name}:`, father);
        if (father) {
          // Check if father is from original family (has fatherId or is founder)
          const fatherIsFromFamily = father.fatherId || father.isFounder;
          console.log(`Father ${father.name} is from original family:`, fatherIsFromFamily);
          
          if (fatherIsFromFamily) {
            const result = `ابن ${father.name} الشيخ سعيد`;
            console.log(`Male result for ${member.name}:`, result);
            return result;
          } else {
            console.log(`${member.name} father is not from original family, will check children case`);
            // Don't return here, let it fall through to children case
          }
        }
      }
      if (member.isFounder) {
        return "الشيخ سعيد"; // Add family name for founders like Amir
      }
    }
    
    // For male spouses (married men who are not from the original family)
    if (member.gender === 'male' && 
        familyMarriages.some(marriage => marriage.husband?.id === member.id) &&
        !member.fatherId && !member.motherId && !member.isFounder) {
      console.log(`${member.name} is a husband from outside family`);
      const marriage = familyMarriages.find(m => m.husband?.id === member.id);
      if (marriage?.wife) {
        const wife = familyMembers.find(w => w.id === marriage.wife.id);
        if (wife) {
          let wifeInfo = wife.name;
          
          // Add father's name if wife has fatherId
          if (wife.fatherId) {
            const wifeFather = familyMembers.find(f => f.id === wife.fatherId);
            if (wifeFather) {
              wifeInfo += ` بنت ${wifeFather.name}`;
            }
          }
          
          // Add family name
          wifeInfo += ` الشيخ سعيد`;
          
          const result = `زوج ${wifeInfo}`;
          console.log(`Husband result for ${member.name}:`, result);
          return result;
        }
      }
    }
    // For females from the same family (have fatherId or are founders)
    if (member.gender === 'female' && (member.fatherId || member.isFounder)) {
      console.log(`${member.name} is female with fatherId or founder`);
      if (member.fatherId) {
        const father = familyMembers.find(m => m.id === member.fatherId);
        console.log(`Father found for ${member.name}:`, father);
        if (father) {
          const result = `بنت ${father.name} الشيخ سعيد`;
          console.log(`Female result for ${member.name}:`, result);
          return result;
        }
      }
      if (member.isFounder) {
        return "الشيخ سعيد"; // Add family name for female founders
      }
    }
    // For wives (married women who are not from the original family)
    if (member.gender === 'female' && 
        familyMarriages.some(marriage => marriage.wife?.id === member.id) &&
        !member.fatherId && !member.motherId && !member.isFounder) {
      console.log(`${member.name} is a wife from outside family`);
      const marriage = familyMarriages.find(m => m.wife?.id === member.id);
      if (marriage?.husband) {
        const husband = familyMembers.find(h => h.id === marriage.husband.id);
        if (husband) {
          let husbandFullName = husband.name;
          
          // Add father's name if husband has fatherId
          if (husband.fatherId) {
            const husbandFather = familyMembers.find(f => f.id === husband.fatherId);
            if (husbandFather) {
              husbandFullName += ` ابن ${husbandFather.name}`;
            }
          }
          
          // Add family name - assuming "الشيخ سعيد" is the family name
          husbandFullName += ` الشيخ سعيد`;
          
          const result = `زوجة ${husbandFullName}`;
          console.log(`Wife result for ${member.name}:`, result);
          return result;
        }
      }
    }
    
    // For children of daughters (have both father and mother, where father is not from original family)
    if (member.fatherId && member.motherId) {
      console.log(`${member.name} has both father and mother IDs`);
      const father = familyMembers.find(m => m.id === member.fatherId);
      const mother = familyMembers.find(m => m.id === member.motherId);
      
      console.log(`For ${member.name} - Father:`, father, 'Mother:', mother);
      
      if (father && mother) {
        // Check if father is non-blood (married into family) - no fatherId/motherId and not founder
        const fatherIsNonBlood = !father.fatherId && !father.motherId && !father.isFounder;
        // Check if mother is from original family - has fatherId or is founder
        const motherIsFromFamily = mother.fatherId || mother.isFounder;
        
        console.log(`For ${member.name} - Father is non-blood:`, fatherIsNonBlood, 'Mother is from family:', motherIsFromFamily);
          
        if (fatherIsNonBlood && motherIsFromFamily) {
          // Build mother's full info
          let motherInfo = mother.name;
          if (mother.fatherId) {
            const motherFather = familyMembers.find(m => m.id === mother.fatherId);
            console.log(`Mother's father for ${member.name}:`, motherFather);
            if (motherFather) {
              motherInfo += ` بنت ${motherFather.name}`;
            }
          }
          motherInfo += ` الشيخ سعيد`;
          
          const result = `ابن ${father.name} - زوج ${motherInfo}`;
          console.log(`Children result for ${member.name}:`, result);
          return result;
        }
      }
    }
    
    console.log(`No additional info for ${member.name}`);
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
          title: "تم حفظ الصورة",
          description: "تم قص الصورة وحفظها بنجاح"
        });
      } catch (e) {
        console.error(e);
        toast({
          title: "خطأ في معالجة الصورة",
          description: "حدث خطأ أثناء قص الصورة",
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
        title: "تم الوصول للحد الأقصى",
        description: `لا يمكن إضافة أعضاء جدد. الحد الأقصى المسموح: ${packageData.max_family_members} عضو`,
        variant: "destructive"
      });
      return;
    }
    
    console.log('Member limit check passed, opening modal');
    setSelectedMember(null);
    setCurrentStep(1);
    setShowAddMember(true);
    // Reset all spouse data for new members
    setHusbands([]);
    setWives([]);
    setEditingWife(null);
    setEditingHusband(null);
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
  };

  const handleEditMember = async (member: any) => {
    setSelectedMember(member);
    setCurrentStep(1);
    setShowAddMember(true);
    
    // Determine relation based on member properties
    let relation = "";
    if (member.isFounder) {
      relation = "founder";
    } else if (member.fatherId || member.motherId) {
      relation = "child";
    } else {
      // Check if this member is married (husband or wife)
      const marriage = familyMarriages.find(m => 
        m.husband?.id === member.id || m.wife?.id === member.id
      );
      if (marriage) {
        relation = member.gender === "male" ? "husband" : "wife";
      }
    }
    
    // Find the correct family relation for this member
    let relatedPersonId = member.relatedPersonId || null;
    
    // If member has parents, find their marriage (the family this member belongs to)
    if (member.fatherId && member.motherId) {
      const parentMarriage = familyMarriages.find(m => 
        (m.husband?.id === member.fatherId && m.wife?.id === member.motherId) ||
        (m.husband?.id === member.motherId && m.wife?.id === member.fatherId)
      );
      if (parentMarriage) {
        relatedPersonId = parentMarriage.id;
      }
    }
    
    setFormData({
      name: member.name,
      relation: relation,
      relatedPersonId: relatedPersonId,
      gender: member.gender,
      birthDate: member.birthDate ? new Date(member.birthDate) : null,
      isAlive: member.isAlive,
      deathDate: member.deathDate ? new Date(member.deathDate) : null,
      bio: member.bio || "",
      image: null,
      croppedImage: member.image
    });
    
    // Load wives if this is a male member
    if (member.gender === "male") {
      console.log('Loading wives for male member:', member.id, member.name);
      console.log('Available marriages:', familyMarriages);
      const memberMarriages = familyMarriages.filter(m => m.husband?.id === member.id);
      console.log('Member marriages:', memberMarriages);
      
      const memberWives = memberMarriages.map(marriage => {
        const wife = familyMembers.find(fm => fm.id === marriage.wife?.id);
        console.log('Found wife:', wife, 'for marriage:', marriage);
        return {
          id: `existing-${wife?.id || marriage.wife?.id}`, // Mark existing wives to prevent deletion
          name: marriage.wife?.name || "",
          isAlive: wife?.isAlive ?? true,
          birthDate: wife?.birthDate ? new Date(wife.birthDate) : null,
          deathDate: wife?.deathDate ? new Date(wife.deathDate) : null
        };
      }).filter(wife => wife.id); // Filter out any invalid wives
      
      console.log('Setting wives:', memberWives);
      setWives(memberWives);
      setHusbands([]); // Reset husbands for male members
    } else if (member.gender === "female") {
      // Load husbands if this is a female member
      const memberMarriages = familyMarriages.filter(m => m.wife?.id === member.id);
      const memberHusbands = memberMarriages.map(marriage => {
        const husband = familyMembers.find(fm => fm.id === marriage.husband?.id);
        return {
          id: `existing-${husband?.id || marriage.husband?.id}`, // Mark existing husbands to prevent deletion
          name: marriage.husband?.name || "",
          isAlive: husband?.isAlive ?? true,
          birthDate: husband?.birthDate ? new Date(husband.birthDate) : null,
          deathDate: husband?.deathDate ? new Date(husband.deathDate) : null
        };
      }).filter(husband => husband.id); // Filter out any invalid husbands
      
      setHusbands(memberHusbands);
      setWives([]);
    } else {
      setWives([]);
      setHusbands([]);
    }
    
    setEditingWife(null); // Reset editing wife
    setEditingHusband(null); // Reset editing husband
  };

  const handleSaveMember = async () => {
    if (isSaving) return; // Prevent double submissions
    
    if (!formData.name || !formData.gender) {
      toast({
        title: "خطأ",
        description: "يرجى إكمال جميع الحقول المطلوبة (الاسم والجنس)",
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
        created_by: (await supabase.auth.getUser()).data.user?.id
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
                  created_by: (await supabase.auth.getUser()).data.user?.id
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
                  created_by: (await supabase.auth.getUser()).data.user?.id
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

              const { error: updateWifeError } = await supabase
                .from('family_tree_members')
                .update({ spouse_id: data.id })
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
                marriage_date: marriageData.marriage_date,
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
                created_by: (await supabase.auth.getUser()).data.user?.id
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
              marriage_date: marriageData.marriage_date,
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

        setFamilyMembers([...familyMembers, newMember]);
        toast({
          title: "تم الإضافة",
          description: `تم إضافة ${formData.name}${wives.length > 0 ? ` مع ${wives.length} زوجة` : ''}${husbands.length > 0 ? ` مع ${husbands.length} زوج` : ''} للعائلة`
        });
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
          <p className="text-muted-foreground">جاري تحميل بيانات العائلة...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950/50 dark:to-cyan-950 relative overflow-hidden">
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
            <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-6 shadow-2xl ring-1 ring-white/20 dark:ring-gray-500/20">
              <div className="flex items-center justify-between gap-8">
                {/* Right Side: Icon + Title + Description */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xl border-2 border-white/30 dark:border-gray-700/30">
                      <Users className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                    {/* Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        عائلة {familyData?.name || 'غير محدد'}
                      </span>
                    </h1>
                  </div>
                </div>

                {/* Sample Statistics Section - Moved to Middle */}
                <div className="flex justify-center items-center gap-8">
                  {/* Members Available */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {familyMembers.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">أعضاء</div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="w-px h-8 bg-white/20 dark:bg-gray-600/20"></div>

                  {/* Number of Generations */}
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {calculateGenerationCount()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">أجيال</div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="w-px h-8 bg-white/20 dark:bg-gray-600/20"></div>

                  {/* Last Modified Date */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <div className="text-center">
                      <div className="text-lg font-bold text-teal-600 dark:text-teal-400">
                        {familyData?.updated_at 
                          ? format(new Date(familyData.updated_at), 'd MMM', { locale: ar })
                          : 'اليوم'
                        }
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">آخر تعديل</div>
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
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">الإحصائات</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8" style={{direction: 'rtl'}}>
            {/* Modern Tabs Navigation */}
            <div className="flex justify-center relative">
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">

              {/* Search and Add Section */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في أفراد العائلة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 h-12 rounded-xl border-primary/20 focus:border-primary bg-card/50 backdrop-blur-sm"
                  />
                </div>
                
                <div className="flex gap-3 items-center">
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-80 h-12 rounded-xl border-primary/20 focus:border-primary bg-card/50 backdrop-blur-sm">
                      <SelectValue placeholder="اختر نوع العرض" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-3">
                    {packageData && (
                      <Badge 
                        variant={familyMembers.length >= packageData.max_family_members ? "destructive" : "secondary"}
                        className="px-3 py-1 text-sm"
                      >
                        {familyMembers.length} / {packageData.max_family_members} أعضاء
                        {familyMembers.length >= packageData.max_family_members && " (تم الوصول للحد الأقصى)"}
                      </Badge>
                    )}
                    <Button
                      onClick={() => {
                        console.log('Add button clicked - Current members:', familyMembers.length, 'Package data:', packageData);
                        handleAddNewMember();
                      }}
                      disabled={packageData && familyMembers.length >= packageData.max_family_members}
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      إضافة فرد جديد
                    </Button>
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
                                 {member.gender === "male" ? "👨 ذكر" : "👩 أنثى"}
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
                                <span className="font-medium">تعديل البيانات</span>
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
                                  <span className="font-medium">حذف من العائلة</span>
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
                          
                          <div>
                            <div className="text-center">
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
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                                    <Crown className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="font-bold text-primary text-lg">المؤسس</span>
                                </div>
                              )}
                            </div>
                          </div>
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
                                  <span className="font-semibold">على قيد الحياة</span>
                                  <Heart className="h-4 w-4 text-green-600 animate-pulse" />
                                </>
                              ) : (
                                <>
                                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                  <span className="font-semibold">متوفى</span>
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
                      <h3 className="font-bold text-primary text-lg mb-2">إضافة فرد جديد</h3>
                      <p className="text-muted-foreground text-center text-sm">انقر هنا لإضافة عضو جديد إلى شجرة العائلة</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Tree View Tab */}
            <TabsContent value="tree-view" className="space-y-8">
              <Card className="bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
                  <CardTitle className="text-center text-2xl text-foreground">شجرة العائلة</CardTitle>
                  <CardDescription className="text-center text-muted-foreground">عرض تفاعلي لشجرة العائلة</CardDescription>
                </CardHeader>
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <TreePine className="h-16 w-16 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">عرض الشجرة قيد التطوير</h3>
                    <p className="text-muted-foreground text-lg">سيتم إضافة عرض تفاعلي للشجرة قريباً</p>
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
                        <span>الإناث</span>
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

      {/* Add/Edit Member Modal */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">{/* Removed problematic positioning classes */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-secondary rounded-t-3xl"></div>
          
          <DialogHeader className="relative pt-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-foreground">
                  {selectedMember ? 'تعديل بيانات العضو' : 'إضافة فرد جديد'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-lg">
                  {selectedMember ? 'قم بتعديل معلومات العضو' : 'أدخل معلومات الفرد الجديد'}
                </DialogDescription>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                    currentStep >= step 
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={cn(
                      "w-16 h-1 rounded-full mx-2 transition-all duration-300",
                      currentStep > step ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"
                    )}></div>
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] px-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      الاسم الكامل
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="أدخل الاسم الكامل"
                      className="h-12 text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      الجنس
                    </Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value, relation: ""})}>
                      <SelectTrigger className="h-12 text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input">
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                        <SelectItem value="male" className="text-lg py-4 rounded-lg">👨 ذكر</SelectItem>
                        <SelectItem value="female" className="text-lg py-4 rounded-lg">👩 أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Profile Photo and Family Selection Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Profile Photo */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary" />
                      الصورة الشخصية (اختياري)
                    </Label>
                    
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20 border-4 border-primary/20">
                        <AvatarImage src={formData.croppedImage || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-xl">
                          {formData.name ? formData.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '👤'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onFileChange}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl cursor-pointer hover:from-primary/20 hover:to-accent/20 transition-all"
                        >
                          <UploadCloud className="h-4 w-4" />
                          اختر صورة
                        </label>
                        <p className="text-sm text-muted-foreground mt-2">
                          يفضل استخدام صور بجودة عالية ونسبة 1:1
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Family Selection - Hidden for founders */}
                  {familyMarriages.length > 0 && formData.relation !== "founder" && (
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        اختر العائلة المرتبطة
                      </Label>
                      <Popover open={showRelatedPersonDropdown} onOpenChange={setShowRelatedPersonDropdown}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-12 justify-between text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input",
                              !formData.relatedPersonId && "text-muted-foreground"
                            )}
                          >
                            {(() => {
                              console.log('Family selection debug:');
                              console.log('- formData.relatedPersonId:', formData.relatedPersonId);
                              console.log('- available familyMarriages:', familyMarriages.map(m => ({id: m.id, husband: m.husband?.name, wife: m.wife?.name})));
                              
                              if (formData.relatedPersonId) {
                                const marriage = familyMarriages.find(m => m.id === formData.relatedPersonId);
                                console.log('- found marriage for relatedPersonId:', marriage);
                                
                                if (marriage) {
                                  return (
                                    <div className="flex items-center gap-3">
                                      <span className="text-xl">❤️</span>
                                      <div className="flex flex-col items-start">
                                        <span className="font-medium">
                                          {`${marriage.husband?.name} + ${marriage.wife?.name}`}
                                        </span>
                                        <span className="text-xs text-muted-foreground">عائلة</span>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="flex items-center gap-3 text-destructive">
                                      <span className="text-xl">⚠️</span>
                                      <span>العائلة المحددة غير موجودة</span>
                                    </div>
                                  );
                                }
                              } else {
                                return "ابحث واختر من قائمة العائلات";
                              }
                            })()}
                            <Search className="h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                          <Command>
                            <CommandInput placeholder="ابحث عن عائلة..." className="h-12 text-lg" />
                            <CommandEmpty>لم يتم العثور على أي عائلة.</CommandEmpty>
                            <CommandList className="max-h-60">
                              <CommandGroup>
                                {familyMarriages.filter(marriage => 
                                  marriage.husband?.id !== selectedMember?.id && 
                                  marriage.wife?.id !== selectedMember?.id
                                ).map((marriage) => (
                                  <CommandItem
                                    key={marriage.id}
                                    value={`${marriage.husband?.name} ${marriage.wife?.name} عائلة`}
                                    onSelect={() => {
                                      setFormData({...formData, relatedPersonId: marriage.id});
                                      setShowRelatedPersonDropdown(false);
                                    }}
                                    className="flex items-center gap-3 p-3 cursor-pointer"
                                  >
                                    <span className="text-2xl">❤️</span>
                                     <div className="flex flex-col flex-1">
                                       <span className="font-medium">
                                         {getMarriageDisplayName(marriage)}
                                       </span>
                                       <span className="text-sm text-muted-foreground">عائلة</span>
                                     </div>
                                    {formData.relatedPersonId === marriage.id && (
                                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <p className="text-sm text-muted-foreground">
                        اختر العائلة التي سينتمي إليها {formData.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Additional Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">معلومات إضافية</h3>
                  <p className="text-muted-foreground">أضف التفاصيل الإضافية للشخص</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      تاريخ الميلاد
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 justify-start text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input",
                            !formData.birthDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.birthDate ? format(formData.birthDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl" align="start" side="bottom" sideOffset={4}>
                        <div className="p-6 space-y-6 min-w-[320px]">
                          <div className="text-center">
                            <h4 className="font-semibold text-foreground mb-1">اختر تاريخ الميلاد</h4>
                            <p className="text-sm text-muted-foreground">يمكنك كتابة التاريخ مباشرة أو استخدام القوائم</p>
                          </div>
                          
                          {/* Direct Input Fields */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">اليوم</Label>
                              <Input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.birthDate?.getDate() || ""}
                                onChange={(e) => {
                                  const day = parseInt(e.target.value);
                                  if (day >= 1 && day <= 31) {
                                    const currentDate = formData.birthDate || new Date(1990, 0, 1);
                                    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                    setFormData({...formData, birthDate: newDate});
                                  }
                                }}
                                placeholder="01"
                                className="text-center font-mono text-lg h-12"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">الشهر</Label>
                              <Select 
                                value={formData.birthDate?.getMonth()?.toString() || ""} 
                                onValueChange={(month) => {
                                  const currentDate = formData.birthDate || new Date(1990, 0, 1);
                                  const newDate = new Date(currentDate.getFullYear(), parseInt(month), currentDate.getDate());
                                  setFormData({...formData, birthDate: newDate});
                                }}
                              >
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="--" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                      {format(new Date(2000, i, 1), "MMM", { locale: ar })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">السنة</Label>
                              <Input
                                type="number"
                                min="1900"
                                max={new Date().getFullYear()}
                                value={formData.birthDate?.getFullYear() || ""}
                                onChange={(e) => {
                                  const year = parseInt(e.target.value);
                                  if (year >= 1900 && year <= new Date().getFullYear()) {
                                    const currentDate = formData.birthDate || new Date(1990, 0, 1);
                                    const newDate = new Date(year, currentDate.getMonth(), currentDate.getDate());
                                    setFormData({...formData, birthDate: newDate});
                                  }
                                }}
                                placeholder="1990"
                                className="text-center font-mono text-lg h-12"
                              />
                            </div>
                          </div>
                          
                          {/* Quick Year Selection */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">اختيار سريع للسنة</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {[1950, 1970, 1990, 2000].map(year => (
                                <Button
                                  key={year}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentDate = formData.birthDate || new Date(year, 0, 1);
                                    const newDate = new Date(year, currentDate.getMonth(), currentDate.getDate());
                                    setFormData({...formData, birthDate: newDate});
                                  }}
                                  className="h-8 text-xs"
                                >
                                  {year}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Mini Calendar for final selection */}
                          {formData.birthDate && (
                            <div className="border-t pt-4">
                              <Label className="text-sm font-medium mb-3 block">اختر اليوم بدقة</Label>
                              <Calendar
                                mode="single"
                                selected={formData.birthDate}
                                onSelect={(date) => {
                                  setFormData({...formData, birthDate: date});
                                }}
                                month={formData.birthDate}
                                className="pointer-events-auto w-full"
                                classNames={{
                                  table: "w-full",
                                  head_cell: "text-xs w-8 font-normal text-muted-foreground",
                                  cell: "text-center text-sm p-0 relative",
                                  day: "h-8 w-8 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md",
                                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                  day_today: "bg-accent text-accent-foreground",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      الحالة
                    </Label>
                    <Select value={formData.isAlive ? "alive" : "deceased"} onValueChange={(value) => setFormData({...formData, isAlive: value === "alive"})}>
                      <SelectTrigger className="h-12 text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                        <SelectItem value="alive" className="text-lg py-4 rounded-lg">💚 على قيد الحياة</SelectItem>
                        <SelectItem value="deceased" className="text-lg py-4 rounded-lg">🕊️ متوفى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {!formData.isAlive && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                        <Skull className="h-4 w-4 text-primary" />
                        تاريخ الوفاة
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-12 justify-start text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input",
                              !formData.deathDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.deathDate ? format(formData.deathDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl" align="start" side="bottom" sideOffset={4}>
                          <div className="p-6 space-y-6 min-w-[320px]">
                            <div className="text-center">
                              <h4 className="font-semibold text-foreground mb-1">اختر تاريخ الوفاة</h4>
                              <p className="text-sm text-muted-foreground">يمكنك كتابة التاريخ مباشرة أو استخدام القوائم</p>
                            </div>
                            
                            {/* Direct Input Fields */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">اليوم</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="31"
                                  value={formData.deathDate?.getDate() || ""}
                                  onChange={(e) => {
                                    const day = parseInt(e.target.value);
                                    if (day >= 1 && day <= 31) {
                                      const currentDate = formData.deathDate || new Date();
                                      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                      setFormData({...formData, deathDate: newDate});
                                    }
                                  }}
                                  placeholder="01"
                                  className="text-center font-mono text-lg h-12"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">الشهر</Label>
                                <Select 
                                  value={formData.deathDate?.getMonth()?.toString() || ""} 
                                  onValueChange={(month) => {
                                    const currentDate = formData.deathDate || new Date();
                                    const newDate = new Date(currentDate.getFullYear(), parseInt(month), currentDate.getDate());
                                    setFormData({...formData, deathDate: newDate});
                                  }}
                                >
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="--" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {Array.from({ length: 12 }, (_, i) => (
                                      <SelectItem key={i} value={i.toString()}>
                                        {format(new Date(2000, i, 1), "MMM", { locale: ar })}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">السنة</Label>
                                <Input
                                  type="number"
                                  min="1900"
                                  max={new Date().getFullYear()}
                                  value={formData.deathDate?.getFullYear() || ""}
                                  onChange={(e) => {
                                    const year = parseInt(e.target.value);
                                    if (year >= 1900 && year <= new Date().getFullYear()) {
                                      const currentDate = formData.deathDate || new Date();
                                      const newDate = new Date(year, currentDate.getMonth(), currentDate.getDate());
                                      setFormData({...formData, deathDate: newDate});
                                    }
                                  }}
                                  placeholder={new Date().getFullYear().toString()}
                                  className="text-center font-mono text-lg h-12"
                                />
                              </div>
                            </div>
                            
                            {/* Mini Calendar for final selection */}
                            {formData.deathDate && (
                              <div className="border-t pt-4">
                                <Label className="text-sm font-medium mb-3 block">اختر اليوم بدقة</Label>
                                <Calendar
                                  mode="single"
                                  selected={formData.deathDate}
                                  onSelect={(date) => {
                                    setFormData({...formData, deathDate: date});
                                  }}
                                  month={formData.deathDate}
                                  disabled={(date) => date > new Date() || (formData.birthDate && date < formData.birthDate)}
                                  className="pointer-events-auto w-full"
                                  classNames={{
                                    table: "w-full",
                                    head_cell: "text-xs w-8 font-normal text-muted-foreground",
                                    cell: "text-center text-sm p-0 relative",
                                    day: "h-8 w-8 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md",
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-accent text-accent-foreground",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    نبذة عن الشخص (اختياري)
                  </Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="اكتب نبذة مختصرة عن هذا الشخص..."
                    className="min-h-[100px] border-2 border-primary/20 focus:border-primary rounded-xl bg-input resize-none text-lg"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Spouse Management */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {formData.gender === "male" ? "إدارة الزوجات" : "إدارة الأزواج"}
                  </h3>
                  <p className="text-muted-foreground">
                    {formData.gender === "male" ? "أضف معلومات الزوجات لبناء العائلة" : "أضف معلومات الأزواج لبناء العائلة"}
                  </p>
                </div>

                {formData.gender === "male" ? (
                  <div className="space-y-6">
                    {/* Current Wives List */}
                    {wives.length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-lg font-semibold text-foreground">الزوجات المضافة ({wives.length})</Label>
                        <div className="grid gap-4">
                          {wives.map((wife, index) => (
                            <div key={wife.id} className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">👩</span>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground">{wife.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {wife.isAlive ? '🟢 على قيد الحياة' : '🔴 متوفاة'}
                                      {wife.birthDate && ` • وُلدت ${format(wife.birthDate, 'yyyy')}`}
                                    </p>
                                  </div>
                                </div>
                                {/* Only show delete button for new wives, not existing ones from database */}
                                {!wife.id.toString().includes('existing-') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setWives(wives.filter(w => w.id !== wife.id));
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add/Edit Wife Form - Only show if no existing wives or currently editing */}
                    {(!wives.some(w => w.id.toString().includes('existing-')) || editingWife) && (
                      <div className="bg-gradient-to-br from-card/50 to-accent/5 rounded-xl p-6 border border-primary/20">
                        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                          {editingWife ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                          {editingWife ? 'تعديل بيانات الزوجة' : 'إضافة زوجة جديدة'}
                        </h4>
                      
                      <div className="space-y-4">
                        {/* Name, Status and Birth Date Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-medium">اسم الزوجة</Label>
                            <Input
                              id="wife-name"
                              defaultValue={editingWife?.name || ""}
                              placeholder="أدخل اسم الزوجة"
                              className="h-12 text-lg border-2 border-primary/20 focus:border-primary rounded-xl"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">الحالة</Label>
                            <Select defaultValue={editingWife?.isAlive !== false ? "alive" : "deceased"}>
                              <SelectTrigger id="wife-status" className="h-12 text-lg border-2 border-primary/20 focus:border-primary rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="alive">💚 على قيد الحياة</SelectItem>
                                <SelectItem value="deceased">🕊️ متوفاة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">تاريخ الميلاد</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full h-12 justify-start text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editingWife?.birthDate ? format(editingWife.birthDate, "PPP", { locale: ar }) : "اختر تاريخ الميلاد"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                                <div className="p-4 space-y-4">
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">اليوم</Label>
                                      <Input
                                        id="wife-birth-day"
                                        type="number"
                                        min="1"
                                        max="31"
                                        defaultValue={editingWife?.birthDate?.getDate() || ""}
                                        placeholder="01"
                                        className="text-center font-mono text-lg h-12"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">الشهر</Label>
                                      <Select defaultValue={editingWife?.birthDate?.getMonth()?.toString() || ""}>
                                        <SelectTrigger id="wife-birth-month" className="h-12">
                                          <SelectValue placeholder="--" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i} value={i.toString()}>
                                              {format(new Date(2000, i, 1), "MMM", { locale: ar })}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">السنة</Label>
                                      <Input
                                        id="wife-birth-year"
                                        type="number"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        defaultValue={editingWife?.birthDate?.getFullYear() || ""}
                                        placeholder="1990"
                                        className="text-center font-mono text-lg h-12"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Death Date - Only shown if status is deceased */}
                        <div id="wife-death-section" className="space-y-2" style={{ display: 'none' }}>
                          <Label className="text-sm font-medium">تاريخ الوفاة</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-12 justify-start text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {editingWife?.deathDate ? format(editingWife.deathDate, "PPP", { locale: ar }) : "اختر تاريخ الوفاة"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">اليوم</Label>
                                    <Input
                                      id="wife-death-day"
                                      type="number"
                                      min="1"
                                      max="31"
                                      defaultValue={editingWife?.deathDate?.getDate() || ""}
                                      placeholder="01"
                                      className="text-center font-mono text-lg h-12"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">الشهر</Label>
                                    <Select defaultValue={editingWife?.deathDate?.getMonth()?.toString() || ""}>
                                      <SelectTrigger id="wife-death-month" className="h-12">
                                        <SelectValue placeholder="--" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                          <SelectItem key={i} value={i.toString()}>
                                            {format(new Date(2000, i, 1), "MMM", { locale: ar })}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">السنة</Label>
                                    <Input
                                      id="wife-death-year"
                                      type="number"
                                      min="1900"
                                      max={new Date().getFullYear()}
                                      defaultValue={editingWife?.deathDate?.getFullYear() || ""}
                                      placeholder={new Date().getFullYear().toString()}
                                      className="text-center font-mono text-lg h-12"
                                    />
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        {editingWife && (
                          <Button
                            variant="outline"
                            onClick={() => setEditingWife(null)}
                            className="flex-1 h-12 border-border hover:bg-muted rounded-xl"
                          >
                            إلغاء
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            const nameInput = document.getElementById('wife-name') as HTMLInputElement;
                            const statusSelect = document.querySelector('#wife-status [data-value]') as HTMLElement;
                            
                            if (nameInput?.value.trim()) {
                              // Get birth date
                              const birthDay = (document.getElementById('wife-birth-day') as HTMLInputElement)?.value;
                              const birthMonthSelect = document.getElementById('wife-birth-month') as HTMLSelectElement;
                              const birthYear = (document.getElementById('wife-birth-year') as HTMLInputElement)?.value;
                              
                              let birthDate = null;
                              if (birthDay && birthMonthSelect && birthYear) {
                                birthDate = new Date(parseInt(birthYear), parseInt(birthMonthSelect.value), parseInt(birthDay));
                              }
                              
                              // Get death date if deceased
                              const isAlive = statusSelect?.getAttribute('data-value') !== 'deceased';
                              let deathDate = null;
                              if (!isAlive) {
                                const deathDay = (document.getElementById('wife-death-day') as HTMLInputElement)?.value;
                                const deathMonthSelect = document.getElementById('wife-death-month') as HTMLSelectElement;
                                const deathYear = (document.getElementById('wife-death-year') as HTMLInputElement)?.value;
                                
                                if (deathDay && deathMonthSelect && deathYear) {
                                  deathDate = new Date(parseInt(deathYear), parseInt(deathMonthSelect.value), parseInt(deathDay));
                                }
                              }
                              
                              const wifeData = {
                                id: editingWife?.id || Date.now().toString(),
                                name: nameInput.value.trim(),
                                isAlive,
                                birthDate,
                                deathDate
                              };
                              
                              if (editingWife) {
                                // Update existing wife
                                setWives(wives.map(w => w.id === editingWife.id ? wifeData : w));
                                setEditingWife(null);
                              } else {
                                // Add new wife
                                setWives([...wives, wifeData]);
                              }
                              
                              // Reset form
                              nameInput.value = '';
                            }
                          }}
                          className={`${editingWife ? 'flex-1' : 'w-full'} h-12 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold`}
                        >
                          {editingWife ? (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              حفظ التعديلات
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              إضافة الزوجة
                            </>
                          )}
                        </Button>
                      </div>

                      {/* JavaScript for status change handling */}
                      <script
                        dangerouslySetInnerHTML={{
                          __html: `
                            document.addEventListener('DOMContentLoaded', function() {
                              const statusSelect = document.getElementById('wife-status');
                              const deathSection = document.getElementById('wife-death-section');
                              
                              if (statusSelect && deathSection) {
                                statusSelect.addEventListener('change', function(e) {
                                  if (e.target.value === 'deceased') {
                                    deathSection.style.display = 'block';
                                  } else {
                                    deathSection.style.display = 'none';
                                  }
                                });
                              }
                            });
                          `
                        }}
                      />
                      </div>
                    )}

                    {wives.length === 0 && (
                      <div className="text-center py-8 bg-muted/30 rounded-xl border-2 border-dashed border-muted-foreground/30">
                        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">لم يتم إضافة أي زوجات بعد</p>
                        <p className="text-sm text-muted-foreground mt-1">يمكنك تخطي هذه الخطوة والعودة لاحقاً</p>
                      </div>
                    )}
                  </div>
                ) : formData.gender === "female" ? (
                  <div className="space-y-6">
                    {/* Current Husbands List */}
                    {husbands.length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-lg font-semibold text-foreground">الأزواج المضافين ({husbands.length})</Label>
                        <div className="grid gap-4">
                          {husbands.map((husband, index) => (
                            <div key={husband.id} className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">👨</span>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground">{husband.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {husband.isAlive ? '🟢 على قيد الحياة' : '🔴 متوفى'}
                                      {husband.birthDate && ` • وُلد ${format(husband.birthDate, 'yyyy')}`}
                                    </p>
                                  </div>
                                </div>
                                {/* Only show delete button for new husbands, not existing ones from database */}
                                {!husband.id.toString().includes('existing-') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setHusbands(husbands.filter(h => h.id !== husband.id));
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add/Edit Husband Form - Only show if no existing husbands or currently editing */}
                    {(!husbands.some(h => h.id.toString().includes('existing-')) || editingHusband) && (
                      <div className="bg-gradient-to-br from-card/50 to-accent/5 rounded-xl p-6 border border-primary/20">
                        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                          {editingHusband ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                        {editingHusband ? 'تعديل بيانات الزوج' : 'إضافة زوج جديد'}
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Name, Status and Birth Date Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-medium">اسم الزوج</Label>
                            <Input
                              id="husband-name"
                              defaultValue={editingHusband?.name || ""}
                              placeholder="أدخل اسم الزوج"
                              className="h-12 text-lg border-2 border-primary/20 focus:border-primary rounded-xl"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">الحالة</Label>
                            <Select defaultValue={editingHusband?.isAlive !== false ? "alive" : "deceased"}>
                              <SelectTrigger id="husband-status" className="h-12 text-lg border-2 border-primary/20 focus:border-primary rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="alive">💚 على قيد الحياة</SelectItem>
                                <SelectItem value="deceased">🕊️ متوفى</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">تاريخ الميلاد</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full h-12 justify-start text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editingHusband?.birthDate ? format(editingHusband.birthDate, "PPP", { locale: ar }) : "اختر تاريخ الميلاد"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                                <div className="p-4 space-y-4">
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">اليوم</Label>
                                      <Input
                                        id="husband-birth-day"
                                        type="number"
                                        min="1"
                                        max="31"
                                        defaultValue={editingHusband?.birthDate?.getDate() || ""}
                                        placeholder="01"
                                        className="text-center font-mono text-lg h-12"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">الشهر</Label>
                                      <Select defaultValue={editingHusband?.birthDate?.getMonth()?.toString() || ""}>
                                        <SelectTrigger id="husband-birth-month" className="h-12">
                                          <SelectValue placeholder="--" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i} value={i.toString()}>
                                              {format(new Date(2000, i, 1), "MMM", { locale: ar })}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">السنة</Label>
                                      <Input
                                        id="husband-birth-year"
                                        type="number"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                        defaultValue={editingHusband?.birthDate?.getFullYear() || ""}
                                        placeholder="1990"
                                        className="text-center font-mono text-lg h-12"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {/* Death Date - Only shown if status is deceased */}
                        <div id="husband-death-section" className="space-y-2" style={{ display: 'none' }}>
                          <Label className="text-sm font-medium">تاريخ الوفاة</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-12 justify-start text-lg border-2 border-primary/20 focus:border-primary rounded-xl bg-input"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {editingHusband?.deathDate ? format(editingHusband.deathDate, "PPP", { locale: ar }) : "اختر تاريخ الوفاة"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-popover backdrop-blur-xl border-0 shadow-2xl rounded-xl">
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">اليوم</Label>
                                    <Input
                                      id="husband-death-day"
                                      type="number"
                                      min="1"
                                      max="31"
                                      defaultValue={editingHusband?.deathDate?.getDate() || ""}
                                      placeholder="01"
                                      className="text-center font-mono text-lg h-12"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">الشهر</Label>
                                    <Select defaultValue={editingHusband?.deathDate?.getMonth()?.toString() || ""}>
                                      <SelectTrigger id="husband-death-month" className="h-12">
                                        <SelectValue placeholder="--" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                          <SelectItem key={i} value={i.toString()}>
                                            {format(new Date(2000, i, 1), "MMM", { locale: ar })}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">السنة</Label>
                                    <Input
                                      id="husband-death-year"
                                      type="number"
                                      min="1900"
                                      max={new Date().getFullYear()}
                                      defaultValue={editingHusband?.deathDate?.getFullYear() || ""}
                                      placeholder={new Date().getFullYear().toString()}
                                      className="text-center font-mono text-lg h-12"
                                    />
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        {editingHusband && (
                          <Button
                            variant="outline"
                            onClick={() => setEditingHusband(null)}
                            className="flex-1 h-12 border-border hover:bg-muted rounded-xl"
                          >
                            إلغاء
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            const nameInput = document.getElementById('husband-name') as HTMLInputElement;
                            const statusSelect = document.querySelector('#husband-status [data-value]') as HTMLElement;
                            
                            if (nameInput?.value.trim()) {
                              // Get birth date
                              const birthDay = (document.getElementById('husband-birth-day') as HTMLInputElement)?.value;
                              const birthMonthSelect = document.getElementById('husband-birth-month') as HTMLSelectElement;
                              const birthYear = (document.getElementById('husband-birth-year') as HTMLInputElement)?.value;
                              
                              let birthDate = null;
                              if (birthDay && birthMonthSelect && birthYear) {
                                birthDate = new Date(parseInt(birthYear), parseInt(birthMonthSelect.value), parseInt(birthDay));
                              }
                              
                              // Get death date if deceased
                              const isAlive = statusSelect?.getAttribute('data-value') !== 'deceased';
                              let deathDate = null;
                              if (!isAlive) {
                                const deathDay = (document.getElementById('husband-death-day') as HTMLInputElement)?.value;
                                const deathMonthSelect = document.getElementById('husband-death-month') as HTMLSelectElement;
                                const deathYear = (document.getElementById('husband-death-year') as HTMLInputElement)?.value;
                                
                                if (deathDay && deathMonthSelect && deathYear) {
                                  deathDate = new Date(parseInt(deathYear), parseInt(deathMonthSelect.value), parseInt(deathDay));
                                }
                              }
                              
                              const husbandData = {
                                id: editingHusband?.id || Date.now().toString(),
                                name: nameInput.value.trim(),
                                isAlive,
                                birthDate,
                                deathDate
                              };
                              
                              if (editingHusband) {
                                // Update existing husband
                                setHusbands(husbands.map(h => h.id === editingHusband.id ? husbandData : h));
                                setEditingHusband(null);
                              } else {
                                // Add new husband
                                console.log('Adding new husband to state:', husbandData);
                                setHusbands([...husbands, husbandData]);
                                console.log('Updated husbands state will be:', [...husbands, husbandData]);
                              }
                              
                              // Reset form
                              nameInput.value = '';
                            }
                          }}
                          className={`${editingHusband ? 'flex-1' : 'w-full'} h-12 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold`}
                        >
                          {editingHusband ? (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              حفظ التعديلات
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              إضافة الزوج
                            </>
                          )}
                        </Button>
                      </div>

                      {/* JavaScript for status change handling */}
                      <script
                        dangerouslySetInnerHTML={{
                          __html: `
                            document.addEventListener('DOMContentLoaded', function() {
                              const statusSelect = document.getElementById('husband-status');
                              const deathSection = document.getElementById('husband-death-section');
                              
                              if (statusSelect && deathSection) {
                                statusSelect.addEventListener('change', function(e) {
                                  if (e.target.value === 'deceased') {
                                    deathSection.style.display = 'block';
                                  } else {
                                    deathSection.style.display = 'none';
                                  }
                                });
                              }
                            });
                          `
                        }}
                      />
                      </div>
                    )}

                    {husbands.length === 0 && (
                      <div className="text-center py-8 bg-muted/30 rounded-xl border-2 border-dashed border-muted-foreground/30">
                        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">لم يتم إضافة أي أزواج بعد</p>
                        <p className="text-sm text-muted-foreground mt-1">يمكنك تخطي هذه الخطوة والعودة لاحقاً</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-xl">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-foreground mb-2">خطوة إدارة الأزواج</h4>
                    <p className="text-muted-foreground">يمكنك إضافة معلومات الزوج/الزوجة حسب الجنس المحدد</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center pt-6 border-t border-primary/20 gap-4">
            <div className="flex gap-3 order-2 sm:order-1">
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep} className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl px-6 py-2">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  السابق
                </Button>
              )}
            </div>

            <div className="flex gap-3 order-1 sm:order-2">
              <Button variant="outline" onClick={() => setShowAddMember(false)} className="border-border hover:bg-muted rounded-xl px-6 py-2">
                إلغاء
              </Button>
              
              {currentStep < 3 ? (
                <Button onClick={nextStep} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-xl px-6 py-2">
                  التالي
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSaveMember} 
                  disabled={isSaving}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-xl px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="ml-2 h-4 w-4" />
                  {isSaving ? 'جاري الحفظ...' : (selectedMember ? 'حفظ التغييرات' : 'إضافة العضو')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Crop Modal */}
      <Dialog open={showImageCrop} onOpenChange={setShowImageCrop}>
        <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">قص الصورة</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              اضبط الصورة كما تريد وانقر على حفظ
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative h-96 w-full rounded-xl overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zoom" className="text-sm font-medium">تكبير</Label>
              <input
                id="zoom"
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setShowImageCrop(false)} className="rounded-xl">
              إلغاء
            </Button>
            <Button onClick={handleCropSave} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-xl">
              <Save className="mr-2 h-4 w-4" />
              حفظ الصورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GlobalFooter />
    </div>
  );
};

export default FamilyBuilder;