import { PlusIcon } from "lucide-react";
import {
  addPayment,
  deletePayment,
  updateBooking,
} from "@/lib/actions/bookings";
import {
  deleteTransfer,
  saveTransfer,
  assignTransfer,
  setTransferStatus,
} from "@/lib/actions/transfers";
import { postStaffMessage } from "@/lib/actions/messages";
import {
  saveMilestone,
  setMilestoneStatus,
  deleteMilestone,
  seedDefaultStudyMilestones,
} from "@/lib/actions/milestones";
import {
  LABELS,
  MILESTONE_STATUSES,
  MILESTONE_STATUS_VARIANTS,
  PAYMENT_METHODS,
  labelOf,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatSAR, toInputDate } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { BookingStatusBadge, EmptyState } from "@/components/shared/misc";
import { BookingStatusControl } from "@/components/admin/booking-status-control";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { NativeSelect, enumOptions } from "@/components/shared/native-select";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete";
import { ActionButton } from "@/components/shared/action-button";
import { ActionForm } from "@/components/shared/action-form";
import { CopyButton } from "@/components/shared/copy-button";
import { SubmitButton } from "@/components/shared/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Prisma } from "@prisma/client";

export type BookingDetail = Prisma.BookingRequestGetPayload<{
  include: {
    program: { select: { slug: true; category: true } };
    agent: { include: { user: { select: { name: true } } } };
    managerAgent: { include: { user: { select: { name: true } } } };
    assignedTo: { select: { name: true } };
    payments: { include: { recordedBy: { select: { name: true } } } };
    transfers: {
      include: {
        driver: true;
        provider: { select: { name: true } };
      };
    };
    messages: true;
    milestones: true;
  };
}>;

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  );
}

export function BookingDetailView({
  booking,
  isAdmin,
  drivers,
  providers,
  agents,
  admins,
  appUrl,
}: {
  booking: BookingDetail;
  isAdmin: boolean;
  drivers: { id: string; name: string }[];
  providers: { id: string; name: string }[];
  agents: { id: string; name: string }[];
  admins: { id: string; name: string }[];
  appUrl: string;
}) {
  const paid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
  const tripUrl = `${appUrl}/b/${booking.code}`;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="grid gap-6 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-3">
              <span dir="ltr" className="font-mono">
                {booking.code}
              </span>
              <BookingStatusBadge status={booking.status} />
            </CardTitle>
            <BookingStatusControl
              bookingId={booking.id}
              status={booking.status}
              isAdmin={isAdmin}
            />
          </CardHeader>
          <CardContent className="grid gap-1 sm:grid-cols-2 sm:gap-x-10">
            <InfoRow label={ar.fields.customer} value={booking.customerName} />
            <InfoRow
              label={ar.fields.phone}
              value={<span dir="ltr">{booking.customerPhone}</span>}
            />
            <InfoRow
              label={ar.fields.email}
              value={booking.customerEmail ?? "—"}
            />
            <InfoRow
              label={ar.fields.program}
              value={booking.programTitle ?? "—"}
            />
            <InfoRow
              label={ar.fields.travelers}
              value={`${booking.adults} بالغ${booking.children ? ` + ${booking.children} طفل` : ""}`}
            />
            <InfoRow
              label={ar.fields.preferredDate}
              value={formatDate(booking.preferredDate)}
            />
            <InfoRow
              label={ar.fields.source}
              value={labelOf("bookingSource", booking.source)}
            />
            <InfoRow
              label={ar.fields.agent}
              value={booking.agent?.user.name ?? "—"}
            />
            <InfoRow
              label={ar.misc.createdAt}
              value={formatDateTime(booking.createdAt)}
            />
            <InfoRow
              label={ar.fields.totalPrice}
              value={formatSAR(booking.totalPrice)}
            />
            {booking.customerNotes && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">
                  {ar.booking.customerNotes}:
                </p>
                <p className="text-sm">{booking.customerNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{ar.booking.transfersTitle}</CardTitle>
            <FormDialog
              title="طلب نقل جديد"
              action={saveTransfer}
              wide
              trigger={
                <Button size="sm" variant="outline">
                  <PlusIcon className="size-4" />
                  {ar.actions.create}
                </Button>
              }
            >
              <input type="hidden" name="bookingId" value={booking.id} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={ar.fields.date} name="date">
                  <Input name="date" type="date" dir="ltr" required />
                </Field>
                <Field label={ar.fields.time} name="time">
                  <Input name="time" type="time" dir="ltr" />
                </Field>
                <Field label={ar.fields.pax} name="pax">
                  <Input name="pax" type="number" defaultValue={booking.adults + booking.children} min={1} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={ar.fields.from} name="fromLocation">
                  <Input name="fromLocation" required />
                </Field>
                <Field label={ar.fields.to} name="toLocation">
                  <Input name="toLocation" required />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={ar.fields.vehicleType} name="vehicleType">
                  <Input name="vehicleType" placeholder="فان ٧ ركاب..." />
                </Field>
                {isAdmin && (
                  <Field label={ar.fields.price} name="price">
                    <Input name="price" type="number" />
                  </Field>
                )}
              </div>
              {isAdmin && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={ar.fields.driver} name="driverId">
                    <NativeSelect name="driverId" defaultValue="">
                      <option value="">{ar.misc.none}</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label={ar.fields.provider} name="providerId">
                    <NativeSelect name="providerId" defaultValue="">
                      <option value="">{ar.misc.none}</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>
              )}
              <Field label={ar.fields.notes} name="notes">
                <Textarea name="notes" rows={2} />
              </Field>
            </FormDialog>
          </CardHeader>
          <CardContent className="grid gap-3">
            {booking.transfers.length === 0 ? (
              <EmptyState message="لا توجد طلبات نقل لهذا الحجز" />
            ) : (
              booking.transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <span>
                        {transfer.fromLocation} ← {transfer.toLocation}
                      </span>
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
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transfer.date)}
                      {transfer.time && (
                        <span dir="ltr"> • {transfer.time}</span>
                      )}{" "}
                      • {transfer.pax} ركاب
                      {transfer.vehicleType && ` • ${transfer.vehicleType}`}
                      {transfer.price ? ` • ${formatSAR(transfer.price)}` : ""}
                    </p>
                    <p className="text-xs">
                      {transfer.driver ? (
                        <>
                          {ar.fields.driver}: {transfer.driver.name}{" "}
                          <span dir="ltr">({transfer.driver.phone})</span>
                        </>
                      ) : transfer.provider ? (
                        <>
                          {ar.fields.provider}: {transfer.provider.name}
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          بانتظار الإسناد
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <FormDialog
                        title="إسناد النقل"
                        action={assignTransfer}
                        trigger={
                          <Button size="sm" variant="outline">
                            إسناد
                          </Button>
                        }
                      >
                        <input type="hidden" name="id" value={transfer.id} />
                        <Field label={ar.fields.driver} name="driverId">
                          <NativeSelect
                            name="driverId"
                            defaultValue={transfer.driverId ?? ""}
                          >
                            <option value="">{ar.misc.none}</option>
                            {drivers.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </NativeSelect>
                        </Field>
                        <Field label={ar.fields.provider} name="providerId">
                          <NativeSelect
                            name="providerId"
                            defaultValue={transfer.providerId ?? ""}
                          >
                            <option value="">{ar.misc.none}</option>
                            {providers.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </NativeSelect>
                        </Field>
                        <Field label={ar.fields.price} name="price">
                          <Input
                            name="price"
                            type="number"
                            defaultValue={transfer.price ?? ""}
                          />
                        </Field>
                      </FormDialog>
                    )}
                    {isAdmin && transfer.status === "ASSIGNED" && (
                      <ActionButton
                        action={setTransferStatus.bind(null, transfer.id, "COMPLETED")}
                        size="sm"
                        variant="ghost"
                      >
                        {LABELS.transferStatus.COMPLETED}
                      </ActionButton>
                    )}
                    <ConfirmDeleteButton
                      action={deleteTransfer.bind(null, transfer.id)}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{ar.booking.payments}</CardTitle>
            {isAdmin && (
              <FormDialog
                title="تسجيل دفعة"
                action={addPayment}
                trigger={
                  <Button size="sm" variant="outline">
                    <PlusIcon className="size-4" />
                    {ar.actions.create}
                  </Button>
                }
              >
                <input type="hidden" name="bookingId" value={booking.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={ar.fields.amount} name="amount">
                    <Input name="amount" type="number" min={1} required />
                  </Field>
                  <Field label={ar.fields.method} name="method">
                    <NativeSelect name="method" defaultValue="BANK_TRANSFER">
                      {enumOptions(PAYMENT_METHODS, LABELS.paymentMethod)}
                    </NativeSelect>
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={ar.fields.paidAt} name="paidAt">
                    <Input
                      name="paidAt"
                      type="date"
                      dir="ltr"
                      defaultValue={toInputDate(new Date())}
                    />
                  </Field>
                  <Field label={ar.fields.reference} name="reference">
                    <Input name="reference" dir="ltr" />
                  </Field>
                </div>
                <Field label={ar.fields.notes} name="notes">
                  <Textarea name="notes" rows={2} />
                </Field>
              </FormDialog>
            )}
          </CardHeader>
          <CardContent className="grid gap-3">
            {booking.totalPrice ? (
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  {ar.misc.total}:{" "}
                  <strong>{formatSAR(booking.totalPrice)}</strong>
                </span>
                <span className="text-emerald-700">
                  {ar.booking.paid}: <strong>{formatSAR(paid)}</strong>
                </span>
                <span className={paid < booking.totalPrice ? "text-amber-700" : ""}>
                  {ar.booking.remaining}:{" "}
                  <strong>{formatSAR(Math.max(booking.totalPrice - paid, 0))}</strong>
                </span>
              </div>
            ) : null}
            {booking.payments.length === 0 ? (
              <EmptyState message="لا توجد دفعات مسجلة" />
            ) : (
              booking.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {formatSAR(payment.amount)} •{" "}
                      {labelOf("paymentMethod", payment.method)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.paidAt)}
                      {payment.reference && (
                        <span dir="ltr"> • {payment.reference}</span>
                      )}
                      {payment.recordedBy && ` • سجّلها ${payment.recordedBy.name}`}
                    </p>
                  </div>
                  {isAdmin && (
                    <ConfirmDeleteButton
                      action={deletePayment.bind(null, payment.id)}
                    />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Milestones (program progress — primarily for STUDY bookings) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>{ar.booking.milestones}</CardTitle>
            <div className="flex gap-2">
              {booking.milestones.length === 0 &&
                booking.program?.category === "STUDY" && (
                  <ActionButton
                    action={seedDefaultStudyMilestones.bind(null, booking.id)}
                    size="sm"
                    variant="outline"
                  >
                    {ar.booking.addDefaultMilestones}
                  </ActionButton>
                )}
              <FormDialog
                title={ar.booking.milestones}
                action={saveMilestone}
                trigger={
                  <Button size="sm" variant="outline">
                    <PlusIcon className="size-4" />
                    {ar.actions.create}
                  </Button>
                }
              >
                <input type="hidden" name="bookingId" value={booking.id} />
                <Field label={ar.booking.milestoneTitle} name="title">
                  <Input name="title" required />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={ar.fields.status} name="status">
                    <NativeSelect name="status" defaultValue="PENDING">
                      {enumOptions(MILESTONE_STATUSES, LABELS.milestoneStatus)}
                    </NativeSelect>
                  </Field>
                  <Field label={ar.fields.date} name="dueDate">
                    <Input name="dueDate" type="date" dir="ltr" />
                  </Field>
                </div>
                <Field label={ar.fields.notes} name="note">
                  <Textarea name="note" rows={2} />
                </Field>
              </FormDialog>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {booking.milestones.length === 0 ? (
              <EmptyState message="لا توجد مراحل بعد" />
            ) : (
              booking.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <span>{milestone.title}</span>
                      <Badge
                        variant={
                          MILESTONE_STATUS_VARIANTS[
                            milestone.status as keyof typeof MILESTONE_STATUS_VARIANTS
                          ] ?? "outline"
                        }
                      >
                        {labelOf("milestoneStatus", milestone.status)}
                      </Badge>
                    </div>
                    {milestone.note && (
                      <p className="text-xs text-muted-foreground">
                        {milestone.note}
                      </p>
                    )}
                    {milestone.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(milestone.dueDate)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {milestone.status !== "DONE" && (
                      <ActionButton
                        action={setMilestoneStatus.bind(
                          null,
                          milestone.id,
                          "DONE",
                        )}
                        size="sm"
                        variant="ghost"
                      >
                        {LABELS.milestoneStatus.DONE}
                      </ActionButton>
                    )}
                    <FormDialog
                      title={ar.actions.edit}
                      action={saveMilestone}
                      trigger={
                        <Button size="sm" variant="ghost">
                          {ar.actions.edit}
                        </Button>
                      }
                    >
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="id" value={milestone.id} />
                      <Field label={ar.booking.milestoneTitle} name="title">
                        <Input name="title" defaultValue={milestone.title} required />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={ar.fields.status} name="status">
                          <NativeSelect
                            name="status"
                            defaultValue={milestone.status}
                          >
                            {enumOptions(MILESTONE_STATUSES, LABELS.milestoneStatus)}
                          </NativeSelect>
                        </Field>
                        <Field label={ar.fields.date} name="dueDate">
                          <Input
                            name="dueDate"
                            type="date"
                            dir="ltr"
                            defaultValue={toInputDate(milestone.dueDate)}
                          />
                        </Field>
                      </div>
                      <Field label={ar.fields.notes} name="note">
                        <Textarea
                          name="note"
                          rows={2}
                          defaultValue={milestone.note ?? ""}
                        />
                      </Field>
                    </FormDialog>
                    <ConfirmDeleteButton
                      action={deleteMilestone.bind(null, milestone.id)}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Customer ↔ staff message thread */}
        <Card>
          <CardHeader>
            <CardTitle>{ar.booking.messages}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {booking.messages.length === 0 ? (
              <EmptyState message={ar.booking.noMessages} />
            ) : (
              <div className="grid gap-3">
                {booking.messages.map((m) => {
                  const isCustomer = m.authorRole === "CUSTOMER";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col gap-1 ${isCustomer ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${isCustomer ? "bg-muted" : "bg-primary text-primary-foreground"}`}
                      >
                        {m.body}
                      </div>
                      <span className="px-1 text-[11px] text-muted-foreground">
                        {m.authorName} • {formatDateTime(m.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <ActionForm action={postStaffMessage} className="grid gap-2">
              <input type="hidden" name="bookingId" value={booking.id} />
              <Field label={ar.booking.messages} name="body">
                <Textarea name="body" rows={2} required placeholder={ar.booking.writeMessage} />
              </Field>
              <SubmitButton className="justify-self-end">
                {ar.actions.send}
              </SubmitButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>رابط متابعة الرحلة للعميل</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="break-all rounded-md bg-muted p-2 text-xs" dir="ltr">
              {tripUrl}
            </p>
            <div className="flex gap-2">
              <CopyButton text={tripUrl} />
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`تفاصيل رحلتك مع خطار: ${tripUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  واتساب
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تحديث الحجز</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={updateBooking} className="grid gap-4">
              <input type="hidden" name="id" value={booking.id} />
              <Field label={ar.fields.totalPrice} htmlFor="totalPrice">
                <Input
                  id="totalPrice"
                  name="totalPrice"
                  type="number"
                  defaultValue={booking.totalPrice ?? ""}
                />
              </Field>
              <Field label={ar.fields.preferredDate} htmlFor="preferredDate">
                <Input
                  id="preferredDate"
                  name="preferredDate"
                  type="date"
                  dir="ltr"
                  defaultValue={toInputDate(booking.preferredDate)}
                />
              </Field>
              {isAdmin && (
                <>
                  <Field label={ar.fields.agent} htmlFor="agentId">
                    <NativeSelect
                      id="agentId"
                      name="agentId"
                      defaultValue={booking.agentId ?? ""}
                    >
                      <option value="">{ar.misc.none}</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field
                    label={ar.fields.managerAgent}
                    htmlFor="managerAgentId"
                    hint="وكيل يدير هذا الحجز نيابة عن المنصة (بنسبة عمولة الإدارة)"
                  >
                    <NativeSelect
                      id="managerAgentId"
                      name="managerAgentId"
                      defaultValue={booking.managerAgentId ?? ""}
                    >
                      <option value="">{ar.misc.none}</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label={ar.fields.assignedTo} htmlFor="assignedToId">
                    <NativeSelect
                      id="assignedToId"
                      name="assignedToId"
                      defaultValue={booking.assignedToId ?? ""}
                    >
                      <option value="">{ar.misc.none}</option>
                      {admins.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </>
              )}
              <Field label={ar.booking.internalNotes} htmlFor="internalNotes">
                <Textarea
                  id="internalNotes"
                  name="internalNotes"
                  defaultValue={booking.internalNotes ?? ""}
                  rows={3}
                />
              </Field>
              <SubmitButton>{ar.actions.save}</SubmitButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
