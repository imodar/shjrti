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
    marriageDate: Date | null;
    divorceDate: Date | null;
  }) => void;
}

const WifeForm = ({ onAddWife }: WifeFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    isAlive: true,
    marriageDate: null as Date | null,
    divorceDate: null as Date | null
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      return;
    }

    onAddWife(formData);
    setFormData({
      name: "",
      isAlive: true,
      marriageDate: null,
      divorceDate: null
    });
  };

  return (
    <div className="space-y-6">
      {/* Wife Name */}
      <div className="space-y-3">
        <Label htmlFor="wife-name" className="text-sm font-medium text-foreground flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full"></div>
          اسم الزوجة *
        </Label>
        <Input
          id="wife-name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="أدخل اسم الزوجة"
          className="h-12 rounded-xl bg-muted/30 border-2 border-transparent font-arabic transition-all duration-300 focus:border-primary/50 focus:bg-background/80 hover:bg-background/60"
        />
      </div>

      {/* Marriage Date */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          تاريخ الزواج (اختياري)
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-12 rounded-xl bg-muted/30 border-2 border-transparent hover:bg-background/60 focus:border-primary/50 transition-all duration-300 justify-start text-right font-arabic",
                !formData.marriageDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="ml-auto h-4 w-4" />
              {formData.marriageDate ? (
                format(formData.marriageDate, "PPP", { locale: ar })
              ) : (
                <span>اختر تاريخ الزواج</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border/50" align="start">
            <Calendar
              mode="single"
              selected={formData.marriageDate}
              onSelect={(date) => setFormData({...formData, marriageDate: date})}
              disabled={(date) => date > new Date() || date < new Date("1800-01-01")}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Living Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Heart className="h-4 w-4 text-accent" />
          الحالة الحيوية
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant={formData.isAlive ? "default" : "outline"}
            onClick={() => setFormData({...formData, isAlive: true, divorceDate: null})}
            className={cn(
              "h-12 rounded-xl font-arabic transition-all duration-300",
              formData.isAlive 
                ? "bg-primary text-white shadow-lg" 
                : "bg-muted/30 border-2 border-transparent hover:bg-background/60"
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
              "h-12 rounded-xl font-arabic transition-all duration-300",
              !formData.isAlive 
                ? "bg-muted text-foreground shadow-lg" 
                : "bg-muted/30 border-2 border-transparent hover:bg-background/60"
            )}
          >
            متوفاة
          </Button>
        </div>
      </div>

      {/* Divorce Date - Only show if not alive */}
      {!formData.isAlive && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            تاريخ الوفاة (اختياري)
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 rounded-xl bg-muted/30 border-2 border-transparent hover:bg-background/60 focus:border-primary/50 transition-all duration-300 justify-start text-right font-arabic",
                  !formData.divorceDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-auto h-4 w-4" />
                {formData.divorceDate ? (
                  format(formData.divorceDate, "PPP", { locale: ar })
                ) : (
                  <span>اختر تاريخ الوفاة</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border/50" align="start">
              <Calendar
                mode="single"
                selected={formData.divorceDate}
                onSelect={(date) => setFormData({...formData, divorceDate: date})}
                disabled={(date) => 
                  date > new Date() || 
                  (formData.marriageDate && date < formData.marriageDate)
                }
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Add Button */}
      <Button
        onClick={handleSubmit}
        disabled={!formData.name.trim()}
        className="w-full h-12 bg-gradient-to-r from-primary via-accent to-primary bg-size-200 hover:bg-pos-100 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-500 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <div className="relative flex items-center justify-center gap-3">
          <Plus className="h-4 w-4" />
          <span>إضافة الزوجة</span>
        </div>
      </Button>
    </div>
  );
};

export default WifeForm;