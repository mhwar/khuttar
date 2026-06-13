import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/auth";
import { bookingAgentAccess } from "@/lib/booking-access";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { BookingDetailView } from "@/components/admin/booking-detail";
import { Button } from "@/components/ui/button";

export default async function AgentBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireAgent();
  const { id } = await params;

  const booking = await db.bookingRequest.findUnique({
    where: { id },
    include: {
      program: { select: { slug: true, category: true } },
      agent: { include: { user: { select: { name: true } } } },
      managerAgent: { include: { user: { select: { name: true } } } },
      assignedTo: { select: { name: true } },
      payments: {
        orderBy: { paidAt: "desc" },
        include: { recordedBy: { select: { name: true } } },
      },
      transfers: {
        orderBy: { date: "asc" },
        include: {
          driver: true,
          provider: { select: { name: true } },
          area: { select: { name: true } },
        },
      },
      messages: { orderBy: { createdAt: "asc" } },
      milestones: { orderBy: { sortOrder: "asc" } },
    },
  });
  // Agents can only open bookings they own or manage.
  if (!booking || !bookingAgentAccess(booking, profile.id)) notFound();

  return (
    <>
      <PageHeader
        title={`حجز ${booking.customerName}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/agent/bookings">
              <ArrowRightIcon className="size-4" />
              {ar.actions.back}
            </Link>
          </Button>
        }
      />
      <BookingDetailView
        booking={booking}
        isAdmin={false}
        drivers={[]}
        providers={[]}
        agents={[]}
        admins={[]}
        areas={[]}
        areaParents={{}}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
      />
    </>
  );
}
