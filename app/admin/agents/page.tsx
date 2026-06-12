import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createAgent } from "@/lib/actions/agents";
import { labelOf } from "@/lib/constants";
import { formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/misc";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminAgentsPage() {
  await requireAdmin();

  const [agents, balances] = await Promise.all([
    db.agentProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { bookings: true, programs: true } },
      },
    }),
    db.ledgerEntry.groupBy({ by: ["agentId"], _sum: { amount: true } }),
  ]);

  const balanceOf = (agentId: string) =>
    balances.find((b) => b.agentId === agentId)?._sum.amount ?? 0;

  return (
    <>
      <PageHeader
        title={ar.admin.agents}
        description="إدارة الوكلاء والمسوقين: الاعتماد، النسب، وكشوف الحساب"
        actions={
          <FormDialog
            title="إنشاء حساب وكيل"
            action={createAgent}
            wide
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                {ar.actions.create}
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={ar.fields.fullName} name="name">
                <Input name="name" required />
              </Field>
              <Field label={ar.fields.phone} name="phone">
                <Input name="phone" dir="ltr" required />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={ar.fields.email} name="email">
                <Input name="email" type="email" dir="ltr" required />
              </Field>
              <Field label={ar.fields.password} name="password">
                <Input name="password" type="password" dir="ltr" required />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={ar.fields.companyName} name="companyName">
                <Input name="companyName" />
              </Field>
              <Field label={ar.fields.city} name="city">
                <Input name="city" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={ar.fields.commissionRate}
                name="commissionRate"
                hint="نسبة الوكيل من قيمة الحجوزات المؤكدة"
              >
                <Input
                  name="commissionRate"
                  type="number"
                  step="0.5"
                  defaultValue={10}
                />
              </Field>
              <Field
                label={ar.fields.platformFeeRate}
                name="platformFeeRate"
                hint="رسوم المنصة المحتسبة على الوكيل"
              >
                <Input
                  name="platformFeeRate"
                  type="number"
                  step="0.5"
                  defaultValue={5}
                />
              </Field>
            </div>
          </FormDialog>
        }
      />

      <Card>
        <CardContent>
          {agents.length === 0 ? (
            <EmptyState message="لا يوجد وكلاء بعد" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ar.fields.name}</TableHead>
                  <TableHead>{ar.fields.referralCode}</TableHead>
                  <TableHead>{ar.fields.commissionRate}</TableHead>
                  <TableHead>الحجوزات</TableHead>
                  <TableHead>البرامج</TableHead>
                  <TableHead>{ar.agent.balance}</TableHead>
                  <TableHead>{ar.fields.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <Link
                        href={`/admin/agents/${agent.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {agent.user.name}
                      </Link>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {agent.user.email}
                      </p>
                    </TableCell>
                    <TableCell dir="ltr" className="font-mono text-sm">
                      {agent.referralCode}
                    </TableCell>
                    <TableCell>
                      {agent.commissionRate}% / {agent.platformFeeRate}%
                    </TableCell>
                    <TableCell>{agent._count.bookings}</TableCell>
                    <TableCell>{agent._count.programs}</TableCell>
                    <TableCell className="font-medium">
                      {formatSAR(balanceOf(agent.id))}
                    </TableCell>
                    <TableCell>
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
