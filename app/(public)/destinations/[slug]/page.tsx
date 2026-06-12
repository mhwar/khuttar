import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPinIcon } from "lucide-react";
import { db } from "@/lib/db";
import { publicProgramWhere } from "@/lib/queries";
import { AREA_KINDS, labelOf } from "@/lib/constants";
import { formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProgramCard } from "@/components/public/cards";

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
      <section className="relative">
        {destination.image ? (
          <Image
            src={destination.image}
            alt={destination.name}
            width={1600}
            height={400}
            className="h-64 w-full object-cover"
          />
        ) : (
          <div className="h-64 w-full bg-gradient-to-bl from-primary to-teal-800" />
        )}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent">
          <div className="mx-auto w-full max-w-6xl px-4 pb-6 text-white">
            <h1 className="text-3xl font-extrabold">{destination.name}</h1>
            <p className="text-white/80">
              {destination.country} • {labelOf("destinationType", destination.type)}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10">
        {destination.description && (
          <p className="max-w-3xl leading-relaxed text-muted-foreground">
            {destination.description}
          </p>
        )}

        {destination.areas.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-xl font-bold">المدن والمناطق</h2>
            <div className="grid gap-4">
              {kindsInUse.map((kind) => (
                <div key={kind} className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {labelOf("areaKind", kind)}:
                  </span>
                  {destination.areas
                    .filter((area) => area.kind === kind)
                    .map((area) => (
                      <Badge key={area.id} variant="outline">
                        {area.name}
                      </Badge>
                    ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {attractions.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-xl font-bold">أبرز المعالم والأنشطة</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {attractions.map((attraction) => (
                <Card key={attraction.id}>
                  <CardContent className="grid gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold">{attraction.name}</p>
                      <Badge variant="secondary">
                        {labelOf("attractionCategory", attraction.category)}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPinIcon className="size-3" />
                      {attraction.areaName}
                    </p>
                    {attraction.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {attraction.description}
                      </p>
                    )}
                    {attraction.costEstimate ? (
                      <p className="text-xs text-muted-foreground">
                        تكلفة تقديرية: {formatSAR(attraction.costEstimate)}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {destination.programs.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-xl font-bold">
              برامج {destination.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {destination.programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          </section>
        )}

        {destination.programs.length === 0 && attractions.length === 0 && (
          <p className="text-center text-muted-foreground">
            {ar.misc.emptyList}
          </p>
        )}
      </div>
    </div>
  );
}
