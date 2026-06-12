import type { Metadata } from "next";
import { db } from "@/lib/db";
import { publicProgramWhere } from "@/lib/queries";
import { LABELS, TOUR_TYPES } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/shared/native-select";
import { EmptyState } from "@/components/shared/misc";
import { ProgramCard } from "@/components/public/cards";

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

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-extrabold">{ar.nav.programs}</h1>
        <p className="text-muted-foreground">
          جولات داخلية وخارجية بجداول يومية كاملة — اطلب الحجز وسنتولى البقية
        </p>
      </div>

      <form className="flex flex-wrap items-end justify-center gap-3" method="GET">
        {ref && <input type="hidden" name="ref" value={ref} />}
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">{ar.fields.type}</label>
          <NativeSelect name="type" defaultValue={type ?? ""} className="w-40">
            <option value="">{ar.misc.all}</option>
            {TOUR_TYPES.map((t) => (
              <option key={t} value={t}>
                {LABELS.tourType[t]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">{ar.fields.destination}</label>
          <NativeSelect
            name="destination"
            defaultValue={destination ?? ""}
            className="w-44"
          >
            <option value="">{ar.misc.all}</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button variant="outline" type="submit">
          {ar.actions.filter}
        </Button>
      </form>

      {programs.length === 0 ? (
        <EmptyState message={ar.misc.noResults} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} refCode={ref} />
          ))}
        </div>
      )}
    </div>
  );
}
