import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  MapPinIcon,
  MessageCircleIcon,
  XIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { labelOf } from "@/lib/constants";
import { formatSAR } from "@/lib/format";
import { splitLines } from "@/lib/utils";
import { getSettings } from "@/lib/queries";
import { ar } from "@/lib/i18n/ar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingForm } from "@/components/public/booking-form";
import { ItineraryView } from "@/components/public/itinerary-view";
import { CopyButton } from "@/components/shared/copy-button";
import { ProgramNav, buildProgramSections } from "@/components/public/program-nav";

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
  const [program, settings] = await Promise.all([loadProgram(slug), getSettings()]);
  if (!program) notFound();

  const inclusions = splitLines(program.inclusions);
  const exclusions = splitLines(program.exclusions);
  const days = program.days.map((day) => ({
    ...day,
    items: day.items.map((item) => ({ ...item, areaName: item.area?.name })),
  }));

  const hasInclusions = inclusions.length > 0 || exclusions.length > 0;
  const hasDays = days.length > 0;
  const sections = buildProgramSections({ hasDays, hasInclusions });
  const price = program.basePrice;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        {program.coverImage ? (
          <Image
            src={program.coverImage}
            alt={program.title}
            width={1600}
            height={480}
            className="h-80 w-full object-cover md:h-96"
          />
        ) : (
          <div className="h-80 w-full bg-gradient-to-bl from-primary to-teal-800 md:h-96" />
        )}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/25 to-transparent">
          <div className="mx-auto w-full max-w-6xl px-4 pb-7 text-white">
            <nav className="mb-2 flex items-center gap-1 text-sm text-white/65">
              <Link href="/programs" className="hover:text-white/90 transition-colors">
                {ar.detail.breadcrumbPrograms}
              </Link>
              <ChevronLeftIcon className="size-3.5" />
              <span className="line-clamp-1 text-white/90">{program.title}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold md:text-4xl">{program.title}</h1>
              <Badge variant="secondary" className="shrink-0">
                {labelOf("tourType", program.tourType)}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-white/85">
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
              {price && (
                <span className="font-black text-gold text-xl">
                  {ar.misc.startingFrom} {formatSAR(price)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky inner nav */}
      <ProgramNav sections={sections} />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
        {/* Main content */}
        <div className="grid content-start gap-8">
          <section id="overview">
            {program.summary && (
              <p className="text-lg leading-relaxed">{program.summary}</p>
            )}
            {program.description && (
              <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
                {program.description}
              </p>
            )}
          </section>

          {hasInclusions && (
            <section id="inclusions" className="grid gap-4 sm:grid-cols-2">
              {inclusions.length > 0 && (
                <Card className="overflow-hidden p-0">
                  <CardHeader className="rounded-t-xl bg-emerald-50 px-4 py-3">
                    <CardTitle className="text-base text-emerald-800">
                      {ar.detail.includesTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 p-4">
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
                <Card className="overflow-hidden p-0">
                  <CardHeader className="rounded-t-xl bg-red-50 px-4 py-3">
                    <CardTitle className="text-base text-red-800">
                      {ar.detail.excludesTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 p-4">
                    {exclusions.map((line) => (
                      <p key={line} className="flex items-start gap-2 text-sm">
                        <XIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                        {line}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}
            </section>
          )}

          {hasDays && (
            <section id="itinerary" className="grid gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{ar.detail.itinerarySection}</h2>
                <Badge variant="secondary">
                  {days.length} {ar.misc.days}
                </Badge>
              </div>
              <ItineraryView days={days} />
            </section>
          )}
        </div>

        {/* Booking sidebar */}
        <div id="booking" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl p-5 shadow-xl shadow-primary/10 ring-1 ring-primary/15 bg-card">
            {price && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground">{ar.misc.startingFrom}</p>
                <p className="text-3xl font-black text-primary">
                  {formatSAR(price)}
                  <span className="text-base font-normal text-muted-foreground"> / {ar.misc.perPerson}</span>
                </p>
              </div>
            )}

            {(program.durationDays || program.destination) && (
              <div className="mb-4 flex flex-wrap gap-3 border-t border-b py-3 text-sm text-muted-foreground">
                {program.durationDays && (
                  <span className="flex items-center gap-1">
                    <CalendarDaysIcon className="size-3.5 text-primary" />
                    {program.durationDays} {ar.misc.days}
                  </span>
                )}
                {program.destination && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="size-3.5 text-primary" />
                    {program.destination.name}
                  </span>
                )}
              </div>
            )}

            <BookingForm programId={program.id} refCode={ref} />

            {settings.whatsapp && (
              <Button variant="outline" size="lg" className="mt-3 w-full" asChild>
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircleIcon className="size-4" />
                  {ar.detail.contactWhatsapp}
                </a>
              </Button>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{ar.actions.share}:</span>
              <CopyButton
                text={`${appUrl}/programs/${program.slug}${ref ? `?ref=${ref}` : ""}`}
                label="نسخ الرابط"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
