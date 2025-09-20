import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableDropdown } from "@/components/SearchableDropdown";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { UserCircle, Zap, CalendarDays, UsersIcon, Activity, Skull } from "lucide-react";

interface FormData {
  first_name: string;
  gender: string;
  birthDate: Date | null;
  selectedParent: string | null;
  isAlive: boolean;
  deathDate: Date | null;
  isFounder?: boolean;
}

interface MemberBasicInfoFormProps {
  formData: FormData;
  setFormData: (data: Partial<FormData>) => void;
  familyMembers: any[];
  familyMarriages: any[];
  loading: boolean;
}

export const MemberBasicInfoForm: React.FC<MemberBasicInfoFormProps> = ({
  formData,
  setFormData,
  familyMembers,
  familyMarriages,
  loading
}) => {
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

    // For external family members (like خالد الوتار, فايز الوتار), always show full name with surname
    if (isExternalFamily) {
      return `${firstName} ${member.last_name}`;
    }

    // For internal family members
    if (isWife) {
      // For wives from internal family, show "ابنة" format
      const father = familyMembers.find(m => m?.id === member?.fatherId);
      if (father) {
        const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
        return `${firstName} ابنة ${fatherFirstName}`;
      }
      return firstName;
    } else {
      // For internal family males (not founders), show "ابن" format with grandfather if available
      const father = familyMembers.find(m => m?.id === member?.fatherId);
      if (father) {
        const fatherFirstName = father.first_name || father.name?.split(' ')[0] || father.name;
        const grandfather = familyMembers.find(m => m?.id === father?.fatherId);
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

  const getParentOptions = () => {
    if (loading || !familyMarriages || !familyMembers) {
      return [{
        value: "loading",
        label: "جاري تحميل البيانات...",
        disabled: true
      }];
    }

    if (familyMarriages.length === 0) {
      return [{
        value: "no-data",
        label: "لا توجد زيجات مسجلة في هذه العائلة",
        disabled: true
      }];
    }

    return familyMarriages
      .filter(marriage => marriage && marriage.id && marriage.husband && marriage.wife)
      .map(marriage => {
        const husbandMember = familyMembers.find(member => member?.id === marriage.husband?.id);
        const wifeMember = familyMembers.find(member => member?.id === marriage.wife?.id);
        
        const familyMember = husbandMember ? buildFullName(husbandMember, false) : 'غير محدد';
        const spouse = wifeMember ? buildFullName(wifeMember, true) : 'غير محدد';
        const heartIcon: 'heart' | 'heart-crack' = marriage.marital_status === 'divorced' ? 'heart-crack' : 'heart';

        return {
          value: marriage.id,
          familyMember,
          spouse,
          heartIcon,
          isFounder: husbandMember?.is_founder || false
        };
      });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold font-arabic text-primary mb-6 pb-2 border-b border-border">
        المعلومات الأساسية
      </h3>
      
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
            onChange={e => setFormData({
              ...formData,
              first_name: e.target.value
            })} 
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
          <Select value={formData.gender} onValueChange={value => setFormData({
            ...formData,
            gender: value
          })}>
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
            onChange={date => setFormData({
              ...formData,
              birthDate: date
            })} 
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
            options={getParentOptions()}
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
          <Select value={formData.isAlive ? "alive" : "deceased"} onValueChange={value => setFormData({
            ...formData,
            isAlive: value === "alive"
          })}>
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
    </div>
  );
};