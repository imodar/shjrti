import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Upload, Search, Users, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";

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
      // البحث عن الآباء والأمهات للذكور
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
      // البحث عن الآباء والأمهات للإناث (نفس النظام)
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
      // جلب أعضاء العائلة
      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', familyId);

      if (membersError) throw membersError;
      setFamilyMembers(members || []);

      // جلب الزيجات
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">إضافة فرد جديد للعائلة</DialogTitle>
            <DialogDescription>
              قم بإدخال بيانات الفرد الجديد وربطه بوالديه
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="member-name">اسم الفرد *</Label>
                <Input
                  id="member-name"
                  value={memberData.name}
                  onChange={(e) => setMemberData({...memberData, name: e.target.value})}
                  placeholder="اسم الفرد"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="member-gender">الجنس *</Label>
                <Select value={memberData.gender} onValueChange={(value) => setMemberData({...memberData, gender: value})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Parent Selection */}
            <div>
              <Label htmlFor="parent-search">البحث عن الوالدين *</Label>
              <div className="mt-2 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="parent-search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث عن الأب والأم..."
                    className="pl-10"
                  />
                </div>
                
                <Select value={memberData.selectedParent || ""} onValueChange={(value) => setMemberData({...memberData, selectedParent: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الوالدين" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredParents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Birth Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>تاريخ الميلاد</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-2 justify-start text-left font-normal", !memberData.birthDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {memberData.birthDate ? format(memberData.birthDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={memberData.birthDate || undefined}
                      onSelect={(date) => setMemberData({...memberData, birthDate: date || null})}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  على قيد الحياة
                  <Switch
                    checked={memberData.isAlive}
                    onCheckedChange={(checked) => setMemberData({...memberData, isAlive: checked, deathDate: checked ? null : memberData.deathDate})}
                  />
                </Label>
              </div>
            </div>

            {/* Death Date */}
            {!memberData.isAlive && (
              <div>
                <Label>تاريخ الوفاة</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-2 justify-start text-left font-normal", !memberData.deathDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {memberData.deathDate ? format(memberData.deathDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={memberData.deathDate || undefined}
                      onSelect={(date) => setMemberData({...memberData, deathDate: date || null})}
                      disabled={(date) => date > new Date() || (memberData.birthDate && date < memberData.birthDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Biography */}
            <div>
              <Label htmlFor="member-bio">نبذة تعريفية</Label>
              <Textarea
                id="member-bio"
                value={memberData.bio}
                onChange={(e) => setMemberData({...memberData, bio: e.target.value})}
                placeholder="اكتب نبذة مختصرة عن الفرد..."
                className="mt-2"
                rows={3}
              />
            </div>

            {/* Image Upload */}
            <div>
              <Label>صورة الفرد</Label>
              <div className="mt-2 flex items-center gap-4">
                {memberData.croppedImage && (
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={memberData.croppedImage} />
                    <AvatarFallback>{memberData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('member-image')?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {memberData.croppedImage ? 'تغيير الصورة' : 'رفع صورة'}
                </Button>
                <input
                  id="member-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e)}
                  className="hidden"
                />
              </div>
            </div>

            {/* Marriage Status - only for males */}
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
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
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
                        <div key={wife.id} className="p-4 border rounded-lg bg-white dark:bg-gray-900/50 space-y-4 mb-4">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">الزوجة {index + 1}</h5>
                            {wives.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeWife(wife.id)}
                                className="gap-2 text-red-600 hover:text-red-700"
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
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !wife.birthDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {wife.birthDate ? format(wife.birthDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={wife.birthDate || undefined}
                                    onSelect={(date) => updateWife(wife.id, 'birthDate', date || null)}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
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
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !wife.deathDate && "text-muted-foreground")}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {wife.deathDate ? format(wife.deathDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={wife.deathDate || undefined}
                                      onSelect={(date) => updateWife(wife.id, 'deathDate', date || null)}
                                      disabled={(date) => date > new Date() || (wife.birthDate && date < wife.birthDate)}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
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

            {/* Female Marriage Status */}
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
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
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
                      <div className="p-4 border rounded-lg bg-white dark:bg-gray-900/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">بيانات الزوج</h5>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHusband(null)}
                            className="gap-2 text-red-600 hover:text-red-700"
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
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !husband.birthDate && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {husband.birthDate ? format(husband.birthDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={husband.birthDate || undefined}
                                  onSelect={(date) => updateHusband('birthDate', date || null)}
                                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
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
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !husband.deathDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {husband.deathDate ? format(husband.deathDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={husband.deathDate || undefined}
                                    onSelect={(date) => updateHusband('deathDate', date || null)}
                                    disabled={(date) => date > new Date() || (husband.birthDate && date < husband.birthDate)}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
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

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} className="gap-2">
              <Users className="h-4 w-4" />
              إضافة الفرد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>قص الصورة</DialogTitle>
            <DialogDescription>
              قم بتحديد الجزء المطلوب من الصورة
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-64">
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
            <Button onClick={handleCropSave}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};