import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BOOKING_STATUS_VARIANTS,
  labelOf,
  type BookingStatus,
} from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

export function BookingStatusBadge({ status }: { status: string }) {
  const variant =
    BOOKING_STATUS_VARIANTS[status as BookingStatus] ?? "secondary";
  return <Badge variant={variant}>{labelOf("bookingStatus", status)}</Badge>;
}

export function EmptyState({
  message = ar.misc.emptyList,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {message}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && <div className="text-muted-foreground/60">{icon}</div>}
      </CardContent>
    </Card>
  );
}
