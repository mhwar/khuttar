"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireApprovedAgent } from "@/lib/auth";
import { bookingAgentAccess } from "@/lib/booking-access";
import { STUDY_MILESTONE_TEMPLATES, zEnum } from "@/lib/constants";
import {
  optionalDate,
  optionalText,
  parseForm,
  text,
  type ActionState,
} from "@/lib/forms";

function revalidateMilestones(bookingId: string, code: string) {
  revalidatePath(`/b/${code}`);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/agent/bookings/${bookingId}`);
}

// Admin or the booking's referral/manager agent may manage milestones.
async function authorizeBooking(bookingId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } });
  if (!booking) return null;
  if (user.role === "ADMIN") return booking;
  const { profile } = await requireApprovedAgent();
  return bookingAgentAccess(booking, profile.id) ? booking : null;
}

const milestoneSchema = z.object({
  id: optionalText,
  bookingId: text(),
  title: text(2),
  status: zEnum.milestoneStatus,
  note: optionalText,
  dueDate: optionalDate,
});

export async function saveMilestone(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(milestoneSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, bookingId, status, ...data } = parsed.data;

  const booking = await authorizeBooking(bookingId);
  if (!booking) return { ok: false, error: "غير مصرح" };

  const doneAt = status === "DONE" ? new Date() : null;

  if (id) {
    const existing = await db.bookingMilestone.findUnique({ where: { id } });
    if (!existing || existing.bookingId !== bookingId) {
      return { ok: false, error: "غير موجود" };
    }
    await db.bookingMilestone.update({
      where: { id },
      data: { ...data, status, doneAt },
    });
  } else {
    const count = await db.bookingMilestone.count({ where: { bookingId } });
    await db.bookingMilestone.create({
      data: { bookingId, status, doneAt, sortOrder: count, ...data },
    });
  }

  revalidateMilestones(bookingId, booking.code);
  return { ok: true };
}

export async function setMilestoneStatus(milestoneId: string, status: string) {
  if (!zEnum.milestoneStatus.safeParse(status).success) {
    return { ok: false, error: "حالة غير صالحة" };
  }
  const milestone = await db.bookingMilestone.findUnique({
    where: { id: milestoneId },
    include: { booking: { select: { id: true, code: true } } },
  });
  if (!milestone) return { ok: false, error: "غير موجود" };

  const booking = await authorizeBooking(milestone.bookingId);
  if (!booking) return { ok: false, error: "غير مصرح" };

  await db.bookingMilestone.update({
    where: { id: milestoneId },
    data: { status, doneAt: status === "DONE" ? new Date() : null },
  });
  revalidateMilestones(milestone.bookingId, milestone.booking.code);
  return { ok: true };
}

export async function deleteMilestone(milestoneId: string) {
  const milestone = await db.bookingMilestone.findUnique({
    where: { id: milestoneId },
    include: { booking: { select: { id: true, code: true } } },
  });
  if (!milestone) return { ok: false, error: "غير موجود" };

  const booking = await authorizeBooking(milestone.bookingId);
  if (!booking) return { ok: false, error: "غير مصرح" };

  await db.bookingMilestone.delete({ where: { id: milestoneId } });
  revalidateMilestones(milestone.bookingId, milestone.booking.code);
  return { ok: true };
}

// One-click default study checklist; idempotent (no-op if any milestone exists).
export async function seedDefaultStudyMilestones(bookingId: string) {
  const booking = await authorizeBooking(bookingId);
  if (!booking) return { ok: false, error: "غير مصرح" };

  const existing = await db.bookingMilestone.count({ where: { bookingId } });
  if (existing > 0) return { ok: true };

  await db.bookingMilestone.createMany({
    data: STUDY_MILESTONE_TEMPLATES.map((title, i) => ({
      bookingId,
      title,
      status: "PENDING",
      sortOrder: i,
    })),
  });
  revalidateMilestones(bookingId, booking.code);
  return { ok: true };
}
