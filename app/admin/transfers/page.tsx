import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { TRANSFER_STATUSES, LABELS, labelOf } from "@/lib/constants";
import { formatDate, formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/misc";
import { NativeSelect } from "@/components/shared/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminTransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const transfers = await db.transfer.findMany({
    where:
      status && TRANSFER_STATUSES.includes(status as never) ? { status } : {},
    orderBy: [{ status: "asc" }, { date: "asc" }],
    take: 100,
    include: {
      booking: { select: { id: true, code: true, customerName: true } },
      driver: { select: { name: true, phone: true } },
      provider: { select: { name: true } },
    },
  });

  return (
    <>
      <PageHeader
        title={ar.admin.transfers}
        description="تنسيق خدمات النقل مع السائقين والمزوّدين — الإسناد يتم من صفحة الحجز"
      />

      <form className="flex flex-wrap items-end gap-3" method="GET">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">{ar.fields.status}</label>
          <NativeSelect name="status" defaultValue={status ?? ""} className="w-44">
            <option value="">{ar.misc.all}</option>
            {TRANSFER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LABELS.transferStatus[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button variant="outline" type="submit">
          {ar.actions.filter}
        </Button>
      </form>

      <Card>
        <CardContent>
          {transfers.length === 0 ? (
            <EmptyState message="لا توجد طلبات نقل" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحجز</TableHead>
                  <TableHead>{ar.fields.date}</TableHead>
                  <TableHead>المسار</TableHead>
                  <TableHead>{ar.fields.pax}</TableHead>
                  <TableHead>{ar.fields.driver} / {ar.fields.provider}</TableHead>
                  <TableHead>{ar.fields.price}</TableHead>
                  <TableHead>{ar.fields.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <Link
                        href={`/admin/bookings/${transfer.booking.id}`}
                        className="font-mono text-sm text-primary hover:underline"
                        dir="ltr"
                      >
                        {transfer.booking.code}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {transfer.booking.customerName}
                      </p>
                    </TableCell>
                    <TableCell>
                      {formatDate(transfer.date)}
                      {transfer.time && (
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {transfer.time}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-52">
                      {transfer.fromLocation} ← {transfer.toLocation}
                    </TableCell>
                    <TableCell>{transfer.pax}</TableCell>
                    <TableCell>
                      {transfer.driver ? (
                        <>
                          {transfer.driver.name}
                          <p className="text-xs text-muted-foreground" dir="ltr">
                            {transfer.driver.phone}
                          </p>
                        </>
                      ) : (
                        (transfer.provider?.name ?? "—")
                      )}
                    </TableCell>
                    <TableCell>{formatSAR(transfer.price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transfer.status === "ASSIGNED"
                            ? "default"
                            : transfer.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {labelOf("transferStatus", transfer.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
