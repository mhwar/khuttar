import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, CalendarRangeIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/auth";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramForm } from "@/components/admin/program-form";
import { Button } from "@/components/ui/button";

export default async function AgentEditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireAgent();
  const { id } = await params;

  const [program, destinations] = await Promise.all([
    db.program.findUnique({ where: { id } }),
    db.destination.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!program || program.ownerAgentId !== profile.id) notFound();

  return (
    <>
      <PageHeader
        title={`تعديل: ${program.title}`}
        actions={
          <div className="flex gap-2">
            {program.category === "TOUR" && (
              <Button variant="outline" asChild>
                <Link href={`/agent/programs/${program.id}/itinerary`}>
                  <CalendarRangeIcon className="size-4" />
                  جدول الرحلة
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/agent/programs">
                <ArrowRightIcon className="size-4" />
                {ar.actions.back}
              </Link>
            </Button>
          </div>
        }
      />
      <ProgramForm
        value={program}
        destinations={destinations}
        isAdmin={false}
        canStudy={profile.allowStudyPrograms}
        backTo="/agent/programs"
      />
    </>
  );
}
