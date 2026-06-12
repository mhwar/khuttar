"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { zEnum } from "@/lib/constants";
import {
  checkbox,
  optionalEmail,
  optionalInt,
  optionalText,
  parseForm,
  requiredEmail,
  text,
  type ActionState,
} from "@/lib/forms";

// ── Drivers ──────────────────────────────────────────────────

const driverSchema = z.object({
  id: optionalText,
  name: text(2),
  phone: text(9),
  city: optionalText,
  vehicleType: optionalText,
  vehiclePlate: optionalText,
  capacity: optionalInt,
  providerId: optionalText,
  notes: optionalText,
  active: checkbox,
});

export async function saveDriver(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(driverSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, active, providerId, ...data } = parsed.data;
  const payload = {
    ...data,
    providerId: providerId || null,
    status: active ? "ACTIVE" : "INACTIVE",
  };

  if (id) await db.driver.update({ where: { id }, data: payload });
  else await db.driver.create({ data: payload });

  revalidatePath("/admin/drivers");
  return { ok: true };
}

export async function deleteDriver(id: string) {
  await requireAdmin();
  try {
    await db.driver.delete({ where: { id } });
  } catch {
    return { ok: false, error: "تعذر الحذف" };
  }
  revalidatePath("/admin/drivers");
  return { ok: true };
}

// ── Service providers ────────────────────────────────────────

const providerSchema = z.object({
  id: optionalText,
  name: text(2),
  type: zEnum.providerType,
  contactName: optionalText,
  phone: optionalText,
  email: optionalEmail,
  city: optionalText,
  notes: optionalText,
  active: checkbox,
});

export async function saveProvider(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(providerSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, active, ...data } = parsed.data;
  const payload = { ...data, status: active ? "ACTIVE" : "INACTIVE" };

  if (id) await db.serviceProvider.update({ where: { id }, data: payload });
  else await db.serviceProvider.create({ data: payload });

  revalidatePath("/admin/providers");
  return { ok: true };
}

export async function deleteProvider(id: string) {
  await requireAdmin();
  try {
    await db.serviceProvider.delete({ where: { id } });
  } catch {
    return { ok: false, error: "تعذر الحذف" };
  }
  revalidatePath("/admin/providers");
  return { ok: true };
}

// ── Users (admin accounts) ───────────────────────────────────

const userSchema = z.object({
  id: optionalText,
  name: text(2),
  email: requiredEmail,
  password: optionalText,
  role: zEnum.userRole,
  active: checkbox,
});

export async function saveUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(userSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, password, active, ...data } = parsed.data;

  if (!id && (!password || password.length < 8)) {
    return {
      ok: false,
      fieldErrors: { password: "٨ أحرف على الأقل" },
      error: "تحقق من الحقول المظللة",
    };
  }
  if (id === admin.id && (!active || data.role !== "ADMIN")) {
    return { ok: false, error: "لا يمكنك تعطيل حسابك الحالي" };
  }

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing && existing.id !== id) {
    return {
      ok: false,
      fieldErrors: { email: "البريد مستخدم مسبقاً" },
      error: "تحقق من الحقول المظللة",
    };
  }

  const payload = {
    ...data,
    status: active ? "ACTIVE" : "DISABLED",
    ...(password && password.length >= 8
      ? { passwordHash: await hash(password, 10) }
      : {}),
  };

  if (id) {
    await db.user.update({ where: { id }, data: payload });
  } else {
    await db.user.create({
      data: { ...payload, passwordHash: await hash(password!, 10) },
    });
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

// ── Contact messages ─────────────────────────────────────────

const contactSchema = z.object({
  name: text(2),
  phone: text(9),
  email: optionalEmail,
  subject: optionalText,
  message: text(5),
});

export async function submitContactMessage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(contactSchema, formData);
  if (!parsed.success) return parsed.state;
  await db.contactMessage.create({ data: parsed.data });
  revalidatePath("/admin/messages");
  return { ok: true };
}

export async function markMessageRead(id: string, isRead: boolean) {
  await requireAdmin();
  await db.contactMessage.update({ where: { id }, data: { isRead } });
  revalidatePath("/admin/messages");
  return { ok: true };
}

// ── Site settings ────────────────────────────────────────────

const SETTING_KEYS = [
  "heroTitle",
  "heroSubtitle",
  "phone",
  "whatsapp",
  "email",
  "instagram",
  "x",
  "address",
] as const;

export async function saveSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  for (const key of SETTING_KEYS) {
    const value = formData.get(key);
    if (typeof value === "string") {
      await db.siteSetting.upsert({
        where: { key },
        update: { value: value.trim() },
        create: { key, value: value.trim() },
      });
    }
  }
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
  return { ok: true };
}
