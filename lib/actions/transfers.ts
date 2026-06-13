"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin, requireApprovedAgent } from "@/lib/auth";
import { bookingAgentAccess } from "@/lib/booking-access";
import { zEnum } from "@/lib/constants";
import {
  optionalInt,
  optionalText,
  optionalTime,
  parseForm,
  requiredDate,
  requiredInt,
  text,
  type ActionState,
} from "@/lib/forms";

function revalidateTransfers(bookingId: string, code?: string) {
  revalidatePath("/admin/transfers");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/agent/bookings/${bookingId}`);
  if (code) revalidatePath(`/b/${code}`);
}

// Agents may request transfers on their own bookings; admin manages all and
// assigns drivers/providers.
const transferSchema = z.object({
  id: optionalText,
  bookingId: text(),
  date: requiredDate,
  time: optionalTime,
  fromLocation: text(),
  toLocation: text(),
  pax: requiredInt(1),
  vehicleType: optionalText,
  driverId: optionalText,
  providerId: optionalText,
  price: optionalInt,
  notes: optionalText,
});

export async function saveTransfer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مصرح" };

  const parsed = parseForm(transferSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, bookingId, driverId, providerId, price, ...data } = parsed.data;

  const booking = await db.bookingRequest.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false, error: "الحجز غير موجود" };

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    const { profile } = await requireApprovedAgent();
    if (!bookingAgentAccess(booking, profile.id)) {
      return { ok: false, error: "غير مصرح" };
    }
  }

  // Assignment fields are admin-only; agent submissions stay REQUESTED.
  const assignment = isAdmin
    ? {
        driverId: driverId || null,
        providerId: providerId || null,
        price,
        ...(driverId || providerId ? { status: "ASSIGNED" } : {}),
      }
    : {};

  if (id) {
    const existing = await db.transfer.findUnique({ where: { id } });
    if (!existing || existing.bookingId !== bookingId) {
      return { ok: false, error: "غير موجود" };
    }
    await db.transfer.update({ where: { id }, data: { ...data, ...assignment } });
  } else {
    await db.transfer.create({
      data: { bookingId, ...data, ...assignment },
    });
  }

  revalidateTransfers(bookingId, booking.code);
  return { ok: true };
}

export async function setTransferStatus(
  transferId: string,
  status: string,
): Promise<ActionState> {
  await requireAdmin();
  if (!zEnum.transferStatus.safeParse(status).success) {
    return { ok: false, error: "حالة غير صالحة" };
  }
  const transfer = await db.transfer.findUnique({
    where: { id: transferId },
    include: { booking: true },
  });
  if (!transfer) return { ok: false, error: "غير موجود" };

  await db.transfer.update({ where: { id: transferId }, data: { status } });
  revalidateTransfers(transfer.bookingId, transfer.booking.code);
  return { ok: true };
}

export async function assignTransfer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const schema = z.object({
    id: text(),
    driverId: optionalText,
    providerId: optionalText,
    price: optionalInt,
  });
  const parsed = parseForm(schema, formData);
  if (!parsed.success) return parsed.state;
  const { id, driverId, providerId, price } = parsed.data;

  const transfer = await db.transfer.findUnique({
    where: { id },
    include: { booking: true },
  });
  if (!transfer) return { ok: false, error: "غير موجود" };

  await db.transfer.update({
    where: { id },
    data: {
      driverId: driverId || null,
      providerId: providerId || null,
      price,
      status: driverId || providerId ? "ASSIGNED" : "REQUESTED",
    },
  });
  revalidateTransfers(transfer.bookingId, transfer.booking.code);
  return { ok: true };
}

export async function deleteTransfer(transferId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مصرح" };
  const transfer = await db.transfer.findUnique({
    where: { id: transferId },
    include: { booking: true },
  });
  if (!transfer) return { ok: false, error: "غير موجود" };

  if (user.role === "AGENT") {
    const { profile } = await requireApprovedAgent();
    if (!bookingAgentAccess(transfer.booking, profile.id) || transfer.status !== "REQUESTED") {
      return { ok: false, error: "غير مصرح" };
    }
  }

  await db.transfer.delete({ where: { id: transferId } });
  revalidateTransfers(transfer.bookingId, transfer.booking.code);
  return { ok: true };
}
