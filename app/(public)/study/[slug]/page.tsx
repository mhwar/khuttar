import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BuildingIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClipboardListIcon,
  MapPinIcon,
  WalletIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { labelOf } from "@/lib/constants";
import { formatSAR } from "@/lib/format";
import { splitLines } from "@/lib/utils";
import { ar } from "@/lib/i18n/ar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingForm } from "@/components/public/booking-form";

async function loadStudyProgram(slug: string) {
  const program = await db.program.findUnique({
    where: { slug },
    include: { destination: { select: { name: true } } },
  });
  if (
    !program ||
    program.category !== "STUDY" ||
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
  const program = await loadStudyProgram(slug);
  if (!program) return {};
  return {
    title: program.title,
    description: program.summary ?? `برنامج دراسي من خطار: ${program.title}`,
  };
}

export default async function StudyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const program = await loadStudyProgram(slug);
  if (!program) notFound();

  const requirements = splitLines(program.requirements);
  const services = splitLines(program.servicesIncluded);

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
              <Badge variant="secondary">
                {labelOf("studyKind", program.studyKind)}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="grid content-start gap-8 lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {program.institute && (
              <Card>
                <CardContent className="flex items-center gap-3">
                  <BuildingIcon className="size-6 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{ar.fields.institute}</p>
                    <p className="font-bold">{program.institute}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {(program.studyCity || program.destination) && (
              <Card>
                <CardContent className="flex items-center gap-3">
                  <MapPinIcon className="size-6 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{ar.fields.city}</p>
                    <p className="font-bold">
                      {program.studyCity ?? ""}
                      {program.studyCity && program.destination ? "، " : ""}
                      {program.destination?.name ?? ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {program.durationWeeks && (
              <Card>
                <CardContent className="flex items-center gap-3">
                  <CalendarDaysIcon className="size-6 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{ar.fields.duration}</p>
                    <p className="font-bold">
                      {program.durationWeeks} {ar.misc.weeks}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {(program.tuitionMin || program.tuitionMax) && (
              <Card>
                <CardContent className="flex items-center gap-3">
                  <WalletIcon className="size-6 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{ar.fields.tuition}</p>
                    <p className="font-bold">
                      {program.tuitionMin ? formatSAR(program.tuitionMin) : ""}
                      {program.tuitionMin && program.tuitionMax ? " – " : ""}
                      {program.tuitionMax ? formatSAR(program.tuitionMax) : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {program.summary && (
            <p className="text-lg leading-relaxed">{program.summary}</p>
          )}
          {program.description && (
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {program.description}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">خدماتنا في هذا البرنامج</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {services.map((line) => (
                    <p key={line} className="flex items-start gap-2 text-sm">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      {line}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}
            {requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">المتطلبات</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {requirements.map((line) => (
                    <p key={line} className="flex items-start gap-2 text-sm">
                      <ClipboardListIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      {line}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <BookingForm
            programId={program.id}
            refCode={ref}
            title="اطلب الالتحاق بهذا البرنامج"
          />
        </div>
      </div>
    </div>
  );
}
