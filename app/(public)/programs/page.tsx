import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { publicProgramWhere } from "@/lib/queries";
import { LABELS, TOUR_TYPES } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { NativeSelect } from "@/components/shared/native-select";
import { EmptyState } from "@/components/shared/misc";
import { ProgramCard } from "@/components/public/cards";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: ar.nav.programs,
  description:
    "برامج خطار السياحية الداخلية والخارجية بجداول يومية مفصلة وأسعار واضحة.",
};

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; destination?: string; ref?: string }>;
}) {
  const { type, destination, ref } = await searchParams;

  const [programs, destinations] = await Promise.all([
    db.program.findMany({
      where: {
        ...publicProgramWhere,
        category: "TOUR",
        ...(type && TOUR_TYPES.includes(type as never) ? { tourType: type } : {}),
        ...(destination ? { destinationId: destination } : {}),
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: { destination: { select: { name: true } } },
    }),
    db.destination.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const hasFilters = !!type || !!destination;

  function chipHref(t: string | null, d: string | null) {
    const params = new URLSearchParams();
    if (t) params.set("type", t);
    if (d) params.set("destination", d);
    if (ref) params.set("ref", ref);
    return `/programs${params.size ? `?${params}` : ""}`;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-extrabold">{ar.nav.programs}</h1>
        <p className="text-muted-foreground">
          جولات داخلية وخارجية بجداول يومية كاملة — اطلب الحجز وسنتولى البقية
        </p>
      </div>

      {/* Filter bar */}
      <div className="grid gap-4">
        {/* Tour type chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href={chipHref(null, destination ?? null)}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              !type
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/70 hover:border-primary/50 hover:text-foreground",
            )}
          >
            {ar.programs.allTypes}
          </Link>
          {TOUR_TYPES.map((t) => (
            <Link
              key={t}
              href={chipHref(t, destination ?? null)}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                type === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground/70 hover:border-primary/50 hover:text-foreground",
              )}
            >
              {LABELS.tourType[t]}
            </Link>
          ))}
        </div>

        {/* Destination selector row */}
        <div className="flex flex-wrap items-center gap-3">
          <form method="GET" action="/programs" className="flex items-center gap-2">
            {ref && <input type="hidden" name="ref" value={ref} />}
            {type && <input type="hidden" name="type" value={type} />}
            <NativeSelect name="destination" defaultValue={destination ?? ""} className="h-9 w-48">
              <option value="">{ar.fields.destination}: {ar.misc.all}</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
            <button
              type="submit"
              className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {ar.actions.filter}
            </button>
          </form>

          {hasFilters && (
            <Link
              href={ref ? `/programs?ref=${ref}` : "/programs"}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {ar.programs.clearFilters}
            </Link>
          )}

          <p className="ms-auto text-sm text-muted-foreground">
            {programs.length} {ar.programs.resultSuffix}
          </p>
        </div>
      </div>

      {programs.length === 0 ? (
        <EmptyState message={ar.misc.noResults} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} refCode={ref} />
          ))}
        </div>
      )}
    </div>
  );
}
