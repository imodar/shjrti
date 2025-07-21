import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Search, Users, Plus, Trash2, ArrowRight, ArrowLeft, X, Heart, CalendarIcon } from "lucide-react";
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
      fetchFamilyData();
    }
  }, [isOpen, familyId]);

  useEffect(() => {
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
  }, [marriages, searchTerm, memberData.gender]);

  const fetchFamilyData = async () => {
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

    if (!memberData.selectedParent) {
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
    <div className="space-y-6 p-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="member-name" className="text-sm font-medium text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            اسم الفرد *
          </Label>
          <Input
            id="member-name"
            value={memberData.name}
            onChange={(e) => setMemberData({...memberData, name: e.target.value})}
            placeholder="أدخل اسم الفرد"
            className="h-10 text-sm rounded-lg bg-background border border-input transition-all duration-300 focus:border-primary focus:ring-1 focus:ring-primary/20 hover:border-primary/50"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-green-500" />
            تاريخ الميلاد
          </Label>
          <EnhancedDatePicker
            value={memberData.birthDate || undefined}
            onChange={(date) => setMemberData({...memberData, birthDate: date || null})}
            placeholder="اختر تاريخ"
            toYear={new Date().getFullYear()}
            fromYear={1900}
            disableFuture={true}
            className="h-10 text-sm rounded-lg"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="member-gender" className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            الجنس *
          </Label>
          <Select value={memberData.gender} onValueChange={(value) => setMemberData({...memberData, gender: value})}>
            <SelectTrigger className="h-10 text-sm rounded-lg bg-background border border-input hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-300">
              <SelectValue placeholder="اختر الجنس" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
              <SelectItem value="male" className="font-arabic text-sm">ذكر</SelectItem>
              <SelectItem value="female" className="font-arabic text-sm">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Parent Selection and Life Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="parent-search" className="text-sm font-medium text-foreground flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            البحث عن الوالدين *
          </Label>
          <Select value={memberData.selectedParent || ""} onValueChange={(value) => setMemberData({...memberData, selectedParent: value})}>
            <SelectTrigger className="h-10 text-sm rounded-lg bg-background border border-input hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-300">
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
                <SelectItem key={parent.id} value={parent.id} className="font-arabic text-sm">
                  {parent.display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent" />
            الحالة الحيوية
          </Label>
          <Select value={memberData.isAlive ? "alive" : "deceased"} onValueChange={(value) => setMemberData({...memberData, isAlive: value === "alive", deathDate: value === "alive" ? null : memberData.deathDate})}>
            <SelectTrigger className="h-10 text-sm rounded-lg bg-background border border-input hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-300">
              <SelectValue placeholder="اختر الحالة الحيوية" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
              <SelectItem value="alive" className="font-arabic text-sm">على قيد الحياة</SelectItem>
              <SelectItem value="deceased" className="font-arabic text-sm">متوفى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Death Date */}
        {!memberData.isAlive && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <X className="h-4 w-4 text-red-500" />
              تاريخ الوفاة
            </Label>
            <EnhancedDatePicker
              value={memberData.deathDate || undefined}
              onChange={(date) => setMemberData({...memberData, deathDate: date || null})}
              placeholder="اختر تاريخ"
              toYear={new Date().getFullYear()}
              fromYear={memberData.birthDate ? memberData.birthDate.getFullYear() : 1900}
              disableFuture={true}
              className="h-10 text-sm rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Biography */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="member-bio" className="text-sm font-medium text-foreground">نبذة تعريفية</Label>
          <Textarea
            id="member-bio"
            value={memberData.bio}
            onChange={(e) => setMemberData({...memberData, bio: e.target.value})}
            placeholder="اكتب نبذة مختصرة عن الفرد..."
            className="min-h-32 text-sm rounded-lg bg-background border border-input transition-all duration-300 focus:border-primary focus:ring-1 focus:ring-primary/20 hover:border-primary/50"
            rows={4}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            صورة الفرد
          </Label>
          <div className="relative group">
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/20 rounded-xl hover:border-primary/40 transition-all duration-300 hover:bg-gradient-to-br hover:from-primary/10 hover:to-accent/10 cursor-pointer min-h-32"
                 onClick={() => document.getElementById('member-image')?.click()}>
              {memberData.croppedImage ? (
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-20 h-20 border-2 border-primary/30 shadow-lg">
                    <AvatarImage src={memberData.croppedImage} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {memberData.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 h-8 text-xs rounded-lg border hover:border-primary hover:bg-primary/5"
                  >
                    <Upload className="h-3 w-3" />
                    تغيير الصورة
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">رفع صورة</p>
                    <p className="text-xs text-muted-foreground mt-1">اضغط لاختيار صورة</p>
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
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Marriage Status - Males */}
      {memberData.gender === "male" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2">
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
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">بيانات الزوجات</h4>
                  <Button onClick={addWife} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة زوجة
                  </Button>
                </div>

                {wives.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">لم يتم إضافة أي زوجة بعد</p>
                    <Button onClick={addWife} size="sm" className="mt-2 gap-2">
                      <Plus className="h-4 w-4" />
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
                        <Label htmlFor={`wife-name-${wife.id}`}>اسم الزوجة *</Label>
                        <Input
                          id={`wife-name-${wife.id}`}
                          value={wife.name}
                          onChange={(e) => updateWife(wife.id, 'name', e.target.value)}
                          placeholder="اسم الزوجة"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>تاريخ الميلاد</Label>
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
                          على قيد الحياة
                          <Switch
                            checked={wife.isAlive}
                            onCheckedChange={(checked) => updateWife(wife.id, 'isAlive', checked)}
                          />
                        </Label>
                      </div>

                      {!wife.isAlive && (
                        <div>
                          <Label>تاريخ الوفاة</Label>
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
          <div className="flex items-center gap-2">
            <Label>هل الفرد متزوجة؟</Label>
            <Switch
              checked={memberData.isMarried}
              onCheckedChange={(checked) => setMemberData({...memberData, isMarried: checked})}
            />
          </div>
          {memberData.isMarried && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">بيانات الزوج</h4>
                {!husband && (
                  <Button onClick={addHusband} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة بيانات الزوج
                  </Button>
                )}
              </div>

              {!husband ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">لم يتم إضافة بيانات الزوج بعد</p>
                  <Button onClick={addHusband} size="sm" className="mt-2 gap-2">
                    <Plus className="h-4 w-4" />
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
                      <Label htmlFor="husband-name">اسم الزوج *</Label>
                      <Input
                        id="husband-name"
                        value={husband.name}
                        onChange={(e) => updateHusband('name', e.target.value)}
                        placeholder="اسم الزوج"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>تاريخ الميلاد</Label>
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
                        على قيد الحياة
                        <Switch
                          checked={husband.isAlive}
                          onCheckedChange={(checked) => updateHusband('isAlive', checked)}
                        />
                      </Label>
                    </div>

                    {!husband.isAlive && (
                      <div>
                        <Label>تاريخ الوفاة</Label>
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
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden bg-white dark:bg-gray-900 border-0 shadow-2xl rounded-2xl p-0">
          {/* Modern Header with Glass Effect */}
          <div className="relative bg-gradient-to-r from-primary via-primary/90 to-accent p-6 text-white overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-[#d97706] to-[#059669] rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 -left-8 w-16 h-16 bg-gradient-to-br from-[#059669] to-[#d97706] rounded-full animate-bounce"></div>
              <div className="absolute bottom-0 right-1/3 w-12 h-12 bg-gradient-to-br from-[#d97706] to-[#059669] rounded-full animate-ping"></div>
            </div>
            
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-xl font-bold flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">إضافة فرد جديد</div>
                    <div className="text-sm text-white/80 font-normal mt-1">
                      {step === 1 ? "البيانات الشخصية والعائلية" : "تفاصيل الزواج والأسرة"}
                    </div>
                  </div>
                </div>
                
                {/* Modern Progress Steps */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                      step >= 1 
                        ? "bg-white text-primary border-white shadow-lg" 
                        : "bg-white/10 text-white/60 border-white/20"
                    )}>
                      1
                    </div>
                    <div className={cn(
                      "w-8 h-1 rounded-full transition-all duration-300",
                      step >= 2 ? "bg-white" : "bg-white/20"
                    )}></div>
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                      step >= 2 
                        ? "bg-white text-primary border-white shadow-lg" 
                        : "bg-white/10 text-white/60 border-white/20"
                    )}>
                      2
                    </div>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">

            {step === 1 ? renderStep1() : renderStep2()}
          </div>

          <DialogFooter className="border-t bg-gray-50 dark:bg-gray-800 p-4 flex flex-row gap-3 justify-between">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="px-6"
              >
                إلغاء
              </Button>
              {step === 2 && (
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)} 
                  className="gap-2 px-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  السابق
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {step === 1 ? (
                <Button 
                  onClick={() => setStep(2)} 
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6"
                  disabled={!canProceedToStep2()}
                >
                  التالي
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6"
                >
                  <Users className="h-4 w-4" />
                  إضافة الفرد
                </Button>
              )}
            </div>
          </DialogFooter>
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