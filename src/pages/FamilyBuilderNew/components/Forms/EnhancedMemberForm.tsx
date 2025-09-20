import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableDropdown } from "@/components/SearchableDropdown";
import { 
  CalendarIcon, 
  Upload, 
  Users, 
  Save, 
  Plus, 
  X, 
  ArrowLeft, 
  Edit, 
  Edit2, 
  Trash2, 
  Heart, 
  User, 
  Camera, 
  Skull, 
  UserCircle, 
  Zap, 
  Calendar as CalendarDays, 
  UsersIcon, 
  Activity, 
  FileText,
  Check,
  Crown
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { SpouseForm } from "@/components/SpouseForm";
import { cn } from "@/lib/utils";
import { Member } from "../../types/family.types";

interface FormData {
  first_name: string;
  name: string;
  relation: string;
  relatedPersonId: string | null;
  selectedParent: string | null;
  gender: "male" | "female";
  birthDate: Date | null;
  isAlive: boolean;
  deathDate: Date | null;
  bio: string;
  imageUrl: string;
  croppedImage: string | null;
  isFounder: boolean;
}

interface EnhancedMemberFormProps {
  formMode: 'add' | 'edit' | 'view';
  currentStep: number;
  formData: FormData;
  setFormData: (data: Partial<FormData>) => void;
  editingMember?: Member | null;
  familyMembers: Member[];
  familyMarriages: any[];
  wives: any[];
  setWives: (wives: any[]) => void;
  husband: any;
  setHusband: (husband: any) => void;
  currentWife: any;
  setCurrentWife: (wife: any) => void;
  showWifeForm: boolean;
  setShowWifeForm: (show: boolean) => void;
  wiveFamilyStatus: { [key: number]: 'yes' | 'no' | null };
  setWiveFamilyStatus: (status: { [key: number]: 'yes' | 'no' | null }) => void;
  croppedImage: string | null;
  setCroppedImage: (image: string | null) => void;
  selectedImage: File | null;
  setSelectedImage: (file: File | null) => void;
  imageChanged: boolean;
  setImageChanged: (changed: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isImageUploadEnabled: boolean;
  loading: boolean;
  isSaving: boolean;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditImage: () => void;
  handleDeleteImage: () => void;
  handleSubmit: () => void;
  handleSpouseDelete: (spouse: any, index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  handleCancelForm: () => void;
  onSaveSpouse: (spouseData: any, spouseType: 'wife' | 'husband') => void;
  onCancelSpouse: () => void;
}

export const EnhancedMemberForm: React.FC<EnhancedMemberFormProps> = ({
  formMode,
  currentStep,
  formData,
  setFormData,
  editingMember,
  familyMembers,
  familyMarriages,
  wives,
  setWives,
  husband,
  setHusband,
  currentWife,
  setCurrentWife,
  showWifeForm,
  setShowWifeForm,
  wiveFamilyStatus,
  setWiveFamilyStatus,
  croppedImage,
  setCroppedImage,
  selectedImage,
  setSelectedImage,
  imageChanged,
  setImageChanged,
  fileInputRef,
  isImageUploadEnabled,
  loading,
  isSaving,
  handleImageSelect,
  handleEditImage,
  handleDeleteImage,
  handleSubmit,
  handleSpouseDelete,
  nextStep,
  prevStep,
  handleCancelForm,
  onSaveSpouse,
  onCancelSpouse
}) => {
  // Helper function to build full genealogical name
  const buildFullName = (member: any, isWife: boolean = false) => {
    if (!member) return '';
    const firstName = member.first_name || member.name?.split(' ')[0] || '';
    const mainFamilyName = "الشيخ سعيد"; // Main family surname

    // For founders, show full name with surname
    if (member.is_founder) {
      const lastName = member.last_name || mainFamilyName;
      return `${firstName} ${lastName}`;
    }

    // Check if member is from external family
    const isExternalFamily = member.last_name && member.last_name !== mainFamilyName;

    // For external family members, always show full name with surname
    if (isExternalFamily) {
      return `${firstName} ${member.last_name}`;
    }

    // For internal family members
    if (isWife) {
      // For wives from internal family, show "ابنة" format
      const father = familyMembers.find(m => m?.id === member?.father_id);
      if (father) {
        const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
        return `${firstName} ابنة ${fatherFirstName}`;
      }
      return firstName;
    } else {
      // For internal family males (not founders), show "ابن" format with grandfather if available
      const father = familyMembers.find(m => m?.id === member?.father_id);
      if (father) {
        const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
        const grandfather = familyMembers.find(m => m?.id === father?.father_id);
        if (grandfather) {
          const grandfatherFirstName = grandfather.first_name || grandfather.name?.split(' ')[0] || grandfather.name;
          return `${firstName} ابن ${fatherFirstName} ابن ${grandfatherFirstName}`;
        }
        return `${firstName} ابن ${fatherFirstName}`;
      }
    }

    // Fallback
    return firstName || member.name;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold font-arabic text-primary mb-6 pb-2 border-b border-border">المعلومات الأساسية</h3>
      
      {/* First row: First Name (1/2), Gender (1/4), Birthdate (1/4) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6">
          <Label htmlFor="first_name" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary" />
            الاسم الأول *
          </Label>
          <Input 
            id="first_name" 
            value={formData.first_name} 
            onChange={e => setFormData({ ...formData, first_name: e.target.value })} 
            placeholder="أدخل الاسم الأول" 
            className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" 
            required 
          />
        </div>
        
        <div className="col-span-6 md:col-span-3">
          <Label htmlFor="gender" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            الجنس *
          </Label>
          <Select 
            value={formData.gender} 
            onValueChange={value => setFormData({ ...formData, gender: value as "male" | "female" })}
          >
            <SelectTrigger className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm">
              <SelectValue placeholder="اختر الجنس" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-2">
              <SelectItem value="male" className="font-arabic rounded-md">ذكر</SelectItem>
              <SelectItem value="female" className="font-arabic rounded-md">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-6 md:col-span-3">
          <Label className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            تاريخ الميلاد
          </Label>
          <EnhancedDatePicker 
            value={formData.birthDate} 
            onChange={date => setFormData({ ...formData, birthDate: date })} 
            placeholder="اختر تاريخ الميلاد" 
            className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" 
          />
        </div>
      </div>
      
      {/* Second row: Family relation (1/2), Alive status (1/4), Death date (1/4) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6">
          <Label htmlFor="parentRelation" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-primary" />
            العلاقة العائلية (الوالدين) *
            {formData.isFounder && <span className="text-xs text-muted-foreground mr-2">(مؤسس العائلة - لا يحتاج لوالدين)</span>}
          </Label>
          <SearchableDropdown 
            options={loading || !familyMarriages || !familyMembers ? [{
              value: "loading",
              label: "جاري تحميل البيانات...",
              disabled: true
            }] : familyMarriages.length > 0 ? 
              familyMarriages
                .filter(marriage => marriage && marriage.id && marriage.husband && marriage.wife)
                .map(marriage => {
                  const husbandMember = familyMembers.find(member => member?.id === marriage.husband?.id);
                  const wifeMember = familyMembers.find(member => member?.id === marriage.wife?.id);
                  const familyMember = husbandMember ? buildFullName(husbandMember, false) : 'غير محدد';
                  const spouse = wifeMember ? buildFullName(wifeMember, true) : 'غير محدد';
                  const heartIcon = marriage.marital_status === 'divorced' ? 'heart-crack' : 'heart';

                  return {
                    value: marriage.id,
                    familyMember,
                    spouse,
                    heartIcon,
                    isFounder: husbandMember?.is_founder || false
                  };
                }) : [{
              value: "no-data",
              label: "لا توجد زيجات مسجلة في هذه العائلة",
              disabled: true
            }]} 
            value={formData.selectedParent || ""} 
            onValueChange={value => setFormData({
              ...formData,
              selectedParent: value === "none" ? null : value
            })} 
            disabled={loading || !familyMarriages || !familyMembers || formData.isFounder} 
            placeholder={loading ? "جاري التحميل..." : formData.isFounder ? "مؤسس العائلة - لا يحتاج لوالدين" : "اختر الوالدين"} 
            searchPlaceholder="ابحث عن الوالدين..." 
            emptyMessage="لا توجد نتائج تطابق البحث" 
          />
        </div>
        
        <div className="col-span-6 md:col-span-3">
          <Label htmlFor="aliveStatus" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            الحالة الحيوية
          </Label>
          <Select 
            value={formData.isAlive ? "alive" : "deceased"} 
            onValueChange={value => setFormData({
              ...formData,
              isAlive: value === "alive"
            })}
          >
            <SelectTrigger className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm">
              <SelectValue placeholder="اختر الحالة الحيوية" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-2">
              <SelectItem value="alive" className="font-arabic rounded-md">على قيد الحياة</SelectItem>
              <SelectItem value="deceased" className="font-arabic rounded-md">متوفى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!formData.isAlive && (
          <div className="col-span-6 md:col-span-3">
            <Label className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
              <Skull className="h-4 w-4 text-primary" />
              تاريخ الوفاة
            </Label>
            <EnhancedDatePicker 
              value={formData.deathDate} 
              onChange={date => setFormData({
                ...formData,
                deathDate: date
              })} 
              placeholder="اختر تاريخ الوفاة" 
              className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" 
            />
          </div>
        )}
      </div>

      {/* Biography and Profile Picture - Side by Side Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Biography Section - 1/2 */}
        <div>
          <Label htmlFor="bio" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            السيرة الذاتية
          </Label>
          <Textarea 
            id="bio" 
            value={formData.bio} 
            onChange={e => setFormData({
              ...formData,
              bio: e.target.value
            })} 
            placeholder="أدخل معلومات إضافية عن العضو" 
            rows={6} 
            className="font-arabic rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm resize-none" 
          />
        </div>

        {/* Profile Picture Section - 1/2 */}
        {(formMode === 'add' || formMode === 'edit') && (
          <div className="space-y-3">
            <Label htmlFor="picture" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              الصورة الشخصية
            </Label>
            
            {croppedImage || (editingMember && editingMember.image_url) ? (
              <div className="space-y-3">
                <div className="relative group flex justify-center">
                  <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20 p-3">
                    <img 
                      src={croppedImage || (editingMember && editingMember.image_url)} 
                      alt="صورة العضو" 
                      className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-lg" 
                    />
                  </div>
                </div>
                
                <div className="flex justify-center gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={handleEditImage} className="h-8 px-3">
                    <Edit2 className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={handleDeleteImage} className="h-8 px-3">
                    <Trash2 className="h-3 w-3 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-300 h-[140px] flex items-center justify-center ${
                  isImageUploadEnabled ? 'border-primary/40 cursor-pointer hover:border-primary/60' : 'border-gray-300 opacity-70 cursor-not-allowed'
                }`} 
                onClick={() => isImageUploadEnabled && fileInputRef.current?.click()}
              >
                {isImageUploadEnabled ? (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-primary mx-auto" />
                    <p className="text-sm font-medium text-foreground">انقر لرفع الصورة</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF حتى 10MB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm font-medium text-gray-500">رفع الصور غير متاح</p>
                    <p className="text-xs text-gray-400">يتطلب اشتراك مدفوع</p>
                  </div>
                )}
              </div>
            )}
            
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleImageSelect} 
              className="hidden" 
              disabled={!isImageUploadEnabled} 
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {formData.gender === "male" ? "معلومات الزوجة/الزوجات" : "معلومات الزوج"}
      </h3>
      <p className="text-sm text-muted-foreground -mt-1">
        {formData.gender === "male" ? "أضف معلومات الزوجة أو الزوجات إذا كان متزوجاً" : "أضف معلومات الزوج إذا كانت متزوجة"}
      </p>
      
      {formData.gender === "male" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wives Display Panel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 w-full">
              <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-pink-700 dark:text-pink-300 font-arabic">الزوجات</h4>
            </div>
            
            <div className="space-y-3">
              {wives.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-arabic">لم يتم إضافة زوجات بعد</p>
                </div>
              ) : (
                wives.map((wife, index) => (
                  <div key={index} className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 border-2 border-dashed border-pink-400/60 dark:border-pink-500/60 min-h-[160px]">
                    <div className="h-full flex flex-col justify-between">
                      {/* Header Section */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 dark:text-gray-100 font-arabic text-lg mb-2">
                              {wife.name || `الزوجة ${index + 1}`}
                            </h5>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {wife.isSaved && (
                                  <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                                    <Check className="h-3 w-3" />
                                    محفوظة
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full text-xs font-medium">
                                  <Heart className="h-3 w-3" />
                                  {wife.maritalStatus === 'divorced' ? 'زوجة سابقة' : 'زوجة'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons at bottom */}
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
                        {wife.isSaved && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => {
                              const resetWives = wives.map(w => ({ ...w, isSaved: true }));
                              const updatedWives = [...resetWives];
                              updatedWives[index] = { ...wife, isSaved: false };
                              setWives(updatedWives);
                              setCurrentWife(wife);
                              setShowWifeForm(true);
                            }} 
                            className="h-8 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 transition-all duration-300"
                          >
                            <Edit className="h-3 w-3 ml-1" />
                            تعديل
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSpouseDelete(wife, index)} 
                          className="h-8 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 transition-all duration-300"
                        >
                          <X className="h-3 w-3 ml-1" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
            
            <SpouseForm 
              spouseType="wife" 
              spouse={{
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
              onSpouseChange={(spouseData) => setCurrentWife(spouseData)}
              familyMembers={familyMembers}
              selectedMember={null}
              commandOpen={false}
              onCommandOpenChange={() => {}}
              familyStatus={currentWife ? (wiveFamilyStatus[wives.indexOf(currentWife)] || 'no') : 'no'}
              onFamilyStatusChange={() => {}}
              onSave={() => onSaveSpouse(currentWife, 'wife')}
              onAdd={() => onSaveSpouse(currentWife, 'wife')}
              onClose={() => onCancelSpouse()}
              showForm={true}
            />
          </div>
        </div>
      ) : (
        // Husband form for female members
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Husband Display */}
          {husband && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 font-arabic">الزوج</h4>
              </div>
              
              <div className="bg-white/40 dark:bg-gray-800/40 rounded-xl p-6 border-2 border-dashed border-blue-400/60 dark:border-blue-500/60">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100 font-arabic text-lg mb-2">
                  {husband.name || "الزوج"}
                </h5>
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSpouseDelete(husband, -1)} 
                    className="h-8 px-3 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                  >
                    <X className="h-3 w-3 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Husband Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 font-arabic">إضافة زوج</h4>
            </div>
            
            <SpouseForm 
              spouseType="husband" 
              spouse={{
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
              onSpouseChange={(spouseData) => setHusband(spouseData)}
              familyMembers={familyMembers}
              selectedMember={null}
              commandOpen={false}
              onCommandOpenChange={() => {}}
              familyStatus="no"
              onFamilyStatusChange={() => {}}
              onSave={() => onSaveSpouse(husband, 'husband')}
              onAdd={() => onSaveSpouse(husband, 'husband')}
              onClose={() => onCancelSpouse()}
              showForm={true}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              السابق
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleCancelForm} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            إلغاء
          </Button>
        </div>
        
        <div className="flex gap-2">
          {currentStep < 2 ? (
            <Button type="button" onClick={nextStep} className="flex items-center gap-2">
              التالي
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleSubmit} 
              disabled={isSaving} 
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {formMode === 'edit' ? 'تحديث' : 'حفظ'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};