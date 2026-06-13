import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, MapPinIcon, TagIcon } from "lucide-react";
import { db } from "@/lib/db";
import { publicProgramWhere } from "@/lib/queries";
import { AREA_KINDS, labelOf } from "@/lib/constants";
import { formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { Badge } from "@/components/ui/badge";
import { ProgramCard } from "@/components/public/cards";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await db.destination.findUnique({ where: { slug } });
  if (!destination) return {};
  return {
    title: destination.name,
    description: destination.description ?? `برامج ومعالم ${destination.name} مع خطار`,
  };
}

// Color per attraction category for visual variety
const CATEGORY_COLORS: Record<string, string> = {
  HISTORICAL: "bg-amber-100 text-amber-700",
  NATURAL: "bg-emerald-100 text-emerald-700",
  CULTURAL: "bg-indigo-100 text-indigo-700",
  ENTERTAINMENT: "bg-rose-100 text-rose-700",
  SHOPPING: "bg-purple-100 text-purple-700",
  FOOD: "bg-orange-100 text-orange-700",
  RELIGIOUS: "bg-teal-100 text-teal-700",
  OTHER: "bg-muted text-muted-foreground",
};

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await db.destination.findUnique({
    where: { slug },
    include: {
      areas: {
        orderBy: { sortOrder: "asc" },
        include: { attractions: { where: { active: true } } },
      },
      programs: {
        where: publicProgramWhere,
        orderBy: { createdAt: "desc" },
        include: { destination: { select: { name: true } } },
      },
    },
  });
  if (!destination || !destination.active) notFound();

  const attractions = destination.areas.flatMap((area) =>
    area.attractions.map((attraction) => ({ ...attraction, areaName: area.name })),
  );
  const kindsInUse = AREA_KINDS.filter((kind) =>
    destination.areas.some((area) => area.kind === kind),
  );

  return (
    <div>
      {/* Hero — immersive, taller */}
      <section className="relative h-[60vh] min-h-80 overflow-hidden">
        {destination.image ? (
          <Image
            src={destination.image}
            alt={destination.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-bl from-primary to-teal-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1 text-sm text-white/60">
            <Link href="/destinations" className="hover:text-white/90 transition-colors">
              {ar.nav.destinations}
            </Link>
            <ChevronLeftIcon className="size-3.5" />
            <span className="text-white/90">{destination.name}</span>
          </nav>
          <h1 className="text-4xl font-black text-white md:text-5xl">{destination.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {destination.country && (
              <span className="flex items-center gap-1.5 text-sm text-white/75">
                <MapPinIcon className="size-4" />
                {destination.country}
              </span>
            )}
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {labelOf("destinationType", destination.type)}
            </span>
            {destination.programs.length > 0 && (
              <span className="rounded-full bg-primary/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {destination.programs.length} برنامج متاح
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12">
        {/* Description */}
        {destination.description && (
          <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {destination.description}
          </p>
        )}

        {/* Areas / Cities */}
        {destination.areas.length > 0 && (
          <section className="grid gap-5">
            <h2 className="text-xl font-bold">المدن والمناطق</h2>
            <div className="grid gap-5">
              {kindsInUse.map((kind) => (
                <div key={kind}>
                  <p className="mb-3 text-sm font-semibold text-muted-foreground">
                    {labelOf("areaKind", kind)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {destination.areas
                      .filter((area) => area.kind === kind)
                      .map((area) => (
                        <span
                          key={area.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3.5 py-2 text-sm font-medium shadow-xs"
                        >
                          <MapPinIcon className="size-3.5 text-primary" />
                          {area.name}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attractions */}
        {attractions.length > 0 && (
          <section className="grid gap-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">أبرز المعالم والأنشطة</h2>
              <Badge variant="secondary">{attractions.length} معلم</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {attractions.map((attraction) => {
                const colorClass = CATEGORY_COLORS[attraction.category] ?? CATEGORY_COLORS.OTHER;
                return (
                  <div
                    key={attraction.id}
                    className="group rounded-2xl border bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <p className="font-bold leading-snug">{attraction.name}</p>
                      <span className={cn("shrink-0 rounded-lg px-2 py-1 text-xs font-medium", colorClass)}>
                        {labelOf("attractionCategory", attraction.category)}
                      </span>
                    </div>
                    <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <TagIcon className="size-3" />
                      {attraction.areaName}
                    </p>
                    {attraction.description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {attraction.description}
                      </p>
                    )}
                    {attraction.costEstimate ? (
                      <p className="mt-2 text-xs font-medium text-primary">
                        تكلفة تقديرية: {formatSAR(attraction.costEstimate)}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Related programs */}
        {destination.programs.length > 0 && (
          <section className="grid gap-5">
            <h2 className="text-xl font-bold">برامج {destination.name}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destination.programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          </section>
        )}

        {destination.programs.length === 0 && attractions.length === 0 && (
          <p className="text-center text-muted-foreground">{ar.misc.emptyList}</p>
        )}
      </div>
    </div>
  );
}
