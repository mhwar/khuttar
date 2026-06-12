import { z } from "zod";

export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// FormData → plain object. Checkboxes arrive as "on"/missing; empty strings
// are kept so schemas can decide between "clear" and "ignore".
export function formToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") obj[key] = value;
  }
  return obj;
}

const AR_INVALID = "قيمة غير صالحة";
const AR_REQUIRED = "هذا الحقل مطلوب";

export function parseForm<S extends z.ZodType>(
  schema: S,
  formData: FormData,
):
  | { success: true; data: z.output<S> }
  | { success: false; state: ActionState } {
  const result = schema.safeParse(formToObject(formData));
  if (result.success) return { success: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fieldErrors[key]) {
      fieldErrors[key] =
        issue.code === "invalid_type" || issue.code === "too_small"
          ? AR_REQUIRED
          : issue.message && /[؀-ۿ]/.test(issue.message)
            ? issue.message
            : AR_INVALID;
    }
  }
  return {
    success: false,
    state: { ok: false, error: "تحقق من الحقول المظللة", fieldErrors },
  };
}

// ── Reusable field shapes ──────────────────────────────────────────

export const text = (min = 1) => z.string().trim().min(min, AR_REQUIRED);

export const optionalText = z
  .string()
  .optional()
  .transform((v) => {
    const t = v?.trim();
    return t ? t : null;
  });

export const optionalInt = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const t = v?.trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      ctx.addIssue({ code: "custom", message: AR_INVALID });
      return z.NEVER;
    }
    return n;
  });

export const requiredInt = (min = 0) =>
  z.string().transform((v, ctx) => {
    const n = Number(v?.trim());
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < min) {
      ctx.addIssue({ code: "custom", message: AR_INVALID });
      return z.NEVER;
    }
    return n;
  });

export const requiredFloat = (min = 0, max = 100) =>
  z.string().transform((v, ctx) => {
    const n = Number(v?.trim());
    if (!Number.isFinite(n) || n < min || n > max) {
      ctx.addIssue({ code: "custom", message: AR_INVALID });
      return z.NEVER;
    }
    return n;
  });

export const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

export const optionalDate = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const t = v?.trim();
    if (!t) return null;
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: AR_INVALID });
      return z.NEVER;
    }
    return d;
  });

export const requiredDate = z.string().transform((v, ctx) => {
  const d = new Date(v?.trim());
  if (!v?.trim() || Number.isNaN(d.getTime())) {
    ctx.addIssue({ code: "custom", message: AR_REQUIRED });
    return z.NEVER;
  }
  return d;
});

export const optionalEmail = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const t = v?.trim().toLowerCase();
    if (!t) return null;
    if (!z.email().safeParse(t).success) {
      ctx.addIssue({ code: "custom", message: AR_INVALID });
      return z.NEVER;
    }
    return t;
  });

export const requiredEmail = z.string().transform((v, ctx) => {
  const t = v?.trim().toLowerCase();
  if (!t || !z.email().safeParse(t).success) {
    ctx.addIssue({ code: "custom", message: "بريد إلكتروني غير صالح" });
    return z.NEVER;
  }
  return t;
});

// "HH:mm" or empty.
export const optionalTime = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const t = v?.trim();
    if (!t) return null;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) {
      ctx.addIssue({ code: "custom", message: AR_INVALID });
      return z.NEVER;
    }
    return t;
  });
