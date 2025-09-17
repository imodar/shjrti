import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, Crown, User, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  gender: string;
  is_founder?: boolean;
}

interface MemberParentRelationFormProps {
  formData: {
    isFounder: boolean;
    selectedParent: string | null;
    relation: string;
    fatherId: string;
    motherId: string;
  };
  onFormDataChange: (data: any) => void;
  familyMembers: Member[];
  relationshipPopoverOpen: boolean;
  onRelationshipPopoverOpenChange: (open: boolean) => void;
  className?: string;
}

export const MemberParentRelationForm: React.FC<MemberParentRelationFormProps> = ({
  formData,
  onFormDataChange,
  familyMembers,
  relationshipPopoverOpen,
  onRelationshipPopoverOpenChange,
  className
}) => {
  const handleInputChange = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  const handleParentSelection = (parentId: string) => {
    const selectedParent = familyMembers.find(m => m.id === parentId);
    if (!selectedParent) return;

    if (selectedParent.gender === 'male') {
      handleInputChange('fatherId', parentId);
      handleInputChange('selectedParent', parentId);
      handleInputChange('relation', 'ابن');
    } else {
      handleInputChange('motherId', parentId);
      handleInputChange('selectedParent', parentId);
      handleInputChange('relation', 'ابن');
    }
  };

  const handleFounderToggle = (isFounder: boolean) => {
    handleInputChange('isFounder', isFounder);
    if (isFounder) {
      handleInputChange('selectedParent', null);
      handleInputChange('relation', '');
      handleInputChange('fatherId', '');
      handleInputChange('motherId', '');
    }
  };

  const selectedParentMember = formData.selectedParent ? 
    familyMembers.find(m => m.id === formData.selectedParent) : null;

  return (
    <div className={cn("space-y-6", className)}>
      <h3 className="text-xl font-bold font-arabic text-primary mb-6 pb-2 border-b border-border">العلاقات العائلية</h3>
      
      {/* Founder Selection */}
      <div className="space-y-4">
        <Label className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          هل هذا الشخص مؤسس العائلة؟ *
        </Label>
        
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant={formData.isFounder ? "default" : "outline"}
            onClick={() => handleFounderToggle(true)}
            className={cn(
              "h-12 font-arabic transition-all duration-300",
              formData.isFounder && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
            )}
          >
            <Crown className="h-4 w-4 ml-2" />
            نعم، مؤسس العائلة
          </Button>
          
          <Button
            type="button"
            variant={!formData.isFounder ? "default" : "outline"}
            onClick={() => handleFounderToggle(false)}
            className={cn(
              "h-12 font-arabic transition-all duration-300",
              !formData.isFounder && "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            <Users className="h-4 w-4 ml-2" />
            لا، له أهل في العائلة
          </Button>
        </div>
      </div>

      {/* Parent Selection (only if not founder) */}
      {!formData.isFounder && (
        <div className="space-y-6 p-6 bg-muted/30 rounded-xl border-2 border-dashed border-primary/30">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h4 className="font-semibold font-arabic text-foreground">اختيار الوالدين</h4>
          </div>
          
          {/* Parent Selection Dropdown */}
          <div>
            <Label className="font-arabic text-sm font-semibold text-foreground mb-3 block">
              اختر أحد الوالدين من العائلة *
            </Label>
            
            <Popover open={relationshipPopoverOpen} onOpenChange={onRelationshipPopoverOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={relationshipPopoverOpen}
                  className="w-full justify-between h-12 font-arabic border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm"
                >
                  {selectedParentMember ? (
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        selectedParentMember.gender === 'male' ? "bg-blue-500" : "bg-pink-500"
                      )} />
                      <span>{selectedParentMember.name || `${selectedParentMember.first_name || ''} ${selectedParentMember.last_name || ''}`.trim()}</span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedParentMember.gender === 'male' ? 'أب' : 'أم'}
                      </Badge>
                    </div>
                  ) : (
                    "اختر الوالد..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" side="bottom" align="start">
                <Command>
                  <CommandInput placeholder="ابحث عن عضو..." className="font-arabic" />
                  <CommandList>
                    <CommandEmpty className="font-arabic p-4 text-center text-muted-foreground">
                      لا توجد أعضاء مطابقة
                    </CommandEmpty>
                    <CommandGroup>
                      {familyMembers.map((member) => (
                        <CommandItem
                          key={member.id}
                          value={`${member.name} ${member.first_name || ''} ${member.last_name || ''}`}
                          onSelect={() => {
                            handleParentSelection(member.id);
                            onRelationshipPopoverOpenChange(false);
                          }}
                          className="font-arabic cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={cn(
                              "w-3 h-3 rounded-full flex-shrink-0",
                              member.gender === 'male' ? "bg-blue-500" : "bg-pink-500"
                            )} />
                            <div className="flex-1">
                              <div className="font-medium">
                                {member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim()}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                {member.gender === 'male' ? (
                                  <>
                                    <User className="h-3 w-3" />
                                    ذكر
                                  </>
                                ) : (
                                  <>
                                    <User className="h-3 w-3" />
                                    أنثى
                                  </>
                                )}
                                {member.is_founder && (
                                  <>
                                    <span>•</span>
                                    <Crown className="h-3 w-3 text-amber-500" />
                                    <span>مؤسس</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Check
                              className={cn(
                                "ml-2 h-4 w-4",
                                formData.selectedParent === member.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Relation Type */}
          {formData.selectedParent && (
            <div>
              <Label className="font-arabic text-sm font-semibold text-foreground mb-3 block">
                نوع العلاقة *
              </Label>
              <Select value={formData.relation} onValueChange={value => handleInputChange('relation', value)}>
                <SelectTrigger className="font-arabic h-11 rounded-lg border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-sm">
                  <SelectValue placeholder="اختر نوع العلاقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ابن" className="font-arabic">ابن/ابنة</SelectItem>
                  <SelectItem value="زوج" className="font-arabic">زوج/زوجة</SelectItem>
                  <SelectItem value="أخ" className="font-arabic">أخ/أخت</SelectItem>
                  <SelectItem value="عم" className="font-arabic">عم/عمة</SelectItem>
                  <SelectItem value="خال" className="font-arabic">خال/خالة</SelectItem>
                  <SelectItem value="حفيد" className="font-arabic">حفيد/حفيدة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Relationship Summary */}
          {selectedParentMember && formData.relation && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-sm font-arabic">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-foreground">
                  <strong>{formData.relation}</strong> لـ{' '}
                  <strong>{selectedParentMember.name || `${selectedParentMember.first_name || ''} ${selectedParentMember.last_name || ''}`.trim()}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Founder Badge */}
      {formData.isFounder && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Crown className="h-5 w-5" />
            <span className="font-semibold font-arabic">تم تحديده كمؤسس العائلة</span>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-arabic">
            المؤسس هو الشخص الذي تبدأ منه شجرة العائلة ولا يحتاج لاختيار والدين
          </p>
        </div>
      )}
    </div>
  );
};