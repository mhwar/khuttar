import { CheckCircle2Icon, CircleIcon, LoaderIcon } from "lucide-react";
import { MILESTONE_STATUS_VARIANTS, labelOf } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Milestone = {
  id: string;
  title: string;
  status: string;
  note: string | null;
  dueDate: Date | null;
  doneAt: Date | null;
};

const ICONS: Record<string, typeof CircleIcon> = {
  PENDING: CircleIcon,
  IN_PROGRESS: LoaderIcon,
  DONE: CheckCircle2Icon,
};

// Read-only progress timeline shown to the customer (used for STUDY bookings).
export function MilestonesView({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="grid gap-3">
      {milestones.map((m) => {
        const Icon = ICONS[m.status] ?? CircleIcon;
        const done = m.status === "DONE";
        return (
          <li key={m.id} className="flex items-start gap-3">
            <Icon
              className={cn(
                "mt-0.5 size-5 shrink-0",
                done
                  ? "text-emerald-600"
                  : m.status === "IN_PROGRESS"
                    ? "text-primary"
                    : "text-muted-foreground",
              )}
            />
            <div className="grid gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    done && "text-muted-foreground line-through",
                  )}
                >
                  {m.title}
                </span>
                <Badge
                  variant={
                    MILESTONE_STATUS_VARIANTS[
                      m.status as keyof typeof MILESTONE_STATUS_VARIANTS
                    ] ?? "outline"
                  }
                >
                  {labelOf("milestoneStatus", m.status)}
                </Badge>
              </div>
              {m.note && (
                <p className="text-xs text-muted-foreground">{m.note}</p>
              )}
              {m.dueDate && !done && (
                <p className="text-xs text-muted-foreground">
                  الموعد المتوقع: {formatDate(m.dueDate)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
