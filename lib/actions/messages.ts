"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireApprovedAgent } from "@/lib/auth";
import { bookingAgentAccess } from "@/lib/booking-access";
import { parseForm, text, type ActionState } from "@/lib/forms";

function revalidateThread(bookingId: string, code: string) {
  revalidatePath(`/b/${code}`);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/agent/bookings/${bookingId}`);
}

// ── Customer posts from the public trip page (auth = knowing the code) ──

const customerMessageSchema = z.object({
  code: text(),
  body: text(1),
});

export async function postCustomerMessage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(customerMessageSchema, formData);
  if (!parsed.success) return parsed.state;
  const { code, body } = parsed.data;

  const booking = await db.bookingRequest.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!booking) return { ok: false, error: "لم نعثر على هذه الرحلة" };

  await db.bookingMessage.create({
    data: {
      bookingId: booking.id,
      authorRole: "CUSTOMER",
      authorName: booking.customerName,
      body,
      readByStaff: false,
    },
  });

  revalidateThread(booking.id, booking.code);
  return { ok: true };
}

// ── Staff (admin / managing agent) reply from the dashboard ──

const staffMessageSchema = z.object({
  bookingId: text(),
  body: text(1),
});

export async function postStaffMessage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مصرح" };

  const parsed = parseForm(staffMessageSchema, formData);
  if (!parsed.success) return parsed.state;
  const { bookingId, body } = parsed.data;

  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, error: "الحجز غير موجود" };

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    const { profile } = await requireApprovedAgent();
    if (!bookingAgentAccess(booking, profile.id)) {
      return { ok: false, error: "غير مصرح" };
    }
  }

  await db.$transaction([
    db.bookingMessage.create({
      data: {
        bookingId,
        authorRole: isAdmin ? "ADMIN" : "AGENT",
        authorName: user.name,
        body,
        readByStaff: true,
      },
    }),
    // Mark the customer's messages as seen by staff.
    db.bookingMessage.updateMany({
      where: { bookingId, authorRole: "CUSTOMER", readByStaff: false },
      data: { readByStaff: true },
    }),
  ]);

  revalidateThread(bookingId, booking.code);
  return { ok: true };
}
