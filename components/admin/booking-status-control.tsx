"use client";

import * as React from "react";
import { toast } from "sonner";
import { setBookingStatus } from "@/lib/actions/bookings";
import {
  ADMIN_ONLY_BOOKING_STATUSES,
  BOOKING_TRANSITIONS,
  LABELS,
  type BookingStatus,
} from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { Button } from "@/components/ui/button";

export function BookingStatusControl({
  bookingId,
  status,
  isAdmin,
}: {
  bookingId: string;
  status: string;
  isAdmin: boolean;
}) {
  const [pending, startTransition] = React.useTransition();
  const transitions = (BOOKING_TRANSITIONS[status as BookingStatus] ?? []).filter(
    (next) => isAdmin || !ADMIN_ONLY_BOOKING_STATUSES.includes(next),
  );

  if (transitions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {transitions.map((next) => (
        <Button
          key={next}
          size="sm"
          disabled={pending}
          variant={next === "CANCELLED" ? "destructive" : "default"}
          onClick={() =>
            startTransition(async () => {
              const result = await setBookingStatus(bookingId, next);
              if (result.ok) toast.success(ar.booking.statusUpdated);
              else toast.error(result.error ?? ar.misc.error);
            })
          }
        >
          {LABELS.bookingStatus[next]}
        </Button>
      ))}
    </div>
  );
}
