import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Member } from "../../types/family.types";

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  gender: string;
  birthDate: Date | undefined;
  deathDate: Date | undefined;
  birthPlace: string;
  deathPlace: string;
  currentResidence: string;
  occupation: string;
  education: string;
  biography: string;
  isAlive: boolean;
  isFounder: boolean;
  fatherId: string;
  motherId: string;
}

interface MemberDetailFormProps {
  formData: FormData;
  setFormData: (data: Partial<FormData>) => void;
  familyMembers: Member[];
  editingMember?: Member | null;
}

export const MemberDetailForm: React.FC<MemberDetailFormProps> = ({
  formData,
  setFormData,
  familyMembers,
  editingMember
}) => {
  // Filter potential parents (must be different gender from current member and not the member itself)
  const potentialFathers = familyMembers.filter(member => 
    member.gender === 'male' && 
    member.id !== editingMember?.id
  );
  
  const potentialMothers = familyMembers.filter(member => 
    member.gender === 'female' && 
    member.id !== editingMember?.id
  );

  const getMemberDisplayName = (member: Member) => {
    return member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'غير محدد';
  };

  return (
    <div className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">الاسم الأول *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ firstName: e.target.value })}
            placeholder="أدخل الاسم الأول"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="middleName">اسم الأب</Label>
          <Input
            id="middleName"
            value={formData.middleName}
            onChange={(e) => setFormData({ middleName: e.target.value })}
            placeholder="اسم الأب (اختياري)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">اسم العائلة *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ lastName: e.target.value })}
            placeholder="أدخل اسم العائلة"
          />
        </div>
      </div>

      {/* Nickname and Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nickname">الكنية</Label>
          <Input
            id="nickname"
            value={formData.nickname}
            onChange={(e) => setFormData({ nickname: e.target.value })}
            placeholder="الكنية (اختياري)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">الجنس *</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData({ gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الجنس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">ذكر</SelectItem>
              <SelectItem value="female">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Birth and Death Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>تاريخ الميلاد</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.birthDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.birthDate ? format(formData.birthDate, "PPP", { locale: ar }) : "اختر تاريخ الميلاد"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.birthDate}
                onSelect={(date) => setFormData({ birthDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {!formData.isAlive && (
          <div className="space-y-2">
            <Label>تاريخ الوفاة</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.deathDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deathDate ? format(formData.deathDate, "PPP", { locale: ar }) : "اختر تاريخ الوفاة"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.deathDate}
                  onSelect={(date) => setFormData({ deathDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Places */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birthPlace">مكان الميلاد</Label>
          <Input
            id="birthPlace"
            value={formData.birthPlace}
            onChange={(e) => setFormData({ birthPlace: e.target.value })}
            placeholder="مكان الميلاد"
          />
        </div>
        {!formData.isAlive && (
          <div className="space-y-2">
            <Label htmlFor="deathPlace">مكان الوفاة</Label>
            <Input
              id="deathPlace"
              value={formData.deathPlace}
              onChange={(e) => setFormData({ deathPlace: e.target.value })}
              placeholder="مكان الوفاة"
            />
          </div>
        )}
      </div>

      {/* Parents Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>الأب</Label>
          <Select value={formData.fatherId} onValueChange={(value) => setFormData({ fatherId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الأب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون أب مسجل</SelectItem>
              {potentialFathers.map((father) => (
                <SelectItem key={father.id} value={father.id}>
                  {getMemberDisplayName(father)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>الأم</Label>
          <Select value={formData.motherId} onValueChange={(value) => setFormData({ motherId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الأم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون أم مسجلة</SelectItem>
              {potentialMothers.map((mother) => (
                <SelectItem key={mother.id} value={mother.id}>
                  {getMemberDisplayName(mother)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Switches */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Switch
            checked={formData.isAlive}
            onCheckedChange={(checked) => setFormData({ isAlive: checked })}
          />
          <Label>على قيد الحياة</Label>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Switch
            checked={formData.isFounder}
            onCheckedChange={(checked) => setFormData({ isFounder: checked })}
          />
          <Label>مؤسس العائلة</Label>
        </div>
      </div>

      {/* Biography */}
      <div className="space-y-2">
        <Label htmlFor="biography">السيرة الذاتية</Label>
        <Textarea
          id="biography"
          value={formData.biography}
          onChange={(e) => setFormData({ biography: e.target.value })}
          placeholder="اكتب نبذة عن الشخص..."
          rows={4}
        />
      </div>
    </div>
  );
};