import {
  BedIcon,
  BusIcon,
  ClockIcon,
  CoffeeIcon,
  MapPinIcon,
  PlaneIcon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";
import { labelOf, type ItemType } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

const TYPE_ICONS: Record<ItemType, React.ComponentType<{ className?: string }>> = {
  ACTIVITY: SparklesIcon,
  TRANSPORT: BusIcon,
  HOTEL: BedIcon,
  MEAL: UtensilsIcon,
  FLIGHT: PlaneIcon,
  FREE_TIME: CoffeeIcon,
  OTHER: MapPinIcon,
};

export type ViewItem = {
  id: string;
  type: string;
  title: string;
  notes: string | null;
  startTime: string | null;
  durationMin: number | null;
  areaName?: string | null;
};

export type ViewDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  items: ViewItem[];
};

// Read-only day-by-day timeline, shared by the public program page and the
// customer trip page (/b/[code]).
export function ItineraryView({ days }: { days: ViewDay[] }) {
  if (days.length === 0) return null;

  return (
    <div className="grid gap-6">
      {days.map((day) => (
        <div key={day.id} className="relative">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              {day.dayNumber}
            </div>
            <div>
              <h3 className="font-bold">{day.title}</h3>
              {day.description && (
                <p className="text-sm text-muted-foreground">{day.description}</p>
              )}
            </div>
          </div>
          <div className="ms-5 grid gap-3 border-s-2 border-primary/20 ps-7">
            {day.items.map((item) => {
              const Icon = TYPE_ICONS[item.type as ItemType] ?? MapPinIcon;
              return (
                <div
                  key={item.id}
                  className="relative rounded-lg border bg-card p-3 shadow-xs"
                >
                  <div className="absolute -start-[2.4rem] top-4 flex size-7 items-center justify-center rounded-full border bg-background text-primary">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.title}</span>
                    <Badge variant="outline">{labelOf("itemType", item.type)}</Badge>
                    {item.areaName && (
                      <Badge variant="secondary">{item.areaName}</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {item.startTime && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        <span dir="ltr">{item.startTime}</span>
                      </span>
                    )}
                    {item.durationMin && <span>{item.durationMin} دقيقة</span>}
                  </div>
                  {item.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
                  )}
                </div>
              );
            })}
            {day.items.length === 0 && (
              <p className="text-sm text-muted-foreground">— يوم حر —</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
