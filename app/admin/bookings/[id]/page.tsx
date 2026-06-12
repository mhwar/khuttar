import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { BookingDetailView } from "@/components/admin/booking-detail";
import { Button } from "@/components/ui/button";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [booking, drivers, providers, agents, admins] = await Promise.all([
    db.bookingRequest.findUnique({
      where: { id },
      include: {
        program: { select: { slug: true, category: true } },
        agent: { include: { user: { select: { name: true } } } },
        assignedTo: { select: { name: true } },
        payments: {
          orderBy: { paidAt: "desc" },
          include: { recordedBy: { select: { name: true } } },
        },
        transfers: {
          orderBy: { date: "asc" },
          include: { driver: true, provider: { select: { name: true } } },
        },
      },
    }),
    db.driver.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.serviceProvider.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.agentProfile.findMany({
      where: { status: "APPROVED" },
      include: { user: { select: { name: true } } },
    }),
    db.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true, name: true },
    }),
  ]);
  if (!booking) notFound();

  return (
    <>
      <PageHeader
        title={`حجز ${booking.customerName}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/bookings">
              <ArrowRightIcon className="size-4" />
              {ar.actions.back}
            </Link>
          </Button>
        }
      />
      <BookingDetailView
        booking={booking}
        isAdmin
        drivers={drivers}
        providers={providers}
        agents={agents.map((a) => ({ id: a.id, name: a.user.name }))}
        admins={admins}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
      />
    </>
  );
}
