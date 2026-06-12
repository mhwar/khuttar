import Link from "next/link";
import {
  BusIcon,
  MapIcon,
  NotebookTextIcon,
  UserCheckIcon,
  WalletIcon,
  InboxIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatSAR, formatDateTime } from "@/lib/format";
import { labelOf } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { BookingStatusBadge, EmptyState, StatCard } from "@/components/shared/misc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [
    bookingCounts,
    paymentsSum,
    programsCount,
    agentsCount,
    pendingAgents,
    newApplications,
    pendingTransfers,
    recentBookings,
  ] = await Promise.all([
    db.bookingRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    db.payment.aggregate({ _sum: { amount: true } }),
    db.program.count(),
    db.agentProfile.count({ where: { status: "APPROVED" } }),
    db.agentProfile.count({ where: { status: "PENDING" } }),
    db.agentApplication.count({ where: { status: "NEW" } }),
    db.transfer.count({ where: { status: "REQUESTED" } }),
    db.bookingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { agent: { include: { user: true } } },
    }),
  ]);

  const countOf = (status: string) =>
    bookingCounts.find((c) => c.status === status)?._count._all ?? 0;
  const totalBookings = bookingCounts.reduce((a, c) => a + c._count._all, 0);

  return (
    <>
      <PageHeader
        title={ar.admin.overview}
        description="ملخص نشاط منصة خطار"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي الحجوزات"
          value={totalBookings}
          hint={`${countOf("NEW")} جديد • ${countOf("CONFIRMED")} مؤكد`}
          icon={<NotebookTextIcon className="size-8" />}
        />
        <StatCard
          label="المدفوعات المسجلة"
          value={formatSAR(paymentsSum._sum.amount ?? 0)}
          icon={<WalletIcon className="size-8" />}
        />
        <StatCard
          label="البرامج"
          value={programsCount}
          icon={<MapIcon className="size-8" />}
        />
        <StatCard
          label="الوكلاء المعتمدون"
          value={agentsCount}
          hint={pendingAgents ? `${pendingAgents} بانتظار الاعتماد` : undefined}
          icon={<UserCheckIcon className="size-8" />}
        />
      </div>

      {(newApplications > 0 || pendingTransfers > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {newApplications > 0 && (
            <Link href="/admin/applications">
              <Card className="border-primary/40 transition-colors hover:bg-accent/40">
                <CardContent className="flex items-center gap-3">
                  <InboxIcon className="size-6 text-primary" />
                  <p className="text-sm">
                    <span className="font-bold">{newApplications}</span> طلب
                    انضمام جديد بانتظار المراجعة
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
          {pendingTransfers > 0 && (
            <Link href="/admin/transfers">
              <Card className="border-primary/40 transition-colors hover:bg-accent/40">
                <CardContent className="flex items-center gap-3">
                  <BusIcon className="size-6 text-primary" />
                  <p className="text-sm">
                    <span className="font-bold">{pendingTransfers}</span> طلب
                    نقل بانتظار الإسناد
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>أحدث الحجوزات</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ar.fields.code}</TableHead>
                  <TableHead>{ar.fields.customer}</TableHead>
                  <TableHead>{ar.fields.program}</TableHead>
                  <TableHead>{ar.fields.agent}</TableHead>
                  <TableHead>{ar.fields.status}</TableHead>
                  <TableHead>{ar.misc.createdAt}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="font-mono text-sm font-medium text-primary hover:underline"
                        dir="ltr"
                      >
                        {booking.code}
                      </Link>
                    </TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell className="max-w-40 truncate">
                      {booking.programTitle ?? "—"}
                    </TableCell>
                    <TableCell>
                      {booking.agent ? booking.agent.user.name : "—"}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(booking.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الحجوزات حسب الحالة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {bookingCounts.length === 0 ? (
            <EmptyState className="w-full" />
          ) : (
            bookingCounts.map((c) => (
              <div
                key={c.status}
                className="flex items-center gap-2 rounded-lg border px-4 py-2"
              >
                <span className="text-sm text-muted-foreground">
                  {labelOf("bookingStatus", c.status)}
                </span>
                <span className="text-lg font-bold">{c._count._all}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
