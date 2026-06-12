import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CalendarDaysIcon,
  CheckIcon,
  MapPinIcon,
  XIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { labelOf } from "@/lib/constants";
import { formatSAR } from "@/lib/format";
import { splitLines } from "@/lib/utils";
import { ar } from "@/lib/i18n/ar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingForm } from "@/components/public/booking-form";
import { ItineraryView } from "@/components/public/itinerary-view";
import { CopyButton } from "@/components/shared/copy-button";

async function loadProgram(slug: string) {
  const program = await db.program.findUnique({
    where: { slug },
    include: {
      destination: { select: { name: true } },
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: { area: { select: { name: true } } },
          },
        },
      },
    },
  });
  // DRAFT/ARCHIVED, PRIVATE, or unapproved agent programs are not reachable.
  if (
    !program ||
    program.category !== "TOUR" ||
    program.status !== "PUBLISHED" ||
    program.visibility === "PRIVATE" ||
    !program.isApproved
  ) {
    return null;
  }
  return program;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = await loadProgram(slug);
  if (!program) return {};
  return {
    title: program.title,
    description: program.summary ?? `برنامج سياحي من خطار: ${program.title}`,
  };
}

export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const program = await loadProgram(slug);
  if (!program) notFound();

  const inclusions = splitLines(program.inclusions);
  const exclusions = splitLines(program.exclusions);
  const days = program.days.map((day) => ({
    ...day,
    items: day.items.map((item) => ({ ...item, areaName: item.area?.name })),
  }));

  return (
    <div>
      <section className="relative">
        {program.coverImage ? (
          <Image
            src={program.coverImage}
            alt={program.title}
            width={1600}
            height={420}
            className="h-72 w-full object-cover"
          />
        ) : (
          <div className="h-72 w-full bg-gradient-to-bl from-primary to-teal-800" />
        )}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent">
          <div className="mx-auto w-full max-w-6xl px-4 pb-6 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold">{program.title}</h1>
              <Badge variant="secondary">{labelOf("tourType", program.tourType)}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-white/85">
              {program.destination && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="size-4" />
                  {program.destination.name}
                </span>
              )}
              {program.durationDays && (
                <span className="flex items-center gap-1">
                  <CalendarDaysIcon className="size-4" />
                  {program.durationDays} {ar.misc.days}
                </span>
              )}
              {program.basePrice && (
                <span className="font-bold">
                  {ar.misc.startingFrom} {formatSAR(program.basePrice)} {ar.misc.perPerson}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="grid content-start gap-8 lg:col-span-2">
          {program.summary && (
            <p className="text-lg leading-relaxed">{program.summary}</p>
          )}
          {program.description && (
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {program.description}
            </p>
          )}

          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {inclusions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">يشمل البرنامج</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {inclusions.map((line) => (
                      <p key={line} className="flex items-start gap-2 text-sm">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        {line}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}
              {exclusions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">لا يشمل</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {exclusions.map((line) => (
                      <p key={line} className="flex items-start gap-2 text-sm">
                        <XIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                        {line}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {days.length > 0 && (
            <section className="grid gap-4">
              <h2 className="text-xl font-bold">{ar.trip.itinerary}</h2>
              <ItineraryView days={days} />
            </section>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{ar.actions.share}:</span>
            <CopyButton
              text={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/programs/${program.slug}${ref ? `?ref=${ref}` : ""}`}
              label="نسخ الرابط"
            />
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <BookingForm programId={program.id} refCode={ref} />
        </div>
      </div>
    </div>
  );
}
