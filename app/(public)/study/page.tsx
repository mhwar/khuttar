import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCapIcon } from "lucide-react";
import { db } from "@/lib/db";
import { publicProgramWhere } from "@/lib/queries";
import { LABELS, STUDY_KINDS } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { EmptyState } from "@/components/shared/misc";
import { ProgramCard } from "@/components/public/cards";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: ar.nav.study,
  description:
    "برامج دراسة اللغة والابتعاث مع خطار: قبولات، سكن، تأشيرات ومتابعة كاملة.",
};

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; ref?: string }>;
}) {
  const { kind, ref } = await searchParams;

  const programs = await db.program.findMany({
    where: {
      ...publicProgramWhere,
      category: "STUDY",
      ...(kind && STUDY_KINDS.includes(kind as never) ? { studyKind: kind } : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: { destination: { select: { name: true } } },
  });

  function chipHref(k: string | null) {
    const params = new URLSearchParams();
    if (k) params.set("kind", k);
    if (ref) params.set("ref", ref);
    return `/study${params.size ? `?${params}` : ""}`;
  }

  return (
    <div>
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-primary to-teal-700 py-20">
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <GraduationCapIcon className="size-8 text-white" />
          </div>
          <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
            {ar.nav.study}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-white/75">
            بخبرتنا في القبولات نسهّل لك الدراسة بالخارج: لغة، جامعات، وابتعاث
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12">
        {/* Chip filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              href={chipHref(null)}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                !kind
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground/70 hover:border-primary/50 hover:text-foreground",
              )}
            >
              {ar.programs.allTypes}
            </Link>
            {STUDY_KINDS.map((k) => (
              <Link
                key={k}
                href={chipHref(k)}
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  kind === k
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground/70 hover:border-primary/50 hover:text-foreground",
                )}
              >
                {LABELS.studyKind[k]}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {kind && (
              <Link
                href={ref ? `/study?ref=${ref}` : "/study"}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {ar.programs.clearFilters}
              </Link>
            )}
            <p className="text-sm text-muted-foreground">
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
    </div>
  );
}
