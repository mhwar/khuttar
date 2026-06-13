import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  addLedgerEntry,
  setAgentStatus,
  updateAgent,
} from "@/lib/actions/agents";
import { getAgentLedgerSummary } from "@/lib/queries";
import { AGENT_STATUSES, LABELS, labelOf } from "@/lib/constants";
import { formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/misc";
import { FormDialog } from "@/components/shared/form-dialog";
import { ActionButton } from "@/components/shared/action-button";
import { ActionForm } from "@/components/shared/action-form";
import { Field } from "@/components/shared/field";
import { NativeSelect, enumOptions } from "@/components/shared/native-select";
import { SubmitButton } from "@/components/shared/submit-button";
import { LedgerTable } from "@/components/admin/ledger-table";
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

export default async function AdminAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const agent = await db.agentProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { bookings: true, programs: true } },
    },
  });
  if (!agent) notFound();

  const [summary, entries] = await Promise.all([
    getAgentLedgerSummary(id),
    db.ledgerEntry.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
      include: { booking: { select: { code: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={agent.user.name}
        description={`${ar.fields.referralCode}: ${agent.referralCode}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {agent.status !== "APPROVED" && (
              <ActionButton action={setAgentStatus.bind(null, agent.id, "APPROVED")}>
                {ar.actions.approve}
              </ActionButton>
            )}
            {agent.status === "APPROVED" && (
              <ActionButton
                action={setAgentStatus.bind(null, agent.id, "SUSPENDED")}
                variant="destructive"
              >
                {ar.actions.suspend}
              </ActionButton>
            )}
            <Button variant="outline" asChild>
              <Link href="/admin/agents">
                <ArrowRightIcon className="size-4" />
                {ar.actions.back}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={ar.agent.balance} value={formatSAR(summary.balance)} />
        <StatCard
          label={ar.agent.totalCommissions}
          value={formatSAR(summary.commissions)}
        />
        <StatCard
          label={ar.agent.totalFees}
          value={formatSAR(Math.abs(summary.fees))}
        />
        <StatCard
          label={ar.agent.totalPayouts}
          value={formatSAR(Math.abs(summary.payouts))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              الملف والنسب
              <Badge
                variant={
                  agent.status === "APPROVED"
                    ? "default"
                    : agent.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                }
              >
                {labelOf("agentStatus", agent.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={updateAgent} className="grid gap-4">
              <input type="hidden" name="id" value={agent.id} />
              <Field label={ar.fields.phone} htmlFor="phone">
                <Input id="phone" name="phone" dir="ltr" defaultValue={agent.phone} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={ar.fields.commissionRate} htmlFor="commissionRate">
                  <Input
                    id="commissionRate"
                    name="commissionRate"
                    type="number"
                    step="0.5"
                    defaultValue={agent.commissionRate}
                  />
                </Field>
                <Field label={ar.fields.platformFeeRate} htmlFor="platformFeeRate">
                  <Input
                    id="platformFeeRate"
                    name="platformFeeRate"
                    type="number"
                    step="0.5"
                    defaultValue={agent.platformFeeRate}
                  />
                </Field>
              </div>
              <Field label={ar.fields.status} htmlFor="status">
                <NativeSelect id="status" name="status" defaultValue={agent.status}>
                  {enumOptions(AGENT_STATUSES, LABELS.agentStatus)}
                </NativeSelect>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={ar.fields.companyName} htmlFor="companyName">
                  <Input
                    id="companyName"
                    name="companyName"
                    defaultValue={agent.companyName ?? ""}
                  />
                </Field>
                <Field label={ar.fields.city} htmlFor="city">
                  <Input id="city" name="city" defaultValue={agent.city ?? ""} />
                </Field>
              </div>
              <Field label={ar.fields.notes} htmlFor="notes">
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={agent.notes ?? ""}
                  rows={2}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="allowStudyPrograms"
                  defaultChecked={agent.allowStudyPrograms}
                  className="size-4 accent-primary"
                />
                السماح بإنشاء البرامج الدراسية
              </label>
              <SubmitButton>{ar.actions.save}</SubmitButton>
            </ActionForm>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{ar.agent.statement}</CardTitle>
            <FormDialog
              title="قيد يدوي (دفعة/تسوية)"
              action={addLedgerEntry}
              trigger={
                <Button size="sm" variant="outline">
                  <PlusIcon className="size-4" />
                  {ar.actions.create}
                </Button>
              }
            >
              <input type="hidden" name="agentId" value={agent.id} />
              <Field label={ar.fields.type} name="type">
                <NativeSelect name="type" defaultValue="PAYOUT">
                  <option value="PAYOUT">{LABELS.ledgerType.PAYOUT}</option>
                  <option value="ADJUSTMENT">{LABELS.ledgerType.ADJUSTMENT}</option>
                </NativeSelect>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={ar.fields.amount} name="amount">
                  <Input name="amount" type="number" min={1} required />
                </Field>
                <Field
                  label="الاتجاه (للتسوية)"
                  name="direction"
                  hint="الدفعات تُخصم دائماً من رصيد الوكيل"
                >
                  <NativeSelect name="direction" defaultValue="CREDIT">
                    <option value="CREDIT">إضافة للرصيد +</option>
                    <option value="DEBIT">خصم من الرصيد −</option>
                  </NativeSelect>
                </Field>
              </div>
              <Field label={ar.fields.notes} name="note">
                <Input name="note" />
              </Field>
            </FormDialog>
          </CardHeader>
          <CardContent>
            <LedgerTable entries={entries} balance={summary.balance} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
