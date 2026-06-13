import { z } from "zod";

// String pseudo-enums (Postgres/SQLite portable). Every write goes through
// zod validation in server actions, so these are the source of truth.

export const USER_ROLES = ["ADMIN", "AGENT"] as const;
export const USER_STATUSES = ["ACTIVE", "DISABLED"] as const;
export const AGENT_STATUSES = ["PENDING", "APPROVED", "SUSPENDED"] as const;
export const APPLICATION_STATUSES = ["NEW", "APPROVED", "REJECTED"] as const;
export const DESTINATION_TYPES = ["DOMESTIC", "INTERNATIONAL"] as const;
export const AREA_KINDS = [
  "REGION",
  "PROVINCE",
  "GOVERNORATE",
  "CITY",
  "DISTRICT",
  "OTHER",
] as const;
export const ATTRACTION_CATEGORIES = [
  "LANDMARK",
  "MUSEUM",
  "RESTAURANT",
  "PARK",
  "MALL",
  "ACTIVITY",
  "OTHER",
] as const;
export const PROGRAM_CATEGORIES = ["TOUR", "STUDY"] as const;
export const PROGRAM_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const PROGRAM_VISIBILITIES = ["PUBLIC", "UNLISTED", "PRIVATE"] as const;
export const TOUR_TYPES = ["DOMESTIC", "INTERNATIONAL"] as const;
export const STUDY_KINDS = ["LANGUAGE", "UNIVERSITY", "SCHOLARSHIP"] as const;
export const ITEM_TYPES = [
  "ACTIVITY",
  "TRANSPORT",
  "HOTEL",
  "MEAL",
  "FLIGHT",
  "FREE_TIME",
  "OTHER",
] as const;
export const BOOKING_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;
export const BOOKING_SOURCES = ["WEBSITE", "AGENT", "ADMIN"] as const;
export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD", "OTHER"] as const;
export const TRANSFER_STATUSES = [
  "REQUESTED",
  "ASSIGNED",
  "COMPLETED",
  "CANCELLED",
] as const;
export const PROVIDER_TYPES = ["TRANSPORT", "HOTEL", "OTHER"] as const;
export const LEDGER_TYPES = [
  "COMMISSION",
  "PLATFORM_FEE",
  "PAYOUT",
  "ADJUSTMENT",
] as const;
export const MESSAGE_AUTHOR_ROLES = ["CUSTOMER", "AGENT", "ADMIN"] as const;
export const MILESTONE_STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;

// Default checklist created for STUDY bookings after purchase.
export const STUDY_MILESTONE_TEMPLATES = [
  "تجهيز الملف والمستندات",
  "تقديم طلب القبول",
  "استلام خطاب القبول",
  "إجراءات التأشيرة الدراسية",
  "تأمين السكن",
  "حجز الطيران والاستقبال",
  "الوصول وبدء الدراسة",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type ItemType = (typeof ITEM_TYPES)[number];
export type LedgerType = (typeof LEDGER_TYPES)[number];
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const zEnum = {
  userRole: z.enum(USER_ROLES),
  agentStatus: z.enum(AGENT_STATUSES),
  destinationType: z.enum(DESTINATION_TYPES),
  areaKind: z.enum(AREA_KINDS),
  attractionCategory: z.enum(ATTRACTION_CATEGORIES),
  programCategory: z.enum(PROGRAM_CATEGORIES),
  programStatus: z.enum(PROGRAM_STATUSES),
  programVisibility: z.enum(PROGRAM_VISIBILITIES),
  tourType: z.enum(TOUR_TYPES),
  studyKind: z.enum(STUDY_KINDS),
  itemType: z.enum(ITEM_TYPES),
  bookingStatus: z.enum(BOOKING_STATUSES),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transferStatus: z.enum(TRANSFER_STATUSES),
  providerType: z.enum(PROVIDER_TYPES),
  ledgerType: z.enum(LEDGER_TYPES),
  messageAuthorRole: z.enum(MESSAGE_AUTHOR_ROLES),
  milestoneStatus: z.enum(MILESTONE_STATUSES),
};

// Allowed booking status transitions. Agents may advance their own bookings
// up to QUOTED; CONFIRMED / COMPLETED / CANCELLED stay admin-only so money
// movements remain under admin control.
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  NEW: ["CONTACTED", "CANCELLED"],
  CONTACTED: ["QUOTED", "CANCELLED"],
  QUOTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const ADMIN_ONLY_BOOKING_STATUSES: BookingStatus[] = [
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

// ─── Arabic labels ───────────────────────────────────────────────

export const LABELS = {
  userRole: { ADMIN: "مدير", AGENT: "وكيل" },
  userStatus: { ACTIVE: "نشط", DISABLED: "معطّل" },
  agentStatus: { PENDING: "بانتظار الاعتماد", APPROVED: "معتمد", SUSPENDED: "موقوف" },
  applicationStatus: { NEW: "جديد", APPROVED: "مقبول", REJECTED: "مرفوض" },
  destinationType: { DOMESTIC: "داخلية", INTERNATIONAL: "خارجية" },
  areaKind: {
    REGION: "منطقة",
    PROVINCE: "إمارة/ولاية",
    GOVERNORATE: "محافظة",
    CITY: "مدينة",
    DISTRICT: "حي",
    OTHER: "أخرى",
  },
  attractionCategory: {
    LANDMARK: "معلم",
    MUSEUM: "متحف",
    RESTAURANT: "مطعم",
    PARK: "حديقة/طبيعة",
    MALL: "تسوق",
    ACTIVITY: "نشاط",
    OTHER: "أخرى",
  },
  programCategory: { TOUR: "برنامج سياحي", STUDY: "برنامج دراسي" },
  programStatus: { DRAFT: "مسودة", PUBLISHED: "منشور", ARCHIVED: "مؤرشف" },
  programVisibility: { PUBLIC: "عام", UNLISTED: "بالرابط فقط", PRIVATE: "خاص" },
  tourType: { DOMESTIC: "داخلي", INTERNATIONAL: "خارجي" },
  studyKind: { LANGUAGE: "لغة", UNIVERSITY: "جامعي", SCHOLARSHIP: "ابتعاث" },
  itemType: {
    ACTIVITY: "نشاط",
    TRANSPORT: "تنقّل",
    HOTEL: "فندق",
    MEAL: "وجبة",
    FLIGHT: "طيران",
    FREE_TIME: "وقت حر",
    OTHER: "أخرى",
  },
  bookingStatus: {
    NEW: "جديد",
    CONTACTED: "تم التواصل",
    QUOTED: "تم التسعير",
    CONFIRMED: "مؤكد",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
  },
  bookingSource: { WEBSITE: "الموقع", AGENT: "وكيل", ADMIN: "الإدارة" },
  paymentMethod: {
    CASH: "نقداً",
    BANK_TRANSFER: "تحويل بنكي",
    CARD: "بطاقة",
    OTHER: "أخرى",
  },
  transferStatus: {
    REQUESTED: "مطلوب",
    ASSIGNED: "تم الإسناد",
    COMPLETED: "منفّذ",
    CANCELLED: "ملغي",
  },
  providerType: { TRANSPORT: "نقل", HOTEL: "فنادق", OTHER: "خدمات أخرى" },
  ledgerType: {
    COMMISSION: "عمولة",
    PLATFORM_FEE: "رسوم المنصة",
    PAYOUT: "دفعة للوكيل",
    ADJUSTMENT: "تسوية",
  },
  driverStatus: { ACTIVE: "نشط", INACTIVE: "غير نشط" },
  messageAuthorRole: { CUSTOMER: "العميل", AGENT: "الوكيل", ADMIN: "الإدارة" },
  milestoneStatus: {
    PENDING: "بانتظار",
    IN_PROGRESS: "قيد التنفيذ",
    DONE: "مكتمل",
  },
} as const;

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const BOOKING_STATUS_VARIANTS: Record<BookingStatus, BadgeVariant> = {
  NEW: "default",
  CONTACTED: "secondary",
  QUOTED: "secondary",
  CONFIRMED: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export const MILESTONE_STATUS_VARIANTS: Record<MilestoneStatus, BadgeVariant> = {
  PENDING: "outline",
  IN_PROGRESS: "secondary",
  DONE: "default",
};

export function labelOf<T extends keyof typeof LABELS>(
  group: T,
  key: string | null | undefined,
): string {
  if (!key) return "—";
  const map = LABELS[group] as Record<string, string>;
  return map[key] ?? key;
}
