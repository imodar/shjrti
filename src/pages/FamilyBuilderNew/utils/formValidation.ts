import { z } from "zod";

export const memberFormSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().optional(),
  gender: z.enum(["male", "female"], {
    required_error: "الجنس مطلوب"
  }),
  birthDate: z.date().optional(),
  deathDate: z.date().optional(),
  isAlive: z.boolean().default(true),
  biography: z.string().optional(),
  birthPlace: z.string().optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional()
}).refine(
  (data) => {
    if (!data.isAlive && !data.deathDate) {
      return false;
    }
    return true;
  },
  {
    message: "تاريخ الوفاة مطلوب إذا كان المتوفى",
    path: ["deathDate"]
  }
);

export type MemberFormData = z.infer<typeof memberFormSchema>;

export const validateMemberForm = (data: Partial<MemberFormData>) => {
  try {
    memberFormSchema.parse(data);
    return { success: true, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: "خطأ في التحقق من البيانات" }] };
  }
};