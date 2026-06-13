import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  GraduationCapIcon,
  MapPinIcon,
  SparklesIcon,
} from "lucide-react";
import { labelOf } from "@/lib/constants";
import { formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { Badge } from "@/components/ui/badge";
import type { Destination, Program } from "@prisma/client";

// ──────────────────────────────────────────────────────────────────────────────
// DestinationCard — immersive overlay style (image fills card, text overlaid)
// ──────────────────────────────────────────────────────────────────────────────

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link href={`/destinations/${destination.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        {destination.image ? (
          <Image
            src={destination.image}
            alt={destination.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-teal-800" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Type chip */}
        <span className="absolute end-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {labelOf("destinationType", destination.type)}
        </span>

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-lg font-bold leading-tight text-white">
                {destination.name}
              </p>
              {destination.description && (
                <p className="mt-0.5 line-clamp-1 text-sm text-white/70">
                  {destination.description}
                </p>
              )}
            </div>
            <span className="shrink-0 translate-x-2 rounded-full bg-white/20 p-2 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              <ArrowLeftIcon className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// ProgramCard — editorial style: large image + clean content below
// ──────────────────────────────────────────────────────────────────────────────

export function ProgramCard({
  program,
  refCode,
}: {
  program: Program & { destination?: { name: string } | null };
  refCode?: string;
}) {
  const isStudy = program.category === "STUDY";
  const href = `${isStudy ? "/study" : "/programs"}/${program.slug}${refCode ? `?ref=${refCode}` : ""}`;
  const price = program.basePrice ?? program.tuitionMin;

  return (
    <Link href={href} className="group block">
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/8">
        {/* Image */}
        <div className="relative aspect-[3/2] overflow-hidden">
          {program.coverImage ? (
            <Image
              src={program.coverImage}
              alt={program.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
              {isStudy ? (
                <GraduationCapIcon className="size-12 opacity-60" />
              ) : (
                <MapPinIcon className="size-12 opacity-60" />
              )}
            </div>
          )}

          {/* Featured badge */}
          {program.featured && (
            <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground shadow-sm">
              <SparklesIcon className="size-3" />
              {ar.home.popular}
            </span>
          )}

          {/* Duration chip */}
          {!isStudy && program.durationDays ? (
            <span className="absolute bottom-3 start-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <CalendarDaysIcon className="size-3.5" />
              {program.durationDays} {ar.misc.days}
            </span>
          ) : null}
          {isStudy && program.durationWeeks ? (
            <span className="absolute bottom-3 start-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <CalendarDaysIcon className="size-3.5" />
              {program.durationWeeks} {ar.misc.weeks}
            </span>
          ) : null}

          {/* Type badge (bottom-right) */}
          <span className="absolute bottom-3 end-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {isStudy
              ? labelOf("studyKind", program.studyKind)
              : labelOf("tourType", program.tourType)}
          </span>
        </div>

        {/* Content */}
        <div className="grid gap-3 p-5">
          <p className="line-clamp-1 text-base font-bold leading-snug">{program.title}</p>

          {program.summary && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {program.summary}
            </p>
          )}

          {program.destination && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPinIcon className="size-3.5 shrink-0 text-primary" />
              {program.destination.name}
            </span>
          )}

          <div className="flex items-end justify-between border-t pt-3">
            {price ? (
              <div className="leading-tight">
                <span className="block text-xs text-muted-foreground">{ar.misc.startingFrom}</span>
                <span className="text-2xl font-black text-primary">{formatSAR(price)}</span>
                {!isStudy && (
                  <span className="text-xs text-muted-foreground"> / {ar.misc.perPerson}</span>
                )}
              </div>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-transform duration-200 group-hover:-translate-x-1">
              {ar.home.viewDetails}
              <ArrowLeftIcon className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
