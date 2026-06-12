import { labelOf } from "@/lib/constants";
import { formatDateTime, formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { EmptyState } from "@/components/shared/misc";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

type LedgerRow = Prisma.LedgerEntryGetPayload<{
  include: { booking: { select: { code: true } } };
}>;

// Statement table with a running balance column. Entries are passed newest
// first; the running balance walks down from the current total.
export function LedgerTable({
  entries,
  balance,
}: {
  entries: LedgerRow[];
  balance: number;
}) {
  if (entries.length === 0) {
    return <EmptyState message="لا توجد قيود بعد" />;
  }

  const rows = entries.map((entry, index) => {
    const newerSum = entries
      .slice(0, index)
      .reduce((sum, e) => sum + e.amount, 0);
    return { entry, runningAfter: balance - newerSum };
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{ar.fields.date}</TableHead>
          <TableHead>{ar.fields.type}</TableHead>
          <TableHead>البيان</TableHead>
          <TableHead>الحجز</TableHead>
          <TableHead>{ar.fields.amount}</TableHead>
          <TableHead>{ar.misc.runningBalance}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ entry, runningAfter }) => (
          <TableRow key={entry.id}>
            <TableCell className="text-muted-foreground">
              {formatDateTime(entry.createdAt)}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  entry.type === "COMMISSION"
                    ? "default"
                    : entry.type === "PLATFORM_FEE"
                      ? "secondary"
                      : "outline"
                }
              >
                {labelOf("ledgerType", entry.type)}
              </Badge>
            </TableCell>
            <TableCell className="max-w-56 truncate">{entry.note ?? "—"}</TableCell>
            <TableCell dir="ltr" className="font-mono text-xs">
              {entry.booking?.code ?? "—"}
            </TableCell>
            <TableCell
              className={cn(
                "font-medium",
                entry.amount >= 0 ? "text-emerald-700" : "text-destructive",
              )}
            >
              {entry.amount >= 0 ? "+" : "−"}
              {formatSAR(Math.abs(entry.amount))}
            </TableCell>
            <TableCell className="font-medium">{formatSAR(runningAfter)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
