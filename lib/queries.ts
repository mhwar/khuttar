import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const getSettings = cache(async (): Promise<Record<string, string>> => {
  const rows = await db.siteSetting.findMany();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
});

export async function getAgentBalance(agentId: string) {
  const sum = await db.ledgerEntry.aggregate({
    where: { agentId },
    _sum: { amount: true },
  });
  return sum._sum.amount ?? 0;
}

export async function getAgentLedgerSummary(agentId: string) {
  const grouped = await db.ledgerEntry.groupBy({
    by: ["type"],
    where: { agentId },
    _sum: { amount: true },
  });
  const byType = Object.fromEntries(
    grouped.map((g) => [g.type, g._sum.amount ?? 0]),
  );
  return {
    balance: Object.values(byType).reduce((a, b) => a + b, 0),
    commissions: byType.COMMISSION ?? 0,
    fees: byType.PLATFORM_FEE ?? 0,
    payouts: byType.PAYOUT ?? 0,
    adjustments: byType.ADJUSTMENT ?? 0,
  };
}

// Public listing filter shared by /programs, /study and the landing page.
export const publicProgramWhere = {
  status: "PUBLISHED",
  visibility: "PUBLIC",
  isApproved: true,
} as const;
