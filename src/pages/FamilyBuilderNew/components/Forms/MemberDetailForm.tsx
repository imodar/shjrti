import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Validation schema
const memberSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب").max(50, "الاسم الأول طويل جداً"),
  middleName: z.string().max(50, "اسم الأب طويل جداً").optional(),
  lastName: z.string().min(1, "اسم العائلة مطلوب").max(50, "اسم العائلة طويل جداً"),
  nickname: z.string().max(50, "الكنية طويلة جداً").optional(),
  gender: z.enum(["male", "female"], { 
    required_error: "يرجى اختيار الجنس" 
  }),
  birthDate: z.date().optional(),
  deathDate: z.date().optional(),
  birthPlace: z.string().max(100, "مكان الميلاد طويل جداً").optional(),
  deathPlace: z.string().max(100, "مكان الوفاة طويل جداً").optional(),
  currentResidence: z.string().max(100, "مكان الإقامة طويل جداً").optional(),
  occupation: z.string().max(100, "المهنة طويلة جداً").optional(),
  education: z.string().max(200, "التعليم طويل جداً").optional(),
  biography: z.string().max(1000, "السيرة الذاتية طويلة جداً").optional(),
  isAlive: z.boolean().default(true),
  isFounder: z.boolean().default(false),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
}).refine((data) => {
  // If not alive, death date should be after birth date
  if (!data.isAlive && data.birthDate && data.deathDate) {
    return data.deathDate > data.birthDate;
  }
  return true;
}, {
  message: "تاريخ الوفاة يجب أن يكون بعد تاريخ الميلاد",
  path: ["deathDate"],
});

type ValidationFormData = z.infer<typeof memberSchema>;

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  gender: "male" | "female" | "";
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
  const form = useForm<ValidationFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: formData.firstName || "",
      middleName: formData.middleName || "",
      lastName: formData.lastName || "",
      nickname: formData.nickname || "",
      gender: (formData.gender as "male" | "female") || undefined,
      birthDate: formData.birthDate,
      deathDate: formData.deathDate,
      birthPlace: formData.birthPlace || "",
      deathPlace: formData.deathPlace || "",
      currentResidence: formData.currentResidence || "",
      occupation: formData.occupation || "",
      education: formData.education || "",
      biography: formData.biography || "",
      isAlive: formData.isAlive ?? true,
      isFounder: formData.isFounder ?? false,
      fatherId: formData.fatherId || "",
      motherId: formData.motherId || "",
    }
  });

  // Update form when formData changes
  useEffect(() => {
    form.reset({
      firstName: formData.firstName || "",
      middleName: formData.middleName || "",
      lastName: formData.lastName || "",
      nickname: formData.nickname || "",
      gender: (formData.gender as "male" | "female") || undefined,
      birthDate: formData.birthDate,
      deathDate: formData.deathDate,
      birthPlace: formData.birthPlace || "",
      deathPlace: formData.deathPlace || "",
      currentResidence: formData.currentResidence || "",
      occupation: formData.occupation || "",
      education: formData.education || "",
      biography: formData.biography || "",
      isAlive: formData.isAlive ?? true,
      isFounder: formData.isFounder ?? false,
      fatherId: formData.fatherId || "",
      motherId: formData.motherId || "",
    });
  }, [formData, form]);

  // Watch form values and sync with parent
  useEffect(() => {
    const subscription = form.watch((value) => {
      setFormData(value as FormData);
    });
    return () => subscription.unsubscribe();
  }, [form, setFormData]);
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
    <Form {...form}>
      <div className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم الأول *</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل الاسم الأول" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم الأب</FormLabel>
                <FormControl>
                  <Input placeholder="اسم الأب (اختياري)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم العائلة *</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل اسم العائلة" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Nickname and Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الكنية</FormLabel>
                <FormControl>
                  <Input placeholder="الكنية (اختياري)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الجنس *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Birth and Death Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ الميلاد</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: ar }) : "اختر تاريخ الميلاد"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {!form.watch("isAlive") && (
            <FormField
              control={form.control}
              name="deathDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ الوفاة</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP", { locale: ar }) : "اختر تاريخ الوفاة"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Places */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birthPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مكان الميلاد</FormLabel>
                <FormControl>
                  <Input placeholder="مكان الميلاد" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!form.watch("isAlive") && (
            <FormField
              control={form.control}
              name="deathPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مكان الوفاة</FormLabel>
                  <FormControl>
                    <Input placeholder="مكان الوفاة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Parents Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fatherId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الأب</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأب" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">بدون أب مسجل</SelectItem>
                    {potentialFathers.map((father) => (
                      <SelectItem key={father.id} value={father.id}>
                        {getMemberDisplayName(father)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motherId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الأم</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأم" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">بدون أم مسجلة</SelectItem>
                    {potentialMothers.map((mother) => (
                      <SelectItem key={mother.id} value={mother.id}>
                        {getMemberDisplayName(mother)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Switches */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="isAlive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-x-reverse space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>على قيد الحياة</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isFounder"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-x-reverse space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>مؤسس العائلة</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {/* Biography */}
        <FormField
          control={form.control}
          name="biography"
          render={({ field }) => (
            <FormItem>
              <FormLabel>السيرة الذاتية</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="اكتب نبذة عن الشخص..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
};