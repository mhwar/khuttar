"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireApprovedAgent } from "@/lib/auth";
import { zEnum } from "@/lib/constants";
import {
  optionalInt,
  optionalText,
  optionalTime,
  parseForm,
  text,
  type ActionState,
} from "@/lib/forms";

// Resolves the program and enforces ownership: admin edits anything, an
// approved agent edits only their own programs.
async function authorizeProgram(programId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const program = await db.program.findUnique({ where: { id: programId } });
  if (!program) return null;
  if (user.role === "ADMIN") return program;
  const { profile } = await requireApprovedAgent();
  return program.ownerAgentId === profile.id ? program : null;
}

function revalidateItinerary(programId: string) {
  revalidatePath(`/admin/programs/${programId}/itinerary`);
  revalidatePath(`/agent/programs/${programId}/itinerary`);
  revalidatePath("/programs");
}

// ── Days ──────────────────────────────────────────────────────

const daySchema = z.object({
  id: optionalText,
  programId: text(),
  title: text(),
  description: optionalText,
});

export async function saveDay(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(daySchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, programId, ...data } = parsed.data;

  const program = await authorizeProgram(programId);
  if (!program) return { ok: false, error: "غير مصرح" };

  if (id) {
    await db.itineraryDay.update({ where: { id }, data });
  } else {
    const max = await db.itineraryDay.aggregate({
      where: { programId },
      _max: { dayNumber: true },
    });
    await db.itineraryDay.create({
      data: { ...data, programId, dayNumber: (max._max.dayNumber ?? 0) + 1 },
    });
  }
  revalidateItinerary(programId);
  return { ok: true };
}

export async function deleteDay(dayId: string) {
  const day = await db.itineraryDay.findUnique({ where: { id: dayId } });
  if (!day) return { ok: false, error: "غير موجود" };
  const program = await authorizeProgram(day.programId);
  if (!program) return { ok: false, error: "غير مصرح" };

  await db.$transaction(async (tx) => {
    await tx.itineraryDay.delete({ where: { id: dayId } });
    const rest = await tx.itineraryDay.findMany({
      where: { programId: day.programId, dayNumber: { gt: day.dayNumber } },
      orderBy: { dayNumber: "asc" },
    });
    for (const d of rest) {
      await tx.itineraryDay.update({
        where: { id: d.id },
        data: { dayNumber: d.dayNumber - 1 },
      });
    }
  });
  revalidateItinerary(day.programId);
  return { ok: true };
}

export async function moveDay(dayId: string, direction: "up" | "down") {
  const day = await db.itineraryDay.findUnique({ where: { id: dayId } });
  if (!day) return { ok: false, error: "غير موجود" };
  const program = await authorizeProgram(day.programId);
  if (!program) return { ok: false, error: "غير مصرح" };

  const targetNumber = direction === "up" ? day.dayNumber - 1 : day.dayNumber + 1;
  const neighbor = await db.itineraryDay.findUnique({
    where: {
      programId_dayNumber: { programId: day.programId, dayNumber: targetNumber },
    },
  });
  if (!neighbor) return { ok: true };

  // Three-step swap to respect the unique (programId, dayNumber) constraint.
  await db.$transaction(async (tx) => {
    await tx.itineraryDay.update({ where: { id: day.id }, data: { dayNumber: -1 } });
    await tx.itineraryDay.update({
      where: { id: neighbor.id },
      data: { dayNumber: day.dayNumber },
    });
    await tx.itineraryDay.update({
      where: { id: day.id },
      data: { dayNumber: targetNumber },
    });
  });
  revalidateItinerary(day.programId);
  return { ok: true };
}

// ── Items ─────────────────────────────────────────────────────

const itemSchema = z.object({
  id: optionalText,
  dayId: text(),
  type: zEnum.itemType,
  title: text(),
  notes: optionalText,
  startTime: optionalTime,
  durationMin: optionalInt,
  areaId: optionalText,
  attractionId: optionalText,
});

export async function saveItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(itemSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, dayId, ...data } = parsed.data;

  const day = await db.itineraryDay.findUnique({ where: { id: dayId } });
  if (!day) return { ok: false, error: "اليوم غير موجود" };
  const program = await authorizeProgram(day.programId);
  if (!program) return { ok: false, error: "غير مصرح" };

  if (id) {
    await db.itineraryItem.update({ where: { id }, data });
  } else {
    const max = await db.itineraryItem.aggregate({
      where: { dayId },
      _max: { sortOrder: true },
    });
    await db.itineraryItem.create({
      data: { ...data, dayId, sortOrder: (max._max.sortOrder ?? 0) + 1 },
    });
  }
  revalidateItinerary(day.programId);
  return { ok: true };
}

export async function deleteItem(itemId: string) {
  const item = await db.itineraryItem.findUnique({
    where: { id: itemId },
    include: { day: true },
  });
  if (!item) return { ok: false, error: "غير موجود" };
  const program = await authorizeProgram(item.day.programId);
  if (!program) return { ok: false, error: "غير مصرح" };

  await db.itineraryItem.delete({ where: { id: itemId } });
  revalidateItinerary(item.day.programId);
  return { ok: true };
}

export async function moveItem(itemId: string, direction: "up" | "down") {
  const item = await db.itineraryItem.findUnique({
    where: { id: itemId },
    include: { day: true },
  });
  if (!item) return { ok: false, error: "غير موجود" };
  const program = await authorizeProgram(item.day.programId);
  if (!program) return { ok: false, error: "غير مصرح" };

  const siblings = await db.itineraryItem.findMany({
    where: { dayId: item.dayId },
    orderBy: { sortOrder: "asc" },
  });
  const index = siblings.findIndex((s) => s.id === itemId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) return { ok: true };
  const neighbor = siblings[targetIndex];

  await db.$transaction([
    db.itineraryItem.update({
      where: { id: item.id },
      data: { sortOrder: neighbor.sortOrder },
    }),
    db.itineraryItem.update({
      where: { id: neighbor.id },
      data: { sortOrder: item.sortOrder },
    }),
  ]);
  revalidateItinerary(item.day.programId);
  return { ok: true };
}
