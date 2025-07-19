import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Heart, Users } from "lucide-react";
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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-10 rounded-lg bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 justify-center text-center font-arabic text-xs",
                  !formData.birthDate && "text-muted-foreground"
                )}
              >
                {formData.birthDate ? (
                  format(formData.birthDate, "yyyy", { locale: ar })
                ) : (
                  <span>السنة</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border/50" align="start">
              <Calendar
                mode="single"
                selected={formData.birthDate}
                onSelect={(date) => setFormData({...formData, birthDate: date})}
                disabled={(date) => date > new Date() || date < new Date("1800-01-01")}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Living Status and Death Date Row */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Heart className="h-4 w-4 text-accent" />
          الحالة الحيوية
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {/* Alive Button */}
          <Button
            type="button"
            variant={formData.isAlive ? "default" : "outline"}
            onClick={() => setFormData({...formData, isAlive: true, deathDate: null})}
            className={cn(
              "h-10 rounded-lg font-arabic transition-all duration-300",
              formData.isAlive 
                ? "bg-primary text-white shadow-lg" 
                : "bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            )}
          >
            <Heart className="h-4 w-4 ml-2" />
            على قيد الحياة
          </Button>
          
          {/* Deceased Button */}
          <Button
            type="button"
            variant={!formData.isAlive ? "default" : "outline"}
            onClick={() => setFormData({...formData, isAlive: false})}
            className={cn(
              "h-10 rounded-lg font-arabic transition-all duration-300",
              !formData.isAlive 
                ? "bg-destructive text-destructive-foreground shadow-lg" 
                : "bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            )}
          >
            متوفاة
          </Button>
          
          {/* Death Date - Only show if not alive */}
          {!formData.isAlive && (
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-10 rounded-lg bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 justify-center text-center font-arabic text-xs",
                      !formData.deathDate && "text-muted-foreground"
                    )}
                  >
                    {formData.deathDate ? (
                      format(formData.deathDate, "yyyy", { locale: ar })
                    ) : (
                      <span>سنة الوفاة</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border/50" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deathDate}
                    onSelect={(date) => setFormData({...formData, deathDate: date})}
                    disabled={(date) => 
                      date > new Date() || 
                      (formData.birthDate && date < formData.birthDate)
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Marital Status Row */}
      <div className="space-y-2 w-1/3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          الحالة الزوجية
        </Label>
        <Select 
          value={formData.maritalStatus} 
          onValueChange={(value) => setFormData({...formData, maritalStatus: value})}
        >
          <SelectTrigger className="h-10 rounded-lg bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300">
            <SelectValue placeholder="اختر الحالة الزوجية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="married">متزوجة</SelectItem>
            <SelectItem value="divorced">مطلقة</SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  );
});

WifeForm.displayName = "WifeForm";

export default WifeForm;