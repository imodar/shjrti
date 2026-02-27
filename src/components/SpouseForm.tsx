import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Check, ChevronsUpDown, Heart, UserPlus, CalendarIcon, Save, Plus, Upload, Image, Crop, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";
import Cropper from "react-easy-crop";

export interface SpouseData {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  isAlive: boolean;
  birthDate: Date | null;
  deathDate: Date | null;
  maritalStatus: string;
  isFamilyMember: boolean;
  existingFamilyMemberId: string;
  croppedImage: string | null;
  biography?: string;
  isSaved: boolean;
}

interface Marriage {
  id: string;
  husband_id: string;
  wife_id: string;
  is_active?: boolean;
  marital_status?: string;
}

interface SpouseFormProps {
  spouseType: 'husband' | 'wife';
  spouse: SpouseData;
  onSpouseChange: (spouse: SpouseData) => void;
  familyMembers: any[];
  selectedMember: any;
  commandOpen: boolean;
  onCommandOpenChange: (open: boolean) => void;
  familyStatus: string;
  onFamilyStatusChange: (status: string) => void;
  onSave: () => void;
  onAdd: () => void;
  onClose?: () => void;
  showForm: boolean;
  marriages?: Marriage[];
  familyId?: string;
}

export const SpouseForm: React.FC<SpouseFormProps> = ({
  spouseType,
  spouse,
  onSpouseChange,
  familyMembers,
  selectedMember,
  commandOpen,
  onCommandOpenChange,
  familyStatus,
  onFamilyStatusChange,
  onSave,
  onAdd,
  onClose,
  showForm,
  marriages = [],
  familyId
}) => {
  const { toast } = useToast();
  const { isImageUploadEnabled } = useImageUploadPermission(familyId);
  
  // Track original spouse data for change detection
  const [originalSpouse, setOriginalSpouse] = useState<SpouseData | null>(null);
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  // Initialize original spouse data when spouse prop changes
  useEffect(() => {
    if (spouse && spouse.isSaved) {
      // Only set original data if we don't have it yet, to avoid overwriting during edits
      if (!originalSpouse) {
        console.log('🔍 Setting originalSpouse for change detection:', { name: spouse.name, birthDate: spouse.birthDate, biography: spouse.biography });
        setOriginalSpouse({ ...spouse });
      }
    } else if (!spouse.isSaved) {
      setOriginalSpouse(null);
    }
  }, [spouse.isSaved, spouse.id, spouse.name]); // Include name to detect when spouse changes
  
  // Check if data has changed
  const hasChanges = originalSpouse && (
    originalSpouse.firstName !== spouse.firstName ||
    originalSpouse.lastName !== spouse.lastName ||
    (originalSpouse.maritalStatus || "married") !== (spouse.maritalStatus || "married") ||
    originalSpouse.isFamilyMember !== spouse.isFamilyMember ||
    originalSpouse.existingFamilyMemberId !== spouse.existingFamilyMemberId ||
    originalSpouse.birthDate?.getTime() !== spouse.birthDate?.getTime() ||
    originalSpouse.isAlive !== spouse.isAlive ||
    originalSpouse.deathDate?.getTime() !== spouse.deathDate?.getTime() ||
    originalSpouse.croppedImage !== spouse.croppedImage ||
    originalSpouse.biography !== spouse.biography
  );
  
  // Image handling functions
  const createCroppedImage = async (imageSrc: string, cropArea: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Unable to get canvas context'));
          return;
        }
        
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;
        
        ctx.drawImage(
          image,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height
        );
        
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Canvas to blob conversion failed'));
          }
        }, 'image/jpeg', 0.8);
      };
      image.src = imageSrc;
    });
  };
  
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCropComplete = async () => {
    if (selectedImage && croppedAreaPixels) {
      try {
        const croppedImage = await createCroppedImage(selectedImage, croppedAreaPixels);
        onSpouseChange({ ...spouse, croppedImage });
        setShowImageCrop(false);
        setSelectedImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        
        toast({
          title: "تم رفع الصورة",
          description: "تم تحديد صورة الزوج/الزوجة بنجاح",
          variant: "default"
        });
      } catch (error) {
        console.error('Crop error:', error);
        toast({
          title: "خطأ في قص الصورة",
          description: "حدث خطأ أثناء معالجة الصورة",
          variant: "destructive"
        });
      }
    }
  };
  
  const isWife = spouseType === 'wife';
  const spouseLabel = isWife ? 'الزوجة' : 'الزوج';
  const spouseGender = isWife ? 'female' : 'male';
  const addButtonText = isWife ? 'إضافة زوجة' : 'إضافة زوج';
  const addFormTitle = spouse.isSaved && spouse.name ? `تعديل ${spouse.name}` : (isWife ? 'إضافة زوجة جديدة' : 'إضافة زوج جديد');
  const saveButtonText = isWife ? 'حفظ بيانات الزوجة' : 'حفظ بيانات الزوج';
  
  // Color scheme based on spouse type
  const colorScheme = isWife ? {
    primary: 'from-pink-500 to-rose-500',
    background: 'from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-900/30',
    border: 'border-pink-200/50 dark:border-pink-800/30',
    gradient: 'from-pink-500 to-rose-500',
    textColor: 'text-pink-700 dark:text-pink-300'
  } : {
    primary: 'from-blue-500 to-sky-500',
    background: 'from-blue-50 to-sky-100 dark:from-blue-950/30 dark:to-sky-900/30',
    border: 'border-blue-200/50 dark:border-blue-800/30',
    gradient: 'from-blue-500 to-sky-500',
    textColor: 'text-blue-700 dark:text-blue-300'
  };

  const handleValidationAndSave = () => {
    // Enhanced validation logic
    const isValid = (
      familyStatus === 'yes' 
        ? spouse.existingFamilyMemberId && spouse.existingFamilyMemberId.trim() !== ''
        : spouse.firstName.trim() && spouse.lastName.trim()
    );

    if (!isValid) {
      const errorMessage = familyStatus === 'yes' 
        ? `يرجى اختيار ${spouseLabel} من قائمة أفراد العائلة`
        : `يرجى إكمال الاسم الأول والأخير ${isWife ? 'للزوجة' : 'للزوج'}`;
      
      toast({
        title: "خطأ في البيانات",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    onSave();
    
    toast({
      title: "تم الحفظ بنجاح",
      description: `تم حفظ بيانات ${spouseLabel} بنجاح`,
      variant: "default"
    });
  };

  if (!showForm) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className={cn(
          "w-full h-12 border-2 border-dashed transition-all duration-300 rounded-xl",
          isWife ? "border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30" : "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
        )}
      >
        <Plus className="h-5 w-5 mr-2" />
        {addButtonText}
      </Button>
    );
  }

  return (
    <div className={cn("bg-gradient-to-br rounded-2xl p-6 border shadow-lg w-full", colorScheme.background, colorScheme.border)}>
      <div className="flex items-center gap-2 mb-6">
        <div className={cn("w-8 h-8 bg-gradient-to-r rounded-full flex items-center justify-center", colorScheme.gradient)}>
          <UserPlus className="w-4 h-4 text-white" />
        </div>
        <h4 className={cn("text-lg font-semibold font-arabic", colorScheme.textColor)}>{addFormTitle}</h4>
      </div>

      <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-6 shadow-md">
        <div className="space-y-6">
          {/* Family Member Selection - Only show when adding new spouse, not when editing existing */}
          {!spouse.isSaved && (
            <div>
              <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-3 font-arabic">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg"></div>
                هل {spouseLabel} من أفراد العائلة ؟
              </Label>
              
              <div className="flex items-center gap-6 mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={`${spouseType}-family-yes`}
                    name={`${spouseType}-family`}
                    value="yes"
                    checked={familyStatus === 'yes'}
                    onChange={() => {
                      onFamilyStatusChange('yes');
                      onSpouseChange({ ...spouse, isFamilyMember: true });
                    }}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Label htmlFor={`${spouseType}-family-yes`} className="text-sm font-arabic">نعم</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={`${spouseType}-family-no`}
                    name={`${spouseType}-family`}
                    value="no"
                    checked={familyStatus === 'no'}
                    onChange={() => {
                      onFamilyStatusChange('no');
                      onSpouseChange({ ...spouse, isFamilyMember: false, existingFamilyMemberId: '' });
                    }}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Label htmlFor={`${spouseType}-family-no`} className="text-sm font-arabic">لا</Label>
                </div>
              </div>
            </div>
          )}

          {/* Show spouse type info when editing */}
          {spouse.isSaved && (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 bg-gradient-to-r rounded-full flex items-center justify-center", colorScheme.gradient)}>
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-arabic">
                      تعديل بيانات {spouseLabel}: {spouse.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-arabic">
                      {spouse.isFamilyMember ? 'من أفراد العائلة' : 'خارج العائلة'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Conditional rendering based on radio button selection or saved spouse type */}
          {(familyStatus === 'yes' || (spouse.isSaved && spouse.isFamilyMember)) ? (
            <>
              <p className="text-xs text-muted-foreground mb-3 font-arabic">
                يُسمح فقط باختيار {spouseLabel} من أفراد العائلة المسجلين
              </p>
              {/* Select Existing Family Member */}
              <div className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 font-arabic">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg"></div>
                  اختر {spouseLabel} من القائمة *
                </Label>
                
                {/* Helper function to build full genealogical name */}
                {(() => {
                  const buildFullMemberName = (member: any, members: any[]) => {
                    const firstName = member.first_name || member.firstName || member.name?.split(' ')[0] || '';
                    const lastName = member.last_name || member.lastName || '';
                    const father = members.find(m => m?.id === (member?.father_id ?? member?.fatherId));
                    const grandfather = father ? members.find(m => m?.id === (father?.father_id ?? father?.fatherId)) : null;
                    const isInternal = Boolean(father) || Boolean(member.is_founder);

                    if (isInternal && member.gender === 'female' && father) {
                      const fatherFirst = father.first_name || father.firstName || father.name?.split(' ')[0] || father.name;
                      if (grandfather) {
                        const grandFirst = grandfather.first_name || grandfather.firstName || grandfather.name?.split(' ')[0] || grandfather.name;
                        return lastName ? `${firstName} بنت ${fatherFirst} بن ${grandFirst} ${lastName}` : `${firstName} بنت ${fatherFirst} بن ${grandFirst}`;
                      }
                      return lastName ? `${firstName} بنت ${fatherFirst} ${lastName}` : `${firstName} بنت ${fatherFirst}`;
                    }
                    if (isInternal && member.gender === 'male' && father) {
                      const fatherFirst = father.first_name || father.firstName || father.name?.split(' ')[0] || father.name;
                      if (grandfather) {
                        const grandFirst = grandfather.first_name || grandfather.firstName || grandfather.name?.split(' ')[0] || grandfather.name;
                        return lastName ? `${firstName} ابن ${fatherFirst} ابن ${grandFirst} ${lastName}` : `${firstName} ابن ${fatherFirst} ابن ${grandFirst}`;
                      }
                      return lastName ? `${firstName} ابن ${fatherFirst} ${lastName}` : `${firstName} ابن ${fatherFirst}`;
                    }
                    
                    return lastName ? `${firstName} ${lastName}` : (member.name || firstName);
                  };

                  const selectedMember = familyMembers.find(m => m.id === spouse.existingFamilyMemberId);
                  const selectedLabel = selectedMember 
                    ? buildFullMemberName(selectedMember, familyMembers)
                    : (spouse.name || "اختر فرد من العائلة...");

                  return (
                    <Popover open={commandOpen} onOpenChange={onCommandOpenChange}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={commandOpen}
                          className="w-full justify-between h-11 text-sm border-2 border-blue-200/50 dark:border-blue-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl font-arabic"
                        >
                          {selectedLabel}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                        <Command>
                          <CommandInput placeholder="ابحث عن فرد..." className="h-9 font-arabic" />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground font-arabic">
                              لا توجد {isWife ? 'إناث' : 'ذكور'} متاحة للزواج.
                            </CommandEmpty>
                             <CommandGroup>
                               {familyMembers.filter(member => {
                                  // Filter by gender (males for husbands, females for wives)
                                  const hasValidGender = member.gender === spouseGender;
                                  // Exclude the member being edited
                                  const isNotSelf = member.id !== selectedMember?.id;
                                  
                                  // Check availability based on gender and marriage rules
                                  const isAvailable = (() => {
                                    if (member.gender === 'male') {
                                      // Men can have up to 4 active wives
                                      const activeWivesCount = marriages.filter(
                                        m => m.husband_id === member.id && m.is_active !== false
                                      ).length;
                                      return activeWivesCount < 4;
                                    } else {
                                      // Women can only have one active marriage at a time
                                      const hasActiveMarriage = marriages.some(
                                        m => m.wife_id === member.id && m.is_active !== false
                                      );
                                      return !hasActiveMarriage;
                                    }
                                  })();
                                  
                                  return hasValidGender && isNotSelf && isAvailable;
                                }).map((member) => {
                                 const displayName = buildFullMemberName(member, familyMembers);

                                 return (
                              <CommandItem
                                key={member.id}
                                value={member.name}
                                onSelect={() => {
                                  onSpouseChange({
                                    ...spouse,
                                    existingFamilyMemberId: member.id,
                                    firstName: member.first_name || '',
                                    lastName: member.last_name || '',
                                    name: displayName,
                                    birthDate: member.birth_date ? new Date(member.birth_date) : null,
                                    isAlive: member.is_alive ?? true,
                                    deathDate: member.death_date ? new Date(member.death_date) : null,
                                    maritalStatus: member.marital_status || 'single',
                                    croppedImage: member.image_url || null,
                                    biography: member.biography || ''
                                  });
                                  onCommandOpenChange(false);
                                }}
                                className="font-arabic"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    spouse.existingFamilyMemberId === member.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {displayName}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                   </PopoverContent>
                 </Popover>
                  );
                })()}
              </div>

              {/* Marital Status */}
              <div className="group">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                  الحالة الاجتماعية *
                </Label>
                <div className="relative">
                  <Select
                    value={spouse.maritalStatus || "married"}
                    onValueChange={(value) => onSpouseChange({ ...spouse, maritalStatus: value })}
                  >
                    <SelectTrigger className="h-11 text-sm border-2 border-purple-200/50 dark:border-purple-700/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic">
                      <SelectValue placeholder="اختر الحالة الاجتماعية" />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                      <SelectItem value="married" className="font-arabic text-sm">{isWife ? 'متزوجة' : 'متزوج'}</SelectItem>
                      <SelectItem value="divorced" className="font-arabic text-sm">{isWife ? 'مطلقة' : 'مطلق'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                    <Heart className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            </>
          ) : (familyStatus === 'no' || (spouse.isSaved && !spouse.isFamilyMember)) ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                    <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                    الاسم الأول *
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={spouse.firstName}
                      onChange={(e) => onSpouseChange({ 
                        ...spouse, 
                        firstName: e.target.value,
                        name: `${e.target.value} ${spouse.lastName}`.trim()
                      })}
                      placeholder={`أدخل الاسم الأول ${isWife ? 'للزوجة' : 'للزوج'}`}
                      className="h-11 text-sm border-2 border-indigo-200/50 dark:border-indigo-700/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <UserPlus className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                    <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                    الاسم الأخير *
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={spouse.lastName}
                      onChange={(e) => onSpouseChange({ 
                        ...spouse, 
                        lastName: e.target.value,
                        name: `${spouse.firstName} ${e.target.value}`.trim()
                      })}
                      placeholder={`أدخل الاسم الأخير ${isWife ? 'للزوجة' : 'للزوج'}`}
                      className="h-11 text-sm border-2 border-indigo-200/50 dark:border-indigo-700/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <UserPlus className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Birth Date and Marital Status on same line */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Birth Date */}
                <div className="group">
                  <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                    <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                    تاريخ الميلاد
                  </Label>
                  <div className="relative">
                    <EnhancedDatePicker
                      value={spouse.birthDate}
                      onChange={(date) => {
                        console.log('📅 Birth date changed:', date);
                        onSpouseChange({ ...spouse, birthDate: date });
                      }}
                      placeholder="اختر تاريخ الميلاد"
                      className="h-11 text-sm border-2 border-cyan-200/50 dark:border-cyan-700/50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>

                {/* Marital Status */}
                <div className="group">
                  <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                    الحالة الاجتماعية
                  </Label>
                  <div className="relative">
                    <Select
                      value={spouse.maritalStatus || "married"}
                      onValueChange={(value) => onSpouseChange({ ...spouse, maritalStatus: value })}
                    >
                      <SelectTrigger className="h-11 text-sm border-2 border-purple-200/50 dark:border-purple-700/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic">
                        <SelectValue placeholder="اختر الحالة الاجتماعية" />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                        <SelectItem value="married" className="font-arabic text-sm">{isWife ? 'متزوجة' : 'متزوج'}</SelectItem>
                        <SelectItem value="divorced" className="font-arabic text-sm">{isWife ? 'مطلقة' : 'مطلق'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                      <Heart className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Life Status and Death Date */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Life Status */}
                  <div className="group">
                    <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                      الحالة الحيوية
                    </Label>
                    <div className="relative">
                      <Select
                        value={spouse.isAlive ? "alive" : "deceased"}
                        onValueChange={(value) => onSpouseChange({
                          ...spouse, 
                          isAlive: value === "alive",
                          deathDate: value === "alive" ? null : spouse.deathDate
                        })}
                      >
                        <SelectTrigger className="h-11 text-sm border-2 border-emerald-200/50 dark:border-emerald-700/50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic">
                          <SelectValue placeholder="اختر الحالة الحيوية" />
                        </SelectTrigger>
                        <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 z-[10002]">
                          <SelectItem value="alive" className="font-arabic text-sm">على قيد الحياة</SelectItem>
                          <SelectItem value="deceased" className="font-arabic text-sm">{isWife ? 'متوفية' : 'متوفى'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                        <Heart className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Death Date - only show if deceased */}
                  {!spouse.isAlive && (
                    <div className="group">
                      <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                        <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                        تاريخ الوفاة
                      </Label>
                      <div className="relative">
                        <EnhancedDatePicker
                          value={spouse.deathDate}
                          onChange={(date) => onSpouseChange({ ...spouse, deathDate: date })}
                          placeholder="اختر تاريخ الوفاة"
                          className="h-11 text-sm border-2 border-red-200/50 dark:border-red-700/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl pr-12 font-arabic"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                          <CalendarIcon className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Image Upload Section - if package allows */}
              {isImageUploadEnabled && (
                <div className="space-y-3">
                  <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 font-arabic">
                    <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg"></div>
                    صورة {spouseLabel}
                  </Label>
                  
                  <div className="flex items-center gap-4">
                    {spouse.croppedImage && (
                      <div className="relative">
                        <img 
                          src={spouse.croppedImage} 
                          alt={`صورة ${spouseLabel}`}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`${spouseType}-image-input`)?.click()}
                        className="flex items-center gap-2 font-arabic"
                      >
                        <Camera className="h-4 w-4" />
                        {spouse.croppedImage ? 'تغيير الصورة' : 'إضافة صورة'}
                      </Button>
                      
                      {spouse.croppedImage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onSpouseChange({ ...spouse, croppedImage: null })}
                          className="flex items-center gap-2 font-arabic text-red-600 hover:text-red-700"
                        >
                          حذف الصورة
                        </Button>
                      )}
                    </div>
                    
                    <input
                      id={`${spouseType}-image-input`}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
              
              {/* Biography/Notes Section */}
              <div className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 font-arabic">
                  <div className="w-2 h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-lg"></div>
                  معلومات إضافية عن {spouseLabel}
                </Label>
                  <Textarea
                    value={spouse.biography || ''}
                    onChange={(e) => {
                      console.log('📝 Biography changed:', e.target.value);
                      onSpouseChange({ ...spouse, biography: e.target.value });
                    }}
                  placeholder={`أضف معلومات إضافية عن ${spouseLabel} (السيرة الذاتية، المهنة، الهوايات، إلخ...)`}
                  className="min-h-[80px] border-2 border-teal-200/50 dark:border-teal-700/50 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl font-arabic resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground font-arabic">
                  يمكنك إضافة معلومات مثل: المهنة، التعليم، الإنجازات، الهوايات، أو أي معلومات مهمة أخرى
                </p>
              </div>
            </>
          ) : (!spouse.isSaved && !familyStatus) ? (
            /* When no radio button is selected, show cancel option */
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4 font-arabic">
                يرجى اختيار نوع {spouseLabel} أولاً
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose?.();
                }}
                className="w-full h-12 font-arabic text-sm font-medium border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300"
              >
                الغاء إضافة {isWife ? 'زوجة' : 'زوج'} جديدة
              </Button>
            </div>
          ) : null}

          {/* Action Buttons - Only show when radio button is selected or editing saved spouse */}
          {(familyStatus === 'yes' || familyStatus === 'no' || spouse.isSaved) && (
            <div className="pt-4 border-t border-border space-y-3">
              {/* Close Button - Always show when form is open */}
              {onClose && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full h-10 font-arabic text-sm"
                >
                  إغلاق
                </Button>
              )}
              
              {/* Save Button */}
              <Button
                type="button"
                onClick={handleValidationAndSave}
                disabled={spouse.isSaved && !hasChanges}
                className={cn(
                  "w-full h-12 font-arabic text-sm font-medium transition-all duration-300",
                  spouse.isSaved && !hasChanges
                    ? "bg-green-100 text-green-700 border-green-300 cursor-not-allowed" 
                    : cn("bg-gradient-to-r text-white shadow-lg hover:shadow-xl", 
                         isWife ? "from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600" : "from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600")
                )}
              >
                {spouse.isSaved && !hasChanges ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    تم حفظ البيانات
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {hasChanges ? `حفظ التغييرات ${isWife ? 'للزوجة' : 'للزوج'}` : saveButtonText}
                  </>
                )}
              </Button>
            </div>
            )}
        </div>
      </div>
      
      {/* Image Crop Modal */}
      {showImageCrop && selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-arabic">قص وتعديل الصورة</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowImageCrop(false);
                  setSelectedImage(null);
                }}
                className="font-arabic"
              >
                إلغاء
              </Button>
            </div>
            
            <div className="relative w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                cropShape="round"
                showGrid={false}
              />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-arabic">تكبير/تصغير</Label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleCropComplete}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-arabic"
                >
                  <Crop className="h-4 w-4 mr-2" />
                  حفظ الصورة
                </Button>
                
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowImageCrop(false);
                    setSelectedImage(null);
                  }}
                  className="font-arabic"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};