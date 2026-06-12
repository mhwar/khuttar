import Link from "next/link";
import Image from "next/image";
import { CalendarDaysIcon, GraduationCapIcon, MapPinIcon } from "lucide-react";
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
}: {
  src: string | null;
  alt: string;
  fallbackIcon?: React.ReactNode;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={640}
        height={360}
        className="h-44 w-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
      {fallbackIcon ?? <MapPinIcon className="size-10" />}
    </div>
  );
}

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link href={`/destinations/${destination.slug}`} className="group">
      <Card className="overflow-hidden py-0 transition-shadow group-hover:shadow-md">
        <CoverImage src={destination.image} alt={destination.name} />
        <CardContent className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold">{destination.name}</p>
            <Badge variant="secondary">
              {labelOf("destinationType", destination.type)}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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

  return (
    <Link href={href} className="group">
      <Card className="overflow-hidden py-0 transition-shadow group-hover:shadow-md">
        <CoverImage
          src={program.coverImage}
          alt={program.title}
          fallbackIcon={
            isStudy ? <GraduationCapIcon className="size-10" /> : undefined
          }
        />
        <CardContent className="grid gap-2 pb-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold leading-snug">{program.title}</p>
            {isStudy ? (
              <Badge variant="secondary">
                {labelOf("studyKind", program.studyKind)}
              </Badge>
            ) : (
              <Badge variant="secondary">
                {labelOf("tourType", program.tourType)}
              </Badge>
            )}
          </div>
          {program.summary && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {program.summary}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {program.destination && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3.5" />
                {program.destination.name}
              </span>
            )}
            {!isStudy && program.durationDays && (
              <span className="flex items-center gap-1">
                <CalendarDaysIcon className="size-3.5" />
                {program.durationDays} {ar.misc.days}
              </span>
            )}
            {isStudy && program.durationWeeks && (
              <span className="flex items-center gap-1">
                <CalendarDaysIcon className="size-3.5" />
                {program.durationWeeks} {ar.misc.weeks}
              </span>
            )}
          </div>
          {(program.basePrice ?? program.tuitionMin) && (
            <p className="text-sm">
              <span className="text-muted-foreground">{ar.misc.startingFrom} </span>
              <span className="font-bold text-primary">
                {formatSAR(program.basePrice ?? program.tuitionMin)}
              </span>
              {!isStudy && (
                <span className="text-xs text-muted-foreground"> {ar.misc.perPerson}</span>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
