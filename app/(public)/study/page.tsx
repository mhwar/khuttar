import type { Metadata } from "next";
import { db } from "@/lib/db";
import { publicProgramWhere } from "@/lib/queries";
import { LABELS, STUDY_KINDS } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/shared/native-select";
import { EmptyState } from "@/components/shared/misc";
import { ProgramCard } from "@/components/public/cards";

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

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-extrabold">{ar.nav.study}</h1>
        <p className="text-muted-foreground">
          بخبرتنا في القبولات نسهّل لك الدراسة بالخارج: لغة، جامعات، وابتعاث
        </p>
      </div>

      <form className="flex flex-wrap items-end justify-center gap-3" method="GET">
        {ref && <input type="hidden" name="ref" value={ref} />}
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">{ar.fields.type}</label>
          <NativeSelect name="kind" defaultValue={kind ?? ""} className="w-40">
            <option value="">{ar.misc.all}</option>
            {STUDY_KINDS.map((k) => (
              <option key={k} value={k}>
                {LABELS.studyKind[k]}
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
