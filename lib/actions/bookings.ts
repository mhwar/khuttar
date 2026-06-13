"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin, requireApprovedAgent } from "@/lib/auth";
import { bookingAgentAccess } from "@/lib/booking-access";
import {
  ADMIN_ONLY_BOOKING_STATUSES,
  BOOKING_TRANSITIONS,
  zEnum,
  type BookingStatus,
} from "@/lib/constants";
import {
  optionalDate,
  optionalEmail,
  optionalInt,
  optionalText,
  parseForm,
  requiredInt,
  text,
  type ActionState,
} from "@/lib/forms";
import { generateBookingCode } from "@/lib/utils";
import { ar } from "@/lib/i18n/ar";

function revalidateBookings(bookingCode?: string) {
  revalidatePath("/admin/bookings");
  revalidatePath("/agent/bookings");
  revalidatePath("/admin/transfers");
  if (bookingCode) revalidatePath(`/b/${bookingCode}`);
}

async function createWithUniqueCode(
  data: Omit<Prisma.BookingRequestUncheckedCreateInput, "code">,
) {
  for (let i = 0; i < 5; i++) {
    try {
      return await db.bookingRequest.create({
        data: { ...data, code: generateBookingCode() },
      });
    } catch (error) {
      const isUniqueViolation =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002";
      if (!isUniqueViolation || i === 4) throw error;
    }
  }
  throw new Error("unreachable");
}

// ── Public booking request (no auth) ─────────────────────────

const publicBookingSchema = z.object({
  programId: text(),
  ref: optionalText,
  customerName: text(2),
  customerPhone: text(9),
  customerEmail: optionalEmail,
  adults: requiredInt(1),
  children: optionalInt,
  preferredDate: optionalDate,
  customerNotes: optionalText,
});

export type PublicBookingState = ActionState & {
  code?: string;
};

export async function submitPublicBooking(
  _prev: PublicBookingState,
  formData: FormData,
): Promise<PublicBookingState> {
  const parsed = parseForm(publicBookingSchema, formData);
  if (!parsed.success) return parsed.state;
  const { programId, ref, children, ...data } = parsed.data;

  const program = await db.program.findUnique({ where: { id: programId } });
  if (!program || program.status !== "PUBLISHED") {
    return { ok: false, error: "البرنامج غير متاح حالياً" };
  }

  // Referral attribution: agent's own programs always attribute to the owner;
  // otherwise an APPROVED agent referral code on the link wins. Invalid codes
  // are silently ignored.
  let agentId: string | null = program.ownerAgentId;
  if (!agentId && ref) {
    const agent = await db.agentProfile.findUnique({
      where: { referralCode: ref.toUpperCase() },
    });
    if (agent && agent.status === "APPROVED") agentId = agent.id;
  }

  const booking = await createWithUniqueCode({
    programId: program.id,
    programTitle: program.title,
    agentId,
    source: "WEBSITE",
    children: children ?? 0,
    ...data,
  });

  revalidateBookings();
  return { ok: true, code: booking.code };
}

// ── Internal creation (admin / agent dashboards) ─────────────

const internalBookingSchema = z.object({
  programId: optionalText,
  customerName: text(2),
  customerPhone: text(9),
  customerEmail: optionalEmail,
  adults: requiredInt(1),
  children: optionalInt,
  preferredDate: optionalDate,
  totalPrice: optionalInt,
  customerNotes: optionalText,
  internalNotes: optionalText,
  agentId: optionalText,
});

export async function createInternalBooking(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مصرح" };

  const parsed = parseForm(internalBookingSchema, formData);
  if (!parsed.success) return parsed.state;
  const { programId, agentId, children, ...data } = parsed.data;

  let source = "ADMIN";
  let finalAgentId = agentId;
  if (user.role === "AGENT") {
    const { profile } = await requireApprovedAgent();
    source = "AGENT";
    finalAgentId = profile.id;
  }

  let programTitle: string | null = null;
  if (programId) {
    const program = await db.program.findUnique({ where: { id: programId } });
    if (!program) return { ok: false, error: "البرنامج غير موجود" };
    programTitle = program.title;
  }

  await createWithUniqueCode({
    programId: programId || null,
    programTitle,
    agentId: finalAgentId || null,
    source,
    children: children ?? 0,
    ...data,
  });

  revalidateBookings();
  return { ok: true };
}

// ── Booking detail updates ───────────────────────────────────

const bookingUpdateSchema = z.object({
  id: text(),
  totalPrice: optionalInt,
  preferredDate: optionalDate,
  internalNotes: optionalText,
  agentId: optionalText,
  managerAgentId: optionalText,
  assignedToId: optionalText,
});

export async function updateBooking(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مصرح" };

  const parsed = parseForm(bookingUpdateSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, agentId, managerAgentId, assignedToId, ...data } = parsed.data;

  const booking = await db.bookingRequest.findUnique({ where: { id } });
  if (!booking) return { ok: false, error: "الحجز غير موجود" };

  if (user.role === "AGENT") {
    const { profile } = await requireApprovedAgent();
    if (!bookingAgentAccess(booking, profile.id)) {
      return { ok: false, error: "غير مصرح" };
    }
    // Agents can adjust price/date/notes but not reassignment fields.
    await db.bookingRequest.update({ where: { id }, data });
  } else {
    await db.bookingRequest.update({
      where: { id },
      data: {
        ...data,
        agentId: agentId || null,
        managerAgentId: managerAgentId || null,
        assignedToId: assignedToId || null,
      },
    });
  }

  revalidateBookings(booking.code);
  return { ok: true };
}

// ── Status transitions + idempotent ledger ───────────────────

export async function setBookingStatus(
  bookingId: string,
  next: BookingStatus,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مصرح" };

  if (!zEnum.bookingStatus.safeParse(next).success) {
    return { ok: false, error: "حالة غير صالحة" };
  }

  const booking = await db.bookingRequest.findUnique({
    where: { id: bookingId },
    include: { agent: true, managerAgent: true },
  });
  if (!booking) return { ok: false, error: "الحجز غير موجود" };

  if (user.role === "AGENT") {
    const { profile } = await requireApprovedAgent();
    if (!bookingAgentAccess(booking, profile.id)) {
      return { ok: false, error: "غير مصرح" };
    }
    if (ADMIN_ONLY_BOOKING_STATUSES.includes(next)) {
      return { ok: false, error: "هذه الحالة من صلاحيات الإدارة" };
    }
  }

  const allowed = BOOKING_TRANSITIONS[booking.status as BookingStatus] ?? [];
  if (!allowed.includes(next)) {
    return { ok: false, error: "انتقال غير مسموح من الحالة الحالية" };
  }

  if (next === "CONFIRMED") {
    if (!booking.totalPrice || booking.totalPrice <= 0) {
      return { ok: false, error: ar.booking.setPriceFirst };
    }

    await db.$transaction(async (tx) => {
      await tx.bookingRequest.update({
        where: { id: bookingId },
        data: { status: next, confirmedAt: new Date() },
      });

      // Idempotent: ledger entries are generated at most once per agent per
      // booking, even across cancel → re-confirm cycles. Scoped by agentId so
      // the referral and manager entries don't shadow each other.
      const total = booking.totalPrice!;

      // Referral agent: full commission minus the platform fee.
      if (booking.agentId && booking.agent?.status === "APPROVED") {
        const existing = await tx.ledgerEntry.findFirst({
          where: {
            bookingId,
            agentId: booking.agentId,
            type: { in: ["COMMISSION", "PLATFORM_FEE"] },
          },
        });
        if (!existing) {
          const commission = Math.round(
            (total * booking.agent.commissionRate) / 100,
          );
          const fee = Math.round((total * booking.agent.platformFeeRate) / 100);
          await tx.ledgerEntry.createMany({
            data: [
              {
                agentId: booking.agentId,
                bookingId,
                type: "COMMISSION",
                amount: commission,
                note: `عمولة حجز ${booking.code}`,
                createdById: user.id,
              },
              {
                agentId: booking.agentId,
                bookingId,
                type: "PLATFORM_FEE",
                amount: -fee,
                note: `رسوم المنصة عن حجز ${booking.code}`,
                createdById: user.id,
              },
            ],
          });
        }
      }

      // Delegated manager (platform's own customer): a management commission at
      // a separate rate, with no platform fee. Skipped when the manager is also
      // the referral agent to avoid double-paying.
      if (
        booking.managerAgentId &&
        booking.managerAgentId !== booking.agentId &&
        booking.managerAgent?.status === "APPROVED"
      ) {
        const existing = await tx.ledgerEntry.findFirst({
          where: {
            bookingId,
            agentId: booking.managerAgentId,
            type: "COMMISSION",
          },
        });
        if (!existing) {
          const manageFee = Math.round(
            (total * booking.managerAgent.manageCommissionRate) / 100,
          );
          await tx.ledgerEntry.create({
            data: {
              agentId: booking.managerAgentId,
              bookingId,
              type: "COMMISSION",
              amount: manageFee,
              note: `عمولة إدارة حجز ${booking.code}`,
              createdById: user.id,
            },
          });
        }
      }
    });
  } else {
    await db.bookingRequest.update({
      where: { id: bookingId },
      data: { status: next },
    });
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/agent/bookings/${bookingId}`);
  revalidatePath("/admin/agents");
  revalidatePath("/agent/statement");
  revalidateBookings(booking.code);
  return { ok: true };
}

// ── Payments ─────────────────────────────────────────────────

const paymentSchema = z.object({
  bookingId: text(),
  amount: requiredInt(1),
  method: zEnum.paymentMethod,
  reference: optionalText,
  paidAt: optionalDate,
  notes: optionalText,
});

export async function addPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();

  const parsed = parseForm(paymentSchema, formData);
  if (!parsed.success) return parsed.state;
  const { bookingId, paidAt, ...data } = parsed.data;

  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, error: "الحجز غير موجود" };

  await db.payment.create({
    data: {
      bookingId,
      paidAt: paidAt ?? new Date(),
      recordedById: user.id,
      ...data,
    },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidateBookings(booking.code);
  return { ok: true };
}

export async function deletePayment(paymentId: string) {
  await requireAdmin();
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment) return { ok: false, error: "غير موجود" };
  await db.payment.delete({ where: { id: paymentId } });
  revalidatePath(`/admin/bookings/${payment.bookingId}`);
  revalidateBookings(payment.booking.code);
  return { ok: true };
}
