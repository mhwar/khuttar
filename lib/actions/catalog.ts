"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { zEnum } from "@/lib/constants";
import {
  checkbox,
  optionalInt,
  optionalText,
  parseForm,
  text,
  type ActionState,
} from "@/lib/forms";
import { slugify } from "@/lib/utils";

async function uniqueSlug(
  table: "destination" | "program",
  base: string,
  excludeId?: string,
) {
  let slug = base;
  for (let i = 0; i < 10; i++) {
    const existing =
      table === "destination"
        ? await db.destination.findUnique({ where: { slug } })
        : await db.program.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function revalidateCatalog() {
  revalidatePath("/admin/destinations");
  revalidatePath("/destinations");
  revalidatePath("/");
}

// ── Destinations ──────────────────────────────────────────────

const destinationSchema = z.object({
  id: optionalText,
  name: text(),
  country: text(),
  type: zEnum.destinationType,
  slug: optionalText,
  description: optionalText,
  image: optionalText,
  featured: checkbox,
  active: checkbox,
  sortOrder: optionalInt,
});

export async function saveDestination(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(destinationSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, slug: slugInput, sortOrder, ...data } = parsed.data;

  if (id) {
    // Keep the existing slug unless one was explicitly provided.
    const slug = slugInput
      ? await uniqueSlug("destination", slugify(slugInput), id)
      : undefined;
    await db.destination.update({
      where: { id },
      data: { ...data, ...(slug ? { slug } : {}), sortOrder: sortOrder ?? 0 },
    });
  } else {
    const slug = await uniqueSlug(
      "destination",
      slugify(slugInput ?? data.name),
    );
    await db.destination.create({
      data: { ...data, slug, sortOrder: sortOrder ?? 0 },
    });
  }
  revalidateCatalog();
  return { ok: true };
}

export async function deleteDestination(id: string) {
  await requireAdmin();
  try {
    await db.destination.delete({ where: { id } });
  } catch {
    return { ok: false, error: "تعذر الحذف — تأكد من عدم وجود بيانات مرتبطة" };
  }
  revalidateCatalog();
  return { ok: true };
}

// ── Areas ─────────────────────────────────────────────────────

const areaSchema = z.object({
  id: optionalText,
  destinationId: text(),
  parentId: optionalText,
  kind: zEnum.areaKind,
  name: text(),
  description: optionalText,
  sortOrder: optionalInt,
});

export async function saveArea(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(areaSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, sortOrder, parentId, ...data } = parsed.data;

  if (id && parentId === id) {
    return { ok: false, error: "لا يمكن أن تتبع المنطقة نفسها" };
  }

  if (id) {
    await db.area.update({
      where: { id },
      data: { ...data, parentId, sortOrder: sortOrder ?? 0 },
    });
  } else {
    await db.area.create({
      data: { ...data, parentId, sortOrder: sortOrder ?? 0 },
    });
  }
  revalidatePath(`/admin/destinations/${data.destinationId}`);
  revalidateCatalog();
  return { ok: true };
}

export async function deleteArea(id: string) {
  await requireAdmin();
  try {
    await db.area.delete({ where: { id } });
  } catch {
    return { ok: false, error: "تعذر الحذف" };
  }
  revalidatePath("/admin/destinations");
  return { ok: true };
}

// ── Attractions ───────────────────────────────────────────────

const attractionSchema = z.object({
  id: optionalText,
  areaId: text(),
  name: text(),
  category: zEnum.attractionCategory,
  description: optionalText,
  image: optionalText,
  durationMin: optionalInt,
  costEstimate: optionalInt,
  active: checkbox,
});

export async function saveAttraction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(attractionSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;

  if (id) {
    await db.attraction.update({ where: { id }, data });
  } else {
    await db.attraction.create({ data });
  }
  revalidatePath("/admin/destinations");
  return { ok: true };
}

export async function deleteAttraction(id: string) {
  await requireAdmin();
  try {
    await db.attraction.delete({ where: { id } });
  } catch {
    return { ok: false, error: "تعذر الحذف" };
  }
  revalidatePath("/admin/destinations");
  return { ok: true };
}
