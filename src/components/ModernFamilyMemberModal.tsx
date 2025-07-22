import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TreePine, ArrowRight, ArrowLeft, Users, Heart, UserPlus, CheckCircle, Plus, CalendarIcon, Upload, X, Search, Trash2, Camera, User, Edit3, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

interface FamilyMember {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  isAlive: boolean;
  deathDate: string | null;
  bio: string;
  image: string | null;
  fatherId: string | null;
  motherId: string | null;
  isFounder: boolean;
  spouseId: string | null;
  relatedPersonId: string | null;
}

interface Marriage {
  id: string;
  husband: { id: string; name: string; is_founder?: boolean; father_id?: string; father_name?: string };
  wife: { id: string; name: string };
  marriage_date: string | null;
  is_active: boolean;
}

interface Wife {
  id: string;
  name: string;
  birthDate: Date | null;
  maritalStatus?: string;
  isAlive: boolean;
  deathDate: Date | null;
  image: File | null;
  imageUrl?: string;
  croppedImage: string | null;
}

interface Husband {
  id: string;
  name: string;
  birthDate: Date | null;
  maritalStatus?: string;
  isAlive: boolean;
  deathDate: Date | null;
  image: File | null;
  croppedImage: string | null;
}

interface ModernFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memberData: any) => void;
  familyId: string;
}

export const ModernFamilyMemberModal = ({ isOpen, onClose, onSubmit, familyId }: ModernFamilyMemberModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [currentWifeIndex, setCurrentWifeIndex] = useState<number | null>(null);
  const [isMainPersonImage, setIsMainPersonImage] = useState(false);
  const [isHusbandImage, setIsHusbandImage] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [filteredParents, setFilteredParents] = useState<any[]>([]);
  const [familyName, setFamilyName] = useState<string>("");
  const [relationshipPopoverOpen, setRelationshipPopoverOpen] = useState(false);

  const [memberData, setMemberData] = useState({
    name: "",
    gender: "male",
    birthDate: null as Date | null,
    isAlive: true,
    deathDate: null as Date | null,
    bio: "",
    image: null as File | null,
    croppedImage: null as string | null,
    selectedParent: null as string | null,
    isMarried: false,
    hasMultipleWives: false
  });

  const [wives, setWives] = useState<Wife[]>([]);
  const [husband, setHusband] = useState<Husband | null>(null);
  const [newWife, setNewWife] = useState({
    name: "",
    birthDate: "",
    maritalStatus: "married",
    isAlive: true,
    deathDate: "",
    imageUrl: ""
  });

  console.log('🔥 ModernFamilyMemberModal render - isOpen:', isOpen, 'familyId:', familyId);

  useEffect(() => {
    if (isOpen && familyId) {
      fetchFamilyData();
    }
  }, [isOpen, familyId]);

  const fetchFamilyData = async () => {
    try {
      // Fetch family name first
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('name')
        .eq('id', familyId)
        .single();

      if (familyError) throw familyError;
      setFamilyName(familyData?.name || "");

      const { data: membersData, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', familyId);

      if (membersError) throw membersError;

      // Transform the data to match our interface
      const transformedMembers = (membersData || []).map(member => ({
        id: member.id,
        name: member.name,
        gender: member.gender,
        birthDate: member.birth_date,
        isAlive: member.is_alive,
        deathDate: member.death_date,
        bio: member.biography || "",
        image: member.image_url,
        fatherId: member.father_id,
        motherId: member.mother_id,
        isFounder: member.is_founder,
        spouseId: member.spouse_id,
        relatedPersonId: member.related_person_id,
      }));

      // Fetch marriages data
      const { data: marriagesData, error: marriagesError } = await supabase
        .from('marriages')
        .select(`
          id,
          husband_id,
          wife_id,
          marriage_date,
          is_active,
          husband:family_tree_members!marriages_husband_id_fkey(id, name, is_founder, father_id),
          wife:family_tree_members!marriages_wife_id_fkey(id, name)
        `)
        .eq('family_id', familyId)
        .eq('is_active', true);

      if (marriagesError) throw marriagesError;

      // Transform marriages data and get father names for husbands
      const transformedMarriages = await Promise.all((marriagesData || []).map(async (marriage) => {
        let fatherName = "";
        if (marriage.husband?.father_id && !marriage.husband?.is_founder) {
          const { data: fatherData } = await supabase
            .from('family_tree_members')
            .select('name')
            .eq('id', marriage.husband.father_id)
            .single();
          fatherName = fatherData?.name || "";
        }

        return {
          id: marriage.id,
          husband: { 
            id: marriage.husband_id, 
            name: marriage.husband?.name || "",
            is_founder: marriage.husband?.is_founder || false,
            father_id: marriage.husband?.father_id || null,
            father_name: fatherName
          },
          wife: { id: marriage.wife_id, name: marriage.wife?.name || "" },
          marriage_date: marriage.marriage_date,
          is_active: marriage.is_active
        };
      }));

      setFamilyMembers(transformedMembers);
      setMarriages(transformedMarriages);

    } catch (error) {
      console.error('Error fetching family data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات العائلة",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!memberData.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الفرد",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      ...memberData,
      wives: memberData.gender === "male" && memberData.isMarried ? wives : [],
      husband: memberData.gender === "female" && memberData.isMarried ? husband : null
    };

    onSubmit(submitData);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setMemberData({
      name: "",
      gender: "male",
      birthDate: null,
      isAlive: true,
      deathDate: null,
      bio: "",
      image: null,
      croppedImage: null,
      selectedParent: null,
      isMarried: false,
      hasMultipleWives: false
    });
    setWives([]);
    setHusband(null);
    setNewWife({
      name: "",
      birthDate: "",
      maritalStatus: "married",
      isAlive: true,
      deathDate: "",
      imageUrl: ""
    });
    onClose();
  };

  const addWife = () => {
    if (newWife.name.trim()) {
      setWives([...wives, {
        id: crypto.randomUUID(),
        name: newWife.name,
        birthDate: newWife.birthDate ? new Date(newWife.birthDate) : null,
        maritalStatus: newWife.maritalStatus,
        isAlive: newWife.isAlive,
        deathDate: newWife.deathDate ? new Date(newWife.deathDate) : null,
        image: null,
        croppedImage: newWife.imageUrl || null
      }]);
      setNewWife({
        name: "",
        birthDate: "",
        maritalStatus: "married",
        isAlive: true,
        deathDate: "",
        imageUrl: ""
      });
    }
  };

  const removeWife = (index: number) => {
    setWives(wives.filter((_, i) => i !== index));
  };

  const editWife = (index: number) => {
    const wife = wives[index];
    setNewWife({
      name: wife.name,
      birthDate: wife.birthDate ? wife.birthDate.toISOString().split('T')[0] : "",
      maritalStatus: wife.maritalStatus || "married",
      isAlive: wife.isAlive,
      deathDate: wife.deathDate ? wife.deathDate.toISOString().split('T')[0] : "",
      imageUrl: wife.croppedImage || ""
    });
    removeWife(index);
  };

  const handleNewWifeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCropImage(imageUrl);
      setIsMainPersonImage(false);
      setIsHusbandImage(false);
      setCurrentWifeIndex(-1); // Use -1 to indicate new wife
      setShowCropModal(true);
    }
  };

  // Helper function to create cropped image
  const getCroppedImg = (imageSrc: string, pixelCrop: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
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

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      });
      image.addEventListener('error', reject);
      image.src = imageSrc;
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4">
        {/* Modal Content */}
        <div className="font-arabic bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 dark:from-gray-950 dark:via-green-950 dark:to-emerald-950 rounded-2xl shadow-2xl max-w-full sm:max-w-lg md:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col relative mx-2 sm:mx-0">
          
          {/* Floating Background Elements - Fixed positioning to avoid scroll interference */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
          </div>

          {/* Floating Animated Icons - Fixed positioning */}
          <div className="absolute top-8 right-8 animate-pulse pointer-events-none">
            <Heart className="h-8 w-8 text-green-400 opacity-60" />
          </div>
          <div className="absolute bottom-8 left-8 animate-bounce pointer-events-none">
            <Users className="h-10 w-10 text-emerald-400 opacity-40" />
          </div>
          <div className="absolute top-1/2 left-4 animate-pulse pointer-events-none">
            <TreePine className="h-6 w-6 text-green-400 opacity-60" />
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 z-50 w-8 h-8 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
          
          {/* Header Section */}
          <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border-b border-white/40 dark:border-gray-600/40 py-4 sm:py-6 px-4 sm:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 relative z-10">
              {/* Right Side: Icon + Title + Description */}
              <div className="flex items-center gap-2 sm:gap-4 order-2 sm:order-1">
                <div className="relative">
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xl border-2 border-white/30 dark:border-gray-700/30">
                    <TreePine className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  </div>
                </div>
                
                {/* Text Content */}
                <div className="text-center sm:text-right">{/* Always right-aligned on larger screens */}
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 font-arabic">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      إضافة فرد جديد للعائلة
                    </span>
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed font-arabic">
                    {step === 1 ? "املأ البيانات الأساسية للفرد الجديد" : `املأ تفاصيل الزواج لـ ${memberData.name}`}
                  </p>
                </div>
              </div>

              {/* Left Side: Step Progress */}
              <div className="flex items-center gap-2 sm:gap-4 mr-4 sm:mr-8 order-1 sm:order-2">
                <div className="flex flex-col items-center">
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    step >= 1 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border border-gray-200/50'
                  }`}>
                    <span className="relative z-10">1</span>
                  </div>
                  <span className="text-xs mt-2 text-gray-600 dark:text-gray-400 font-medium">البيانات</span>
                </div>

                <div className={`w-12 h-0.5 transition-all duration-500 ${
                  step >= 2 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-200/50'
                }`}></div>

                <div className="flex flex-col items-center">
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    step >= 2 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border border-gray-200/50'
                  }`}>
                    <span className="relative z-10">2</span>
                  </div>
                  <span className="text-xs mt-2 text-gray-600 dark:text-gray-400 font-medium">الزواج</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-4 sm:pb-8 mobile-smooth-scroll">
            {step === 1 && (
              <div className="space-y-2">
                {/* Personal Information Section */}
                <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-4 sm:p-6 border border-white/30 dark:border-gray-700/30">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                      {/* Name and Birth Date - Combined in one row */}
                      <div className="group sm:col-span-1 md:col-span-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                         {/* Name - 2/3 width */}
                          <div className="sm:col-span-2">
                            <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                              <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                              الاسم الأول *
                            </Label>
                           <div className="relative">
                             <Input
                               value={memberData.name}
                               onChange={(e) => setMemberData({...memberData, name: e.target.value})}
                               placeholder="أدخل الاسم الأول"
                               className="h-9 text-sm border-2 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic"
                             />
                             <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                               <UserPlus className="h-2 w-2 text-white" />
                             </div>
                           </div>
                         </div>

                         {/* Birth Date - 1/3 width */}
                         <div className="sm:col-span-1">
                           <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                             <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                             تاريخ الميلاد
                           </Label>
                           <div className="relative z-[10020]">
                             <EnhancedDatePicker
                               value={memberData.birthDate}
                               onChange={(date) => setMemberData({...memberData, birthDate: date})}
                               placeholder="اختر التاريخ"
                               className="h-9 text-sm border-2 border-green-200/50 dark:border-green-700/50 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic"
                             />
                             <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                               <CalendarIcon className="h-2 w-2 text-white" />
                             </div>
                           </div>
                         </div>
                          {/* Gender - 1/4 width */}
                          <div className="sm:col-span-1">
                             <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                               <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                               الجنس *
                             </Label>
                            <div className="relative">
                              <Select value={memberData.gender} onValueChange={(value) => setMemberData({...memberData, gender: value})}>
                                <SelectTrigger className="h-9 text-sm border-2 border-blue-200/50 dark:border-blue-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic">
                                  <SelectValue placeholder="الجنس" />
                                </SelectTrigger>
                                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                  <SelectItem value="male" className="font-arabic text-sm">ذكر</SelectItem>
                                  <SelectItem value="female" className="font-arabic text-sm">أنثى</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                <UserPlus className="h-2 w-2 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                 </div>

                {/* Family Relationship and Life Status Section */}
                <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl pb-6 px-6 border border-white/30 dark:border-gray-700/30">
                  
                     <div className="space-y-4">
                        {/* Family Relationship, Life Status, Death Date - All in one row */}
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Family Relationship - 1/2 width */}
                           <div className="group md:col-span-2">
                             <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                               <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                               علاقة القرابة (العائلة) *
                             </Label>
                             <div className="relative z-[10001]">
                               <Popover open={relationshipPopoverOpen} onOpenChange={setRelationshipPopoverOpen}>
                                 <PopoverTrigger asChild>
                                   <Button
                                     variant="outline"
                                     role="combobox"
                                     className="h-9 text-sm border-2 border-indigo-200/50 dark:border-indigo-700/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic w-full justify-between"
                                   >
                                     {memberData.selectedParent === null || memberData.selectedParent === "none" 
                                       ? "مؤسس العائلة" 
                                       : marriages.find(m => m.id === memberData.selectedParent)
                                         ? (() => {
                                             const marriage = marriages.find(m => m.id === memberData.selectedParent);
                                             return marriage?.husband.is_founder 
                                               ? `${marriage.husband.name} ${familyName} & ${marriage.wife.name}`
                                               : `${marriage.husband.name} ${marriage.husband.father_name} ${familyName} & ${marriage.wife.name}`;
                                           })()
                                         : "اختر علاقة القرابة مع العائلة"
                                     }
                                     <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                   </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="min-w-fit max-w-md p-0 bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                   <Command>
                                     <CommandInput placeholder="ابحث عن علاقة القرابة..." className="font-arabic" />
                                     <CommandList>
                                       <CommandEmpty className="font-arabic">لا توجد نتائج</CommandEmpty>
                                       <CommandGroup>
                                         <CommandItem
                                           value="none"
                                           onSelect={(value) => {
                                             setMemberData({...memberData, selectedParent: null});
                                             setRelationshipPopoverOpen(false);
                                           }}
                                           className="font-arabic"
                                         >
                                           مؤسس العائلة
                                         </CommandItem>
                                         {marriages.map((marriage) => (
                                           <CommandItem 
                                             key={marriage.id}
                                             value={marriage.id}
                                             onSelect={(value) => {
                                               setMemberData({...memberData, selectedParent: value});
                                               setRelationshipPopoverOpen(false);
                                             }}
                                             className="font-arabic whitespace-nowrap"
                                           >
                                             {marriage.husband.is_founder 
                                               ? `${marriage.husband.name} ${familyName} & ${marriage.wife.name}`
                                               : `${marriage.husband.name} ${marriage.husband.father_name} ${familyName} & ${marriage.wife.name}`}
                                           </CommandItem>
                                         ))}
                                       </CommandGroup>
                                     </CommandList>
                                   </Command>
                                 </PopoverContent>
                               </Popover>
                               <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                 <Users className="h-2 w-2 text-white" />
                               </div>
                             </div>
                          </div>

                        {/* Life Status - 1/4 width */}
                        <div className="group">
                          <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                            <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                            الحالة الحيوية
                          </Label>
                          <div className="relative z-[10001]">
                            <Select value={memberData.isAlive ? "alive" : "deceased"} onValueChange={(value) => setMemberData({...memberData, isAlive: value === "alive", deathDate: value === "alive" ? null : memberData.deathDate})}>
                              <SelectTrigger className="h-9 text-sm border-2 border-red-200/50 dark:border-red-700/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic">
                                <SelectValue placeholder="الحالة" />
                              </SelectTrigger>
                              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                <SelectItem value="alive" className="font-arabic text-sm">على قيد الحياة</SelectItem>
                                <SelectItem value="deceased" className="font-arabic text-sm">متوفى</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <Heart className="h-2 w-2 text-white" />
                            </div>
                          </div>
                        </div>

                         {/* Death Date - 1/4 width - only show if deceased */}
                         {!memberData.isAlive && (
                           <div className="group">
                             <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                               <div className="w-2 h-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                               تاريخ الوفاة
                             </Label>
                             <div className="relative z-[10001]">
                               <EnhancedDatePicker
                                 value={memberData.deathDate}
                                 onChange={(date) => setMemberData({...memberData, deathDate: date})}
                                 placeholder="تاريخ الوفاة"
                                 className="h-9 text-sm border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10"
                               />
                               <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg flex items-center justify-center">
                                 <CalendarIcon className="h-2 w-2 text-white" />
                               </div>
                             </div>
                           </div>
                         )}
                      </div>

                    </div>
                </div>

                {/* Media and Biography Section */}
                <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 border border-white/30 dark:border-gray-700/30">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* Photo Upload */}
                    <div className="group">
                       <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                        <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                        صورة شخصية
                      </Label>
                      <div className="border-2 border-dashed border-orange-200/50 dark:border-orange-700/50 rounded-xl p-4 bg-orange-50/30 dark:bg-orange-950/30 hover:border-orange-400 transition-all duration-300 h-[180px] flex flex-col">
                        <div className="flex flex-col items-center gap-3 flex-grow justify-center">
                          {memberData.croppedImage ? (
                            <div className="relative">
                              <Avatar className="w-20 h-20 border-4 border-orange-200 shadow-lg">
                                <AvatarImage src={memberData.croppedImage} />
                                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-orange-400 to-amber-400 text-white">
                                  {memberData.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <button
                                onClick={() => setMemberData({...memberData, image: null, croppedImage: null})}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800 to-amber-800 rounded-full flex items-center justify-center">
                              <Upload className="h-8 w-8 text-orange-600 dark:text-orange-300" />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('member-image')?.click()}
                              className="gap-2 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-all duration-300 text-xs px-3 py-2"
                            >
                              <Upload className="h-3 w-3" />
                              {memberData.croppedImage ? 'تغيير' : 'اختيار'}
                            </Button>
                            {memberData.croppedImage && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setMemberData({...memberData, image: null, croppedImage: null})}
                                className="gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-300 text-xs px-3 py-2"
                              >
                                <Trash2 className="h-3 w-3" />
                                حذف
                              </Button>
                            )}
                          </div>
                          <input
                            id="member-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const imageUrl = URL.createObjectURL(file);
                                setCropImage(imageUrl);
                                setIsMainPersonImage(true);
                                setShowCropModal(true);
                                setMemberData({...memberData, image: file});
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="lg:col-span-3 group">
                      <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                        نبذة شخصية
                      </Label>
                       <Textarea
                         value={memberData.bio}
                         onChange={(e) => setMemberData({...memberData, bio: e.target.value})}
                         placeholder="أضف نبذة شخصية عن الفرد..."
                         className="text-sm border-2 border-purple-200/50 dark:border-purple-700/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl resize-none h-[180px] font-arabic"
                       />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">

                <div className="space-y-6">
                  {memberData.gender === "male" && (
                      <div className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-900/30 rounded-2xl p-4 md:p-6 border border-pink-200/50 dark:border-pink-800/30 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                          {/* Add Wife Section - 2/3 width */}
                          <div className="w-full md:col-span-2">
                            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-pink-200/50 dark:border-pink-800/30 rounded-xl p-6 shadow-md">
                              <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                                  <Heart className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300">إضافة زوجة</h4>
                              </div>
                              
                              <div className="space-y-4">
                                {/* Name and Birth Date - Combined in one row */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {/* Name - 2/3 width */}
                                   <div className="sm:col-span-2">
                                     <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                       <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                       الاسم *
                                     </Label>
                                     <div className="relative">
                                       <Input
                                         value={newWife.name}
                                         onChange={(e) => setNewWife({...newWife, name: e.target.value})}
                                         className="h-9 text-sm border-2 border-pink-200/50 dark:border-pink-700/50 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic"
                                         placeholder="اسم الزوجة"
                                       />
                                       <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                                         <Heart className="h-2 w-2 text-white" />
                                       </div>
                                     </div>
                                   </div>

                                  {/* Birth Date - 1/3 width */}
                                   <div className="sm:col-span-1">
                                     <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                       <div className="w-2 h-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                       تاريخ الميلاد
                                     </Label>
                                     <div className="relative z-[10001]">
                                       <EnhancedDatePicker
                                         value={newWife.birthDate ? new Date(newWife.birthDate) : null}
                                         onChange={(date) => setNewWife({...newWife, birthDate: date ? date.toISOString().split('T')[0] : ''})}
                                         placeholder="اختر التاريخ"
                                         className="h-9 text-sm border-2 border-rose-200/50 dark:border-rose-700/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic"
                                       />
                                       <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                                         <CalendarIcon className="h-2 w-2 text-white" />
                                       </div>
                                     </div>
                                   </div>
                                </div>

                                  {/* Marital Status, Life Status and Death Date - Combined in one row */}
                                  <div className="space-y-4">
                                    {/* Marital Status, Alive Status and Death Date - Combined in one row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                      {/* Marital Status */}
                                      <div>
                                        <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                          الحالة الاجتماعية
                                        </Label>
                                        <div className="relative z-[10001]">
                                          <Select value={newWife.maritalStatus || "married"} onValueChange={(value) => setNewWife({...newWife, maritalStatus: value})}>
                                            <SelectTrigger className="h-9 text-sm border-2 border-purple-200/50 dark:border-purple-700/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic">
                                              <SelectValue placeholder="اختر الحالة الاجتماعية" />
                                            </SelectTrigger>
                                             <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                               <SelectItem value="married" className="font-arabic text-sm">متزوج</SelectItem>
                                               <SelectItem value="divorced" className="font-arabic text-sm">مطلق</SelectItem>
                                             </SelectContent>
                                          </Select>
                                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                                            <Heart className="h-2 w-2 text-white" />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Alive Status */}
                                      <div>
                                        <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                          الحالة الحيوية
                                        </Label>
                                        <div className="relative z-[10001]">
                                          <Select value={newWife.isAlive ? "alive" : "deceased"} onValueChange={(value) => setNewWife({...newWife, isAlive: value === "alive", deathDate: value === "alive" ? "" : newWife.deathDate})}>
                                            <SelectTrigger className="h-9 text-sm border-2 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic">
                                              <SelectValue placeholder="الحالة" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                              <SelectItem value="alive" className="font-arabic text-sm">على قيد الحياة</SelectItem>
                                              <SelectItem value="deceased" className="font-arabic text-sm">متوفى</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                                            <Heart className="h-2 w-2 text-white" />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Death Date - only show if deceased */}
                                      {!newWife.isAlive && (
                                        <div className="animate-fade-in">
                                          <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                            <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                            تاريخ الوفاة
                                          </Label>
                                          <div className="relative z-[10000]">
                                            <EnhancedDatePicker
                                              value={newWife.deathDate ? new Date(newWife.deathDate) : null}
                                              onChange={(date) => setNewWife({...newWife, deathDate: date ? date.toISOString().split('T')[0] : ''})}
                                              placeholder="اختر تاريخ الوفاة"
                                              className="h-9 text-sm border-2 border-red-200/50 dark:border-red-700/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                                              <CalendarIcon className="h-2 w-2 text-white" />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                <div>
                                  <label className="block text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
                                    الصورة الشخصية
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleNewWifeImageSelect(e)}
                                    className="hidden"
                                    id="new-wife-image"
                                  />
                                  
                                  {newWife.imageUrl ? (
                                    <div className="flex items-center space-x-3 p-3 bg-pink-50/50 dark:bg-pink-950/30 rounded-lg border border-pink-200/30 dark:border-pink-800/30">
                                      <img
                                        src={newWife.imageUrl}
                                        alt="New Wife"
                                        className="w-16 h-16 rounded-full object-cover border-2 border-pink-300"
                                      />
                                       <div className="flex flex-col space-y-1">
                                         <Button
                                           type="button"
                                           variant="outline"
                                           size="sm"
                                           onClick={() => document.getElementById('new-wife-image')?.click()}
                                           className="border-pink-300 text-pink-600 hover:bg-pink-50 h-7 text-xs px-2"
                                         >
                                           <Camera className="w-2 h-2 mr-1" />
                                           تغيير
                                         </Button>
                                         <Button
                                           type="button"
                                           variant="outline"
                                           size="sm"
                                           onClick={() => setNewWife({...newWife, imageUrl: ''})}
                                           className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs px-2"
                                         >
                                           <X className="w-2 h-2 mr-1" />
                                           إزالة
                                         </Button>
                                       </div>
                                    </div>
                                  ) : (
                                    <label
                                      htmlFor="new-wife-image"
                                      className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-pink-300 dark:border-pink-700 rounded-xl cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 dark:hover:bg-pink-900/20 transition-all duration-200 group"
                                    >
                                      <Camera className="w-6 h-6 text-pink-400 group-hover:text-pink-500 mb-1" />
                                      <span className="text-sm text-pink-600 dark:text-pink-400 text-center">إضافة صورة</span>
                                    </label>
                                  )}
                                </div>

                                <Button
                                  type="button"
                                  onClick={addWife}
                                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md"
                                  size="lg"
                                  disabled={!newWife.name.trim()}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  إضافة الزوجة
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Wives List - 1/3 width */}
                          <div className="w-full md:col-span-1">
                            <div className="flex items-center gap-2 mb-6">
                              <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <h4 className="text-lg font-semibold text-rose-700 dark:text-rose-300">الزوجات المضافة</h4>
                              {wives.length > 0 && (
                                <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs rounded-full font-medium">
                                  {wives.length}
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                              {wives.length === 0 ? (
                                <div className="text-center py-12 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-pink-200/50 dark:border-pink-800/30">
                                  <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-8 h-8 text-pink-400" />
                                  </div>
                                  <p className="text-pink-600 dark:text-pink-400 font-medium">لم يتم إضافة زوجات بعد</p>
                                  
                                </div>
                              ) : (
                                wives.map((wife, index) => (
                                  <div key={index} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-pink-200/50 dark:border-pink-800/30 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 group">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center space-x-4">
                                        {wife.croppedImage ? (
                                          <div className="relative">
                                            <img
                                              src={wife.croppedImage}
                                              alt={wife.name}
                                              className="w-14 h-14 rounded-full object-cover border-2 border-pink-300 shadow-sm"
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                                          </div>
                                        ) : (
                                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/50 dark:to-rose-900/50 flex items-center justify-center border-2 border-pink-300 dark:border-pink-700">
                                            <User className="w-7 h-7 text-pink-500" />
                                          </div>
                                        )}
                                        
                                        <div className="flex-1">
                                          <h5 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{wife.name}</h5>
                                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {wife.birthDate && (
                                              <span className="px-2 py-1 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full text-xs">
                                                المولد: {new Date(wife.birthDate).toLocaleDateString('ar')}
                                              </span>
                                            )}
                                            {!wife.isAlive && wife.deathDate && (
                                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                                                الوفاة: {new Date(wife.deathDate).toLocaleDateString('ar')}
                                              </span>
                                            )}
                                            {!wife.isAlive && !wife.deathDate && (
                                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                                                متوفية
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex space-x-reverse space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => editWife(index)}
                                          className="border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400 bg-pink-50/50 dark:bg-pink-950/20"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeWife(index)}
                                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 bg-red-50/50 dark:bg-red-950/20"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}


                    {memberData.gender === "female" && (
                      <div className="bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950/30 dark:to-blue-900/30 rounded-2xl p-4 md:p-6 border border-sky-200/50 dark:border-sky-800/30 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                          {/* Add Husband Section - 2/3 width */}
                          <div className="w-full md:col-span-2">
                             <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-sky-200/50 dark:border-sky-800/30 rounded-xl p-6 shadow-md">
                               <div className="flex items-center gap-2 mb-6">
                                 <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full flex items-center justify-center">
                                   <Heart className="w-4 h-4 text-white" />
                                 </div>
                                 <h4 className="text-lg font-semibold text-sky-700 dark:text-sky-300">إضافة زوج</h4>
                               </div>
                               
                               <div className="space-y-4">
                                 {/* Name and Birth Date - Combined in one row */}
                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                   {/* Name - 2/3 width */}
                                    <div className="sm:col-span-2">
                                      <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                        <div className="w-2 h-2 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                        الاسم *
                                      </Label>
                                      <div className="relative">
                                        <Input
                                          value={newWife.name}
                                          onChange={(e) => setNewWife({...newWife, name: e.target.value})}
                                          className="h-9 text-sm border-2 border-sky-200/50 dark:border-sky-700/50 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic"
                                          placeholder="اسم الزوج"
                                        />
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-sky-500 to-blue-500 rounded-lg flex items-center justify-center">
                                          <Heart className="h-2 w-2 text-white" />
                                        </div>
                                      </div>
                                    </div>

                                   {/* Birth Date - 1/3 width */}
                                    <div className="sm:col-span-1">
                                      <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                        تاريخ الميلاد
                                      </Label>
                                      <div className="relative z-[10001]">
                                        <EnhancedDatePicker
                                          value={newWife.birthDate ? new Date(newWife.birthDate) : null}
                                          onChange={(date) => setNewWife({...newWife, birthDate: date ? date.toISOString().split('T')[0] : ''})}
                                          placeholder="اختر التاريخ"
                                          className="h-9 text-sm border-2 border-blue-200/50 dark:border-blue-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic"
                                        />
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-blue-500 to-sky-500 rounded-lg flex items-center justify-center">
                                          <CalendarIcon className="h-2 w-2 text-white" />
                                        </div>
                                      </div>
                                    </div>
                                 </div>

                                   {/* Marital Status, Life Status and Death Date - Combined in one row */}
                                   <div className="space-y-4">
                                     {/* Marital Status, Alive Status and Death Date - Combined in one row */}
                                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                       {/* Marital Status */}
                                       <div>
                                         <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                           <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                           الحالة الاجتماعية
                                         </Label>
                                         <div className="relative z-[10001]">
                                           <Select value={newWife.maritalStatus || "married"} onValueChange={(value) => setNewWife({...newWife, maritalStatus: value})}>
                                             <SelectTrigger className="h-9 text-sm border-2 border-indigo-200/50 dark:border-indigo-700/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic">
                                               <SelectValue placeholder="اختر الحالة الاجتماعية" />
                                             </SelectTrigger>
                                              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                                <SelectItem value="married" className="font-arabic text-sm">متزوج</SelectItem>
                                                <SelectItem value="divorced" className="font-arabic text-sm">مطلق</SelectItem>
                                              </SelectContent>
                                           </Select>
                                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                             <Heart className="h-2 w-2 text-white" />
                                           </div>
                                         </div>
                                       </div>

                                       {/* Alive Status */}
                                       <div>
                                         <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                           <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                           الحالة الحيوية
                                         </Label>
                                         <div className="relative z-[10001]">
                                           <Select value={newWife.isAlive ? "alive" : "deceased"} onValueChange={(value) => setNewWife({...newWife, isAlive: value === "alive", deathDate: value === "alive" ? "" : newWife.deathDate})}>
                                             <SelectTrigger className="h-9 text-sm border-2 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic">
                                               <SelectValue placeholder="الحالة" />
                                             </SelectTrigger>
                                             <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                               <SelectItem value="alive" className="font-arabic text-sm">على قيد الحياة</SelectItem>
                                               <SelectItem value="deceased" className="font-arabic text-sm">متوفى</SelectItem>
                                             </SelectContent>
                                           </Select>
                                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                                             <Heart className="h-2 w-2 text-white" />
                                           </div>
                                         </div>
                                       </div>

                                       {/* Death Date - only show if deceased */}
                                       {!newWife.isAlive && (
                                         <div className="animate-fade-in">
                                           <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                                             <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                                             تاريخ الوفاة
                                           </Label>
                                           <div className="relative z-[10000]">
                                             <EnhancedDatePicker
                                               value={newWife.deathDate ? new Date(newWife.deathDate) : null}
                                               onChange={(date) => setNewWife({...newWife, deathDate: date ? date.toISOString().split('T')[0] : ''})}
                                               placeholder="اختر تاريخ الوفاة"
                                               className="h-9 text-sm border-2 border-red-200/50 dark:border-red-700/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-10 font-arabic"
                                             />
                                             <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                                               <CalendarIcon className="h-2 w-2 text-white" />
                                             </div>
                                           </div>
                                         </div>
                                       )}
                                     </div>
                                   </div>

                                 <div>
                                   <label className="block text-sm font-medium text-sky-700 dark:text-sky-300 mb-2">
                                     الصورة الشخصية
                                   </label>
                                   <input
                                     type="file"
                                     accept="image/*"
                                     onChange={(e) => handleNewWifeImageSelect(e)}
                                     className="hidden"
                                     id="new-husband-image"
                                   />
                                   
                                   {newWife.imageUrl ? (
                                     <div className="flex items-center space-x-3 p-3 bg-sky-50/50 dark:bg-sky-950/30 rounded-lg border border-sky-200/30 dark:border-sky-800/30">
                                       <img
                                         src={newWife.imageUrl}
                                         alt="New Husband"
                                         className="w-16 h-16 rounded-full object-cover border-2 border-sky-300"
                                       />
                                        <div className="flex flex-col space-y-1">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById('new-husband-image')?.click()}
                                            className="border-sky-300 text-sky-600 hover:bg-sky-50 h-7 text-xs px-2"
                                          >
                                            <Camera className="w-2 h-2 mr-1" />
                                            تغيير
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setNewWife({...newWife, imageUrl: ''})}
                                            className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs px-2"
                                          >
                                            <X className="w-2 h-2 mr-1" />
                                            إزالة
                                          </Button>
                                        </div>
                                     </div>
                                   ) : (
                                     <label
                                       htmlFor="new-husband-image"
                                       className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-sky-300 dark:border-sky-700 rounded-xl cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-all duration-200 group"
                                     >
                                       <Camera className="w-6 h-6 text-sky-400 group-hover:text-sky-500 mb-1" />
                                       <span className="text-sm text-sky-600 dark:text-sky-400 text-center">إضافة صورة</span>
                                     </label>
                                   )}
                                 </div>

                                 <Button
                                   type="button"
                                   onClick={addWife}
                                   className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white shadow-md"
                                   size="lg"
                                   disabled={!newWife.name.trim()}
                                 >
                                   <Plus className="w-4 h-4 mr-2" />
                                   إضافة الزوج
                                 </Button>
                               </div>
                             </div>
                          </div>

                          {/* Husbands List - 1/3 width */}
                          <div className="w-full md:col-span-1">
                            <div className="flex items-center gap-2 mb-6">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300">الأزواج المضافون</h4>
                              {wives.length > 0 && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full font-medium">
                                  {wives.length}
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                              {wives.length === 0 ? (
                                <div className="text-center py-8 px-4 bg-white/50 dark:bg-gray-900/50 rounded-xl border border-sky-200/30 dark:border-sky-800/30">
                                  <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-8 h-8 text-sky-400" />
                                  </div>
                                  <p className="text-sky-600 dark:text-sky-400 font-medium">لم يتم إضافة أزواج بعد</p>
                                </div>
                              ) : (
                                wives.map((wife, index) => (
                                  <div key={index} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-sky-200/50 dark:border-sky-800/30 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 group">
                                    <div className="flex items-start justify-between">
                                       <div className="flex items-center space-x-4">
                                         {wife.croppedImage ? (
                                           <div className="relative">
                                             <img
                                               src={wife.croppedImage}
                                               alt={wife.name}
                                               className="w-14 h-14 rounded-full object-cover border-2 border-sky-300 shadow-sm"
                                             />
                                             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                                           </div>
                                         ) : (
                                           <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/50 dark:to-blue-900/50 flex items-center justify-center border-2 border-sky-300 dark:border-sky-700">
                                             <User className="w-7 h-7 text-sky-500" />
                                           </div>
                                         )}
                                         <div className="flex-1">
                                           <h5 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{wife.name}</h5>
                                           <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                             {wife.birthDate && (
                                               <span className="px-2 py-1 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full text-xs">
                                                 المولد: {new Date(wife.birthDate).toLocaleDateString('ar')}
                                               </span>
                                             )}
                                             {!wife.isAlive && wife.deathDate && (
                                               <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                                                 الوفاة: {new Date(wife.deathDate).toLocaleDateString('ar')}
                                               </span>
                                             )}
                                             {!wife.isAlive && !wife.deathDate && (
                                               <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                                                 متوفى
                                               </span>
                                             )}
                                           </div>
                                         </div>
                                      </div>
                                       <div className="flex space-x-reverse space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                         <Button
                                           type="button"
                                           variant="outline"
                                           size="sm"
                                           onClick={() => editWife(index)}
                                           className="border-sky-300 text-sky-600 hover:bg-sky-50 hover:border-sky-400 bg-sky-50/50 dark:bg-sky-950/20"
                                         >
                                           <Edit3 className="w-4 h-4" />
                                         </Button>
                                         <Button
                                           type="button"
                                           variant="outline"
                                           size="sm"
                                           onClick={() => removeWife(index)}
                                           className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 bg-red-50/50 dark:bg-red-950/20"
                                         >
                                           <Trash2 className="w-4 h-4" />
                                         </Button>
                                       </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Original Female Section (to be replaced by above) */}
                    {false && memberData.gender === "female" && (
                      <div className="p-6 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">معلومات الزوج</h4>
                         <div className="space-y-4">
                           {/* Husband Name and Birth Date - Combined in one row */}
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             {/* Husband Name - 2/3 width */}
                             <div className="sm:col-span-2">
                               <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اسم الزوج</Label>
                               <Input
                                 value={husband?.name || ""}
                                 onChange={(e) => setHusband(husband ? {...husband, name: e.target.value} : {
                                   id: crypto.randomUUID(),
                                   name: e.target.value,
                                   birthDate: null,
                                   isAlive: true,
                                   deathDate: null,
                                   image: null,
                                   croppedImage: null,
                                   maritalStatus: "married"
                                 })}
                                 placeholder="اسم الزوج"
                                 className="h-12 sm:h-14 text-base sm:text-lg lg:text-xl border-2 border-gray-200/50 focus:border-emerald-500"
                               />
                             </div>

                             {/* Husband Birth Date - 1/3 width */}
                             <div>
                               <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاريخ الميلاد</Label>
                               <div className="relative z-[10001]">
                                 <EnhancedDatePicker
                                   value={husband?.birthDate || null}
                                   onChange={(date) => setHusband(husband ? {...husband, birthDate: date} : {
                                     id: crypto.randomUUID(),
                                     name: "",
                                     birthDate: date,
                                     isAlive: true,
                                     deathDate: null,
                                     image: null,
                                     croppedImage: null,
                                     maritalStatus: "married"
                                   })}
                                   placeholder="التاريخ"
                                   className="h-10 text-sm border-2 border-gray-200/50 focus:border-emerald-500"
                                 />
                               </div>
                             </div>
                           </div>

                           {/* Marital Status - Full width row */}
                           <div>
                             <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الحالة الاجتماعية</Label>
                             <div className="relative z-[10001]">
                               <Select value={husband?.maritalStatus || "married"} onValueChange={(value) => setHusband(husband ? {...husband, maritalStatus: value} : {
                                 id: crypto.randomUUID(),
                                 name: "",
                                 birthDate: null,
                                 isAlive: true,
                                 deathDate: null,
                                 image: null,
                                 croppedImage: null,
                                 maritalStatus: value
                               })}>
                                 <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg lg:text-xl border-2 border-gray-200/50 focus:border-emerald-500">
                                   <SelectValue placeholder="اختر الحالة الاجتماعية" />
                                 </SelectTrigger>
                                 <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                   <SelectItem value="single" className="font-arabic text-base sm:text-lg lg:text-xl">أعزب</SelectItem>
                                   <SelectItem value="married" className="font-arabic text-base sm:text-lg lg:text-xl">متزوج</SelectItem>
                                   <SelectItem value="divorced" className="font-arabic text-base sm:text-lg lg:text-xl">مطلق</SelectItem>
                                   <SelectItem value="widowed" className="font-arabic text-base sm:text-lg lg:text-xl">أرمل</SelectItem>
                                   <SelectItem value="engaged" className="font-arabic text-base sm:text-lg lg:text-xl">مخطوب</SelectItem>
                                 </SelectContent>
                               </Select>
                             </div>
                           </div>

                           {/* Life Status and Death Date - Combined in one row */}
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {/* Life Status */}
                             <div>
                               <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الحالة الحيوية</Label>
                               <div className="relative z-[10001]">
                                 <Select value={husband?.isAlive ? "alive" : "deceased"} onValueChange={(value) => setHusband(husband ? {...husband, isAlive: value === "alive", deathDate: value === "alive" ? null : husband.deathDate} : {
                                   id: crypto.randomUUID(),
                                   name: "",
                                   birthDate: null,
                                   isAlive: value === "alive",
                                   deathDate: null,
                                   image: null,
                                   croppedImage: null,
                                   maritalStatus: "married"
                                 })}>
                                   <SelectTrigger className="h-10 text-sm border-2 border-gray-200/50 focus:border-emerald-500">
                                     <SelectValue placeholder="الحالة" />
                                   </SelectTrigger>
                                   <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                                     <SelectItem value="alive" className="font-arabic text-sm">على قيد الحياة</SelectItem>
                                     <SelectItem value="deceased" className="font-arabic text-sm">متوفى</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                             </div>

                             {/* Death Date (if deceased) */}
                             {husband && !husband.isAlive && (
                               <div className="animate-fade-in">
                                 <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاريخ الوفاة</Label>
                                 <div className="relative z-[10000]">
                                   <EnhancedDatePicker
                                     value={husband?.deathDate || null}
                                     onChange={(date) => setHusband(husband ? {...husband, deathDate: date} : null)}
                                     placeholder="اختر تاريخ الوفاة"
                                     className="h-10 text-sm border-2 border-gray-200/50 focus:border-emerald-500"
                                   />
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-white/40 dark:border-gray-600/40 p-3 sm:p-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl mt-4">{/* moved up with mt-4 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {step > 1 && (
                <Button 
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                  className="gap-2 px-6 py-3 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ArrowRight className="h-4 w-4" />
                  السابق
                </Button>
              )}
              
              <div className="flex-1"></div>
              
              {step < 2 ? (
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!memberData.name.trim() || !memberData.gender || memberData.selectedParent === undefined}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-500 disabled:hover:to-teal-500"
                >
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-300"
                >
                  <TreePine className="h-4 w-4" />
                  إضافة الفرد
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && cropImage && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6">
            
            
            <div className="relative w-full h-64 mb-4">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(croppedArea, croppedAreaPixels) => {
                  setCroppedAreaPixels(croppedAreaPixels);
                }}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCropModal(false);
                  setCropImage(null);
                  setIsMainPersonImage(false);
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={async () => {
                  if (croppedAreaPixels && cropImage) {
                    try {
                      const croppedImage = await getCroppedImg(cropImage, croppedAreaPixels);
                      if (isMainPersonImage) {
                        setMemberData({...memberData, croppedImage});
                      } else if (currentWifeIndex !== null && currentWifeIndex >= 0) {
                        const newWives = [...wives];
                        newWives[currentWifeIndex].croppedImage = croppedImage;
                        setWives(newWives);
                      } else if (currentWifeIndex === -1) {
                        // Handle new wife image
                        setNewWife({...newWife, imageUrl: croppedImage});
                      }
                      setShowCropModal(false);
                      setCropImage(null);
                      setIsMainPersonImage(false);
                      setCurrentWifeIndex(null);
                    } catch (error) {
                      console.error('Error cropping image:', error);
                    }
                  }
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};