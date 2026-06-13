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

const TYPE_ICONS: Record<ItemType, React.ComponentType<{ className?: string }>> = {
  ACTIVITY: SparklesIcon,
  TRANSPORT: BusIcon,
  HOTEL: BedIcon,
  MEAL: UtensilsIcon,
  FLIGHT: PlaneIcon,
  FREE_TIME: CoffeeIcon,
  OTHER: MapPinIcon,
};

// Colored icon box per activity type — mtrip-style visual language
const TYPE_COLORS: Record<ItemType, string> = {
  ACTIVITY: "bg-amber-100 text-amber-700",
  TRANSPORT: "bg-blue-100 text-blue-700",
  HOTEL: "bg-indigo-100 text-indigo-700",
  MEAL: "bg-rose-100 text-rose-700",
  FLIGHT: "bg-sky-100 text-sky-700",
  FREE_TIME: "bg-emerald-100 text-emerald-700",
  OTHER: "bg-muted text-muted-foreground",
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

// Premium day-by-day timeline — shared by public program page and /b/[code].
export function ItineraryView({ days }: { days: ViewDay[] }) {
  if (days.length === 0) return null;

  return (
    <div className="grid gap-8">
      {days.map((day) => {
        const dayNum = String(day.dayNumber).padStart(2, "0");
        return (
          <div key={day.id}>
            {/* Day header */}
            <div className="mb-5 flex items-center gap-4">
              <span className="shrink-0 font-black leading-none text-primary/20 text-5xl">
                {dayNum}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold leading-snug">{day.title}</h3>
                {day.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{day.description}</p>
                )}
              </div>
            </div>
            <div className="border-t border-dashed border-border mb-5" />

            {/* Activity items */}
            <div className="ms-4 grid gap-1 border-s-2 border-primary/12 ps-6">
              {day.items.map((item) => {
                const Icon = TYPE_ICONS[item.type as ItemType] ?? MapPinIcon;
                const colorClass = TYPE_COLORS[item.type as ItemType] ?? TYPE_COLORS.OTHER;
                return (
                  <div
                    key={item.id}
                    className="group/item relative rounded-xl px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    {/* Icon connector dot on the timeline */}
                    <div className="absolute -start-[2.15rem] top-3.5 size-3 rounded-full border-2 border-primary/25 bg-background" />

                    <div className="flex items-start gap-3">
                      {/* Colored icon box */}
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                        <Icon className="size-4" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold leading-snug">{item.title}</span>
                          {item.areaName && (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {item.areaName}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {item.startTime && (
                            <span className="flex items-center gap-1">
                              <ClockIcon className="size-3" />
                              <span dir="ltr" className="font-mono">{item.startTime}</span>
                            </span>
                          )}
                          {item.durationMin && (
                            <span>{item.durationMin} {labelOf("itemType", item.type)}</span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {day.items.length === 0 && (
                <div className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                    <CoffeeIcon className="size-4" />
                  </div>
                  يوم حر — استكشف بحرية
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
