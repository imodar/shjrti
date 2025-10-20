export const GENDER_OPTIONS = [
  { value: "male", label: "ذكر" },
  { value: "female", label: "أنثى" }
] as const;

export const MARITAL_STATUS_OPTIONS = [
  { value: "single", label: "أعزب" },
  { value: "married", label: "متزوج" },
  { value: "divorced", label: "مطلق" },
  { value: "widowed", label: "أرمل" }
] as const;

export const FORM_MODES = {
  VIEW: 'view',
  ADD: 'add',
  EDIT: 'edit',
  PROFILE: 'profile',
  TREE_SETTINGS: 'tree-settings'
} as const;

export const FORM_STEPS = {
  BASIC_INFO: 1,
  ADDITIONAL_INFO: 2,
  SPOUSE_INFO: 3
} as const;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const GENERATION_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))"
];

export const ERROR_MESSAGES = {
  FETCH_FAMILY: "خطأ في تحميل بيانات العائلة",
  FETCH_MEMBERS: "خطأ في تحميل الأعضاء",
  FETCH_MARRIAGES: "خطأ في تحميل الزيجات",
  ADD_MEMBER: "فشل في إضافة العضو",
  UPDATE_MEMBER: "فشل في تحديث العضو",
  DELETE_MEMBER: "فشل في حذف العضو",
  UPLOAD_IMAGE: "فشل في رفع الصورة",
  DELETE_IMAGE: "فشل في حذف الصورة",
  GENERIC: "حدث خطأ غير متوقع"
} as const;