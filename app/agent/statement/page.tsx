import { db } from "@/lib/db";
import { requireAgent } from "@/lib/auth";
import { getAgentLedgerSummary } from "@/lib/queries";
import { formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/misc";
import { LedgerTable } from "@/components/admin/ledger-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AgentStatementPage() {
  const { profile } = await requireAgent();

  const [summary, entries] = await Promise.all([
    getAgentLedgerSummary(profile.id),
    db.ledgerEntry.findMany({
      where: { agentId: profile.id },
      orderBy: { createdAt: "desc" },
      include: { booking: { select: { code: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={ar.agent.statement}
        description="الرصيد = ما تستحقه لدى المنصة: العمولات تُضاف، ورسوم المنصة والدفعات المستلمة تُخصم"
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

      <Card>
        <CardHeader>
          <CardTitle>القيود</CardTitle>
        </CardHeader>
        <CardContent>
          <LedgerTable entries={entries} balance={summary.balance} />
        </CardContent>
      </Card>
    </>
  );
}
