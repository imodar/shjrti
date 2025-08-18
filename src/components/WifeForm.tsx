import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Heart, Users } from "lucide-react";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface WifeFormProps {
  onAddWife: (wifeData: {
    first_name: string;
    last_name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
    maritalStatus: string;
  }) => void;
  initialData?: {
    id: string;
    first_name: string;
    last_name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
    maritalStatus?: string;
  } | null;
}

export interface WifeFormRef {
  isValid: () => boolean;
  handleSubmit: () => void;
}

const WifeForm = forwardRef<WifeFormRef, WifeFormProps>(({ onAddWife, initialData }, ref) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    isAlive: true,
    birthDate: null as Date | null,
    deathDate: null as Date | null,
    maritalStatus: "married" as string
  });

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        first_name: initialData.first_name,
        last_name: initialData.last_name,
        isAlive: initialData.isAlive,
        birthDate: initialData.birthDate,
        deathDate: initialData.deathDate,
        maritalStatus: initialData.maritalStatus || "married"
      });
    } else {
      // Reset form when not editing
      setFormData({
        first_name: "",
        last_name: "",
        isAlive: true,
        birthDate: null,
        deathDate: null,
        maritalStatus: "married"
      });
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!formData.first_name.trim() && !formData.last_name.trim()) {
      return;
    }

    onAddWife(formData);
    setFormData({
      first_name: "",
      last_name: "",
      isAlive: true,
      birthDate: null,
      deathDate: null,
      maritalStatus: "married"
    });
  };

  const isValid = () => {
    return formData.first_name.trim().length > 0 || formData.last_name.trim().length > 0;
  };

  useImperativeHandle(ref, () => ({
    isValid,
    handleSubmit
  }));

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      {/* Row 1: Names and Birth Date - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* First Name */}
        <div className="space-y-2">
          <Label htmlFor="wife-first-name" className="text-sm font-medium text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            الاسم الأول *
          </Label>
          <Input
            id="wife-first-name"
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            placeholder="الاسم الأول"
            className="h-12 rounded-lg bg-background border-2 border-input font-arabic transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
          />
        </div>
        
        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="wife-last-name" className="text-sm font-medium text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            الاسم الأخير
          </Label>
          <Input
            id="wife-last-name"
            value={formData.last_name}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            placeholder="الاسم الأخير"
            className="h-12 rounded-lg bg-background border-2 border-input font-arabic transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
          />
        </div>
        
        {/* Birth Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            تاريخ الميلاد
          </Label>
          <EnhancedDatePicker
            value={formData.birthDate}
            onChange={(date) => setFormData({...formData, birthDate: date})}
            placeholder="تاريخ الميلاد"
            className="h-12 text-sm"
            fromYear={1800}
            disableFuture={true}
          />
        </div>
      </div>

      {/* Row 2: Status Fields - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Marital Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            الحالة الزوجية *
          </Label>
          <Select 
            value={formData.maritalStatus} 
            onValueChange={(value) => setFormData({...formData, maritalStatus: value})}
          >
            <SelectTrigger className="h-12 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 text-right">
              <SelectValue placeholder="اختر الحالة الزوجية" />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-xl min-w-[200px]">
              <SelectItem value="married" className="font-arabic text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-3 dir-rtl">
                <div className="flex items-center gap-2 w-full justify-start dir-rtl">
                  <Heart className="h-4 w-4 text-green-500" />
                  <span>متزوجة</span>
                </div>
              </SelectItem>
              <SelectItem value="divorced" className="font-arabic text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-3 dir-rtl">
                <div className="flex items-center gap-2 w-full justify-start dir-rtl">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span>مطلقة</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Living Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent" />
            الحالة الحيوية
          </Label>
          <Select 
            value={formData.isAlive ? "alive" : "deceased"} 
            onValueChange={(value) => setFormData({
              ...formData, 
              isAlive: value === "alive",
              deathDate: value === "alive" ? null : formData.deathDate
            })}
          >
            <SelectTrigger className="h-12 rounded-lg bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300">
              <SelectValue placeholder="اختر الحالة الحيوية" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
              <SelectItem value="alive" className="font-arabic">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-green-500" />
                  على قيد الحياة
                </div>
              </SelectItem>
              <SelectItem value="deceased" className="font-arabic">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  متوفاة
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Death Date - Only show if deceased */}
        {!formData.isAlive && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-red-500" />
              تاريخ الوفاة
            </Label>
            <EnhancedDatePicker
              value={formData.deathDate}
              onChange={(date) => setFormData({...formData, deathDate: date})}
              placeholder="تاريخ الوفاة"
              className="h-12"
              fromYear={1800}
              disableFuture={true}
            />
          </div>
        )}
      </div>
    </div>
  );
});

WifeForm.displayName = "WifeForm";

export default WifeForm;