import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { UserCircle, Zap, Calendar as CalendarDays, MapPin, FileText, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberBasicInfoFormProps {
  formData: {
    first_name: string;
    last_name: string;
    gender: string;
    birth_date: Date | null;
    death_date: Date | null;
    birth_place: string;
    death_place: string;
    current_residence: string;
    occupation: string;
    education: string;
    biography: string;
    is_alive: boolean;
  };
  onFormDataChange: (data: any) => void;
  className?: string;
}

export const MemberBasicInfoForm: React.FC<MemberBasicInfoFormProps> = ({
  formData,
  onFormDataChange,
  className
}) => {
  const handleInputChange = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
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
            onChange={e => handleInputChange('first_name', e.target.value)}
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
          <Select value={formData.gender} onValueChange={value => handleInputChange('gender', value)}>
            <SelectTrigger className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm">
              <SelectValue placeholder="اختر الجنس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male" className="font-arabic">ذكر</SelectItem>
              <SelectItem value="female" className="font-arabic">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-6 md:col-span-3">
          <Label htmlFor="birth_date" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            تاريخ الميلاد
          </Label>
          <EnhancedDatePicker
            value={formData.birth_date}
            onChange={date => handleInputChange('birth_date', date)}
            placeholder="اختر تاريخ الميلاد"
            className="h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm"
          />
        </div>
      </div>

      {/* Second row: Last Name */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <Label htmlFor="last_name" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary" />
            اسم العائلة
          </Label>
          <Input 
            id="last_name" 
            value={formData.last_name} 
            onChange={e => handleInputChange('last_name', e.target.value)}
            placeholder="أدخل اسم العائلة" 
            className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" 
          />
        </div>
      </div>

      {/* Third row: Alive Status */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <Label className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
            الحالة الحيوية *
          </Label>
          <Select value={formData.is_alive ? "alive" : "deceased"} onValueChange={value => handleInputChange('is_alive', value === "alive")}>
            <SelectTrigger className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm">
              <SelectValue placeholder="اختر الحالة الحيوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alive" className="font-arabic">على قيد الحياة</SelectItem>
              <SelectItem value="deceased" className="font-arabic">متوفى</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Death information (only if deceased) */}
      {!formData.is_alive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30">
          <div>
            <Label htmlFor="death_date" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
              <Skull className="h-4 w-4 text-destructive" />
              تاريخ الوفاة
            </Label>
            <EnhancedDatePicker
              value={formData.death_date}
              onChange={date => handleInputChange('death_date', date)}
              placeholder="اختر تاريخ الوفاة"
              className="h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="death_place" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
              <MapPin className="h-4 w-4 text-destructive" />
              مكان الوفاة
            </Label>
            <Input 
              id="death_place" 
              value={formData.death_place} 
              onChange={e => handleInputChange('death_place', e.target.value)}
              placeholder="أدخل مكان الوفاة" 
              className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" 
            />
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold font-arabic text-foreground border-b border-border pb-2">معلومات إضافية</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="birth_place" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              مكان الميلاد
            </Label>
            <Input 
              id="birth_place" 
              value={formData.birth_place} 
              onChange={e => handleInputChange('birth_place', e.target.value)}
              placeholder="أدخل مكان الميلاد" 
              className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" 
            />
          </div>
          
          <div>
            <Label htmlFor="current_residence" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              السكن الحالي
            </Label>
            <Input 
              id="current_residence" 
              value={formData.current_residence} 
              onChange={e => handleInputChange('current_residence', e.target.value)}
              placeholder="أدخل السكن الحالي" 
              className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="occupation" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              المهنة
            </Label>
            <Input 
              id="occupation" 
              value={formData.occupation} 
              onChange={e => handleInputChange('occupation', e.target.value)}
              placeholder="أدخل المهنة" 
              className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" 
            />
          </div>
          
          <div>
            <Label htmlFor="education" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              التعليم
            </Label>
            <Input 
              id="education" 
              value={formData.education} 
              onChange={e => handleInputChange('education', e.target.value)}
              placeholder="أدخل المستوى التعليمي" 
              className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm" 
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="biography" className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            السيرة الذاتية
          </Label>
          <Textarea 
            id="biography" 
            value={formData.biography} 
            onChange={e => handleInputChange('biography', e.target.value)}
            placeholder="أدخل معلومات عن السيرة الذاتية والإنجازات..." 
            className="font-arabic min-h-24 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm resize-none" 
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};