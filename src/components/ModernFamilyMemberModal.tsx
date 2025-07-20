import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, User, Users, Camera, FileText, Plus, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: any) => void;
  familyMarriages: any[];
  selectedMember?: any;
  getFullName: (member: any) => string;
}

export const ModernFamilyMemberModal = ({
  isOpen,
  onClose,
  onSave,
  familyMarriages,
  selectedMember,
  getFullName
}: ModernFamilyMemberModalProps) => {
  const [formData, setFormData] = useState({
    name: selectedMember?.name || "",
    gender: selectedMember?.gender || "",
    birthDate: selectedMember?.birthDate ? new Date(selectedMember.birthDate) : null,
    isAlive: selectedMember?.isAlive ?? true,
    deathDate: selectedMember?.deathDate ? new Date(selectedMember.deathDate) : null,
    bio: selectedMember?.bio || "",
    relatedPersonId: selectedMember?.relatedPersonId || null,
    image: null,
    croppedImage: selectedMember?.image || null
  });

  const [showRelatedPersonDropdown, setShowRelatedPersonDropdown] = useState(false);

  const handleSave = () => {
    if (!formData.name || !formData.gender) {
      return;
    }

    const memberData = {
      name: formData.name,
      gender: formData.gender,
      birth_date: formData.birthDate?.toISOString().split('T')[0] || null,
      is_alive: formData.isAlive,
      death_date: formData.deathDate?.toISOString().split('T')[0] || null,
      biography: formData.bio,
      image_url: formData.croppedImage,
      related_person_id: formData.relatedPersonId
    };

    onSave(memberData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl">
        {/* Header with gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
        
        <DialogHeader className="border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground">
                {selectedMember ? 'تعديل بيانات العضو' : 'إضافة فرد جديد'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {selectedMember ? 'قم بتعديل معلومات العضو' : 'أدخل معلومات الفرد الجديد لبناء شجرة العائلة'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[60vh] space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                الاسم الكامل
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="أدخل الاسم الكامل"
                className="h-11 border-border/50 focus:border-primary rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                الجنس
              </Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                <SelectTrigger className="h-11 border-border/50 focus:border-primary rounded-lg">
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50 rounded-lg">
                  <SelectItem value="male" className="rounded-md">👨 ذكر</SelectItem>
                  <SelectItem value="female" className="rounded-md">👩 أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Family Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              اختر العائلة المرتبطة (اختياري)
            </Label>
            <Popover open={showRelatedPersonDropdown} onOpenChange={setShowRelatedPersonDropdown}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-between border-border/50 focus:border-primary rounded-lg",
                    !formData.relatedPersonId && "text-muted-foreground"
                  )}
                >
                  {(() => {
                    if (formData.relatedPersonId) {
                      const marriage = familyMarriages.find(m => m.id === formData.relatedPersonId);
                      if (marriage) {
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">❤️</span>
                            <span className="font-medium">
                              {`${getFullName(marriage.husband)} + ${marriage.wife?.name}`}
                            </span>
                          </div>
                        );
                      }
                    }
                    return "اختر العائلة المرتبطة";
                  })()}
                  <Search className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-popover border-border/50 rounded-xl">
                <Command className="bg-transparent">
                  <CommandInput 
                    placeholder="ابحث في العائلات..." 
                    className="border-0 focus:ring-0"
                  />
                  <CommandList className="max-h-48">
                    <CommandEmpty className="py-6 text-center text-muted-foreground">
                      لا توجد عائلات متاحة
                    </CommandEmpty>
                    <CommandGroup>
                      {familyMarriages.map((marriage) => (
                        <CommandItem
                          key={marriage.id}
                          value={`${getFullName(marriage.husband)} ${marriage.wife?.name}`}
                          onSelect={() => {
                            setFormData({...formData, relatedPersonId: marriage.id});
                            setShowRelatedPersonDropdown(false);
                          }}
                          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                        >
                          <span className="text-sm">❤️</span>
                          <div className="flex-1">
                            <p className="font-medium">
                              {getFullName(marriage.husband)} + {marriage.wife?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">عائلة</p>
                          </div>
                          {formData.relatedPersonId === marriage.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Dates Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                تاريخ الميلاد
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-11 justify-start border-border/50 focus:border-primary rounded-lg"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.birthDate ? format(formData.birthDate, "PPP", { locale: ar }) : "اختر تاريخ الميلاد"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border/50 rounded-xl">
                  <Calendar
                    mode="single"
                    selected={formData.birthDate}
                    onSelect={(date) => setFormData({...formData, birthDate: date})}
                    disabled={(date) => date > new Date()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">الحالة الحيوية</Label>
              <Select 
                value={formData.isAlive ? "alive" : "deceased"} 
                onValueChange={(value) => setFormData({...formData, isAlive: value === "alive", deathDate: value === "alive" ? null : formData.deathDate})}
              >
                <SelectTrigger className="h-11 border-border/50 focus:border-primary rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50 rounded-lg">
                  <SelectItem value="alive" className="rounded-md">💚 على قيد الحياة</SelectItem>
                  <SelectItem value="deceased" className="rounded-md">🕊️ متوفى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Death Date (if deceased) */}
          {!formData.isAlive && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                تاريخ الوفاة
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-11 justify-start border-border/50 focus:border-primary rounded-lg"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deathDate ? format(formData.deathDate, "PPP", { locale: ar }) : "اختر تاريخ الوفاة"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border/50 rounded-xl">
                  <Calendar
                    mode="single"
                    selected={formData.deathDate}
                    onSelect={(date) => setFormData({...formData, deathDate: date})}
                    disabled={(date) => date > new Date() || (formData.birthDate && date < formData.birthDate)}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Profile Photo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              الصورة الشخصية (اختياري)
            </Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-border/50">
                <AvatarImage src={formData.croppedImage || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {formData.name ? formData.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '👤'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" className="border-border/50 rounded-lg">
                <Camera className="h-4 w-4 mr-2" />
                اختر صورة
              </Button>
            </div>
          </div>

          {/* Biography */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              نبذة عن الشخص (اختياري)
            </Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="اكتب نبذة مختصرة عن هذا الشخص..."
              className="min-h-[100px] border-border/50 focus:border-primary rounded-lg resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-border/50 rounded-lg"
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.name || !formData.gender}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            {selectedMember ? 'تحديث البيانات' : 'إضافة العضو'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};