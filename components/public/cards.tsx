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
import { Card, CardContent } from "@/components/ui/card";
import type { Destination, Program } from "@prisma/client";

function CoverImage({
  src,
  alt,
  fallbackIcon,
  children,
}: {
  src: string | null;
  alt: string;
  fallbackIcon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative h-52 w-full overflow-hidden">
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={640}
          height={360}
          className="h-52 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-primary/80 to-primary text-primary-foreground transition-transform duration-500 ease-out group-hover:scale-105">
          {fallbackIcon ?? <MapPinIcon className="size-10" />}
        </div>
      )}
      {children}
    </div>
  );
}

// Small translucent chip overlaid on the cover image.
function CoverChip({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`absolute inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link href={`/destinations/${destination.slug}`} className="group">
      <Card className="h-full gap-0 overflow-hidden py-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:ring-1 group-hover:ring-primary/20">
        <CoverImage src={destination.image} alt={destination.name}>
          <CoverChip className="end-3 top-3">
            {labelOf("destinationType", destination.type)}
          </CoverChip>
        </CoverImage>
        <CardContent className="grid gap-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold">{destination.name}</p>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              {ar.home.exploreDestination}
              <ArrowLeftIcon className="size-4" />
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {destination.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

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
    <Link href={href} className="group">
      <Card className="h-full gap-0 overflow-hidden py-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:ring-1 group-hover:ring-primary/20">
        <CoverImage
          src={program.coverImage}
          alt={program.title}
          fallbackIcon={
            isStudy ? <GraduationCapIcon className="size-10" /> : undefined
          }
        >
          {program.featured && (
            <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground shadow-sm">
              <SparklesIcon className="size-3" />
              {ar.home.popular}
            </span>
          )}
          {!isStudy && program.durationDays ? (
            <CoverChip className="bottom-3 start-3">
              <CalendarDaysIcon className="size-3.5 text-primary" />
              {program.durationDays} {ar.misc.days}
            </CoverChip>
          ) : null}
          {isStudy && program.durationWeeks ? (
            <CoverChip className="bottom-3 start-3">
              <CalendarDaysIcon className="size-3.5 text-primary" />
              {program.durationWeeks} {ar.misc.weeks}
            </CoverChip>
          ) : null}
        </CoverImage>

        <CardContent className="grid gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 font-bold leading-snug">{program.title}</p>
            <Badge variant="secondary" className="shrink-0">
              {isStudy
                ? labelOf("studyKind", program.studyKind)
                : labelOf("tourType", program.tourType)}
            </Badge>
          </div>

          {program.summary && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {program.summary}
            </p>
          )}

          {program.destination && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPinIcon className="size-3.5" />
              {program.destination.name}
            </span>
          )}

          <div className="mt-1 flex items-end justify-between border-t pt-3">
            {price ? (
              <p className="leading-tight">
                <span className="block text-xs text-muted-foreground">
                  {ar.misc.startingFrom}
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatSAR(price)}
                </span>
                {!isStudy && (
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    {ar.misc.perPerson}
                  </span>
                )}
              </p>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:-translate-x-1">
              {ar.home.viewDetails}
              <ArrowLeftIcon className="size-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
