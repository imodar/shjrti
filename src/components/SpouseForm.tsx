import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Check, ChevronsUpDown, Heart, UserPlus, CalendarIcon, Save, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

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
  isSaved: boolean;
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
  showForm: boolean;
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
  showForm
}) => {
  const { toast } = useToast();
  
  const isWife = spouseType === 'wife';
  const spouseLabel = isWife ? 'الزوجة' : 'الزوج';
  const spouseGender = isWife ? 'female' : 'male';
  const addButtonText = isWife ? 'إضافة زوجة' : 'إضافة زوج';
  const addFormTitle = isWife ? 'إضافة زوجة جديدة' : 'إضافة زوج جديد';
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
    // Validate spouse data
    const isValid = (spouse.firstName.trim() && spouse.lastName.trim()) && (
      (spouse.isFamilyMember && spouse.existingFamilyMemberId) ||
      !spouse.isFamilyMember
    );

    if (!isValid) {
      toast({
        title: "خطأ في البيانات",
        description: `يرجى إكمال جميع البيانات المطلوبة ${isWife ? 'للزوجة' : 'للزوج'}`,
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
    <div className={cn("bg-gradient-to-br rounded-2xl p-6 border shadow-lg col-span-1 lg:col-span-2", colorScheme.background, colorScheme.border)}>
      <div className="flex items-center gap-2 mb-6">
        <div className={cn("w-8 h-8 bg-gradient-to-r rounded-full flex items-center justify-center", colorScheme.gradient)}>
          <UserPlus className="w-4 h-4 text-white" />
        </div>
        <h4 className={cn("text-lg font-semibold font-arabic", colorScheme.textColor)}>{addFormTitle}</h4>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/50 dark:border-gray-700/30 rounded-xl p-6 shadow-md">
        <div className="space-y-6">
          {/* Family Member Selection */}
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
            
            <p className="text-xs text-muted-foreground mb-3 font-arabic">
              يُسمح فقط باختيار {spouseLabel} من أفراد العائلة المسجلين
            </p>
          </div>

          {/* Conditional rendering based on radio button selection */}
          {familyStatus === 'yes' ? (
            <>
              {/* Select Existing Family Member */}
              <div className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 font-arabic">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg"></div>
                  اختر {spouseLabel} من القائمة
                </Label>
                <Popover open={commandOpen} onOpenChange={onCommandOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={commandOpen}
                      className="w-full justify-between h-11 text-sm border-2 border-blue-200/50 dark:border-blue-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl font-arabic"
                    >
                      اختر فرد من العائلة...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-card/95 backdrop-blur-xl border-border/50">
                    <Command>
                      <CommandInput placeholder="ابحث عن فرد..." className="h-9 font-arabic" />
                      <CommandList>
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground font-arabic">
                          لا توجد {isWife ? 'إناث' : 'ذكور'} متاحة (لديهم أب في العائلة وعازبون/مطلقون).
                        </CommandEmpty>
                        <CommandGroup>
                          {familyMembers.filter(member => {
                            const hasValidGender = member.gender === spouseGender;
                            const isNotSelf = member.id !== selectedMember?.id;
                            const isAvailableForMarriage = 
                              member.marital_status === "single" || 
                              member.marital_status === "divorced";
                            
                            return hasValidGender && isNotSelf && isAvailableForMarriage;
                          }).map((member) => (
                            <CommandItem
                              key={member.id}
                              value={member.name}
                              onSelect={() => {
                                onSpouseChange({
                                  ...spouse,
                                  existingFamilyMemberId: member.id,
                                  firstName: member.first_name || '',
                                  lastName: member.last_name || '',
                                  name: member.name,
                                  birthDate: member.birth_date ? new Date(member.birth_date) : null,
                                  isAlive: member.is_alive ?? true,
                                  deathDate: member.death_date ? new Date(member.death_date) : null,
                                  maritalStatus: member.marital_status || 'single',
                                  croppedImage: member.image_url || null
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
                              {member.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
          ) : familyStatus === 'no' && (
            <>
              {/* Name Fields for Non-Family Members */}
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

              {/* Birth Date */}
              <div className="group">
                <Label className="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2 font-arabic">
                  <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg group-hover:scale-110 transition-transform"></div>
                  تاريخ الميلاد
                </Label>
                <div className="relative">
                  <EnhancedDatePicker
                    value={spouse.birthDate}
                    onChange={(date) => onSpouseChange({ ...spouse, birthDate: date })}
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
            </>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
            <Button
              type="button"
              onClick={handleValidationAndSave}
              disabled={spouse.isSaved}
              className={cn(
                "w-full h-12 font-arabic text-sm font-medium transition-all duration-300",
                spouse.isSaved 
                  ? "bg-green-100 text-green-700 border-green-300 cursor-not-allowed" 
                  : cn("bg-gradient-to-r text-white shadow-lg hover:shadow-xl", 
                       isWife ? "from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600" : "from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600")
              )}
            >
              {spouse.isSaved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  تم حفظ البيانات
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {saveButtonText}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};