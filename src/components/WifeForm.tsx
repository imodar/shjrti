import { useState, forwardRef, useImperativeHandle } from "react";
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
    name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
    maritalStatus: string;
  }) => void;
}

export interface WifeFormRef {
  isValid: () => boolean;
  handleSubmit: () => void;
}

const WifeForm = forwardRef<WifeFormRef, WifeFormProps>(({ onAddWife }, ref) => {
  const [formData, setFormData] = useState({
    name: "",
    isAlive: true,
    birthDate: null as Date | null,
    deathDate: null as Date | null,
    maritalStatus: "married" as string
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      return;
    }

    onAddWife(formData);
    setFormData({
      name: "",
      isAlive: true,
      birthDate: null,
      deathDate: null,
      maritalStatus: "married"
    });
  };

  const isValid = () => {
    return formData.name.trim().length > 0;
  };

  useImperativeHandle(ref, () => ({
    isValid,
    handleSubmit
  }));

  return (
    <div className="space-y-4">
      {/* Name and Birth Date Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Wife Name - Takes 2/3 of the width */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="wife-name" className="text-sm font-medium text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            اسم الزوجة *
          </Label>
          <Input
            id="wife-name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="أدخل اسم الزوجة"
            className="h-10 rounded-lg bg-background border-2 border-input font-arabic transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
          />
        </div>
        
        {/* Birth Date - Takes 1/3 of the width */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            تاريخ الميلاد
          </Label>
          <EnhancedDatePicker
            value={formData.birthDate}
            onChange={(date) => setFormData({...formData, birthDate: date})}
            placeholder="تاريخ الميلاد"
            className="h-10 text-xs"
            fromYear={1800}
            disableFuture={true}
          />
        </div>
      </div>

      {/* Marital Status Row */}
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
            <SelectItem value="married" className="font-arabic text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-3">
              <div className="flex items-center gap-2 justify-end w-full">
                <span>متزوجة</span>
                <Heart className="h-4 w-4 text-green-500" />
              </div>
            </SelectItem>
            <SelectItem value="divorced" className="font-arabic text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-3">
              <div className="flex items-center gap-2 justify-end w-full">
                <span>مطلقة</span>
                <Users className="h-4 w-4 text-orange-500" />
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Living Status Row */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Heart className="h-4 w-4 text-accent" />
          الحالة الحيوية
        </Label>
        <div className="flex gap-3">
          {/* Status Dropdown */}
          <div className="flex-1">
            <Select 
              value={formData.isAlive ? "alive" : "deceased"} 
              onValueChange={(value) => setFormData({
                ...formData, 
                isAlive: value === "alive",
                deathDate: value === "alive" ? null : formData.deathDate
              })}
            >
              <SelectTrigger className="h-10 rounded-lg bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300">
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
            <div className="flex-1">
              <EnhancedDatePicker
                value={formData.deathDate}
                onChange={(date) => setFormData({...formData, deathDate: date})}
                placeholder="تاريخ الوفاة"
                className="h-10"
                fromYear={1800}
                disableFuture={true}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
});

WifeForm.displayName = "WifeForm";

export default WifeForm;