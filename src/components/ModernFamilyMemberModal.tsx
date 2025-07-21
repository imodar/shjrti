import { useState, useEffect } from "react";
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
  husband: { id: string; name: string };
  wife: { id: string; name: string };
  marriage_date: string | null;
  is_active: boolean;
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

  console.log('🔥 ModernFamilyMemberModal render - isOpen:', isOpen, 'familyId:', familyId);

  useEffect(() => {
    if (isOpen && familyId) {
      fetchFamilyData();
    }
  }, [isOpen, familyId]);

  const fetchFamilyData = async () => {
    try {
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

      setFamilyMembers(transformedMembers);
      setMarriages([]); // Simplified for now

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
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/50 flex items-center justify-center p-4">
        {/* Modal Content */}
        <div className="bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 dark:from-gray-950 dark:via-green-950 dark:to-emerald-950 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
          
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 animate-pulse"></div>
          </div>

          {/* Floating Animated Icons */}
          <div className="absolute top-8 right-8 animate-pulse">
            <Heart className="h-8 w-8 text-green-400 opacity-60" />
          </div>
          <div className="absolute bottom-8 left-8 animate-bounce">
            <Users className="h-10 w-10 text-emerald-400 opacity-40" />
          </div>
          <div className="absolute top-1/2 left-4 animate-pulse">
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

              {/* Left Side: Step Progress */}
              <div className="flex items-center gap-4">
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
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            {step === 1 && (
              <div className="space-y-6">
                {/* Name Field */}
                <div className="group">
                  <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                    الاسم الكامل
                  </Label>
                  <div className="relative">
                    <Input
                      value={memberData.name}
                      onChange={(e) => setMemberData({...memberData, name: e.target.value})}
                      placeholder="أدخل الاسم الكامل"
                      className="h-14 text-lg border-2 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <UserPlus className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>

                {/* Gender Selection */}
                <div className="group">
                  <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                    الجنس
                  </Label>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Male button clicked');
                      setMemberData({...memberData, gender: "male"});
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer pointer-events-auto ${
                      memberData.gender === "male"
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-200'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50'
                    }`}
                  >
                    <span className="text-lg font-medium pointer-events-none">ذكر</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Female button clicked');
                      setMemberData({...memberData, gender: "female"});
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer pointer-events-auto ${
                      memberData.gender === "female"
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 ring-2 ring-pink-200'
                        : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50/50'
                    }`}
                  >
                    <span className="text-lg font-medium pointer-events-none">أنثى</span>
                  </button>
                  </div>
                </div>

                {/* Birth Date */}
                <div className="group">
                  <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                    تاريخ الميلاد
                  </Label>
                  <div className="relative z-[10001]">
                    <EnhancedDatePicker
                      value={memberData.birthDate}
                      onChange={(date) => setMemberData({...memberData, birthDate: date})}
                      placeholder="اختر تاريخ الميلاد"
                      className="h-14 text-lg border-2 border-green-200/50 dark:border-green-700/50 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>

                {/* Life Status */}
                <div className="group">
                  <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                    الحالة الحيوية
                  </Label>
                  <div className="relative z-[10001]">
                    <Select value={memberData.isAlive ? "alive" : "deceased"} onValueChange={(value) => setMemberData({...memberData, isAlive: value === "alive", deathDate: value === "alive" ? null : memberData.deathDate})}>
                      <SelectTrigger className="h-14 text-lg border-2 border-red-200/50 dark:border-red-700/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12">
                        <SelectValue placeholder="اختر الحالة الحيوية" />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                        <SelectItem value="alive" className="font-arabic text-lg">على قيد الحياة</SelectItem>
                        <SelectItem value="deceased" className="font-arabic text-lg">متوفى</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Heart className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>

                {/* Death Date (if deceased) */}
                {!memberData.isAlive && (
                  <div className="group">
                    <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-gray-500 to-slate-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                      تاريخ الوفاة
                    </Label>
                    <div className="relative z-[10001]">
                      <EnhancedDatePicker
                        value={memberData.deathDate}
                        onChange={(date) => setMemberData({...memberData, deathDate: date})}
                        placeholder="اختر تاريخ الوفاة"
                        className="h-14 text-lg border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg flex items-center justify-center">
                        <CalendarIcon className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Photo Upload */}
                <div className="group">
                  <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                    صورة شخصية (اختياري)
                  </Label>
                  <div className="flex items-center gap-4">
                    {memberData.croppedImage && (
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={memberData.croppedImage} />
                        <AvatarFallback>{memberData.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('member-image')?.click()}
                      className="gap-2 h-14 px-6 border-2 border-orange-200/50 dark:border-orange-700/50 hover:border-orange-500 transition-all duration-300"
                    >
                      <Upload className="h-4 w-4" />
                      {memberData.croppedImage ? 'تغيير الصورة' : 'رفع صورة'}
                    </Button>
                    <input
                      id="member-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMemberData({...memberData, image: file});
                          // Here you would handle image cropping
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Family Member Selection */}
                {familyMembers.length > 0 && (
                  <div className="group">
                    <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                      علاقة القرابة
                    </Label>
                    <div className="relative z-[10001]">
                      <Select value={memberData.selectedParent || "none"} onValueChange={(value) => setMemberData({...memberData, selectedParent: value === "none" ? null : value})}>
                        <SelectTrigger className="h-14 text-lg border-2 border-indigo-200/50 dark:border-indigo-700/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12">
                          <SelectValue placeholder="اختر أحد أفراد العائلة كوالد/والدة" />
                        </SelectTrigger>
                        <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                          <SelectItem value="none" className="font-arabic text-lg">لا يوجد قرابة مباشرة</SelectItem>
                          {familyMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id} className="font-arabic text-lg">
                              {member.name} ({member.gender === 'male' ? 'ذكر' : 'أنثى'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Users className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bio */}
                <div className="group">
                  <Label className="text-lg font-bold flex items-center gap-3 text-gray-700 dark:text-gray-300 mb-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                    نبذة شخصية (اختياري)
                  </Label>
                  <Textarea
                    value={memberData.bio}
                    onChange={(e) => setMemberData({...memberData, bio: e.target.value})}
                    placeholder="أضف نبذة شخصية عن الفرد..."
                    rows={4}
                    className="text-lg border-2 border-purple-200/50 dark:border-purple-700/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl resize-none"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    تفاصيل الزواج والشراكة
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    أضف معلومات الزواج إذا كان الفرد متزوجاً
                  </p>
                </div>

                {/* Marriage Status */}
                <div className="flex items-center justify-center gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <Label htmlFor="married" className="text-lg font-medium">
                    هل الفرد متزوج؟
                  </Label>
                  <Switch
                    id="married"
                    checked={memberData.isMarried}
                    onCheckedChange={(checked) => setMemberData({...memberData, isMarried: checked})}
                  />
                </div>

                {memberData.isMarried && (
                  <div className="space-y-4 p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-center text-gray-600 dark:text-gray-400">
                      سيتم إضافة تفاصيل الزواج في الإصدار المستقبلي
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/40 dark:border-gray-600/40 p-6 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
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
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-300"
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
    </>
  );
};