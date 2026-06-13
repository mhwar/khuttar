import { PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/auth";
import { createInternalBooking } from "@/lib/actions/bookings";
import { BOOKING_STATUSES, LABELS } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { NativeSelect } from "@/components/shared/native-select";
import { BookingsTable } from "@/components/admin/bookings-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default async function AgentBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { profile } = await requireAgent();
  const { status } = await searchParams;

  const [bookings, programs] = await Promise.all([
    db.bookingRequest.findMany({
      where: {
        OR: [{ agentId: profile.id }, { managerAgentId: profile.id }],
        ...(status && BOOKING_STATUSES.includes(status as never)
          ? { status }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { agent: { include: { user: { select: { name: true } } } } },
    }),
    db.program.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ ownerAgentId: profile.id }, { ownerAgentId: null }],
      },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={ar.agent.myBookings}
        description="الحجوزات المنسوبة لك أو التي تديرها نيابة عن المنصة"
        actions={
          profile.status === "APPROVED" ? (
            <FormDialog
              title="حجز جديد لعميلك"
              action={createInternalBooking}
              wide
              trigger={
                <Button>
                  <PlusIcon className="size-4" />
                  {ar.actions.create}
                </Button>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={ar.fields.fullName} name="customerName">
                  <Input name="customerName" required />
                </Field>
                <Field label={ar.fields.phone} name="customerPhone">
                  <Input name="customerPhone" dir="ltr" required />
                </Field>
              </div>
              <Field label={ar.fields.program} name="programId">
                <NativeSelect name="programId" defaultValue="">
                  <option value="">{ar.misc.none}</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={ar.fields.adults} name="adults">
                  <Input name="adults" type="number" defaultValue={1} min={1} />
                </Field>
                <Field label={ar.fields.children} name="children">
                  <Input name="children" type="number" defaultValue={0} min={0} />
                </Field>
                <Field label={ar.fields.preferredDate} name="preferredDate">
                  <Input name="preferredDate" type="date" dir="ltr" />
                </Field>
              </div>
              <Field label={ar.fields.notes} name="customerNotes">
                <Textarea name="customerNotes" rows={2} />
              </Field>
            </FormDialog>
          ) : undefined
        }
      />

      <form className="flex flex-wrap items-end gap-3" method="GET">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">{ar.fields.status}</label>
          <NativeSelect name="status" defaultValue={status ?? ""} className="w-44">
            <option value="">{ar.misc.all}</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LABELS.bookingStatus[s]}
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
          <BookingsTable bookings={bookings} basePath="/agent" showAgent={false} />
        </CardContent>
      </Card>
    </>
  );
}
