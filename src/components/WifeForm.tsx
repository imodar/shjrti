import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Heart } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface WifeFormProps {
  onAddWife: (wifeData: {
    name: string;
    isAlive: boolean;
    birthDate: Date | null;
    deathDate: Date | null;
  }) => void;
}

const WifeForm = ({ onAddWife }: WifeFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    isAlive: true,
    birthDate: null as Date | null,
    deathDate: null as Date | null
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
      deathDate: null
    });
  };

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
        <div className="grid grid-cols-6 gap-3">
          {/* Living Status Buttons - Take 4 columns */}
          <Button
            type="button"
            variant={formData.isAlive ? "default" : "outline"}
            onClick={() => setFormData({...formData, isAlive: true, deathDate: null})}
            className={cn(
              "col-span-2 h-10 rounded-lg font-arabic transition-all duration-300",
              formData.isAlive 
                ? "bg-primary text-white shadow-lg" 
                : "bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            )}
          >
            <Heart className="h-4 w-4 ml-2" />
            على قيد الحياة
          </Button>
          <Button
            type="button"
            variant={!formData.isAlive ? "default" : "outline"}
            onClick={() => setFormData({...formData, isAlive: false})}
            className={cn(
              "col-span-2 h-10 rounded-lg font-arabic transition-all duration-300",
              !formData.isAlive 
                ? "bg-destructive text-destructive-foreground shadow-lg" 
                : "bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
            )}
          >
            متوفاة
          </Button>
          
          {/* Death Date - Take 2 columns */}
          <div className="col-span-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={formData.isAlive}
                  className={cn(
                    "w-full h-10 rounded-lg bg-background border-2 border-input hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 justify-center text-center font-arabic text-xs",
                    formData.isAlive && "opacity-50 cursor-not-allowed",
                    !formData.deathDate && "text-muted-foreground"
                  )}
                >
                  {formData.deathDate ? (
                    format(formData.deathDate, "yyyy", { locale: ar })
                  ) : (
                    <span>تاريخ الوفاة</span>
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
        </div>
      </div>

      
      {/* Add Button */}
      <Button
        onClick={handleSubmit}
        disabled={!formData.name.trim()}
        className="w-full h-10 bg-gradient-to-r from-primary via-accent to-primary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
      >
        <Plus className="h-4 w-4 ml-2" />
        إضافة الزوجة
      </Button>
    </div>
  );
};

export default WifeForm;