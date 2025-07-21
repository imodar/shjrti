import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TreePine, ArrowRight, ArrowLeft, Users, Heart, UserPlus, CheckCircle, Plus, CalendarIcon, Upload, X, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

interface FamilyMember {
  id: string;
  name: string;
  gender: string;
  fatherId?: string;
  motherId?: string;
  isFounder?: boolean;
  image_url?: string;
}

interface Marriage {
  id: string;
  husband_id: string;
  wife_id: string;
  husband?: FamilyMember;
  wife?: FamilyMember;
}

interface Wife {
  id: string;
  name: string;
  birthDate: Date | null;
  isAlive: boolean;
  deathDate: Date | null;
  image: File | null;
  croppedImage: string | null;
}

interface Husband {
  id: string;
  name: string;
  birthDate: Date | null;
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

  useEffect(() => {
    if (isOpen) {
      // Only fetch family data if we have a valid familyId (existing family)
      // For new families, we'll skip this step
      if (familyId && familyId.trim() !== '') {
        fetchFamilyData();
      } else {
        // For new families, start with empty data
        setFamilyMembers([]);
        setMarriages([]);
        setFilteredParents([]);
      }
    }
  }, [isOpen, familyId]);

  useEffect(() => {
    // For new families without existing marriages, show a message
    if (!familyId || familyId.trim() === '') {
      setFilteredParents([{
        id: 'new-family',
        display: 'هذا فرد مؤسس للعائلة الجديدة',
        fatherId: null,
        motherId: null
      }]);
      return;
    }

    // For existing families, filter based on gender and marriages
    if (memberData.gender === "male") {
      const parents = marriages.map(marriage => ({
        id: `${marriage.husband_id}-${marriage.wife_id}`,
        display: `${marriage.husband?.name || 'غير معروف'} - وزوجته ${marriage.wife?.name || 'غير معروفة'}`,
        fatherId: marriage.husband_id,
        motherId: marriage.wife_id
      })).filter(parent => 
        searchTerm === "" || 
        parent.display.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParents(parents);
    } else {
      const parents = marriages.map(marriage => ({
        id: `${marriage.husband_id}-${marriage.wife_id}`,
        display: `${marriage.husband?.name || 'غير معروف'} - وزوجته ${marriage.wife?.name || 'غير معروفة'}`,
        fatherId: marriage.husband_id,
        motherId: marriage.wife_id
      })).filter(parent => 
        searchTerm === "" || 
        parent.display.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParents(parents);
    }
  }, [marriages, searchTerm, memberData.gender, familyId]);

  const fetchFamilyData = async () => {
    if (!familyId || familyId.trim() === '') {
      console.warn('Invalid familyId provided to fetchFamilyData:', familyId);
      return;
    }
    
    try {
      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', familyId);

      if (membersError) throw membersError;
      setFamilyMembers(members || []);

      const { data: marriageData, error: marriageError } = await supabase
        .from('marriages')
        .select(`
          *,
          husband:family_tree_members!marriages_husband_id_fkey(*),
          wife:family_tree_members!marriages_wife_id_fkey(*)
        `)
        .eq('family_id', familyId)
        .eq('is_active', true);

      if (marriageError) throw marriageError;
      setMarriages(marriageData || []);

    } catch (error) {
      console.error('Error fetching family data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات العائلة",
        variant: "destructive"
      });
    }
  };

  const addWife = () => {
    const newWife: Wife = {
      id: Date.now().toString(),
      name: "",
      birthDate: null,
      isAlive: true,
      deathDate: null,
      image: null,
      croppedImage: null
    };
    setWives([...wives, newWife]);
  };

  const removeWife = (wifeId: string) => {
    setWives(wives.filter(wife => wife.id !== wifeId));
  };

  const updateWife = (wifeId: string, field: keyof Wife, value: any) => {
    setWives(wives.map(wife => 
      wife.id === wifeId ? { ...wife, [field]: value } : wife
    ));
  };

  const addHusband = () => {
    const newHusband: Husband = {
      id: Date.now().toString(),
      name: "",
      birthDate: null,
      isAlive: true,
      deathDate: null,
      image: null,
      croppedImage: null
    };
    setHusband(newHusband);
  };

  const updateHusband = (field: keyof Husband, value: any) => {
    if (husband) {
      setHusband({ ...husband, [field]: value });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, wifeIndex?: number, isHusband?: boolean) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentWifeIndex(typeof wifeIndex === 'number' ? wifeIndex : null);
      setIsMainPersonImage(typeof wifeIndex !== 'number' && !isHusband);
      setIsHusbandImage(!!isHusband);
      
      if (typeof wifeIndex === 'number') {
        updateWife(wives[wifeIndex].id, 'image', file);
      } else if (isHusband && husband) {
        updateHusband('image', file);
      } else {
        setMemberData({ ...memberData, image: file });
      }
      
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          setCropImage(e.target.result as string);
          setShowCropModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> => 
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    
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
    
    return new Promise(resolve => {
      canvas.toBlob(blob => {
        if (blob) {
          const reader = new FileReader();
          reader.addEventListener('load', () => resolve(reader.result as string));
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg');
    });
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (cropImage && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(cropImage, croppedAreaPixels);
        
        if (isMainPersonImage) {
          setMemberData(prev => ({ ...prev, croppedImage }));
        } else if (currentWifeIndex !== null) {
          updateWife(wives[currentWifeIndex].id, 'croppedImage', croppedImage);
        } else if (isHusbandImage && husband) {
          updateHusband('croppedImage', croppedImage);
        }
        
        setShowCropModal(false);
        setCropImage(null);
        setCurrentWifeIndex(null);
        setIsMainPersonImage(false);
        setIsHusbandImage(false);
        
        toast({
          title: "تم حفظ الصورة",
          description: "تم قص الصورة وحفظها بنجاح"
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء قص الصورة",
          variant: "destructive"
        });
      }
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

    if (!memberData.selectedParent && (!familyId || familyId.trim() === '')) {
      // For new families, auto-select the founder option
      setMemberData(prev => ({...prev, selectedParent: 'new-family'}));
    } else if (!memberData.selectedParent && familyId && familyId.trim() !== '') {
      toast({
        title: "خطأ",
        description: "يرجى اختيار الوالدين",
        variant: "destructive"
      });
      return;
    }

    if (memberData.gender === "male" && memberData.isMarried && wives.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة بيانات الزوجة/الزوجات",
        variant: "destructive"
      });
      return;
    }

    if (memberData.gender === "female" && memberData.isMarried && !husband) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة بيانات الزوج",
        variant: "destructive"
      });
      return;
    }

    const selectedParent = filteredParents.find(p => p.id === memberData.selectedParent);
    
    const submitData = {
      ...memberData,
      fatherId: selectedParent?.fatherId,
      motherId: selectedParent?.motherId,
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
    setSearchTerm("");
    onClose();
  };

  const canProceedToStep2 = () => {
    return memberData.name.trim() && memberData.selectedParent;
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-3 md:col-span-2">
          <div className="group">
            <Label htmlFor="member-name" className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
              <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
              اسم الفرد *
            </Label>
            <div className="relative">
              <Input
                id="member-name"
                value={memberData.name}
                onChange={(e) => setMemberData({...memberData, name: e.target.value})}
                placeholder="مثال : أحمد محمد"
                className="h-14 text-lg placeholder:text-lg border-2 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <TreePine className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="group">
            <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
              <div className="w-3 h-3 bg-gradient-to-r from-teal-500 to-amber-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
              تاريخ الميلاد
            </Label>
            <div className="relative">
              <EnhancedDatePicker
                value={memberData.birthDate || undefined}
                onChange={(date) => setMemberData({...memberData, birthDate: date || null})}
                placeholder="اختر تاريخ"
                toYear={new Date().getFullYear()}
                fromYear={1900}
                disableFuture={true}
                className="h-14 text-lg border-2 border-teal-200/50 dark:border-teal-700/50 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-teal-500 to-amber-500 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="group">
            <Label htmlFor="member-gender" className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
              <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
              الجنس *
            </Label>
            <div className="relative">
              <Select value={memberData.gender} onValueChange={(value) => setMemberData({...memberData, gender: value})}>
                <SelectTrigger className="h-14 text-lg border-2 border-amber-200/50 dark:border-amber-700/50 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12">
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                  <SelectItem value="male" className="font-arabic text-lg">ذكر</SelectItem>
                  <SelectItem value="female" className="font-arabic text-lg">أنثى</SelectItem>
                </SelectContent>
              </Select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-amber-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Users className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Selection and Life Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-3 md:col-span-2">
          <div className="group">
            <Label htmlFor="parent-search" className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
              <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
              البحث عن الوالدين *
            </Label>
            <div className="relative">
              <Select value={memberData.selectedParent || ""} onValueChange={(value) => setMemberData({...memberData, selectedParent: value})}>
                <SelectTrigger className="h-14 text-lg border-2 border-blue-200/50 dark:border-blue-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12">
                  <SelectValue placeholder="ابحث واختر الوالدين..." />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                  <div className="relative p-2">
                    <Search className="absolute left-5 top-5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ابحث عن الأب والأم..."
                      className="pl-10 h-10 text-sm rounded-lg bg-background border border-input"
                    />
                  </div>
                  {filteredParents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id} className="font-arabic text-lg">
                      {parent.display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Search className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="group">
            <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
              <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
              الحالة الحيوية
            </Label>
            <div className="relative">
              <Select value={memberData.isAlive ? "alive" : "deceased"} onValueChange={(value) => setMemberData({...memberData, isAlive: value === "alive", deathDate: value === "alive" ? null : memberData.deathDate})}>
                <SelectTrigger className="h-14 text-lg border-2 border-red-200/50 dark:border-red-700/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12">
                  <SelectValue placeholder="اختر الحالة الحيوية" />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                  <SelectItem value="alive" className="font-arabic text-lg">على قيد الحياة</SelectItem>
                  <SelectItem value="deceased" className="font-arabic text-lg">متوفى</SelectItem>
                </SelectContent>
              </Select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Heart className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Death Date */}
        {!memberData.isAlive && (
          <div className="space-y-3">
            <div className="group">
              <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                <div className="w-3 h-3 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                تاريخ الوفاة
              </Label>
              <div className="relative">
                <EnhancedDatePicker
                  value={memberData.deathDate || undefined}
                  onChange={(date) => setMemberData({...memberData, deathDate: date || null})}
                  placeholder="اختر تاريخ"
                  toYear={new Date().getFullYear()}
                  fromYear={memberData.birthDate ? memberData.birthDate.getFullYear() : 1900}
                  disableFuture={true}
                  className="h-14 text-lg border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg flex items-center justify-center">
                  <X className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Biography */}
        <div className="space-y-3 md:col-span-2">
          <div className="group">
            <Label htmlFor="member-bio" className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
              نبذة تعريفية (اختياري)
            </Label>
            <div className="relative">
              <Textarea
                id="member-bio"
                value={memberData.bio}
                onChange={(e) => setMemberData({...memberData, bio: e.target.value})}
                placeholder="شارك قصة هذا الفرد، إنجازاته، أو أي تفاصيل مميزة تود الاحتفاظ بها..."
                className="min-h-[120px] text-lg placeholder:text-lg border-2 border-purple-200/50 dark:border-purple-700/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12"
                rows={4}
              />
              <div className="absolute right-4 top-4 w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <UserPlus className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Image Upload - Matching FamilyCreator Design */}
        <div className="space-y-3">
          <div className="group">
            <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
              <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
              صورة الفرد
            </Label>
            <div className="relative group">
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50/50 via-cyan-50/50 to-teal-50/50 dark:from-indigo-950/50 dark:via-cyan-950/50 dark:to-teal-950/50 border-2 border-dashed border-indigo-200/50 dark:border-indigo-700/50 rounded-xl hover:border-indigo-400/60 transition-all duration-300 hover:bg-gradient-to-br hover:from-indigo-100/60 hover:to-cyan-100/60 dark:hover:from-indigo-900/60 dark:hover:to-cyan-900/60 cursor-pointer min-h-[180px]"
                   onClick={() => document.getElementById('member-image')?.click()}>
                {memberData.croppedImage ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-indigo-200/60 dark:border-indigo-700/60 shadow-xl">
                        <AvatarImage src={memberData.croppedImage} />
                        <AvatarFallback className="bg-indigo-100/80 dark:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 text-xl font-bold">
                          {memberData.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                        <Upload className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 h-10 px-4 text-sm rounded-xl border-2 border-indigo-200/50 dark:border-indigo-700/50 hover:border-indigo-400/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/60 transition-all duration-300"
                    >
                      <Upload className="h-4 w-4" />
                      تغيير الصورة
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center border-2 border-indigo-300/40 dark:border-indigo-600/40">
                        <Upload className="h-10 w-10 text-indigo-500/80 dark:text-indigo-400/80" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-300">رفع صورة شخصية</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">اضغط لاختيار صورة من جهازك</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                id="member-image"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e)}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Marriage Status - Males */}
      {memberData.gender === "male" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Heart className="h-4 w-4 text-primary" />
            <Label>هل الفرد متزوج؟</Label>
            <Switch
              checked={memberData.isMarried}
              onCheckedChange={(checked) => {
                setMemberData({...memberData, isMarried: checked, hasMultipleWives: false});
                if (!checked) setWives([]);
              }}
            />
          </div>

          {memberData.isMarried && (
            <>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-primary" />
                <Label>هل لديه أكثر من زوجة؟</Label>
                <Switch
                  checked={memberData.hasMultipleWives}
                  onCheckedChange={(checked) => {
                    setMemberData({...memberData, hasMultipleWives: checked});
                    if (!checked && wives.length > 1) {
                      setWives(wives.slice(0, 1));
                    } else if (checked && wives.length === 0) {
                      addWife();
                    }
                  }}
                />
              </div>

              {/* Wives Section */}
              <div className="border rounded-lg p-4 bg-muted/30 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    بيانات الزوجات
                  </h4>
                  <Button onClick={addWife} size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground">
                    <UserPlus className="h-4 w-4" />
                    إضافة زوجة
                  </Button>
                </div>

                {wives.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">لم يتم إضافة أي زوجة بعد</p>
                    <Button onClick={addWife} size="sm" className="mt-2 gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground">
                      <UserPlus className="h-4 w-4" />
                      إضافة الزوجة الأولى
                    </Button>
                  </div>
                )}

                {wives.map((wife, index) => (
                  <div key={wife.id} className="p-4 border rounded-lg bg-card space-y-4 mb-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">الزوجة {index + 1}</h5>
                      {wives.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeWife(wife.id)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          حذف
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`wife-name-${wife.id}`} className="flex items-center gap-2">
                          <TreePine className="h-3 w-3 text-primary" />
                          اسم الزوجة *
                        </Label>
                        <Input
                          id={`wife-name-${wife.id}`}
                          value={wife.name}
                          onChange={(e) => updateWife(wife.id, 'name', e.target.value)}
                          placeholder="اسم الزوجة"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <CalendarIcon className="h-3 w-3 text-primary" />
                          تاريخ الميلاد
                        </Label>
                        <div className="mt-1">
                          <EnhancedDatePicker
                            value={wife.birthDate || undefined}
                            onChange={(date) => updateWife(wife.id, 'birthDate', date || null)}
                            placeholder="اختر التاريخ"
                            toYear={new Date().getFullYear()}
                            fromYear={1900}
                            disableFuture={true}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Heart className="h-3 w-3 text-primary" />
                          على قيد الحياة
                          <Switch
                            checked={wife.isAlive}
                            onCheckedChange={(checked) => updateWife(wife.id, 'isAlive', checked)}
                          />
                        </Label>
                      </div>

                      {!wife.isAlive && (
                          <div>
                            <Label className="flex items-center gap-2">
                              <X className="h-3 w-3 text-destructive" />
                              تاريخ الوفاة
                            </Label>
                          <div className="mt-1">
                            <EnhancedDatePicker
                              value={wife.deathDate || undefined}
                              onChange={(date) => updateWife(wife.id, 'deathDate', date || null)}
                              placeholder="اختر تاريخ الوفاة"
                              toYear={new Date().getFullYear()}
                              fromYear={wife.birthDate ? wife.birthDate.getFullYear() : 1900}
                              disableFuture={true}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Wife Image */}
                    <div>
                      <Label>صورة الزوجة</Label>
                      <div className="mt-2 flex items-center gap-4">
                        {wife.croppedImage && (
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={wife.croppedImage} />
                            <AvatarFallback>{wife.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`wife-image-${wife.id}`)?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-3 w-3" />
                          {wife.croppedImage ? 'تغيير' : 'رفع صورة'}
                        </Button>
                        <input
                          id={`wife-image-${wife.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, index)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Marriage Status - Females */}
      {memberData.gender === "female" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Heart className="h-4 w-4 text-primary" />
            <Label>هل الفرد متزوجة؟</Label>
            <Switch
              checked={memberData.isMarried}
              onCheckedChange={(checked) => setMemberData({...memberData, isMarried: checked})}
            />
          </div>
          {memberData.isMarried && (
            <div className="border rounded-lg p-4 bg-muted/30 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  بيانات الزوج
                </h4>
                {!husband && (
                  <Button onClick={addHusband} size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground">
                    <UserPlus className="h-4 w-4" />
                    إضافة بيانات الزوج
                  </Button>
                )}
              </div>

              {!husband ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">لم يتم إضافة بيانات الزوج بعد</p>
                  <Button onClick={addHusband} size="sm" className="mt-2 gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground">
                    <UserPlus className="h-4 w-4" />
                    إضافة بيانات الزوج
                  </Button>
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">بيانات الزوج</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHusband(null)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      حذف
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="husband-name" className="flex items-center gap-2">
                          <TreePine className="h-3 w-3 text-primary" />
                          اسم الزوج *
                        </Label>
                      <Input
                        id="husband-name"
                        value={husband.name}
                        onChange={(e) => updateHusband('name', e.target.value)}
                        placeholder="اسم الزوج"
                        className="mt-1"
                      />
                    </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <CalendarIcon className="h-3 w-3 text-primary" />
                          تاريخ الميلاد
                        </Label>
                      <div className="mt-1">
                        <EnhancedDatePicker
                          value={husband.birthDate || undefined}
                          onChange={(date) => updateHusband('birthDate', date || null)}
                          placeholder="اختر التاريخ"
                          toYear={new Date().getFullYear()}
                          fromYear={1900}
                          disableFuture={true}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-primary" />
                        على قيد الحياة
                        <Switch
                          checked={husband.isAlive}
                          onCheckedChange={(checked) => updateHusband('isAlive', checked)}
                        />
                      </Label>
                    </div>

                    {!husband.isAlive && (
                        <div>
                          <Label className="flex items-center gap-2">
                            <X className="h-3 w-3 text-destructive" />
                            تاريخ الوفاة
                          </Label>
                        <div className="mt-1">
                          <EnhancedDatePicker
                            value={husband.deathDate || undefined}
                            onChange={(date) => updateHusband('deathDate', date || null)}
                            placeholder="اختر تاريخ الوفاة"
                            toYear={new Date().getFullYear()}
                            fromYear={husband.birthDate ? husband.birthDate.getFullYear() : 1900}
                            disableFuture={true}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Husband Image */}
                  <div>
                    <Label>صورة الزوج</Label>
                    <div className="mt-2 flex items-center gap-4">
                      {husband.croppedImage && (
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={husband.croppedImage} />
                          <AvatarFallback>{husband.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('husband-image')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-3 w-3" />
                        {husband.croppedImage ? 'تغيير' : 'رفع صورة'}
                      </Button>
                      <input
                        id="husband-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, undefined, true)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 dark:from-gray-950 dark:via-green-950 dark:to-emerald-950 border-0 shadow-2xl rounded-2xl p-0 relative">
          {/* Floating Background Elements - Same as FamilyCreator */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
          </div>

          {/* Floating Animated Icons - Same as FamilyCreator */}
          <div className="absolute top-8 right-8 animate-pulse">
            <Heart className="h-8 w-8 text-green-400 opacity-60" />
          </div>
          <div className="absolute bottom-8 left-8 animate-bounce">
            <Users className="h-10 w-10 text-emerald-400 opacity-40" />
          </div>
          <div className="absolute top-1/2 left-4 animate-pulse">
            <TreePine className="h-6 w-6 text-green-400 opacity-60" />
          </div>
          
          {/* Header Section - Matching FamilyCreator style */}
          <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border-b border-white/40 dark:border-gray-600/40 py-6 px-8">
            <div className="flex items-center justify-between gap-8 relative z-10">
              {/* Right Side: Icon + Title + Description */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xl border-2 border-white/30 dark:border-gray-700/30">
                    <TreePine className="h-8 w-8 text-white drop-shadow-lg" />
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  </div>
                </div>
                
                {/* Text Content */}
                <div className="text-right">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      إضافة فرد جديد للعائلة
                    </span>
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                    {step === 1 ? "املأ البيانات الأساسية للفرد الجديد" : "املأ تفاصيل الزواج والشراكة"}
                  </p>
                </div>
              </div>

              {/* Left Side: Step Progress - Matching FamilyCreator */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    step >= 1 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border border-gray-200/50'
                  }`}>
                    <span className="relative z-10">1</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">البيانات الأساسية</span>
                </div>
                
                <div className={`w-8 h-2 rounded-full transition-all duration-700 ${
                  step >= 2 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-200/50 dark:bg-gray-700/50'
                }`}></div>
                
                <div className="flex flex-col items-center">
                  <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    step >= 2 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg scale-105' 
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border border-gray-200/50'
                  }`}>
                    <span className="relative z-10">2</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">الزواج والأسرة</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content - Matching FamilyCreator container style */}
          <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl m-6 shadow-2xl ring-1 ring-white/20 dark:ring-gray-500/20">
            <div className="p-8 overflow-y-auto max-h-[60vh]">
              {step === 1 ? renderStep1() : renderStep2()}
            </div>
          </div>

          {/* Footer - Matching FamilyCreator button style */}
          <div className="relative border-t border-white/40 dark:border-gray-600/40 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl p-6 flex flex-row gap-4 justify-between">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="px-6 bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
              >
                إلغاء
              </Button>
              {step === 2 && (
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)} 
                  className="gap-2 px-6 bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  السابق
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              {step === 1 ? (
                <Button 
                  onClick={() => setStep(2)} 
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canProceedToStep2()}
                >
                  التالي
                  <ArrowRight className="h-4 w-4" />
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
        </DialogContent>
      </Dialog>

      {/* Image Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-lg bg-card border-tree-primary/20">
          <DialogHeader>
            <DialogTitle className="text-tree-primary">قص الصورة</DialogTitle>
            <DialogDescription>
              قم بتحديد الجزء المطلوب من الصورة
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCropModal(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleCropSave}
              className="bg-gradient-to-r from-tree-primary to-tree-accent hover:from-tree-primary/90 hover:to-tree-accent/90"
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};