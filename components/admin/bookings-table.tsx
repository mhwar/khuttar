import Link from "next/link";
import { labelOf } from "@/lib/constants";
import { formatDate, formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { BookingStatusBadge, EmptyState } from "@/components/shared/misc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Prisma } from "@prisma/client";

type BookingRow = Prisma.BookingRequestGetPayload<{
  include: { agent: { include: { user: { select: { name: true } } } } };
}>;

export function BookingsTable({
  bookings,
  basePath,
  showAgent,
}: {
  bookings: BookingRow[];
  basePath: "/admin" | "/agent";
  showAgent: boolean;
}) {
  if (bookings.length === 0) {
    return <EmptyState message="لا توجد حجوزات مطابقة" />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{ar.fields.code}</TableHead>
          <TableHead>{ar.fields.customer}</TableHead>
          <TableHead>{ar.fields.program}</TableHead>
          <TableHead>{ar.fields.travelers}</TableHead>
          <TableHead>{ar.fields.preferredDate}</TableHead>
          {showAgent && <TableHead>{ar.fields.agent}</TableHead>}
          <TableHead>{ar.fields.source}</TableHead>
          <TableHead>{ar.fields.totalPrice}</TableHead>
          <TableHead>{ar.fields.status}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>
              <Link
                href={`${basePath}/bookings/${booking.id}`}
                className="font-mono text-sm font-medium text-primary hover:underline"
                dir="ltr"
              >
                {booking.code}
              </Link>
            </TableCell>
            <TableCell>
              <p className="font-medium">{booking.customerName}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {booking.customerPhone}
              </p>
            </TableCell>
            <TableCell className="max-w-44 truncate">
              {booking.programTitle ?? "—"}
            </TableCell>
            <TableCell>
              {booking.adults + booking.children}
            </TableCell>
            <TableCell>{formatDate(booking.preferredDate)}</TableCell>
            {showAgent && (
              <TableCell>{booking.agent?.user.name ?? "—"}</TableCell>
            )}
            <TableCell>{labelOf("bookingSource", booking.source)}</TableCell>
            <TableCell>{formatSAR(booking.totalPrice)}</TableCell>
            <TableCell>
              <BookingStatusBadge status={booking.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
